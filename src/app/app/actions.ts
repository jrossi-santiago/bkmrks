"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { addTagToBookmark, removeTagFromBookmark } from "@/lib/tags";

async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const session = raw ? await decryptSession(raw) : null;
  if (!session) throw new Error("Not signed in.");
  return session.userId;
}

export async function addTagAction(formData: FormData) {
  const userId = await requireUserId();
  const bookmarkId = String(formData.get("bookmarkId") ?? "");
  const name = String(formData.get("name") ?? "");
  await addTagToBookmark(userId, bookmarkId, name);
  revalidatePath("/app");
}

export async function removeTagAction(formData: FormData) {
  const userId = await requireUserId();
  const bookmarkId = String(formData.get("bookmarkId") ?? "");
  const tagId = String(formData.get("tagId") ?? "");
  await removeTagFromBookmark(userId, bookmarkId, tagId);
  revalidatePath("/app");
}
