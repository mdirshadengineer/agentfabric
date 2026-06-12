-- Add active_organization_id to session for organization plugin
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;

-- Create workspace table (renamed from organization via schema.modelName)
CREATE TABLE IF NOT EXISTS "workspace" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "logo" text,
    "created_at" timestamp NOT NULL,
    "metadata" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_slug_uidx" ON "workspace" USING btree ("slug");

-- Create workspace_member table (renamed from member via schema.modelName)
CREATE TABLE IF NOT EXISTS "workspace_member" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL,
    "user_id" text NOT NULL,
    "role" text DEFAULT 'member' NOT NULL,
    "created_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "workspace_member_organizationId_idx" ON "workspace_member" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "workspace_member_userId_idx" ON "workspace_member" USING btree ("user_id");

-- Add foreign keys
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_organization_id_workspace_id_fk" 
    FOREIGN KEY ("organization_id") REFERENCES "workspace"("id") ON DELETE CASCADE;
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

-- Create invitation table
CREATE TABLE IF NOT EXISTS "invitation" (
    "id" text PRIMARY KEY NOT NULL,
    "organization_id" text NOT NULL,
    "email" text NOT NULL,
    "role" text,
    "status" text DEFAULT 'pending' NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "inviter_id" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" USING btree ("email");

-- Add foreign keys
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_workspace_id_fk" 
    FOREIGN KEY ("organization_id") REFERENCES "workspace"("id") ON DELETE CASCADE;
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" 
    FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;
