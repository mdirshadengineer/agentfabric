import { type } from "arktype";
import { CommandLifecycle } from "../command-lifecycle.js";
import {
	Command,
	type CommandDefinition,
	type CommandMetadata,
} from "../command-metadata.js";
import { shouldSetExitCode } from "../doctor/exit-with-report.js";
import { renderHumanReport, renderJsonReport } from "../doctor/report.js";
import { runDoctor } from "../doctor/run-doctor.js";
import { loadDotenvIfAllowed } from "./_shared/load-dotenv-if-allowed.js";

// -----------------------------
// Flags
// -----------------------------
const doctorCommandFlags = type({
	"json?": "boolean",
	"strict?": "boolean",
	"dotenv?": "boolean",
	"help?": "boolean",
});

type DoctorCommandFlags = typeof doctorCommandFlags.infer;

// -----------------------------
// Metadata
// -----------------------------
const doctorCommandMetadata = {
	commandName: "doctor",
	description:
		"Inspect configuration readiness and generate a diagnostic report",
	usage: "agentfabric doctor [options]",
	flags: {
		json: "Output raw JSON report",
		strict: "Treat warnings as failures (non-zero exit)",
		dotenv: "Load .env from current directory (development only)",
	},
	examples: [
		"agentfabric doctor",
		"agentfabric doctor --json",
		"NODE_ENV=development agentfabric doctor --dotenv",
		"agentfabric doctor --strict",
	],
} satisfies CommandMetadata;

// -----------------------------
// Command
// -----------------------------
@Command(doctorCommandMetadata)
class Doctor extends CommandLifecycle<DoctorCommandFlags> {
	protected override async run(): Promise<void> {
		if (!loadDotenvIfAllowed(this.flags.dotenv)) {
			return;
		}

		const report = await runDoctor();

		if (this.flags.json) {
			console.log(renderJsonReport(report));
		} else {
			console.log(renderHumanReport(report));
		}

		if (shouldSetExitCode(report, { strict: this.flags.strict ?? false })) {
			process.exitCode = 1;
		}
	}
}

// -----------------------------
// Definition
// -----------------------------
export const doctorCommandDefinition: CommandDefinition = {
	command: Doctor,
	metadata: doctorCommandMetadata,
	parseFlags: (flags) => {
		const result = doctorCommandFlags(flags);
		if (result instanceof type.errors) {
			throw new Error(`Invalid flags:\n${result.summary}`);
		}
		return result;
	},
} as const;
