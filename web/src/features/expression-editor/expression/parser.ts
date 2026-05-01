import type { ASTNode } from "./types"

export function parseExpression(expr: string): ASTNode[] {
	const clean = expr.replace(/{{|}}/g, "").trim()

	if (clean.includes("(")) {
		return [parseFunction(clean)]
	}

	return parsePath(clean)
}

function parsePath(input: string): ASTNode[] {
	const tokens: ASTNode[] = []
	let buffer = ""

	for (let i = 0; i < input.length; i++) {
		const char = input[i]

		if (char === ".") {
			if (buffer) {
				tokens.push(token(buffer))
				buffer = ""
			}
			continue
		}

		if (char === "[") {
			if (buffer) {
				tokens.push(token(buffer))
				buffer = ""
			}

			const end = input.indexOf("]", i)
			const rawAccessor = input.slice(i + 1, end).trim()
			const numericIndex = Number(rawAccessor)

			if (Number.isInteger(numericIndex)) {
				tokens.push({ type: "index", index: numericIndex })
			} else {
				tokens.push(token(unquoteAccessor(rawAccessor)))
			}

			i = end
			continue
		}

		buffer += char
	}

	if (buffer) tokens.push(token(buffer))

	return tokens
}

function unquoteAccessor(value: string) {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1)
	}

	return value
}

function token(str: string): ASTNode {
	if (str === "steps") return { type: "root", value: "steps" }
	return { type: "property", key: str }
}

function parseFunction(input: string): ASTNode {
	const name = input.slice(0, input.indexOf("(")).trim()
	const argsStr = input.slice(input.indexOf("(") + 1, input.lastIndexOf(")"))

	const args = splitArgs(argsStr).map((a) => parseExpression(`{{ ${a} }}`))

	return { type: "function", name, args }
}

function splitArgs(str: string): string[] {
	const result: string[] = []
	let depth = 0
	let current = ""

	for (const char of str) {
		if (char === "," && depth === 0) {
			result.push(current.trim())
			current = ""
			continue
		}

		if (char === "(") depth++
		if (char === ")") depth--

		current += char
	}

	if (current) result.push(current.trim())

	return result
}
