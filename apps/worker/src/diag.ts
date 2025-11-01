import { Convex } from "./convexClient";
import { slackPostMessage } from "./integrations/actions/slack";
import { createCalendarEvent } from "./integrations/actions/calendar";
import { createGithubIssue } from "./integrations/actions/github";
import { env } from "./env";

export async function runRubeDiag() {
  const sess = await Convex.sessions.start({ channel: "diag", persona: "Moderator", userName: "Diag" });
  // Convex API returns: { status: "success", value: "session-id-string" } or direct session object with _id
  const sessionIdRaw = (sess as any).value || (sess as any)?._id || (sess as any)?.id;
  const sessionId = sessionIdRaw ? String(sessionIdRaw) : "diag-session-fallback";

  const slack = await slackPostMessage("Diag ping from Sutradhar", env.SLACK_CHANNEL_ID);
  const now = new Date();
  const start = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const end   = new Date(now.getTime() + 40 * 60 * 1000).toISOString();
  const cal   = await createCalendarEvent("Sutradhar Diag AMA", start, end, "Automated diagnostics", env.GCAL_CALENDAR_ID);
  const gh    = await createGithubIssue("[Diag] Test issue", "This is a diagnostic test issue.", env.GITHUB_REPO_SLUG || "test-org/test-repo");

  // Check if actions are mocked by checking environment
  const isMocked = String(env.MOCK_ACTIONS || "false").toLowerCase() === "true";

  // log to Convex (if not already via routes, this is extra-safe)
  await Convex.actions.log({ sessionId, type: "slack",    status: (slack as any).mocked || isMocked ? "mocked" : "ok", payload: {text:"Diag ping"}, result: slack });
  await Convex.actions.log({ sessionId, type: "calendar", status: isMocked ? "mocked" : "ok", payload: {start, end},       result: cal });
  await Convex.actions.log({ sessionId, type: "github",   status: (gh as any).mocked || isMocked ? "mocked" : "ok", payload: {},                 result: gh });

  const listResult = await Convex.actions.listBySession({ sessionId });
  // Convex API returns: { status: "success", value: [...] }
  const listArray = (listResult as any).value || listResult;
  const actionsList = Array.isArray(listArray) ? listArray : [];

  return { ok: true, sessionId, counts: { actions: actionsList.length }, slack, cal, gh };
}

// Backward compatibility alias
export const runComposioDiag = runRubeDiag;

