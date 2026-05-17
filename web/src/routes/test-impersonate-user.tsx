import {
  IconCheck,
  IconMask,
  IconRefresh,
  IconShield,
  IconUser,
  IconUserCog,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
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

export const Route = createFileRoute("/test-impersonate-user")({
  component: RouteComponent,
})

type RoleDefinition = {
  id: string
  name: string
  description: string | null
  permissions: string[]
  createdAt: string
  updatedAt: string
}

type UserRecord = {
  id: string
  name: string
  email: string
  role: string | null
  createdAt: string
  updatedAt: string
}

type RequestState =
  | "idle"
  | "signing-in"
  | "signing-up"
  | "signing-out"
  | "bootstrapping"
  | "creating-role"
  | "updating-role"
  | "updating-user-role"
  | "impersonating"
  | "stopping-impersonation"
  | "refreshing"

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

async function requestManagement<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${authBaseURL}/api/v1/management${path}`, {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string
    code?: string
  }

  if (!response.ok) {
    throw new Error(
      payload.message || payload.code || `Request failed with ${response.status}`
    )
  }

  return payload as T
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

  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [roleName, setRoleName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [rolePermissions, setRolePermissions] = useState<string[]>([])
  const [replaceExistingUserRoles, setReplaceExistingUserRoles] =
    useState(false)

  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedUserRole, setSelectedUserRole] = useState("user")

  const [impersonateTargetId, setImpersonateTargetId] = useState("")

  const [lastPayload, setLastPayload] = useState<unknown>(null)

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  )

  useEffect(() => {
    void refreshAll()
  }, [])

  useEffect(() => {
    if (!selectedRole) {
      return
    }

    setRoleName(selectedRole.name)
    setRoleDescription(selectedRole.description ?? "")
    setRolePermissions(selectedRole.permissions ?? [])
  }, [selectedRole])

  async function refreshAll() {
    setRequestState("refreshing")
    setErrorMessage(null)
    try {
      const [session, me, roleResult] = await Promise.all([
        authClient.getSession(),
        requestManagement<{ user: unknown; session: unknown; isImpersonating: boolean }>(
          "/me"
        ),
        requestManagement<{ roles: RoleDefinition[] }>("/roles"),
      ])

      setSessionData(session)
      setMeData(me)
      setRoles(roleResult.roles)
      setLastPayload({ session, me, roles: roleResult.roles })

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
      setErrorMessage(error instanceof Error ? error.message : "Sign out failed")
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

  async function handleCreateRole() {
    setRequestState("creating-role")
    setErrorMessage(null)
    try {
      const result = await requestManagement<{ role: RoleDefinition }>("/roles", {
        method: "POST",
        body: JSON.stringify({
          name: roleName,
          description: roleDescription,
          permissions: rolePermissions,
        }),
      })
      setLastPayload(result)
      setStatusMessage(`Created role ${result.role.name}`)
      await refreshAll()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Create role failed"
      )
    } finally {
      setRequestState("idle")
    }
  }

  async function handleUpdateRole() {
    if (!selectedRoleId) {
      setErrorMessage("Select a role first")
      return
    }

    setRequestState("updating-role")
    setErrorMessage(null)
    try {
      const result = await requestManagement<{ message: string }>(
        `/roles/${selectedRoleId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: roleName,
            description: roleDescription,
            permissions: rolePermissions,
            replaceInUsers: replaceExistingUserRoles,
          }),
        }
      )
      setLastPayload(result)
      setStatusMessage(result.message)
      await refreshAll()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Update role failed"
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
              <Badge className="bg-emerald-500/15 text-emerald-800">Login</Badge>
              <Badge className="bg-cyan-500/15 text-cyan-800">Role CRUD</Badge>
              <Badge className="bg-violet-500/15 text-violet-800">Impersonation</Badge>
            </div>
            <CardTitle className="text-3xl">Admin Playground</CardTitle>
            <CardDescription>
              Use this page to sign in, bootstrap the first admin, create or update
              roles, assign roles to users, and impersonate users for support testing.
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
                <Button disabled={busy} variant="outline" onClick={handleSignUp}>
                  Sign up
                </Button>
                <Button disabled={busy} variant="outline" onClick={handleSignOut}>
                  Sign out
                </Button>
                <Button disabled={busy} variant="secondary" onClick={refreshAll}>
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
                <IconUserCog className="size-4" />
                Role Playground
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
              >
                <option value="">Select role to edit</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="role name (example: support_manager)"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
              />
              <Textarea
                placeholder="Role description"
                value={roleDescription}
                onChange={(event) => setRoleDescription(event.target.value)}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">Permissions</p>
                <div className="space-y-2 rounded-md border p-3 bg-slate-50">
                  {["manage_users", "view_audit", "manage_roles", "manage_api_keys"].map(
                    (perm) => (
                      <label key={perm} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={rolePermissions.includes(perm)}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setRolePermissions([...rolePermissions, perm])
                            } else {
                              setRolePermissions(
                                rolePermissions.filter((p) => p !== perm)
                              )
                            }
                          }}
                        />
                        <span className="text-slate-700">{perm}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={replaceExistingUserRoles}
                  onChange={(event) =>
                    setReplaceExistingUserRoles(event.target.checked)
                  }
                />
                Replace existing users using the old role name
              </label>
              <div className="flex flex-wrap gap-2">
                <Button disabled={busy} onClick={handleCreateRole}>
                  Create role
                </Button>
                <Button
                  disabled={busy || !selectedRoleId}
                  variant="outline"
                  onClick={handleUpdateRole}
                >
                  Update role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Roles</CardTitle>
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
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
              <Button disabled={busy || !selectedUserId} onClick={handleUpdateUserRole}>
                <IconCheck className="size-4" />
                Update user role
              </Button>
              <div className="max-h-60 overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
                {users.map((entry) => (
                  <p key={entry.id}>
                    {entry.email} | role: {entry.role ?? "none"} | created: {" "}
                    {formatTimestamp(entry.createdAt)}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

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
                <Button disabled={busy || !impersonateTargetId} onClick={handleImpersonate}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="size-4" />
              Role Capabilities Matrix
            </CardTitle>
            <CardDescription>
              Overview of permissions assigned to each role in your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Role</th>
                    <th className="text-left p-2 font-medium">manage_users</th>
                    <th className="text-left p-2 font-medium">view_audit</th>
                    <th className="text-left p-2 font-medium">manage_roles</th>
                    <th className="text-left p-2 font-medium">manage_api_keys</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-900">{role.name}</td>
                      <td className="p-2 text-center">
                        {role.permissions?.includes("manage_users") ? (
                          <Badge className="bg-green-100 text-green-800">✓</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {role.permissions?.includes("view_audit") ? (
                          <Badge className="bg-green-100 text-green-800">✓</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {role.permissions?.includes("manage_roles") ? (
                          <Badge className="bg-green-100 text-green-800">✓</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {role.permissions?.includes("manage_api_keys") ? (
                          <Badge className="bg-green-100 text-green-800">✓</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
