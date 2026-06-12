import {
	IconChevronDown,
	IconInfoCircle,
	IconLock,
	IconMask,
	IconPlayerPlay,
	IconRefresh,
	IconShieldLock,
	IconTable,
} from "@tabler/icons-react"
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type } from "arktype"
import { useEffect, useMemo, useState } from "react"

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
import { apiBaseURL, getBrowserApiBaseUrl } from "@/lib/env"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dev/table-apikey-integration")({
	component: RouteComponent,
})

const signInSchema = type({
	email: "string.email > 0",
	password: "string >= 8",
})

const tableApiKeySchema = type({
	baseUrl: "string > 0",
	apiKey: "string > 0",
	tableName: "string > 0",
	"limit?": "1 <= number.integer <= 100",
	"offset?": "number.integer >= 0",
})

type TableApiKeyInput = typeof tableApiKeySchema.infer
type TablePlaygroundTab = "query" | "preview" | "reference"
type RunRequestVars = {
	apiKey: string
	tableName: string
	limitStr: string
	offsetStr: string
}

type TableRequestResult = {
	ok: boolean
	status: number
	headers: Record<string, string>
	body: unknown
}

const AVAILABLE_TABLES = [
	{ id: "session", label: "session (API key owner rows)" },
] as const

const meQueryOptions = queryOptions({
	queryKey: queryKeys.management.me(),
	queryFn: () =>
		requestManagement<{
			user: unknown
			session: { impersonatedBy?: string | null }
			isImpersonating: boolean
			isAdmin: boolean
		}>("/me"),
	staleTime: 15_000,
})

function formatUserRole(role: string | null | undefined): string {
	return role?.trim() || "user"
}

