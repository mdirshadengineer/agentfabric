import type { AgentFabricSession, AgentFabricUser } from "agentfabric-auth";

declare module "fastify" {
	interface FastifyRequest {
		authSession?: AgentFabricSession;
		authUser?: AgentFabricUser | null;
	}
}
