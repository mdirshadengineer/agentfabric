import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { WorkspaceWithMembers } from "@/features/workspace/types"

export function WorkspaceOverview({
	workspace,
}: {
	workspace: WorkspaceWithMembers
}) {
	const memberCount = workspace.members.length
	const adminCount = workspace.members.filter(
		(m) => m.role === "admin" || m.role === "owner"
	).length

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Members
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{memberCount}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Admins
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{adminCount}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Slug
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="secondary">{workspace.slug}</Badge>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
