  // =====================================================================
  //  SFX under the voice (-18 dB); the old musical score stays disabled.
  // =====================================================================
  const c = CU;
  const MUSIC = false;
  if (MUSIC) {
  to = 'm';
  pad(0.0, c.pro + 0.2, ['D3', 'A3', 'Fs4'], 0.03, { type: 'triangle', cut: 800, att: 0.6, rel: 0.3 });
  [['D4', 0], ['A4', E8]].forEach(([n, dt], i) => pluck(c.wake + dt, nz(n), 0.18, 0.1 - i * 0.1, 0.6, 2600, 0.35));   // the hero's motif: a rising fifth
  pluck(c.dup, nz('D5'), 0.14, -0.3, 0.4, 3600, 0.3); pluck(c.dup + E16, nz('D5'), 0.12, 0.3, 0.4, 3600, 0.3);       // the copy: the same note twice
  pluck(c.dna, nz('A5'), 0.10, 0, 0.5, 4200, 0.4);
  pad(c.pro, c.hush - 0.05, ['B2', 'Fs3', 'D4'], 0.03, { cut: 900, att: 0.4, rel: 0.12, swellTo: 0.04, swellAt: c.middle });
  ['A4', 'Fs4', 'E4', 'D4'].forEach((n, i) => pluck(c.condense + i * 0.12, nz(n), 0.09, 0.2 - i * 0.12, 0.3, 2400, 0.25));   // winding up
  ['D4', 'Fs4', 'A4', 'D5'].forEach((n, i) => pluck(c.align + 0.25 + i * 0.22, nz(n), 0.11, -0.3 + i * 0.2, 0.4, 3000, 0.3)); // into line
  drone(c.meta + 0.2, c.hush - 0.02, nz('D2'), 0.035, { att: 1.6, rel: 0.05 });   // the tension, cut off hard
  // the snap (payoff): a short stab, a sub, then a flat chord
  pad(c.snap, c.snap + 0.45, ['D3', 'A3', 'D4', 'Fs4', 'A4'], 0.22, { cut: 3200, att: 0.006, rel: 0.25, send: 0.5 });
  pad(c.snap + 0.4, c.telo + 0.6, ['D3', 'A3', 'Fs4'], 0.05, { cut: 1300, att: 0.3, rel: 0.4 });
  pad(c.telo + 0.3, DURATION, ['G2', 'D3', 'B3', 'Fs4'], 0.012, { type: 'triangle', cut: 900, att: 0.6, rel: 1.2 });
  [['D4', 0], ['A4', E8], ['D5', E8 * 2]].forEach(([n, dt], i) => pluck(c.nuclei + dt, nz(n), 0.05, -0.2 + i * 0.2, 0.5, 2800, 0.35));
  [['D4', 0], ['A4', E8]].forEach(([n, dt], i) => { pluck(c.same + dt, nz(n), 0.06, -0.3, 0.6, 2600, 0.35); pluck(c.same + dt + 0.02, nz(n), 0.06, 0.3, 0.6, 2600, 0.35); });   // the motif, twice at once: two heroes
  chime(c.n46 + 0.3, [nz('D5'), nz('A5'), nz('Fs5')], 0.05, 0);
  }
  to = 's';
  noiseHit(c.nucBreak, 0.5, 'bandpass', 2200, 0.8, 0.05, 0.2, 0.2, 900);   // paper tearing
  blip(c.condense + 0.5, 900, 1400, 0.08, 0.04, -0.4); blip(c.condense + 0.55, 900, 1400, 0.08, 0.04, 0.4);   // the centrosomes pop
  sweep(c.fibers - 0.1, c.fibers + 0.5, 0.008, 400, 1800, 0);
  sub(c.snap, 0.12);
  noiseHit(c.snap, 0.18, 'highpass', 2500, 0.7, 0.025, 0, 0.3);   // the crack
  sweep(c.furrow - 0.3, c.furrow + 0.85, 0.012, 1800, 500, 0);  // the pinch
  blip(c.n46, 700, 1100, 0.07, 0.04, -0.3); blip(c.n46 + 0.2, 700, 1100, 0.07, 0.04, 0.3);
