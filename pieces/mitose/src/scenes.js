// =====================================================================
//  SCENES — one stage: the cell. Everything is a function of TT and the voice cues in CU.
//  Orange is reserved for the hero chromosome (and its copy). Cell centre (500, 870); spindle is vertical.
// =====================================================================
const C0 = [500, 870];
const sm = (t, a, b) => EZ.io(seg(t, a, b));

// ---- a paper strip along a centre line (rounded ends)
function ribbon(C, w) {
  const L = [], R = [], n = C.length, h = w / 2;
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    L.push([C[i][0] + nx * h, C[i][1] + ny * h]); R.push([C[i][0] - nx * h, C[i][1] - ny * h]);
  }
  const cap = (p, q, from) => { const out = [], a0 = Math.atan2(q[1] - p[1], q[0] - p[0]); for (let k = 1; k < 6; k++) { const a = a0 + from + Math.PI * k / 6; out.push([p[0] + Math.cos(a) * h, p[1] + Math.sin(a) * h]); } return out; };
  const e = C[n - 1], e2 = C[n - 2], s = C[0], s2 = C[1];
  return [...L, ...cap(e, e2, Math.PI / 2), ...R.reverse(), ...cap(s, s2, Math.PI / 2)];
}

// ---- the process clocks (0..1)
const K = {
  dup: () => sm(TT, CU.dup, CU.dup + 0.7),
  cond: () => sm(TT, CU.condense, CU.condense + 1.0) * (1 - 0.22 * sm(TT, CU.nuclei, CU.nuclei + 1.4)),
  align: () => sm(TT, CU.align, CU.middle + 0.35),
  sep: () => (TT < CU.snap ? 0 : clamp(sm(TT, CU.snap, CU.snap + 2.0) + 0.05 * Math.sin(Math.min(1, (TT - CU.snap) * 4) * Math.PI))),
  div: () => sm(TT, CU.snap, CU.furrow + 0.9),            // lobes drift apart
  pinch: () => sm(TT, CU.furrow - 0.35, CU.furrow + 0.9),
  drift: () => sm(TT, CU.furrow + 0.9, CU.result + 0.8),
  gather: () => sm(TT, CU.nuclei - 0.6, CU.result + 0.9), // chromatids gather into the new nuclei
};
const lobeY = (g) => C0[1] + g * (245 * K.div() + 17 * K.drift());   // g = -1 top, +1 bottom

