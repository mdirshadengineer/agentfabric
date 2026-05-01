import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react"
import type { IDisposable } from "monaco-editor"
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

type Props = {
	registry: Record<string, JSONSchema>
	context: ExecutionContext
	mode?: EditorMode
	defaultValue?: string
}

const handleBeforeMount: BeforeMount = (monacoInstance) => {
	setupMonaco(monacoInstance)
}

const languageByMode: Record<EditorMode, string> = {
	expression: EXPRESSION_EDITOR_LANGUAGE,
	javascript: JAVASCRIPT_EDITOR_LANGUAGE,
}

const defaultValueByMode: Record<EditorMode, string> = {
	expression: "{{ steps.httpRequest.output.body.title }}",
	javascript: "const title = steps.httpRequest.output.body.title",
}

export default function ExpressionEditor({
	registry,
	context,
	mode = "expression",
	defaultValue,
}: Props) {
	const providerDisposableRef = useRef<IDisposable | null>(null)

	const language = languageByMode[mode]
	const editorDefaultValue = useMemo(
		() => defaultValue ?? defaultValueByMode[mode],
		[defaultValue, mode]
	)

	const handleMount: OnMount = (editor, monacoInstance) => {
		providerDisposableRef.current?.dispose()
		providerDisposableRef.current = registerProviders(
			monacoInstance,
			registry,
			context,
			language
		)

		let previewDisposable: IDisposable | null = null
		if (mode === "expression") {
			previewDisposable = registerPreview(editor, context)
		}

		editor.onDidDispose(() => {
			providerDisposableRef.current?.dispose()
			previewDisposable?.dispose()
			providerDisposableRef.current = null
		})
	}

	return (
		<Editor
			key={mode}
			height="200px"
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
