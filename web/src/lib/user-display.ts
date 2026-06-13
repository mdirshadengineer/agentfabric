export function getUserInitials(name?: string | null): string {
	if (!name) {
		return "?"
	}

	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

export function getUserFirstName(name?: string | null): string {
	if (!name) {
		return "there"
	}

	return name.split(" ")[0] ?? name
}
