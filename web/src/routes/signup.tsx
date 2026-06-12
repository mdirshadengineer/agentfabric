import {
	IconArrowRight,
	IconEye,
	IconEyeOff,
	IconLock,
	IconMail,
	IconUser,
} from "@tabler/icons-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { type FormEvent, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { AuthPageLayout } from "@/features/auth/components/auth-page-layout"
import { PasswordStrength } from "@/features/auth/components/password-strength"
import { useSignUp } from "@/features/auth/queries/mutations"

export const Route = createFileRoute("/signup")({
	component: SignUpRoute,
})

function SignUpRoute() {
	const navigate = useNavigate()
	const signUp = useSignUp()
	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [fieldError, setFieldError] = useState<string | null>(null)

	function validate(): boolean {
		if (password.length < 8) {
			setFieldError("Password must be at least 8 characters")
			return false
		}
		if (password !== confirmPassword) {
			setFieldError("Passwords do not match")
			return false
		}
		setFieldError(null)
		return true
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!validate()) return

		try {
			await signUp.mutateAsync({
				name: fullName.trim(),
				email: email.trim(),
				password,
			})
			await navigate({ to: "/workspace" })
		} catch {
			// Error surfaced from mutation
		}
	}

	const displayError =
		fieldError ?? (signUp.error instanceof Error ? signUp.error.message : null)

	return (
		<AuthPageLayout
			gradient="emerald"
			headerLinkHref="/signin"
			headerLinkText="Already have an account?"
			badgeText="Create your account"
			badgeAccent="emerald"
			title="Sign up with email and password"
			description="Get started with secure credentials now. Google and GitHub buttons are included and ready for OAuth wiring in a later phase."
			infoTitle="Start with credentials, evolve to OAuth"
			infoDescription="The auth surface is prepared for provider expansion while your current flow remains email/password first."
			infoBullets={[
				"Register with name, email, and password.",
				"Land directly in workspace after successful sign up.",
				"Enable Google/GitHub OAuth later without replacing this page.",
			]}
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="signup-name">Full name</Label>
					<div className="relative">
						<IconUser className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signup-name"
							type="text"
							autoComplete="name"
							required
							className="pl-8"
							placeholder="Jane Doe"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
						/>
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="signup-email">Email</Label>
					<div className="relative">
						<IconMail className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signup-email"
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
					<Label htmlFor="signup-password">Password</Label>
					<div className="relative">
						<IconLock className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signup-password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							className="pl-8 pr-10"
							placeholder="Create a password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value)
								setFieldError(null)
							}}
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
				<PasswordStrength password={password} />
				<div className="space-y-2">
					<Label htmlFor="signup-confirm-password">Confirm password</Label>
					<div className="relative">
						<IconLock className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-slate-400" />
						<Input
							id="signup-confirm-password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							className="pl-8"
							placeholder="Confirm your password"
							value={confirmPassword}
							onChange={(e) => {
								setConfirmPassword(e.target.value)
								setFieldError(null)
							}}
						/>
					</div>
				</div>
				{displayError ? (
					<Alert variant="destructive">
						<AlertTitle>Sign up failed</AlertTitle>
						<AlertDescription>{displayError}</AlertDescription>
					</Alert>
				) : null}
				<Button
					type="submit"
					disabled={signUp.isPending}
					className="h-9 w-full"
				>
					{signUp.isPending ? (
						<Spinner className="mr-2" aria-hidden="true" />
					) : null}
					{signUp.isPending ? "Creating account..." : "Create account"}
					{!signUp.isPending ? <IconArrowRight className="size-4" /> : null}
				</Button>
			</form>
		</AuthPageLayout>
	)
}
