import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react"
import type { editor, IDisposable, Position } from "monaco-editor"
import { useMemo, useRef } from "react"
import {
	EXPRESSION_EDITOR_LANGUAGE,
	JAVASCRIPT_EDITOR_LANGUAGE,
	setupMonaco,
} from "./editor/monaco-setup"
import { registerPreview } from "./editor/preview"
import { registerProviders } from "./editor/providers"

import type { ExecutionContext, JSONSchema } from "./expression/types"

type EditorMode = "expression" | "javascript"
const JSON_TREE_PATH_MIME = "application/x-agent-expression-path"

type Props = {
	registry: Record<string, JSONSchema>
	context: ExecutionContext
	mode?: EditorMode
	defaultValue?: string
	height?: string
}

const handleBeforeMount: BeforeMount = (monacoInstance) => {
	setupMonaco(monacoInstance)
}

const languageByMode: Record<EditorMode, string> = {
	expression: EXPRESSION_EDITOR_LANGUAGE,
	javascript: JAVASCRIPT_EDITOR_LANGUAGE,
}

type PathSegment = string | number

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPrimitive(value: unknown) {
	return (
		value === null ||
		!["object", "function", "undefined"].includes(typeof value)
	)
}

function isIdentifier(value: string) {
	return /^[A-Za-z_$][\w$]*$/.test(value)
}

function findFirstPrimitivePath(
	value: unknown,
	path: PathSegment[] = []
): PathSegment[] | null {
	if (isPrimitive(value)) return path.length > 0 ? path : null

	if (Array.isArray(value)) {
		if (value.length === 0) return null
		return findFirstPrimitivePath(value[0], [...path, 0])
	}

	if (!isRecord(value)) return null

	for (const [key, childValue] of Object.entries(value)) {
		if (!isIdentifier(key)) continue

		const childPath = findFirstPrimitivePath(childValue, [...path, key])
		if (childPath) return childPath
	}

	return null
}

function buildPathExpression(segments: PathSegment[]) {
	return segments
		.map((segment, index) => {
			if (typeof segment === "number") return `[${segment}]`
			return index === 0 ? segment : `.${segment}`
		})
		.join("")
}

function buildDefaultValue(mode: EditorMode, context: ExecutionContext) {
	const path = findFirstPrimitivePath(context)
	const expression = path ? buildPathExpression(path) : "steps"

	if (mode === "expression") return `{{ ${expression} }}`

	const finalSegment = path?.at(-1)
	const variableName =
		typeof finalSegment === "string" && isIdentifier(finalSegment)
			? finalSegment
			: "value"

	return `const ${variableName} = ${expression}`
}

function isInsideExpression(model: editor.ITextModel, position: Position) {
	const text = model.getValue()
	const offset = model.getOffsetAt(position)
	const start = text.lastIndexOf("{{", offset)

	if (start === -1) return false

	const end = text.indexOf("}}", start)

	return end === -1 ? offset >= start + 2 : offset >= start + 2 && offset <= end
}

function formatDroppedPath(
	path: string,
	mode: EditorMode,
	model: editor.ITextModel,
	position: Position
) {
	if (mode === "javascript" || isInsideExpression(model, position)) return path

	return `{{ ${path} }}`
}

export default function ExpressionEditor({
	registry,
	context,
	mode = "javascript",
	defaultValue,
	height = "200px",
}: Props) {
	const providerDisposableRef = useRef<IDisposable | null>(null)

	const language = languageByMode[mode]
	const editorDefaultValue = useMemo(
		() => defaultValue ?? buildDefaultValue(mode, context),
		[context, defaultValue, mode]
	)

	const handleMount: OnMount = (editor, monacoInstance) => {
		providerDisposableRef.current?.dispose()
		providerDisposableRef.current = registerProviders(
			monacoInstance,
			registry,
			language
		)

		const editorDomNode = editor.getDomNode()
		const handleDragOver = (event: DragEvent) => {
			if (!event.dataTransfer?.types.includes(JSON_TREE_PATH_MIME)) return

			event.preventDefault()
			event.dataTransfer.dropEffect = "copy"
		}

		const handleDrop = (event: DragEvent) => {
			const model = editor.getModel()
			if (!model) return

			const path =
				event.dataTransfer?.getData(JSON_TREE_PATH_MIME) ||
				event.dataTransfer?.getData("text/plain")

			if (!path) return

			event.preventDefault()
			event.stopPropagation()

			const target = editor.getTargetAtClientPoint(event.clientX, event.clientY)
			const position = target?.position ?? editor.getPosition()
			if (!position) return

			const text = formatDroppedPath(path, mode, model, position)
			const range = new monacoInstance.Range(
				position.lineNumber,
				position.column,
				position.lineNumber,
				position.column
			)

			editor.focus()
			editor.setPosition(position)
			editor.executeEdits("json-tree-drop", [{ range, text }])
		}

		editorDomNode?.addEventListener("dragover", handleDragOver)
		editorDomNode?.addEventListener("drop", handleDrop)

		let previewDisposable: IDisposable | null = null
		if (mode === "expression") {
			previewDisposable = registerPreview(editor, context)
		}

		editor.onDidDispose(() => {
			providerDisposableRef.current?.dispose()
			previewDisposable?.dispose()
			editorDomNode?.removeEventListener("dragover", handleDragOver)
			editorDomNode?.removeEventListener("drop", handleDrop)
			providerDisposableRef.current = null
		})
	}

	return (
		<Editor
			key={mode}
			height={height}
			defaultLanguage={language}
			defaultValue={editorDefaultValue}
			beforeMount={handleBeforeMount}
			onMount={handleMount}
			theme="vs-dark"
			options={{
				wordBasedSuggestions: "off",
				quickSuggestions: {
					other: true,
					comments: false,
					strings: mode === "expression",
				},
				suggest: {
					showFields: true,
					showProperties: true,
					showUsers: true,
					showVariables: true,
					showWords: false,
				},
			}}
		/>
	)
}
