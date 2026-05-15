import fp from "fastify-plugin";
import { db, postgresClient } from "../../db/index.js";

export default fp(async (fastify) => {
	fastify.decorate("db", db);

	// Drain the connection pool when the server shuts down so the process
	// exits cleanly without waiting for idle-timeout.
	fastify.addHook("onClose", async () => {
		await postgresClient.end();
	});
});
