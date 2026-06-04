/**
 * Embedding client.
 *
 * Active:   EMBED_API_URL + EMBED_API_KEY  — any OpenAI-compatible endpoint
 * Silenced: Ollama (kept for when a local model is available)
 *
 * DeepSeek does not provide an embedding endpoint.
 * When no embed API is configured, retrieval falls back to keyword scoring
 * in lib/retrieval.ts — no embeddings needed.
 */

const EMBED_API_URL = process.env.EMBED_API_URL;
const EMBED_API_KEY = process.env.EMBED_API_KEY;
const EMBED_API_MODEL = process.env.EMBED_API_MODEL ?? "text-embedding-3-small";

// Ollama — silenced until a local model is available
// const OLLAMA_BASE  = process.env.OLLAMA_BASE_URL  ?? "http://localhost:11434";
// const OLLAMA_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

export function hasEmbedProvider(): boolean {
  return !!(EMBED_API_URL && EMBED_API_KEY);
}

export async function embed(text: string): Promise<number[]> {
  if (!EMBED_API_URL || !EMBED_API_KEY) {
    throw new Error("No embed provider configured. Set EMBED_API_URL + EMBED_API_KEY, or rely on keyword retrieval.");
  }

  const res = await fetch(EMBED_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${EMBED_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_API_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`Embed API ${res.status}: ${await res.text()}`);
  const json = await res.json() as { data: [{ embedding: number[] }] };
  return json.data[0].embedding;
}

// export async function embedViaOllama(text: string): Promise<number[]> {
//   const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, { ... });
//   ...
// }
