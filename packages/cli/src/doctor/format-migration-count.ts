export function formatMigrationCount(count: number): string {
	return count === 1 ? "1 migration" : `${count} migrations`;
}
