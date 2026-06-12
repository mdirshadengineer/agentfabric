import { apiKeyClient } from "@better-auth/api-key/client"
import { createAuthClient } from "better-auth/client"
import {
	adminClient,
	anonymousClient,
	organizationClient,
	usernameClient,
} from "better-auth/client/plugins"
import {
	ADMIN_APP_ROLES,
	type AdminAppRole,
	ac,
	adminPluginRoles,
} from "./admin-permissions"
import { createAuthFetch } from "./auth-fetch-interceptor"
import { clearDeviceId } from "./device-manager"
import { apiBaseURL } from "./env"

export {
	canManageUserRoles,
	canUseAdminPlugin,
	hasFullAdminRole,
	hasFullAdminRole as hasAdminRole,
	hasOperationsAdminRole,
	parseUserRoles,
} from "./admin-access"
export { ADMIN_APP_ROLES, type AdminAppRole }

export const authBaseURL = apiBaseURL
const baseURL = apiBaseURL

export const authClient = createAuthClient({
	baseURL,
	basePath: "/api/v1/auth",
	plugins: [
		usernameClient(),
		anonymousClient(),
		adminClient({ ac, roles: adminPluginRoles }),
		apiKeyClient(),
		organizationClient(),
	],
	fetchOptions: {
		customFetchImpl: createAuthFetch(baseURL),
	},
})

type AuthClientError = { message?: string } | null | undefined

function throwAuthClientError(error: AuthClientError, fallback: string): void {
	if (error) {
		throw new Error(error.message ?? fallback)
	}
}

export type AdminUserListItem = {
	id: string
	name: string
	email: string
	role?: string | null
	createdAt?: string | Date
	updatedAt?: string | Date
}

export type AdminListUsersResult = {
	users: AdminUserListItem[]
	total: number
	limit?: number
	offset?: number
}

export async function listAdminUsers(options?: {
	limit?: number
	offset?: number
}): Promise<AdminListUsersResult> {
	const result = await authClient.admin.listUsers({
		query: {
			limit: options?.limit ?? 100,
			offset: options?.offset ?? 0,
		},
	})
	throwAuthClientError(result.error, "Failed to list users")
	if (!result.data) {
		throw new Error("Failed to list users")
	}
	return result.data as AdminListUsersResult
}

export async function setAdminUserRole(userId: string, role: AdminAppRole) {
	const result = await authClient.admin.setRole({ userId, role })
	throwAuthClientError(result.error, "Failed to set user role")
	return result.data
}

export async function impersonateAdminUser(userId: string) {
	const result = await authClient.admin.impersonateUser({ userId })
	throwAuthClientError(result.error, "Failed to impersonate user")
	return result.data
}

export async function stopAdminImpersonation() {
	const result = await authClient.admin.stopImpersonating()
	throwAuthClientError(result.error, "Failed to stop impersonation")
	return result.data
}

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
