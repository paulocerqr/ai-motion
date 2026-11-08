// =====================================================================
//  WORLD — the 3D scene, built once; worldAt() poses everything as a pure function of TT.
//  Assembly: wheel axis = Z, wheel centre WC; the camera looks from +Z (the inner side of the wheel),
//  so the disc sits in front of the tyre. The intro car drives on a road far away at z = CARZ.
// =====================================================================
const WC = [0, 1.21, 0], DZ = 0.25, DR = 0.75, OM = 9.0;   // wheel centre, disc z, disc radius, full spin (rad/s)
const CARZ = 60, PHI = 2.2;                                 // car road; the caliper's angle around the disc
const sm = (t, a, b) => EZ.io(seg(t, a, b));
const win = (t, a, b, ri = 0.25, fo = 0.25) => clamp(Math.min((t - a) / ri, (b - t) / fo));   // 0..1 inside [a,b] with ramps
const calPt = (x, y, z) => [WC[0] + x * Math.cos(PHI) - y * Math.sin(PHI), WC[1] + x * Math.sin(PHI) + y * Math.cos(PHI), z];

// ---- the motion clocks
function roadU(t) {                  // the rolling road (and the car) speed 0..1
  if (t < CU.alivia) return 1;
  if (t < CU.hush) return 1 - sm(t, CU.alivia, CU.nAbs + 0.4);
  if (t < VL('end1').t0) return 0;
  if (t < CU.pisar + 0.1) return sm(t, VL('end1').t0 - 0.05, CU.pisar);
  return 1 - EZ.o2(seg(t, CU.pisar + 0.1, CU.stop));
}
function pedalP(t) {                 // the pedal 0..1
  let p = 0;
  p = Math.max(p, win(t, CU.entra, CU.nFluid + 0.5, 0.3, 0.4) * 0.7);
  p = Math.max(p, win(t, CU.espreme, CU.nCaliper + 0.5, 0.2, 0.4));
  p = Math.max(p, win(t, CU.atrito, CU.canais, 0.3, 0.4) * 0.7);
  p = Math.max(p, win(t, CU.pisa, CU.hush, 0.12, 0.3));
  p = Math.max(p, win(t, CU.pisar, DURATION + 1, 0.2, 0.2) * 0.8);
  return p;
}
function absPulse(t) { return 0.5 + 0.5 * Math.tanh(4 * Math.sin(TAU * 7 * t)); }
const ABS_ON = (t) => t >= CU.alivia && t < CU.nAbs + 0.5;
function clampC(t) {                 // how hard the pads squeeze the disc 0..1
  let c = win(t, CU.placas + 0.2, CU.nPads + 0.9, 0.2, 0.3) * 0.6;   // squeezed "by hand" before there is a pedal
  if (t >= CU.oleo) c = Math.max(c, pedalP(t - 0.12));
  if (ABS_ON(t)) c = absPulse(t);
  return c;
}
function heat(t) { return sm(t, CU.atrito, CU.mal + 0.2) * (1 - sm(t, CU.canais + 0.4, CU.esfria + 0.9)); }
function brakeK(t) { return (t < CU.espreme ? 0.55 : 0.88) * (1 - 0.75 * heat(t)); }
function wheelTarget(t) {
  const u = roadU(t);
  if (t >= CU.trava && t < CU.alivia) return 0;                  // locked: the road still runs under it
  if (ABS_ON(t)) return u * (1 - 0.75 * absPulse(t));
  return u * (1 - brakeK(t) * clampC(t));
}
// precomputed once: wheel speed (smoothed), wheel angle, road travel
const SIM = (() => {
  const R = 120, n = Math.ceil((DURATION + 1) * R), s = new Float32Array(n), th = new Float32Array(n), road = new Float32Array(n);
  let sv = 1, a = 0, rp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / R, tg = wheelTarget(t), tau = tg < sv ? 0.08 : 0.25;
    sv += (tg - sv) * Math.min(1, (1 / R) / tau);
    a += OM * sv / R; rp += roadU(t) * OM * 1.15 / R;
    s[i] = sv; th[i] = a; road[i] = rp;
  }
  const at = (arr, t) => arr[Math.max(0, Math.min(n - 1, Math.round(t * R)))];
  return { s: (t) => at(s, t), th: (t) => at(th, t), road: (t) => at(road, t) };
})();

