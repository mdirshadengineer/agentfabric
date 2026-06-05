import { queryOptions, useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { authClient } from "@/lib/auth"

export async function fetchSession() {
	const { data, error } = await authClient.getSession()

	if (error) {
		throw new Error(error.message || "Unable to fetch session")
	}

	return data
}

export const sessionQueryOptions = queryOptions({
	queryKey: queryKeys.auth.session(),
	queryFn: fetchSession,
	staleTime: 30_000,
})

export function useSession() {
	return useQuery(sessionQueryOptions)
}
