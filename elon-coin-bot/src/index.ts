import { config } from "./config.js";
import { handlePost } from "./pipeline.js";
import { store } from "./state.js";
import { fetchNewPosts } from "./x.js";

async function tick() {
  const first = !store.sinceId;
  const posts = await fetchNewPosts(store.sinceId);
  if (first && posts.length) {
    // first run: don't launch coins for old posts, just remember where we are
    store.setSinceId(posts[posts.length - 1].id);
    console.log(`Started. Watching from post ${store.sinceId}`);
    return;
  }
  for (const p of posts) {
    await handlePost(p);
    store.setSinceId(p.id);
  }
}

console.log(`Elon coin bot | DRY_RUN=${config.dryRun} | poll every ${config.pollSeconds}s`);
for (;;) {
  try {
    await tick();
  } catch (e) {
    console.error("tick failed:", e instanceof Error ? e.message : e);
  }
  await new Promise((r) => setTimeout(r, config.pollSeconds * 1000));
}
