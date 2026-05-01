import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react"
import { EXPRESSION_EDITOR_LANGUAGE, setupMonaco } from "./editor/monaco-setup"
import { registerPreview } from "./editor/preview"
import { registerProviders } from "./editor/providers"

import type { ExecutionContext, JSONSchema } from "./expression/types"

type Props = {
	registry: Record<string, JSONSchema>
	context: ExecutionContext
}

/**
 * ✅ MUST use beforeMount
 */
const handleBeforeMount: BeforeMount = (monacoInstance) => {
	setupMonaco(monacoInstance)
}

export default function ExpressionEditor({ registry, context }: Props) {
	const handleMount: OnMount = (editor, monacoInstance) => {
		registerProviders(monacoInstance, registry, context)
		registerPreview(editor, context)
	}

	return (
		<Editor
			height="200px"
			defaultLanguage={EXPRESSION_EDITOR_LANGUAGE}
			defaultValue="{{ steps.httpRequest.output.body.title }}"
			beforeMount={handleBeforeMount}
			onMount={handleMount}
			theme="vs-dark"
			options={{
				wordBasedSuggestions: "off",
				suggest: {
					showFields: false,
					showProperties: false,
					showUsers: true,
					showVariables: false,
					showWords: false,
				},
			}}
		/>
	)
}