// ---- build
let R3 = null;
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rx, ry); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return tx;
}
function arrow(len, rad, col) {
  const sh = cyl(rad, rad, len * 0.7, col, 12); at(sh, 0, len * 0.35, 0);
  const hd = mesh(new THREE.ConeGeometry(rad * 2.4, len * 0.3, 14), mat(col)); at(hd, 0, len * 0.85, 0);
  return group(sh, hd);
}
function buildWorld() {
  const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#e9e4da'); scene.fog = new THREE.Fog('#e9e4da', 16, 40);
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.05, 200);
  scene.add(new THREE.HemisphereLight('#ffffff', '#b8ad9c', 1.25));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 30 }); sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.06;
  scene.add(sun, sun.target);
  const O = { renderer, scene, cam, sun };

  // ---- the workshop (assembly)
  const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = PAL.floor; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, 24, 24);
  const floor = mesh(new THREE.PlaneGeometry(48, 48), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }), false, true);
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallM = mat(PAL.wall, { r: 0.95 });
  scene.add(at(mesh(new THREE.BoxGeometry(30, 8, 0.3), wallM, false, true), 0, 4, -5));
  scene.add(at(mesh(new THREE.BoxGeometry(0.3, 8, 30), wallM, false, true), -7, 4, 8));
  // rolling road under the tyre
  const beltTex = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#2f3035'; g.fillRect(0, 0, w, h); g.fillStyle = '#45464c'; g.fillRect(0, 0, w / 2, h); }, 6, 1);
  const belt = mesh(new THREE.BoxGeometry(3.0, 0.06, 0.9), [mat(PAL.dark), mat(PAL.dark), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.8 }), mat(PAL.dark), mat(PAL.dark), mat(PAL.dark)]);
  at(belt, 0, 0.03, -0.35); scene.add(belt);
  scene.add(at(box(3.3, 0.04, 1.1, PAL.yellow), 0, 0.005, -0.35));
  O.beltTex = beltTex;
  // the stand: a post behind the wheel holding the axle, and the axle
  scene.add(at(box(0.35, WC[1] + 0.15, 0.35, PAL.black), 0, (WC[1] + 0.15) / 2, -1.05));
  scene.add(at(box(0.9, 0.08, 0.7, PAL.black), 0, 0.04, -1.05));
  const axle = rot(cyl(0.11, 0.11, 1.35, PAL.steelD, 16, { m: 0.4 }), Math.PI / 2, 0, 0); at(axle, WC[0], WC[1], -0.45); scene.add(axle);
  // the wheel (spins): tyre + rim + spokes
  const wheel = new THREE.Group(); at(wheel, WC[0], WC[1], 0); scene.add(wheel);
  const tyre = rot(cyl(1.15, 1.15, 0.5, PAL.rubber, 28, { r: 0.95 }), Math.PI / 2, 0, 0); tyre.receiveShadow = false; at(tyre, 0, 0, -0.37); wheel.add(tyre);
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; const tr = box(0.07, 0.03, 0.44, '#2b2b30'); at(tr, Math.cos(a) * 1.15, Math.sin(a) * 1.15, -0.37); tr.rotation.z = a; wheel.add(tr); }
  const rim = rot(cyl(0.8, 0.8, 0.46, '#c8ccd2', 28, { m: 0.3, r: 0.5 }), Math.PI / 2, 0, 0); rim.receiveShadow = false; at(rim, 0, 0, -0.33); wheel.add(rim);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, sp = box(0.16, 0.62, 0.08, '#9aa0a8', { m: 0.3 }); at(sp, Math.cos(a) * 0.36, Math.sin(a) * 0.36, -0.08); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); }
  wheel.add(at(rot(cyl(0.2, 0.2, 0.12, PAL.dark, 16), Math.PI / 2, 0, 0), 0, 0, -0.06));
  // the disc: two plates (touching = solid; apart + vanes = ventilated), a hat, drilled dots
  const discM = new THREE.MeshStandardMaterial({ color: '#c3c7cd', roughness: 0.45, metalness: 0.35, flatShading: true, emissive: '#000000' });
  const disc = new THREE.Group(); at(disc, WC[0], WC[1], DZ); scene.add(disc);
  const plateA = mesh(new THREE.CylinderGeometry(DR, DR, 0.03, 40), discM), plateB = mesh(new THREE.CylinderGeometry(DR, DR, 0.03, 40), discM);
  [plateA, plateB].forEach((p) => { p.rotation.x = Math.PI / 2; disc.add(p); });
  const hat = rot(cyl(0.3, 0.3, 0.16, '#a7adb5', 24, { m: 0.4, r: 0.5 }), Math.PI / 2, 0, 0); disc.add(hat);
  const dots = new THREE.Group(); disc.add(dots);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 0.48 : 0.6; dots.add(at(rot(cyl(0.035, 0.035, 0.01, '#55595f', 10), Math.PI / 2, 0, 0), Math.cos(a) * r, Math.sin(a) * r, 0)); }
  const vanes = new THREE.Group(); disc.add(vanes);
  for (let i = 0; i < 30; i++) { const a = i / 30 * TAU, v = box(0.4, 0.03, 0.1, '#8f959d', { m: 0.3 }); at(v, Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0); v.rotation.z = a; vanes.add(v); }
  Object.assign(O, { wheel, disc, plateA, plateB, dots, vanes, discM });
  // air streaks through the vanes
  const airM = new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: 0.9 });
  O.air = []; for (let i = 0; i < 36; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.022), airM); scene.add(m); O.air.push(m); }
  O.airM = airM;
  // the pads (in the caliper frame: local x = radial, z = world z)
  const cal = new THREE.Group(); at(cal, WC[0], WC[1], 0); cal.rotation.z = PHI; scene.add(cal);
  const mkPad = () => group(at(box(0.24, 0.36, 0.05, PAL.pad, { r: 0.95 }), 0, 0, 0), at(box(0.28, 0.4, 0.025, PAL.steelD, { m: 0.4 }), 0, 0, 0));
  const padIn = mkPad(), padOut = mkPad(); cal.add(padIn, padOut);
  // the caliper: red housing (bridge over the disc edge + two cheeks), the big piston behind the outer pad
  const housing = new THREE.Group(); cal.add(housing);
  const redM = mat(PAL.red, { r: 0.55 }), redGhost = new THREE.MeshStandardMaterial({ color: PAL.red, roughness: 0.55, flatShading: true, transparent: true, opacity: 1 });
  housing.add(at(mesh(new THREE.BoxGeometry(0.2, 0.56, 0.62), redM), 0.86, 0, DZ));
  const cheekIn = at(mesh(new THREE.BoxGeometry(0.46, 0.56, 0.1), redM), 0.64, 0, DZ - 0.27), cheekOut = at(mesh(new THREE.BoxGeometry(0.46, 0.56, 0.16), redGhost), 0.64, 0, DZ + 0.3);
  housing.add(cheekIn, cheekOut);
  housing.add(at(box(0.08, 0.1, 0.1, PAL.yellow), 0.98, 0.18, DZ + 0.3));   // bleed nipple
  const piston = rot(cyl(0.15, 0.15, 0.14, '#dfe3e8', 24, { m: 0.6, r: 0.3 }), Math.PI / 2, 0, 0); cal.add(piston);
  const smallPiston = rot(cyl(0.05, 0.05, 0.1, '#dfe3e8', 14, { m: 0.6, r: 0.3 }), Math.PI / 2, 0, 0); cal.add(smallPiston);   // before the caliper: the tube ends on a little cup
  Object.assign(O, { cal, padIn, padOut, housing, piston, smallPiston, redGhost });
  // the ABS: toothed ring (spins) + sensor + wire + module
  const RZ = DZ + 0.2; const ring = new THREE.Group(); at(ring, WC[0], WC[1], RZ); scene.add(ring);
  O.teeth = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, tt = box(0.07, 0.06, 0.06, PAL.steelD, { m: 0.5 }); at(tt, Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0); tt.rotation.z = a; ring.add(tt); O.teeth.push(tt); }
  ring.add(rot(cyl(0.33, 0.33, 0.05, '#7d838b', 24, { m: 0.5 }), Math.PI / 2, 0, 0));
  const SA = -0.75, sensor = group(rot(at(cyl(0.05, 0.05, 0.22, PAL.black, 12), 0, 0, 0), 0, 0, Math.PI / 2), at(rot(cyl(0.05, 0.05, 0.03, PAL.yellow, 12), 0, 0, Math.PI / 2), -0.12, 0, 0));
  at(sensor, WC[0] + Math.cos(SA) * 0.55, WC[1] + Math.sin(SA) * 0.55, RZ); sensor.rotation.z = SA; scene.add(sensor);
  const module = group(box(0.42, 0.26, 0.34, PAL.black), at(box(0.06, 0.06, 0.02, '#3b1414'), 0.1, 0.06, 0.18));
  at(module, 1.55, 0.13, 0.25); scene.add(module);
  const ledM = new THREE.MeshBasicMaterial({ color: '#ff3b2f' }); const led = at(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), ledM), 0.1, 0.06, 0.181); module.add(led);
  const wireCurve = new THREE.CatmullRomCurve3([[WC[0] + Math.cos(SA) * 0.69, WC[1] + Math.sin(SA) * 0.69, RZ], [0.8, 0.55, 0.6], [1.1, 0.1, 0.5], [1.4, 0.12, 0.3]].map((p) => new THREE.Vector3(...p)));
  const wire = mesh(new THREE.TubeGeometry(wireCurve, 40, 0.018, 6), mat(PAL.black)); scene.add(wire);
  Object.assign(O, { ring, sensor, module, wire, led, ledM });
  // the pedal box: bracket + pivoting arm + pad, master cylinder, pushrod
  const PV = [-1.75, 1.25, 1.9];
  const bracket = group(at(box(0.5, 0.06, 0.5, PAL.black), 0, -PV[1] + 0.03, 0), at(box(0.1, PV[1], 0.1, PAL.black), -0.18, -PV[1] / 2, 0), at(box(0.3, 0.08, 0.1, PAL.black), -0.05, 0, 0));
  at(bracket, ...PV); scene.add(bracket);
  const arm = new THREE.Group(); at(arm, ...PV); scene.add(arm);
  arm.add(at(box(0.1, 0.95, 0.1, PAL.dark), 0, -0.47, 0));
  arm.add(at(box(0.08, 0.32, 0.44, '#1d1d20'), -0.06, -0.95, 0)); for (let i = 0; i < 4; i++) arm.add(at(box(0.09, 0.03, 0.4, '#55565c'), -0.07, -1.06 + i * 0.075, 0));
  arm.add(at(rot(cyl(0.05, 0.05, 0.12, PAL.steelD, 12), Math.PI / 2, 0, 0), 0, 0, 0));
  const MC = [-1.2, 1.0, 1.9];   // master cylinder centre (axis x)
  const masterM = new THREE.MeshStandardMaterial({ color: '#c7ccd3', roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.45 });
  const master = at(rot(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 18), masterM), 0, 0, Math.PI / 2), ...MC); scene.add(master);
  const resv = at(box(0.22, 0.14, 0.18, PAL.black), MC[0], MC[1] + 0.16, MC[2]); resv.userData.pedalBit = true; scene.add(resv);   // reservoir
  const mPiston = rot(cyl(0.085, 0.085, 0.08, '#e9ecef', 14, { m: 0.6 }), 0, 0, Math.PI / 2); scene.add(mPiston);
  const pushrod = rot(cyl(0.025, 0.025, 1, PAL.steelD, 8), 0, 0, Math.PI / 2); scene.add(pushrod);
  const leg = at(box(0.1, 1.0, 0.1, PAL.black), MC[0], 0.5, MC[2] - 0.12); leg.userData.pedalBit = true; scene.add(leg);
  Object.assign(O, { PV, MC, bracket, arm, master, mPiston, pushrod, masterGroup: [master] });
  // the brake line: a clear tube, oil filling it, and flow markers
  const lineCurve = new THREE.CatmullRomCurve3([[MC[0] + 0.27, MC[1], MC[2]], [-0.85, 0.85, 1.85], [-0.95, 0.1, 1.6], [-1.05, 0.1, 1.0], [-1.0, 0.7, 0.75], [-0.95, 1.6, 0.6], [...calPt(0.6, 0, 0.62)].map((v, i) => (i === 2 ? 0.62 : v))].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
  const tubeG = new THREE.TubeGeometry(lineCurve, 160, 0.045, 10), oilG = new THREE.TubeGeometry(lineCurve, 160, 0.034, 10);
  const tube = mesh(tubeG, new THREE.MeshStandardMaterial({ color: '#dfe6ea', roughness: 0.2, transparent: true, opacity: 0.35 }), false, false);
  const oil = mesh(oilG, new THREE.MeshStandardMaterial({ color: PAL.amber, roughness: 0.35, emissive: '#3a2000' }), true, false);
  scene.add(tube, oil);
  O.flow = []; for (let i = 0; i < 6; i++) { const f = mesh(new THREE.ConeGeometry(0.07, 0.16, 12), mat(PAL.yellow, { em: '#5a4000' }), false, false); scene.add(f); O.flow.push(f); }
  Object.assign(O, { lineCurve, tube, oil });
  // force arrows
  O.arrSmall = arrow(0.45, 0.035, PAL.yellow); O.arrBig = arrow(1.1, 0.09, PAL.yellow); scene.add(O.arrSmall, O.arrBig);
  // smoke puffs at the contact patch
  O.smoke = []; for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 1, transparent: true, opacity: 0.8, flatShading: true })); scene.add(m); O.smoke.push(m); }

  // ---- the intro: a road, a car, trees and poles
  const road = mesh(new THREE.PlaneGeometry(400, 5), mat('#55575d', { r: 0.95 }), false, true); road.rotation.x = -Math.PI / 2; at(road, 0, 0.01, CARZ); scene.add(road);
  const grass = mesh(new THREE.PlaneGeometry(400, 40), mat('#a6cf7e', { r: 1 }), false, true); grass.rotation.x = -Math.PI / 2; at(grass, 0, 0.005, CARZ); scene.add(grass);
  for (let i = 0; i < 60; i++) { const d = box(1.6, 0.012, 0.16, PAL.white); at(d, -120 + i * 4.5, 0.02, CARZ); scene.add(d); }
  const rr = RNG("trees").f;
  for (let i = 0; i < 70; i++) {
    const x = -140 + i * 4.1 + rr() * 2, z = CARZ - 4.2 - rr() * 5, s = 0.7 + rr() * 0.7;
    const tr = group(at(cyl(0.1, 0.12, 0.8, '#7a5a3c', 6), 0, 0.4, 0), at(mesh(new THREE.ConeGeometry(0.7, 1.6, 7), mat(['#4f9a4f', '#5fae55', '#3f8a49'][i % 3])), 0, 1.5, 0));
    tr.scale.setScalar(s); at(tr, x, 0, z); scene.add(tr);
  }
  const car = new THREE.Group(); scene.add(car);
  car.add(at(box(4.0, 0.7, 1.8, PAL.blue, { r: 0.5 }), 0, 0.72, 0));
  car.add(at(box(2.1, 0.62, 1.62, '#5a8ad8', { r: 0.5 }), -0.25, 1.38, 0));
  car.add(at(box(2.14, 0.44, 1.5, '#1d2a3a', { r: 0.2 }), -0.25, 1.4, 0.07));
  car.add(at(box(0.08, 0.2, 0.4, '#fff7cf', { em: '#8a7a30' }), 2.0, 0.8, 0.6), at(box(0.08, 0.2, 0.4, '#fff7cf', { em: '#8a7a30' }), 2.0, 0.8, -0.6));
  car.add(at(box(0.08, 0.18, 0.36, '#c4302a'), -2.0, 0.85, 0.62), at(box(0.08, 0.18, 0.36, '#c4302a'), -2.0, 0.85, -0.62));
  O.carWheels = [];
  for (const [x, z] of [[1.3, 0.92], [-1.3, 0.92], [1.3, -0.92], [-1.3, -0.92]]) {
    const w = new THREE.Group(); at(w, x, 0.42, z); car.add(w);
    w.add(rot(cyl(0.42, 0.42, 0.28, PAL.rubber, 20), Math.PI / 2, 0, 0));
    w.add(at(rot(cyl(0.26, 0.26, 0.3, '#c8ccd2', 10, { m: 0.3 }), Math.PI / 2, 0, 0), 0, 0, 0));
    O.carWheels.push(w);
  }
  O.speedLines = []; for (let i = 0; i < 14; i++) { const l = mesh(new THREE.BoxGeometry(1.4, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }), false, false); scene.add(l); O.speedLines.push(l); }
  O.car = car;
  return O;
}
