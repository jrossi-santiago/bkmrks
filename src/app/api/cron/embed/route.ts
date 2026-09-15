import { NextRequest, NextResponse } from "next/server";
import { embedPendingBookmarks } from "@/lib/embed";

// Same duration ceiling as /api/cron/revalidate — see that route for why
// this is set explicitly rather than left at Vercel's default.
export const maxDuration = 300;

// Invoked by Vercel Cron (see vercel.json). Same auth pattern as
// /api/cron/revalidate: fails closed if CRON_SECRET isn't set to match.
// This is the safety net that backfills bookmarks synced before this
// feature shipped, and catches up anything embedPendingBookmarks missed
// inline during a sync (src/lib/sync.ts) — "embedding IS NULL" is a durable
// queue, so a run that doesn't fully drain it just continues next time.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await embedPendingBookmarks({});
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("embed cron failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
