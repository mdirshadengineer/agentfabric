import { fromNodeHeaders } from "better-auth/node";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../../lib/auth.js";

export default async function (fastify: FastifyInstance) {
	fastify.route({
		method: ["GET", "POST"],
		url: "/*",
		handler: async (request: FastifyRequest, reply: FastifyReply) => {
			const host = request.headers.host ?? "localhost";
			console.log(
				`Handling auth request for ${request.method} ${request.url} from host ${host}`,
			);

			const requestUrl = new URL(request.url, `${request.protocol}://${host}`);
			console.log(`Constructed request URL: ${requestUrl.href}`);

			const headers = fromNodeHeaders(request.headers);
			console.log(
				`Request headers: ${JSON.stringify(Object.fromEntries(headers.entries()))}`,
			);

			const authRequest = new Request(requestUrl, {
				method: request.method,
				headers,
				...(request.body ? { body: JSON.stringify(request.body) } : {}),
			});

			const authResponse = await auth.handler(authRequest);
			console.log(`Auth response status: ${authResponse.status}`);

			reply.status(authResponse.status);

			authResponse.headers.forEach((value, key) => {
				reply.header(key, value);
			});

			const responseBody = Buffer.from(await authResponse.arrayBuffer());

			console.log(`Auth response body length: ${responseBody.length} bytes`);
			console.log(`Auth response body content: ${responseBody.toString()}`);

			if (responseBody.length === 0) {
				return reply.send();
			}

			return reply.send(responseBody);
		},
	});
}
