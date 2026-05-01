import type { IMarkdownString } from "monaco-editor"
import type { JSONSchema } from "../expression/types"

function schemaToTypeDefinition(schema: JSONSchema, indent = 0): string {
	const padding = "\t".repeat(indent)
	const childPadding = "\t".repeat(indent + 1)

	if (schema.type === "object") {
		const properties = Object.entries(schema.properties)
			.map(
				([key, value]) =>
					`${childPadding}${JSON.stringify(key)}: ${schemaToTypeDefinition(
						value,
						indent + 1
					)};`
			)
			.join("\n")

		return `{\n${properties}\n${padding}}`
	}

	if (schema.type === "array") {
		const itemType = schemaToTypeDefinition(schema.items, indent)
		return schema.items.type === "object"
			? `Array<${itemType}>`
			: `${itemType}[]`
	}

	if (schema.type === "any") return "unknown"

	return schema.type
}

function getTypeLabel(schema: JSONSchema | null) {
	if (!schema) return "unknown"
	if (schema.type === "array") {
		return `${schema.items.type}[]`
	}

	return schema.type
}

export function buildHoverContent(path: string, schema: JSONSchema | null) {
	const lines: IMarkdownString[] = []
	const name = path.split(".").pop() ?? path

	lines.push({
		value: `**${name}**`,
	})

	if (schema) {
		lines.push({
			value: `Type: \`${getTypeLabel(schema)}\``,
		})

		lines.push({
			value: `**Definition:**\n\`\`\`ts\n${name}: ${schemaToTypeDefinition(
				schema
			)}\n\`\`\``,
		})
	}

	return lines
}
