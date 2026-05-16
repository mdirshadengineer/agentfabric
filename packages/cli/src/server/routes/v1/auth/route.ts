import { fromNodeHeaders } from "better-auth/node";
import { desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type AuthSessionPolicyConfig,
	extractDeviceIdFromPayload,
	extractEmailFromPayload,
	getAuthSessionPolicyConfig,
	isEmailSignInPath,
} from "../../../../lib/auth-session-policy.js";
import { session, user } from "../../../../schema.js";

const DEVICE_ID_HEADER = "x-device-id";
const API_KEY_VERIFY_PATH_SUFFIX = "/api-key/verify";

type VerifyApiKeyResponse = {
	valid: boolean;
	key: unknown;
	error?: {
		code?: string;
		message?: string;
	};
};

async function handleApiKeyVerifyCompatibilityRoute(
	fastify: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply,
	requestUrl: URL,
): Promise<boolean> {
	if (
		request.method !== "POST" ||
		!requestUrl.pathname.endsWith(API_KEY_VERIFY_PATH_SUFFIX)
	) {
		return false;
	}

	const verifyApiKey = (
		fastify.auth as unknown as {
			api?: {
				verifyApiKey?: (input: {
					body: {
						key: string;
						configId?: string;
						permissions?: Record<string, string[]>;
					};
				}) => Promise<VerifyApiKeyResponse>;
			};
		}
	).api?.verifyApiKey;

	if (!verifyApiKey) {
		return reply.code(500).send({
			code: "AUTH_API_UNAVAILABLE",
			message: "API key verification service is unavailable",
		});
	}

	const body =
		request.body && typeof request.body === "object"
			? (request.body as {
					key?: unknown;
					configId?: unknown;
					permissions?: unknown;
				})
			: null;

	if (!body || typeof body.key !== "string" || body.key.trim().length === 0) {
		return reply.code(400).send({
			code: "INVALID_REQUEST_BODY",
			message: "key is required",
		});
	}

	const requestBody: {
		key: string;
		configId?: string;
		permissions?: Record<string, string[]>;
	} = {
		key: body.key.trim(),
	};

	if (typeof body.configId === "string" && body.configId.trim().length > 0) {
		requestBody.configId = body.configId.trim();
	}

	if (body.permissions && typeof body.permissions === "object") {
		requestBody.permissions = body.permissions as Record<string, string[]>;
	}

	// Add debug logs to trace API key verification
	request.log.info(
		{
			body: request.body,
			headers: request.headers,
		},
		"Incoming request for API key verification",
	);

	const verificationResult = await verifyApiKey({ body: requestBody });

	request.log.info(
		{
			requestBody,
			verificationResult,
		},
		"API key verification result",
	);

	return reply.code(200).send(verificationResult);
}

async function resolveUserIdByEmail(
	fastify: FastifyInstance,
	email: string,
): Promise<string | null> {
	const rows = await fastify.db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);

	return rows[0]?.id ?? null;
}

type SessionSnapshot = {
	id: string;
	createdAt: Date;
	ipAddress: string | null;
	deviceId: string | null;
};

type SessionGovernanceMetrics = {
	totalCount: number;
	sameDeviceCount: number;
	sameIpCount: number;
};

async function getUserSessionSnapshots(
	fastify: FastifyInstance,
	userId: string,
): Promise<SessionSnapshot[]> {
	const rows = await fastify.db
		.select({
			id: session.id,
			createdAt: session.createdAt,
			ipAddress: session.ipAddress,
			deviceId: session.deviceId,
		})
		.from(session)
		.where(eq(session.userId, userId))
		.orderBy(desc(session.createdAt), desc(session.id));

	return rows;
}

