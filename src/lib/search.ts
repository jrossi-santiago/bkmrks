// A query wrapped in double quotes ("like this") is an exact-phrase search
// request — same convention as Google's quoted search — rather than a
// semantic one. Returns "" when `q` isn't quoted (or the quotes wrap
// nothing but whitespace), which callers treat as "not exact-phrase mode".
export function parseExactPhrase(q: string): string {
  if (q.length < 2 || !q.startsWith('"') || !q.endsWith('"')) return "";
  return q.slice(1, -1).trim();
}

// Escapes ILIKE's own wildcard characters (`%`, `_`) and its escape
// character (`\`) so a literal occurrence of any of them in a searched
// phrase is matched literally instead of as a pattern.
export function escapeIlikePattern(phrase: string): string {
  return phrase.replace(/[\\%_]/g, "\\$&");
}
