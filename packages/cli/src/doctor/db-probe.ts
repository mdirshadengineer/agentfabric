import postgres from "postgres";

const DEFAULT_DB_IDLE_TIMEOUT_SECONDS = 20;
const DEFAULT_DB_CONNECT_TIMEOUT_SECONDS = 30;
const DEFAULT_DB_POOL_SIZE = 1;

const EXPECTED_TABLES = [
	"user",
	"session",
	"account",
	"verification",
	"workspace",
	"workspace_member",
	"invitation",
	"apikey",
] as const;

function parsePositiveIntegerEnv(
	value: string | undefined,
	defaultValue: number,
): number {
	if (value === undefined || value.trim().length === 0) {
		return defaultValue;
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		return defaultValue;
	}

	return parsed;
}

function shouldEnableDbSsl(): boolean {
	const raw = process.env.DB_SSL;
	const isProduction = process.env.NODE_ENV === "production";

	if (raw === undefined) {
		if (process.env.IS_MANUAL_TESTING === "true") {
			return false;
		}
		return isProduction;
	}

	const normalized = raw.trim().toLowerCase();
	if (normalized === "1" || normalized === "true") {
		return true;
	}

	if (normalized === "0" || normalized === "false") {
		return false;
	}

	return isProduction;
}

export function createProbeClient(connectionString: string) {
	return postgres(connectionString, {
		prepare: false,
		max: DEFAULT_DB_POOL_SIZE,
		idle_timeout: parsePositiveIntegerEnv(
			process.env.DB_IDLE_TIMEOUT,
			DEFAULT_DB_IDLE_TIMEOUT_SECONDS,
		),
		connect_timeout: parsePositiveIntegerEnv(
			process.env.DB_CONNECT_TIMEOUT,
			DEFAULT_DB_CONNECT_TIMEOUT_SECONDS,
		),
		ssl: shouldEnableDbSsl() ? "require" : false,
		onnotice: () => {},
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
