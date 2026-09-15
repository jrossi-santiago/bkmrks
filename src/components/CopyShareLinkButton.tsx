"use client";

import { useState } from "react";

// The one bit of client JS in this app's tag UI — copying to the OS
// clipboard has no server-side equivalent. Builds the absolute URL from
// window.location.origin so it's correct on whichever host the dashboard
// is being viewed from (bkmrks.xyz vs the *.vercel.app domain).
export function CopyShareLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (insecure context, denied
      // permission) — fail quietly rather than throwing in the UI.
    }
  }

  return (
    <button type="button" onClick={handleClick} className="text-xs text-neutral-500 hover:underline">
      {copied ? "Copied!" : "Copy share link"}
    </button>
  );
}
