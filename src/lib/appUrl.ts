// Builds an /app URL carrying only the given filter/search params — shared
// by TagFilterBar and SearchBar so a link from either one preserves
// whatever the other currently has set (e.g. clicking a tag chip while a
// search is active keeps ?q=..., and vice versa).
export function buildAppHref(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return qs ? `/app?${qs}` : "/app";
}
