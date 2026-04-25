import { createAPIServer } from "../server/api-server.js";
import { AgentFabricRuntime } from "./agentfabric-runtime.js";

const runtime = new AgentFabricRuntime();

runtime.register(createAPIServer());

// future:
// runtime.register(createScheduler());
// runtime.register(createWorker());

export { runtime };
