/**
 * Device Manager - Generates and persists a stable device ID
 * Used to track sessions per device for multi-device session governance
 */

const DEVICE_ID_KEY = "agentfabric-device-id"

/**
 * Generate a UUIDv4
 */
function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0
		const v = c === "x" ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}

/**
 * Get or create a stable device ID
 * Persists in localStorage so the same device gets the same ID
 */
export function getOrCreateDeviceId(): string {
	try {
		// Check if deviceId already exists
		const existing = localStorage.getItem(DEVICE_ID_KEY)
		if (
			existing &&
			existing.match(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
			)
		) {
			return existing
		}

		// Generate new deviceId
		const newDeviceId = generateUUID()
		localStorage.setItem(DEVICE_ID_KEY, newDeviceId)
		return newDeviceId
	} catch (error) {
		// Fallback if localStorage is unavailable (SSR, private mode, etc.)
		console.warn("Failed to access localStorage for device ID:", error)
		return generateUUID()
	}
}

/**
 * Get the current device ID without creating one
 */
export function getDeviceId(): string | null {
	try {
		return localStorage.getItem(DEVICE_ID_KEY)
	} catch {
		return null
	}
}

/**
 * Clear the device ID (e.g., on user sign out)
 */
export function clearDeviceId(): void {
	try {
		localStorage.removeItem(DEVICE_ID_KEY)
	} catch (error) {
		console.warn("Failed to clear device ID:", error)
	}
}
