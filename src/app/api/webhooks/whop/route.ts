import { NextRequest, NextResponse } from "next/server";
import { verifyWhopWebhook, WebhookVerificationError } from "@/lib/whop";
import { setMembershipActive } from "@/lib/db/users";

// The only inbound entry point for Phase 6's paid gate: Whop POSTs here on
// membership.activated/deactivated (configured as a webhook subscription
// in the Whop dashboard — see DEPLOY.md), and this is the only code path
// that ever sets users.membership_active. Everything else in the app only
// reads that column.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event;
  try {
    event = verifyWhopWebhook(rawBody, headers);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }
    console.error("whop webhook: verification setup error", err);
    return NextResponse.json({ error: "verification failed" }, { status: 500 });
  }

  if (event.type !== "membership.activated" && event.type !== "membership.deactivated") {
    return NextResponse.json({ ok: true, skipped: event.type });
  }

  // unwrapWebhook only verifies the signature — it doesn't validate the
  // parsed body against WhopMembershipWebhookEvent (see src/lib/whop.ts),
  // so these fields are checked here before use.
  const bkmrksUserId = event.data?.metadata?.bkmrksUserId;
  const membershipId = event.data?.id;
  if (typeof bkmrksUserId !== "string" || !bkmrksUserId || typeof membershipId !== "string") {
    // Not something a retry would fix — ack so Whop stops resending it.
    console.error("whop webhook: missing bkmrksUserId metadata or membership id", event);
    return NextResponse.json({ ok: true, skipped: "missing metadata" });
  }

  try {
    await setMembershipActive(bkmrksUserId, {
      active: event.type === "membership.activated",
      whopMembershipId: membershipId,
    });
  } catch (err) {
    console.error("whop webhook: failed to update membership status", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
