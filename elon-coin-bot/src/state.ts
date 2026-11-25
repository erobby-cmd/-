import fs from "node:fs";

const FILE = "state.json";

interface State {
  sinceId?: string;
  launched: Record<string, { mint: string; tweetId: string; at: string }>; // key = normalized word
  spend: Record<string, number>; // YYYY-MM-DD -> SOL spent
}

let state: State = { launched: {}, spend: {} };
if (fs.existsSync(FILE)) state = JSON.parse(fs.readFileSync(FILE, "utf8"));

const save = () => fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
const today = () => new Date().toISOString().slice(0, 10);
export const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

export const store = {
  get sinceId() {
    return state.sinceId;
  },
  setSinceId(id: string) {
    state.sinceId = id;
    save();
  },
  alreadyLaunched: (word: string) => normalize(word) in state.launched,
  markLaunched(word: string, mint: string, tweetId: string) {
    state.launched[normalize(word)] = { mint, tweetId, at: new Date().toISOString() };
    save();
  },
  spentToday: () => state.spend[today()] ?? 0,
  addSpend(sol: number) {
    state.spend[today()] = (state.spend[today()] ?? 0) + sol;
    save();
  },
};
