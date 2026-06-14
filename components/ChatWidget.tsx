"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Loader2, X, ArrowUpRight } from "lucide-react";

function getUserId(): string {
  let id = localStorage.getItem("bx_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bx_user_id", id);
  }
  return id;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "What does Blackstone do?",
  "What is BREIT?",
  "Who leads Blackstone?",
  "How can I invest with Blackstone?",
  "What is Blackstone's AUM?",
  "What is the stock ticker?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 100);

    if (historyLoaded) return;
    const uid = getUserId();
    userIdRef.current = uid;
    fetch(`/api/history?userId=${uid}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {/* silently ignore — memory unavailable */})
      .finally(() => setHistoryLoaded(true));
  }, [open, historyLoaded]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setStreaming(true);

    try {
      const uid = userIdRef.current ?? getUserId();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, message: text.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Request failed");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: full };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -2)); // remove both user + empty assistant
    } finally {
      setStreaming(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Trigger — matches Blackstone's black CTA buttons */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-black text-white px-6 py-3.5 hover:bg-gray-900 transition-colors shadow-lg"
        >
          <span className="serif text-[13px] font-bold tracking-wide">Ask Blackstone</span>
          <ArrowUpRight size={14} strokeWidth={2} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-8 right-8 z-50 flex flex-col bg-white shadow-2xl"
          style={{ width: "400px", height: "560px", border: "1px solid #e5e5e5" }}
        >
          {/* Header — black, like the real site's top bar */}
          <div className="bg-black flex items-center justify-between px-6 py-5 shrink-0">
            <div>
              <p className="serif text-[16px] font-bold text-white tracking-tight">BLACKSTONE</p>
              <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase mt-0.5">Investor Assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-white">
            {isEmpty && (
              <div className="space-y-5">
                <p className="text-[13px] text-gray-400 leading-relaxed">
                  Ask anything about Blackstone — our funds, strategies, leadership, or how to invest.
                </p>
                <div className="space-y-2">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-[13px] text-gray-600 px-4 py-3 bg-[#f7f7f5] hover:bg-gray-100 hover:text-black transition-colors flex items-center justify-between group"
                    >
                      {s}
                      <ArrowUpRight size={12} className="text-gray-300 group-hover:text-black transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Label */}
                <div className={`shrink-0 text-[10px] font-bold tracking-widest uppercase mt-1 ${
                  msg.role === "assistant" ? "text-black" : "text-gray-400"
                }`}>
                  {msg.role === "assistant" ? "BX" : "You"}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#f7f7f5] text-gray-700"
                    : "bg-black text-white"
                }`}>
                  {msg.content || (
                    <span className="flex items-center gap-2 text-gray-400">
                      <Loader2 size={11} className="animate-spin" />
                      <span className="text-[11px] tracking-widest uppercase">Thinking</span>
                    </span>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <p className="text-[12px] text-red-500 bg-red-50 px-3 py-2">{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input — underline style matching the newsletter form */}
          <div className="shrink-0 border-t border-gray-100 bg-white">
            <form onSubmit={onSubmit} className="flex items-center px-6 py-4 gap-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Blackstone…"
                disabled={streaming}
                className="flex-1 text-[13px] text-black placeholder-gray-300 outline-none border-b border-gray-200 pb-1 focus:border-black transition-colors bg-transparent disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                className="text-black disabled:opacity-20 hover:text-gray-500 transition-colors shrink-0"
              >
                {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-2.5 bg-[#f7f7f5] border-t border-gray-100">
            <p className="text-[10px] text-gray-400 tracking-[0.15em] uppercase text-center">
              For informational purposes only · Not investment advice
            </p>
          </div>
        </div>
      )}
    </>
  );
}
