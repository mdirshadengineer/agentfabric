import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { user as userTable } from "../../schema.js";

type SessionData = {
	id: string;
	expiresAt: Date;
	ipAddress: string | null;
	userAgent: string | null;
	deviceId: string | null;
	impersonatedBy: string | null;
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
		impersonatedBy?: unknown;
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
		impersonatedBy:
			typeof candidate.impersonatedBy === "string"
				? candidate.impersonatedBy
				: null,
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

				// Enforce account ban before granting access.
				// Mirrors the admin plugin's session.create.before hook: if the ban
				// expiry has passed, auto-clear the stale ban data from the DB and
				// allow the request; otherwise reject with 403.
				if (session.user.banned) {
					const banExpires = session.user.banExpires;
					if (banExpires && banExpires.getTime() < Date.now()) {
						// Ban expired — clear it so future requests skip this branch.
						await fastify.db
							.update(userTable)
							.set({ banned: false, banReason: null, banExpires: null })
							.where(eq(userTable.id, session.user.id));
					} else {
						request.log.warn(
							{ userId: session.user.id },
							"access attempt by banned user rejected",
						);
						return reply.code(403).send({
							code: "ACCOUNT_BANNED",
							message: session.user.banReason ?? "Account suspended",
						});
					}
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
					role: session.user.role ?? null,
				};
				request.session = {
					id: sessionData.id,
					expiresAt: sessionData.expiresAt,
					ipAddress: sessionData.ipAddress,
					userAgent: sessionData.userAgent,
					deviceId: sessionData.deviceId,
					impersonatedBy: sessionData.impersonatedBy,
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
