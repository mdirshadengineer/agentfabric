import {
	IconArrowRight,
	IconBrandGithub,
	IconBrandGoogle,
	IconLock,
	IconMail,
	IconSparkles,
} from "@tabler/icons-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth"

export const Route = createFileRoute("/signin")({
	component: SignInRoute,
})

function SignInRoute() {
	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setIsSubmitting(true)
		setErrorMessage(null)

		try {
			await authClient.signIn.email({
				email: email.trim(),
				password,
			})

			await navigate({ to: "/workspace" })
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Unable to sign in with email and password."
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_8%,rgba(20,184,166,0.2),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.2),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_52%,#f8fafc_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_15%_8%,rgba(20,184,166,0.18),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.14),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1326_58%,#111827_100%)] sm:px-6">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:58px_58px] [mask-image:radial-gradient(circle_at_center,black_45%,transparent_95%)]" />
			<div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6">
				<header className="flex items-center justify-between rounded-3xl border border-white/40 bg-white/65 px-4 py-3 shadow-[0_18px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-slate-900/55">
					<a href="/" className="flex items-center gap-2">
						<div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
							<IconSparkles className="size-4" />
						</div>
						<span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							AgentFabric
						</span>
					</a>
					<a
						href="/signup"
						className="text-sm text-slate-700 underline-offset-4 transition hover:underline dark:text-slate-200"
					>
						Create account
					</a>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
					<Card className="border-white/25 bg-white/72 py-0 shadow-[0_24px_90px_-55px_rgba(15,23,42,0.8)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
						<CardHeader className="pt-6">
							<Badge className="w-fit bg-teal-500/12 text-teal-700 dark:text-teal-200">
								Welcome back
							</Badge>
							<CardTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
								Sign in to continue building
							</CardTitle>
							<CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
								Use your email and password to access your workspaces. OAuth
								buttons are already in place for future Google and GitHub
								integration.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pb-6">
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
											onChange={(event) => setEmail(event.target.value)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="signin-password">Password</Label>
									<div className="relative">
										<IconLock className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
										<Input
											id="signin-password"
											type="password"
											autoComplete="current-password"
											required
											className="pl-8"
											placeholder="Enter your password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
										/>
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
									disabled={isSubmitting}
									className="h-9 w-full"
								>
									{isSubmitting ? "Signing in..." : "Sign in"}
									<IconArrowRight className="size-4" />
								</Button>
							</form>

							<div className="space-y-2">
								<p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
									OAuth coming soon
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start"
									>
										<IconBrandGoogle className="size-4" />
										Continue with Google
									</Button>
									<Button
										type="button"
										variant="outline"
										disabled
										className="h-9 justify-start"
									>
										<IconBrandGithub className="size-4" />
										Continue with GitHub
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/25 bg-slate-950 py-0 text-white shadow-[0_24px_90px_-55px_rgba(15,23,42,0.95)]">
						<CardHeader className="pt-6">
							<CardTitle className="text-2xl text-white">
								Secure access, consistent workflow
							</CardTitle>
							<CardDescription className="text-slate-300">
								Your credentials unlock the same runtime, APIs, and dashboard
								experience used across AgentFabric.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 pb-6 text-sm leading-6 text-slate-200">
							<p>1. Sign in with email and password.</p>
							<p>2. Open and manage workspace flows.</p>
							<p>
								3. Add OAuth providers later without redesigning auth screens.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
