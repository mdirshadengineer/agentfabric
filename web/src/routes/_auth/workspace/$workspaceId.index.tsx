import { IconAlertCircle } from "@tabler/icons-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceMembers } from "@/features/workspace/components/workspace-members"
import { WorkspaceOverview } from "@/features/workspace/components/workspace-overview"
import { WorkspaceSettings } from "@/features/workspace/components/workspace-settings"
import { useWorkspaceDetail } from "@/features/workspace/queries/workspace-detail"

export const Route = createFileRoute("/_auth/workspace/$workspaceId/")({
	component: RouteComponent,
})

function RouteComponent() {
	const { workspaceId } = Route.useParams()
	const {
		data: workspace,
		isLoading,
		isError,
		error,
	} = useWorkspaceDetail(workspaceId)
	const [activeTab, setActiveTab] = useState("overview")

	if (isError) {
		return (
			<Empty>
				<EmptyMedia>
					<IconAlertCircle className="size-12 text-destructive" />
				</EmptyMedia>
				<EmptyTitle>Failed to load workspace</EmptyTitle>
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
			<div className="p-6 max-w-3xl mx-auto w-full space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-4">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-24" />
				</div>
				<Skeleton className="h-64 w-full" />
			</div>
		)
	}

	if (!workspace) return null

	return (
		<div className="p-6 max-w-3xl mx-auto w-full h-full flex flex-col overflow-hidden">
			<Breadcrumb className="mb-2 shrink-0">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link to="/workspace">Workspaces</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink>{workspace.name}</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<h1 className="text-xl font-semibold mb-6 shrink-0">{workspace.name}</h1>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="flex-1 flex flex-col overflow-hidden"
			>
				<TabsList className="mb-6 shrink-0">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>
				<ScrollArea className="flex-1">
					<TabsContent value="overview">
						<WorkspaceOverview workspace={workspace} />
					</TabsContent>
					<TabsContent value="members">
						<WorkspaceMembers
							workspaceId={workspaceId}
							members={workspace.members}
						/>
					</TabsContent>
					<TabsContent value="settings">
						<WorkspaceSettings workspace={workspace} />
					</TabsContent>
				</ScrollArea>
			</Tabs>
		</div>
	)
}
