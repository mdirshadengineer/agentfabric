import {
	IconArrowRight,
	IconChevronDown,
	IconCopy,
	IconInfoCircle,
	IconKey,
	IconLock,
	IconMask,
	IconRefresh,
	IconShieldCheck,
} from "@tabler/icons-react"
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type } from "arktype"
import { type ReactNode, useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DevFieldLabel } from "@/features/dev/components/dev-field-label"
import { DevJsonBlock } from "@/features/dev/components/dev-json-block"
import { DevPageHeader } from "@/features/dev/components/dev-page-header"
import { DevPanelCard } from "@/features/dev/components/dev-panel-card"
import {
	DevStatGrid,
	DevStatusBar,
} from "@/features/dev/components/dev-stat-grid"
import { requestManagement } from "@/lib/api/management-client"
import { queryKeys } from "@/lib/api/query-keys"
import { authClient, signOut, stopAdminImpersonation } from "@/lib/auth"
import { getDeviceId } from "@/lib/device-manager"
import { getBrowserApiBaseUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dev/api-playground")({
	component: RouteComponent,
})

const signInSchema = type({
	email: "string.email > 0",
	password: "string >= 8",
})

const signUpSchema = type({
	"name?": "string > 0",
	email: "string.email > 0",
	password: "string >= 8",
})

const createApiKeySchema = type({
	"apiKeyName?": "string > 0",
	configId: "'public' | 'secret'",
	"expiresInSeconds?": "number.integer > 0",
})

type ApiPlaygroundTab = "create" | "verify" | "reference"
type AccountMode = "signin" | "signup"
type SignInVars = { email: string; password: string }
type SignUpVars = { name: string; email: string; password: string }
type CreateApiKeyVars = {
	apiKeyName: string
	configId: "public" | "secret"
	expiresInSeconds: string
	metadataJson: string
}
type VerifyApiKeyVars = {
	apiKeyToVerify: string
	configId: "public" | "secret"
	permissionsJson: string
}
type CopyKeyVars = { apiKeyToVerify: string }

const SERVER_CONFIGS = [
	{
		id: "public",
		prefix: "pk_",
		limit: "100 requests / hour",
		metadata: false,
		summary: "Low-rate public integrations and client-side tooling.",
	},
	{
		id: "secret",
		prefix: "sk_",
		limit: "1000 requests / hour",
		metadata: true,
		summary: "Higher rate limit with optional metadata tags on create.",
	},
] as const

type ApiKeyConfigId = (typeof SERVER_CONFIGS)[number]["id"]

const API_KEY_ENDPOINTS = {
	create: {
		method: "POST",
		path: "/api/v1/auth/api-key/create",
		auth: "Session cookie (admin or operations_admin)",
		client: "authClient.apiKey.create",
	},
	verify: {
		method: "POST",
		path: "/api/v1/auth/api-key/verify",
		auth: "None — public compatibility route",
		body: {
			key: "pk_ or sk_ value (required)",
			configId: "public | secret (optional, inferred from prefix)",
			permissions: "optional scope assertion object",
		},
	},
	bearer: {
		method: "Any",
		path: "/api/v1/* (routes using authenticateApiKey)",
		auth: "Authorization: Bearer <api_key>",
		note: "Table API and future scoped routes use this header, not x-api-key.",
	},
} as const

function DevEmptyState({
	icon: Icon,
	title,
	description,
	action,
	tone = "muted",
}: {
	icon: typeof IconLock
	title: string
	description: ReactNode
	action?: ReactNode
	tone?: "muted" | "amber"
}) {
	return (
		<div
			className={cn(
				"rounded-xl border border-dashed px-4 py-8 text-center",
				tone === "amber"
					? "border-amber-500/30 bg-amber-500/5"
					: "border-border/70 bg-muted/20"
			)}
		>
			<Icon
				className={cn(
					"mx-auto mb-3 size-8",
					tone === "amber"
						? "text-amber-700 dark:text-amber-300"
						: "text-muted-foreground"
				)}
			/>
			<p className="text-sm font-medium">{title}</p>
			<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			{action}
		</div>
	)
}

