import { QueryClientProvider } from "@tanstack/react-query"
import {} from "@tanstack/react-query-devtools"
import { queryClient } from "@/lib/api/query-client"

export function TanStackQueryProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)
}
