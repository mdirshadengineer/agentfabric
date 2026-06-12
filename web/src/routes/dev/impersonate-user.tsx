import {
	IconCheck,
	IconChevronDown,
	IconLock,
	IconMask,
	IconRefresh,
	IconShield,
	IconUser,
} from "@tabler/icons-react"
import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { type } from "arktype"
import { useEffect, useState } from "react"

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
import type { MeResponse } from "@/lib/api/types"
import {
	ADMIN_APP_ROLES,
	type AdminAppRole,
	authBaseURL,
	authClient,
	impersonateAdminUser,
	listAdminUsers,
	setAdminUserRole,
	signOut,
	stopAdminImpersonation,
} from "@/lib/auth"
import { getDeviceId } from "@/lib/device-manager"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dev/impersonate-user")({
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

type AdminPlaygroundTab = "roles" | "impersonation" | "debug"
type AccountMode = "signin" | "signup"
type SignInVars = { email: string; password: string }
type SignUpVars = { name: string; email: string; password: string }

function formatTimestamp(value: string | Date | null | undefined): string {
	if (!value) return "-"
	const date = value instanceof Date ? value : new Date(value)
	return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const meQueryOptions = queryOptions({
	queryKey: queryKeys.management.me(),
	queryFn: () => requestManagement<MeResponse>("/me"),
	staleTime: 15_000,
})

const adminUsersQueryOptions = queryOptions({
	queryKey: queryKeys.admin.users(),
	queryFn: () => listAdminUsers(),
	staleTime: 30_000,
})

function formatUserRole(role: string | null | undefined): string {
	return role?.trim() || "user"
}

function RouteComponent() {
	const queryClient = useQueryClient()
	const [activeTab, setActiveTab] = useState<AdminPlaygroundTab>("roles")
	const [accountMode, setAccountMode] = useState<AccountMode>("signin")
	const [actionMessage, setActionMessage] = useState<string | null>(null)
	const [deviceId, setDeviceId] = useState<string | null>(null)
	const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false)

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [name, setName] = useState("")
	const [selectedUserId, setSelectedUserId] = useState("")
	const [selectedUserRole, setSelectedUserRole] = useState<AdminAppRole>("user")
	const [impersonateTargetId, setImpersonateTargetId] = useState("")
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
	const canUseAdminPlugin =
		Boolean(meData?.canUseAdminPlugin) && !isImpersonating
	const canManageRoles = Boolean(meData?.canManageRoles) && !isImpersonating
	const canAccessImpersonation = canUseAdminPlugin || isImpersonating

	const usersQuery = useQuery({
		...adminUsersQueryOptions,
		enabled: isAuthenticated && canUseAdminPlugin,
	})

	const users = usersQuery.data?.users ?? []

	useEffect(() => {
		if (isImpersonating) {
			setActiveTab("impersonation")
		}
	}, [isImpersonating])

	const authStatusMessage = "Sign in above to manage roles and impersonation."
	const adminStatusMessage =
		"Admin access required. Set user.role to 'admin' or 'operations_admin' in the database, or ask a full admin to grant a role via setRole."
	const impersonatingStatusMessage = isImpersonating
		? `Impersonating ${sessionData?.user?.email ?? "another user"}. End impersonation to return to your admin session.`
		: null
	const statusMessage =
		actionMessage ??
		(isAuthenticated
			? isImpersonating
				? impersonatingStatusMessage
				: canUseAdminPlugin
					? null
					: adminStatusMessage
			: authStatusMessage)

	function refreshAll() {
		queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() })
		queryClient.invalidateQueries({ queryKey: queryKeys.management.me() })
		queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() })
	}

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
			setActiveTab("roles")
			refreshAll()
		},
	})

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
			setActiveTab("roles")
			refreshAll()
		},
	})

	const signOutMutation = useMutation({
		mutationFn: signOut,
		onSuccess: () => {
			setSelectedUserId("")
			setImpersonateTargetId("")
			setActionMessage("Signed out.")
			refreshAll()
		},
	})

	const updateUserRole = useMutation({
		mutationFn: (vars: { userId: string; role: AdminAppRole }) =>
			setAdminUserRole(vars.userId, vars.role),
		onSuccess: () => {
			setActionMessage("User role updated via authClient.admin.setRole.")
			refreshAll()
		},
	})

	const impersonate = useMutation({
		mutationFn: (vars: { userId: string }) => impersonateAdminUser(vars.userId),
		onSuccess: () => {
			setActionMessage("Impersonation started.")
			setActiveTab("impersonation")
			refreshAll()
		},
	})

	const stopImpersonation = useMutation({
		mutationFn: stopAdminImpersonation,
		onSuccess: () => {
			setActionMessage("Impersonation stopped.")
			refreshAll()
		},
	})

	const anyBusy =
		signIn.isPending ||
		signUp.isPending ||
		signOutMutation.isPending ||
		updateUserRole.isPending ||
		impersonate.isPending ||
		stopImpersonation.isPending

	const activeError =
		signIn.error ||
		signUp.error ||
		signOutMutation.error ||
		updateUserRole.error ||
		impersonate.error ||
		stopImpersonation.error

	const recentResponses = [
		signIn.data,
		signUp.data,
		updateUserRole.data,
		impersonate.data,
		stopImpersonation.data,
	].filter(Boolean)

	return (
		<div className="space-y-6">
			<DevPageHeader
				icon={<IconMask className="size-5" />}
				badges={
					<>
						<Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">
							Roles
						</Badge>
						<Badge className="bg-violet-500/15 text-violet-800 dark:text-violet-200">
							Impersonation
						</Badge>
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
				title="Admin Playground"
				description="Roles: user (default), operations_admin (list/impersonate), admin (full access). Enforced via Better Auth admin access control."
				meta={
					<DevStatGrid
						items={[
							{ label: "Server", value: authBaseURL, mono: true },
							{
								label: isImpersonating ? "Viewing as" : "Signed in as",
								value: sessionData?.user?.email ?? "Not signed in",
							},
							{
								label: isImpersonating ? "Impersonated role" : "Role",
								value: formatUserRole(sessionData?.user?.role),
							},
							{ label: "Users loaded", value: users.length },
						]}
					/>
				}
			/>

			<DevPanelCard
				title={
					<span className="inline-flex items-center gap-2">
						<IconUser className="size-4" />
						Authentication
					</span>
				}
				contentClassName="space-y-4"
			>
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
											: canUseAdminPlugin
												? "default"
												: "secondary"
									}
									className={
										!isImpersonating && isOperationsAdmin && !isFullAdmin
											? "bg-cyan-500/15 text-cyan-800 dark:text-cyan-200"
											: undefined
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
									disabled={anyBusy}
									variant="secondary"
									size="sm"
									onClick={refreshAll}
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
									disabled={anyBusy}
									variant="destructive"
									size="sm"
									onClick={() => signOutMutation.mutate()}
								>
									Sign out
								</Button>
							</div>
						</div>

						{!canUseAdminPlugin && isAuthenticated && !isImpersonating ? (
							<p className="text-xs leading-5 text-muted-foreground">
								Grant admin access in the database, e.g.{" "}
								<code className="rounded bg-muted px-1">
									UPDATE &quot;user&quot; SET role = &apos;admin&apos; WHERE
									email = &apos;{sessionData?.user?.email}&apos;;
								</code>{" "}
								or{" "}
								<code className="rounded bg-muted px-1">
									role = &apos;operations_admin&apos;
								</code>{" "}
								for restricted access. Full admins can then use setRole for
								others.
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
							Sign in to assign roles and impersonate users.
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
										value={name}
										onChange={(e) => setName(e.target.value)}
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
									disabled={anyBusy}
									onClick={() => signUp.mutate({ name, email, password })}
								>
									{signUp.isPending ? "Signing up..." : "Sign up"}
								</Button>
							) : (
								<Button
									disabled={anyBusy}
									onClick={() => signIn.mutate({ email, password })}
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
						onValueChange={(value) => setActiveTab(value as AdminPlaygroundTab)}
					>
						<TabsList className="mb-6 h-auto w-full flex-wrap justify-start gap-1">
							<TabsTrigger value="roles" className="gap-1.5 px-3 py-2">
								<IconShield className="size-4" />
								Roles
							</TabsTrigger>
							<TabsTrigger value="impersonation" className="gap-1.5 px-3 py-2">
								<IconMask className="size-4" />
								Impersonation
							</TabsTrigger>
							<TabsTrigger value="debug" className="gap-1.5 px-3 py-2">
								Debug
							</TabsTrigger>
						</TabsList>

						<TabsContent value="roles" className="space-y-4">
							{!isAuthenticated ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Roles are locked</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Sign in using the authentication panel above to assign user
										roles.
									</p>
								</div>
							) : isImpersonating ? (
								<div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-8 text-center">
									<IconMask className="mx-auto mb-3 size-8 text-amber-700 dark:text-amber-300" />
									<p className="text-sm font-medium">Impersonation active</p>
									<p className="mt-1 text-sm text-muted-foreground">
										End impersonation on the Impersonation tab to manage roles
										as your admin account.
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
							) : !canUseAdminPlugin ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Admin access required</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Set{" "}
										<code className="rounded bg-muted px-1 text-xs">
											user.role
										</code>{" "}
										to{" "}
										<code className="rounded bg-muted px-1 text-xs">admin</code>{" "}
										or{" "}
										<code className="rounded bg-muted px-1 text-xs">
											operations_admin
										</code>{" "}
										in the database, or ask a full admin to use setRole.
									</p>
								</div>
							) : (
								<>
									{canManageRoles ? (
										<DevPanelCard
											title="Assign role"
											description={
												<>
													Full admins only. Updates roles via{" "}
													<code className="rounded bg-muted px-1 py-0.5 text-xs">
														authClient.admin.setRole
													</code>
													.
												</>
											}
											contentClassName="space-y-3"
										>
											<div className="space-y-2">
												<DevFieldLabel>User</DevFieldLabel>
												<select
													className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
													value={selectedUserId}
													onChange={(e) => setSelectedUserId(e.target.value)}
												>
													<option value="">Select user</option>
													{users.map((u) => (
														<option key={u.id} value={u.id}>
															{u.email} ({u.role ?? "no-role"})
														</option>
													))}
												</select>
											</div>
											<div className="space-y-2">
												<DevFieldLabel>Role</DevFieldLabel>
												<select
													className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
													value={selectedUserRole}
													onChange={(e) =>
														setSelectedUserRole(e.target.value as AdminAppRole)
													}
												>
													{ADMIN_APP_ROLES.map((role) => (
														<option key={role} value={role}>
															{role}
														</option>
													))}
												</select>
											</div>
										</DevPanelCard>
									) : (
										<DevPanelCard
											title="Role assignment locked"
											description="operations_admin can list users but cannot change roles. Only full admin can call setRole."
										>
											<p className="text-sm text-muted-foreground">
												You can still browse the user list below.
											</p>
										</DevPanelCard>
									)}

									{canManageRoles ? (
										<div className="flex flex-wrap gap-2">
											<Button
												disabled={anyBusy || !selectedUserId}
												onClick={() =>
													updateUserRole.mutate({
														userId: selectedUserId,
														role: selectedUserRole,
													})
												}
											>
												<IconCheck className="size-4" />
												{updateUserRole.isPending
													? "Updating..."
													: "Update user role"}
											</Button>
										</div>
									) : null}

									<DevPanelCard
										title="All users"
										description={
											<>
												Via{" "}
												<code className="rounded bg-muted px-1 py-0.5 text-xs">
													authClient.admin.listUsers
												</code>
												.
											</>
										}
									>
										<div className="max-h-60 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
											{users.length === 0 ? (
												<p className="text-muted-foreground">
													No users returned from listUsers.
												</p>
											) : (
												users.map((entry) => (
													<p key={entry.id}>
														{entry.email} | role: {entry.role ?? "none"} |
														created: {formatTimestamp(entry.createdAt)}
													</p>
												))
											)}
										</div>
									</DevPanelCard>
								</>
							)}
						</TabsContent>

						<TabsContent value="impersonation" className="space-y-4">
							{!isAuthenticated ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Impersonation is locked</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Sign in using the authentication panel above to impersonate
										users.
									</p>
								</div>
							) : !canAccessImpersonation ? (
								<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
									<IconLock className="mx-auto mb-3 size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Admin access required</p>
									<p className="mt-1 text-sm text-muted-foreground">
										Impersonation requires{" "}
										<code className="rounded bg-muted px-1 text-xs">admin</code>{" "}
										or{" "}
										<code className="rounded bg-muted px-1 text-xs">
											operations_admin
										</code>{" "}
										(Better Auth user:impersonate permission).
									</p>
								</div>
							) : (
								<>
									{isImpersonating ? (
										<DevPanelCard
											title="Active impersonation"
											description={
												<>
													Session is acting as{" "}
													<strong>{sessionData?.user?.email}</strong>. Use{" "}
													<code className="rounded bg-muted px-1 py-0.5 text-xs">
														authClient.admin.stopImpersonating
													</code>{" "}
													to restore your admin account.
												</>
											}
										>
											<p className="text-sm text-muted-foreground">
												Admin id:{" "}
												<code className="rounded bg-muted px-1">
													{sessionImpersonatedBy ?? "unknown"}
												</code>
											</p>
										</DevPanelCard>
									) : null}

									<DevPanelCard
										title="Target user"
										description={
											<>
												Uses{" "}
												<code className="rounded bg-muted px-1 py-0.5 text-xs">
													authClient.admin.impersonateUser
												</code>{" "}
												and{" "}
												<code className="rounded bg-muted px-1 py-0.5 text-xs">
													authClient.admin.stopImpersonating
												</code>
												.
											</>
										}
										contentClassName="space-y-3"
									>
										<div className="space-y-2">
											<DevFieldLabel>User to impersonate</DevFieldLabel>
											<select
												className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
												disabled={isImpersonating}
												value={
													isImpersonating
														? (sessionData?.user?.id ?? "")
														: impersonateTargetId
												}
												onChange={(e) => setImpersonateTargetId(e.target.value)}
											>
												<option value="">
													{isImpersonating
														? "Impersonation active"
														: "Select user to impersonate"}
												</option>
												{isImpersonating && sessionData?.user ? (
													<option value={sessionData.user.id}>
														{sessionData.user.email}
													</option>
												) : (
													users.map((u) => (
														<option key={u.id} value={u.id}>
															{u.email}
														</option>
													))
												)}
											</select>
										</div>
									</DevPanelCard>

									<div className="flex flex-wrap gap-2">
										<Button
											disabled={
												anyBusy || !impersonateTargetId || isImpersonating
											}
											onClick={() =>
												impersonate.mutate({ userId: impersonateTargetId })
											}
										>
											{impersonate.isPending
												? "Starting..."
												: "Start impersonation"}
										</Button>
										<Button
											disabled={anyBusy || !isImpersonating}
											variant={isImpersonating ? "destructive" : "outline"}
											onClick={() => stopImpersonation.mutate()}
										>
											{stopImpersonation.isPending
												? "Ending..."
												: "End impersonation"}
										</Button>
									</div>

									<DevPanelCard
										title="Management /me"
										description="Current user and impersonation state from GET /api/v1/management/me."
									>
										<DevJsonBlock
											value={meData}
											maxHeightClassName="max-h-60"
											emptyLabel="No session data yet."
										/>
									</DevPanelCard>
								</>
							)}
						</TabsContent>

						<TabsContent value="debug" className="space-y-4">
							<DevPanelCard title="Auth session payload">
								<DevJsonBlock
									value={sessionData}
									maxHeightClassName="max-h-96"
									emptyLabel="No active auth session."
								/>
							</DevPanelCard>

							<DevPanelCard title="Recent responses">
								<DevJsonBlock
									value={recentResponses.length > 0 ? recentResponses : null}
									maxHeightClassName="max-h-96"
									emptyLabel="No action run yet."
								/>
							</DevPanelCard>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	)
}
