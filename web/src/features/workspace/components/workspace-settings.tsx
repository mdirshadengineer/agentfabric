import { IconTrash } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { type } from "arktype"
import { useState } from "react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	useDeleteWorkspace,
	useUpdateWorkspace,
} from "@/features/workspace/queries/workspace-mutations"
import { updateWorkspaceSchema } from "@/features/workspace/schemas"
import type { Workspace } from "@/features/workspace/types"

export function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
	const [name, setName] = useState(workspace.name)
	const [fieldError, setFieldError] = useState<string | null>(null)
	const updateWorkspace = useUpdateWorkspace()
	const deleteWorkspace = useDeleteWorkspace()
	const navigate = useNavigate()

	const handleSave = () => {
		const result = updateWorkspaceSchema({ name })
		if (result instanceof type.errors) {
			setFieldError(result.summary)
			return
		}
		setFieldError(null)
		updateWorkspace.mutate({ id: workspace.id, name })
	}

	const handleDelete = () => {
		deleteWorkspace.mutate(workspace.id, {
			onSuccess: () => {
				navigate({ to: "/workspace" })
			},
		})
	}

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="ws-name">Workspace Name</Label>
					<Input
						id="ws-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value)
							setFieldError(null)
						}}
					/>
					{fieldError ? (
						<p className="text-sm text-destructive">{fieldError}</p>
					) : null}
				</div>
				<Button
					onClick={handleSave}
					disabled={updateWorkspace.isPending || name === workspace.name}
				>
					{updateWorkspace.isPending ? "Saving..." : "Save Changes"}
				</Button>
				{updateWorkspace.isSuccess ? (
					<p className="text-sm text-green-600 dark:text-green-400">
						Workspace updated.
					</p>
				) : null}
			</div>

			<div className="border-t pt-6">
				<h3 className="text-sm font-semibold text-destructive mb-2">
					Danger Zone
				</h3>
				<p className="text-sm text-muted-foreground mb-4">
					Permanently delete this workspace and all its data.
				</p>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm">
							<IconTrash className="size-4 mr-2" />
							Delete Workspace
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Workspace?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. The workspace &ldquo;
								{workspace.name}&rdquo; and all members will be permanently
								removed.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleDelete}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{deleteWorkspace.isPending ? "Deleting..." : "Delete"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	)
}
