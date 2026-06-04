import { NextRequest, NextResponse } from "next/server";
import { retrieve, buildContext } from "@/lib/retrieval";
import { streamChat, Message } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let messages: Message[];
  try {
    ({ messages } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(messages) || !messages.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  try {
    const chunks = await retrieve(lastUser.content, 6);
    const context = buildContext(chunks);
    const stream = await streamChat(messages, context);

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: "AI unavailable. Please try again." }, { status: 503 });
  }
}
