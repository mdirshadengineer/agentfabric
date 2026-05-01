import {
	createRouter,
	ErrorComponent,
	RouterProvider,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { Swirling } from "@/components/loading-ui/swirling"
import { ThemeProvider } from "@/components/theme-provider"
import { ShadcnProviders } from "@/providers/shadcn-provider"
import { routeTree } from "@/routeTree.gen"

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	// Since we're using React Query, we don't want loader calls to ever be stale
	// This will ensure that the loader is always called when the route is preloaded or visited
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultStaleTime: 5000,
	defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
	defaultPendingComponent: () => <Swirling className="size-24" />,
})

// Register things for typesafety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

export function AppProviders() {
	return (
		<ThemeProvider>
			<ShadcnProviders>
				<RouterProvider router={router} />
				{!import.meta.env.PROD && (
					<TanStackRouterDevtools position="bottom-right" router={router} />
				)}
			</ShadcnProviders>
		</ThemeProvider>
	)
}
