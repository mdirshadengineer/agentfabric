import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPackageRoot } from "./paths.js";

interface MigrationJournalEntry {
	idx: number;
	tag: string;
}

interface MigrationJournal {
	entries: MigrationJournalEntry[];
}

export interface MigrationStatus {
	journalAvailable: boolean;
	expectedCount: number;
	appliedCount: number;
	pendingTags: string[];
}

function getJournalPaths(): string[] {
	const packageRoot = getPackageRoot();
	const doctorDir = join(import.meta.dirname, ".");

	return [
		join(doctorDir, "migration-journal.json"),
		join(packageRoot, "migrations", "meta", "_journal.json"),
	];
}

export function getMigrationsDirectory(): string {
	return join(getPackageRoot(), "migrations");
}

export function loadMigrationJournal(): MigrationJournal | null {
	for (const journalPath of getJournalPaths()) {
		try {
			const raw = readFileSync(journalPath, "utf8");
			return JSON.parse(raw) as MigrationJournal;
		} catch {
			// Try next path
		}
	}

	return null;
}

function hashMigrationContent(content: string): string {
	return createHash("sha256").update(content).digest("hex");
}

function computeMigrationHash(tag: string): string | null {
	const sqlPath = join(getMigrationsDirectory(), `${tag}.sql`);

	try {
		const content = readFileSync(sqlPath, "utf8");
		return hashMigrationContent(content);
	} catch {
		return null;
	}
}

export function compareMigrations(
	appliedHashes: readonly string[],
): MigrationStatus {
	const journal = loadMigrationJournal();

	if (!journal) {
		return {
			journalAvailable: false,
			expectedCount: 0,
			appliedCount: appliedHashes.length,
			pendingTags: [],
		};
	}

	const appliedSet = new Set(appliedHashes);
	const pendingTags: string[] = [];

	for (const entry of journal.entries) {
		const hash = computeMigrationHash(entry.tag);

		if (hash === null) {
			continue;
		}

		if (!appliedSet.has(hash)) {
			pendingTags.push(entry.tag);
		}
	}

	const expectedCount = journal.entries.length;
	const appliedCount =
		pendingTags.length === 0 && appliedHashes.length >= expectedCount
			? expectedCount
			: expectedCount - pendingTags.length;

	return {
		journalAvailable: true,
		expectedCount,
		appliedCount: Math.min(appliedCount, expectedCount),
		pendingTags,
	};
}
