import {
	IconArrowRight,
	IconEye,
	IconEyeOff,
	IconLock,
	IconMail,
} from "@tabler/icons-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { AuthPageLayout } from "@/features/auth/components/auth-page-layout"
import { useSignIn } from "@/features/auth/queries/mutations"

export const Route = createFileRoute("/signin")({
	component: SignInRoute,
})

function SignInRoute() {
	const navigate = useNavigate()
	const signIn = useSignIn()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		try {
			await signIn.mutateAsync({ email: email.trim(), password })
			await navigate({ to: "/workspace" })
		} catch {
			// Error surfaced from mutation
		}
	}

	const errorMessage =
		signIn.error instanceof Error ? signIn.error.message : null

	return (
		<AuthPageLayout
			gradient="teal"
			headerLinkHref="/signup"
			headerLinkText="Create account"
			badgeText="Welcome back"
			badgeAccent="teal"
			title="Sign in to continue building"
			description="Use your email and password to access your workspaces. OAuth buttons are already in place for future Google and GitHub integration."
			infoTitle="Secure access, consistent workflow"
			infoDescription="Your credentials unlock the same runtime, APIs, and dashboard experience used across AgentFabric."
			infoBullets={[
				"Sign in with email and password.",
				"Open and manage workspace flows.",
				"Add OAuth providers later without redesigning auth screens.",
			]}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="signin-email">Email</Label>
					<div className="relative">
						<IconMail className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signin-email"
							type="email"
							autoComplete="email"
							required
							className="pl-8"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
				</div>
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="signin-password">Password</Label>
						<a
							href="#"
							className="text-xs text-muted-foreground underline-offset-2 hover:underline"
						>
							Forgot password?
						</a>
					</div>
					<div className="relative">
						<IconLock className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signin-password"
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							required
							className="pl-8 pr-10"
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<button
							type="button"
							className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
							onClick={() => setShowPassword((prev) => !prev)}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? (
								<IconEyeOff className="size-4" />
							) : (
								<IconEye className="size-4" />
							)}
						</button>
					</div>
				</div>
				{errorMessage ? (
					<Alert variant="destructive">
						<AlertTitle>Sign in failed</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				) : null}
				<Button
					type="submit"
					disabled={signIn.isPending}
					className="h-9 w-full"
				>
					{signIn.isPending ? (
						<Spinner className="mr-2" aria-hidden="true" />
					) : null}
					{signIn.isPending ? "Signing in..." : "Sign in"}
					{!signIn.isPending ? <IconArrowRight className="size-4" /> : null}
				</Button>
			</form>
		</AuthPageLayout>
	)
}
