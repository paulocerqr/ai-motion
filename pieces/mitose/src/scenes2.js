// =====================================================================
//  SCENES (2) — the stage: tissue wall, neighbour cells, the cell body (elongates, pinches, splits),
//  cytoplasm life, the nucleus (tears in prophase, two new ones in telophase), tags. sceneCell() draws it all.
// =====================================================================
const WALL = '#b9dccd';
const deferOr = (f) => { if (DEFER) DEFER.push(f); else f(); };

function drawWall() {
  cut(rect(-30, -30, W + 60, H + 60, 0), WALL, { key: 'wall', shadow: false, tear: 0, shade: false, pat: pat.dots('rgba(255,255,255,0.24)', 5, 64) });
  // neighbour cells at the edges: asleep, startled by the snap, happy at the end
  const NB = [[-60, 1250, 160, 200, 50, 1240], [1110, 470, 170, 200, 990, 470], [260, 1860, 250, 160, 260, 1760], [880, 90, 200, 140, 860, 150]];
  NB.forEach(([x, y, rx, ry, fx, fy], i) => {
    cut(ellipsePts(x, y, rx, ry, 0, 40), '#d9e7ef', { key: 'nb' + i, crayon: '#b7cfdd', crAl: 0.4 });
    cut(ellipsePts(x, y, rx - 18, ry - 18, 0, 40), '#eef5f8', { key: 'nbi' + i, shadow: false, pat: pat.dots('rgba(120,150,170,0.18)', 3, 30) });
    let mood = 'focus';
    if (TT >= CU.snap && TT < CU.snap + 1.6) mood = 'wow';
    else if (TT >= CU.same) mood = 'happy';
    else if (i === 1 && TT >= CU.meta) mood = (B % 29 < 2) ? 'focus' : 'smile';   // one neighbour watches
    face(fx, fy, 1.0, mood);
  });
}

// ---- the cell body: one ellipse that stretches in anaphase and pinches at the waist; then two cells
function bodyPts(inset) {
  const el = sm(TT, CU.snap + 0.1, CU.furrow), p = K.pinch();
  const rx = 360 - 40 * el - inset, ry = 440 + 50 * el - inset, P = [];
  for (let i = 0; i < 120; i++) {
    const a = i / 120 * TAU, y0 = Math.sin(a) * ry, wv = 1 - p * 0.97 * Math.exp(-((y0 / (ry * 0.36)) ** 2));
    P.push([C0[0] + Math.cos(a) * rx * wv, C0[1] + y0]);
  }
  return P;
}
const SPLIT = () => TT >= CU.furrow + 0.9;
function daughterPts(g, inset) { const d = K.drift(); return ellipsePts(C0[0], lobeY(g), 320 + 10 * d - inset, 245 - 5 * d - inset, 0, 72); }
function drawBody() {
  const shapes = SPLIT() ? [[daughterPts(-1, 0), daughterPts(-1, 24), 't'], [daughterPts(1, 0), daughterPts(1, 24), 'b']] : [[bodyPts(0), bodyPts(24), 'c']];
  for (const [O, I, k] of shapes) {
    cut(O, PAL.pink, { key: 'mem' + k, crayon: '#e07fa3', crAl: 0.35, sb: 16, sy: 9 });
    cut(I, PAL.pinkL, { key: 'cyt' + k, shadow: false, pat: pat.dots('rgba(255,255,255,0.40)', 3, 34) });
  }
}

