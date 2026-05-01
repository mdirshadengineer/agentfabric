type ExpressionFunction = {
	execute: (args: unknown[]) => unknown
}

export const functionRegistry: Record<string, ExpressionFunction> = {
	uppercase: {
		execute: ([v]) => String(v).toUpperCase(),
	},
	default: {
		execute: ([v, f]) => v ?? f,
	},
	sum: {
		execute: ([arr]) =>
			Array.isArray(arr) ? arr.reduce((a, b) => a + b, 0) : 0,
	},
}
