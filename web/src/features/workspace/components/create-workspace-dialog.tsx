import { IconPlus } from "@tabler/icons-react"
import { type } from "arktype"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateWorkspace } from "@/features/workspace/queries/workspace-mutations"
import { createWorkspaceSchema } from "@/features/workspace/schemas"

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [name, setName] = useState("")
	const [fieldError, setFieldError] = useState<string | null>(null)
	const createWorkspace = useCreateWorkspace()

	const handleSubmit = async () => {
		const result = createWorkspaceSchema({ name })
		if (result instanceof type.errors) {
			setFieldError(result.summary)
			return
		}
		setFieldError(null)
		createWorkspace.mutate(
			{ name },
			{
				onSuccess: () => {
					setName("")
					onOpenChange(false)
				},
			}
		)
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogTrigger asChild>
					<Button size="sm">
						<IconPlus className="size-4 mr-2" />
						New Workspace
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Workspace</DialogTitle>
						<DialogDescription>
							Create a new workspace to organize agents and collaborate.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Workspace Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => {
									setName(e.target.value)
									setFieldError(null)
								}}
								placeholder="My Workspace"
							/>
							{fieldError ? (
								<p className="text-sm text-destructive">{fieldError}</p>
							) : null}
							{createWorkspace.isError ? (
								<p className="text-sm text-destructive">
									{createWorkspace.error instanceof Error
										? createWorkspace.error.message
										: "Failed to create workspace"}
								</p>
							) : null}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={createWorkspace.isPending || !name.trim()}
						>
							{createWorkspace.isPending ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
