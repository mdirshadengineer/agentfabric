import {
	Check,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Copy,
	MoreHorizontal,
} from "lucide-react"
import * as React from "react"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const JSON_TREE_PATH_MIME = "application/x-agent-expression-path"

type JsonPathSegment = string | number

type JsonViewerProps = {
	data: any
	rootName?: string
	defaultExpanded?: boolean
	className?: string
	enableDragPaths?: boolean
}

export function JsonViewer({
	data,
	rootName = "root",
	defaultExpanded = true,
	className,
	enableDragPaths = false,
}: JsonViewerProps) {
	return (
		<TooltipProvider>
			<div className={cn("font-mono text-sm", className)}>
				<JsonNode
					name={rootName}
					data={data}
					isRoot={true}
					defaultExpanded={defaultExpanded}
					enableDragPaths={enableDragPaths}
					pathSegments={[]}
				/>
			</div>
		</TooltipProvider>
	)
}

type JsonNodeProps = {
	name: string
	data: any
	isRoot?: boolean
	defaultExpanded?: boolean
	level?: number
	enableDragPaths?: boolean
	pathSegments?: JsonPathSegment[]
}

function JsonNode({
	name,
	data,
	isRoot = false,
	defaultExpanded = true,
	level = 0,
	enableDragPaths = false,
	pathSegments = [],
}: JsonNodeProps) {
	const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
	const [isCopied, setIsCopied] = React.useState(false)

	const handleToggle = () => {
		setIsExpanded(!isExpanded)
	}

	const copyToClipboard = (e: React.MouseEvent) => {
		e.stopPropagation()
		navigator.clipboard.writeText(JSON.stringify(data, null, 2))
		setIsCopied(true)
		setTimeout(() => setIsCopied(false), 2000)
	}

	const expressionPath = buildExpressionPath(pathSegments)
	const canDragPath = enableDragPaths && !isRoot && expressionPath.length > 0

	const handleDragStart = (event: React.DragEvent) => {
		if (!canDragPath) return

		event.stopPropagation()
		event.dataTransfer.effectAllowed = "copy"
		event.dataTransfer.setData(JSON_TREE_PATH_MIME, expressionPath)
		event.dataTransfer.setData("text/plain", expressionPath)
	}

	const dataType =
		data === null ? "null" : Array.isArray(data) ? "array" : typeof data
	const isExpandable =
		data !== null &&
		data !== undefined &&
		!(data instanceof Date) &&
		(dataType === "object" || dataType === "array")
	const itemCount =
		isExpandable && data !== null && data !== undefined
			? Object.keys(data).length
			: 0

	return (
		<div
			className={cn("pl-4 group/object", level > 0 && "border-l border-border")}
		>
			<div
				draggable={canDragPath}
				onDragStart={handleDragStart}
				title={canDragPath ? expressionPath : undefined}
				className={cn(
					"flex items-center gap-1 py-1 hover:bg-muted/50 rounded px-1 -ml-4 cursor-pointer group/property",
					isRoot && "text-primary font-semibold",
					canDragPath && "cursor-grab active:cursor-grabbing"
				)}
				onClick={isExpandable ? handleToggle : undefined}
			>
				{isExpandable ? (
					<div className="w-4 h-4 flex items-center justify-center">
						{isExpanded ? (
							<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
						) : (
							<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
						)}
					</div>
				) : (
					<div className="w-4" />
				)}

				<span className="text-primary">{name}</span>

				<span className="text-muted-foreground">
					{isExpandable ? (
						<>
							{dataType === "array" ? "[" : "{"}
							{!isExpanded && (
								<span className="text-muted-foreground">
									{" "}
									{itemCount} {itemCount === 1 ? "item" : "items"}{" "}
									{dataType === "array" ? "]" : "}"}
								</span>
							)}
						</>
					) : (
						":"
					)}
				</span>

				{!isExpandable && <JsonValue data={data} />}

				{!isExpandable && <div className="w-3.5" />}

				<button
					onClick={copyToClipboard}
					className="ml-auto opacity-0 group-hover/property:opacity-100 hover:bg-muted p-1 rounded"
					title="Copy to clipboard"
				>
					{isCopied ? (
						<Check className="h-3.5 w-3.5 text-green-500" />
					) : (
						<Copy className="h-3.5 w-3.5 text-muted-foreground" />
					)}
				</button>
			</div>

			{isExpandable && isExpanded && data !== null && data !== undefined && (
				<div className="pl-4">
					{Object.keys(data).map((key) => (
						<JsonNode
							key={key}
							name={dataType === "array" ? `${key}` : key}
							data={data[key]}
							level={level + 1}
							defaultExpanded={level < 1}
							enableDragPaths={enableDragPaths}
							pathSegments={[
								...pathSegments,
								dataType === "array" ? Number(key) : key,
							]}
						/>
					))}
					<div className="text-muted-foreground pl-4 py-1">
						{dataType === "array" ? "]" : "}"}
					</div>
				</div>
			)}
		</div>
	)
}

function isIdentifier(value: string) {
	return /^[A-Za-z_$][\w$]*$/.test(value)
}

function buildExpressionPath(segments: JsonPathSegment[]) {
	return segments
		.map((segment, index) => {
			if (typeof segment === "number") return `[${segment}]`
			if (index === 0) return segment
			if (isIdentifier(segment)) return `.${segment}`

			return `[${JSON.stringify(segment)}]`
		})
		.join("")
}

// Update the JsonValue function to make the entire row clickable with an expand icon
function JsonValue({ data }: { data: any }) {
	const [isExpanded, setIsExpanded] = React.useState(false)
	const dataType = typeof data
	const TEXT_LIMIT = 80 // Character limit before truncation

	if (data === null) {
		return <span className="text-rose-500">null</span>
	}

	if (data === undefined) {
		return <span className="text-muted-foreground">undefined</span>
	}

	if (data instanceof Date) {
		return <span className="text-purple-500">{data.toISOString()}</span>
	}

	switch (dataType) {
		case "string":
			if (data.length > TEXT_LIMIT) {
				return (
					<div
						className="text-emerald-500 flex-1 flex items-center relative group cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							setIsExpanded(!isExpanded)
						}}
					>
						{`"`}
						{isExpanded ? (
							<span className="inline-block max-w-full">{data}</span>
						) : (
							<Tooltip delayDuration={300}>
								<TooltipTrigger asChild>
									<span className="inline-block max-w-full">
										{data.substring(0, TEXT_LIMIT)}...
									</span>
								</TooltipTrigger>
								<TooltipContent
									side="bottom"
									className="max-w-md text-xs p-2 wrap-break-word"
								>
									{data}
								</TooltipContent>
							</Tooltip>
						)}
						{`"`}
						<div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+4px)] opacity-0 group-hover:opacity-100 transition-opacity">
							{isExpanded ? (
								<ChevronUp className="h-3 w-3 text-muted-foreground" />
							) : (
								<MoreHorizontal className="h-3 w-3 text-muted-foreground" />
							)}
						</div>
					</div>
				)
			}
			return <span className="text-emerald-500">{`"${data}"`}</span>
		case "number":
			return <span className="text-amber-500">{data}</span>
		case "boolean":
			return <span className="text-blue-500">{data.toString()}</span>
		default:
			return <span>{String(data)}</span>
	}
}
