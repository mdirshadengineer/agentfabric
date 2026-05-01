import type * as Monaco from "monaco-editor"
import { getSuggestions } from "../expression/autocomplete"
import type { ExecutionContext, JSONSchema } from "../expression/types"
import { buildHoverContent } from "./hover"
import { EXPRESSION_EDITOR_LANGUAGE } from "./monaco-setup"

type ExpressionContext = {
	full: string
	partial: string
	expressionStart: number
	isTemplate: boolean
}

function schemaToType(schema: JSONSchema): string {
	if (schema.type === "object") {
		const properties = Object.entries(schema.properties)
			.map(([key, value]) => `${JSON.stringify(key)}: ${schemaToType(value)};`)
			.join("\n")

		return `{${properties ? `\n${properties}\n` : ""}}`
	}

	if (schema.type === "array") {
		return `${schemaToType(schema.items)}[]`
	}

	if (schema.type === "any") return "unknown"

	return schema.type
}

function registerJavaScriptTypes(
	monaco: typeof import("monaco-editor"),
	registry: Record<string, JSONSchema>
) {
	const stepsType = Object.entries(registry)
		.map(([key, schema]) => `${JSON.stringify(key)}: ${schemaToType(schema)};`)
		.join("\n")

	monaco.typescript.javascriptDefaults.addExtraLib(
		`declare const steps: {${stepsType ? `\n${stepsType}\n` : ""}};`,
		"expression-editor/steps.d.ts"
	)
}

/**
 * Extract expression context inside {{ ... }} or from normal JavaScript paths.
 */
function getExpressionContext(
	model: Monaco.editor.ITextModel,
	position: Monaco.Position
): ExpressionContext | null {
	const text = model.getValue()
	const offset = model.getOffsetAt(position)

	const start = text.lastIndexOf("{{", offset)
	if (start !== -1) {
		const end = text.indexOf("}}", start)
		const safeEnd = end === -1 ? text.length : end
		const expressionStart = start + 2

		if (offset >= expressionStart && offset <= safeEnd) {
			const inside = text.slice(expressionStart, safeEnd)
			const relativeOffset = offset - expressionStart
			const leadingWhitespaceLength = inside.length - inside.trimStart().length

			return {
				full: inside.trim(),
				partial: inside.slice(0, relativeOffset),
				expressionStart: expressionStart + leadingWhitespaceLength,
				isTemplate: true,
			}
		}
	}

	const line = model.getLineContent(position.lineNumber)
	const lineOffset = position.column - 1
	const before = line.slice(0, lineOffset)
	const after = line.slice(lineOffset)
	const beforeMatch = before.match(/[A-Za-z_$][\w$.[\]]*$/)
	const afterMatch = after.match(/^[\w$.[\]]*/)

	if (!beforeMatch) return null

	const partial = beforeMatch[0]
	const suffix = afterMatch?.[0] ?? ""
	const expressionStart = offset - partial.length

	return {
		full: `${partial}${suffix}`,
		partial,
		expressionStart,
		isTemplate: false,
	}
}

export function registerProviders(
	monaco: typeof import("monaco-editor"),
	registry: Record<string, JSONSchema>,
	context: ExecutionContext
) {
	registerJavaScriptTypes(monaco, registry)

	/**
	 * ✅ AUTOCOMPLETE (FINAL FIXED)
	 */
	monaco.languages.registerCompletionItemProvider(EXPRESSION_EDITOR_LANGUAGE, {
		triggerCharacters: [".", "{", "[", " "],

		provideCompletionItems(model, position) {
			const ctx = getExpressionContext(model, position)
			if (!ctx) return { suggestions: [] }

			const isAfterDot = ctx.partial.endsWith(".")

			let partial = ctx.partial
			if (isAfterDot) {
				partial = partial.slice(0, -1)
			}

			const word = model.getWordUntilPosition(position)

			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn:
					word.endColumn < position.column ? position.column : word.endColumn,
			}

			const suggestions = getSuggestions(partial, registry, {
				afterDot: isAfterDot,
			})

			return {
				suggestions: suggestions.map((s) => ({
					label: s,
					kind: monaco.languages.CompletionItemKind.User,
					insertText: s,
					range,
				})),
			}
		},
	})

	/**
	 * ✅ HOVER (TOKEN-AWARE)
	 */
	monaco.languages.registerHoverProvider(EXPRESSION_EDITOR_LANGUAGE, {
		provideHover(model, position) {
			const ctx = getExpressionContext(model, position)
			if (!ctx) return

			const word = model.getWordAtPosition(position)
			if (!word) return

			const segments = ctx.full.split(".").filter(Boolean)

			let currentLength = 0
			let targetIndex = -1
			const offset = model.getOffsetAt(position)

			for (let i = 0; i < segments.length; i++) {
				currentLength += segments[i].length

				if (offset - ctx.expressionStart <= currentLength + i) {
					targetIndex = i
					break
				}

				currentLength += 1
			}

			if (targetIndex === -1) return

			const sliced = segments.slice(0, targetIndex + 1)

			let schema: any = null
			let value: any = context

			for (let i = 0; i < sliced.length; i++) {
				const key = sliced[i]

				if (i === 0 && key === "steps") {
					value = context.steps
					continue
				}

				if (i === 1) {
					schema = registry[key]
					value = value?.[key]
					continue
				}

				if (!schema) break

				if (schema.type === "object") {
					schema = schema.properties?.[key]
					value = value?.[key]
				}

				if (schema?.type === "array") {
					schema = schema.items
					value = value?.[0]
				}
			}

			return {
				contents: buildHoverContent(sliced.join("."), schema, value),
			}
		},
	})
}
