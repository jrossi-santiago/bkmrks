"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { decryptSession, SESSION_COOKIE } from "@/lib/session";
import { addTagToBookmark, removeTagFromBookmark, setTagPublic, addBookmarkToPublicTag } from "@/lib/tags";

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

export async function addToPublicAction(formData: FormData) {
  const userId = await requireUserId();
  const bookmarkId = String(formData.get("bookmarkId") ?? "");
  await addBookmarkToPublicTag(userId, bookmarkId);
  revalidatePath("/app");
}

export async function toggleTagPublicAction(formData: FormData) {
  const userId = await requireUserId();
  const tagId = String(formData.get("tagId") ?? "");
  const isPublic = formData.get("isPublic") === "1";
  await setTagPublic(userId, tagId, isPublic);
  revalidatePath("/app");
}
