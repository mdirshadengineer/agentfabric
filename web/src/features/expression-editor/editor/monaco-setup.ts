import type * as monaco from "monaco-editor"

export const EXPRESSION_EDITOR_LANGUAGE = "agent-expression"
export const JAVASCRIPT_EDITOR_LANGUAGE = "javascript"

let isConfigured = false

const expressionMonarchLanguage: monaco.languages.IMonarchLanguage = {
	defaultToken: "",
	tokenizer: {
		root: [
			[/\{\{/, "delimiter.bracket", "@expression"],
			[/[A-Za-z_$][\w$]*/, "identifier"],
			[/\d+/, "number"],
			[/[.[\](),]/, "delimiter"],
		],
		expression: [
			[/\}\}/, "delimiter.bracket", "@pop"],
			[/\b(steps|uppercase|default|sum)\b/, "keyword"],
			[/true|false|null/, "constant"],
			[/"([^"\\]|\\.)*$/, "string.invalid"],
			[/"([^"\\]|\\.)*"/, "string"],
			[/'([^'\\]|\\.)*$/, "string.invalid"],
			[/'([^'\\]|\\.)*'/, "string"],
			[/\d+/, "number"],
			[/[A-Za-z_$][\w$]*/, "identifier"],
			[/[.[\](),]/, "delimiter"],
			[/\s+/, "white"],
		],
	},
}

export function setupMonaco(m: typeof monaco) {
	if (isConfigured) return

	m.languages.register({ id: EXPRESSION_EDITOR_LANGUAGE })
	m.languages.setLanguageConfiguration(EXPRESSION_EDITOR_LANGUAGE, {
		brackets: [
			["{{", "}}"],
			["[", "]"],
			["(", ")"],
		],
		autoClosingPairs: [
			{ open: "{{", close: "}}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" },
			{ open: '"', close: '"' },
			{ open: "'", close: "'" },
		],
		surroundingPairs: [
			{ open: "{{", close: "}}" },
			{ open: "[", close: "]" },
			{ open: "(", close: ")" },
			{ open: '"', close: '"' },
			{ open: "'", close: "'" },
		],
	})
	m.languages.setMonarchTokensProvider(
		EXPRESSION_EDITOR_LANGUAGE,
		expressionMonarchLanguage
	)

	m.typescript.javascriptDefaults.setCompilerOptions({
		allowNonTsExtensions: true,
		allowJs: true,
		checkJs: true,
		noEmit: true,
		target: m.typescript.ScriptTarget.ES2020,
	})

	isConfigured = true
}