function maskApiKey(apiKey: string): string {
	if (!apiKey) return "<missing>"
	if (apiKey.length <= 10) return "••••••••"
	return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`
}

function buildRequestPreview(input: {
	baseUrl: string
	apiKey: string
	tableName: string
	limit: string
	offset: string
}) {
	const normalizedBase = input.baseUrl.trim().replace(/\/$/, "") || apiBaseURL
	const url = new URL(`${normalizedBase}/api/v1/table`)
	url.searchParams.set("name", input.tableName || "session")
	url.searchParams.set("limit", input.limit || "25")
	url.searchParams.set("offset", input.offset || "0")

	return {
		method: "GET",
		url: url.toString(),
		headers: {
			Authorization: `Bearer ${maskApiKey(input.apiKey)}`,
			Accept: "application/json",
		},
	}
}

async function fetchTableData(
	input: TableApiKeyInput
): Promise<TableRequestResult> {
	const url = new URL(`${input.baseUrl}/api/v1/table`)
	url.searchParams.set("name", input.tableName)
	url.searchParams.set("limit", String(input.limit ?? 25))
	url.searchParams.set("offset", String(input.offset ?? 0))

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: { Authorization: `Bearer ${input.apiKey}` },
	})
	const headers = Object.fromEntries(response.headers.entries())

	let body: unknown = null
	const raw = await response.text()
	if (raw) {
		try {
			body = JSON.parse(raw) as unknown
		} catch {
			body = raw
		}
	}

	return {
		ok: response.ok,
		status: response.status,
		headers,
		body,
	}
}

function RouteComponent() {
	const queryClient = useQueryClient()
	const [activeTab, setActiveTab] = useState<TablePlaygroundTab>("query")
	const [actionMessage, setActionMessage] = useState<string | null>(null)
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false)

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const apiTargetUrl = getBrowserApiBaseUrl()
	const [apiKey, setApiKey] = useState("")
	const [tableName, setTableName] = useState("session")
	const [limit, setLimit] = useState("25")
	const [offset, setOffset] = useState("0")
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
	const hasFullAdminAccess = isFullAdmin && !isImpersonating

	const requestPreview = useMemo(
		() =>
			buildRequestPreview({
				baseUrl: apiTargetUrl,
				apiKey,
				tableName,
				limit,
				offset,
			}),
		[apiTargetUrl, apiKey, tableName, limit, offset]
	)

	const authStatusMessage =
		"Sign in with a full admin account to query table data via API key."
	const impersonatingStatusMessage = isImpersonating
		? `Impersonating ${sessionData?.user?.email ?? "another user"}. End impersonation to use the Table API playground as your admin account.`
		: null
	const adminRequiredMessage =
		"Full admin role required. operations_admin and regular users cannot use this playground."
	const statusMessage =
		actionMessage ??
		(isAuthenticated
			? isImpersonating
				? impersonatingStatusMessage
				: hasFullAdminAccess
					? null
					: adminRequiredMessage
			: authStatusMessage)

	function refreshSession() {
		queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() })
		queryClient.invalidateQueries({ queryKey: queryKeys.management.me() })
	}

	const signIn = useMutation({
		mutationFn: async (vars: { email: string; password: string }) => {
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
			refreshSession()
		},
	})

	const signOutMutation = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			setActionMessage("Signed out.")
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

	const runRequest = useMutation({
		mutationFn: async (vars: RunRequestVars) => {
			const parsedLimit = Number.parseInt(vars.limitStr, 10)
			const parsedOffset = Number.parseInt(vars.offsetStr, 10)

			const result = tableApiKeySchema({
				baseUrl: apiTargetUrl,
				apiKey: vars.apiKey.trim(),
				tableName: vars.tableName.trim(),
				limit:
					Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 25,
				offset:
					Number.isFinite(parsedOffset) && parsedOffset >= 0 ? parsedOffset : 0,
			})

			if (result instanceof type.errors) {
				setFieldError(result.summary)
				throw new Error(result.summary)
			}

			setFieldError(null)
			return fetchTableData(result)
		},
		onSuccess: (data) => {
			setActiveTab("preview")
			setActionMessage(
				data.ok
					? `Request completed (HTTP ${data.status}).`
					: `Request returned HTTP ${data.status}. See response preview.`
			)
		},
	})

	const anyBusy =
		signIn.isPending ||
		signOutMutation.isPending ||
		stopImpersonation.isPending ||
		runRequest.isPending

	function handleRunRequest() {
		runRequest.mutate({
			apiKey,
			tableName,
			limitStr: limit,
			offsetStr: offset,
		})
	}

	function handleReset() {
		setApiKey("")
		setTableName("session")
		setLimit("25")
		setOffset("0")
		setFieldError(null)
		runRequest.reset()
		setActionMessage("Form reset.")
	}

	const queryLocked = !isAuthenticated || isImpersonating || !hasFullAdminAccess

	return (
		<div className="space-y-6">
			<DevPageHeader
				icon={<IconShieldLock className="size-5" />}
				badges={
					<>
						<Badge variant="outline">Bearer API key</Badge>
						<Badge variant="outline">GET /api/v1/table</Badge>
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
				title="Table API playground"
				description="Fetch table-level data with an API key. Full admin only — end impersonation before use. Create keys in the API key playground first."
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
									]
								: []),
						]}
					/>
				}
			/>

			<DevPanelCard title="Authentication" contentClassName="space-y-4">
				{isAuthenticated ? (
					<>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex flex-wrap items-center gap-2">
								{isImpersonating ? (
									<span className="text-sm text-muted-foreground">
										Viewing as
									</span>
								) : null}
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
									<Badge variant="default">Session active</Badge>
								)}
								<Badge
									variant={
										isImpersonating
											? "outline"
											: hasFullAdminAccess
												? "default"
												: "secondary"
									}
								>
									{isImpersonating ? "Role: " : null}
									{formatUserRole(sessionData?.user?.role)}
								</Badge>
								<Badge variant="outline">
									Device ID: {deviceId ?? "not initialized"}
								</Badge>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="secondary"
									size="sm"
									onClick={refreshSession}
									disabled={anyBusy}
								>
									<IconRefresh className="size-4" />
									Refresh session
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
									variant="destructive"
									size="sm"
									onClick={() => signOutMutation.mutate()}
									disabled={anyBusy}
								>
									Sign out
								</Button>
							</div>
						</div>

						{isImpersonating ? (
							<p className="text-xs leading-5 text-muted-foreground">
								Admin id:{" "}
								<code className="rounded bg-muted px-1">
									{sessionImpersonatedBy ?? "unknown"}
								</code>
								. End impersonation to query tables under your admin account.
							</p>
						) : !hasFullAdminAccess ? (
							<p className="text-xs leading-5 text-muted-foreground">
								This playground requires the{" "}
								<code className="rounded bg-muted px-1">admin</code> role. Grant
								it via SQL or the{" "}
								<Link
									to="/dev/impersonate-user"
									className="font-medium text-foreground underline-offset-4 hover:underline"
								>
									Admin Playground
								</Link>
								.
							</p>
						) : null}

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
							Sign in with a full admin account to use the Table API playground.
						</p>
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
									name="dev-table-playground-signin-email"
									autoComplete="off"
									placeholder="admin@example.com"
								/>
							</div>
							<div className="space-y-2">
								<DevFieldLabel>Password</DevFieldLabel>
								<Input
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									type="password"
									name="dev-table-playground-signin-password"
									autoComplete="off"
									placeholder="Enter your password"
								/>
							</div>
						</form>
						{fieldError ? (
							<p className="text-sm text-destructive">{fieldError}</p>
						) : null}
						<Button
							onClick={() => signIn.mutate({ email, password })}
							disabled={anyBusy}
						>
							{signIn.isPending ? "Signing in..." : "Sign in"}
						</Button>
					</>
				)}
			</DevPanelCard>

			{statusMessage ? <DevStatusBar>{statusMessage}</DevStatusBar> : null}

			{(runRequest.error ||
				signIn.error ||
				signOutMutation.error ||
				stopImpersonation.error) && (
				<div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{runRequest.error instanceof Error
						? runRequest.error.message
						: signIn.error instanceof Error
							? signIn.error.message
							: signOutMutation.error instanceof Error
								? signOutMutation.error.message
								: stopImpersonation.error instanceof Error
									? stopImpersonation.error.message
									: "Unknown error"}
				</div>
			)}

			<Card className="border-border/70 bg-card/95 shadow-sm">
				<CardContent className="pt-6">
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value as TablePlaygroundTab)}
					>
						<TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1">
							<TabsTrigger value="query" className="gap-1.5 px-3 py-2">
								<IconTable className="size-4" />
								Query
							</TabsTrigger>
							<TabsTrigger value="preview" className="gap-1.5 px-3 py-2">
								<IconShieldLock className="size-4" />
								Request & response
							</TabsTrigger>
							<TabsTrigger value="reference" className="gap-1.5 px-3 py-2">
								<IconInfoCircle className="size-4" />
								Reference
							</TabsTrigger>
						</TabsList>

						<TabsContent value="query" className="space-y-4">
							{!isAuthenticated ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Query is locked</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Sign in with a full admin account using the authentication
										panel above.
									</p>
								</div>
							) : isImpersonating ? (
								<div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-8 text-center">
									<IconMask className="mx-auto mb-3 size-8 text-amber-700 dark:text-amber-300" />
									<p className="text-sm font-medium">Impersonation active</p>
									<p className="mt-1 text-sm text-muted-foreground">
										End impersonation to query table data as your admin account.
									</p>
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
								</div>
							) : !hasFullAdminAccess ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Full admin required</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Only users with the{" "}
										<code className="rounded bg-muted px-1 text-xs">admin</code>{" "}
										role can use this playground.
									</p>
								</div>
							) : (
								<>
									<DevPanelCard
										title="Request settings"
										description={
											<>
												Paste an API key from the{" "}
												<Link
													to="/dev/api-playground"
													className="font-medium text-foreground underline-offset-4 hover:underline"
												>
													API key playground
												</Link>
												. Data is scoped to the key owner.
											</>
										}
										contentClassName="grid gap-4 md:grid-cols-2"
									>
										<div className="space-y-2 md:col-span-2">
											<DevFieldLabel>API base URL</DevFieldLabel>
											<Input
												disabled
												value={apiTargetUrl}
												className="font-mono"
												tabIndex={-1}
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<DevFieldLabel>
												Authorization Bearer API key
											</DevFieldLabel>
											<Input
												value={apiKey}
												onChange={(e) => setApiKey(e.target.value)}
												placeholder="pk_xxx or sk_xxx"
												type="password"
											/>
										</div>
										<div className="space-y-2">
											<DevFieldLabel>Table name</DevFieldLabel>
											<select
												className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
												value={tableName}
												onChange={(e) => setTableName(e.target.value)}
											>
												{AVAILABLE_TABLES.map((table) => (
													<option key={table.id} value={table.id}>
														{table.label}
													</option>
												))}
											</select>
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div className="space-y-2">
												<DevFieldLabel>Limit</DevFieldLabel>
												<Input
													value={limit}
													onChange={(e) => setLimit(e.target.value)}
													inputMode="numeric"
													placeholder="25"
												/>
											</div>
											<div className="space-y-2">
												<DevFieldLabel>Offset</DevFieldLabel>
												<Input
													value={offset}
													onChange={(e) => setOffset(e.target.value)}
													inputMode="numeric"
													placeholder="0"
												/>
											</div>
										</div>
									</DevPanelCard>

									<div className="flex flex-wrap gap-2">
										<Button
											type="button"
											onClick={handleRunRequest}
											disabled={anyBusy || !apiKey.trim()}
										>
											<IconPlayerPlay className="size-4" />
											{runRequest.isPending ? "Running..." : "Run request"}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={handleReset}
										>
											<IconRefresh className="size-4" />
											Reset
										</Button>
										<Button
											type="button"
											variant="secondary"
											onClick={() => setActiveTab("preview")}
										>
											View request preview
										</Button>
									</div>
								</>
							)}
						</TabsContent>

						<TabsContent value="preview" className="space-y-4">
							{queryLocked ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Preview is locked</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Sign in as a full admin and end impersonation to run table
										queries.
									</p>
								</div>
							) : (
								<div className="grid gap-4 xl:grid-cols-2">
									<DevPanelCard
										title="Request preview"
										description="Live preview of the outbound GET request (API key masked)."
									>
										<DevJsonBlock
											maxHeightClassName="max-h-[28rem]"
											value={requestPreview}
										/>
									</DevPanelCard>

									<DevPanelCard
										title={
											runRequest.data
												? `Response preview (HTTP ${runRequest.data.status})`
												: "Response preview"
										}
										description={
											runRequest.data
												? runRequest.data.ok
													? "Successful response from the server."
													: "Error response — inspect body for details."
												: "Run a request on the Query tab to populate this panel."
										}
										contentClassName="space-y-4"
									>
										<div>
											<p className="mb-2 text-sm font-medium">Status</p>
											<Badge
												variant={
													runRequest.data?.ok
														? "default"
														: runRequest.data
															? "destructive"
															: "secondary"
												}
											>
												{runRequest.data
													? `HTTP ${runRequest.data.status}`
													: "No response yet"}
											</Badge>
										</div>
										<div>
											<p className="mb-2 text-sm font-medium">Headers</p>
											<DevJsonBlock
												maxHeightClassName="max-h-40"
												value={runRequest.data?.headers ?? null}
												emptyLabel="Run a request to see response headers."
											/>
										</div>
										<div>
											<p className="mb-2 text-sm font-medium">Body</p>
											<DevJsonBlock
												maxHeightClassName="max-h-[20rem]"
												value={runRequest.data?.body ?? null}
												emptyLabel="Run a request to see the response body."
											/>
										</div>
									</DevPanelCard>
								</div>
							)}
						</TabsContent>

						<TabsContent value="reference" className="space-y-4">
							<p className="text-sm leading-6 text-muted-foreground">
								Table-level read API exposed by{" "}
								<code className="rounded bg-muted px-1 py-0.5 text-xs">
									packages/cli
								</code>
								. Requires a valid Bearer API key; rows are scoped to the key
								owner.
							</p>

							<DevPanelCard title="Endpoint">
								<DevJsonBlock
									value={{
										method: "GET",
										path: "/api/v1/table",
										auth: "Authorization: Bearer <api_key>",
										query: {
											name: "session (required)",
											limit: "1–100, default 25",
											offset: "default 0",
										},
									}}
								/>
							</DevPanelCard>

							<DevPanelCard title="Available tables">
								<ul className="space-y-2 text-sm text-muted-foreground">
									{AVAILABLE_TABLES.map((table) => (
										<li key={table.id}>
											<code className="rounded bg-muted px-1">{table.id}</code>{" "}
											— {table.label}
										</li>
									))}
								</ul>
							</DevPanelCard>

							<DevPanelCard title="Workflow">
								<ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
									<li>
										Sign in as{" "}
										<code className="rounded bg-muted px-1">admin</code> above.
									</li>
									<li>
										Create an API key on the{" "}
										<Link
											to="/dev/api-playground"
											className="font-medium text-foreground underline-offset-4 hover:underline"
										>
											API key playground
										</Link>
										.
									</li>
									<li>Paste the key on the Query tab and run the request.</li>
									<li>
										Inspect request and response on the Request &amp; response
										tab.
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
