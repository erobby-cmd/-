import { Resvg } from "@resvg/resvg-js";
import type { Picture } from "./picture.js";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT = "DejaVu Sans, Arial, sans-serif";
const S = 1024;
const c = S / 2;

/** PNG size from its header, so the picture can be fitted without cropping. */
function pngSize(buf: Buffer): { w: number; h: number } | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  return null;
}

/**
 * 1024x1024 gold coin.
 * No picture: the word is stamped in the middle.
 * Photo: the photo fills the coin face, the word sits on a dark band.
 * Tweet (screenshot or card): the tweet sits in the middle, word above, ticker below.
 */
export function coinImage(word: string, ticker: string, picture?: Picture): Buffer {
  const ridges = Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2;
    const x1 = c + Math.cos(a) * 470, y1 = c + Math.sin(a) * 470;
    const x2 = c + Math.cos(a) * 500, y2 = c + Math.sin(a) * 500;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8a6a12" stroke-width="7"/>`;
  }).join("");

  const stars = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return `<text x="${c + Math.cos(a) * 400}" y="${c + Math.sin(a) * 400 + 14}" font-size="40" text-anchor="middle" fill="#7a5a0a">★</text>`;
  }).join("");

  let face: string;
  if (!picture) {
    const fs = Math.min(200, Math.floor(1000 / Math.max(word.length, 4)));
    face = `
  <circle cx="${c}" cy="${c}" r="355" fill="none" stroke="#8a6a12" stroke-width="6"/>
  ${stars}
  <text x="${c}" y="${c + fs * 0.35}" font-family="${FONT}" font-weight="bold" font-size="${fs}" text-anchor="middle"
        fill="#5a3f00" stroke="#fff3b0" stroke-width="3">${esc(word)}</text>
  <text x="${c}" y="${c + 250}" font-family="${FONT}" font-weight="bold" font-size="64" text-anchor="middle" fill="#6b4c05">$${esc(ticker)}</text>`;
  } else {
    const href = `data:image/${picture.png.readUInt32BE(0) === 0x89504e47 ? "png" : "jpeg"};base64,${picture.png.toString("base64")}`;
    if (picture.kind === "photo") {
      const fs = Math.min(130, Math.floor(800 / Math.max(word.length, 4)));
      face = `
  <clipPath id="face"><circle cx="${c}" cy="${c}" r="440"/></clipPath>
  <g clip-path="url(#face)">
    <image href="${href}" x="${c - 440}" y="${c - 440}" width="880" height="880" preserveAspectRatio="xMidYMid slice"/>
    <rect x="0" y="${c + 120}" width="${S}" height="200" fill="#000" fill-opacity="0.6"/>
  </g>
  <circle cx="${c}" cy="${c}" r="440" fill="none" stroke="#8a6a12" stroke-width="10"/>
  <text x="${c}" y="${c + 220 + fs * 0.35}" font-family="${FONT}" font-weight="bold" font-size="${fs}" text-anchor="middle"
        fill="#ffd84a" stroke="#3a2800" stroke-width="3">${esc(word)}</text>
  <text x="${c}" y="${c - 340}" font-family="${FONT}" font-weight="bold" font-size="56" text-anchor="middle"
        fill="#fff" stroke="#000" stroke-width="2">$${esc(ticker)}</text>`;
    } else {
      // fit the tweet into a 680x430 box, centred, without cropping
      const box = { w: 680, h: 430 };
      const sz = pngSize(picture.png) ?? { w: box.w, h: box.h };
      const scale = Math.min(box.w / sz.w, box.h / sz.h);
      const w = sz.w * scale, h = sz.h * scale;
      const x = c - w / 2, y = c - h / 2 + 10;
      const fs = Math.min(96, Math.floor(620 / Math.max(word.length, 4)));
      face = `
  <clipPath id="tw"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>
  <rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="22" fill="#5a3f00"/>
  <image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" clip-path="url(#tw)" preserveAspectRatio="xMidYMid meet"/>
  <text x="${c}" y="${y - 40}" font-family="${FONT}" font-weight="bold" font-size="${fs}" text-anchor="middle"
        fill="#5a3f00" stroke="#fff3b0" stroke-width="2">${esc(word)}</text>
  <text x="${c}" y="${y + h + 80}" font-family="${FONT}" font-weight="bold" font-size="56" text-anchor="middle" fill="#6b4c05">$${esc(ticker)}</text>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}">
  <defs>
    <radialGradient id="g" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#fff6c4"/><stop offset="45%" stop-color="#f2c230"/><stop offset="100%" stop-color="#a87a10"/>
    </radialGradient>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1b1b2f"/><stop offset="100%" stop-color="#05050a"/>
    </radialGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#bg)"/>
  <circle cx="${c}" cy="${c}" r="500" fill="#c9971c"/>
  ${ridges}
  <circle cx="${c}" cy="${c}" r="465" fill="url(#g)" stroke="#8a6a12" stroke-width="10"/>
  ${face}
</svg>`;

  return new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng();
}
