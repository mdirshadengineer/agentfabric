import { createPostgresClient } from "../db/create-postgres-client.js";
import { EXPECTED_TABLES } from "../schema.js";

export function createProbeClient(connectionString: string) {
	return createPostgresClient({
		connectionString,
		poolSize: 1,
		invalidEnvPolicy: "default",
	});
}

export async function probeDatabaseConnection(
	connectionString: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const client = createProbeClient(connectionString);

	try {
		await client`SELECT 1`;
		return { ok: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: message };
	} finally {
		await client.end({ timeout: 5 });
	}
}

export async function fetchAppliedMigrationHashes(
	connectionString: string,
): Promise<
	| { ok: true; hashes: string[]; tableExists: boolean }
	| { ok: false; error: string }
> {
	const client = createProbeClient(connectionString);

	try {
		const tableCheck = await client`
			SELECT EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = 'drizzle'
					AND table_name = '__drizzle_migrations'
			) AS exists
		`;

		const tableExists = Boolean(tableCheck[0]?.exists);

		if (!tableExists) {
			return { ok: true, hashes: [], tableExists: false };
		}

		const rows = await client`
			SELECT hash
			FROM drizzle.__drizzle_migrations
			ORDER BY created_at
		`;

		return {
			ok: true,
			hashes: rows.map((row) => String(row.hash)),
			tableExists: true,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: message };
	} finally {
		await client.end({ timeout: 5 });
	}
}

export async function fetchExistingTables(
	connectionString: string,
): Promise<{ ok: true; tables: string[] } | { ok: false; error: string }> {
	const client = createProbeClient(connectionString);

	try {
		const rows = await client`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public'
				AND table_name IN ${client(EXPECTED_TABLES)}
		`;

		return {
			ok: true,
			tables: rows.map((row) => String(row.table_name)),
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: message };
	} finally {
		await client.end({ timeout: 5 });
	}
}

export function getExpectedTables(): readonly string[] {
	return EXPECTED_TABLES;
}
