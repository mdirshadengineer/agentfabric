import {
	IconArrowRight,
	IconCopy,
	IconKey,
	IconRefresh,
	IconServer2,
	IconShieldCheck,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { authBaseURL, authClient, signOut } from "@/lib/auth"
import { getDeviceId } from "@/lib/device-manager"

// This file defines the main route of the application, which provides an interface
// to interact with the Fastify server's authentication system, including session
// management and API key creation/verification. It uses React state to manage form
// inputs and displays results in a user-friendly way. The UI components are styled
// with Tailwind CSS and custom components from the project's design system.
export const Route = createFileRoute("/test-api-playground")({
	component: RouteComponent,
})

type JsonValue =
	| Record<string, unknown>
	| unknown[]
	| string
	| number
	| boolean
	| null

type ActionState =
	| "idle"
	| "loading-session"
	| "signing-up"
	| "signing-in"
	| "signing-out"
	| "creating-key"
	| "verifying-key"
	| "copying-key"

function stringifyJson(value: unknown): string {
	if (value === undefined) {
		return ""
	}

	return JSON.stringify(value, null, 2)
}

function parseJsonInput(value: string): JsonValue | undefined {
	const trimmed = value.trim()
	if (!trimmed) {
		return undefined
	}

	return JSON.parse(trimmed) as JsonValue
}

function normalizeNumberInput(value: string): number | null {
	const trimmed = value.trim()
	if (!trimmed) {
		return null
	}

	const parsed = Number(trimmed)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error("Expected a positive number")
	}

	return parsed
}

function inferConfigIdFromKey(key: string): "public" | "secret" | undefined {
	const normalizedKey = key.trim()
	if (!normalizedKey) {
		return undefined
	}

	if (normalizedKey.startsWith("sk_")) {
		return "secret"
	}

	if (normalizedKey.startsWith("pk_") || normalizedKey.startsWith("af_")) {
		return "public"
	}

	return undefined
}

function ResultPanel({
	title,
	description,
	result,
	compact = false,
}: {
	title: string
	description: string
	result: unknown
	compact?: boolean
}) {
	return (
		<Card className="border-white/10 bg-white/80 shadow-[0_20px_80px_-30px_rgba(15,23,42,0.25)] backdrop-blur dark:bg-slate-950/70">
			<CardHeader className={compact ? "pb-3" : undefined}>
				<CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-50">
					<IconKey className="size-4 text-teal-600" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<pre className="max-h-105 overflow-auto rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100 dark:border-white/10">
					{stringifyJson(result) || "No result yet."}
				</pre>
			</CardContent>
		</Card>
	)
}

function FieldLabel({ children }: { children: string }) {
	return (
		<label className="text-sm font-medium text-slate-700 dark:text-slate-200">
			{children}
		</label>
	)
}

