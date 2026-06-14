import { NextRequest, NextResponse } from "next/server";
import { retrieve, buildContext } from "@/lib/retrieval";
import { streamChat } from "@/lib/llm";
import { initSchema } from "@/lib/db";
import { getMemoryContext, saveExchangeAndCompress } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    await initSchema();

    const [chunks, memory] = await Promise.all([
      retrieve(message, 6),
      userId ? getMemoryContext(userId) : Promise.resolve({ summary: null, recentMessages: [] }),
    ]);

    const context = buildContext(chunks);

    // Build the message list: history window + new user message
    const messages = [
      ...memory.recentMessages,
      { role: "user" as const, content: message.trim() },
    ];

    const stream = await streamChat(messages, context, memory.summary);

    // Collect the full reply so we can persist it after streaming
    const [clientStream, saveStream] = stream.tee();

    if (userId) {
      // Drain saveStream in the background to capture the full reply
      (async () => {
        const reader = saveStream.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }
        if (full) {
          await saveExchangeAndCompress(userId!, message!.trim(), full).catch(
            (err) => console.error("[memory/save]", err)
          );
        }
      })();
    }

    return new NextResponse(clientStream, {
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
