import type { ExecutionContext } from "../expression/types"

export const mockContext: ExecutionContext = {
	steps: {
		httpRequest: {
			status: 200,
			output: {
				headers: {
					"content-type": "application/json",
					"x-request-id": "req_8f3a92",
				},
				body: {
					title: "AgentFabric: Build AI agents faster",
					slug: "agentfabric-build-ai-agents-faster",
					published: true,
					metrics: {
						views: 18420,
						conversions: 612,
					},
				},
			},
		},
		customerLookup: {
			output: {
				profile: {
					id: "cus_1024",
					name: "Maya Chen",
					email: "maya@example.com",
					isVip: true,
					lifetimeValue: 12840.5,
				},
				tags: ["founder", "beta-user", "priority-support"],
			},
		},
		orderSummary: {
			output: {
				orderId: "ord_9001",
				total: 349.97,
				currency: "USD",
				items: [
					{
						sku: "agent-pro-seat",
						name: "AgentFabric Pro Seat",
						quantity: 2,
						price: 149.99,
					},
					{
						sku: "workflow-pack",
						name: "Workflow Template Pack",
						quantity: 1,
						price: 49.99,
					},
				],
				shipping: {
					method: "digital-delivery",
					etaDays: 0,
				},
			},
		},
		featureFlags: {
			output: {
				enableNewCheckout: true,
				sendDiscountEmail: false,
				discountPercent: 15,
			},
		},
	},
}
