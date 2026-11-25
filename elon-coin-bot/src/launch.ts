import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "./config.js";

const TOTAL_SUPPLY = 1_000_000_000; // every pump.fun coin
// pump.fun bonding curve starting reserves (virtual)
const V_SOL = 30;
const V_TOKENS = 1_073_000_191;

export const devBuyTokens = () => Math.floor((TOTAL_SUPPLY * config.devBuyPercent) / 100);

/** Approximate SOL cost of the dev buy on a fresh curve, incl. 1% pump.fun fee. */
export function estimateDevBuySol(): number {
  const t = devBuyTokens();
  if (t <= 0) return 0;
  return ((V_SOL * V_TOKENS) / (V_TOKENS - t) - V_SOL) * 1.01;
}

export interface CoinSpec {
  name: string;
  ticker: string;
  description: string;
  image: Buffer;
  sourceUrl: string;
}

/**
 * Creates the coin on pump.fun (Solana) via PumpPortal's local-transaction API:
 * metadata + image go to pump.fun IPFS, PumpPortal builds the create tx,
 * we sign it locally with our wallet + a fresh mint keypair and send it.
 */
export async function launchCoin(spec: CoinSpec): Promise<{ mint: string; signature?: string }> {
  const mint = Keypair.generate();
  const mintAddr = mint.publicKey.toBase58();

  if (config.dryRun) {
    console.log(`  [DRY_RUN] would launch ${spec.name} ($${spec.ticker}) mint=${mintAddr}`);
    return { mint: mintAddr };
  }
  if (!config.walletSecret) throw new Error("WALLET_PRIVATE_KEY is required when DRY_RUN=false");
  const wallet = Keypair.fromSecretKey(bs58.decode(config.walletSecret));

  // 1. upload image + metadata
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(spec.image)], { type: "image/png" }), "coin.png");
  form.append("name", spec.name);
  form.append("symbol", spec.ticker);
  form.append("description", spec.description);
  form.append("twitter", spec.sourceUrl);
  form.append("showName", "true");
  const ipfs = await fetch("https://pump.fun/api/ipfs", { method: "POST", body: form });
  if (!ipfs.ok) throw new Error(`IPFS upload failed: ${ipfs.status} ${await ipfs.text()}`);
  const { metadataUri } = (await ipfs.json()) as { metadataUri: string };

  // 2. get the unsigned create transaction
  const txRes = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: wallet.publicKey.toBase58(),
      action: "create",
      tokenMetadata: { name: spec.name, symbol: spec.ticker, uri: metadataUri },
      mint: mintAddr,
      denominatedInSol: "false", // amount is in tokens: exactly DEV_BUY_PERCENT of supply
      amount: devBuyTokens(),
      slippage: config.slippage,
      priorityFee: config.priorityFee,
      pool: "pump",
    }),
  });
  if (!txRes.ok) throw new Error(`PumpPortal failed: ${txRes.status} ${await txRes.text()}`);

  // 3. sign and send
  const tx = VersionedTransaction.deserialize(new Uint8Array(await txRes.arrayBuffer()));
  tx.sign([mint, wallet]);
  const conn = new Connection(config.rpcUrl, "confirmed");
  const signature = await conn.sendTransaction(tx, { maxRetries: 3 });
  return { mint: mintAddr, signature };
}
