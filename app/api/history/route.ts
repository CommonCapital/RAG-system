import { NextRequest, NextResponse } from "next/server";
import { getPool, initSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY = 40; // max messages to return per user

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    await initSchema();
    const db = getPool();
    const { rows } = await db.query(
      `SELECT role, content FROM user_conversations
       WHERE user_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [userId, MAX_HISTORY]
    );
    return NextResponse.json({ messages: rows });
  } catch (err) {
    console.error("[history/GET]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { userId: string; messages: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, messages } = body;
  if (!userId || !Array.isArray(messages) || !messages.length) {
    return NextResponse.json({ error: "userId and messages required" }, { status: 400 });
  }

  try {
    await initSchema();
    const db = getPool();
    for (const msg of messages) {
      if (msg.role !== "user" && msg.role !== "assistant") continue;
      await db.query(
        `INSERT INTO user_conversations (user_id, role, content) VALUES ($1, $2, $3)`,
        [userId, msg.role, msg.content]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[history/POST]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
