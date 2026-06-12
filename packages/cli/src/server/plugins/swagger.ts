import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";

const documentedRoutePrefixes = ["/api/v1/", "/health", "/metrics"];

function shouldDocumentRoute(url: string): boolean {
	return documentedRoutePrefixes.some((prefix) => {
		if (prefix.endsWith("/")) {
			return url.startsWith(prefix);
		}

		return url === prefix;
	});
}

export default fp(async (fastify) => {
	await fastify.register(swagger, {
		openapi: {
			info: {
				title: "AgentFabric API",
				version: "1.0.0",
			},
		},
		transform: ({ schema, url }) => {
			if (!shouldDocumentRoute(url)) {
				return {
					schema: {
						...schema,
						hide: true,
					},
					url,
				};
			}

			return { schema, url };
		},
	});

	await fastify.register(swaggerUi, {
		routePrefix: "/docs",
	});
});
