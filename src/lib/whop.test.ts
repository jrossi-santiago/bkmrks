// Proves Phase 6's webhook signature verification actually rejects what it
// should, using the real crypto (standardwebhooks — the library @whop/sdk's
// unwrapWebhook is built on, see src/lib/whop.ts) rather than eyeballing
// the code. No live Whop connection needed: this signs test payloads
// itself with a fake secret and checks verifyWhopWebhook's behavior
// against them.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Webhook } from "standardwebhooks";
import { verifyWhopWebhook, WebhookVerificationError } from "./whop";

// Mirrors src/lib/whop.ts's internal hmacKey(): base64-encode the secret so
// standardwebhooks' own base64-decode on construction recovers the exact
// bytes Whop's backend signs with (and that verifyWhopWebhook, reading
// WHOP_WEBHOOK_SECRET as the raw un-encoded string, ends up comparing
// against).
function signerFor(secret: string): Webhook {
  return new Webhook(Buffer.from(secret, "utf8").toString("base64"));
}

function sign(webhook: Webhook, id: string, body: string) {
  const timestamp = new Date();
  return {
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": webhook.sign(id, timestamp, body),
  };
}

const SECRET = "ws_test_secret_for_unit_tests_only";

test("verifyWhopWebhook accepts a correctly signed payload and returns it parsed", () => {
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  const body = JSON.stringify({ type: "membership.activated", data: { id: "mem_1" } });
  const headers = sign(signerFor(SECRET), "msg_1", body);

  const event = verifyWhopWebhook(body, headers);
  assert.equal(event.type, "membership.activated");
  assert.equal(event.data.id, "mem_1");
});

test("verifyWhopWebhook rejects a payload signed with the wrong secret", () => {
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  const body = JSON.stringify({ type: "membership.activated", data: { id: "mem_1" } });
  const headers = sign(signerFor("ws_a_totally_different_secret"), "msg_1", body);

  assert.throws(() => verifyWhopWebhook(body, headers), WebhookVerificationError);
});

test("verifyWhopWebhook rejects a tampered body even with headers valid for the original body", () => {
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  const originalBody = JSON.stringify({ type: "membership.activated", data: { id: "mem_1" } });
  const headers = sign(signerFor(SECRET), "msg_1", originalBody);
  const tamperedBody = JSON.stringify({ type: "membership.activated", data: { id: "mem_SOMEONE_ELSES" } });

  assert.throws(() => verifyWhopWebhook(tamperedBody, headers), WebhookVerificationError);
});

test("verifyWhopWebhook rejects requests with no signature headers at all", () => {
  process.env.WHOP_WEBHOOK_SECRET = SECRET;
  assert.throws(() => verifyWhopWebhook("{}", {}), WebhookVerificationError);
});

test("verifyWhopWebhook throws a plain Error (not silently passing) when the secret isn't configured", () => {
  delete process.env.WHOP_WEBHOOK_SECRET;
  const body = JSON.stringify({ type: "membership.activated", data: { id: "mem_1" } });
  const headers = sign(signerFor(SECRET), "msg_1", body);

  assert.throws(() => verifyWhopWebhook(body, headers), /key/i);
});
