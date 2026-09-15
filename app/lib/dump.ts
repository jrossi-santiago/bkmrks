// Shared rendering for the Phase 0 spike's raw-response debug pages.
export function section(label: string, res: Response, body: unknown): string {
  const rateLimit: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    if (key.toLowerCase().includes("rate-limit")) rateLimit[key] = value;
  });
  return [
    `=== ${label} — HTTP ${res.status} ===`,
    Object.keys(rateLimit).length ? `rate limit headers: ${JSON.stringify(rateLimit, null, 2)}` : null,
    JSON.stringify(body, null, 2),
  ]
    .filter(Boolean)
    .join("\n");
}

export function dump(text: string) {
  return new Response(renderPre(escapeHtml(text)), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// Same as dump(), but appends real (unescaped) links — e.g. "fetch next page".
export function dumpWithLinks(text: string, links: { href: string; label: string }[]) {
  const linksHtml = links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("  ");
  const body = escapeHtml(text) + (links.length ? `\n\n${linksHtml}` : "");
  return new Response(renderPre(body), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(text: string) {
  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function renderPre(body: string) {
  return `<!doctype html><meta charset="utf-8"><title>Phase 0 dump</title><pre style="white-space:pre-wrap;word-break:break-word;font:13px/1.5 ui-monospace,Menlo,monospace;padding:24px;max-width:960px;margin:0 auto;">${body}</pre>`;
}
