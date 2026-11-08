// =====================================================================
//  SCENES — poseWorld(): every object's transform from TT and the cues; camAt3(): the camera.
// =====================================================================
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const show = (o, on) => { o.visible = on; };
// a part arriving: drops in from dy above with a little overshoot; returns 0..1 (scale it, place it)
const arrive = (t0, d = 0.45) => (TT < t0 ? 0 : EZ.back(seg(TT, t0, t0 + d)));

function poseWorld(O) {
  const t = TT, inCar = t < CU.cut;
  // ---- intro car
  const carX = -6 + 14 * t * (1 - 0.0 * t);
  O.car.position.set(carX, 0, CARZ); show(O.car, inCar);
  O.carWheels.forEach((w) => { w.rotation.z = -SIM.th(t) * 2.7; });
  O.speedLines.forEach((l, i) => {
    const r = RNG('sl', i).f, y = 0.4 + r() * 1.4, z = CARZ + (r() - 0.5) * 2.2, ph = (t * 1.6 + r()) % 1;
    l.position.set(carX - 2.4 - ph * 4, y, z + (z > CARZ ? 0.4 : -0.4)); l.material.opacity = 0.8 * Math.sin(ph * Math.PI) * win(t, CU.energy - 0.3, CU.lugar + 0.2, 0.3, 0.4); show(l, inCar);
  });

  // ---- assembly: wheel + road always; the parts arrive on their words
  const th = SIM.th(t);
  O.wheel.rotation.z = -th; O.disc.rotation.z = -th; O.ring.rotation.z = -th;
  O.beltTex.offset.x = SIM.road(t) * 0.25;
  // disc: slides along the axle onto the hub
  const dA = arrive(CU.disco, 0.5);
  O.disc.position.z = DZ + (1 - dA) * 1.8; show(O.disc, dA > 0);
  const sep = lerp(0.016, 0.07, sm(t, CU.canais, CU.canais + 0.6));
  O.plateA.position.z = -sep; O.plateB.position.z = sep;
  O.vanes.scale.set(1, 1, clamp(sm(t, CU.canais + 0.1, CU.canais + 0.7))); show(O.vanes, t >= CU.canais + 0.1);
  O.dots.position.z = sep + 0.016;
  const h = heat(t);
  O.discM.emissive.setRGB(0.95 * h, 0.13 * h * h, 0.0); O.discM.color.setRGB(lerp(0.55, 0.12, h), lerp(0.57, 0.03, h), lerp(0.6, 0.02, h));
  // pads: drop in beside the disc, then squeeze by clampC
  const pA = arrive(CU.lados, 0.4), pB = arrive(CU.lados + 0.15, 0.4), c = clampC(t), gap = lerp(0.1, 0.0, c);
  const zIn = DZ - sep - 0.015 - 0.025 - gap, zOut = DZ + sep + 0.015 + 0.025 + gap;
  O.padIn.position.set(0.56 + (1 - pA) * 1.4, 0, zIn); O.padOut.position.set(0.56 + (1 - pB) * 1.4, 0, zOut);
  show(O.padIn, pA > 0); show(O.padOut, pB > 0);
  O.padIn.children[1].position.z = -0.035; O.padOut.children[1].position.z = 0.035;
  // the caliper housing drops over the pads on "empurra"; the outer cheek turns see-through to show the big piston
  const cA = arrive(CU.empurra, 0.5);
  O.housing.position.x = (1 - cA) * 1.6; show(O.housing, cA > 0);
  O.redGhost.opacity = lerp(1, 0.3, sm(t, CU.pistao, CU.pistao + 0.4)) * (t > CU.nCaliper + 1.2 ? 1 : 1);
  O.redGhost.depthWrite = O.redGhost.opacity > 0.99;
  O.piston.position.set(0.58, 0, zOut + 0.025 + 0.07); show(O.piston, cA > 0.5);
  const pist = 1 + 0.25 * Math.sin(Math.PI * seg(t, CU.largo, CU.largo + 0.5)); O.piston.scale.set(pist, 1, pist);
  O.smallPiston.position.set(0.6, 0, zOut + 0.025 + 0.05); show(O.smallPiston, t >= CU.tubo && cA < 0.5);
  // pedal box
  const pe = arrive(CU.pedal, 0.5), pp = pedalP(t);
  [O.bracket, O.arm].forEach((o) => { o.scale.setScalar(Math.max(0.001, pe)); show(o, pe > 0); });
  O.arm.rotation.z = pp * 0.4;
  O.master.scale.setScalar(Math.max(0.001, pe)); show(O.master, pe > 0);
  const rodX = O.PV[0] + Math.sin(pp * 0.4) * 0.25;   // where the arm meets the pushrod
  const mpx = O.MC[0] - 0.2 + pp * 0.22;
  O.mPiston.position.set(mpx, O.MC[1], O.MC[2]); show(O.mPiston, pe > 0.9);
  O.pushrod.position.set((rodX + mpx) / 2, O.MC[1], O.MC[2]); O.pushrod.scale.set(1, Math.max(0.01, mpx - rodX), 1); show(O.pushrod, pe > 0.9);
  O.scene.children.forEach((ch) => { if (ch.userData.pedalBit) show(ch, pe > 0); });
  // the line: the clear tube grows, then the oil fills it, then markers flow on each push
  const tg = sm(t, CU.tubo - 0.1, CU.tubo + 0.7), og = sm(t, CU.oleo, CU.oleo + 0.9);
  const segs = (g, f) => g.setDrawRange(0, Math.floor(f * 160) * 10 * 6);
  segs(O.tube.geometry, tg); segs(O.oil.geometry, og); show(O.tube, tg > 0); show(O.oil, og > 0);
  const flowOn = Math.max(win(t, CU.entra, CU.nFluid + 0.3, 0.2, 0.3), win(t, CU.empurra - 0.1, CU.espreme + 0.6, 0.2, 0.3), win(t, CU.pisa, CU.trava + 0.5, 0.1, 0.3));
  O.flow.forEach((f, i) => {
    const u = ((t * 0.55 + i / 6) % 1), p = O.lineCurve.getPointAt(u), tn = O.lineCurve.getTangentAt(u);
    f.position.copy(p); f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tn); f.scale.setScalar(flowOn * Math.sin(Math.PI * u) + 0.001); show(f, flowOn > 0.01);
  });
  // force arrows: small at the pedal, big at the caliper
  const fa = arrive(CU.forca, 0.4) * (1 - sm(t, VL('vented1').t0 - 0.4, VL('vented1').t0));
  O.arrSmall.position.set(O.PV[0] - 0.55, 0.35, O.PV[2]); O.arrSmall.rotation.set(0, 0, -Math.PI / 2); O.arrSmall.scale.setScalar(fa + 0.001); show(O.arrSmall, fa > 0.01);
  const bp = calPt(0.6, 0, DZ + 1.45); O.arrBig.position.set(...bp); O.arrBig.rotation.set(-Math.PI / 2, 0, 0); O.arrBig.scale.setScalar(fa + 0.001); show(O.arrBig, fa > 0.01);
  // air through the vanes
  const airOn = win(t, CU.ar - 0.1, CU.nVented + 1.6, 0.3, 0.5);
  O.air.forEach((m, i) => {
    const a = -th + i / O.air.length * TAU * 3.0 + i * 0.37, f = (t * 0.9 + (i * 0.618) % 1) % 1, r = 0.25 + f * 0.75;
    m.position.set(WC[0] + Math.cos(a) * r, WC[1] + Math.sin(a) * r, DZ + (i % 2 ? 0.012 : -0.012));
    m.rotation.z = a; m.scale.setScalar(airOn * Math.sin(Math.PI * f) + 0.001); show(m, airOn > 0.01);
  });
  // ABS bits
  const rA = t >= CU.anel ? 1 : 0;
  O.teeth.forEach((x, i) => { const s = arrive(CU.anel + i * 0.02, 0.25); x.scale.setScalar(s + 0.001); });
  show(O.ring, t >= CU.anel);
  const sA = arrive(CU.sensor, 0.45); O.sensor.scale.setScalar(sA + 0.001); show(O.sensor, sA > 0);
  const mA = arrive(CU.sensor + 0.2, 0.45); O.module.scale.setScalar(mA + 0.001); show(O.module, mA > 0);
  show(O.wire, t >= CU.sensor + 0.3);
  O.ledM.color.set(ABS_ON(t) && absPulse(t) > 0.5 ? '#ff3b2f' : '#4a1a16');
  // smoke while the wheel is locked on the moving road
  O.smoke.forEach((m, i) => {
    const t0 = CU.trava + i * 0.09, age = t - t0, live = age >= 0 && age < 1.4 && t0 < CU.alivia + 0.2;
    show(m, live); if (!live) return;
    const r = RNG('smoke', i).f, k = age / 1.4;
    m.position.set(-0.2 - age * 1.6 + (r() - 0.5) * 0.3, 0.12 + age * 0.55 + r() * 0.1, -0.35 + (r() - 0.5) * 0.6 + 0.4 * k);
    m.scale.setScalar(0.6 + 2.2 * k); m.material.opacity = 0.75 * (1 - k); m.rotation.set(r() * 3 + age, r() * 3, 0);
  });
}

