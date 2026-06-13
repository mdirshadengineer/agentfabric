import { getPendingMigrations } from "../../init/apply-migrations.js";
import {
	fetchExistingTables,
	getExpectedTables,
	probeDatabaseConnection,
} from "../db-probe.js";
import { createCheck, createGroup, type DoctorGroup } from "../types.js";

const MIGRATE_HINT = "Run: pnpm --filter agentfabric db:migrate";

function isDatabaseUrlSet(): boolean {
	const value = process.env.DATABASE_URL;
	return value !== undefined && value.trim().length > 0;
}

export async function runDatabaseConnectivityCheck(): Promise<DoctorGroup> {
	if (!isDatabaseUrlSet()) {
		return createGroup("database", "Database", [
			createCheck(
				"database-skipped",
				"Database checks",
				"skip",
				"skipped — DATABASE_URL not set",
			),
		]);
	}

	const connectionString = process.env.DATABASE_URL as string;
	const connection = await probeDatabaseConnection(connectionString);

	if (!connection.ok) {
		return createGroup("database", "Database", [
			createCheck(
				"postgres-connection",
				"PostgreSQL connection",
				"fail",
				connection.error,
				"Verify DATABASE_URL and that PostgreSQL is running",
			),
		]);
	}

	return createGroup("database", "Database", [
		createCheck(
			"postgres-connection",
			"PostgreSQL connection",
			"pass",
			"connected",
		),
	]);
}

export async function runDatabaseChecks(): Promise<DoctorGroup> {
	const connectivityGroup = await runDatabaseConnectivityCheck();
	const checks = [...connectivityGroup.checks];

	const connectionFailed = checks.some((check) => check.status === "fail");
	const connectionSkipped = checks.some(
		(check) => check.id === "database-skipped",
	);

	if (connectionFailed || connectionSkipped) {
		return connectivityGroup;
	}

	const migrationStatus = await getPendingMigrations();
	if (!migrationStatus.ok) {
		checks.push(
			createCheck("migrations", "Migrations", "fail", migrationStatus.error),
		);
	} else if (!migrationStatus.tableExists) {
		checks.push(
			createCheck(
				"migrations-table",
				"Migrations",
				"fail",
				"drizzle.__drizzle_migrations table not found",
				MIGRATE_HINT,
			),
		);
	} else if (!migrationStatus.journalAvailable) {
		checks.push(
			createCheck(
				"migrations-journal",
				"Migrations",
				"warn",
				`cannot verify completeness (${migrationStatus.appliedHashCount} applied; journal unavailable)`,
				MIGRATE_HINT,
			),
		);
	} else if (migrationStatus.pending > 0) {
		const pendingList = migrationStatus.tags.join(", ");
		checks.push(
			createCheck(
				"migrations-pending",
				"Migrations",
				"fail",
				`${migrationStatus.appliedCount}/${migrationStatus.expectedCount} applied (pending: ${pendingList})`,
				MIGRATE_HINT,
			),
		);
	} else if (migrationStatus.appliedHashCount < migrationStatus.expectedCount) {
		checks.push(
			createCheck(
				"migrations-count",
				"Migrations",
				"fail",
				`${migrationStatus.appliedHashCount}/${migrationStatus.expectedCount} applied`,
				MIGRATE_HINT,
			),
		);
	} else {
		checks.push(
			createCheck(
				"migrations",
				"Migrations",
				"pass",
				`${migrationStatus.expectedCount}/${migrationStatus.expectedCount} applied`,
			),
		);
	}

	const connectionString = process.env.DATABASE_URL as string;
	const tables = await fetchExistingTables(connectionString);
	if (!tables.ok) {
		checks.push(
			createCheck("schema-tables", "Schema tables", "fail", tables.error),
		);
	} else {
		const expected = getExpectedTables();
		const existing = new Set(tables.tables);
		const missing = expected.filter((table) => !existing.has(table));

		if (missing.length > 0) {
			checks.push(
				createCheck(
					"schema-tables",
					"Schema tables",
					"fail",
					`${existing.size}/${expected.length} present (missing: ${missing.join(", ")})`,
					MIGRATE_HINT,
				),
			);
		} else {
			checks.push(
				createCheck(
					"schema-tables",
					"Schema tables",
					"pass",
					`${expected.length}/${expected.length} present`,
				),
			);
		}
	}

	return createGroup("database", "Database", checks);
}
