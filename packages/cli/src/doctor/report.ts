import type { CheckStatus, DoctorReport } from "./types.js";

const STATUS_SYMBOLS: Record<CheckStatus, string> = {
	pass: "✓",
	warn: "⚠",
	fail: "✗",
	skip: "○",
	info: "○",
};

export function renderJsonReport(report: DoctorReport): string {
	return JSON.stringify(report, null, 2);
}

export function renderHumanReport(
	report: DoctorReport,
	title = "AgentFabric Doctor",
): string {
	const lines: string[] = [title, ""];

	for (const group of report.groups) {
		if (group.checks.length === 0) {
			continue;
		}

		lines.push(group.label);

		for (const check of group.checks) {
			const symbol = STATUS_SYMBOLS[check.status];
			lines.push(`  ${symbol} ${check.label} — ${check.message}`);

			if (check.hint) {
				lines.push(`    → ${check.hint}`);
			}
		}

		lines.push("");
	}

	const { pass, warn, fail, skip } = report.summary;
	const parts = [`${pass} passed`];

	if (warn > 0) {
		parts.push(`${warn} warning${warn === 1 ? "" : "s"}`);
	}

	if (fail > 0) {
		parts.push(`${fail} failed`);
	}

	if (skip > 0) {
		parts.push(`${skip} skipped`);
	}

	lines.push(`Summary: ${parts.join(", ")}`);

	return lines.join("\n");
}
