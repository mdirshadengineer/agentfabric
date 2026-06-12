import { queryOptions } from "@tanstack/react-query"
import { requestManagement } from "@/lib/api/management-client"

async function searchUsers(search: string) {
	const params = new URLSearchParams({ email: search })
	const data = await requestManagement<{
		users: { id: string; name: string; email: string }[]
	}>(`/users/lookup?${params}`)
	return data.users
}

export const userSearchQueryOptions = (search: string) =>
	queryOptions({
		queryKey: ["users", "search", search] as const,
		queryFn: () => searchUsers(search),
		staleTime: 10_000,
		enabled: search.length >= 2,
	})
