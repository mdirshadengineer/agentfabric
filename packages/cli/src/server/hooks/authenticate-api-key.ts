import type { ApiKey } from "@better-auth/api-key";
import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { inferApiKeyConfigIdFromKey } from "../../lib/api-key-config.js";

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

function normalizePermissions(
	value: ApiKey["permissions"],
): Record<string, string[]> | null {
	if (!value) {
		return null;
	}

	const normalized: Record<string, string[]> = {};
	for (const [resource, actions] of Object.entries(value)) {
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
	key: Omit<ApiKey, "key">,
): NonNullable<FastifyRequest["apiKey"]> {
	return {
		id: key.id,
		configId: key.configId,
		referenceId: key.referenceId,
		prefix: key.prefix,
		expiresAt: key.expiresAt,
		permissions: normalizePermissions(key.permissions),
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
						configId: inferApiKeyConfigIdFromKey(token) ?? undefined,
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

				request.apiKey = toRequestApiKey(verificationResult.key);
			} catch (error: unknown) {
				request.log.error({ error }, "api key authentication failed");
				return reply.code(500).send({
					message: "Authentication service unavailable",
				});
			}
		},
	);
});
