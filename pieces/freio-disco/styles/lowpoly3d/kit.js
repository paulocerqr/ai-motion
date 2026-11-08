// =====================================================================
//  styles/lowpoly3d — a toy-like 3D explainer: flat-shaded primitives, soft daylight shadows,
//  a pale floor, black machinery with red / yellow accents. Text is 2D on top of the 3D frame:
//  a yellow outlined TITLE when a part is named, white word-by-word SUBTITLES.
//  Needs THREE (vendor/three.min.js) before it in the build.
// =====================================================================
const PAL = {
  floor: '#d8d3ca', wall: '#ebe7df', black: '#26272b', dark: '#3a3c42', steel: '#b9bec6', steelD: '#8d939c',
  red: '#d2382c', yellow: '#ffd23f', amber: '#e89a1c', rubber: '#1f1f22', pad: '#4a3b32', blue: '#3e74c9', white: '#f7f5f0', ink: '#111114',
};
const HEAVY = '"Fira Sans", "Arial Black", Impact, sans-serif';
const STYLE = { paper: PAL.floor, ones: true };

// ---- materials (cached by colour + options)
const _mats = {};
function mat(col, o = {}) {
  const k = col + JSON.stringify(o);
  if (!_mats[k]) _mats[k] = new THREE.MeshStandardMaterial({ color: col, roughness: o.r ?? 0.75, metalness: o.m ?? 0.0, flatShading: o.flat ?? true, transparent: !!o.op, opacity: o.op ?? 1, emissive: o.em ?? '#000000' });
  return _mats[k];
}
function mesh(geo, m, cast = true, recv = true) { const x = new THREE.Mesh(geo, m); x.castShadow = cast; x.receiveShadow = recv; return x; }
const box = (w, h, d, col, o) => mesh(new THREE.BoxGeometry(w, h, d), mat(col, o));
const cyl = (rt, rb, h, col, seg = 24, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(col, o));
function group(...xs) { const g = new THREE.Group(); xs.forEach((x) => g.add(x)); return g; }
const at = (o, x, y, z) => (o.position.set(x, y, z), o);
const rot = (o, x, y, z) => (o.rotation.set(x, y, z), o);

// ---- 2D overlay text (drawn on the 2d canvas after the 3D frame)
function outlined(str, x, y, size, fill, o = {}) {
  ctx.save();
  ctx.font = `900 ${size}px ${HEAVY}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const fit = o.maxW ? Math.min(1, o.maxW / ctx.measureText(str).width) : 1;
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); const ss = (o.s ?? 1) * fit; ctx.scale(ss, ss);
  ctx.lineWidth = o.stroke ?? size * 0.2; ctx.strokeStyle = PAL.ink; ctx.strokeText(str, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(str, 0, 0);
  ctx.restore();
}
