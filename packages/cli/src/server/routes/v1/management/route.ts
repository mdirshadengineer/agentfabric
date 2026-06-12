import { fromNodeHeaders } from "better-auth/node";
import { asc, count, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { user } from "../../../../schema.js";

type UpdateUserRoleBody = {
	role?: string;
};

const SUPPORTED_ROLES = ["admin", "user"] as const;
type SupportedRole = (typeof SUPPORTED_ROLES)[number];

function normalizeRoleName(value: string | undefined): SupportedRole | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	if (!SUPPORTED_ROLES.includes(normalized as SupportedRole)) {
		return null;
	}

	return normalized as SupportedRole;
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
		{
			schema: {
				tags: ["Current User"],
			},
		},
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
		{
			schema: {
				tags: ["Management"],
			},
		},
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
					message:
						"Admin already exists. Ask an existing admin to grant access.",
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
		"/users",
		{
			schema: {
				tags: ["Management"],
			},
		},
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
		{
			schema: {
				tags: ["Management"],
			},
		},
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
					message: "Role must be one of: admin, user",
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

			return reply.send({
				message: "User role updated",
				userId,
				role: nextRole,
			});
		},
	);
}