function ConfigPicker({
	value,
	onChange,
	disabled,
}: {
	value: ApiKeyConfigId
	onChange: (value: ApiKeyConfigId) => void
	disabled?: boolean
}) {
	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{SERVER_CONFIGS.map((config) => {
				const selected = value === config.id
				return (
					<button
						key={config.id}
						type="button"
						disabled={disabled}
						onClick={() => onChange(config.id)}
						className={cn(
							"rounded-xl border p-4 text-left transition-colors",
							selected
								? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
								: "border-border/70 bg-muted/20 hover:border-border hover:bg-muted/30",
							disabled && "cursor-not-allowed opacity-60"
						)}
					>
						<div className="mb-2 flex items-center gap-2">
							<Badge variant={selected ? "default" : "outline"}>
								{config.id}
							</Badge>
							<span className="font-mono text-xs">{config.prefix}</span>
						</div>
						<p className="text-sm text-muted-foreground">{config.summary}</p>
						<p className="mt-2 text-xs text-muted-foreground">
							Rate limit: {config.limit}
						</p>
					</button>
				)
			})}
		</div>
	)
}

const meQueryOptions = queryOptions({
	queryKey: queryKeys.management.me(),
	queryFn: () =>
		requestManagement<{
			user: unknown
			session: { impersonatedBy?: string | null }
			isImpersonating: boolean
			isAdmin: boolean
			isOperationsAdmin: boolean
			canUseAdminPlugin: boolean
		}>("/me"),
	staleTime: 15_000,
})

function formatUserRole(role: string | null | undefined): string {
	return role?.trim() || "user"
}

function parseOptionalJson(
	raw: string,
	label: string
): Record<string, unknown> | undefined {
	if (!raw.trim()) return undefined
	try {
		const parsed = JSON.parse(raw.trim()) as unknown
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error(`${label} must be a JSON object`)
		}
		return parsed as Record<string, unknown>
	} catch (error) {
		if (error instanceof Error && error.message.includes("must be")) {
			throw error
		}
		throw new Error(`Invalid ${label.toLowerCase()} JSON`)
	}
}

