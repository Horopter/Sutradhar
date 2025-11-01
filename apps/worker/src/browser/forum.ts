import path from "path";
import fs from "fs";
import { chromium, Browser } from "playwright";
import { env } from "../env";

const FORUM_URL = env.FORUM_URL || "http://localhost:4001/public/forum.html";
const SCREENSHOT_DIR = env.SCREENSHOT_DIR || "./screenshots";

export type ForumPostParams = {
  url?: string;
  username?: string;
  password?: string;
  text: string;
  screenshotName?: string;
};

export async function postToForum(p: ForumPostParams) {
  // Read at runtime for hot-reload support
  const MOCK = String(process.env.MOCK_BROWSER || env.MOCK_BROWSER || "true").toLowerCase() === "true";
  const url = p.url || FORUM_URL;
  const username = p.username || env.FORUM_USER || "demo";
  const password = p.password || env.FORUM_PASS || "demo";
  const shotName = p.screenshotName || `forum-${Date.now()}.png`;

  if (MOCK) {
    // ensure dir
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const fakePath = path.resolve(SCREENSHOT_DIR, shotName);
    fs.writeFileSync(fakePath, Buffer.from([])); // empty placeholder
    return { ok: true, mocked: true, screenshot: fakePath, url };
  }

  let browser: Browser | null = null;
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Login
    await page.fill("#user", username);
    await page.fill("#pass", password);
    await page.click("#login");
    await page.waitForTimeout(300); // small UI delay

    // Post
    await page.fill("#reply", p.text);
    await page.click("#post");
    await page.waitForTimeout(300);

    // Screenshot of posts area or whole page
    const shotPath = path.resolve(SCREENSHOT_DIR, shotName);
    await page.screenshot({ path: shotPath, fullPage: true });

    return { ok: true, mocked: false, screenshot: shotPath, url };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  } finally {
    if (browser) await browser.close();
  }
}

