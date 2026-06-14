export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";
const CHAT_MODEL = process.env.DEEPSEEK_CHAT_MODEL ?? "deepseek-chat";

const SYSTEM_PROMPT = `You are the Blackstone Assistant — a knowledgeable, professional guide for visitors to Blackstone's website.

Blackstone is the world's largest alternative asset manager with $1.3 trillion in assets under management. The firm invests across real estate, private equity, credit & insurance, and multi-asset strategies on behalf of institutional and individual investors worldwide.

Answer using ONLY the provided context. If the context lacks the answer, say so honestly and direct the visitor to blackstone.com or their financial advisor. Keep replies under 300 words. Be professional and concise. Do not fabricate statistics or investment returns.`;

export async function streamChat(
  messages: Message[],
  context: string,
  summary?: string | null
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set");

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Context:\n\n${context}` },
        ...(summary ? [{ role: "system" as const, content: `Summary of earlier conversation:\n${summary}` }] : []),
        ...messages,
      ],
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }

      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        const trimmed = line.replace(/^data: /, "").trim();
        if (!trimmed || trimmed === "[DONE]") continue;
        try {
          const delta: string = JSON.parse(trimmed).choices?.[0]?.delta?.content ?? "";
          if (delta) controller.enqueue(new TextEncoder().encode(delta));
        } catch { /* partial chunk */ }
      }
    },
  });
}
