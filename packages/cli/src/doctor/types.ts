export type CheckStatus = "pass" | "warn" | "fail" | "skip" | "info";

export interface DoctorCheck {
	id: string;
	label: string;
	status: CheckStatus;
	message: string;
	hint?: string;
}

export interface DoctorGroup {
	id: string;
	label: string;
	checks: DoctorCheck[];
}

export interface DoctorSummary {
	pass: number;
	warn: number;
	fail: number;
	skip: number;
	info: number;
}

export interface DoctorReport {
	summary: DoctorSummary;
	groups: DoctorGroup[];
}

export interface DoctorOptions {
	strict: boolean;
}

export function createCheck(
	id: string,
	label: string,
	status: CheckStatus,
	message: string,
	hint?: string,
): DoctorCheck {
	const check: DoctorCheck = { id, label, status, message };

	if (hint !== undefined) {
		check.hint = hint;
	}

	return check;
}

export function createGroup(
	id: string,
	label: string,
	checks: DoctorCheck[],
): DoctorGroup {
	return { id, label, checks };
}

export function summarizeChecks(groups: DoctorGroup[]): DoctorSummary {
	const summary: DoctorSummary = {
		pass: 0,
		warn: 0,
		fail: 0,
		skip: 0,
		info: 0,
	};

	for (const group of groups) {
		for (const check of group.checks) {
			summary[check.status] += 1;
		}
	}

	return summary;
}

export function hasFailures(report: DoctorReport): boolean {
	return report.summary.fail > 0;
}

export function hasWarnings(report: DoctorReport): boolean {
	return report.summary.warn > 0;
}
