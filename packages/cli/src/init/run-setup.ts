import {
	runDoctorPreflight,
	shouldExitWithError,
} from "../doctor/run-doctor.js";
import type { DoctorReport } from "../doctor/types.js";
import { confirmMigrationApply } from "../preflight/confirm-migration-apply.js";
import {
	type ApplyMigrationsResult,
	applyMigrations,
	getPendingMigrations,
} from "./apply-migrations.js";

export type SetupMode = "auto" | "confirm";

export interface SetupResult {
	preflight: DoctorReport;
	preflightFailed: boolean;
	migration?: ApplyMigrationsResult;
	declined?: boolean;
	pendingCount?: number;
}

export interface SetupOptions {
	mode: SetupMode;
	onBeforeApply?: (pending: number) => void;
}

export async function runSetup(options: SetupOptions): Promise<SetupResult> {
	const preflight = await runDoctorPreflight();
	const preflightFailed = shouldExitWithError(preflight, { strict: false });

	if (preflightFailed) {
		return { preflight, preflightFailed };
	}

	const pendingResult = await getPendingMigrations();
	if (!pendingResult.ok) {
		return {
			preflight,
			preflightFailed: false,
			migration: { ok: false, error: pendingResult.error },
		};
	}

	if (pendingResult.pending === 0) {
		return {
			preflight,
			preflightFailed: false,
			migration: { ok: true, applied: 0 },
		};
	}

	if (options.mode === "confirm") {
		const confirmed = await confirmMigrationApply({
			pendingCount: pendingResult.pending,
			pendingTags: pendingResult.tags,
		});

		if (!confirmed) {
			return {
				preflight,
				preflightFailed: false,
				declined: true,
				pendingCount: pendingResult.pending,
			};
		}
	}

	options.onBeforeApply?.(pendingResult.pending);

	const migration = await applyMigrations();

	return {
		preflight,
		preflightFailed: false,
		migration,
	};
}
