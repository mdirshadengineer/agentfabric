import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
	createProbeClient,
	fetchAppliedMigrationHashes,
} from "../doctor/db-probe.js";
import {
	compareMigrations,
	getMigrationsDirectory,
	loadMigrationJournal,
} from "../doctor/migration-journal.js";

export type ApplyMigrationsResult =
	| { ok: true; applied: number }
	| { ok: false; error: string };

export async function getPendingMigrations(): Promise<
	{ ok: true; pending: number; tags: string[] } | { ok: false; error: string }
> {
	const connectionString = process.env.DATABASE_URL?.trim();
	if (!connectionString) {
		return { ok: false, error: "DATABASE_URL is not set" };
	}

	const applied = await fetchAppliedMigrationHashes(connectionString);
	if (!applied.ok) {
		return { ok: false, error: applied.error };
	}

	const tags = getPendingMigrationTags(applied.hashes, applied.tableExists);

	return {
		ok: true,
		pending: tags.length,
		tags,
	};
}

function getPendingMigrationTags(
	hashes: readonly string[],
	tableExists: boolean,
): string[] {
	const journal = loadMigrationJournal();
	if (!journal) {
		return [];
	}

	if (!tableExists) {
		return journal.entries.map((entry) => entry.tag);
	}

	return compareMigrations(hashes).pendingTags;
}

function countPendingMigrations(
	hashes: readonly string[],
	tableExists: boolean,
): number {
	return getPendingMigrationTags(hashes, tableExists).length;
}

export async function applyMigrations(): Promise<ApplyMigrationsResult> {
	const connectionString = process.env.DATABASE_URL?.trim();
	if (!connectionString) {
		return { ok: false, error: "DATABASE_URL is not set" };
	}

	const before = await fetchAppliedMigrationHashes(connectionString);
	if (!before.ok) {
		return { ok: false, error: before.error };
	}

	const pendingBefore = countPendingMigrations(
		before.hashes,
		before.tableExists,
	);

	const client = createProbeClient(connectionString);

	try {
		const db = drizzle(client);
		await migrate(db, { migrationsFolder: getMigrationsDirectory() });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: message };
	} finally {
		await client.end({ timeout: 5 });
	}

	const after = await fetchAppliedMigrationHashes(connectionString);
	if (!after.ok) {
		return { ok: false, error: after.error };
	}

	const pendingAfter = countPendingMigrations(after.hashes, after.tableExists);
	if (pendingAfter > 0) {
		return {
			ok: false,
			error: `${pendingAfter} migration(s) remain pending after apply`,
		};
	}

	return { ok: true, applied: pendingBefore };
}
