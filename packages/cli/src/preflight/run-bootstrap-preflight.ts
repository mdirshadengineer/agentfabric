import { writeReportToStderr } from "../doctor/exit-with-report.js";
import { formatMigrationCount } from "../doctor/format-migration-count.js";
import { AGENTFABRIC_DEFAULT_COMMAND } from "../global.config.js";
import { runSetup } from "../init/run-setup.js";

export function shouldRunBootstrapPreflight(
	commandName: string | undefined,
): boolean {
	const resolvedCommand = commandName ?? AGENTFABRIC_DEFAULT_COMMAND;
	return resolvedCommand === AGENTFABRIC_DEFAULT_COMMAND;
}

export async function runBootstrapPreflight(): Promise<number> {
	const result = await runSetup({
		mode: "confirm",
		onBeforeApply: (pending) => {
			process.stdout.write(`\nApplying ${formatMigrationCount(pending)}...\n`);
		},
	});

	if (result.preflightFailed) {
		writeReportToStderr(result.preflight, "AgentFabric Preflight");
		return 1;
	}

	if (result.declined) {
		process.stderr.write(
			"\nMigration apply declined. Start aborted — run `agentfabric init` when ready.\n",
		);
		return 1;
	}

	if (!result.migration?.ok) {
		process.stderr.write(
			`Migration failed: ${result.migration?.error ?? "unknown error"}\n`,
		);
		return 1;
	}

	if (result.migration.applied > 0) {
		process.stdout.write(
			`Applied ${formatMigrationCount(result.migration.applied)}. Starting server...\n\n`,
		);
	}

	return 0;
}
