import { cookies } from "next/headers";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ login_error?: string }>;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  const { login_error: loginError } = await searchParams;

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">bkmrks</h1>
      <p className="mt-2 text-neutral-500">
        See every tweet you&apos;ve bookmarked on X, in one clean dashboard.
      </p>

      {loginError && (
        <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {loginError}
        </p>
      )}

      <div className="mt-8">
        {session ? (
          <a
            href="/app"
            className="inline-block rounded-full bg-neutral-900 px-6 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Go to dashboard
          </a>
        ) : (
          <a
            href="/login"
            className="inline-block rounded-full bg-neutral-900 px-6 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Sign in with X
          </a>
        )}
      </div>
    </main>
  );
}
