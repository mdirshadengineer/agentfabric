import { functionRegistry } from "./functions"
import { parseExpression } from "./parser"
import { resolveExpression } from "./resolver"
import type { ExecutionContext } from "./types"

export function evaluateExpression(
	expr: string,
	context: ExecutionContext
): unknown {
	const ast = parseExpression(expr)

	const node = ast[0]

	if (ast.length === 1 && node.type === "function") {
		const fn = functionRegistry[node.name]
		if (!fn) return undefined

		const args = node.args.map((arg) => resolveExpression(arg, context))

		return fn.execute(args)
	}

	return resolveExpression(ast, context)
}
