import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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

type VerifiedApiKeyPayload = {
	id: string;
	configId: string;
	referenceId: string;
	prefix: string | null;
	expiresAt: Date | null;
	permissions: Record<string, string[]> | null;
};

type VerifyApiKeyResponse = {
	valid: boolean;
	key: unknown;
	error?: {
		code?: string;
		message?: string;
	};
};

const API_KEY_PREFIX_TO_CONFIG_ID: Record<string, string> = {
	pk_: "public",
	sk_: "secret",
};

const FALLBACK_API_KEY_CONFIG_IDS = ["public", "secret"] as const;

function resolveConfigIdsForToken(token: string): string[] {
	const normalizedToken = token.trim();
	if (!normalizedToken) {
		return [...FALLBACK_API_KEY_CONFIG_IDS];
	}

	const inferredConfigIds = Object.entries(API_KEY_PREFIX_TO_CONFIG_ID)
		.filter(([prefix]) => normalizedToken.startsWith(prefix))
		.map(([, configId]) => configId);

	const ordered = [...inferredConfigIds, ...FALLBACK_API_KEY_CONFIG_IDS];
	return Array.from(new Set(ordered));
}

async function verifyApiKeyThroughAuthHandler(
	request: FastifyRequest,
	fastify: FastifyInstance,
	token: string,
): Promise<VerifyApiKeyResponse | null> {
	const verifyApiKey = (
		fastify.auth as unknown as {
			api?: {
				verifyApiKey?: (input: {
					body: {
						key: string;
						configId?: string;
					};
				}) => Promise<VerifyApiKeyResponse>;
			};
		}
	).api?.verifyApiKey;

	if (!verifyApiKey) {
		request.log.error("better auth verifyApiKey API is unavailable");
		return null;
	}

	let lastErrorPayload: VerifyApiKeyResponse | null = null;

	for (const configId of resolveConfigIdsForToken(token)) {
		// Add debug logs to trace token and configId
		request.log.info(
			{
				token,
				configIds: resolveConfigIdsForToken(token),
			},
			"Verifying API key with resolved config IDs",
		);

		try {
			const payload = await verifyApiKey({
				body: {
					key: token,
					configId,
				},
			});

			request.log.info(
				{
					configId,
					payload,
				},
				"Verification result for API key",
			);

			if (payload.valid) {
				return payload;
			}

			lastErrorPayload = payload;
		} catch (error) {
			request.log.error({ error }, "Error verifying API key");
		}
	}

	return lastErrorPayload;
}

function normalizePermissions(value: unknown): Record<string, string[]> | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const result: Record<string, string[]> = {};
	for (const [resource, actions] of Object.entries(value)) {
		if (!Array.isArray(actions)) {
			continue;
		}

		const validActions = actions.filter((action): action is string => {
			return typeof action === "string";
		});

		if (validActions.length > 0) {
			result[resource] = validActions;
		}
	}

	return Object.keys(result).length > 0 ? result : null;
}

function toVerifiedApiKeyPayload(value: unknown): VerifiedApiKeyPayload | null {
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

	const expiresAt = candidate.expiresAt;
	let normalizedExpiresAt: Date | null = null;
	if (typeof expiresAt === "string") {
		const parsedExpiresAt = new Date(expiresAt);
		if (Number.isNaN(parsedExpiresAt.getTime())) {
			return null;
		}
		normalizedExpiresAt = parsedExpiresAt;
	} else if (expiresAt instanceof Date) {
		normalizedExpiresAt = expiresAt;
	} else if (expiresAt !== null && expiresAt !== undefined) {
		return null;
	}

	return {
		id: candidate.id,
		configId: candidate.configId,
		referenceId: candidate.referenceId,
		prefix: typeof candidate.prefix === "string" ? candidate.prefix : null,
		expiresAt: normalizedExpiresAt,
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

				const verificationResult = await verifyApiKeyThroughAuthHandler(
					request,
					fastify,
					token,
				);

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

				const apiKeyContext = toVerifiedApiKeyPayload(verificationResult.key);
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
