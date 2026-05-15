import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

type SessionData = {
	id: string;
	expiresAt: Date;
	ipAddress: string | null;
	userAgent: string | null;
	deviceId?: string | null;
};

function toSessionData(value: unknown): SessionData | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as {
		id?: unknown;
		expiresAt?: unknown;
		ipAddress?: unknown;
		userAgent?: unknown;
		deviceId?: unknown;
	};

	if (typeof candidate.id !== "string") {
		return null;
	}

	if (!(candidate.expiresAt instanceof Date)) {
		return null;
	}

	return {
		id: candidate.id,
		expiresAt: candidate.expiresAt,
		ipAddress:
			typeof candidate.ipAddress === "string" ? candidate.ipAddress : null,
		userAgent:
			typeof candidate.userAgent === "string" ? candidate.userAgent : null,
		deviceId:
			typeof candidate.deviceId === "string" ? candidate.deviceId : null,
	};
}

export default fp(async (fastify) => {
	fastify.decorate(
		"authenticate",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const session = await fastify.auth.api.getSession({
					headers: fromNodeHeaders(request.headers),
				});

				if (!session) {
					return reply.code(401).send({
						message: "Unauthorized",
					});
				}

				const sessionData = toSessionData(session.session);
				if (!sessionData) {
					request.log.warn(
						"invalid session payload received from auth provider",
					);
					return reply.code(401).send({
						message: "Unauthorized",
					});
				}

				request.user = {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					emailVerified: session.user.emailVerified,
					image: session.user.image || null,
				};
				request.session = {
					id: sessionData.id,
					expiresAt: sessionData.expiresAt,
					ipAddress: sessionData.ipAddress,
					userAgent: sessionData.userAgent,
					deviceId: sessionData.deviceId || null,
				};
			} catch (error: unknown) {
				request.log.error({ error }, "authentication session lookup failed");
				return reply.code(500).send({
					message: "Authentication service unavailable",
				});
			}
		},
	);
});
