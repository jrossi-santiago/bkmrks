CREATE INDEX IF NOT EXISTS "bookmark_tags_tag_idx" ON "bookmark_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmarks_user_source_order_live_idx" ON "bookmarks" USING btree ("user_id","source_order" DESC NULLS LAST) WHERE deleted_at is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmarks_embedding_hnsw_idx" ON "bookmarks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_user_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_x_handle_lower_idx" ON "users" USING btree (lower("x_handle"));