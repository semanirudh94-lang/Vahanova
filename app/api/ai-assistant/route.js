import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are VAHANOVA's vehicle-care assistant. Help users understand common vehicle symptoms and choose an appropriate service.
- Be calm, concise, practical, and clear. Ask at most one useful follow-up question when needed.
- Explain possible causes, not certain diagnoses. Never invent prices, provider availability, or booking status.
- Suggest only safe, non-invasive checks such as checking whether the fuel gauge is empty, looking for dashboard warning lights, or confirming the key is in the correct position.
- Never guide users through risky repairs, opening fuel/electrical systems, working under a vehicle, disabling safety systems, or testing brakes on public roads.
- If there is smoke, fire, fuel smell/leak, overheating, brake/steering failure, a crash, or a high-voltage EV battery concern, tell the user to stop using the vehicle, move to a safe place if possible, and contact local emergency help or a qualified mechanic. Do not ask them to inspect it.
- Do not claim to be a mechanic or replace professional inspection. For urgent danger, prioritize safety over troubleshooting.
- Do not ask for passwords, payment details, exact home address, or other sensitive personal information.
- Reply in the language used by the user (Hindi/Hinglish or English). Keep the answer easy to understand.`;

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const requestBuckets = new Map();

function isRateLimited(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || "unknown";
  const now = Date.now();
  const current = requestBuckets.get(ip);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export async function POST(request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI assistant is not configured yet. Please try again later." },
      { status: 503 }
    );
  }

  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const incoming = Array.isArray(body?.messages) ? body.messages : [];
  if (!incoming.length || incoming.length > 12) {
    return NextResponse.json({ error: "Please send a shorter conversation." }, { status: 400 });
  }

  const messages = [];
  for (const item of incoming) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") {
      return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
    }
    const content = item.content.trim();
    if (!content || content.length > 2000) {
      return NextResponse.json({ error: "Each message must be 1–2000 characters." }, { status: 400 });
    }
    messages.push({ role: item.role, content });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "A user message is required." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 650,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(25000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Groq request failed with status:", response.status);
      return NextResponse.json(
        { error: response.status === 429 ? "AI is busy right now. Please try again shortly." : "AI could not respond right now. Please try again." },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ reply: reply.trim() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("AI assistant request error:", error?.name || "unknown");
    return NextResponse.json(
      { error: error?.name === "TimeoutError" ? "The AI took too long to respond. Please try again." : "Could not connect to the AI service." },
      { status: 502 }
    );
  }
}
