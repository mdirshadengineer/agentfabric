import { createFileRoute } from "@tanstack/react-router"
import { Braces, Code2, SquareFunction } from "lucide-react"
import { lazy, Suspense, useState } from "react"
import { JsonViewer } from "@/components/json-tree-viewer"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { mockContext } from "@/features/expression-editor/registry/mock-context"
import { registry } from "@/features/expression-editor/registry/registry"

export const Route = createFileRoute("/expression")({
	component: RouteComponent,
})

function RouteComponent() {
	return <App />
}

const ExpressionEditor = lazy(
	() => import("@/features/expression-editor/expression-editor")
)

type EditorMode = "expression" | "javascript"

function App() {
	const [mode, setMode] = useState<EditorMode>("expression")

	return (
		<div className="min-h-dvh bg-background p-6 text-foreground">
			<Dialog>
				<DialogTrigger asChild>
					<Button>
						<SquareFunction />
						Open editor
					</Button>
				</DialogTrigger>

				<DialogContent className="h-[min(760px,calc(100vh-4rem))] max-w-[calc(100vw-2rem)] grid-rows-[auto_1fr] gap-3 p-4 sm:max-w-295">
					<DialogHeader className="pr-8">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-1">
								<DialogTitle>Expression editor</DialogTitle>
								<DialogDescription>
									Browse the runtime context and edit either expression syntax
									or JavaScript with typed access.
								</DialogDescription>
							</div>

							<ToggleGroup
								type="single"
								value={mode}
								onValueChange={(value) => {
									if (value) setMode(value as EditorMode)
								}}
								variant="outline"
								size="sm"
							>
								<ToggleGroupItem
									value="expression"
									aria-label="Expression mode"
								>
									<Braces />
									Expression
								</ToggleGroupItem>
								<ToggleGroupItem
									value="javascript"
									aria-label="JavaScript mode"
								>
									<Code2 />
									JavaScript
								</ToggleGroupItem>
							</ToggleGroup>
						</div>
					</DialogHeader>

					<div className="grid min-h-0 gap-3 lg:grid-cols-[380px_1fr]">
						<section className="min-h-0 overflow-hidden rounded-lg border bg-background">
							<div className="border-b px-3 py-2 text-sm font-medium">
								Runtime context
							</div>
							<JsonViewer
								data={mockContext}
								rootName="context"
								enableDragPaths={true}
								className="h-[calc(100%-2.35rem)] overflow-auto p-3"
							/>
						</section>

						<section className="min-h-0 overflow-hidden rounded-lg border bg-background">
							<div className="border-b px-3 py-2 text-sm font-medium">
								{mode === "expression" ? "Expression" : "JavaScript"}
							</div>
							<Suspense
								fallback={
									<div className="flex h-[calc(100%-2.35rem)] items-center justify-center text-sm text-muted-foreground">
										Loading editor...
									</div>
								}
							>
								<ExpressionEditor
									registry={registry}
									context={mockContext}
									mode={mode}
									height="calc(100% - 2.35rem)"
								/>
							</Suspense>
						</section>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
