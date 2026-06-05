import { apiBaseURL } from "@/lib/env"

export async function requestManagement<T>(
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const response = await fetch(`${apiBaseURL}/api/v1/management${path}`, {
		credentials: "include",
		headers: {
			"content-type": "application/json",
			...(init.headers ?? {}),
		},
		...init,
	})

	const payload = (await response.json().catch(() => ({}))) as {
		message?: string
		code?: string
	}

	if (!response.ok) {
		throw new Error(
			payload.message ||
				payload.code ||
				`Request failed with ${response.status}`
		)
	}

	return payload as T
}