// ---- the chromosomes: 4 shown (a cell has 46; the hero is one of them)
const CHR = [
  { col: PAL.teal,   crayon: '#2f7f7b', inter: [420, 790, 0.45],  slot: 285, fin: [-78, -52, 0.12] },
  { col: PAL.orange, crayon: PAL.orangeD, inter: [545, 820, -0.30], slot: 572, fin: [72, -50, -0.10], hero: true },
  { col: PAL.purple, crayon: '#6d5bb8', inter: [450, 945, -0.20], slot: 428, fin: [-72, 54, -0.10] },
  { col: PAL.blue,   crayon: '#39568f', inter: [590, 935, 0.40],  slot: 715, fin: [78, 56, 0.12] },
];
// the centre line of one chromatid: axis angle a, condensation k, bow (middle pushed along +normal)
function chromLine(x, y, a, k, bow, key) {
  const L = lerp(190, 86, k), amp = lerp(20, 0, k), ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, P = [];
  const ph = hash(key) % 100 / 10, wig = B * 0.35;
  for (let i = 0; i <= 26; i++) {
    const s = i / 26 * 2 - 1, along = s * L / 2;
    const off = amp * Math.sin(s * Math.PI * 3.5 + ph + wig * (1 - k)) + bow * (1 - s * s);
    P.push([x + ca * along + nx * off, y + sa * along + ny * off]);
  }
  return P;
}
function chromatid(c, x, y, a, k, bow, key, mood) {
  const P = chromLine(x, y, a, k, bow, key), w = lerp(15, 32, k) * (c.hero ? 1.15 : 1);
  cut(ribbon(P, w), c.col, { key, crayon: c.crayon, crAl: 0.35, crPer: 30, sb: 6, sy: 4, tear: 0.5, amt: 0.5, grain: 0.5,
    pat: k > 0.3 ? pat.stripes('rgba(255,255,255,0.30)', 5, 24, a + Math.PI / 2) : null });
  if (c.hero) {
    const m = P[13];
    cut(ellipsePts(m[0], m[1], 27, 25, 0, 24), PAL.orange, { key: key + 'hd', crayon: PAL.orangeD, crAl: 0.3, crPer: 30, sb: 5, sy: 3, tear: 0.4, grain: 0.5 });
    face(m[0], m[1] - 1, 0.5, mood);
  }
}
function heroMood() {
  if (TT < CU.wake) return 'focus';
  if (TT < CU.wake + 0.9) return 'wow';
  if (TT >= CU.dup && TT < CU.pro) return 'happy';
  if (TT >= CU.hush - 0.2 && TT < CU.snap + 1.2) return 'wow';
  if (TT >= CU.same) return 'happy';
  return (B % 41 < 2) ? 'focus' : 'smile';
}
// where sister s (-1 upper / +1 lower) of chromosome i is, and how it is bent
function sisterPose(i, s) {
  const c = CHR[i], k = K.cond(), du = K.dup(), al = K.align(), sp = K.sep(), ga = K.gather();
  // the chromosome's centre: loose in the nucleus -> on the equator
  const drift = Math.sin(TT * 1.3 + i * 2) * 6 * (1 - al);
  let x = lerp(c.inter[0], c.slot, al) + drift, y = lerp(c.inter[1], C0[1], al), a = lerp(c.inter[2], 0, al);
  // the sisters: side by side once copied, pinched at the centromere when condensed
  const d = lerp(40, 19, k) * du;
  let px = x - Math.sin(a) * d * s, py = y + Math.cos(a) * d * s;
  let bow = -s * 13 * k * du * (1 - sp);
  // anaphase: pulled to the poles, the centromere leading and the arms trailing
  if (sp > 0) { py = lerp(py, C0[1] + s * 275, sp); bow += s * 46 * Math.sin(Math.PI * clamp(sp)); }
  // telophase: gathered into the new nucleus (same layout in both cells: identical copies)
  if (ga > 0) { px = lerp(px, C0[0] + c.fin[0], ga); py = lerp(py, lobeY(s) + c.fin[1], ga); a = lerp(a, c.fin[2], ga); bow *= 1 - ga; }
  return { x: px, y: py, a, k, bow };
}
function drawChromosomes() {
  const du = K.dup(), mood = heroMood();
  CHR.forEach((c, i) => {
    const two = du > 0.02, sides = two ? [1, -1] : [-1];
    for (const s of sides) {
      const p = two ? sisterPose(i, s) : sisterPose(i, 0);
      chromatid(c, p.x, p.y, p.a, p.k, p.bow, `ch${i}${s}`, mood);
    }
  });
}

// ---- the spindle: two centrosomes (yellow, never orange) and fibres to every centromere
function poleY(g) { return C0[1] + g * (390 + 40 * K.div()); }
function drawSpindle() {
  const on = popS(CU.condense + 0.5); if (on <= 0 || TT > CU.nuclei + 0.4) return;
  const att = ev(CU.fibers, 0.6);
  for (const g of [-1, 1]) {
    const px = C0[0], py = poleY(g);
    for (let r = 0; r < 9; r++) {   // astral rays
      const a = (g < 0 ? -Math.PI / 2 : Math.PI / 2) + (r - 4) * 0.32, L = 70 * ev(CU.condense + 0.6, 0.8);
      if (L > 2) ink([[px, py], [px + Math.cos(a) * L, py + Math.sin(a) * L]], { w: 3, color: 'rgba(42,29,24,0.45)', amt: 0.4, key: 'as' + g + r });
    }
    if (att > 0 && K.dup() > 0.5) CHR.forEach((c, i) => {
      const p = sisterPose(i, g), m = chromLine(p.x, p.y, p.a, p.k, p.bow, 'f')[13];
      const taut = TT > CU.hush - 0.3 && TT < CU.snap ? Math.sin(B * 2.3 + i) * 3 : 0;
      const P = [[px, py], [lerp(px, m[0], 0.5) + taut, lerp(py, m[1], 0.5)], [m[0], m[1]]];
      ink(subPath(P, att), { w: 3.2, color: 'rgba(42,29,24,0.55)', amt: 0.5, key: 'fb' + g + i });
    });
    ctx.save(); ctx.translate(px, py); ctx.scale(on, on);
    for (let r = 0; r < 8; r++) { const a = r / 8 * TAU + TT * 0.6; cut(capsulePts(Math.cos(a) * 8, Math.sin(a) * 8, Math.cos(a) * 30, Math.sin(a) * 30, 14), PAL.yellow, { key: 'cs' + g + r, sb: 4, sy: 2, tear: 0.4, grain: 0.4 }); }
    cut(ellipsePts(0, 0, 16, 16, 0, 16), PAL.mustard, { key: 'csb' + g, shadow: false, grain: 0.4 });
    ctx.restore();
  }
}
