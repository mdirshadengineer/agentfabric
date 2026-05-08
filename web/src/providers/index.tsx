import {
	createRouter,
	ErrorComponent,
	RouterProvider,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { ThemeProvider } from "@/components/theme-provider"
import { ShadcnProviders } from "@/providers/shadcn-provider"
import { routeTree } from "@/routeTree.gen"

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	scrollRestoration: true,
	defaultStaleTime: 5000,
	defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />
})

// Register things for typesafety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

export function AppProviders() {
	return (
		<ThemeProvider defaultTheme="system">
			<ShadcnProviders>
				<RouterProvider router={router} />
				{import.meta.env.DEV && (
					<TanStackRouterDevtools position="bottom-right" router={router} />
				)}
			</ShadcnProviders>
		</ThemeProvider>
	)
}
