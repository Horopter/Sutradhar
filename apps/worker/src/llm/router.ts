// apps/worker/src/llm/router.ts
import { openaiChat, perplexityChat } from "./providers";

type Provider = "openai" | "perplexity";

function pick(): Provider {
  const p = (process.env.LLM_DEFAULT_PROVIDER || "openai") as Provider;
  return p;
}

function mock(text: string) {
  return { text: `MOCK: ${text.slice(0, 400)}` };
}

function isMockEnabled(): boolean {
  return String(process.env.MOCK_LLM || "true").toLowerCase() === "true";
}

export async function llmAnswer(opts: {
  system: string; user: string; provider?: Provider; model?: string;
}) {
  if (isMockEnabled()) return mock(`Answer to: ${opts.user}`);
  const provider = opts.provider || pick();
  if (provider === "perplexity") {
    return perplexityChat({
      model: opts.model || process.env.LLM_PERPLEXITY_MODEL || "pplx-7b-online",
      system: opts.system, user: opts.user
    });
  }
  // Default to OpenAI
  return openaiChat({
    model: opts.model || process.env.LLM_OPENAI_MODEL || "gpt-4o-mini",
    system: opts.system, user: opts.user
  });
}

