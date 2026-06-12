import { useMutation, useQueryClient } from "@tanstack/react-query"
import type {
	AddMemberInput,
	CreateWorkspaceInput,
	UpdateWorkspaceInput,
	Workspace,
	WorkspaceMember,
} from "@/features/workspace/types"
import { queryKeys } from "@/lib/api/query-keys"
import { requestWorkspace } from "@/lib/api/workspace-client"

export function useCreateWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: CreateWorkspaceInput) => {
			const data = await requestWorkspace<{ workspace: Workspace }>("/", {
				method: "POST",
				body: JSON.stringify(input),
			})
			return data.workspace
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.list(),
			})
		},
	})
}

export function useUpdateWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			id,
			...input
		}: UpdateWorkspaceInput & { id: string }) => {
			const data = await requestWorkspace<{ workspace: Workspace }>(`/${id}`, {
				method: "PATCH",
				body: JSON.stringify(input),
			})
			return data.workspace
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.list(),
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.detail(variables.id),
			})
		},
	})
}

export function useDeleteWorkspace() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id: string) => {
			await requestWorkspace(`/${id}`, { method: "DELETE" })
		},
		onSuccess: async (_data, id) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.list(),
			})
			queryClient.removeQueries({
				queryKey: queryKeys.workspaces.detail(id),
			})
			queryClient.removeQueries({
				queryKey: queryKeys.workspaces.members(id),
			})
		},
	})
}

export function useAddWorkspaceMember() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			workspaceId,
			...input
		}: AddMemberInput & { workspaceId: string }) => {
			const data = await requestWorkspace<{ member: WorkspaceMember }>(
				`/${workspaceId}/members`,
				{
					method: "POST",
					body: JSON.stringify(input),
				}
			)
			return data.member
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.members(variables.workspaceId),
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.detail(variables.workspaceId),
			})
		},
	})
}

export function useRemoveWorkspaceMember() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			workspaceId,
			userId,
		}: {
			workspaceId: string
			userId: string
		}) => {
			await requestWorkspace(`/${workspaceId}/members/${userId}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.members(variables.workspaceId),
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.detail(variables.workspaceId),
			})
		},
	})
}

export function useUpdateMemberRole() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			workspaceId,
			userId,
			role,
		}: {
			workspaceId: string
			userId: string
			role: string
		}) => {
			const data = await requestWorkspace<{ member: WorkspaceMember }>(
				`/${workspaceId}/members/${userId}/role`,
				{
					method: "PATCH",
					body: JSON.stringify({ role }),
				}
			)
			return data.member
		},
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaces.members(variables.workspaceId),
			})
		},
	})
}
