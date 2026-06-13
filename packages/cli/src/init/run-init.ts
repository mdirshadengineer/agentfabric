import {
	runDoctorPreflight,
	shouldExitWithError,
} from "../doctor/run-doctor.js";
import type { DoctorReport } from "../doctor/types.js";
import {
	applyMigrations,
	type ApplyMigrationsResult,
} from "./apply-migrations.js";

export interface InitResult {
	preflight: DoctorReport;
	preflightFailed: boolean;
	migration?: ApplyMigrationsResult;
}

export async function runInit(): Promise<InitResult> {
	const preflight = await runDoctorPreflight();
	const preflightFailed = shouldExitWithError(preflight, { strict: false });

	if (preflightFailed) {
		return { preflight, preflightFailed };
	}

	const migration = await applyMigrations();

	return {
		preflight,
		preflightFailed: false,
		migration,
	};
}
