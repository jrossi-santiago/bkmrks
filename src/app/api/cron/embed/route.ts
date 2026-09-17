import { NextRequest, NextResponse } from "next/server";
import { embedPendingBookmarks } from "@/lib/embed";

// Explicit ceiling rather than Vercel's default, so a future plan upgrade
// doesn't silently raise this job's ceiling (and cost) without a
// deliberate change.
export const maxDuration = 300;

// Invoked by Vercel Cron (see vercel.json). Fails closed if CRON_SECRET
// isn't set to match. This is the safety net that backfills bookmarks
// synced before this feature shipped, and catches up anything
// embedPendingBookmarks missed inline during a sync (src/lib/sync.ts) —
// "embedding IS NULL" is a durable queue, so a run that doesn't fully
// drain it just continues next time.
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
