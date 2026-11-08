// Thumbnail 9:16 (1080×1920) para YouTube Shorts, a partir do quadro da própria peça.
// usage: node scripts/thumbnail.mjs pieces/<nome>   → pieces/<nome>/renders/thumbnail.jpg
//
// Configuração em piece.json → "thumbnail":
//   "t":     segundo do vídeo usado como cena (as peças posam tudo em função do tempo)
//   "cam":   opcional, câmera própria { "pos": [x,y,z], "tgt": [x,y,z], "fov": 40 } (peças 3D que leem window.THUMB.cam)
//   "lines": textos por cima, de cima para baixo: { "text", "color": "yellow"|"white"|"#hex", "size", "y", "rot" }
// A peça renderiza o quadro sem legendas/títulos quando window.THUMB existe (ver src/render.js).
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { GPU_ARGS } from '../.claude/skills/animate/tools/gpu.mjs';

const piece = process.argv[2];
if (!piece) { console.error('usage: node scripts/thumbnail.mjs pieces/<nome>'); process.exit(1); }
const cfg = JSON.parse(readFileSync(path.join(piece, 'piece.json'), 'utf8')).thumbnail;
if (!cfg) { console.error(`${piece}/piece.json has no "thumbnail" block`); process.exit(1); }

const browser = await chromium.launch({ args: GPU_ARGS });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.resolve(piece, 'index.html')).href + '?export');
await page.waitForFunction(() => typeof window.renderFrame === 'function');
const jpg = await page.evaluate(async (cfg) => {
  window.THUMB = { cam: cfg.cam || null };
  await document.fonts.load('900 100px "Fira Sans"');
  const cv = document.getElementById('c');
  window.renderFrame(cfg.t, cv);
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  // a soft darkening top and bottom so the words read over any scene
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0.35)'); grad.addColorStop(0.3, 'rgba(0,0,0,0)'); grad.addColorStop(0.7, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  const COL = { yellow: '#ffd23f', white: '#f7f5f0', red: '#d2382c' };
  for (const L of cfg.lines || []) {
    const size = L.size || 130;
    g.save(); g.font = `900 ${size}px "Fira Sans", "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    const fit = Math.min(1, 980 / g.measureText(L.text).width);
    g.translate(W / 2, L.y); g.rotate(L.rot ?? -0.035); g.scale(fit, fit);
    g.fillStyle = 'rgba(17,17,20,0.45)'; g.fillText(L.text, size * 0.05, size * 0.08);
    g.lineWidth = size * 0.22; g.strokeStyle = '#111114'; g.strokeText(L.text, 0, 0);
    g.fillStyle = COL[L.color] || L.color || COL.white; g.fillText(L.text, 0, 0);
    g.restore();
  }
  return cv.toDataURL('image/jpeg', 0.9);
}, cfg);
await browser.close();
const out = path.join(piece, 'renders', 'thumbnail.jpg');
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(jpg.split(',')[1], 'base64'));
console.log(`wrote ${out} (${(Buffer.byteLength(jpg) * 0.75 / 1024).toFixed(0)} KB)`);
