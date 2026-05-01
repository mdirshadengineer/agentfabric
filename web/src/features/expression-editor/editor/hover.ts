import type { IMarkdownString } from "monaco-editor"
import type { JSONSchema } from "../expression/types"

export function buildHoverContent(
	path: string,
	schema: JSONSchema | null,
	value: any
) {
	const lines: IMarkdownString[] = []

	// Title
	lines.push({
		value: `**${path.split(".").pop()}**`,
	})

	// Type
	if (schema) {
		lines.push({
			value: `Type: \`${schema.type}\``,
		})
	}

	// Object keys
	if (schema?.type === "object") {
		const keys = Object.keys(schema.properties)
			.map((k) => `- ${k}`)
			.join("\n")

		lines.push({
			value: `**Keys:**\n${keys}`,
		})
	}

	// Preview
	if (value !== undefined) {
		const preview =
			typeof value === "object"
				? JSON.stringify(value, null, 2).slice(0, 200)
				: String(value)

		lines.push({
			value: `**Preview:**\n\`\`\`json\n${preview}\n\`\`\``,
		})
	}

	return lines
}
