import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

export interface ConfirmMigrationApplyOptions {
	pendingCount: number;
	pendingTags: readonly string[];
}

function formatPendingSummary(
	pendingCount: number,
	pendingTags: readonly string[],
): string[] {
	const lines = [
		"",
		"This CLI version includes database migrations that are not yet applied.",
		"The server will not start until you approve applying them.",
		"",
		pendingCount === 1
			? "1 pending migration:"
			: `${pendingCount} pending migrations:`,
	];

	for (const tag of pendingTags) {
		lines.push(`  - ${tag}`);
	}

	return lines;
}

export async function confirmMigrationApply(
	options: ConfirmMigrationApplyOptions,
): Promise<boolean> {
	const { pendingCount, pendingTags } = options;

	if (!input.isTTY) {
		process.stderr.write(
			`${formatPendingSummary(pendingCount, pendingTags).join("\n")}\n\n` +
				"An interactive terminal is required to confirm migration apply. " +
				"Run: agentfabric init\n",
		);
		return false;
	}

	for (const line of formatPendingSummary(pendingCount, pendingTags)) {
		process.stdout.write(`${line}\n`);
	}

	const rl = createInterface({ input, output });

	try {
		while (true) {
			const answer = await rl.question("\nApply these migrations now? [y/N] ");
			const normalized = answer.trim().toLowerCase();

			if (normalized === "" || normalized === "n" || normalized === "no") {
				return false;
			}

			if (normalized === "y" || normalized === "yes") {
				return true;
			}

			process.stdout.write('Please answer "yes" or "no".\n');
		}
	} finally {
		rl.close();
	}
}
