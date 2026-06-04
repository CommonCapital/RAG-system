import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-api-key") !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { source: string; category: string; content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { source, category, content } = body;
  if (!source || !category || !content) {
    return NextResponse.json({ error: "source, category, content required" }, { status: 400 });
  }

  const db = getPool();
  const { rows } = await db.query(
    `INSERT INTO knowledge_chunks (source, category, content) VALUES ($1, $2, $3) RETURNING id`,
    [source, category, content]
  );

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
