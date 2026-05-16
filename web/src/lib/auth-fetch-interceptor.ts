/**
 * Custom fetch interceptor for better-auth client
 * Automatically adds deviceId header to all auth requests
 */

import { getOrCreateDeviceId } from "./device-manager"

/**
 * Create a custom fetch function that adds the x-device-id header
 * @param baseURL - The base URL for the auth service
 * @returns A fetch function that injects the device ID header
 */
export function createAuthFetch(baseURL: string): typeof fetch {
	const authBasePath = "/api/v1/auth"

	return async (
		input: RequestInfo | URL,
		init?: RequestInit
	): Promise<Response> => {
		const requestUrl =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url

		const isAbsoluteAuthRequest = requestUrl.startsWith(baseURL)
		const isRelativeAuthRequest = requestUrl.startsWith(authBasePath)
		const isAuthRequest = isAbsoluteAuthRequest || isRelativeAuthRequest

		// Only add header to auth requests
		if (isAuthRequest) {
			const deviceId = getOrCreateDeviceId()

			const headers = new Headers(init?.headers ?? {})
			headers.set("x-device-id", deviceId)

			return fetch(input, {
				...init,
				headers,
			})
		}

		// Non-auth requests pass through unchanged
		return fetch(input, init)
	}
}
