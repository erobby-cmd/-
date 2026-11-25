import { TwitterApi } from "twitter-api-v2";
import { config } from "./config.js";

const reader = new TwitterApi(config.xBearerToken).readOnly;

export interface Post {
  id: string;
  text: string;
  url: string;
  createdAt?: string;
  photoUrl?: string; // first photo (or video thumbnail) attached to the post
}

/** New original posts (no replies, no reposts) since the last seen id, oldest first. */
export async function fetchNewPosts(sinceId?: string): Promise<Post[]> {
  const res = await reader.v2.userTimeline(config.targetUserId, {
    since_id: sinceId,
    max_results: sinceId ? 20 : 5,
    exclude: ["replies", "retweets"],
    "tweet.fields": ["created_at", "note_tweet", "attachments"],
    expansions: ["attachments.media_keys"],
    "media.fields": ["type", "url", "preview_image_url"],
  });
  const media = new Map((res.data.includes?.media ?? []).map((m) => [m.media_key, m]));
  const tweets = res.data.data ?? [];
  return tweets
    .map((t) => {
      const first = (t.attachments?.media_keys ?? []).map((k) => media.get(k)).find(Boolean);
      return {
        id: t.id,
        text: (t as { note_tweet?: { text: string } }).note_tweet?.text ?? t.text,
        url: `https://x.com/elonmusk/status/${t.id}`,
        createdAt: t.created_at,
        photoUrl: first?.type === "photo" ? first.url : first?.preview_image_url,
      };
    })
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
