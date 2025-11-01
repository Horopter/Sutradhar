export function setToggle(k: string, v: string) {
  const allowed = new Set(["MOCK_BROWSER", "MOCK_ACTIONS", "MOCK_RETRIEVAL", "MOCK_LLM"]);
  if (!allowed.has(k)) throw new Error("toggle_not_allowed");
  process.env[k] = v;
  return { ok: true, [k]: v };
}

