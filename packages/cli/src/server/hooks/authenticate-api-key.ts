import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

function getBearerToken(
	authorizationHeader: string | undefined,
): string | null {
	if (!authorizationHeader) {
		return null;
	}

	const [scheme, token] = authorizationHeader.split(" ");
	if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
		return null;
	}

	const normalizedToken = token.trim();
	return normalizedToken.length > 0 ? normalizedToken : null;
}

function normalizePermissions(value: unknown): Record<string, string[]> | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const normalized: Record<string, string[]> = {};
	for (const [resource, actions] of Object.entries(value)) {
		if (!Array.isArray(actions)) {
			continue;
		}

		const validActions = actions.filter((action): action is string => {
			return typeof action === "string";
		});

		if (validActions.length > 0) {
			normalized[resource] = validActions;
		}
	}

	return Object.keys(normalized).length > 0 ? normalized : null;
}

function toRequestApiKey(
	value: unknown,
): NonNullable<FastifyRequest["apiKey"]> | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as {
		id?: unknown;
		configId?: unknown;
		referenceId?: unknown;
		prefix?: unknown;
		expiresAt?: unknown;
		permissions?: unknown;
	};

	if (
		typeof candidate.id !== "string" ||
		typeof candidate.configId !== "string" ||
		typeof candidate.referenceId !== "string"
	) {
		return null;
	}

	const expiresAtRaw = candidate.expiresAt;
	let expiresAt: Date | null = null;
	if (expiresAtRaw === null || expiresAtRaw === undefined) {
		expiresAt = null;
	} else if (expiresAtRaw instanceof Date) {
		expiresAt = expiresAtRaw;
	} else if (typeof expiresAtRaw === "string") {
		const parsed = new Date(expiresAtRaw);
		if (Number.isNaN(parsed.getTime())) {
			return null;
		}
		expiresAt = parsed;
	} else {
		return null;
	}

	return {
		id: candidate.id,
		configId: candidate.configId,
		referenceId: candidate.referenceId,
		prefix: typeof candidate.prefix === "string" ? candidate.prefix : null,
		expiresAt,
		permissions: normalizePermissions(candidate.permissions),
	};
}

export default fp(async (fastify) => {
	fastify.decorate(
		"authenticateApiKey",
		async (request: FastifyRequest, reply: FastifyReply) => {
			try {
				const authorizationHeader = request.headers.authorization;
				const token = getBearerToken(authorizationHeader);

				if (!token) {
					return reply.code(401).send({
						code: "UNAUTHORIZED",
						message: "Missing or invalid Authorization header",
					});
				}

				const verificationResult = await fastify.auth.api.verifyApiKey({
					body: {
						key: token,
					},
				});

				if (!verificationResult?.valid || !verificationResult.key) {
					request.log.warn(
						{
							code: verificationResult?.error?.code ?? "INVALID_API_KEY",
							path: request.url,
						},
						"api key verification failed",
					);

					return reply.code(401).send({
						code: "UNAUTHORIZED",
						message: "Invalid API key",
					});
				}

				const apiKeyContext = toRequestApiKey(verificationResult.key);
				if (!apiKeyContext) {
					request.log.warn("api key payload missing required properties");
					return reply.code(401).send({
						code: "UNAUTHORIZED",
						message: "Invalid API key",
					});
				}

				if (apiKeyContext.expiresAt && apiKeyContext.expiresAt <= new Date()) {
					return reply.code(401).send({
						code: "UNAUTHORIZED",
						message: "API key has expired",
					});
				}

				request.apiKey = apiKeyContext;
			} catch (error: unknown) {
				request.log.error({ error }, "api key authentication failed");
				return reply.code(500).send({
					message: "Authentication service unavailable",
				});
			}
		},
	);
});
