import type { ExecutionContext } from "../expression/types"

export const mockContext: ExecutionContext = {
	steps: {
		httpRequest: {
			output: {
				body: {
					title: "AgentFabric: Build AI agents faster",
				},
			},
		},
	},
}
