import { TwitterApi } from "twitter-api-v2";
import { config } from "./config.js";

const reader = new TwitterApi(config.xBearerToken).readOnly;

export interface Post {
  id: string;
  text: string;
  url: string;
}

/** New original posts (no replies, no reposts) since the last seen id, oldest first. */
export async function fetchNewPosts(sinceId?: string): Promise<Post[]> {
  const res = await reader.v2.userTimeline(config.targetUserId, {
    since_id: sinceId,
    max_results: sinceId ? 20 : 5,
    exclude: ["replies", "retweets"],
    "tweet.fields": ["created_at", "note_tweet"],
  });
  const tweets = res.data.data ?? [];
  return tweets
    .map((t) => ({
      id: t.id,
      text: (t as { note_tweet?: { text: string } }).note_tweet?.text ?? t.text,
      url: `https://x.com/elonmusk/status/${t.id}`,
    }))
    .reverse();
}

/** Posts a launch announcement from YOUR account (not a reply to Elon). */
export async function announce(text: string, image: Buffer) {
  if (!config.announceOnX) return;
  const { xAppKey, xAppSecret, xAccessToken, xAccessSecret } = config;
  if (!xAppKey || !xAppSecret || !xAccessToken || !xAccessSecret) {
    console.warn("ANNOUNCE_ON_X=true but X user keys are missing, skipping");
    return;
  }
  const writer = new TwitterApi({
    appKey: xAppKey,
    appSecret: xAppSecret,
    accessToken: xAccessToken,
    accessSecret: xAccessSecret,
  }).readWrite;
  const mediaId = await writer.v1.uploadMedia(image, { mimeType: "image/png" });
  await writer.v2.tweet({ text, media: { media_ids: [mediaId] } });
}
