import { IconAlertCircle, IconFolders, IconPlus } from "@tabler/icons-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateWorkspaceDialog } from "@/features/workspace/components/create-workspace-dialog"
import { useWorkspaces } from "@/features/workspace/queries/workspaces"

export const Route = createFileRoute("/_auth/workspace/")({
	component: RouteComponent,
})

function RouteComponent() {
	const { data: workspaces, isLoading, isError, error } = useWorkspaces()
	const [showCreate, setShowCreate] = useState(false)
	const navigate = useNavigate()

	if (isError) {
		return (
			<Empty>
				<EmptyMedia>
					<IconAlertCircle className="size-12 text-destructive" />
				</EmptyMedia>
				<EmptyTitle>Failed to load workspaces</EmptyTitle>
				<EmptyDescription>
					{error instanceof Error
						? error.message
						: "An unexpected error occurred"}
				</EmptyDescription>
			</Empty>
		)
	}

	if (isLoading) {
		return (
			<div className="p-6 space-y-4 max-w-2xl mx-auto w-full">
				<div className="flex items-center justify-between">
					<Skeleton className="h-7 w-32" />
					<Skeleton className="h-9 w-36" />
				</div>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-16 w-full" />
				))}
			</div>
		)
	}

	const workspaceList = workspaces ?? []

	return (
		<div className="p-6 max-w-2xl mx-auto w-full h-full flex flex-col">
			<div className="flex items-center justify-between mb-6 shrink-0">
				<h1 className="text-xl font-semibold">Workspaces</h1>
				<CreateWorkspaceDialog open={showCreate} onOpenChange={setShowCreate} />
			</div>

			{workspaceList.length === 0 ? (
				<Empty>
					<EmptyMedia>
						<IconFolders className="size-12 text-muted-foreground" />
					</EmptyMedia>
					<EmptyTitle>No workspaces yet</EmptyTitle>
					<EmptyDescription>
						Create your first workspace to start collaborating
					</EmptyDescription>
					<Button onClick={() => setShowCreate(true)} size="sm">
						<IconPlus className="size-4 mr-2" />
						Create Workspace
					</Button>
				</Empty>
			) : (
				<ScrollArea className="flex-1">
					<div className="space-y-3">
						{workspaceList.map((ws) => (
							<Card
								key={ws.id}
								className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
								onClick={() =>
									navigate({
										to: "/workspace/$workspaceId",
										params: { workspaceId: ws.id },
									})
								}
							>
								<div className="flex items-center gap-3">
									<div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
										<span className="text-sm font-semibold text-primary">
											{ws.name.charAt(0).toUpperCase()}
										</span>
									</div>
									<div className="min-w-0">
										<h3 className="font-medium truncate">{ws.name}</h3>
										<Badge variant="secondary" className="text-[10px] py-0 h-4">
											{ws.slug}
										</Badge>
									</div>
								</div>
							</Card>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	)
}
