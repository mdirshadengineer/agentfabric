import { fromNodeHeaders } from "better-auth/node";
import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { workspace_member } from "../../../../schema.js";

async function ensureAuthenticated(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<boolean> {
	await request.server.authenticate(request, reply);
	return !reply.sent;
}

async function getMemberId(
	workspaceId: string,
	userId: string,
	fastify: FastifyInstance,
): Promise<string | null> {
	const rows = await fastify.db
		.select({ id: workspace_member.id })
		.from(workspace_member)
		.where(
			and(
				eq(workspace_member.organizationId, workspaceId),
				eq(workspace_member.userId, userId),
			),
		)
		.limit(1);
	return rows[0]?.id ?? null;
}

function handleBetterAuthError(error: unknown, reply: FastifyReply) {
	const e = error as {
		statusCode?: number;
		code?: string;
		message?: string;
	};
	return reply.code(e.statusCode || 500).send({
		code: e.code || "INTERNAL_ERROR",
		message: e.message || "An unexpected error occurred",
	});
}

export default async function (fastify: FastifyInstance) {
	fastify.get(
		"/",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			try {
				const result = await request.server.auth.api.listOrganizations({
					headers: fromNodeHeaders(request.headers),
				});
				return reply.send({ workspaces: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.post(
		"/",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			const body = request.body as {
				name?: string;
				slug?: string;
				metadata?: Record<string, unknown>;
			};

			if (
				!body?.name ||
				typeof body.name !== "string" ||
				body.name.trim().length === 0
			) {
				return reply.code(400).send({
					code: "INVALID_NAME",
					message: "Workspace name is required",
				});
			}

			try {
				const result = await request.server.auth.api.createOrganization({
					headers: fromNodeHeaders(request.headers),
					body: {
						name: body.name.trim(),
						slug:
							body.slug?.trim() ??
							body.name.trim().toLowerCase().replace(/\s+/g, "-"),
						...(body.metadata ? { metadata: body.metadata } : {}),
					},
				});
				return reply.code(201).send({ workspace: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.get(
		"/:workspaceId",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{ Params: { workspaceId: string } }>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			try {
				const result = await request.server.auth.api.getFullOrganization({
					headers: fromNodeHeaders(request.headers),
					query: { organizationId: request.params.workspaceId },
				});
				return reply.send({ workspace: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.patch(
		"/:workspaceId",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{
				Params: { workspaceId: string };
				Body: { name?: string; metadata?: Record<string, unknown> };
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			try {
				const result = await request.server.auth.api.updateOrganization({
					headers: fromNodeHeaders(request.headers),
					body: {
						organizationId: request.params.workspaceId,
						data: {
							...(request.body?.name ? { name: request.body.name } : {}),
							...(request.body?.metadata
								? { metadata: request.body.metadata }
								: {}),
						},
					},
				});
				return reply.send({ workspace: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.delete(
		"/:workspaceId",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{ Params: { workspaceId: string } }>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			try {
				await request.server.auth.api.deleteOrganization({
					headers: fromNodeHeaders(request.headers),
					body: { organizationId: request.params.workspaceId },
				});
				return reply.code(204).send();
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.get(
		"/:workspaceId/members",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{ Params: { workspaceId: string } }>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			try {
				const result = await request.server.auth.api.getFullOrganization({
					headers: fromNodeHeaders(request.headers),
					query: { organizationId: request.params.workspaceId },
				});
				return reply.send({
					members: (result as { members?: unknown }).members ?? [],
				});
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.post(
		"/:workspaceId/members",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{
				Params: { workspaceId: string };
				Body: { userId: string; role?: string };
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			if (!request.body?.userId) {
				return reply.code(400).send({
					code: "INVALID_REQUEST",
					message: "userId is required",
				});
			}

			try {
				const result = await request.server.auth.api.addMember({
					headers: fromNodeHeaders(request.headers),
					body: {
						userId: request.body.userId,
						role: (request.body.role ?? "member") as
							| "member"
							| "admin"
							| "owner",
						organizationId: request.params.workspaceId,
					},
				});
				return reply.code(201).send({ member: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.delete(
		"/:workspaceId/members/:userId",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{
				Params: { workspaceId: string; userId: string };
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			const memberId = await getMemberId(
				request.params.workspaceId,
				request.params.userId,
				fastify,
			);
			if (!memberId) {
				return reply.code(404).send({
					code: "MEMBER_NOT_FOUND",
					message: "Member not found in this workspace",
				});
			}

			try {
				await request.server.auth.api.removeMember({
					headers: fromNodeHeaders(request.headers),
					body: {
						memberIdOrEmail: memberId,
						organizationId: request.params.workspaceId,
					},
				});
				return reply.code(204).send();
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);

	fastify.patch(
		"/:workspaceId/members/:userId/role",
		{
			schema: { tags: ["Workspaces"] },
		},
		async (
			request: FastifyRequest<{
				Params: { workspaceId: string; userId: string };
				Body: { role: string };
			}>,
			reply: FastifyReply,
		) => {
			if (!(await ensureAuthenticated(request, reply))) return;

			if (!request.body?.role) {
				return reply.code(400).send({
					code: "INVALID_REQUEST",
					message: "role is required",
				});
			}

			const memberId = await getMemberId(
				request.params.workspaceId,
				request.params.userId,
				fastify,
			);
			if (!memberId) {
				return reply.code(404).send({
					code: "MEMBER_NOT_FOUND",
					message: "Member not found in this workspace",
				});
			}

			try {
				const result = await request.server.auth.api.updateMemberRole({
					headers: fromNodeHeaders(request.headers),
					body: {
						memberId,
						role: request.body.role as "member" | "admin" | "owner",
						organizationId: request.params.workspaceId,
					},
				});
				return reply.send({ member: result });
			} catch (error) {
				return handleBetterAuthError(error, reply);
			}
		},
	);
}
