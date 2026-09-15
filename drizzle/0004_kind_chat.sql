CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "embedding" vector(1536);