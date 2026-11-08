// =====================================================================
//  ERAS, CAMERA — one era (the cell), no morphs, no hard cuts. The camera does the scale changes:
//  wide -> extreme close-up on the hero while it copies -> wide -> a slow push in the silence -> a kick on the snap.
// =====================================================================
const ERA_BG = [WALL];
const HERO_IN = [545, 820];
// keys: [t, z, px, py] — world point (px, py) sits at screen (500, 870)
const CAMK = [
  [0, 1.0, 500, 870],
  [CU.dup - 0.5, 1.06, 500, 860],
  [CU.dup + 0.1, 2.05, HERO_IN[0], HERO_IN[1]],
  [CU.condense - 0.2, 2.15, HERO_IN[0], HERO_IN[1]],
  [CU.nucBreak - 0.1, 1.0, 500, 870],
  [CU.middle, 1.0, 500, 870],
  [CU.snap, 1.16, 500, 870],
  [CU.snap + 1.6, 1.0, 500, 870],
  [CU.result, 1.0, 500, 870],
  [DURATION, 0.96, 500, 870],
];
function pieceCam(era, t) {
  let i = 0; while (i < CAMK.length - 2 && t >= CAMK[i + 1][0]) i++;
  const a = CAMK[i], b = CAMK[i + 1], u = EZ.io(seg(t, a[0], b[0]));
  let z = lerp(a[1], b[1], u);
  if (t >= CU.snap) z += 0.07 * Math.exp(-(t - CU.snap) * 7);   // the kick on the snap
  return camOf({ z, p: [lerp(a[2], b[2], u), lerp(a[3], b[3], u)], to: [500, 870] });
}
const BRIDGES = [];
