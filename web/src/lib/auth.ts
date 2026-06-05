import { apiKeyClient } from "@better-auth/api-key/client"
import { createAuthClient } from "better-auth/client"
import { adminClient } from "better-auth/client/plugins"
import { createAuthFetch } from "./auth-fetch-interceptor"
import { clearDeviceId } from "./device-manager"
import { apiBaseURL } from "./env"

export const authBaseURL = apiBaseURL
const baseURL = apiBaseURL

export const authClient = createAuthClient({
	baseURL,
	basePath: "/api/v1/auth",
	plugins: [adminClient(), apiKeyClient()],
	fetchOptions: {
		customFetchImpl: createAuthFetch(baseURL),
	},
})

// Clear device ID on sign out
export async function signOut() {
	try {
		await authClient.signOut()
		clearDeviceId()
	} catch (error) {
		console.error("Sign out error:", error)
		throw error
	}
}
