import { confirmMigrationApply } from "./confirm-migration-apply.js";
import { renderHumanReport } from "../doctor/report.js";
import {
	runDoctorPreflight,
	shouldExitWithError,
} from "../doctor/run-doctor.js";
import { AGENTFABRIC_DEFAULT_COMMAND } from "../global.config.js";
import {
	applyMigrations,
	getPendingMigrations,
} from "../init/apply-migrations.js";

export function shouldRunBootstrapPreflight(
	commandName: string | undefined,
): boolean {
	const resolvedCommand = commandName ?? AGENTFABRIC_DEFAULT_COMMAND;
	return resolvedCommand === AGENTFABRIC_DEFAULT_COMMAND;
}

export async function runBootstrapPreflight(): Promise<number> {
	const preflight = await runDoctorPreflight();

	if (shouldExitWithError(preflight, { strict: false })) {
		process.stderr.write(
			`${renderHumanReport(preflight, "AgentFabric Preflight")}\n`,
		);
		return 1;
	}

	const pendingResult = await getPendingMigrations();
	if (!pendingResult.ok) {
		process.stderr.write(`Migration check failed: ${pendingResult.error}\n`);
		return 1;
	}

	if (pendingResult.pending === 0) {
		return 0;
	}

	const confirmed = await confirmMigrationApply({
		pendingCount: pendingResult.pending,
		pendingTags: pendingResult.tags,
	});

	if (!confirmed) {
		process.stderr.write(
			"\nMigration apply declined. Start aborted — run `agentfabric init` when ready.\n",
		);
		return 1;
	}

	const pendingLabel =
		pendingResult.pending === 1
			? "1 pending migration"
			: `${pendingResult.pending} pending migrations`;

	process.stdout.write(`\nApplying ${pendingLabel}...\n`);

	const migration = await applyMigrations();
	if (!migration.ok) {
		process.stderr.write(`Migration failed: ${migration.error}\n`);
		return 1;
	}

	if (migration.applied > 0) {
		const appliedLabel =
			migration.applied === 1
				? "1 migration"
				: `${migration.applied} migrations`;
		process.stdout.write(`Applied ${appliedLabel}. Starting server...\n\n`);
	}

	return 0;
}
