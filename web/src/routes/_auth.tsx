import { IconSparkles } from "@tabler/icons-react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { sessionQueryOptions } from "@/features/auth/queries/session"

const AuthPending = () => (
	<div className="flex min-h-svh items-center justify-center bg-background">
		<div className="flex flex-col items-center gap-4">
			<div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-500 text-white">
				<IconSparkles className="size-6 animate-pulse" />
			</div>
			<div className="space-y-2 text-center">
				<p className="text-sm font-medium text-muted-foreground">
					Verifying session…
				</p>
				<Skeleton className="h-1 w-32 rounded-full" />
			</div>
		</div>
	</div>
)

const AuthError = () => (
	<div className="flex min-h-svh items-center justify-center bg-background p-4">
		<div className="flex flex-col items-center gap-4 text-center max-w-sm">
			<p className="text-sm font-semibold text-destructive">
				Unable to verify session
			</p>
			<p className="text-xs text-muted-foreground">
				Something went wrong while checking your login. Please try signing in
				again.
			</p>
			<a
				href="/signin"
				className="text-sm underline underline-offset-4 text-primary hover:text-primary/80"
			>
				Go to sign in
			</a>
		</div>
	</div>
)

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context, location }) => {
		const session =
			await context.queryClient.ensureQueryData(sessionQueryOptions)

		if (!session?.session) {
			throw redirect({
				to: "/signin",
				search: { redirect: location.href },
			})
		}
	},
	pendingComponent: AuthPending,
	errorComponent: AuthError,
	component: RouteComponent,
})

function RouteComponent() {
	return <Outlet />
}
