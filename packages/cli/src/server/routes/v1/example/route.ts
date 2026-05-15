import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default async function (fastify: FastifyInstance) {
	fastify.get(
		"/me",
		{ preHandler: [fastify.authenticate] },
		async (request: FastifyRequest, reply: FastifyReply) => {
			// request.user is guaranteed to be set by the authenticate preHandler
			return reply.send({ user: request.user, session: request.session });
		},
	);
}
