ALTER TABLE "role_definition" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "role_permission" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "role_definition" CASCADE;--> statement-breakpoint
DROP TABLE "role_permission" CASCADE;--> statement-breakpoint
ALTER TABLE "apikey" DROP CONSTRAINT "apikey_id_unique";--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "config_id" SET DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "last_refill_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rate_limit_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rate_limit_time_window" SET DEFAULT 86400000;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "rate_limit_max" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "request_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "last_request" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apikey" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "username" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "is_anonymous" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "banned" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apikey_configId_idx" ON "apikey" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apikey_referenceId_idx" ON "apikey" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apikey_key_idx" ON "apikey" USING btree ("key");
