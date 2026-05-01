import type { JSONSchema } from "../expression/types"

export const registry: Record<string, JSONSchema> = {
	httpRequest: {
		type: "object",
		properties: {
			output: {
				type: "object",
				properties: {
					body: {
						type: "object",
						properties: {
							title: { type: "string" },
						},
					},
				},
			},
		},
	},
}