function RouteComponent() {
	const queryClient = useQueryClient()
	const apiTargetUrl = getBrowserApiBaseUrl()
	const [activeTab, setActiveTab] = useState<ApiPlaygroundTab>("create")
	const [accountMode, setAccountMode] = useState<AccountMode>("signin")
	const [actionMessage, setActionMessage] = useState<string | null>(null)
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)
	const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false)

	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [apiKeyName, setApiKeyName] = useState("agentfabric-web")
	const [createConfigId, setCreateConfigId] = useState<ApiKeyConfigId>("secret")
	const [verifyConfigId, setVerifyConfigId] = useState<ApiKeyConfigId>("secret")
	const [expiresInSeconds, setExpiresInSeconds] = useState("86400")
	const [metadataJson, setMetadataJson] = useState(
		'{"source":"web-dashboard","project":"agentfabric"}'
	)
	const [permissionsJson, setPermissionsJson] = useState("")
	const [apiKeyToVerify, setApiKeyToVerify] = useState("")
	const [fieldError, setFieldError] = useState<string | null>(null)

	useEffect(() => {
		setDeviceId(getDeviceId())
	}, [])

	const sessionQuery = useQuery({
		queryKey: queryKeys.auth.session(),
		queryFn: () => authClient.getSession(),
		staleTime: 15_000,
	})
	const meQuery = useQuery({
		...meQueryOptions,
		enabled: Boolean(sessionQuery.data?.data),
	})

	const sessionData = sessionQuery.data?.data ?? null
	const isAuthenticated = Boolean(sessionData)
	const meData = meQuery.data ?? null
	const isFullAdmin = Boolean(meData?.isAdmin)
	const isOperationsAdmin = Boolean(meData?.isOperationsAdmin)
	const sessionImpersonatedBy =
		meData?.session?.impersonatedBy ??
		(typeof sessionData?.session === "object" &&
		sessionData.session !== null &&
		"impersonatedBy" in sessionData.session
			? (sessionData.session as { impersonatedBy?: string | null })
					.impersonatedBy
			: null)
	const isImpersonating = Boolean(
		meData?.isImpersonating || sessionImpersonatedBy
	)
	const hasAdminAccess = Boolean(meData?.canUseAdminPlugin) && !isImpersonating
	const authStatusMessage = "Sign in above to create API keys."
	const impersonatingStatusMessage = isImpersonating
		? `Impersonating ${sessionData?.user?.email ?? "another user"}. End impersonation to manage API keys as your admin account.`
		: null
	const adminRequiredMessage =
		"Admin access required. This dev playground is limited to admin or operations_admin accounts."
	const statusMessage =
		actionMessage ??
		(isAuthenticated
			? isImpersonating
				? impersonatingStatusMessage
				: hasAdminAccess
					? null
					: adminRequiredMessage
			: authStatusMessage)

	function refreshSession() {
		queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() })
		queryClient.invalidateQueries({ queryKey: queryKeys.management.me() })
	}

	const signUp = useMutation({
		mutationFn: async (vars: SignUpVars) => {
			setFieldError(null)
			const result = signUpSchema({
				name: vars.name || undefined,
				email: vars.email,
				password: vars.password,
			})
			if (result instanceof type.errors) {
				setFieldError(result.summary)
				throw new Error(result.summary)
			}
			return authClient.signUp.email({
				name: result.name || "New User",
				email: result.email,
				password: result.password,
			})
		},
		onSuccess: () => {
			setActionMessage("Signed up successfully.")
			setActiveTab("create")
			refreshSession()
		},
	})

	const signIn = useMutation({
		mutationFn: async (vars: SignInVars) => {
			setFieldError(null)
			const result = signInSchema(vars)
			if (result instanceof type.errors) {
				setFieldError(result.summary)
				throw new Error(result.summary)
			}
			return authClient.signIn.email({
				email: result.email,
				password: result.password,
			})
		},
		onSuccess: () => {
			setActionMessage("Signed in successfully.")
			setActiveTab("create")
			refreshSession()
		},
	})

	const signOutMutation = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			setApiKeyToVerify("")
			setActionMessage(
				"Signed out. API key creation is locked until you sign in again."
			)
			refreshSession()
		},
	})

	const stopImpersonation = useMutation({
		mutationFn: stopAdminImpersonation,
		onSuccess: () => {
			setActionMessage("Impersonation ended.")
			refreshSession()
		},
	})

	const createApiKey = useMutation({
		mutationFn: async (vars: CreateApiKeyVars) => {
			setFieldError(null)
			const parsedExpires = Number.parseInt(vars.expiresInSeconds, 10)
			const result = createApiKeySchema({
				apiKeyName: vars.apiKeyName || undefined,
				configId: vars.configId,
				expiresInSeconds:
					Number.isFinite(parsedExpires) && parsedExpires > 0
						? parsedExpires
						: undefined,
			})
			if (result instanceof type.errors) {
				setFieldError(result.summary)
				throw new Error(result.summary)
			}

			const metadata =
				vars.configId === "secret"
					? parseOptionalJson(vars.metadataJson, "Metadata")
					: undefined

			const prefix = vars.configId === "secret" ? "sk_" : "pk_"
			return authClient.apiKey.create({
				configId: vars.configId,
				name: vars.apiKeyName.trim() || undefined,
				prefix,
				expiresIn:
					Number.isFinite(parsedExpires) && parsedExpires > 0
						? parsedExpires
						: undefined,
				metadata,
			})
		},
		onSuccess: (data, vars) => {
			const key =
				typeof data === "object" && data !== null && "key" in data
					? String((data as { key?: string }).key ?? "")
					: ""
			if (key) {
				setApiKeyToVerify(key)
				setVerifyConfigId(vars.configId)
			}
			setActiveTab("verify")
			setActionMessage(
				"API key created. Switched to Verify with the plaintext key pre-filled."
			)
		},
	})

	const verifyApiKey = useMutation({
		mutationFn: async (vars: VerifyApiKeyVars) => {
			if (!vars.apiKeyToVerify.trim()) throw new Error("API key is required")

			const permissions = parseOptionalJson(
				vars.permissionsJson,
				"Permissions"
			) as Record<string, string[]> | undefined

			const response = await fetch(
				`${apiTargetUrl}/api/v1/auth/api-key/verify`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						configId: vars.configId,
						key: vars.apiKeyToVerify.trim(),
						permissions,
					}),
				}
			)

			const data = await response.json()
			if (!response.ok)
				throw new Error(
					(data as { message?: string })?.message || `HTTP ${response.status}`
				)
			return data
		},
		onSuccess: (_data, vars) => {
			setActionMessage(
				`Verification succeeded for ${vars.configId} config via POST /api/v1/auth/api-key/verify.`
			)
		},
		onError: () => {
			setActionMessage(
				"Verification failed. Check the key, config ID, and permissions JSON."
			)
		},
	})

	const copyKey = useMutation({
		mutationFn: async (vars: CopyKeyVars) => {
			if (!vars.apiKeyToVerify.trim())
				throw new Error("Create or paste an API key first.")
			await navigator.clipboard.writeText(vars.apiKeyToVerify.trim())
		},
		onSuccess: () => {
			setCopied(true)
			setActionMessage("API key copied to clipboard.")
			setTimeout(() => setCopied(false), 1500)
		},
	})

	const anyBusy =
		signUp.isPending ||
		signIn.isPending ||
		signOutMutation.isPending ||
		stopImpersonation.isPending ||
		createApiKey.isPending ||
		verifyApiKey.isPending ||
		copyKey.isPending

	const activeError =
		signUp.error ||
		signIn.error ||
		signOutMutation.error ||
		stopImpersonation.error ||
		createApiKey.error ||
		verifyApiKey.error ||
		copyKey.error

	return (
		<div className="space-y-6">
			<DevPageHeader
				icon={<IconKey className="size-5" />}
				badges={
					<>
						<Badge variant="outline">Fastify server</Badge>
						<Badge variant="outline">Bearer auth</Badge>
						<Badge variant={isAuthenticated ? "default" : "secondary"}>
							{isAuthenticated ? "Session active" : "Sign in required"}
						</Badge>
						{isImpersonating ? (
							<Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-200">
								Impersonating
							</Badge>
						) : null}
					</>
				}
				title="API key playground"
				description="Mint Better Auth API keys (admin or operations_admin), verify them against the server, and inspect dual-config reference. Verify and Reference work without a session; key creation requires sign-in."
				meta={
					<DevStatGrid
						items={[
							{ label: "Server target", value: apiTargetUrl, mono: true },
							{
								label: isImpersonating ? "Viewing as" : "Signed in as",
								value: sessionData?.user?.email ?? "Not signed in",
							},
							...(isAuthenticated
								? [
										{
											label: isImpersonating ? "Impersonated role" : "Role",
											value: formatUserRole(sessionData?.user?.role),
										},
										{
											label: "Device ID",
											value: deviceId ?? "not initialized",
											mono: true,
										},
									]
								: []),
						]}
					/>
				}
			/>

			<DevPanelCard title="Authentication" contentClassName="space-y-3">
				{isAuthenticated ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="min-w-0 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium">
										{sessionData?.user?.name ?? "Unknown user"}
									</span>
									<span className="text-sm text-muted-foreground">
										{sessionData?.user?.email}
									</span>
									{isImpersonating ? (
										<Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-200">
											Impersonating
										</Badge>
									) : (
										<Badge
											variant={hasAdminAccess ? "default" : "secondary"}
											className={
												isOperationsAdmin && !isFullAdmin
													? "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200"
													: undefined
											}
										>
											{formatUserRole(sessionData?.user?.role)}
										</Badge>
									)}
								</div>
								{isImpersonating ? (
									<p className="text-xs text-muted-foreground">
										Admin id{" "}
										<code className="rounded bg-muted px-1">
											{sessionImpersonatedBy ?? "unknown"}
										</code>
										. End impersonation to create keys under your account.
									</p>
								) : !hasAdminAccess ? (
									<p className="text-xs text-muted-foreground">
										Key creation requires{" "}
										<code className="rounded bg-muted px-1">admin</code> or{" "}
										<code className="rounded bg-muted px-1">
											operations_admin
										</code>
										. Grant roles in the{" "}
										<Link
											to="/dev/admin-playground"
											className="font-medium text-foreground underline-offset-4 hover:underline"
										>
											Admin Playground
										</Link>
										. Verify still works without admin access.
									</p>
								) : (
									<p className="text-xs text-muted-foreground">
										Session is active. Create keys below or verify an existing
										key on the Verify tab.
									</p>
								)}
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={refreshSession}
									disabled={anyBusy}
								>
									<IconRefresh className="size-4" />
									Refresh
								</Button>
								{isImpersonating ? (
									<Button
										disabled={anyBusy}
										size="sm"
										variant="destructive"
										onClick={() => stopImpersonation.mutate()}
									>
										{stopImpersonation.isPending
											? "Ending..."
											: "End impersonation"}
									</Button>
								) : null}
								<Button
									variant="outline"
									size="sm"
									onClick={() => signOutMutation.mutate()}
									disabled={anyBusy}
								>
									Sign out
								</Button>
							</div>
						</div>

						<Collapsible
							open={sessionDetailsOpen}
							onOpenChange={setSessionDetailsOpen}
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="gap-1.5 px-2 text-muted-foreground"
								>
									<IconChevronDown
										className={cn(
											"size-4 transition-transform",
											sessionDetailsOpen && "rotate-180"
										)}
									/>
									Session details
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="pt-2">
								<DevJsonBlock
									value={sessionData}
									maxHeightClassName="max-h-56"
									emptyLabel="No session loaded yet."
								/>
							</CollapsibleContent>
						</Collapsible>
					</>
				) : (
					<>
						<p className="text-sm text-muted-foreground">
							Sign in to create user-owned API keys. Verify and Reference tabs
							work without a session.
						</p>

						<div className="inline-flex rounded-lg border border-border/70 bg-muted/20 p-1">
							<Button
								type="button"
								size="sm"
								variant={accountMode === "signin" ? "default" : "ghost"}
								onClick={() => {
									setAccountMode("signin")
									setFieldError(null)
								}}
							>
								Sign in
							</Button>
							<Button
								type="button"
								size="sm"
								variant={accountMode === "signup" ? "default" : "ghost"}
								onClick={() => {
									setAccountMode("signup")
									setFieldError(null)
								}}
							>
								Sign up
							</Button>
						</div>

						{accountMode === "signin" ? (
							<form
								autoComplete="off"
								className="grid gap-4 sm:grid-cols-2"
								onSubmit={(event) => event.preventDefault()}
							>
								<div className="space-y-2">
									<DevFieldLabel>Email</DevFieldLabel>
									<Input
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										type="email"
										name="dev-playground-signin-email"
										autoComplete="off"
										placeholder="you@example.com"
									/>
								</div>
								<div className="space-y-2">
									<DevFieldLabel>Password</DevFieldLabel>
									<Input
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										type="password"
										name="dev-playground-signin-password"
										autoComplete="off"
										placeholder="Enter your password"
									/>
								</div>
							</form>
						) : (
							<form
								autoComplete="off"
								className="grid gap-4 sm:grid-cols-2"
								onSubmit={(event) => event.preventDefault()}
							>
								<div className="space-y-2 sm:col-span-2">
									<DevFieldLabel>Full name</DevFieldLabel>
									<Input
										value={fullName}
										onChange={(e) => setFullName(e.target.value)}
										name="dev-playground-signup-name"
										autoComplete="off"
										placeholder="Your display name"
									/>
								</div>
								<div className="space-y-2">
									<DevFieldLabel>Email</DevFieldLabel>
									<Input
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										type="email"
										name="dev-playground-signup-email"
										autoComplete="off"
										placeholder="you@example.com"
									/>
								</div>
								<div className="space-y-2">
									<DevFieldLabel>Password</DevFieldLabel>
									<Input
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										type="password"
										name="dev-playground-signup-password"
										autoComplete="off"
										placeholder="At least 8 characters"
									/>
								</div>
							</form>
						)}

						{fieldError && (
							<p className="text-sm text-destructive">{fieldError}</p>
						)}

						<div className="flex flex-wrap gap-2">
							{accountMode === "signup" ? (
								<Button
									onClick={() =>
										signUp.mutate({ name: fullName, email, password })
									}
									disabled={anyBusy}
								>
									{signUp.isPending ? "Signing up..." : "Sign up"}
								</Button>
							) : (
								<Button
									onClick={() => signIn.mutate({ email, password })}
									disabled={anyBusy}
								>
									{signIn.isPending ? "Signing in..." : "Sign in"}
								</Button>
							)}
						</div>
					</>
				)}
			</DevPanelCard>

			{statusMessage && <DevStatusBar>{statusMessage}</DevStatusBar>}

			{activeError && (
				<div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{activeError instanceof Error
						? activeError.message
						: String(activeError)}
				</div>
			)}

			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardContent className="pt-6">
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value as ApiPlaygroundTab)}
					>
						<TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1">
							<TabsTrigger value="create" className="gap-1.5 px-3 py-2">
								<IconKey className="size-4" />
								Create key
							</TabsTrigger>
							<TabsTrigger value="verify" className="gap-1.5 px-3 py-2">
								Verify key
							</TabsTrigger>
							<TabsTrigger value="reference" className="gap-1.5 px-3 py-2">
								<IconInfoCircle className="size-4" />
								Server reference
							</TabsTrigger>
						</TabsList>

						<TabsContent value="create" className="space-y-4">
							{!isAuthenticated ? (
								<DevEmptyState
									icon={IconLock}
									title="Create key is locked"
									description="Sign in using the authentication panel above to mint user-owned API keys."
								/>
							) : isImpersonating ? (
								<DevEmptyState
									icon={IconMask}
									title="Impersonation active"
									description="End impersonation to create API keys as your admin account."
									tone="amber"
									action={
										<Button
											className="mt-4"
											disabled={anyBusy}
											variant="destructive"
											onClick={() => stopImpersonation.mutate()}
										>
											{stopImpersonation.isPending
												? "Ending..."
												: "End impersonation"}
										</Button>
									}
								/>
							) : !hasAdminAccess ? (
								<DevEmptyState
									icon={IconLock}
									title="Admin access required for creation"
									description={
										<>
											Only{" "}
											<code className="rounded bg-muted px-1 text-xs">
												admin
											</code>{" "}
											or{" "}
											<code className="rounded bg-muted px-1 text-xs">
												operations_admin
											</code>{" "}
											accounts can create keys here. You can still verify keys
											on the Verify tab.
										</>
									}
								/>
							) : (
								<>
									<DevPanelCard
										title="Key settings"
										description={
											<>
												Mints a key owned by the signed-in user via{" "}
												<code className="rounded bg-muted px-1 py-0.5 text-xs">
													authClient.apiKey.create
												</code>
												. Keys authenticate with{" "}
												<code className="rounded bg-muted px-1 py-0.5 text-xs">
													Authorization: Bearer
												</code>
												.
											</>
										}
										contentClassName="space-y-4"
									>
										<div className="grid gap-4 sm:grid-cols-2">
											<div className="space-y-2">
												<DevFieldLabel>Key name</DevFieldLabel>
												<Input
													value={apiKeyName}
													onChange={(e) => setApiKeyName(e.target.value)}
													placeholder="agentfabric-web"
												/>
											</div>
											<div className="space-y-2">
												<DevFieldLabel>Expires in seconds</DevFieldLabel>
												<Input
													value={expiresInSeconds}
													onChange={(e) => setExpiresInSeconds(e.target.value)}
													inputMode="numeric"
													placeholder="86400 (24 hours)"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<DevFieldLabel>Config</DevFieldLabel>
											<ConfigPicker
												value={createConfigId}
												onChange={setCreateConfigId}
											/>
										</div>
									</DevPanelCard>

									<DevPanelCard
										title="Metadata"
										description="Optional JSON tags on secret keys only. Public keys ignore metadata."
										contentClassName={cn(
											createConfigId !== "secret" && "opacity-70"
										)}
									>
										<Textarea
											value={metadataJson}
											onChange={(e) => setMetadataJson(e.target.value)}
											rows={3}
											spellCheck={false}
											disabled={createConfigId !== "secret"}
											placeholder='{"source":"web-dashboard","project":"agentfabric"}'
										/>
									</DevPanelCard>

									<Collapsible>
										<CollapsibleTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="gap-1.5 px-2 text-muted-foreground"
											>
												<IconChevronDown className="size-4" />
												Why permissions are server-only on create
											</Button>
										</CollapsibleTrigger>
										<CollapsibleContent className="pt-2">
											<p className="text-xs leading-5 text-muted-foreground">
												Better Auth rejects client-supplied{" "}
												<code className="rounded bg-muted px-1">
													permissions
												</code>{" "}
												with{" "}
												<code className="rounded bg-muted px-1">
													SERVER_ONLY_PROPERTY
												</code>
												. Set scopes server-side via{" "}
												<code className="rounded bg-muted px-1">
													auth.api.createApiKey
												</code>{" "}
												or{" "}
												<code className="rounded bg-muted px-1">
													defaultPermissions
												</code>{" "}
												in{" "}
												<code className="rounded bg-muted px-1">
													packages/cli/src/lib/auth.ts
												</code>
												. Use Verify to assert scopes on keys that already have
												them.
											</p>
										</CollapsibleContent>
									</Collapsible>

									<div className="flex flex-wrap gap-2">
										<Button
											onClick={() =>
												createApiKey.mutate({
													apiKeyName,
													configId: createConfigId,
													expiresInSeconds,
													metadataJson,
												})
											}
											disabled={anyBusy}
										>
											<IconKey className="size-4" />
											{createApiKey.isPending
												? "Creating..."
												: "Create API key"}
										</Button>
									</div>

									<DevPanelCard
										title="Create response"
										description="Plaintext key is shown once. Copy it before leaving this page."
									>
										<DevJsonBlock
											value={createApiKey.data}
											maxHeightClassName="max-h-64"
											emptyLabel="No API key created yet."
										/>
									</DevPanelCard>
								</>
							)}
						</TabsContent>

						<TabsContent value="verify" className="space-y-4">
							<DevPanelCard
								title="Key to verify"
								description={
									<>
										Public compatibility route — no session required. Config ID
										is inferred from the{" "}
										<code className="rounded bg-muted px-1 py-0.5 text-xs">
											pk_
										</code>{" "}
										or{" "}
										<code className="rounded bg-muted px-1 py-0.5 text-xs">
											sk_
										</code>{" "}
										prefix when omitted.
									</>
								}
								contentClassName="space-y-4"
							>
								<div className="space-y-2">
									<DevFieldLabel>API key</DevFieldLabel>
									<Input
										value={apiKeyToVerify}
										onChange={(e) => setApiKeyToVerify(e.target.value)}
										placeholder="Paste pk_ or sk_ key"
										className="font-mono"
									/>
								</div>
								<div className="space-y-2">
									<DevFieldLabel>Config override (optional)</DevFieldLabel>
									<ConfigPicker
										value={verifyConfigId}
										onChange={setVerifyConfigId}
									/>
								</div>
							</DevPanelCard>

							<DevPanelCard
								title="Permission assertion (optional)"
								description="When provided, the server checks stored permissions match before returning valid: true."
							>
								<Textarea
									value={permissionsJson}
									onChange={(e) => setPermissionsJson(e.target.value)}
									rows={3}
									spellCheck={false}
									placeholder='{"session":["read"]}'
								/>
							</DevPanelCard>

							<div className="flex flex-wrap gap-2">
								<Button
									onClick={() =>
										verifyApiKey.mutate({
											apiKeyToVerify,
											configId: verifyConfigId,
											permissionsJson,
										})
									}
									disabled={anyBusy || !apiKeyToVerify.trim()}
								>
									<IconShieldCheck className="size-4" />
									{verifyApiKey.isPending ? "Verifying..." : "Verify key"}
									<IconArrowRight className="size-4" />
								</Button>
								<Button
									variant="secondary"
									onClick={() => copyKey.mutate({ apiKeyToVerify })}
									disabled={anyBusy || !apiKeyToVerify.trim()}
								>
									<IconCopy className="size-4" />
									{copied ? "Copied" : "Copy key"}
								</Button>
							</div>

							<DevPanelCard
								title="Verification response"
								description="Result from POST /api/v1/auth/api-key/verify on the CLI server."
							>
								<DevJsonBlock
									value={verifyApiKey.data}
									maxHeightClassName="max-h-80"
									emptyLabel="No verification run yet."
								/>
							</DevPanelCard>
						</TabsContent>

						<TabsContent value="reference" className="space-y-4">
							<p className="text-sm leading-6 text-muted-foreground">
								Better Auth API key plugin configuration in{" "}
								<code className="rounded bg-muted px-1 py-0.5 text-xs">
									packages/cli/src/lib/auth.ts
								</code>
								. Workspaces use session auth via the organization plugin — not
								API keys.
							</p>

							<div className="grid gap-3 sm:grid-cols-2">
								{SERVER_CONFIGS.map((config) => (
									<div
										key={config.id}
										className="rounded-xl border border-border/70 bg-muted/20 p-4"
									>
										<div className="mb-2 flex items-center gap-2">
											<Badge variant="outline">{config.id}</Badge>
											<span className="font-mono text-xs">{config.prefix}</span>
										</div>
										<p className="text-sm text-muted-foreground">
											{config.summary}
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											Rate limit: {config.limit}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Metadata:{" "}
											{config.metadata ? "enabled on create" : "not stored"}
										</p>
									</div>
								))}
							</div>

							<DevPanelCard title="Endpoints">
								<div className="space-y-4">
									<DevJsonBlock value={API_KEY_ENDPOINTS.create} />
									<DevJsonBlock value={API_KEY_ENDPOINTS.verify} />
									<DevJsonBlock value={API_KEY_ENDPOINTS.bearer} />
								</div>
							</DevPanelCard>

							<DevPanelCard title="Auth plugins in use">
								<ul className="space-y-2 text-sm leading-6 text-muted-foreground">
									<li>
										<code className="rounded bg-muted px-1">admin</code> — roles{" "}
										<code className="rounded bg-muted px-1">user</code>,{" "}
										<code className="rounded bg-muted px-1">
											operations_admin
										</code>
										, <code className="rounded bg-muted px-1">admin</code> with
										custom access control
									</li>
									<li>
										<code className="rounded bg-muted px-1">apiKey</code> — dual
										config (
										<code className="rounded bg-muted px-1">public</code> /{" "}
										<code className="rounded bg-muted px-1">secret</code>
										), Bearer header auth
									</li>
									<li>
										<code className="rounded bg-muted px-1">organization</code>{" "}
										— workspaces at{" "}
										<code className="rounded bg-muted px-1">
											/api/v1/workspaces
										</code>{" "}
										(session-only)
									</li>
								</ul>
							</DevPanelCard>

							<DevPanelCard title="Metadata vs permissions">
								<div className="space-y-4 text-sm leading-6 text-muted-foreground">
									<div>
										<p className="font-medium text-foreground">Metadata</p>
										<p>
											Optional JSON tags on secret keys. Stored for auditing;
											not yet attached to{" "}
											<code className="rounded bg-muted px-1">
												request.apiKey
											</code>{" "}
											during Bearer auth.
										</p>
									</div>
									<div>
										<p className="font-medium text-foreground">Permissions</p>
										<p>
											Server-only on create. After Bearer auth,{" "}
											<code className="rounded bg-muted px-1">
												request.apiKey.permissions
											</code>{" "}
											is populated.{" "}
											<code className="rounded bg-muted px-1">
												GET /api/v1/table
											</code>{" "}
											scopes rows to the key owner but does not enforce
											permission scopes yet.
										</p>
									</div>
								</div>
							</DevPanelCard>

							<DevPanelCard title="End-to-end workflow">
								<ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
									<li>
										Sign in as{" "}
										<code className="rounded bg-muted px-1">admin</code> or{" "}
										<code className="rounded bg-muted px-1">
											operations_admin
										</code>{" "}
										(end impersonation first if active).
									</li>
									<li>Create a secret key with metadata on the Create tab.</li>
									<li>
										Verify the key on the Verify tab (optional permission
										assertion if the key has server-set scopes).
									</li>
									<li>
										Use the key on the{" "}
										<Link
											to="/dev/table-api-playground"
											className="font-medium text-foreground underline-offset-4 hover:underline"
										>
											Table API playground
										</Link>{" "}
										to fetch owner-scoped session rows.
									</li>
									<li>
										Manage roles and impersonation in the{" "}
										<Link
											to="/dev/admin-playground"
											className="font-medium text-foreground underline-offset-4 hover:underline"
										>
											Admin Playground
										</Link>
										. Workspaces live in the main app at{" "}
										<Link
											to="/workspace"
											className="font-medium text-foreground underline-offset-4 hover:underline"
										>
											/workspace
										</Link>
										.
									</li>
								</ol>
							</DevPanelCard>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
