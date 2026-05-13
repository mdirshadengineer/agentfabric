import { ThemeProvider } from "@/components/theme-provider"
import { ShadcnProviders } from "@/providers/shadcn-provider"
import { TanStackDevtoolsProvider } from "./tanstack-devtools"
import { TanStackQueryProvider } from "./tanstack-query"
import { TanStackRouterProvider } from "./tanstack-router"

export function AppProviders() {
	return (
		<ThemeProvider defaultTheme="system">
			<ShadcnProviders>
				<TanStackQueryProvider>
					<TanStackRouterProvider />
					<TanStackDevtoolsProvider />
				</TanStackQueryProvider>
			</ShadcnProviders>
		</ThemeProvider>
	)
}
