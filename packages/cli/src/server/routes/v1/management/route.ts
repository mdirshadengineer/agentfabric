import { eq, or, sql } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	canManageUserRoles,
	canUseAdminPlugin,
	hasFullAdminRole,
	hasOperationsAdminRole,
	parseUserRoles,
} from "../../../../lib/admin-access.js";
import { user } from "../../../../schema.js";

async function ensureAuthenticated(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<boolean> {
	await request.server.authenticate(request, reply);
	return !reply.sent;
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

			if (!request.user) {
				return reply.code(401).send({
					code: "UNAUTHORIZED",
					message: "Login is required",
				});
			}

			return reply.send({
				user: request.user,
				session: request.session,
				isImpersonating: Boolean(request.session?.impersonatedBy),
				roles: parseUserRoles(request.user.role),
				isAdmin: hasFullAdminRole(request.user.role),
				isOperationsAdmin: hasOperationsAdminRole(request.user.role),
				canManageRoles: canManageUserRoles(request.user.role),
				canUseAdminPlugin: canUseAdminPlugin(request.user.role),
			});
		},
	);

	fastify.get(
		"/users/lookup",
		{
			schema: {
				tags: ["Management"],
			},
		},
		async (request: FastifyRequest, reply: FastifyReply) => {
			if (!(await ensureAuthenticated(request, reply))) {
				return;
			}

			const query = request.query as { email?: string; search?: string };
			const searchTerm = (query?.email || query?.search || "").trim();

			if (searchTerm.length === 0) {
				return reply.code(400).send({
					code: "INVALID_QUERY",
					message: "email or search query parameter is required",
				});
			}

			const users = await fastify.db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
				})
				.from(user)
				.where(
					or(
						eq(user.email, searchTerm),
						sql`${user.email} ILIKE ${`%${searchTerm}%`}`,
					),
				)
				.limit(10);

			return reply.send({ users });
		},
	);
}
