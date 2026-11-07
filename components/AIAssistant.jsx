"use client";

import { useState } from "react";
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react";

const STARTERS = [
  "My bike is not starting",
  "My car battery seems weak",
  "Which service might my vehicle need?",
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || loading || content.length > 2000) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not get a reply.");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setMessages(messages);
      setDraft(content);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] print-hide">
      {open && (
        <section
          aria-label="VAHANOVA AI Assistant"
          className="mb-3 flex h-[min(620px,calc(100dvh-110px))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-navy-border bg-navy shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-navy-light px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-blue">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">VAHANOVA AI</p>
                <p className="text-xs text-gray-400">Vehicle-care assistant · Grok</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!messages.length && (
              <div className="py-3">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/15 text-brand-blue">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">How can I help with your vehicle?</h3>
                <p className="mt-1 text-sm text-gray-400">Describe the issue and I’ll suggest safe next steps.</p>
                <div className="mt-5 space-y-2">
                  {STARTERS.map((starter) => (
                    <button key={starter} onClick={() => sendMessage(starter)} disabled={loading} className="block w-full rounded-xl border border-navy-border px-3 py-2.5 text-left text-sm text-gray-200 transition hover:border-brand-blue/50 hover:bg-navy-light disabled:opacity-50">
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={message.role === "user" ? "max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-blue px-3.5 py-2.5 text-sm text-white" : "max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-navy-light px-3.5 py-2.5 text-sm leading-relaxed text-gray-200"}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Grok is thinking…</div>}
            {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="border-t border-white/10 p-3">
            <div className="flex items-end gap-2 rounded-xl border border-navy-border bg-navy-light p-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }}
                placeholder="Describe your vehicle issue…"
                rows={1}
                maxLength={2000}
                className="max-h-28 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-gray-500"
                aria-label="Message the AI assistant"
              />
              <button type="submit" disabled={!draft.trim() || loading} aria-label="Send message" className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-amber text-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-gray-500">AI suggestions can be wrong. For unsafe symptoms, stop using the vehicle and contact a qualified mechanic. Don’t share personal or payment details.</p>
          </form>
        </section>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-brand-amber text-navy shadow-xl shadow-black/30 transition hover:scale-105 hover:brightness-110"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}
