// The one vendor module for OpenAI — embeddings only, nothing else. Every
// call to OpenAI anywhere in this app goes through here. Plain fetch(),
// same style as src/lib/x.ts and src/lib/whop.ts — no SDK dependency for a
// single REST endpoint.

const EMBEDDING_MODEL = "text-embedding-3-small";

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY env var.");
  return key;
}

type EmbeddingsResponse = {
  data: { embedding: number[]; index: number }[];
};

// Batch text -> vector embeddings, used both to embed bookmark text (see
// src/lib/embed.ts) and to embed a search query (see src/app/app/page.tsx).
// Returns vectors in the same order as `texts` — OpenAI's response already
// preserves input order, but this sorts by the response's own `index`
// defensively rather than trusting that.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`POST /v1/embeddings failed: HTTP ${res.status}`);

  const json: EmbeddingsResponse = await res.json();
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
