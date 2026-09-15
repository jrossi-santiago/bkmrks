"use client";

import { useEffect, useRef, useState } from "react";

// The account block plus Stats/Reading mode/Refresh/Sign out used to be one
// flex row — fine on desktop, but it has no room to breathe below ~500px
// and either overflows or wraps into a jumble. Below `sm` those actions
// collapse into this dropdown behind a hamburger button instead.
export function AppHeader({
  name,
  username,
  avatarUrl,
  readingMode,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
  readingMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const linkClass = "text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100";
  const menuItemClass =
    "block w-full rounded-md px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <header className="mb-8 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full" />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-sm text-neutral-500">@{username}</p>
        </div>
      </div>

      <nav aria-label="Account" className="hidden items-center gap-4 sm:flex">
        <a href="/app/stats" className={linkClass}>
          Stats
        </a>
        <form action="/app/reading-mode" method="post">
          <input type="hidden" name="next" value={readingMode ? "0" : "1"} />
          <button type="submit" className={linkClass}>
            Reading mode: {readingMode ? "on" : "off"}
          </button>
        </form>
        <form action="/app/refresh" method="post">
          <button type="submit" className={linkClass}>
            Refresh
          </button>
        </form>
        <form action="/app/sign-out" method="post">
          <button type="submit" className={linkClass}>
            Sign out
          </button>
        </form>
      </nav>

      <div className="relative shrink-0 sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="app-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          {open ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          )}
        </button>

        {open && (
          <div
            id="app-mobile-menu"
            role="menu"
            className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <a href="/app/stats" role="menuitem" className={menuItemClass} onClick={() => setOpen(false)}>
              Stats
            </a>
            <form action="/app/reading-mode" method="post">
              <input type="hidden" name="next" value={readingMode ? "0" : "1"} />
              <button type="submit" role="menuitem" className={menuItemClass}>
                Reading mode: {readingMode ? "on" : "off"}
              </button>
            </form>
            <form action="/app/refresh" method="post">
              <button type="submit" role="menuitem" className={menuItemClass}>
                Refresh
              </button>
            </form>
            <form action="/app/sign-out" method="post">
              <button type="submit" role="menuitem" className={menuItemClass}>
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
