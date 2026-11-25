import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const Analysis = z.object({
  post_importance: z.number().describe("1-10: how big / viral / meaningful this post is"),
  coins: z.array(
    z.object({
      word: z.string().describe("The exact word or name as Elon wrote it"),
      ticker: z.string().describe("2-10 uppercase letters/digits, no $"),
      name: z.string().describe("Coin name, max 32 chars"),
      kind: z.enum(["product", "robot", "nickname", "insult", "meme", "concept", "other"]),
      importance: z.number().describe("1-10: memetic power of this word"),
      description: z.string().describe("One punchy line for the coin page, max 200 chars"),
      emoji: z.string().describe("One emoji that fits the word"),
    }),
  ),
});
export type Analysis = z.infer<typeof Analysis>;

const SYSTEM = `You analyze posts by Elon Musk on X and pick words that would make strong meme coins.
Pick only words that carry the post: names he gives his products and robots (Optimus, Grok, Starship...),
nicknames, insults and pet names he calls people or things, new slang, memes and coined terms.
Ignore filler words, generic verbs, links, and plain replies with no memorable word.
Never pick a real private person's name. Public figures only when Elon gives them a nickname; use the nickname, not the real name.
Most posts produce zero coins. Rate honestly: 9-10 only for words that will obviously trend.`;

export async function analyzePost(text: string): Promise<Analysis | null> {
  const res = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(Analysis) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Post:\n"""${text}"""` }],
  });
  if (res.stop_reason === "refusal") {
    console.warn("Claude declined this post, skipping");
    return null;
  }
  return res.parsed_output ?? null;
}
