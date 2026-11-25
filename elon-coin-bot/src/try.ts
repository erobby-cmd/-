// Test the pipeline on any text without X:  npm run test-post -- "Optimus will be bigger than Tesla"
process.env.X_BEARER_TOKEN ??= "unused";
process.env.DRY_RUN = "true";
const { handlePost } = await import("./pipeline.js");
const text = process.argv.slice(2).join(" ") || "Grok 5 is coming and Optimus will dance. Legacy media is a dinosaur 🦖";
await handlePost({ id: "test", text, url: "https://x.com/elonmusk/status/test" });
