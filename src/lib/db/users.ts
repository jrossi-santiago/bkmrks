import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { users } from "./schema";
import { encryptString, decryptString } from "../crypto";
import { refreshAccessToken } from "../x";

export async function upsertUserFromLogin(params: {
  xUserId: string;
  xHandle: string;
  xDisplayName: string;
  xAvatarUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<string> {
  const db = getDb();
  const values = {
    xHandle: params.xHandle,
    xDisplayName: params.xDisplayName,
    xAvatarUrl: params.xAvatarUrl,
    accessToken: await encryptString(params.accessToken),
    refreshToken: await encryptString(params.refreshToken),
    tokenExpiresAt: params.expiresAt,
  };

  const [row] = await db
    .insert(users)
    .values({ id: crypto.randomUUID(), xUserId: params.xUserId, ...values })
    .onConflictDoUpdate({ target: users.xUserId, set: values })
    .returning({ id: users.id });

  return row.id;
}

// Returns a live access token for this user, refreshing (and persisting the
// refreshed tokens — X rotates the refresh token on every use, see
// PROJECT_BRIEF.md Phase 0 answers) if it's within a minute of expiring.
export async function getValidAccessToken(userId: string): Promise<string> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");

  const needsRefresh = user.tokenExpiresAt.getTime() <= Date.now() + 60_000;
  if (!needsRefresh) {
    const accessToken = await decryptString(user.accessToken);
    if (!accessToken) throw new Error("Could not decrypt access token");
    return accessToken;
  }

  const refreshToken = await decryptString(user.refreshToken);
  if (!refreshToken) throw new Error("Could not decrypt refresh token");

  const refreshed = await refreshAccessToken(refreshToken);
  await db
    .update(users)
    .set({
      accessToken: await encryptString(refreshed.access_token),
      refreshToken: await encryptString(refreshed.refresh_token ?? refreshToken),
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    })
    .where(eq(users.id, userId));

  return refreshed.access_token;
}

// Phase 6: the only place membership_active is ever written, called
// exclusively from the verified Whop webhook handler
// (src/app/api/webhooks/whop/route.ts) — never from anything a browser
// can reach directly.
export async function setMembershipActive(
  userId: string,
  params: { active: boolean; whopMembershipId: string }
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      membershipActive: params.active,
      whopMembershipId: params.whopMembershipId,
      membershipUpdatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
