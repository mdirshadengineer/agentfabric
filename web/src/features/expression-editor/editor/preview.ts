import * as monaco from "monaco-editor"
import { evaluateExpression } from "../expression/evaluator"
import type { ExecutionContext } from "../expression/types"

export function registerPreview(
	editor: monaco.editor.IStandaloneCodeEditor,
	context: ExecutionContext
) {
	const decorationCollection = editor.createDecorationsCollection()

	function update() {
		const model = editor.getModel()
		if (!model) return

		const text = model.getValue()

		const matches = [...text.matchAll(/\{\{([^}]+)\}\}/g)]

		const newDecorations: monaco.editor.IModelDeltaDecoration[] = matches
			.map((m) => {
				const value = evaluateExpression(m[0], context)
				const pos = model.getPositionAt(m.index! + m[0].length)
				if (m.index === undefined) return null // or skip the map entry

				return {
					range: new monaco.Range(
						pos.lineNumber,
						pos.column,
						pos.lineNumber,
						pos.column
					),
					options: {
						after: {
							content: ` → ${String(value)}`,
							inlineClassName: "expression-preview",
						},
					},
				}
			})
			.filter((d) => d !== null) as monaco.editor.IModelDeltaDecoration[]

		decorationCollection.set(newDecorations)
	}

	const contentDisposable = editor.onDidChangeModelContent(() => {
		setTimeout(update, 150)
	})

	update()

	return {
		dispose() {
			contentDisposable.dispose()
			decorationCollection.clear()
		},
	}
}
