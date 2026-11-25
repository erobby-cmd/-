import fs from "node:fs";
import { analyzePost } from "./analyze.js";
import { config } from "./config.js";
import { coinImage } from "./image.js";
import { estimateDevBuySol, launchCoin } from "./launch.js";
import { pictureFor, type Picture } from "./picture.js";
import { store } from "./state.js";
import { announce, type Post } from "./x.js";

const DISCLAIMER = "Community meme coin. Not affiliated with or endorsed by Elon Musk or his companies.";

export async function handlePost(post: Post) {
  console.log(`\n▶ ${post.url}\n  ${post.text.slice(0, 140).replace(/\n/g, " ")}`);
  const analysis = await analyzePost(post.text);
  if (!analysis) return;
  console.log(`  importance ${analysis.post_importance}/10, ${analysis.coins.length} candidate(s)`);

  const picks = analysis.coins
    .filter((c) => c.importance >= config.minImportance)
    .filter((c) => !store.alreadyLaunched(c.word))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, config.maxCoinsPerPost);

  let picture: Picture | undefined;
  if (picks.length) {
    picture = await pictureFor(post);
    console.log(`  picture: ${picture.source}`);
  }

  for (const coin of picks) {
    const cost = estimateDevBuySol() + 0.03; // dev buy + network/creation fees, rough
    if (!config.dryRun && store.spentToday() + cost > config.maxSolPerDay) {
      console.warn(`  daily SOL limit reached, skipping ${coin.word}`);
      break;
    }
    const ticker = coin.ticker.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10) || "ELON";
    const image = coinImage(coin.word, ticker, picture);
    fs.mkdirSync("out", { recursive: true });
    fs.writeFileSync(`out/${ticker}-${post.id}.png`, image);

    try {
      const { mint, signature } = await launchCoin({
        name: coin.name.slice(0, 32),
        ticker,
        description: `${coin.emoji} ${coin.description}\n\nSource: ${post.url}\n\n${DISCLAIMER}`.slice(0, 1000),
        image,
        sourceUrl: post.url,
      });
      store.markLaunched(coin.word, mint, post.id);
      if (!config.dryRun) store.addSpend(cost);
      console.log(`  ✅ ${coin.word} → $${ticker}  https://pump.fun/coin/${mint}${signature ? `  tx ${signature}` : ""}`);
      if (!config.dryRun) {
        await announce(`${coin.emoji} $${ticker} "${coin.word}"\nhttps://pump.fun/coin/${mint}\n${DISCLAIMER}`, image);
      }
    } catch (e) {
      console.error(`  ❌ ${coin.word}:`, e instanceof Error ? e.message : e);
    }
  }
}
