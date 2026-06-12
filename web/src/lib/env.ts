const DEFAULT_API_BASE_URL = "http://localhost:5678"

export const apiBaseURL =
	import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL

/** API origin derived from the current browser location (same host the SPA loaded from). */
export function getBrowserApiBaseUrl(): string {
	if (typeof window === "undefined") {
		return apiBaseURL
	}
	return window.location.origin.replace(/\/$/, "")
}
