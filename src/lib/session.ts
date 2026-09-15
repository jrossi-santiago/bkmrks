// Encrypted session storage. Phase 1 has no database, so the signed-in
// user's tokens live only in one encrypted, httpOnly cookie (AES-256-GCM
// via Web Crypto, portable between the Node route handlers and the Edge
// middleware that refreshes it — no node:crypto dependency).

export const SESSION_COOKIE = "bkmrks_session";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days; actual API access is governed by expiresAt below, not this
};

export type Session = {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
};

async function importKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET env var.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptSession(session: Session): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

export async function decryptSession(value: string): Promise<Session | null> {
  try {
    const [ivPart, ciphertextPart] = value.split(".");
    if (!ivPart || !ciphertextPart) return null;
    const key = await importKey();
    const iv = fromBase64Url(ivPart);
    const ciphertext = fromBase64Url(ciphertextPart);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext)) as Session;
  } catch {
    return null; // tampered, wrong key, or malformed — treat as signed out
  }
}
