import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {} from "@tanstack/react-query-devtools"

const queryClient = new QueryClient()

export function TanStackQueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}