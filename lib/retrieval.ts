import { getPool } from "./db";
import { hasEmbedProvider, embed } from "./embeddings";

export interface Chunk {
  id: string;
  source: string;
  category: string;
  content: string;
  similarity: number;
}

/**
 * Retrieves the top-k most relevant knowledge chunks.
 *
 * Mode A (vector):  when EMBED_API_URL + EMBED_API_KEY are set — pgvector cosine search.
 * Mode B (keyword): current default — TF-style keyword scoring against all chunks in DB.
 *                   Fast and accurate enough for a small knowledge base (~40 chunks).
 */
export async function retrieve(query: string, topK = 6): Promise<Chunk[]> {
  if (hasEmbedProvider()) {
    return retrieveByVector(query, topK);
  }
  return retrieveByKeyword(query, topK);
}

async function retrieveByVector(query: string, topK: number): Promise<Chunk[]> {
  const vec = await embed(query);
  const db = getPool();
  const { rows } = await db.query<Chunk>(
    `SELECT id, source, category, content,
            1 - (embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [`[${vec.join(",")}]`, topK]
  );
  return rows;
}

async function retrieveByKeyword(query: string, topK: number): Promise<Chunk[]> {
  const db = getPool();
  const { rows } = await db.query<Omit<Chunk, "similarity">>(
    `SELECT id, source, category, content FROM knowledge_chunks`
  );

  const terms = tokenise(query);

  const scored = rows.map((row) => ({
    ...row,
    similarity: score(terms, row.content, row.category),
  }));

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter((c) => c.similarity > 0);
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function score(queryTerms: string[], content: string, category: string): number {
  const target = (content + " " + category).toLowerCase();
  const words = target.split(/\s+/);
  const wordSet = new Set(words);

  let hits = 0;
  let exactPhraseBonus = 0;

  for (const term of queryTerms) {
    if (wordSet.has(term)) hits += 1;
    else if (target.includes(term)) hits += 0.5;
  }

  // Bonus if the full query phrase appears verbatim
  if (target.includes(queryTerms.join(" "))) exactPhraseBonus = 2;

  return hits + exactPhraseBonus;
}

export function buildContext(chunks: Chunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] (${c.category}) ${c.content.trim()}`)
    .join("\n\n");
}
