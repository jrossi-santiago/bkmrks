// The one vendor module for Whop (api.whop.com) — checkout creation and
// webhook verification, nothing else. Built against @whop/sdk v1.1.4's
// actual compiled types/source (node_modules/@whop/sdk/dist/cjs/...), not
// scraped docs — several of Whop's own doc pages disagreed with each other
// and with the real client (e.g. the checkout endpoint is
// "checkout_configurations", underscored, not the hyphenated form most
// docs pages show). REST calls use plain fetch(), same as src/lib/x.ts,
// except webhook signature verification, which uses the SDK's own
// `unwrapWebhook` helper (@whop/sdk/helpers) rather than a hand-rolled
// HMAC check — that's a security-critical primitive worth trusting to the
// vendor rather than reimplementing.
import { unwrapWebhook, WebhookVerificationError } from "@whop/sdk/helpers";

const API_BASE = process.env.WHOP_API_BASE_URL ?? "https://api.whop.com/api/v1";

// Unauthenticated connectivity check for /health — mirrors src/lib/x.ts's
// pingApi(), confirms DNS/TLS/routing to api.whop.com without needing
// valid credentials.
export async function pingWhopApi(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/checkout_configurations`, { signal: AbortSignal.timeout(5000) });
    return `HTTP ${res.status} (any response here means DNS/TLS/routing to api.whop.com works)`;
  } catch (err) {
    return `fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function apiKey(): string {
  const key = process.env.WHOP_API_KEY;
  if (!key) throw new Error("Missing WHOP_API_KEY env var.");
  return key;
}

// Creates a reusable checkout link for the app's one membership plan
// (WHOP_PLAN_ID — created once in the Whop dashboard; see DEPLOY.md).
// metadata.bkmrksUserId is how the webhook handler later knows which of
// our users a membership belongs to — Whop's own user id on the
// resulting membership is the *buyer's* Whop account, not any id of ours.
export async function createCheckoutConfiguration(params: {
  userId: string;
  redirectUrl: string;
}): Promise<{ purchaseUrl: string }> {
  const planId = process.env.WHOP_PLAN_ID;
  if (!planId) throw new Error("Missing WHOP_PLAN_ID env var.");

  const res = await fetch(`${API_BASE}/checkout_configurations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      metadata: { bkmrksUserId: params.userId },
      redirect_url: params.redirectUrl,
    }),
  });
  if (!res.ok) throw new Error(`POST /checkout_configurations failed: HTTP ${res.status}`);

  const json = await res.json();
  if (!json.purchase_url) throw new Error("Whop checkout configuration response had no purchase_url");
  return { purchaseUrl: json.purchase_url as string };
}

// Only the fields src/app/api/webhooks/whop/route.ts actually reads.
// unwrapWebhook's TEvent is an unchecked assertion on the parsed body (see
// @whop/sdk's own doc comment), not a validated shape, so the route still
// runtime-checks these before using them — this type only gets TS to help
// at the call site, it isn't proof the fields exist.
export type WhopMembershipWebhookEvent = {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    user_id: string | null;
    metadata: Record<string, unknown>;
  };
};

export { WebhookVerificationError };

// Verifies the Standard Webhooks signature Whop sends on every delivery
// (HMAC-SHA256 over "{webhook-id}.{webhook-timestamp}.{raw body}") and
// returns the parsed body. `rawBody` must be the exact, unparsed request
// text — verifying a re-serialized body always fails since the signature
// covers the original bytes. Throws WebhookVerificationError on a
// missing/malformed/expired signature.
export function verifyWhopWebhook(rawBody: string, headers: Record<string, string>): WhopMembershipWebhookEvent {
  return unwrapWebhook<WhopMembershipWebhookEvent>(rawBody, {
    headers,
    key: process.env.WHOP_WEBHOOK_SECRET,
  });
}
