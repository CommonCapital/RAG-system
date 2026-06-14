import { getPool } from "@/lib/db";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const RECENT_WINDOW = 10;   // messages kept verbatim
const SUMMARIZE_AFTER = 20; // total stored before compression kicks in

export async function getMemoryContext(userId: string): Promise<{
  summary: string | null;
  recentMessages: ChatMessage[];
}> {
  const db = getPool();

  const [summaryRes, msgRes] = await Promise.all([
    db.query<{ summary: string }>(
      `SELECT summary FROM user_summaries WHERE user_id = $1`,
      [userId]
    ),
    db.query<ChatMessage>(
      `SELECT role, content FROM user_conversations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, RECENT_WINDOW]
    ),
  ]);

  return {
    summary: summaryRes.rows[0]?.summary ?? null,
    recentMessages: msgRes.rows.reverse(), // chronological order
  };
}

export async function saveExchangeAndCompress(
  userId: string,
  userMsg: string,
  assistantMsg: string
): Promise<void> {
  const db = getPool();

  await db.query(
    `INSERT INTO user_conversations (user_id, role, content) VALUES
     ($1, 'user', $2), ($1, 'assistant', $3)`,
    [userId, userMsg, assistantMsg]
  );

  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM user_conversations WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(rows[0].count, 10);

  if (total > SUMMARIZE_AFTER) {
    await compressOldMessages(userId, total);
  }
}

async function compressOldMessages(userId: string, total: number): Promise<void> {
  const db = getPool();
  const toSummarize = total - RECENT_WINDOW;

  // Fetch the oldest messages that fall outside the recent window
  const { rows: oldMsgs } = await db.query<{ id: string; role: string; content: string }>(
    `SELECT id, role, content FROM user_conversations
     WHERE user_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [userId, toSummarize]
  );

  if (!oldMsgs.length) return;

  // Get existing summary to roll it forward
  const { rows: prevRows } = await db.query<{ summary: string }>(
    `SELECT summary FROM user_summaries WHERE user_id = $1`,
    [userId]
  );
  const prevSummary = prevRows[0]?.summary ?? null;

  const newSummary = await callLLMSummarize(oldMsgs, prevSummary);
  if (!newSummary) return;

  const ids = oldMsgs.map((r) => r.id);

  // Upsert summary and delete compressed messages atomically
  await db.query(`BEGIN`);
  try {
    await db.query(
      `INSERT INTO user_summaries (user_id, summary, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET summary = $2, updated_at = now()`,
      [userId, newSummary]
    );
    await db.query(
      `DELETE FROM user_conversations WHERE id = ANY($1::uuid[])`,
      [ids]
    );
    await db.query(`COMMIT`);
  } catch (err) {
    await db.query(`ROLLBACK`);
    throw err;
  }
}

async function callLLMSummarize(
  messages: { role: string; content: string }[],
  prevSummary: string | null
): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";
  const CHAT_MODEL = process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat";

  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const systemContent = prevSummary
    ? `You are compressing a chat history. Below is the existing summary, followed by new messages to incorporate.\n\nExisting summary:\n${prevSummary}\n\nUpdate and extend the summary with the new messages. Output only the updated summary — no preamble, no labels.`
    : `You are compressing a chat history into a concise summary. Capture the user's questions, interests, and any facts they shared about themselves. Output only the summary — no preamble, no labels.`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: `Conversation:\n${transcript}` },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? null;
}