function RouteComponent() {
	const [actionState, setActionState] = useState<ActionState>("idle")
	const [statusMessage, setStatusMessage] = useState<string>(
		"Ready to talk to your Fastify server."
	)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [sessionData, setSessionData] = useState<unknown>(null)
	const [apiKeyResult, setApiKeyResult] = useState<unknown>(null)
	const [verificationResult, setVerificationResult] = useState<unknown>(null)
	const [copied, setCopied] = useState(false)

	const [fullName, setFullName] = useState("Md Irshad")
	const [email, setEmail] = useState("mdirshadengineer@gmail.com")
	const [password, setPassword] = useState("Developer@123")
	const [apiKeyName, setApiKeyName] = useState("agentfabric-web")
	const [configId, setConfigId] = useState("")
	const [prefix, setPrefix] = useState("af_")
	const [expiresInSeconds, setExpiresInSeconds] = useState("86400")
	const [metadataJson, setMetadataJson] = useState(
		'{"source":"web-dashboard","project":"agentfabric"}'
	)
	const [permissionsJson, setPermissionsJson] = useState("")
	const [apiKeyToVerify, setApiKeyToVerify] = useState("")

	useEffect(() => {
		setDeviceId(getDeviceId())
		void refreshSession()
	}, [])

	async function refreshSession() {
		setActionState("loading-session")
		setErrorMessage(null)
		try {
			const currentSession = await authClient.getSession()
			setSessionData(currentSession)
			setStatusMessage(
				currentSession ? "Session is active." : "No active session."
			)
		} catch (error) {
			setSessionData(null)
			setErrorMessage(
				error instanceof Error ? error.message : "Failed to load session"
			)
			setStatusMessage("Unable to load the current session.")
		} finally {
			setActionState("idle")
		}
	}

	async function handleSignUp() {
		setActionState("signing-up")
		setErrorMessage(null)
		try {
			const session = await authClient.signUp.email({
				name: fullName,
				email,
				password,
			})
			setSessionData(session)
			setStatusMessage("Signed up and authenticated.")
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Sign up failed")
		} finally {
			setActionState("idle")
		}
	}

	async function handleSignIn() {
		setActionState("signing-in")
		setErrorMessage(null)
		try {
			const session = await authClient.signIn.email({
				email,
				password,
			})
			setSessionData(session)
			setStatusMessage("Signed in successfully.")
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Sign in failed")
		} finally {
			setActionState("idle")
		}
	}

	async function handleSignOut() {
		setActionState("signing-out")
		setErrorMessage(null)
		try {
			await signOut()
			setSessionData(null)
			setApiKeyResult(null)
			setVerificationResult(null)
			setApiKeyToVerify("")
			setStatusMessage("Signed out and cleared the device id.")
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Sign out failed"
			)
		} finally {
			setActionState("idle")
		}
	}

	async function handleCreateApiKey() {
		setActionState("creating-key")
		setErrorMessage(null)
		try {
			const parsedMetadata = parseJsonInput(metadataJson)
			const normalizedExpiresIn = normalizeNumberInput(expiresInSeconds)
			const selectedConfigId = configId.trim() || "public"
			const metadataAllowed = selectedConfigId === "secret"

			const createdApiKey = await authClient.apiKey.create({
				configId: selectedConfigId,
				name: apiKeyName.trim() || undefined,
				prefix: prefix.trim() || undefined,
				expiresIn: normalizedExpiresIn ?? undefined,
				metadata: metadataAllowed ? parsedMetadata : undefined,
			})

			setApiKeyResult(createdApiKey)
			setApiKeyToVerify(
				typeof createdApiKey === "object" &&
					createdApiKey !== null &&
					"key" in createdApiKey
					? String((createdApiKey as { key?: string }).key ?? "")
					: ""
			)
			setVerificationResult(null)
			setStatusMessage("API key created successfully.")
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Failed to create API key"
			)
		} finally {
			setActionState("idle")
		}
	}

	async function handleVerifyApiKey() {
		setActionState("verifying-key")
		setErrorMessage(null)
		try {
			const parsedPermissions = parseJsonInput(permissionsJson)
			const normalizedKey = apiKeyToVerify.trim()
			const configuredConfigId = configId.trim()
			const inferredConfigId = inferConfigIdFromKey(normalizedKey)
			const resolvedConfigId = configuredConfigId || inferredConfigId

			if (!normalizedKey) {
				throw new Error("API key is required")
			}

			const response = await fetch(
				`${authBaseURL}/api/v1/auth/api-key/verify`,
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						configId: resolvedConfigId,
						key: normalizedKey,
						permissions:
							parsedPermissions &&
							typeof parsedPermissions === "object" &&
							!Array.isArray(parsedPermissions)
								? (parsedPermissions as Record<string, string[]>)
								: undefined,
					}),
				}
			)

			const verification = await response.json()
			setVerificationResult(verification)
			setStatusMessage(
				response.ok
					? `API key verification completed${resolvedConfigId ? ` for ${resolvedConfigId} config` : ""}.`
					: "API key verification returned an error."
			)
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Failed to verify API key"
			)
		} finally {
			setActionState("idle")
		}
	}

	async function handleCopyKey() {
		if (!apiKeyToVerify.trim()) {
			setErrorMessage("Create or paste an API key first.")
			return
		}

		setActionState("copying-key")
		setErrorMessage(null)
		try {
			await navigator.clipboard.writeText(apiKeyToVerify.trim())
			setCopied(true)
			setStatusMessage("API key copied to clipboard.")
			window.setTimeout(() => setCopied(false), 1500)
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Copy failed")
		} finally {
			setActionState("idle")
		}
	}

	const isBusy = actionState !== "idle"

	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_45%,#f8fafc_100%)] px-4 py-8 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)] dark:text-slate-50 sm:px-6 lg:px-10">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<section className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_120px_-40px_rgba(15,23,42,0.8)] sm:px-8 lg:px-10">
					<div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),transparent_32%,rgba(56,189,248,0.12)_68%,transparent)]" />
					<div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
					<div className="absolute bottom-0 left-16 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
					<div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-3xl space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge
									variant="secondary"
									className="bg-white/10 text-white hover:bg-white/15"
								>
									Fastify server
								</Badge>
								<Badge
									variant="secondary"
									className="bg-white/10 text-white hover:bg-white/15"
								>
									Better Auth
								</Badge>
								<Badge
									variant="secondary"
									className="bg-white/10 text-white hover:bg-white/15"
								>
									API key plugin
								</Badge>
							</div>
							<h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
								Create, verify, and inspect API keys against your Fastify
								backend.
							</h1>
							<p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
								Use this page to sign in, create an API key from the Better Auth
								API-key plugin, then verify the key through the same auth server
								to confirm the setup is working.
							</p>
						</div>
						<div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
									<IconServer2 className="size-5" />
								</div>
								<div>
									<p className="text-sm font-medium">Server target</p>
									<p className="text-sm text-slate-300">{authBaseURL}</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
									<IconShieldCheck className="size-5" />
								</div>
								<div>
									<p className="text-sm font-medium">Current state</p>
									<p className="text-sm text-slate-300">{statusMessage}</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{errorMessage ? (
					<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
						{errorMessage}
					</div>
				) : null}

				<div className="grid gap-6 lg:grid-cols-[1.05fr_1.1fr]">
					<Card className="border-white/10 bg-white/85 shadow-[0_20px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-950/75">
						<CardHeader className="space-y-2">
							<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
								<IconShieldCheck className="size-5 text-emerald-600" />
								Authentication
							</CardTitle>
							<CardDescription>
								Sign in first, then create the API key while the session is
								active.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<FieldLabel>Full name</FieldLabel>
									<Input
										value={fullName}
										onChange={(event) => setFullName(event.target.value)}
										placeholder="Your display name"
									/>
								</div>
								<div className="space-y-2">
									<FieldLabel>Email</FieldLabel>
									<Input
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										type="email"
										placeholder="you@example.com"
									/>
								</div>
								<div className="space-y-2 sm:col-span-2">
									<FieldLabel>Password</FieldLabel>
									<Input
										value={password}
										onChange={(event) => setPassword(event.target.value)}
										type="password"
										placeholder="Enter your password"
									/>
								</div>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button onClick={handleSignUp} disabled={isBusy}>
									Sign up
								</Button>
								<Button
									variant="outline"
									onClick={handleSignIn}
									disabled={isBusy}
								>
									Sign in
								</Button>
								<Button
									variant="secondary"
									onClick={refreshSession}
									disabled={isBusy}
								>
									<IconRefresh className="size-4" />
									Refresh session
								</Button>
								<Button
									variant="ghost"
									onClick={handleSignOut}
									disabled={isBusy}
								>
									Sign out
								</Button>
							</div>

							<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
								<div className="mb-3 flex flex-wrap items-center gap-2">
									<Badge
										variant={sessionData ? "default" : "outline"}
										className={
											sessionData ? "bg-emerald-600 text-white" : undefined
										}
									>
										{sessionData ? "Session active" : "No session"}
									</Badge>
									<Badge variant="outline">
										Device ID: {deviceId ?? "not initialized"}
									</Badge>
								</div>
								<pre className="max-h-56 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-slate-950 px-4 py-3 text-xs text-slate-100">
									{stringifyJson(sessionData) || "No session loaded yet."}
								</pre>
							</div>
						</CardContent>
					</Card>

					<Card className="border-white/10 bg-white/85 shadow-[0_20px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-950/75">
						<CardHeader className="space-y-2">
							<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
								<IconKey className="size-5 text-teal-600" />
								API key lab
							</CardTitle>
							<CardDescription>
								Create an API key, store the secret, and verify it against the
								Fastify auth route.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<FieldLabel>Key name</FieldLabel>
									<Input
										value={apiKeyName}
										onChange={(event) => setApiKeyName(event.target.value)}
										placeholder="agentfabric-web"
									/>
								</div>
								<div className="space-y-2">
									<FieldLabel>Config ID</FieldLabel>
									<Input
										value={configId}
										onChange={(event) => setConfigId(event.target.value)}
										placeholder="optional: public or secret"
									/>
									<p className="text-xs text-slate-500 dark:text-slate-400">
										Leave blank to auto-detect when verifying (sk_ = secret,
										pk_/af_ = public).
									</p>
								</div>
								<div className="space-y-2">
									<FieldLabel>Prefix</FieldLabel>
									<Input
										value={prefix}
										onChange={(event) => setPrefix(event.target.value)}
										placeholder="af_"
									/>
								</div>
								<div className="space-y-2">
									<FieldLabel>Expires in seconds</FieldLabel>
									<Input
										value={expiresInSeconds}
										onChange={(event) =>
											setExpiresInSeconds(event.target.value)
										}
										inputMode="numeric"
										placeholder="86400"
									/>
								</div>
								<div className="space-y-2">
									<FieldLabel>Key to verify</FieldLabel>
									<Input
										value={apiKeyToVerify}
										onChange={(event) => setApiKeyToVerify(event.target.value)}
										placeholder="Paste the key or create one below"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<FieldLabel>Metadata JSON</FieldLabel>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Metadata is applied only when Config ID is secret.
								</p>
								<Textarea
									value={metadataJson}
									onChange={(event) => setMetadataJson(event.target.value)}
									rows={4}
									spellCheck={false}
								/>
							</div>

							<div className="space-y-2">
								<FieldLabel>Permissions JSON</FieldLabel>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									Optional. Leave empty unless you need to enforce permission
									checks during verification.
								</p>
								<Textarea
									value={permissionsJson}
									onChange={(event) => setPermissionsJson(event.target.value)}
									rows={4}
									placeholder='{"agents":["read"]}'
									spellCheck={false}
								/>
							</div>

							<div className="flex flex-wrap gap-2">
								<Button
									onClick={handleCreateApiKey}
									disabled={isBusy || !sessionData}
								>
									Create API key
								</Button>
								<Button
									variant="outline"
									onClick={handleVerifyApiKey}
									disabled={isBusy || !apiKeyToVerify.trim()}
								>
									Verify key
									<IconArrowRight className="size-4" />
								</Button>
								<Button
									variant="secondary"
									onClick={handleCopyKey}
									disabled={isBusy || !apiKeyToVerify.trim()}
								>
									<IconCopy className="size-4" />
									{copied ? "Copied" : "Copy key"}
								</Button>
							</div>

							<div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
								<div className="flex flex-wrap items-center gap-2">
									<Badge
										variant={apiKeyResult ? "default" : "outline"}
										className={
											apiKeyResult ? "bg-teal-600 text-white" : undefined
										}
									>
										{apiKeyResult ? "Key created" : "No key created"}
									</Badge>
									<Badge
										variant={verificationResult ? "default" : "outline"}
										className={
											verificationResult ? "bg-cyan-600 text-white" : undefined
										}
									>
										Verification ready
									</Badge>
								</div>
								<pre className="max-h-56 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl bg-slate-950 px-4 py-3 text-xs text-slate-100">
									{stringifyJson(apiKeyResult) || "No API key result yet."}
								</pre>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
					<ResultPanel
						title="Verification response"
						description="This is the direct response from /api/v1/auth/api-key/verify."
						result={verificationResult}
					/>

					<Card className="border-white/10 bg-white/85 shadow-[0_20px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:bg-slate-950/75">
						<CardHeader>
							<CardTitle className="text-slate-900 dark:text-slate-50">
								How to use this page
							</CardTitle>
							<CardDescription>
								The buttons exercise the same auth stack your Fastify server
								exposes.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
							<p>1. Sign in so the Better Auth session exists.</p>
							<p>2. Create an API key with the plugin-backed endpoint.</p>
							<p>
								3. Verify the key to confirm the Fastify auth route accepts it.
							</p>
							<p>
								4. Copy the generated key into your agent or service
								configuration.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