// ---- cytoplasm life: vesicles, ribosomes, two mitochondria. Each belongs to the top or bottom half,
// so it rides into its daughter cell.
const VES = (() => {
  const R = RNG('ves'), out = [];
  while (out.length < 16) { const ox = R.r(-280, 280), oy = R.r(-370, 370); if ((ox / 285) ** 2 + (oy / 375) ** 2 < 1 && Math.abs(oy) > 40) out.push([ox, oy, R.r(9, 20), Math.floor(R.f() * 3)]); }
  return out;
})();
const RIB = (() => { const R = RNG('rib'), out = []; while (out.length < 46) { const ox = R.r(-300, 300), oy = R.r(-400, 400); if ((ox / 300) ** 2 + (oy / 400) ** 2 < 1 && Math.abs(oy) > 30) out.push([ox, oy]); } return out; })();
const inCell = (ox, oy) => { const g = Math.sign(oy), dv = K.div(); return [C0[0] + ox * (1 - 0.1 * dv), lobeY(g) + oy * (1 - 0.55 * dv)]; };
function drawCytoplasm() {
  RIB.forEach(([ox, oy], i) => { const [x, y] = inCell(ox, oy); dot(x + Math.sin(TT * 1.7 + i) * 3, y, 3.5, 'rgba(150,60,95,0.35)'); });
  VES.forEach(([ox, oy, r, c], i) => {
    const [x, y] = inCell(ox, oy);
    cut(ellipsePts(x + Math.sin(TT * 0.9 + i) * 8, y + Math.cos(TT * 0.7 + i * 1.3) * 6, r, r * 0.9, 0, 16), ['#fbeef3', PAL.cream, '#f6e3a6'][c], { key: 'v' + i, sb: 4, sy: 2, grain: 0.3, tear: 0.3 });
  });
  [[-275, -120, 0.5], [275, 120, -0.45]].forEach(([ox, oy, a], i) => {
    const [x, y] = inCell(ox, oy), aa = a + Math.sin(TT * 1.1 + i * 3) * 0.12;
    cut(rot(ellipsePts(x, y, 54, 26, 0, 22), x, y, aa), PAL.mustard, { key: 'mi' + i, crayon: '#b8862f', crAl: 0.4, pat: pat.stripes('rgba(150,90,20,0.38)', 4, 15, aa + Math.PI / 2), sb: 6 });
  });
}

// ---- nuclei
function nucleus(x, y, rx, ry, key, s = 1) {
  if (s <= 0.01) return;
  cut(ellipsePts(x, y, rx * s, ry * s, 0, 40), PAL.purple, { key: key + 'o', crayon: '#6d5bb8', crAl: 0.3 });
  cut(ellipsePts(x, y, (rx - 16) * s, (ry - 16) * s, 0, 40), '#e6def7', { key: key + 'i', shadow: false, pat: pat.dots('rgba(140,122,216,0.28)', 3, 26) });
}
function drawNuclei() {
  const u = ev(CU.nucBreak, 0.9);
  if (u <= 0) {
    nucleus(500, 860, 222, 222, 'n0');
    if (TT < CU.condense + 0.6) cut(ellipsePts(598, 742, 34, 30, 0, 18), '#b9a8ea', { key: 'nucleolo', shadow: false });   // the nucleolus
  }
  if (TT >= CU.nuclei) {
    const s = popS(CU.nuclei) * lerp(0.6, 1, ev(CU.nuclei, 0.9));
    for (const g of [-1, 1]) nucleus(500, lobeY(g), 196, 146, 'nd' + g, s);
  }
}
function drawNucFragments() {   // the envelope tears into paper scraps that drift off
  const u = ev(CU.nucBreak, 0.9); if (u <= 0 || u >= 1) return;
  for (let j = 0; j < 9; j++) {
    const a0 = j / 9 * TAU, a1 = a0 + TAU / 9 * 0.78, am = (a0 + a1) / 2, k = 1 - EZ.i2(u), out = 140 * EZ.o2(u);
    let P = arcPts(500, 860, 213, a0, a1, 10);
    P = rot(P.map(([x, y]) => [x + Math.cos(am) * out, y + Math.sin(am) * out]), 500 + Math.cos(am) * (213 + out), 860 + Math.sin(am) * (213 + out), (j % 2 ? 1 : -1) * 0.9 * u);
    const cx = 500 + Math.cos(am) * (213 + out), cy = 860 + Math.sin(am) * (213 + out);
    cut(ribbon(P.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]), 18 * k + 2), PAL.purple, { key: 'fr' + j, sb: 6, tear: 0.6 });
  }
}
function drawEquator() {
  if (TT < CU.align || TT > CU.snap + 0.4) return;
  const f = ev(CU.align + 0.3, 0.8);
  for (let x = 175; x < 825; x += 42) if ((x - 175) / 650 < f) ink([[x, C0[1]], [x + 20, C0[1]]], { w: 4, color: 'rgba(42,29,24,0.35)', amt: 0.3, key: 'eq' + x });
}

