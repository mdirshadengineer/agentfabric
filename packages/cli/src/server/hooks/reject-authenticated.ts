import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
	fastify.decorate(
		"rejectAuthenticated",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const session = await fastify.auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (session) {
					return reply.code(200).send({
						message: "Already authenticated",
					});
				}
			} catch (error: unknown) {
				request.log.error({ error }, "authenticated-session probe failed");
				return reply.code(500).send({
					message: "Authentication service unavailable",
				});
			}
		},
	);
});
