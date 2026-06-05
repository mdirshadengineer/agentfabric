const DEFAULT_API_BASE_URL = "http://localhost:5678"

export const apiBaseURL =
	import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
