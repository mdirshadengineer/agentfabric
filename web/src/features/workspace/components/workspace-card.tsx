import { IconDotsVertical, IconExternalLink } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Workspace } from "@/features/workspace/types"

function formatCreatedAt(dateString: string) {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(dateString))
}

function WorkspaceInitial({ name }: { name: string }) {
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
			<span className="text-sm font-semibold text-primary">
				{name.charAt(0).toUpperCase()}
			</span>
		</div>
	)
}

type WorkspaceCardProps = {
	workspace: Workspace
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
	const navigate = useNavigate()

	const openWorkspace = () => {
		navigate({
			to: "/workspace/$workspaceId",
			params: { workspaceId: workspace.id },
		})
	}

	return (
		<Card
			className="flex min-h-[120px] cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/20"
			onClick={openWorkspace}
		>
			<div className="flex items-start gap-3">
				<WorkspaceInitial name={workspace.name} />
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-medium">{workspace.name}</h3>
					<p className="truncate text-sm text-muted-foreground">
						{workspace.slug}
					</p>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0 -mr-1 -mt-1"
							aria-label={`Actions for ${workspace.name}`}
							onClick={(e) => e.stopPropagation()}
						>
							<IconDotsVertical className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
						<DropdownMenuItem onClick={openWorkspace}>
							<IconExternalLink className="size-4" />
							Open
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="mt-auto flex items-center gap-2">
				<Badge variant="secondary" className="text-[10px] font-normal">
					Created {formatCreatedAt(workspace.createdAt)}
				</Badge>
			</div>
		</Card>
	)
}

export function WorkspaceCardSkeleton() {
	return (
		<div className="flex min-h-[120px] flex-col gap-3 rounded-lg border bg-card p-4">
			<div className="flex items-start gap-3">
				<div className="size-8 shrink-0 rounded-md bg-muted animate-pulse" />
				<div className="min-w-0 flex-1 space-y-2">
					<div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
					<div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
				</div>
			</div>
			<div className="mt-auto h-5 w-28 rounded bg-muted animate-pulse" />
		</div>
	)
}
