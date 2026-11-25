import { Resvg } from "@resvg/resvg-js";
import type { Post } from "./x.js";

export interface Picture {
  png: Buffer;
  kind: "photo" | "tweet";
  source: "photo" | "screenshot" | "card";
}

/**
 * Picks the picture that goes inside the coin:
 * 1. the photo Elon attached to the post
 * 2. a real screenshot of the post (Twitter embed page, headless Chromium)
 * 3. a tweet card drawn from the post text (always works)
 */
export async function pictureFor(post: Post): Promise<Picture> {
  if (post.photoUrl) {
    try {
      const r = await fetch(post.photoUrl + (post.photoUrl.includes("pbs.twimg.com") ? "?name=large" : ""));
      if (r.ok) return { png: Buffer.from(await r.arrayBuffer()), kind: "photo", source: "photo" };
    } catch {}
  }
  const shot = await screenshotPost(post.id);
  if (shot) return { png: shot, kind: "tweet", source: "screenshot" };
  return { png: tweetCard(post), kind: "tweet", source: "card" };
}

async function screenshotPost(id: string): Promise<Buffer | null> {
  if (id === "test") return null;
  let browser;
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 550, height: 1000 }, deviceScaleFactor: 2 });
    await page.goto(`https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=light&dnt=true`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    const el = await page.waitForSelector("article", { timeout: 15_000 });
    return await el.screenshot();
  } catch (e) {
    console.warn("  screenshot failed, drawing a card instead:", e instanceof Error ? e.message.split("\n")[0] : e);
    return null;
  } finally {
    await browser?.close();
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text: string, max: number, maxLines: number): string[] {
  const lines: string[] = [];
  for (const para of text.replace(/https?:\/\/\S+/g, "").trim().split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if ((line + " " + word).trim().length > max) {
        lines.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = cut[maxLines - 1].slice(0, max - 1) + "…";
    return cut;
  }
  return lines;
}

/** A post card drawn from the text we already have. */
export function tweetCard(post: Post): Buffer {
  const W = 1200;
  const lines = wrap(post.text, 40, 8);
  const H = 260 + lines.length * 62;
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" rx="36" fill="#ffffff"/>
  <circle cx="110" cy="110" r="52" fill="#1d1f23"/>
  <text x="110" y="128" font-family="DejaVu Sans, Arial" font-weight="bold" font-size="48" fill="#fff" text-anchor="middle">E</text>
  <text x="190" y="102" font-family="DejaVu Sans, Arial" font-weight="bold" font-size="40" fill="#0f1419">Elon Musk</text>
  <text x="190" y="148" font-family="DejaVu Sans, Arial" font-size="34" fill="#536471">@elonmusk</text>
  ${lines.map((l, i) => `<text x="60" y="${236 + i * 62}" font-family="DejaVu Sans, Arial" font-size="46" fill="#0f1419">${esc(l)}</text>`).join("\n  ")}
  <text x="60" y="${H - 36}" font-family="DejaVu Sans, Arial" font-size="30" fill="#536471">${esc(date)}</text>
</svg>`;
  return new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
}
