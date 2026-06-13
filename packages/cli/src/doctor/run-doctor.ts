import { runArtifactChecks } from "./checks/artifacts.js";
import {
	runDatabaseChecks,
	runDatabaseConnectivityCheck,
} from "./checks/database.js";
import { runEnvironmentChecks } from "./checks/environment.js";
import { runRuntimeChecks } from "./checks/node-version.js";
import {
	type DoctorReport,
	hasFailures,
	hasWarnings,
	summarizeChecks,
} from "./types.js";

export interface RunDoctorOptions {
	strict: boolean;
}

export async function runDoctor(): Promise<DoctorReport> {
	const groups = [
		runRuntimeChecks(),
		runEnvironmentChecks(),
		await runDatabaseChecks(),
		await runArtifactChecks(),
	];

	return {
		groups,
		summary: summarizeChecks(groups),
	};
}

export async function runDoctorPreflight(): Promise<DoctorReport> {
	const groups = [
		runRuntimeChecks(),
		runEnvironmentChecks(),
		await runDatabaseConnectivityCheck(),
	];

	return {
		groups,
		summary: summarizeChecks(groups),
	};
}

export function shouldExitWithError(
	report: DoctorReport,
	options: RunDoctorOptions,
): boolean {
	if (hasFailures(report)) {
		return true;
	}

	if (options.strict && hasWarnings(report)) {
		return true;
	}

	return false;
}
