export function bookmarksApiUrl(userId: string, paginationToken?: string) {
  const url = new URL(`https://api.x.com/2/users/${userId}/bookmarks`);
  url.searchParams.set("max_results", "10");
  url.searchParams.set(
    "tweet.fields",
    "created_at,author_id,attachments,public_metrics,entities,text"
  );
  url.searchParams.set("expansions", "author_id,attachments.media_keys");
  url.searchParams.set("user.fields", "username,name,profile_image_url");
  url.searchParams.set(
    "media.fields",
    "media_key,type,url,preview_image_url,duration_ms,height,width,variants"
  );
  if (paginationToken) url.searchParams.set("pagination_token", paginationToken);
  return url;
}
