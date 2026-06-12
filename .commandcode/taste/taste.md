# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# workflow
- Use pnpm workspace and turborepo for the development workflow. Confidence: 0.75
- When adding new database tables outside the Drizzle schema (e.g., Better Auth plugin tables), apply SQL migrations directly via postgres.unsafe() rather than using drizzle-kit, which requires TTY or tries to re-apply existing migrations. Confidence: 0.70

# data-fetching
- Use TanStack Query for data fetching. Confidence: 0.80

# validation
- Use ArkType for input schema control. Confidence: 0.80
