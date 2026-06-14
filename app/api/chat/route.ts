import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOTNET_URL = process.env.DOTNET_BACKEND_URL ?? "http://localhost:5000";

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  let message: string | undefined;

  try {
    ({ userId, message } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${DOTNET_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId ?? "anonymous", message: message.trim() }),
    });

    const text = await res.text();
    let data: { content?: string; error?: string } = {};
    try { if (text) data = JSON.parse(text); } catch { /* non-JSON body */ }

    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? "AI unavailable" }, { status: res.status });
    }

    return new NextResponse(data.content ?? "", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: "AI unavailable. Please try again." }, { status: 503 });
  }
}
