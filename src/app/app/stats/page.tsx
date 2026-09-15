import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getMembershipActive } from "@/lib/db/users";
import { getUserStats } from "@/lib/stats";
import { StatsCard } from "@/components/StatsCard";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");

  // Same Phase 6 paid gate as /app — no free tier, stats included.
  const membershipActive = await getMembershipActive(session.userId);
  if (!membershipActive) redirect("/subscribe");

  const [stats, headerList] = await Promise.all([getUserStats(session.userId), headers()]);
  const shareUrl = `https://${headerList.get("host")}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <a href="/app" className="text-xs text-neutral-500 hover:underline">
        &larr; Back to bookmarks
      </a>
      <h1 className="mt-2 mb-6 text-lg font-semibold">Your stats</h1>
      <StatsCard stats={stats} handle={session.username} shareUrl={shareUrl} />
    </main>
  );
}
