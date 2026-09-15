import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

// Phase 6's paid gate landing page — where /app and the login callback
// send anyone without an active membership. No free tier, so this is the
// only other place a signed-in user can be.
export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) redirect("/login");

  const db = getDb();
  const [user] = await db
    .select({ membershipActive: users.membershipActive })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (user?.membershipActive) redirect("/app");

  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="mb-2 text-lg font-semibold">bkmrks is a paid dashboard</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Signed in as @{session.username}. An active membership is required to use the
        dashboard — there&apos;s no free tier.
      </p>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <a
        href="/subscribe/start"
        className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Subscribe with Whop
      </a>

      <form action="/app/sign-out" method="post" className="mt-6">
        <button type="submit" className="text-xs text-neutral-400 hover:underline">
          Sign out
        </button>
      </form>
    </main>
  );
}
