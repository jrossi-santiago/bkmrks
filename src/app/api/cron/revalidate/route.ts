import { NextRequest, NextResponse } from "next/server";
import { runRevalidation } from "@/lib/revalidate";

// Fluid compute default/ceiling on Hobby is 300s — set explicitly so a
// future Pro upgrade doesn't silently raise this job's ceiling (and cost)
// to 800s without a deliberate change. MAX_BOOKMARKS_PER_RUN in
// src/lib/revalidate.ts keeps a normal run far under this anyway.
export const maxDuration = 300;

// Invoked by Vercel Cron (see vercel.json) on a daily schedule. Vercel does
// NOT provision CRON_SECRET automatically — it must be set in Vercel
// project env vars (see DEPLOY.md) — and sends it back as
// `Authorization: Bearer $CRON_SECRET` on every invocation. Fails closed:
// an unset secret is treated the same as a wrong one, so this route can
// never run open just because vercel.json exists but the env var doesn't.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRevalidation();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("revalidation cron failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
