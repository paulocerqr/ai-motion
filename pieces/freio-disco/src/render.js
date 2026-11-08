// =====================================================================
//  RENDER — window.renderFrame(t, canvas): pose the 3D world, render it, copy it into the 2d canvas,
//  then the 2D layer: speed tag (intro), part TITLES, word-by-word SUBTITLES.
// =====================================================================
let WORLD = null;
function shotAt(t) { for (const s of TIMELINE.shots) if (t >= s.t0 - 1e-6 && t < s.t1 - 1e-6) return s; return TIMELINE.shots[TIMELINE.shots.length - 1]; }

// subtitles: 1-3 words from the voice, the spoken word lit
const SUBS = (() => {
  const out = [];
  for (const L of VOICE.lines) {
    let cur = [];
    const push = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0 }); cur = []; };
    // tokens from the script text (the aligner can drop short words like "é"); times from the matched words
    const toks = L.text.split(/\s+/).filter(Boolean), ws = L.words || [], tw = [];
    let j = 0;
    for (const tk of toks) { let k = j; while (k < ws.length && _nw(ws[k].w) !== _nw(tk)) k++; if (k < ws.length) { tw.push({ w: tk, t0: ws[k].t0 }); j = k + 1; } else tw.push({ w: tk, t0: null }); }
    tw.forEach((w, i) => { if (w.t0 == null) { const prev = i ? tw[i - 1].t0 : L.t0; const nx = tw.slice(i + 1).find((x) => x.t0 != null); w.t0 = nx ? (prev + nx.t0) / 2 : prev + 0.15; } });
    for (const w of tw) { cur.push(w); const len = cur.map((x) => x.w).join(' ').length; if (/[,.?!:]$/.test(w.w) || cur.length >= 3 || len >= 15) push(); }
    push(); out[out.length - 1].lineEnd = L.t1;
  }
  out.forEach((c, i) => { const nx = out[i + 1]; c.t1 = c.lineEnd !== undefined ? Math.min(c.lineEnd + 0.3, nx ? nx.t0 : 1e9) : nx.t0; });
  return out;
})();
function drawSubs() {
  const c = SUBS.find((s) => TT >= s.t0 && TT < s.t1); if (!c) return;
  const y = H - SAFE.bottom - 70; let size = 88, sp = size * 0.26;
  ctx.save(); ctx.font = `900 ${size}px ${HEAVY}`;
  const ws = c.words.map((w) => ({ ...w, txt: w.w.replace(/[,.:]$/, '').toUpperCase() }));
  let widths = ws.map((w) => ctx.measureText(w.txt).width), total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  ctx.restore();
  if (total > 760) { const k = 760 / total; size *= k; sp *= k; widths = widths.map((w) => w * k); total = 760; }
  const s = 0.85 + 0.15 * EZ.back(seg(TT, c.t0, c.t0 + 0.12));
  let x = CX - total * s / 2;
  ws.forEach((w, i) => { outlined(w.txt, x + widths[i] * s / 2, y, size, TT >= w.t0 ? PAL.yellow : PAL.white, { s, stroke: 18 }); x += (widths[i] + sp) * s; });
}
function drawTitle() {
  const T = TITLES.find(([a, b]) => TT >= a && TT < b); if (!T) return;
  const [a, b, str] = T, s = popS(a) * (1 - EZ.i2(seg(TT, b - 0.2, b))), size = str.length > 12 ? 96 : 120;
  if (s <= 0.01) return;
  outlined(str, CX, SAFE.top + 150, size, PAL.yellow, { s, rot: -0.035, stroke: size * 0.22, maxW: 760 });
}
function drawSpeed() {
  if (TT >= CU.cut) return;
  const s = popS(0.5) * (1 - EZ.i2(seg(TT, CU.lugar - 0.4, CU.lugar)));
  if (s > 0.01) outlined('100 km/h', CX, SAFE.top + 150, 120, PAL.white, { s, rot: -0.035, stroke: 26 });
}

function renderFrame(t, canvas) {
  const cv = canvas || document.getElementById('c');
  F = ((Math.round(t * FPS) % NFRAMES) + NFRAMES) % NFRAMES; B = F; TT = F / FPS;
  if (!WORLD) WORLD = buildWorld();
  const O = WORLD;
  poseWorld(O);
  const c = camAt3();
  O.cam.position.set(...c.pos); O.cam.fov = c.fov; O.cam.updateProjectionMatrix(); O.cam.lookAt(...c.tgt);
  const focus = TT < CU.cut ? [O.car.position.x, 0, CARZ] : [0, 0.8, 0.3];
  O.sun.position.set(focus[0] + 4.5, 9, focus[2] + 6); O.sun.target.position.set(...focus); O.sun.target.updateMatrixWorld();
  O.renderer.render(O.scene, O.cam);
  ctx = cv.getContext('2d');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(O.renderer.domElement, 0, 0, W, H);
  // a flash on the cut and a soft vignette
  const vg = ctx.createRadialGradient(CX, H * 0.45, H * 0.3, CX, H * 0.45, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  drawSpeed(); drawTitle(); drawSubs();
  ctx.restore();
  return shotAt(TT).id;
}
window.renderFrame = renderFrame;
window.anchorAt = () => null;

// live preview: click to play with the voice
(() => {
  const cv = document.getElementById('c'); let playing = false, t0 = 0, au = null;
  const tick = () => { if (!playing) return; const t = (performance.now() - t0) / 1000; if (t >= DURATION) { playing = false; return; } renderFrame(t); requestAnimationFrame(tick); };
  cv.addEventListener('click', () => { if (playing) { playing = false; return; } playing = true; t0 = performance.now(); tick(); });
  if (!/export|review/.test(location.search)) setTimeout(() => { try { renderFrame(Number(new URLSearchParams(location.search).get('t') || 0)); } catch (e) { console.error(e); } }, 50);
})();

function shotAtFrame(fr) { return shotAt(fr / FPS); }
const BRIDGES = [];
