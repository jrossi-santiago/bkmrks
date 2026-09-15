// The session cookie is just an identity pointer now — as of Phase 2, X
// tokens live encrypted in the users table (src/lib/db), not in the
// cookie, so a stolen/leaked cookie can't be replayed against X's API.
import { encryptString, decryptString } from "./crypto";

export const SESSION_COOKIE = "bkmrks_session";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export type Session = {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
};

export async function encryptSession(session: Session): Promise<string> {
  return encryptString(JSON.stringify(session));
}

export async function decryptSession(value: string): Promise<Session | null> {
  const plaintext = await decryptString(value);
  if (!plaintext) return null;
  try {
    return JSON.parse(plaintext) as Session;
  } catch {
    return null;
  }
}
