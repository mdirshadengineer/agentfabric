import { cn } from "@/lib/utils"

type DevJsonBlockProps = {
	value: unknown
	className?: string
	emptyLabel?: string
	maxHeightClassName?: string
}

function formatJson(value: unknown, emptyLabel: string) {
	if (value === null || value === undefined || value === "") return emptyLabel
	if (typeof value === "string") return value
	return JSON.stringify(value, null, 2)
}

export function DevJsonBlock({
	value,
	className,
	emptyLabel = "No data yet.",
	maxHeightClassName = "max-h-80",
}: DevJsonBlockProps) {
	return (
		<pre
			className={cn(
				"overflow-auto rounded-xl border border-border/60 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100",
				maxHeightClassName,
				className
			)}
		>
			{formatJson(value, emptyLabel)}
		</pre>
	)
}
