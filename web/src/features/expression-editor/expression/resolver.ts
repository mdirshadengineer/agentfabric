import type { ASTNode, ExecutionContext } from "./types"

export function resolveExpression(
	ast: ASTNode[],
	context: ExecutionContext
): unknown {
	let current: unknown = context

	for (const node of ast) {
		if (node.type === "root")
			current = (current as Record<string, unknown>)[node.value]
		if (node.type === "property")
			current = (current as Record<string, unknown>)?.[node.key]
		if (node.type === "index")
			current = (current as unknown[] | undefined)?.[node.index]

		if (current === undefined) return undefined
	}

	return current
}
