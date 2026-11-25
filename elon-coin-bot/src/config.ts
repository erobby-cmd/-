import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name} (see .env.example)`);
  return v;
}

const bool = (v: string | undefined, d: boolean) =>
  v === undefined ? d : ["1", "true", "yes"].includes(v.toLowerCase());

export const config = {
  // X (Twitter)
  xBearerToken: req("X_BEARER_TOKEN"),
  targetUserId: process.env.TARGET_USER_ID ?? "44196397", // @elonmusk
  pollSeconds: Number(process.env.POLL_SECONDS ?? 60),
  // Optional: announce launches from YOUR OWN account (never replies to Elon)
  announceOnX: bool(process.env.ANNOUNCE_ON_X, false),
  xAppKey: process.env.X_APP_KEY,
  xAppSecret: process.env.X_APP_SECRET,
  xAccessToken: process.env.X_ACCESS_TOKEN,
  xAccessSecret: process.env.X_ACCESS_SECRET,

  // Filtering
  minImportance: Number(process.env.MIN_IMPORTANCE ?? 7), // 1..10
  maxCoinsPerPost: Number(process.env.MAX_COINS_PER_POST ?? 3),

  // Solana / pump.fun
  dryRun: bool(process.env.DRY_RUN, true),
  rpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com",
  walletSecret: process.env.WALLET_PRIVATE_KEY, // base58
  devBuySol: Number(process.env.DEV_BUY_SOL ?? 0.01),
  slippage: Number(process.env.SLIPPAGE ?? 10),
  priorityFee: Number(process.env.PRIORITY_FEE ?? 0.0005),
  maxSolPerDay: Number(process.env.MAX_SOL_PER_DAY ?? 0.5),
};
