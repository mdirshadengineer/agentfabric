import { queryOptions, useQuery } from "@tanstack/react-query"
import { requestManagement } from "@/lib/api/management-client"
import { queryKeys } from "@/lib/api/query-keys"
import type { MeResponse } from "@/lib/api/types"

export async function fetchMe() {
	return requestManagement<MeResponse>("/me")
}

export const meQueryOptions = queryOptions({
	queryKey: queryKeys.management.me(),
	queryFn: fetchMe,
	staleTime: 30_000,
})

export function useMe() {
	return useQuery(meQueryOptions)
}
