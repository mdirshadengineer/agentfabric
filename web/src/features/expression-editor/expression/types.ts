export type ASTNode =
	| { type: "root"; value: "steps" }
	| { type: "property"; key: string }
	| { type: "index"; index: number }
	| { type: "function"; name: string; args: ASTNode[][] }
	| { type: "literal"; value: string | number | boolean | null }

export type ExecutionContext = {
	steps: Record<string, { output: unknown; status?: number }>
}

export type JSONSchema =
	| { type: "object"; properties: Record<string, JSONSchema> }
	| { type: "array"; items: JSONSchema }
	| { type: "string" | "number" | "boolean" | "any" }
