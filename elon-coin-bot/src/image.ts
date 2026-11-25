import { Resvg } from "@resvg/resvg-js";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Renders a 1024x1024 gold coin with the word stamped in the middle. */
export function coinImage(word: string, ticker: string): Buffer {
  const S = 1024;
  const c = S / 2;
  const fontSize = Math.min(200, Math.floor(1000 / Math.max(word.length, 4)));

  // ridged rim
  const ridges = Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2;
    const x1 = c + Math.cos(a) * 470, y1 = c + Math.sin(a) * 470;
    const x2 = c + Math.cos(a) * 500, y2 = c + Math.sin(a) * 500;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a6a12" stroke-width="7"/>`;
  }).join("");

  // stars on the ring
  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return `<text x="${c + Math.cos(a) * 400}" y="${c + Math.sin(a) * 400 + 14}" font-size="40" text-anchor="middle" fill="#7a5a0a">★</text>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <defs>
    <radialGradient id="g" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#fff6c4"/>
      <stop offset="45%" stop-color="#f2c230"/>
      <stop offset="100%" stop-color="#a87a10"/>
    </radialGradient>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1b1b2f"/><stop offset="100%" stop-color="#05050a"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="500" fill="#c9971c"/>
  ${ridges}
  <circle cx="${c}" cy="${c}" r="465" fill="url(#g)" stroke="#8a6a12" stroke-width="10"/>
  <circle cx="${c}" cy="${c}" r="355" fill="none" stroke="#8a6a12" stroke-width="6"/>
  ${stars}
  <text x="${c}" y="${c + fontSize * 0.35}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold"
        font-size="${fontSize}" text-anchor="middle" fill="#5a3f00" stroke="#fff3b0" stroke-width="3">${esc(word)}</text>
  <text x="${c}" y="${c + 250}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="bold"
        font-size="64" text-anchor="middle" fill="#6b4c05">$${esc(ticker)}</text>
</svg>`;

  return new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
}
