import { randomUUID } from "node:crypto";
import { fromNodeHeaders } from "better-auth/node";
import { asc, count, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { roleDefinition, rolePermission, user } from "../../../../schema.js";

type CreateRoleBody = {
	name?: string;
	description?: string;
	permissions?: string[];
};

type UpdateRoleBody = {
	name?: string;
	description?: string | null;
	permissions?: string[];
	replaceInUsers?: boolean;
};

type UpdateUserRoleBody = {
	role?: string;
};

const ROLE_NAME_PATTERN = /^[a-z][a-z0-9_-]{1,31}$/;

function normalizeRoleName(value: string | undefined): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	if (!ROLE_NAME_PATTERN.test(normalized)) {
		return null;
	}

	return normalized;
}

async function ensureAuthenticated(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<boolean> {
	await request.server.authenticate(request, reply);
	return !reply.sent;
}

async function ensureAdmin(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<boolean> {
	if (!(await ensureAuthenticated(request, reply))) {
		return false;
	}

	if (request.user?.role !== "admin") {
		reply.code(403).send({
			code: "ADMIN_ROLE_REQUIRED",
			message: "Only admin users can access this endpoint",
		});
		return false;
	}

	return true;
}

async function setUserRoleWithBetterAuth(
	request: FastifyRequest,
	userId: string,
	role: string,
): Promise<void> {
	await request.server.auth.api.setRole({
		headers: fromNodeHeaders(request.headers),
		body: {
			userId,
			// Better Auth runtime accepts non-default role strings when custom
			// role maps are not configured; current typings are narrower.
			role: role as never,
		},
	});
}

export default async function (fastify: FastifyInstance) {
	fastify.get(
		"/me",
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) {
				return;
			}

			return reply.send({
				user: request.user,
				session: request.session,
				isImpersonating: Boolean(request.session?.impersonatedBy),
			});
		},
	);

	fastify.post(
		"/bootstrap-admin",
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) {
				return;
			}

			if (!request.user) {
				return reply.code(401).send({
					code: "UNAUTHORIZED",
					message: "Login is required",
				});
			}

			const adminCount = await fastify.db
				.select({ count: count() })
				.from(user)
				.where(eq(user.role, "admin"));

			const hasAnyAdmin = (adminCount[0]?.count ?? 0) > 0;
			if (hasAnyAdmin && request.user.role !== "admin") {
				return reply.code(403).send({
					code: "ADMIN_BOOTSTRAP_LOCKED",
					message: "Admin already exists. Ask an existing admin to grant access.",
				});
			}

			await fastify.db
				.update(user)
				.set({ role: "admin" })
				.where(eq(user.id, request.user.id));

			return reply.send({
				message: "Current user promoted to admin",
				userId: request.user.id,
				role: "admin",
			});
		},
	);

	fastify.get(
		"/roles",
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) {
				return;
			}

			const roles = await fastify.db
				.select({
					id: roleDefinition.id,
					name: roleDefinition.name,
					description: roleDefinition.description,
					createdAt: roleDefinition.createdAt,
					updatedAt: roleDefinition.updatedAt,
				})
				.from(roleDefinition)
				.orderBy(asc(roleDefinition.name));

			// Fetch permissions for each role
			const rolesWithPermissions = await Promise.all(
				roles.map(async (role) => {
					const perms = await fastify.db
						.select({ permission: rolePermission.permission })
						.from(rolePermission)
						.where(eq(rolePermission.roleId, role.id));

					return {
						...role,
						permissions: perms.map((p) => p.permission),
					};
				})
			);

			return reply.send({ roles: rolesWithPermissions });
		},
	);

	fastify.post<{ Body: CreateRoleBody }>(
		"/roles",
		async (
			request: FastifyRequest<{ Body: CreateRoleBody }>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAdmin(request, reply))) {
				return;
			}

			const name = normalizeRoleName(request.body?.name);
			if (!name) {
				return reply.code(400).send({
					code: "INVALID_ROLE_NAME",
					message:
						"Role name must match ^[a-z][a-z0-9_-]{1,31}$ (lowercase only)",
				});
			}

			const existing = await fastify.db
				.select({ id: roleDefinition.id })
				.from(roleDefinition)
				.where(eq(roleDefinition.name, name))
				.limit(1);

			if (existing[0]) {
				return reply.code(409).send({
					code: "ROLE_ALREADY_EXISTS",
					message: "Role with this name already exists",
				});
			}

			const roleId = randomUUID();
			const createdRole = {
				id: roleId,
				name,
				description: request.body?.description?.trim() || null,
			};

			await fastify.db.insert(roleDefinition).values(createdRole);

			// Insert permissions if provided
			if (Array.isArray(request.body?.permissions) && request.body.permissions.length > 0) {
				const permissionRecords = request.body.permissions.map((perm) => ({
					id: randomUUID(),
					roleId,
					permission: perm as "manage_users" | "view_audit" | "manage_roles" | "manage_api_keys",
				}));
				await fastify.db.insert(rolePermission).values(permissionRecords);
			}

			return reply.code(201).send({
				role: {
					...createdRole,
					permissions: request.body?.permissions ?? [],
				},
			});
		},
	);

	fastify.patch<{ Params: { roleId: string }; Body: UpdateRoleBody }>(
		"/roles/:roleId",
		async (
			request: FastifyRequest<{
				Params: { roleId: string };
				Body: UpdateRoleBody;
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAdmin(request, reply))) {
				return;
			}

			const { roleId } = request.params;
			const existing = await fastify.db
				.select({
					id: roleDefinition.id,
					name: roleDefinition.name,
				})
				.from(roleDefinition)
				.where(eq(roleDefinition.id, roleId))
				.limit(1);

			const currentRole = existing[0];
			if (!currentRole) {
				return reply.code(404).send({
					code: "ROLE_NOT_FOUND",
					message: "Role not found",
				});
			}

			const hasName = typeof request.body?.name === "string";
			const hasDescription = "description" in (request.body || {});
			const hasPermissions = Array.isArray(request.body?.permissions);
			if (!hasName && !hasDescription && !hasPermissions) {
				return reply.code(400).send({
					code: "EMPTY_UPDATE",
					message: "Provide name, description, and/or permissions to update",
				});
			}

			const nextName = hasName
				? normalizeRoleName(request.body?.name)
				: currentRole.name;

			if (!nextName) {
				return reply.code(400).send({
					code: "INVALID_ROLE_NAME",
					message:
						"Role name must match ^[a-z][a-z0-9_-]{1,31}$ (lowercase only)",
				});
			}

			if (nextName !== currentRole.name) {
				const duplicate = await fastify.db
					.select({ id: roleDefinition.id })
					.from(roleDefinition)
					.where(eq(roleDefinition.name, nextName))
					.limit(1);

				if (duplicate[0] && duplicate[0].id !== roleId) {
					return reply.code(409).send({
						code: "ROLE_ALREADY_EXISTS",
						message: "Role with this name already exists",
					});
				}
			}

			const nextDescription = hasDescription
				? (request.body?.description?.trim() || null)
				: undefined;

			const updateData: any = {
				name: nextName,
			};
			if (hasDescription) updateData.description = nextDescription;

			await fastify.db
				.update(roleDefinition)
				.set(updateData)
				.where(eq(roleDefinition.id, roleId));

			// Update permissions in separate table
			if (hasPermissions) {
				// Delete existing permissions
				await fastify.db
					.delete(rolePermission)
					.where(eq(rolePermission.roleId, roleId));

				// Insert new permissions
				if (request.body.permissions && request.body.permissions.length > 0) {
					const permissionRecords = request.body.permissions.map((perm) => ({
						id: randomUUID(),
						roleId,
						permission: perm as "manage_users" | "view_audit" | "manage_roles" | "manage_api_keys",
					}));
					await fastify.db.insert(rolePermission).values(permissionRecords);
				}
			}

			if (request.body?.replaceInUsers && nextName !== currentRole.name) {
				const usersWithCurrentRole = await fastify.db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.role, currentRole.name));

				for (const matchedUser of usersWithCurrentRole) {
					await setUserRoleWithBetterAuth(request, matchedUser.id, nextName);
				}
			}

			return reply.send({
				message: "Role updated",
				roleId,
				name: nextName,
				description: hasDescription ? nextDescription : undefined,
				permissions: hasPermissions ? (request.body?.permissions ?? []) : undefined,
			});
		},
	);

	fastify.get(
		"/users",
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAdmin(request, reply))) {
				return;
			}

			const users = await fastify.db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				})
				.from(user)
				.orderBy(asc(user.createdAt));

			return reply.send({ users });
		},
	);

	fastify.patch<{ Params: { userId: string }; Body: UpdateUserRoleBody }>(
		"/users/:userId/role",
		async (
			request: FastifyRequest<{
				Params: { userId: string };
				Body: UpdateUserRoleBody;
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAdmin(request, reply))) {
				return;
			}

			const nextRole = normalizeRoleName(request.body?.role);
			if (!nextRole) {
				return reply.code(400).send({
					code: "INVALID_ROLE_NAME",
					message:
						"Role name must match ^[a-z][a-z0-9_-]{1,31}$ (lowercase only)",
				});
			}

			const existingRole = await fastify.db
				.select({ id: roleDefinition.id })
				.from(roleDefinition)
				.where(eq(roleDefinition.name, nextRole))
				.limit(1);
			if (!existingRole[0]) {
				return reply.code(404).send({
					code: "ROLE_NOT_FOUND",
					message: "Role is not registered in role_definition",
				});
			}

			const { userId } = request.params;
			const existingUser = await fastify.db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			if (!existingUser[0]) {
				return reply.code(404).send({
					code: "USER_NOT_FOUND",
					message: "User not found",
				});
			}

			await setUserRoleWithBetterAuth(request, userId, nextRole);

			return reply.send({ message: "User role updated", userId, role: nextRole });
		},
	);
}
