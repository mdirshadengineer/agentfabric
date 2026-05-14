import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../../lib/auth.js";

export default async function (fastify: FastifyInstance) {
	fastify.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});
		if (!session) {
			return reply.status(401).send({ error: "Unauthorized" });
		}

		return reply.send({ session });
	});
}
