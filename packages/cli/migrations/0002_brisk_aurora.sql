CREATE TABLE IF NOT EXISTS "server_log" (
	"id" text PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"scope" text NOT NULL,
	"message" text NOT NULL,
	"request_id" text,
	"method" text,
	"path" text,
	"status_code" integer,
	"duration_ms" integer,
	"ip_address" text,
	"user_agent" text,
	"user_id" text,
	"error_name" text,
	"error_message" text,
	"error_stack" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "server_log_created_at_idx" ON "server_log" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "server_log_level_idx" ON "server_log" USING btree ("level");