// ---- camera: a track of eased moves. Each key: [t, d, pos, target, fov]
const CAMK = () => [
  [CU.cut, 0, [2.6, 2.7, 5.2], [0, 1.15, 0], 40],
  [CU.roda - 0.2, 1.4, [2.0, 2.2, 4.2], [0, 1.2, 0.1], 40],
  [CU.disco + 0.4, 1.2, [1.5, 1.7, 3.3], [0, 1.25, 0.2], 40],
  [CU.sozinho, 1.2, [1.9, 2.3, 3.4], [-0.15, 1.45, 0.2], 40],
  [CU.lados - 0.2, 0.9, [0.9, 2.6, 2.5], [-0.3, 1.65, 0.25], 40],
  [VL('fluid1').t0, 1.4, [3.0, 3.4, 6.6], [-0.75, 0.95, 1.0], 42],
  [CU.sai + 0.4, 1.6, [2.6, 3.0, 5.6], [-0.65, 1.1, 0.9], 42],
  [CU.empurra - 0.3, 1.0, [1.0, 2.7, 2.7], [-0.4, 1.7, 0.3], 40],
  [CU.forca - 0.3, 1.1, [3.0, 3.1, 6.4], [-0.75, 1.0, 1.0], 42],
  [VL('vented1').t0, 1.0, [1.5, 1.9, 3.0], [0, 1.25, 0.25], 40],
  [CU.canais - 0.2, 1.2, [2.3, 2.7, 1.5], [0, 1.25, 0.25], 40],
  [VL('abs1').t0, 1.0, [3.4, 1.15, 4.4], [-0.1, 0.85, 0], 42],
  [CU.cutLock, 0, [1.1, 0.35, 1.9], [-0.3, 0.25, -0.3], 40],
  [CU.cutSensor, 0, [1.7, 1.2, 2.4], [0.35, 0.9, 0.2], 40],
  [CU.vezes, 1.2, [2.6, 1.9, 4.2], [0.2, 0.95, 0.3], 41],
  [VL('end1').t0 - 0.2, 1.2, [3.2, 3.2, 6.6], [-0.6, 1.0, 0.8], 42],
  [CU.pisar, 1.2, [2.2, 2.4, 4.6], [-0.4, 1.1, 0.6], 41],
  [CU.stop, 4.5, [-0.6, 2.6, 4.9], [-0.4, 1.1, 0.5], 40],
];
let _camk = null;
function camAt3() {
  const t = TT;
  if (t < CU.cut) {   // the intro: track the car, then push to its front wheel
    const cx = -6 + 14 * t, wheelP = [cx + 1.3, 0.42, CARZ + 0.92];
    const p0 = [cx + 2.5, 3.0, CARZ + 15.5], g0 = [cx + 0.2, 1.0, CARZ];
    const u = sm(t, CU.lugar - 0.6, CU.cut);
    return { pos: p0.map((v, i) => lerp(v, [wheelP[0] + 0.9, 0.8, wheelP[2] + 2.2][i], u)), tgt: g0.map((v, i) => lerp(v, wheelP[i], u)), fov: 40 };
  }
  _camk = _camk || CAMK();
  let pos = _camk[0][2].slice(), tgt = _camk[0][3].slice(), fov = _camk[0][4];
  for (const [k0, d, p, g, f] of _camk) {
    if (t < k0) break;
    const u = d ? EZ.io(seg(t, k0, k0 + d)) : 1;
    pos = pos.map((v, i) => lerp(v, p[i], u)); tgt = tgt.map((v, i) => lerp(v, g[i], u)); fov = lerp(fov, f, u);
  }
  pos = pos.map((v, i) => tgt[i] + (v - tgt[i]) * 1.65);   // keys were set close; pull every view back
  pos[0] += Math.sin(t * 0.37) * 0.06; pos[1] += Math.sin(t * 0.29 + 1) * 0.04;   // a breathing hand-held drift
  // the lock: a short shake
  const sh = win(t, CU.trava, CU.alivia, 0.05, 0.3) * 0.025;
  pos[0] += Math.sin(t * 61) * sh; pos[1] += Math.sin(t * 47 + 2) * sh;
  // the stop: a small kick forward
  const kick = t > CU.stop ? 0.12 * Math.exp(-(t - CU.stop) * 6) : 0; pos[2] -= kick;
  return { pos, tgt, fov };
}
