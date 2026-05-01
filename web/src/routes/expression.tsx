import { createFileRoute } from "@tanstack/react-router"
import { lazy, Suspense } from "react"
export const Route = createFileRoute("/expression")({
	component: RouteComponent,
})

import { mockContext } from "@/features/expression-editor/registry/mock-context"
import { registry } from "@/features/expression-editor/registry/registry"

function RouteComponent() {
	return <App />
}

const ExpressionEditor = lazy(
	() => import("@/features/expression-editor/expression-editor")
)

function App() {
	return (
		<div style={{ padding: 20 }}>
			<Suspense fallback={<div>Loading editor...</div>}>
				<ExpressionEditor registry={registry} context={mockContext} />
			</Suspense>
		</div>
	)
}
