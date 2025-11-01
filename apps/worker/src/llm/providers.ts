// apps/worker/src/llm/providers.ts
import fetch from "node-fetch";

const OA_URL = "https://api.openai.com/v1/chat/completions";
const PX_URL = "https://api.perplexity.ai/chat/completions";

async function postJson(url: string, headers: Record<string,string>, body: any): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    throw new Error(`${url} ${res.status} ${txt}`);
  }
  return res.json();
}

export async function openaiChat(args: {model: string; system: string; user: string}) {
  const key = process.env.OPENAI_API_KEY!;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const j: any = await postJson(OA_URL, { Authorization: `Bearer ${key}` }, {
    model: args.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });
  const text = j.choices?.[0]?.message?.content ?? "";
  return { text, raw: j };
}

export async function perplexityChat(args: {model: string; system: string; user: string}) {
  const key = process.env.PERPLEXITY_API_KEY!;
  if (!key) throw new Error("PERPLEXITY_API_KEY missing");
  const j: any = await postJson(PX_URL, { Authorization: `Bearer ${key}` }, {
    model: args.model, temperature: 0.2,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });
  const text = j.choices?.[0]?.message?.content ?? "";
  // Some Perplexity models attach citations; surface them if present
  const citations = j.citations || j.choices?.[0]?.message?.citations || [];
  return { text, citations, raw: j };
}

