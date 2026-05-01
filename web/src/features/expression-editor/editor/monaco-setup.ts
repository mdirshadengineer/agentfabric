import type * as monaco from "monaco-editor"

export const EXPRESSION_EDITOR_LANGUAGE = "javascript"

export function setupMonaco(_m: typeof monaco) {
	// Monaco already ships JavaScript support. Expression features are layered
	// onto that language by the providers registered for this editor.
}
