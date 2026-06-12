import { IconPlus, IconTrash, IconUserPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { type } from "arktype"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { userSearchQueryOptions } from "@/features/workspace/queries/member-search"
import {
	useAddWorkspaceMember,
	useRemoveWorkspaceMember,
	useUpdateMemberRole,
} from "@/features/workspace/queries/workspace-mutations"
import { addMemberSchema } from "@/features/workspace/schemas"
import type { WorkspaceMember } from "@/features/workspace/types"

export function WorkspaceMembers({
	workspaceId,
	members,
}: {
	workspaceId: string
	members: WorkspaceMember[]
}) {
	const [email, setEmail] = useState("")
	const [role, setRole] = useState("member")
	const [showAddForm, setShowAddForm] = useState(false)
	const addMember = useAddWorkspaceMember()
	const removeMember = useRemoveWorkspaceMember()
	const updateRole = useUpdateMemberRole()

	const { data: searchResults } = useQuery(userSearchQueryOptions(email))

	const handleAddMember = () => {
		if (!searchResults?.[0]) return
		const input = { userId: searchResults[0].id, role }
		const result = addMemberSchema(input)
		if (result instanceof type.errors) return
		addMember.mutate(
			{ ...input, workspaceId },
			{
				onSuccess: () => {
					setEmail("")
					setRole("member")
					setShowAddForm(false)
				},
			}
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium text-muted-foreground">
					{members.length} member{members.length !== 1 ? "s" : ""}
				</h3>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowAddForm((prev) => !prev)}
				>
					<IconUserPlus className="size-4 mr-2" />
					Add Member
				</Button>
			</div>

			{showAddForm ? (
				<div className="flex items-end gap-3 p-4 border rounded-lg bg-muted/30">
					<div className="flex-1 space-y-1">
						<span className="text-xs text-muted-foreground">Email</span>
						<Input
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="user@example.com"
							className="h-9"
						/>
						{searchResults && searchResults.length > 0 && email.length >= 2 ? (
							<p className="text-xs text-muted-foreground">
								Found: {searchResults[0].name} ({searchResults[0].email})
							</p>
						) : null}
					</div>
					<Select value={role} onValueChange={setRole}>
						<SelectTrigger className="w-28 h-9">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="member">Member</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
						</SelectContent>
					</Select>
					<Button
						size="sm"
						onClick={handleAddMember}
						disabled={!searchResults?.[0] || addMember.isPending}
					>
						<IconPlus className="size-4 mr-1" />
						Add
					</Button>
				</div>
			) : null}

			<div className="space-y-1">
				{members.map((member) => (
					<div
						key={member.id}
						className="flex items-center justify-between p-3 border rounded-lg"
					>
						<div className="flex items-center gap-3 min-w-0">
							<div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
								<span className="text-xs font-semibold text-primary">
									{member.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
								</span>
							</div>
							<div className="min-w-0">
								<p className="text-sm font-medium truncate">
									{member.user?.name ?? "Unknown"}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{member.user?.email ?? ""}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<Select
								value={member.role}
								onValueChange={(newRole) =>
									updateRole.mutate({
										workspaceId,
										userId: member.userId,
										role: newRole,
									})
								}
								disabled={member.role === "owner"}
							>
								<SelectTrigger className="h-8 w-24 text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="member">Member</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									{member.role === "owner" ? (
										<SelectItem value="owner">Owner</SelectItem>
									) : null}
								</SelectContent>
							</Select>
							{member.role !== "owner" ? (
								<Button
									variant="ghost"
									size="icon"
									className="size-8 text-muted-foreground hover:text-destructive"
									onClick={() =>
										removeMember.mutate({ workspaceId, userId: member.userId })
									}
								>
									<IconTrash className="size-4" />
								</Button>
							) : null}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
