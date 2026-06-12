import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"

export function DevFieldLabel({
	htmlFor,
	children,
}: {
	htmlFor?: string
	children: ReactNode
}) {
	return (
		<Label htmlFor={htmlFor} className="text-sm font-medium">
			{children}
		</Label>
	)
}
