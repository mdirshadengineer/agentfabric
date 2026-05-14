import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../lib/auth.js";

export async function resolveAuthSession(request: FastifyRequest) {
	return auth.api.getSession({
		headers: fromNodeHeaders(request.headers),
	});
}

export async function attachAuthSession(
	request: FastifyRequest,
): Promise<void> {
	const session = await resolveAuthSession(request);
	request.authSession = session;
	request.authUser = session?.user ?? null;
}

export async function requireAuth(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	await attachAuthSession(request);

	if (!request.authSession) {
		return reply.code(401).send({ error: "Unauthorized" });
	}
}
