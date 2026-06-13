import { type } from "arktype";
import { CommandLifecycle } from "../command-lifecycle.js";
import {
	Command,
	type CommandDefinition,
	type CommandMetadata,
} from "../command-metadata.js";
import { formatMigrationCount } from "../doctor/format-migration-count.js";
import { renderHumanReport } from "../doctor/report.js";
import { runInit } from "../init/run-init.js";
import { loadDotenvIfAllowed } from "./_shared/load-dotenv-if-allowed.js";

// -----------------------------
// Flags
// -----------------------------
const initCommandFlags = type({
	"json?": "boolean",
	"dotenv?": "boolean",
	"help?": "boolean",
});

type InitCommandFlags = typeof initCommandFlags.infer;

// -----------------------------
// Metadata
// -----------------------------
const initCommandMetadata = {
	commandName: "init",
	aliases: ["initialize"],
	description:
		"Initialize a new AgentFabric installation (preflight checks + migrations)",
	usage: "agentfabric init [options]",
	flags: {
		json: "Output raw JSON report for the preflight phase",
		dotenv: "Load .env from current directory (development only)",
	},
	examples: [
		"agentfabric init",
		"agentfabric initialize",
		"NODE_ENV=development agentfabric init --dotenv",
		"agentfabric init --json",
	],
} satisfies CommandMetadata;

// -----------------------------
// Command
// -----------------------------
@Command(initCommandMetadata)
class Init extends CommandLifecycle<InitCommandFlags> {
	protected override async run(): Promise<void> {
		if (!loadDotenvIfAllowed(this.flags.dotenv)) {
			return;
		}

		const result = await runInit();

		if (this.flags.json) {
			console.log(
				JSON.stringify(
					{
						preflight: result.preflight,
						preflightFailed: result.preflightFailed,
						migration: result.migration,
					},
					null,
					2,
				),
			);
		} else {
			console.log(
				renderHumanReport(result.preflight, "AgentFabric Init — Preflight"),
			);
		}

		if (result.preflightFailed) {
			process.exitCode = 1;
			return;
		}

		if (!result.migration?.ok) {
			console.error(
				`Migration failed: ${result.migration?.error ?? "unknown error"}`,
			);
			process.exitCode = 1;
			return;
		}

		if (!this.flags.json) {
			const applied = result.migration.applied;
			const appliedLabel = formatMigrationCount(applied);

			console.log(
				applied > 0
					? `Initialization complete. Applied ${appliedLabel}.`
					: "Initialization complete. Database is already up to date.",
			);
			console.log("");
			console.log("Next steps:");
			console.log("  agentfabric doctor");
			console.log("  agentfabric start");
		}
	}
}

// -----------------------------
// Definition
// -----------------------------
export const initCommandDefinition: CommandDefinition = {
	command: Init,
	metadata: initCommandMetadata,
	parseFlags: (flags) => {
		const result = initCommandFlags(flags);
		if (result instanceof type.errors) {
			throw new Error(`Invalid flags:\n${result.summary}`);
		}
		return result;
	},
} as const;
