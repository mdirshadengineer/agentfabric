import type { JSONSchema } from "../expression/types"

export const registry: Record<string, JSONSchema> = {
	httpRequest: {
		type: "object",
		properties: {
			status: { type: "number" },
			output: {
				type: "object",
				properties: {
					headers: {
						type: "object",
						properties: {
							"content-type": { type: "string" },
							"x-request-id": { type: "string" },
						},
					},
					body: {
						type: "object",
						properties: {
							title: { type: "string" },
							slug: { type: "string" },
							published: { type: "boolean" },
							metrics: {
								type: "object",
								properties: {
									views: { type: "number" },
									conversions: { type: "number" },
								},
							},
						},
					},
				},
			},
		},
	},
	customerLookup: {
		type: "object",
		properties: {
			output: {
				type: "object",
				properties: {
					profile: {
						type: "object",
						properties: {
							id: { type: "string" },
							name: { type: "string" },
							email: { type: "string" },
							isVip: { type: "boolean" },
							lifetimeValue: { type: "number" },
						},
					},
					tags: {
						type: "array",
						items: { type: "string" },
					},
				},
			},
		},
	},
	orderSummary: {
		type: "object",
		properties: {
			output: {
				type: "object",
				properties: {
					orderId: { type: "string" },
					total: { type: "number" },
					currency: { type: "string" },
					items: {
						type: "array",
						items: {
							type: "object",
							properties: {
								sku: { type: "string" },
								name: { type: "string" },
								quantity: { type: "number" },
								price: { type: "number" },
							},
						},
					},
					shipping: {
						type: "object",
						properties: {
							method: { type: "string" },
							etaDays: { type: "number" },
						},
					},
				},
			},
		},
	},
	featureFlags: {
		type: "object",
		properties: {
			output: {
				type: "object",
				properties: {
					enableNewCheckout: { type: "boolean" },
					sendDiscountEmail: { type: "boolean" },
					discountPercent: { type: "number" },
				},
			},
		},
	},
}
