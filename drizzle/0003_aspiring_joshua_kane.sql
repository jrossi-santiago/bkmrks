ALTER TABLE "users" ADD COLUMN "whop_membership_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_updated_at" timestamp with time zone;--> statement-breakpoint
-- One-time grandfather clause for the product owner's own pre-Phase-6
-- account: everyone else (including every future signup) starts at the
-- schema default, membership_active = false. This is a data migration
-- bundled with the schema change specifically because it must run exactly
-- once, automatically, on the deploy that introduces the gate — not
-- something to redo by hand in Supabase's SQL editor.
UPDATE "users" SET "membership_active" = true, "membership_updated_at" = now() WHERE lower("x_handle") = 'thejosephrossi';