import { NextRequest, NextResponse } from "next/server";
import { pingApi } from "@/lib/x";
import { pingWhopApi } from "@/lib/whop";

// Diagnostic page — no secrets rendered, just presence/length of env vars and
// the exact redirect_uri /login will send, since a mismatch against the
// Callback URI registered on the X app is the most common cause of a login
// failure (X rejects it before we ever see a request).
export async function GET(request: NextRequest) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const host = request.headers.get("host") ?? "(no host header)";
  const redirectUri = `${request.nextUrl.protocol}//${host}/api/auth/callback`;

  const apiReachable = await pingApi();
  const whopApiReachable = await pingWhopApi();

  const lines = [
    "=== env ===",
    `X_CLIENT_ID: ${describe(clientId)}`,
    `X_CLIENT_SECRET: ${describe(clientSecret)}`,
    `SESSION_SECRET: ${describe(sessionSecret)}`,
    `CRON_SECRET: ${describe(process.env.CRON_SECRET)}`,
    `WHOP_API_KEY: ${describe(process.env.WHOP_API_KEY)}`,
    `WHOP_WEBHOOK_SECRET: ${describe(process.env.WHOP_WEBHOOK_SECRET)}`,
    `WHOP_PLAN_ID: ${describe(process.env.WHOP_PLAN_ID)}`,
    `NODE_ENV: ${process.env.NODE_ENV ?? "(unset)"}`,
    `VERCEL_ENV: ${process.env.VERCEL_ENV ?? "(unset — not running on Vercel?)"}`,
    `VERCEL_URL: ${process.env.VERCEL_URL ?? "(unset)"}`,
    "",
    "=== this request ===",
    `host header: ${host}`,
    `protocol: ${request.nextUrl.protocol}`,
    "",
    "=== redirect_uri /login will send ===",
    redirectUri,
    "^ must exactly match a Callback URI / Redirect URL registered on the",
    "  X app (developer.x.com -> your app -> User authentication settings).",
    "  Scheme, host, and path all have to match character-for-character.",
    "",
    "=== outbound reachability to api.x.com ===",
    apiReachable,
    "",
    "=== outbound reachability to api.whop.com ===",
    whopApiReachable,
  ];

  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>health</title><pre style="white-space:pre-wrap;font:13px/1.5 ui-monospace,Menlo,monospace;padding:24px;max-width:800px;margin:0 auto;">${lines
      .join("\n")
      .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

function describe(value: string | undefined): string {
  if (!value) return "NOT SET";
  return `set (${value.length} chars)`;
}
