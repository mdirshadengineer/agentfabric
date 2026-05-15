import { createAuthClient } from "better-auth/client"

// TODO: Move the baseURL and basePath to an environment variable
export const authClient = createAuthClient({
	baseURL: "http://localhost:3000",
	basePath: "/api/v1/auth",
})
