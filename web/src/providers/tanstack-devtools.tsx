import { TanStackDevtools } from "@tanstack/react-devtools"
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { router } from "./tanstack-router"

export function TanStackDevtoolsProvider() {
	return (
		<TanStackDevtools
			config={{
				position: "bottom-right",
				panelLocation: "bottom",
			}}
			plugins={[
				{
					name: "TanStack Query",
					render: <ReactQueryDevtoolsPanel />,
				},
				{
					name: "TanStack Router",
					render: <TanStackRouterDevtoolsPanel router={router} />,
				},
				hotkeysDevtoolsPlugin(),
			]}
		/>
	)
}