function normalizeDeviceId(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

function normalizeIpAddress(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

function getGovernanceMetrics(
	sessions: SessionSnapshot[],
	deviceId: string | null,
	ipAddress: string | null,
): SessionGovernanceMetrics {
	let sameDeviceCount = 0;
	let sameIpCount = 0;

	for (const currentSession of sessions) {
		if (deviceId && currentSession.deviceId === deviceId) {
			sameDeviceCount += 1;
		}

		if (ipAddress) {
			const sessionIp = normalizeIpAddress(currentSession.ipAddress);
			if (sessionIp && sessionIp === ipAddress) {
				sameIpCount += 1;
			}
		}
	}

	return {
		totalCount: sessions.length,
		sameDeviceCount,
		sameIpCount,
	};
}

function getRequestedDeviceId(request: FastifyRequest): string | null {
	const fromHeader = request.headers[DEVICE_ID_HEADER];
	const headerValue = Array.isArray(fromHeader) ? fromHeader[0] : fromHeader;
	if (typeof headerValue === "string") {
		const normalized = normalizeDeviceId(headerValue);
		if (normalized) {
			return normalized;
		}
	}

	return normalizeDeviceId(extractDeviceIdFromPayload(request.body));
}

async function pruneByDeviceLimit(
	fastify: FastifyInstance,
	userId: string,
	deviceId: string,
	limit: number,
): Promise<number> {
	const sessions = await getUserSessionSnapshots(fastify, userId);
	const matchingSessions = sessions.filter((currentSession) => {
		return currentSession.deviceId === deviceId;
	});

	if (matchingSessions.length <= limit) {
		return 0;
	}

	const staleSessionIds = matchingSessions.slice(limit).map((row) => row.id);
	await fastify.db.delete(session).where(inArray(session.id, staleSessionIds));
	return staleSessionIds.length;
}

async function pruneByIpLimit(
	fastify: FastifyInstance,
	userId: string,
	ipAddress: string,
	limit: number,
): Promise<number> {
	const sessions = await getUserSessionSnapshots(fastify, userId);
	const matchingSessions = sessions.filter((currentSession) => {
		const sessionIp = normalizeIpAddress(currentSession.ipAddress);
		return sessionIp === ipAddress;
	});

	if (matchingSessions.length <= limit) {
		return 0;
	}

	const staleSessionIds = matchingSessions.slice(limit).map((row) => row.id);
	await fastify.db.delete(session).where(inArray(session.id, staleSessionIds));
	return staleSessionIds.length;
}

async function pruneSessionsToLimit(
	fastify: FastifyInstance,
	userId: string,
	keepCount: number,
): Promise<number> {
	const rows = await fastify.db
		.select({ id: session.id })
		.from(session)
		.where(eq(session.userId, userId))
		.orderBy(desc(session.createdAt), desc(session.id));

	if (rows.length <= keepCount) {
		return 0;
	}

	const staleSessionIds = rows.slice(keepCount).map((row) => row.id);
	await fastify.db.delete(session).where(inArray(session.id, staleSessionIds));

	return staleSessionIds.length;
}

function getKeepCount(policy: AuthSessionPolicyConfig): number {
	if (policy.mode === "keep-latest") {
		return 1;
	}

	return policy.maxSessions;
}

export default async function (fastify: FastifyInstance) {
	const sessionPolicy = getAuthSessionPolicyConfig();

	fastify.route({
		method: ["GET", "POST"],
		url: "/*",
		// Auth endpoints are exempt from the global rate limit; apply a tighter
		// per-IP limit to guard against brute-force attacks.
		config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			const host = request.headers.host ?? "localhost";
			const requestUrl = new URL(request.url, `${request.protocol}://${host}`);

			const handledCompatibilityRoute =
				await handleApiKeyVerifyCompatibilityRoute(
					fastify,
					request,
					reply,
					requestUrl,
				);
			if (handledCompatibilityRoute) {
				return;
			}

			const isEmailSignInRequest = isEmailSignInPath(requestUrl.pathname);
			const signInEmail = isEmailSignInRequest
				? extractEmailFromPayload(request.body)
				: null;
			const deviceId = normalizeDeviceId(getRequestedDeviceId(request));
			const ipAddress = normalizeIpAddress(request.ip);

			if (
				isEmailSignInRequest &&
				signInEmail &&
				sessionPolicy.mode === "block-new-login"
			) {
				const userId = await resolveUserIdByEmail(fastify, signInEmail);
				if (userId) {
					const currentSessions = await getUserSessionSnapshots(
						fastify,
						userId,
					);
					const metrics = getGovernanceMetrics(
						currentSessions,
						deviceId,
						ipAddress,
					);

					if (
						deviceId &&
						metrics.sameDeviceCount >= sessionPolicy.maxSessionsPerDevice
					) {
						request.log.warn(
							{
								userId,
								deviceId,
								sameDeviceCount: metrics.sameDeviceCount,
								maxSessionsPerDevice: sessionPolicy.maxSessionsPerDevice,
							},
							"auth sign-in blocked by device session limit",
						);

						return reply.code(409).send({
							code: "DEVICE_SESSION_LIMIT_REACHED",
							message:
								"Maximum active sessions reached for this device. Sign out from this device and try again.",
						});
					}

					if (
						ipAddress &&
						metrics.sameIpCount >= sessionPolicy.maxSessionsPerIp
					) {
						request.log.warn(
							{
								userId,
								ipAddress,
								sameIpCount: metrics.sameIpCount,
								maxSessionsPerIp: sessionPolicy.maxSessionsPerIp,
							},
							"auth sign-in blocked by IP session limit",
						);

						return reply.code(409).send({
							code: "IP_SESSION_LIMIT_REACHED",
							message:
								"Maximum active sessions reached for this IP address. Sign out from another session and try again.",
						});
					}

					if (
						metrics.totalCount >= sessionPolicy.maxSessions &&
						metrics.sameDeviceCount === 0 &&
						metrics.sameIpCount === 0
					) {
						request.log.warn(
							{
								userId,
								sessionCount: metrics.totalCount,
								maxSessions: sessionPolicy.maxSessions,
								deviceId,
								ipAddress,
							},
							"auth sign-in blocked by session policy",
						);

						return reply.code(409).send({
							code: "SESSION_LIMIT_REACHED",
							message:
								"Maximum active sessions reached. Sign out from another device and try again.",
						});
					}
				}
			}

			request.log.debug(
				{ method: request.method, url: requestUrl.href },
				"auth handler invoked",
			);

			const authHeaders = fromNodeHeaders(request.headers);
			if (ipAddress) {
				authHeaders.set("x-forwarded-for", ipAddress);
			}

			if (deviceId) {
				authHeaders.set(DEVICE_ID_HEADER, deviceId);
			}

			const authRequest = new Request(requestUrl, {
				method: request.method,
				headers: authHeaders,
				...(request.body ? { body: JSON.stringify(request.body) } : {}),
			});

			const authResponse = await fastify.auth.handler(authRequest);

			if (
				isEmailSignInRequest &&
				authResponse.ok &&
				signInEmail &&
				sessionPolicy.mode !== "block-new-login"
			) {
				const userId = await resolveUserIdByEmail(fastify, signInEmail);
				if (userId) {
					if (deviceId) {
						const prunedByDevice = await pruneByDeviceLimit(
							fastify,
							userId,
							deviceId,
							sessionPolicy.maxSessionsPerDevice,
						);

						if (prunedByDevice > 0) {
							request.log.info(
								{
									userId,
									deviceId,
									prunedByDevice,
									maxSessionsPerDevice: sessionPolicy.maxSessionsPerDevice,
								},
								"auth session policy pruned device sessions",
							);
						}
					}

					if (ipAddress) {
						const prunedByIp = await pruneByIpLimit(
							fastify,
							userId,
							ipAddress,
							sessionPolicy.maxSessionsPerIp,
						);

						if (prunedByIp > 0) {
							request.log.info(
								{
									userId,
									ipAddress,
									prunedByIp,
									maxSessionsPerIp: sessionPolicy.maxSessionsPerIp,
								},
								"auth session policy pruned IP sessions",
							);
						}
					}

					const keepCount = getKeepCount(sessionPolicy);
					const revokedCount = await pruneSessionsToLimit(
						fastify,
						userId,
						keepCount,
					);

					if (revokedCount > 0) {
						request.log.info(
							{
								userId,
								revokedCount,
								mode: sessionPolicy.mode,
								keepCount,
								deviceId,
								ipAddress,
							},
							"auth session policy pruned older sessions",
						);
					}

					if (deviceId) {
						const newSessions = await fastify.db
							.select({ id: session.id })
							.from(session)
							.where(eq(session.userId, userId))
							.orderBy(desc(session.createdAt))
							.limit(1);

						if (newSessions[0]) {
							await fastify.db
								.update(session)
								.set({ deviceId })
								.where(eq(session.id, newSessions[0].id));

							request.log.debug(
								{ userId, newSessionId: newSessions[0].id, deviceId },
								"auth session tagged with device id",
							);
						}
					}
				}
			}

			// reply.status(authResponse.status);
			authResponse.headers.forEach((value, key) => {
				reply.header(key, value);
			});

			const responseBody = Buffer.from(await authResponse.arrayBuffer());
			request.log.debug(
				{ status: authResponse.status, bytes: responseBody.length },
				"auth response",
			);

			return reply.status(authResponse.status).send(responseBody);
		},
	});
}
