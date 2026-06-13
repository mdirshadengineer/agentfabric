import { IconAlertCircle, IconFolders, IconPlus } from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import {
	WorkspaceCard,
	WorkspaceCardSkeleton,
} from "@/features/workspace/components/workspace-card"
import {
	WorkspaceListToolbar,
	WorkspaceListToolbarSkeleton,
	type WorkspaceSort,
} from "@/features/workspace/components/workspace-list-toolbar"
import { useWorkspaces } from "@/features/workspace/queries/workspaces"
import type { Workspace } from "@/features/workspace/types"

export const Route = createFileRoute("/_auth/workspace/")({
	component: RouteComponent,
})

function sortWorkspaces(workspaces: Workspace[], sort: WorkspaceSort) {
	const sorted = [...workspaces]

	switch (sort) {
		case "name-asc":
			return sorted.sort((a, b) => a.name.localeCompare(b.name))
		case "name-desc":
			return sorted.sort((a, b) => b.name.localeCompare(a.name))
		case "newest":
			return sorted.sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
		case "oldest":
			return sorted.sort(
				(a, b) =>
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			)
		default:
			return sorted
	}
}

function filterWorkspaces(workspaces: Workspace[], search: string) {
	const query = search.trim().toLowerCase()
	if (!query) return workspaces

	return workspaces.filter(
		(ws) =>
			ws.name.toLowerCase().includes(query) ||
			ws.slug.toLowerCase().includes(query)
	)
}

function RouteComponent() {
	const { data: workspaces, isLoading, isError, error } = useWorkspaces()
	const [showCreate, setShowCreate] = useState(false)
	const [search, setSearch] = useState("")
	const [sort, setSort] = useState<WorkspaceSort>("name-asc")

	const workspaceList = workspaces ?? []

	const filteredWorkspaces = useMemo(
		() => sortWorkspaces(filterWorkspaces(workspaceList, search), sort),
		[workspaceList, search, sort]
	)

	if (isError) {
		return (
			<div className="px-6 py-8">
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
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="flex h-full flex-col px-6 py-8">
				<WorkspaceListToolbarSkeleton />
				<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<WorkspaceCardSkeleton key={i} />
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-col px-6 py-8">
			<WorkspaceListToolbar
				search={search}
				onSearchChange={setSearch}
				sort={sort}
				onSortChange={setSort}
				showCreate={showCreate}
				onShowCreateChange={setShowCreate}
			/>

			{workspaceList.length === 0 ? (
				<div className="flex flex-1 items-center justify-center py-12">
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
				</div>
			) : filteredWorkspaces.length === 0 ? (
				<div className="flex flex-1 items-center justify-center py-12">
					<Empty>
						<EmptyMedia>
							<IconFolders className="size-12 text-muted-foreground" />
						</EmptyMedia>
						<EmptyTitle>No workspaces found</EmptyTitle>
						<EmptyDescription>
							Try adjusting your search to find what you are looking for
						</EmptyDescription>
						<Button variant="outline" onClick={() => setSearch("")} size="sm">
							Clear search
						</Button>
					</Empty>
				</div>
			) : (
				<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{filteredWorkspaces.map((ws) => (
						<WorkspaceCard key={ws.id} workspace={ws} />
					))}
				</div>
			)}
		</div>
	)
}
