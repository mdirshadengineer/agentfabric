export function getSuggestions(
	input: string,
	registry: any,
	options: { afterDot?: boolean } = {}
): string[] {
	const { afterDot = false } = options

	const path = input.trim()
	const segments = path.split(".").filter(Boolean)
	const prefix = afterDot ? "" : (segments.at(-1) ?? "")

	function matching(values: string[]) {
		if (!prefix) return values
		return values.filter((value) => value.startsWith(prefix))
	}

	// ROOT
	if (path === "") return ["steps"]

	if (segments.length <= 1 && !afterDot) {
		return matching(["steps"])
	}

	// steps.
	if (path === "steps" && afterDot) {
		return Object.keys(registry)
	}

	let current: any = null
	const lookupSegments = afterDot ? segments : segments.slice(0, -1)

	for (let i = 0; i < lookupSegments.length; i++) {
		const key = lookupSegments[i]

		// steps
		if (i === 0 && key === "steps") continue

		// steps.<node>
		if (i === 1) {
			const node = registry[key]

			if (!node) return []

			current = node

			continue
		}

		if (!current) return []

		if (current.type === "object") {
			current = current.properties?.[key]
		}

		if (current?.type === "array") {
			current = current.items
		}
	}

	if (current?.type === "object") {
		return matching(Object.keys(current.properties || {}))
	}

	return []
}
