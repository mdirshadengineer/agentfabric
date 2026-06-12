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
			tags: [
				{ name: "System", description: "Health checks and observability" },
				{ name: "better-auth", description: "Better Auth endpoints" },
				{
					name: "Current User",
					description: "Current user and session context",
				},
				{ name: "Management", description: "Administrative management APIs" },
				{ name: "Data", description: "API key-protected data access" },
				{
					name: "Workspaces",
					description: "Workspace CRUD and membership management",
				},
			],
		},
		transform: ({ schema, url }) => {
			const routeSchema = schema ?? {};

			if (!shouldDocumentRoute(url)) {
				return {
					schema: {
						...routeSchema,
						hide: true,
					},
					url,
				};
			}

			return { schema: routeSchema, url };
		},
	});

	await fastify.register(swaggerUi, {
		routePrefix: "/docs",
	});
});
