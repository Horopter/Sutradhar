import { Convex } from "./convexClient";

export async function convexSelfTest(): Promise<{ ok: boolean; sessionId?: string; count?: number; error?: string }> {
  try {
    // 1. Start a session
    const sessionResult = await Convex.sessions.start({
      channel: "diag",
      persona: "Greeter",
      userName: "SelfTest"
    });

    if (!sessionResult || (sessionResult as any).skipped) {
      return { ok: false, error: "Convex calls were skipped (CONVEX_URL not set?)" };
    }

    // Handle Convex built-in API response format: {status: "success", value: <id>}
    const sessionId = (sessionResult as any).value || (sessionResult as any)._id;
    if (!sessionId) {
      return { ok: false, error: "Session creation failed - no id returned", sessionId: String(sessionResult) };
    }

    // 2. Append a message
    const appendResult = await Convex.messages.append({
      sessionId,
      from: "agent",
      text: "diag ping"
    });

    if (!appendResult || (appendResult as any).skipped) {
      return { ok: false, error: "Message append was skipped", sessionId };
    }

    // 3. List messages for that session
    const listResult = await Convex.messages.bySession({ sessionId });

    if (!listResult || (listResult as any).skipped) {
      return { ok: false, error: "Message list was skipped", sessionId };
    }

    // Handle Convex API response: {status: "success", value: <array>}
    const messagesArray = (listResult as any).value || listResult;
    const messages = Array.isArray(messagesArray) ? messagesArray : [];
    const count = messages.length;

    return { ok: true, sessionId, count };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

