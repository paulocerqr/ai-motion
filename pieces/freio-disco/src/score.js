  // =====================================================================
  //  SCORE BODY — light, mechanical, D major. Every part that arrives gets a clunk; every name gets the motif.
  //  The lock is the busiest moment (screech); then silence; then the stop + chord is the loudest.
  // =====================================================================
  const c = CU, END = DURATION;
  const MUSIC = false;   // user 2026-11-07: no background music for now (flip to true to bring it back)
  if (MUSIC) {
  to = 'm';
  const motif = (t, v = 0.11) => [['D5', 0], ['A5', E16 * 1.5], ['D6', E16 * 3]].forEach(([n, dt], i) => pluck(t + dt, nz(n), v, -0.2 + i * 0.2, 0.45, 3600, 0.35));
  // a pulse bed: plucked 8ths on the root, chord pads that change per section
  const bed = (t0, t1, notes, v) => { pad(t0, t1, notes, v, { type: 'triangle', cut: 1100, att: 0.5, rel: 0.4 }); for (let t = t0; t < t1 - 0.05; t += E8) bass(t, nz(notes[0]) / 2, 0.05 + (Math.round(t / E8) % 4 === 0 ? 0.03 : 0)); };
  bed(0.2, c.cut, ['D3', 'A3', 'Fs4'], 0.03);
  bed(c.cut, VL('fluid1').t0, ['D3', 'A3', 'Fs4'], 0.025);
  bed(VL('fluid1').t0, VL('caliper1').t0, ['B2', 'Fs3', 'D4'], 0.025);
  bed(VL('caliper1').t0, VL('vented1').t0, ['G2', 'D3', 'B3'], 0.026);
  bed(VL('vented1').t0, VL('abs1').t0, ['A2', 'E3', 'Cs5'], 0.026);
  drone(VL('abs1').t0, c.hush - 0.02, nz('D2'), 0.04, { att: 0.3, rel: 0.03 });
  [c.nDisc, c.nPads, c.nFluid, c.nCaliper, c.nVented, c.nAbs].forEach((t) => motif(t + 0.05));
  // the gift: the stop. Stab + sub + full chord, then a warm tail that fades (goodbye)
  pad(c.stop, c.stop + 0.5, ['D3', 'A3', 'D4', 'Fs4', 'A4'], 0.2, { cut: 3400, att: 0.006, rel: 0.25, send: 0.5 });
  pad(c.stop + 0.4, VL('end2').t1 + 0.6, ['D3', 'A3', 'Fs4', 'D5'], 0.06, { cut: 1600, att: 0.3, rel: 0.4 });
  pad(VL('end2').t1 + 0.5, END, ['G2', 'D3', 'B3', 'Fs4'], 0.01, { type: 'triangle', cut: 900, att: 0.5, rel: 1.2 });
  motif(c.freio + 0.1, 0.12);
  chime(VL('end2').t1 + 0.3, [nz('D5'), nz('A5'), nz('Fs5')], 0.04, 0);
  }
  to = 's';
  // intro: wind past the car
  sweep(0.3, c.lugar + 0.3, 0.02, 600, 2400, 0);
  noiseHit(c.cut - 0.25, 0.3, 'bandpass', 1800, 0.8, 0.05, 0, 0.2, 400);   // whoosh into the cut
  // the road / wheel hum: a soft tone that follows the wheel speed in steps
  const clunk = (t, v = 0.5) => { sub(t, v * 0.5); noiseHit(t, 0.08, 'bandpass', 900, 2, v * 0.25, 0, 0.15); blip(t, 420, 180, 0.08, v * 0.1); };
  clunk(c.disco + 0.35, 0.6);
  clunk(c.lados + 0.25, 0.4); clunk(c.lados + 0.4, 0.4);
  clunk(c.pedal + 0.3, 0.45);
  clunk(c.empurra + 0.35, 0.7);
  clunk(c.sensor + 0.3, 0.35); clunk(c.sensor + 0.5, 0.3);
  for (let i = 0; i < 24; i += 3) blip(c.anel + i * 0.02, 1800, 2200, 0.03, 0.02, 0.3);
  // squeezes: a short friction hiss
  const squeal = (t0, t1, v) => { noiseHit(t0, t1 - t0, 'bandpass', 3200, 6, v, 0.2, 0.2); blip(t0, 2400, 2300, t1 - t0, v * 0.25, 0.2); };
  squeal(c.placas + 0.25, c.nPads + 0.6, 0.05);
  squeal(c.sai, c.nFluid + 0.3, 0.05);
  squeal(c.espreme, c.nCaliper + 0.4, 0.07);
  // oil: a gurgle when the tube fills
  for (let i = 0; i < 6; i++) blip(c.oleo + i * 0.14, 300 + (i % 3) * 90, 520, 0.06, 0.05, -0.3);
  // heat: a sizzle; the vents: a whoosh of air
  noiseHit(c.calor, c.canais - c.calor, 'highpass', 5200, 0.7, 0.025, 0, 0.1);
  sweep(c.ar - 0.1, c.esfria + 0.6, 0.03, 400, 1600, 0);
  // the lock: tyre screech while the road runs under the stopped wheel (peak)
  sweep(c.trava, c.alivia, 0.05, 2600, 1800, 0.1);
  for (let k = 0; k < 3; k++) blip(c.trava + k * 0.4, 1500 + k * 60, 1300, 0.38, 0.04, -0.1);
  sub(c.trava, 0.3);
  // ABS: the stutter, 7 per second
  for (let t = c.alivia; t < c.nAbs + 0.5; t += 1 / 7) { noiseHit(t, 0.03, 'bandpass', 1400, 3, 0.07, 0, 0); blip(t, 900, 700, 0.03, 0.025); }
  // the stop
  sub(c.stop, 0.12);   // softer: the user found the conclusion hit too loud
  noiseHit(c.stop, 0.16, 'lowpass', 1600, 0.7, 0.025, 0, 0.3);
  sweep(c.pisar, c.stop, 0.02, 2600, 900, 0);
