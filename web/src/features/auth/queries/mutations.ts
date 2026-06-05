import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { authClient, signOut } from "@/lib/auth"

export function useSignIn() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: { email: string; password: string }) => {
			const { data, error } = await authClient.signIn.email({
				email: input.email,
				password: input.password,
			})

			if (error) {
				throw new Error(
					error.message || "Unable to sign in with email and password."
				)
			}

			return data
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.auth.session(),
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.management.me(),
			})
		},
	})
}

export function useSignUp() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: {
			name: string
			email: string
			password: string
		}) => {
			const { data, error } = await authClient.signUp.email({
				name: input.name,
				email: input.email,
				password: input.password,
			})

			if (error) {
				throw new Error(
					error.message ||
						"Unable to create an account with email and password."
				)
			}

			return data
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.auth.session(),
			})
			await queryClient.invalidateQueries({
				queryKey: queryKeys.management.me(),
			})
		},
	})
}

export function useSignOut() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: signOut,
		onSuccess: async () => {
			queryClient.removeQueries({ queryKey: queryKeys.auth.session() })
			queryClient.removeQueries({ queryKey: queryKeys.management.me() })
		},
	})
}
