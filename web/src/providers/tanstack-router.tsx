import { QueryClient } from "@tanstack/react-query"
import {
	createRouter,
	ErrorComponent,
	RouterProvider,
} from "@tanstack/react-router"
import { routeTree } from "@/routeTree.gen"

const queryClient = new QueryClient()

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultStaleTime: 5000,
	context: {
		queryClient,
	},
	defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
})

// Register things for typesafety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

export function TanStackRouterProvider() {
	return <RouterProvider router={router} />
}
