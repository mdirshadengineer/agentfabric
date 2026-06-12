import {
	IconCheck,
	IconMask,
	IconRefresh,
	IconShield,
	IconUser,
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
import { requestManagement } from "@/lib/api/management-client"
import type { UserRecord } from "@/lib/api/types"
import { authBaseURL, authClient, signOut } from "@/lib/auth"

export const Route = createFileRoute("/dev/impersonate-user")({
	component: RouteComponent,
})

type RequestState =
	| "idle"
	| "signing-in"
	| "signing-up"
	| "signing-out"
	| "bootstrapping"
	| "updating-user-role"
	| "impersonating"
	| "stopping-impersonation"
	| "refreshing"

const SUPPORTED_ROLES = ["user", "admin"] as const

function formatJson(value: unknown): string {
	if (value === undefined) {
		return ""
	}

	return JSON.stringify(value, null, 2)
}

function formatTimestamp(value: string | null | undefined): string {
	if (!value) {
		return "-"
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function RouteComponent() {
	const [requestState, setRequestState] = useState<RequestState>("idle")
	const [statusMessage, setStatusMessage] = useState("Ready")
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [sessionData, setSessionData] = useState<unknown>(null)
	const [meData, setMeData] = useState<unknown>(null)

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [name, setName] = useState("")

	const [users, setUsers] = useState<UserRecord[]>([])

	const [selectedUserId, setSelectedUserId] = useState("")
	const [selectedUserRole, setSelectedUserRole] = useState("user")

	const [impersonateTargetId, setImpersonateTargetId] = useState("")

	const [lastPayload, setLastPayload] = useState<unknown>(null)

	useEffect(() => {
		void refreshAll()
	}, [])

	async function refreshAll() {
		setRequestState("refreshing")
		setErrorMessage(null)
		try {
			const [session, me] = await Promise.all([
				authClient.getSession(),
				requestManagement<{
					user: unknown
					session: unknown
					isImpersonating: boolean
				}>("/me"),
			])

			setSessionData(session)
			setMeData(me)
			setLastPayload({ session, me })

			try {
				const userResult = await requestManagement<{ users: UserRecord[] }>(
					"/users"
				)
				setUsers(userResult.users)
				setLastPayload((previous: any) => ({
					...(typeof previous === "object" && previous ? previous : {}),
					users: userResult.users,
				}))
			} catch {
				setUsers([])
			}

			setStatusMessage("Playground refreshed")
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Unable to refresh state"
			)
			setStatusMessage("Refresh failed")
		} finally {
			setRequestState("idle")
		}
	}

	async function handleSignIn() {
		setRequestState("signing-in")
		setErrorMessage(null)
		try {
			const response = await authClient.signIn.email({
				email: email.trim(),
				password,
			})
			setLastPayload(response)
			setStatusMessage("Signed in")
			await refreshAll()
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Sign in failed")
		} finally {
			setRequestState("idle")
		}
	}

	async function handleSignUp() {
		setRequestState("signing-up")
		setErrorMessage(null)
		try {
			const response = await authClient.signUp.email({
				name: name.trim() || "New User",
				email: email.trim(),
				password,
			})
			setLastPayload(response)
			setStatusMessage("Signed up and logged in")
			await refreshAll()
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Sign up failed")
		} finally {
			setRequestState("idle")
		}
	}

	async function handleSignOut() {
		setRequestState("signing-out")
		setErrorMessage(null)
		try {
			await signOut()
			setSessionData(null)
			setUsers([])
			setStatusMessage("Signed out")
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Sign out failed"
			)
		} finally {
			setRequestState("idle")
		}
	}

	async function handleBootstrapAdmin() {
		setRequestState("bootstrapping")
		setErrorMessage(null)
		try {
			const result = await requestManagement<{ message: string }>(
				"/bootstrap-admin",
				{ method: "POST" }
			)
			setLastPayload(result)
			setStatusMessage(result.message)
			await refreshAll()
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Bootstrap admin failed"
			)
		} finally {
			setRequestState("idle")
		}
	}

	async function handleUpdateUserRole() {
		if (!selectedUserId) {
			setErrorMessage("Select a user first")
			return
		}

		setRequestState("updating-user-role")
		setErrorMessage(null)
		try {
			const result = await requestManagement<{ message: string }>(
				`/users/${selectedUserId}/role`,
				{
					method: "PATCH",
					body: JSON.stringify({ role: selectedUserRole }),
				}
			)
			setLastPayload(result)
			setStatusMessage(result.message)
			await refreshAll()
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Update user role failed"
			)
		} finally {
			setRequestState("idle")
		}
	}

	async function handleImpersonate() {
		if (!impersonateTargetId) {
			setErrorMessage("Select a user to impersonate")
			return
		}

		setRequestState("impersonating")
		setErrorMessage(null)
		try {
			const result = await authClient.admin.impersonateUser({
				userId: impersonateTargetId,
			})
			setLastPayload(result)
			setStatusMessage("Impersonation started")
			await refreshAll()
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Impersonation failed"
			)
		} finally {
			setRequestState("idle")
		}
	}

	async function handleStopImpersonation() {
		setRequestState("stopping-impersonation")
		setErrorMessage(null)
		try {
			const result = await authClient.admin.stopImpersonating()
			setLastPayload(result)
			setStatusMessage("Stopped impersonation")
			await refreshAll()
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : "Stop impersonation failed"
			)
		} finally {
			setRequestState("idle")
		}
	}

	const busy = requestState !== "idle"

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_8%_6%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_95%_14%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f0f9ff_50%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
			<div className="mx-auto grid w-full max-w-7xl gap-6">
				<Card className="border-white/30 bg-white/80 shadow-[0_30px_120px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
					<CardHeader className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Badge className="bg-emerald-500/15 text-emerald-800">
								Login
							</Badge>
							<Badge className="bg-cyan-500/15 text-cyan-800">
								Admin/User Roles
							</Badge>
							<Badge className="bg-violet-500/15 text-violet-800">
								Impersonation
							</Badge>
						</div>
						<CardTitle className="text-3xl">Admin Playground</CardTitle>
						<CardDescription>
							Use this page to sign in, bootstrap the first admin, assign
							admin/user roles, and impersonate users for support testing.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 text-sm sm:grid-cols-3">
						<div className="rounded-xl border border-slate-200 bg-white/70 p-3">
							<p className="font-medium text-slate-900">Server</p>
							<p className="text-slate-600">{authBaseURL}</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-white/70 p-3">
							<p className="font-medium text-slate-900">State</p>
							<p className="text-slate-600">{requestState}</p>
						</div>
						<div className="rounded-xl border border-slate-200 bg-white/70 p-3">
							<p className="font-medium text-slate-900">Status</p>
							<p className="text-slate-600">{statusMessage}</p>
						</div>
					</CardContent>
				</Card>

				{errorMessage ? (
					<div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
						{errorMessage}
					</div>
				) : null}

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<IconUser className="size-4" />
								Authentication
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<Input
								placeholder="Name (for sign-up)"
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
							<Input
								placeholder="Email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
							/>
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
							<div className="flex flex-wrap gap-2">
								<Button disabled={busy} onClick={handleSignIn}>
									Sign in
								</Button>
								<Button
									disabled={busy}
									variant="outline"
									onClick={handleSignUp}
								>
									Sign up
								</Button>
								<Button
									disabled={busy}
									variant="outline"
									onClick={handleSignOut}
								>
									Sign out
								</Button>
								<Button
									disabled={busy}
									variant="secondary"
									onClick={refreshAll}
								>
									<IconRefresh className="size-4" />
									Refresh
								</Button>
							</div>
							<Button
								disabled={busy}
								variant="secondary"
								onClick={handleBootstrapAdmin}
							>
								<IconShield className="size-4" />
								Bootstrap Admin
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<IconShield className="size-4" />
								User Roles
							</CardTitle>
							<CardDescription>
								Admin-only listing of users for role assignment.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<select
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								value={selectedUserId}
								onChange={(event) => setSelectedUserId(event.target.value)}
							>
								<option value="">Select user</option>
								{users.map((userItem) => (
									<option key={userItem.id} value={userItem.id}>
										{userItem.email} ({userItem.role ?? "no-role"})
									</option>
								))}
							</select>
							<select
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								value={selectedUserRole}
								onChange={(event) => setSelectedUserRole(event.target.value)}
							>
								{SUPPORTED_ROLES.map((role) => (
									<option key={role} value={role}>
										{role}
									</option>
								))}
							</select>
							<Button
								disabled={busy || !selectedUserId}
								onClick={handleUpdateUserRole}
							>
								<IconCheck className="size-4" />
								Update user role
							</Button>
							<div className="max-h-60 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
								{users.map((entry) => (
									<p key={entry.id}>
										{entry.email} | role: {entry.role ?? "none"} | created:{" "}
										{formatTimestamp(entry.createdAt)}
									</p>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<IconMask className="size-4" />
								Impersonation
							</CardTitle>
							<CardDescription>
								Choose a target user and start/stop impersonation.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<select
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								value={impersonateTargetId}
								onChange={(event) => setImpersonateTargetId(event.target.value)}
							>
								<option value="">Select user to impersonate</option>
								{users.map((userItem) => (
									<option key={userItem.id} value={userItem.id}>
										{userItem.email}
									</option>
								))}
							</select>
							<div className="flex flex-wrap gap-2">
								<Button
									disabled={busy || !impersonateTargetId}
									onClick={handleImpersonate}
								>
									Start impersonation
								</Button>
								<Button
									disabled={busy}
									variant="outline"
									onClick={handleStopImpersonation}
								>
									Stop impersonation
								</Button>
							</div>
							<pre className="max-h-60 overflow-auto rounded-md border bg-muted/20 p-3 text-xs leading-5">
								{formatJson(meData) || "No session data yet."}
							</pre>
						</CardContent>
					</Card>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Auth Session Payload</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="max-h-96 overflow-auto rounded-md border bg-muted/20 p-3 text-xs leading-5">
								{formatJson(sessionData) || "No active auth session."}
							</pre>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Last Response</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="max-h-96 overflow-auto rounded-md border bg-muted/20 p-3 text-xs leading-5">
								{formatJson(lastPayload) || "No action run yet."}
							</pre>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
