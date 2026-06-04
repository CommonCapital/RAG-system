import "dotenv/config";
import { initSchema, getPool } from "../lib/db";
import { KNOWLEDGE } from "../lib/knowledge";

async function seed() {
  console.log("🔧  Initialising schema on Neon…");
  await initSchema();

  const db = getPool();
  await db.query("TRUNCATE knowledge_chunks");
  console.log("🗑   Cleared existing chunks.");

  console.log(`📚  Inserting ${KNOWLEDGE.length} knowledge chunks…`);

  for (let i = 0; i < KNOWLEDGE.length; i++) {
    const { source, category, content } = KNOWLEDGE[i];
    process.stdout.write(`  [${i + 1}/${KNOWLEDGE.length}] ${category}… `);

    await db.query(
      `INSERT INTO knowledge_chunks (source, category, content) VALUES ($1, $2, $3)`,
      [source, category, content]
    );

    console.log("✓");
  }

  console.log("\n✅  Seed complete — no embeddings needed, keyword retrieval is active.");
  await db.end();
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
