import { renderHumanReport } from "./report.js";
import { shouldExitWithError } from "./run-doctor.js";
import type { DoctorReport } from "./types.js";

export function shouldSetExitCode(
	report: DoctorReport,
	options: { strict: boolean },
): boolean {
	return shouldExitWithError(report, options);
}

export function writeReportToStderr(report: DoctorReport, title: string): void {
	process.stderr.write(`${renderHumanReport(report, title)}\n`);
}
