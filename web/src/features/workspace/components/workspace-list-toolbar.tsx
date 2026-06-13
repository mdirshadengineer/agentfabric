import { IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { CreateWorkspaceDialog } from "@/features/workspace/components/create-workspace-dialog"

export type WorkspaceSort = "name-asc" | "name-desc" | "newest" | "oldest"

type WorkspaceListToolbarProps = {
	search: string
	onSearchChange: (value: string) => void
	sort: WorkspaceSort
	onSortChange: (value: WorkspaceSort) => void
	showCreate: boolean
	onShowCreateChange: (open: boolean) => void
}

export function WorkspaceListToolbar({
	search,
	onSearchChange,
	sort,
	onSortChange,
	showCreate,
	onShowCreateChange,
}: WorkspaceListToolbarProps) {
	return (
		<div className="space-y-6 shrink-0">
			<h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative max-w-xs flex-1">
					<IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Search for a workspace"
						className="pl-9"
					/>
				</div>

				<Select
					value={sort}
					onValueChange={(v) => onSortChange(v as WorkspaceSort)}
				>
					<SelectTrigger className="w-full sm:w-40">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="name-asc">Name A–Z</SelectItem>
						<SelectItem value="name-desc">Name Z–A</SelectItem>
						<SelectItem value="newest">Newest</SelectItem>
						<SelectItem value="oldest">Oldest</SelectItem>
					</SelectContent>
				</Select>

				<div className="sm:ml-auto">
					<CreateWorkspaceDialog
						open={showCreate}
						onOpenChange={onShowCreateChange}
						showTrigger
						triggerLabel="New workspace"
					/>
				</div>
			</div>
		</div>
	)
}

export function WorkspaceListToolbarSkeleton() {
	return (
		<div className="space-y-6 shrink-0">
			<div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="h-9 max-w-xs flex-1 rounded-md bg-muted animate-pulse" />
				<div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
				<div className="h-9 w-36 rounded-md bg-muted animate-pulse sm:ml-auto" />
			</div>
		</div>
	)
}