// ---- tags: the phase (top-left, the clock of the piece) and one caption at a time (bottom)
const PHASES = [[CU.wake, 'Mitose'], [CU.dup - 0.4, 'Interfase'], [CU.pro, 'Prófase'], [CU.meta, 'Metáfase'], [CU.snap, 'Anáfase'], [CU.telo, 'Telófase'], [CU.furrow, 'Citocinese']];
const CAPS = [[CU.wake + 0.2, 'uma célula vira duas'], [CU.dup, 'o DNA é copiado'], [CU.condense, 'o DNA se enrola'], [CU.align, 'todos no meio'], [CU.ana, 'as cópias se separam'], [CU.nuclei, 'dois núcleos'], [CU.same, 'duas células idênticas'], [CU.n46, '46 cromossomos em cada']];
const current = (list) => { let c = null; for (const e of list) if (TT >= e[0]) c = e; return c; };
function drawTags() {
  const ph = current(PHASES);
  // in-world labels (move with the camera)
  if (TT >= CU.same) tag('=', 500, 870, 76, { s: popS(CU.same), rot: 0.05, tape: false });
  if (TT >= CU.n46) for (const g of [-1, 1]) tag('46', 818, lobeY(g) - 150, 64, { s: popS(CU.n46 + (g > 0 ? 0.2 : 0)), rot: g * 0.06 });
  deferOr(() => {
    if (ph) tag(ph[1], 70 + (handW(ph[1], 80) + 72) / 2, SAFE.top + 90, 80, { rot: -0.04, s: popS(ph[0]) });
    drawSubs();
  });
}

// ---- subtitles: the narration, 1-3 words at a time, the spoken word lit (short-form style)
const SUBS = (() => {
  const out = [];
  for (const L of VOICE.lines) {
    let cur = [];
    const push = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0 }); cur = []; };
    for (const w of L.words) {
      cur.push(w);
      const len = cur.map((x) => x.w).join(' ').length;
      if (/[,.?!:]$/.test(w.w) || cur.length >= 3 || len >= 16) push();
    }
    push();
    out[out.length - 1].lineEnd = L.t1;
  }
  out.forEach((c, i) => { const nx = out[i + 1]; c.t1 = c.lineEnd !== undefined ? Math.min(c.lineEnd + 0.35, nx ? nx.t0 : 1e9) : nx.t0; });
  return out;
})();
function drawSubs() {
  const c = SUBS.find((s) => TT >= s.t0 && TT < s.t1); if (!c) return;
  const size = 82, y = H - SAFE.bottom - 40, sp = size * 0.28;
  ctx.save();
  ctx.font = `700 ${size}px ${HAND}`; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const ws = c.words.map((w) => ({ ...w, txt: w.w.replace(/[,.:]$/, '') }));
  const widths = ws.map((w) => ctx.measureText(w.txt).width), total = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const s = 0.85 + 0.15 * EZ.back(seg(TT, c.t0, c.t0 + 0.14));
  ctx.translate(CX, y); ctx.scale(s, s);
  let x = -total / 2;
  ws.forEach((w, i) => {
    const lit = TT >= w.t0;
    ctx.lineWidth = 16; ctx.strokeStyle = PAL.ink; ctx.strokeText(w.txt, x, 0);
    ctx.fillStyle = lit ? PAL.yellow : PAL.paper; ctx.fillText(w.txt, x, 0);
    x += widths[i] + sp;
  });
  ctx.restore();
}

function sceneCell() {
  drawWall();
  drawBody();
  drawCytoplasm();
  drawNuclei();
  drawEquator();
  drawSpindle();
  drawChromosomes();
  drawNucFragments();
  drawTags();
}
