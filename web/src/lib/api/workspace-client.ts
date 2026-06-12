import { apiBaseURL } from "@/lib/env"

function workspaceHeaders(init: RequestInit): Headers {
	const headers = new Headers(init.headers)
	const hasBody = init.body !== undefined && init.body !== null

	if (hasBody && !headers.has("content-type")) {
		headers.set("content-type", "application/json")
	}

	return headers
}

export async function requestWorkspace<T>(
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const response = await fetch(`${apiBaseURL}/api/v1/workspaces${path}`, {
		credentials: "include",
		...init,
		headers: workspaceHeaders(init),
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
