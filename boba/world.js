"use strict";
/* ===========================================================================
   Bubble Tea Town, by Nora. world.js
   Three.js setup, little model builders (people, animals, pets, truck, cups),
   the town outside and the shop room inside.
   =========================================================================== */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

const cv = $("game");
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa9dcff); scene.fog = new THREE.Fog(0xcfeaff, 110, 300);
const camera = new THREE.PerspectiveCamera(50, 1, .1, 600);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener("resize", resize); resize();

scene.add(new THREE.HemisphereLight(0xffffff, 0xffd9c9, .78));
const sun = new THREE.DirectionalLight(0xfff4e0, .75); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 }); sun.shadow.bias = -.0015;
scene.add(sun, sun.target);

/* ------------------------------ builders ------------------------------ */
const MATS = {};
function mat(c, o) { if (o) return new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)); return MATS[c] || (MATS[c] = new THREE.MeshLambertMaterial({ color: c })); }
function add(geo, c, x, y, z, p, o) { const m = new THREE.Mesh(geo, c && c.isMaterial ? c : mat(c, o)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (p || scene).add(m); return m; }
const GEO = {};
function box(w, h, d, c, x, y, z, p, o) { return add(new THREE.BoxGeometry(w, h, d), c, x, y, z, p, o); }
function cyl(rt, rb, h, c, x, y, z, p, o) { return add(new THREE.CylinderGeometry(rt, rb, h, 18), c, x, y, z, p, o); }
function sph(r, c, x, y, z, p, sx, sy, sz, o) { const m = add(GEO.s || (GEO.s = new THREE.SphereGeometry(1, 18, 14)), c, x, y, z, p, o); m.scale.set(r * (sx || 1), r * (sy || 1), r * (sz || 1)); return m; }
function cone(r, h, c, x, y, z, p, seg) { return add(new THREE.ConeGeometry(r, h, seg || 14), c, x, y, z, p); }
function flat(w, d, c, x, y, z, p) { const m = add(new THREE.PlaneGeometry(w, d), c, x, y, z, p); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; }

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const FONT = '"Avenir Next","Trebuchet MS",Arial,sans-serif';
function label(txt, o) {
  o = o || {}; const s = 56, c = document.createElement("canvas"); let ctx = c.getContext("2d"); ctx.font = "800 " + s + "px " + FONT;
  const w = Math.ceil(ctx.measureText(txt).width) + s; c.width = w; c.height = s * 1.7; ctx = c.getContext("2d");
  ctx.fillStyle = o.bg || "rgba(255,255,255,.94)"; rr(ctx, 3, 3, w - 6, c.height - 6, s * .5); ctx.fill();
  if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 6; ctx.stroke(); }
  ctx.font = "800 " + s + "px " + FONT; ctx.fillStyle = o.fg || "#4a2c3a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, w / 2, c.height / 2 + 3);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: !o.top }));
  const h = o.h || 1; sp.scale.set(h * w / c.height, h, 1); if (o.top) sp.renderOrder = 9; return sp;
}
function setLabel(sp, txt, o) { const n = label(txt, o); sp.material.map.dispose(); sp.material.map = n.material.map; sp.scale.copy(n.scale); }

const rings = [];
function mkRing(x, z, c, r, p) { const m = new THREE.Mesh(new THREE.TorusGeometry(r || 1.5, .13, 8, 36), new THREE.MeshBasicMaterial({ color: c })); m.rotation.x = Math.PI / 2; m.position.set(x, .12, z); (p || scene).add(m); rings.push(m); return m; }

/* animals used for the player, the customers and the pets */
const ANIMALS = {
  pug: { n: "Pug", e: "🐶", body: 0xe9c892, limb: 0xe9c892, dark: 0x4a3528 },
  kitten: { n: "Kitten", e: "🐱", body: 0xf4a95c, limb: 0xf4a95c, dark: 0xffffff },
  bunny: { n: "Bunny", e: "🐰", body: 0xffffff, limb: 0xffffff, dark: 0xffb3cf },
  panda: { n: "Panda", e: "🐼", body: 0xffffff, limb: 0x2c2c34, dark: 0x2c2c34 },
  unicorn: { n: "Unicorn", e: "🦄", body: 0xffffff, limb: 0xffe3f3, dark: 0xff8fd0, magic: 1 },
  dragon: { n: "Dragon", e: "🐲", body: 0x7fd69a, limb: 0x7fd69a, dark: 0xffe27a, magic: 1 },
  fairy: { n: "Fairy", e: "🧚", magic: 1 }
};
function animalHead(k, head, s) {
  const A = ANIMALS[k];
  if (k === "pug") { sph(.19, A.dark, 0, -.1, .33, head, 1.2, .8, .8); [-1, 1].forEach(d => sph(.16, A.dark, d * .36, .2, 0, head, .6, 1.1, .9)); }
  if (k === "kitten") { [-1, 1].forEach(d => cone(.14, .26, A.body, d * .24, .43, 0, head, 4)); sph(.12, 0xffffff, 0, -.1, .36, head, 1.2, .7, .6); sph(.04, 0xff8fb0, 0, -.06, .43, head); }
  if (k === "bunny") { [-1, 1].forEach(d => { sph(.11, A.body, d * .16, .66, 0, head, 1, 3, .7); sph(.06, A.dark, d * .16, .66, .05, head, 1, 3.4, .5); }); sph(.045, A.dark, 0, -.06, .41, head); }
  if (k === "panda") { [-1, 1].forEach(d => { sph(.15, A.dark, d * .31, .33, 0, head); sph(.12, A.dark, d * .15, .04, .34, head, 1, 1.2, .5); }); sph(.05, A.dark, 0, -.08, .41, head); }
  if (k === "unicorn") { cone(.09, .46, 0xffd25c, 0, .56, .12, head, 10).rotation.x = .25; [-1, 1].forEach(d => cone(.09, .2, A.body, d * .25, .42, 0, head, 8)); [0xff8fd0, 0xb99bff, 0x8fd0ff].forEach((c, i) => sph(.16, c, 0, .3 - i * .22, -.36 + i * .02, head)); }
  if (k === "dragon") { [-1, 1].forEach(d => cone(.07, .26, A.dark, d * .2, .46, -.05, head, 8)); sph(.2, A.body, 0, -.12, .32, head, 1.1, .7, .9); [-1, 1].forEach(d => sph(.03, 0x2c2c34, d * .07, -.08, .5, head)); }
}
/* a little upright character: a person, or an animal standing up like a person */
function mkChar(o) {
  const g = new THREE.Group(), k = o.kind || "person", A = k !== "person" && k !== "fairy" ? ANIMALS[k] : null;
  const skin = A ? A.body : o.skin, limb = A ? A.limb : skin;
  const legs = [-.17, .17].map(x => { const l = new THREE.Group(); l.position.set(x, .42, 0); g.add(l); cyl(.11, .11, .42, A ? limb : (o.pants || 0x6a78b8), 0, -.21, 0, l); sph(.13, A ? limb : 0xffffff, 0, -.42, .04, l, 1, .6, 1.3); return l; });
  cyl(.28, .38, .62, A ? A.body : (o.shirt || 0xffffff), 0, .7, 0, g);
  if (o.apron != null) { box(.52, .46, .05, o.apron, 0, .66, .34, g); box(.3, .16, .05, o.apron, 0, .95, .28, g); }
  if (k === "dragon") { sph(.24, A.dark, 0, .68, .2, g, 1, 1.1, .6); [-1, 1].forEach(d => { const w = box(.5, .5, .04, 0x5fbf86, d * .42, 1.0, -.3, g); w.rotation.set(0, d * -.5, d * .5); }); cone(.14, .6, A.body, 0, .45, -.45, g, 8).rotation.x = -1.9; }
  if (k === "kitten") { const t = cyl(.05, .05, .6, A.body, 0, .75, -.4, g); t.rotation.x = -.6; }
  if (k === "bunny") sph(.13, 0xffffff, 0, .5, -.36, g);
  if (k === "fairy") [-1, 1].forEach(d => { const w = sph(.42, 0xd9f3ff, d * .4, 1.05, -.28, g, .8, 1.2, .08, { transparent: true, opacity: .7 }); w.rotation.z = d * -.5; });
  const arms = [-1, 1].map(d => { const a = new THREE.Group(); a.position.set(d * .36, .95, 0); a.rotation.z = d * .28; g.add(a); cyl(.085, .085, .44, limb, 0, -.2, 0, a); sph(.1, limb, 0, -.44, 0, a); return a; });
  const head = new THREE.Group(); head.position.y = 1.4; g.add(head);
  sph(.42, skin, 0, 0, 0, head);
  [-1, 1].forEach(d => { sph(.055, k === "panda" ? 0xffffff : 0x2c2230, d * .15, .04, k === "panda" ? .42 : .385, head); sph(.07, 0xff9fb5, d * .27, -.1, .31, head, 1, .6, .4, { transparent: true, opacity: A ? 0 : .7 }); });
  if (A) animalHead(k, head);
  else {
    const hc = o.hair || 0x6b4226; sph(.45, hc, 0, .09, -.08, head);
    const st = o.style || "pig";
    if (st === "pig") [-1, 1].forEach(d => { sph(.17, hc, d * .47, -.02, -.05, head); sph(.13, hc, d * .52, -.28, -.05, head); });
    if (st === "long") cyl(.36, .4, .7, hc, 0, -.3, -.16, head);
    if (st === "bun") sph(.2, hc, 0, .52, -.1, head);
    if (st === "pony") { sph(.16, hc, 0, .2, -.5, head); sph(.13, hc, 0, -.08, -.6, head); }
    if (k === "fairy") [-.25, 0, .25].forEach((x, i) => sph(.08, [0xff8fd0, 0xffe27a, 0x8fd0ff][i], x, .46, .2, head));
  }
  g.userData = { legs, arms, head, hold: null };
  return g;
}
function animChar(g, moving, t) { const u = g.userData, s = moving ? Math.sin(t * 11) * .7 : 0; u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s; if (!u.hold) { u.arms[0].rotation.x = -s * .7; } u.arms[1].rotation.x = s * .7; u.head.position.y = 1.4 + (moving ? Math.abs(Math.sin(t * 11)) * .04 : Math.sin(t * 2) * .012); }
function mkCup(c) { const g = new THREE.Group(); cyl(.12, .09, .32, c, 0, 0, 0, g); sph(.12, 0xffffff, 0, .16, 0, g, 1, .5, 1, { transparent: true, opacity: .8 }); cyl(.018, .018, .34, 0xff5fa2, .03, .28, 0, g); [-.05, .02, .06].forEach((x, i) => sph(.03, 0x3a2418, x, -.12, .07 - i * .02, g)); return g; }
function giveCup(ch, c) { const u = ch.userData; if (u.hold) { u.arms[0].remove(u.hold); u.hold = null; } if (c == null) { u.arms[0].rotation.x = 0; return; } u.hold = mkCup(c); u.hold.position.set(0, -.5, .14); u.hold.rotation.x = 1.3; u.arms[0].add(u.hold); u.arms[0].rotation.x = -1.3; }

/* four-legged shop pet */
function mkPet(k) {
  const A = ANIMALS[k], g = new THREE.Group();
  sph(.3, A.body, 0, .42, 0, g, .9, .85, 1.4);
  const legs = [[-.16, .26], [.16, .26], [-.16, -.26], [.16, -.26]].map(p => cyl(.07, .07, .3, A.limb, p[0], .15, p[1], g));
  const head = new THREE.Group(); head.position.set(0, .66, .42); head.scale.setScalar(.66); g.add(head); sph(.42, A.body, 0, 0, 0, head);
  [-1, 1].forEach(d => sph(.06, k === "panda" ? 0xffffff : 0x2c2230, d * .15, .04, k === "panda" ? .42 : .385, head)); animalHead(k, head);
  const tail = k === "pug" ? sph(.1, A.body, 0, .58, -.42, g) : k === "bunny" ? sph(.12, 0xffffff, 0, .5, -.42, g) : k === "panda" ? sph(.1, A.dark, 0, .5, -.42, g) : cyl(.045, .045, .5, A.body, 0, .68, -.46, g);
  if (k === "kitten") tail.rotation.x = -.5;
  g.userData = { legs, tail, head }; return g;
}

/* the boba truck */
function mkTruck(col, top) {
  const g = new THREE.Group(), paint = new THREE.MeshLambertMaterial({ color: col });
  box(2.5, 2.1, 4.6, paint, 0, 1.6, -.5, g); box(2.3, 1.5, 1.5, paint, 0, 1.3, 2.5, g);
  box(2.1, .7, .06, 0x8fd6ff, 0, 1.6, 3.27, g); box(2.52, .25, 4.62, 0xffffff, 0, .78, -.5, g);
  [[-1.2, 1.9], [1.2, 1.9], [-1.2, -1.9], [1.2, -1.9]].forEach(p => { const w = cyl(.5, .5, .36, 0x2c2c34, p[0], .5, p[1], g); w.rotation.z = Math.PI / 2; const h = cyl(.22, .22, .38, 0xffffff, p[0], .5, p[1], g); h.rotation.z = Math.PI / 2; });
  box(.08, .95, 2.4, 0x3a2c4a, 1.25, 1.95, -.5, g); box(.6, .08, 2.6, 0xffffff, 1.5, 1.42, -.5, g);
  const aw = box(1.1, .08, 2.9, 0xff7fb0, 1.7, 2.62, -.5, g); aw.rotation.z = -.22; [-.9, 0, .9].forEach(z => { const s = box(1.1, .09, .45, 0xffffff, 1.7, 2.62, -.5 + z, g); s.rotation.z = -.22; });
  [-.6, .6].forEach(x => sph(.14, 0xfff3a8, x, 1.0, 3.28, g, 1, 1, .4, { emissive: 0xffe27a }));
  const sign = label("🧋 BOBA", { h: .8, bg: "#fff" }); sign.position.set(-1.3, 1.9, -.5); g.add(sign);
  const tg = new THREE.Group(); tg.position.set(0, 2.65, -.8); g.add(tg);
  g.userData = { paint, tg }; setTruckTop(g, top); return g;
}
function setTruckTop(g, top) {
  const tg = g.userData.tg; while (tg.children.length) tg.remove(tg.children[0]);
  if (top === "cup") { cyl(.62, .45, 1.3, 0xffffff, 0, .65, 0, tg, { transparent: true, opacity: .55 }); cyl(.55, .42, .95, 0xcfa67c, 0, .52, 0, tg); sph(.62, 0xff7fb0, 0, 1.3, 0, tg, 1, .45, 1); const s = cyl(.07, .07, 1.5, 0x7fd0ff, .15, 1.6, 0, tg); s.rotation.z = -.2; for (let i = 0; i < 7; i++) sph(.13, 0x3a2418, Math.cos(i) * .3, .2, Math.sin(i) * .3, tg); }
  if (top === "pearl") { sph(.75, 0x3a2418, 0, .75, 0, tg); sph(.2, 0xffffff, .3, 1.1, .4, tg); }
  if (top === "star") { const s = add(new THREE.OctahedronGeometry(.8), 0xffd84a, 0, .9, 0, tg, { emissive: 0x9a6a00 }); s.scale.set(1, 1.2, .5); }
  if (top === "heart") { [-1, 1].forEach(d => sph(.42, 0xff5f8f, d * .3, 1.0, 0, tg)); cone(.62, .8, 0xff5f8f, 0, .45, 0, tg, 12).rotation.x = Math.PI; }
}

/* ------------------------------ the town ------------------------------ */
const OBS = [], ROOM_OBS = [];
function obs(list, x, z, w, d) { list.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 }); }
function pushOut(p, r, list) {
  for (const o of list) if (p.x > o.x0 - r && p.x < o.x1 + r && p.z > o.z0 - r && p.z < o.z1 + r) {
    const a = p.x - (o.x0 - r), b = (o.x1 + r) - p.x, c = p.z - (o.z0 - r), d = (o.z1 + r) - p.z, m = Math.min(a, b, c, d);
    if (m === a) p.x = o.x0 - r; else if (m === b) p.x = o.x1 + r; else if (m === c) p.z = o.z0 - r; else p.z = o.z1 + r; return true;
  }
  return false;
}
const HOUSES = [
  { n: "pink", c: 0xff9fc0, x: -48, z: 30, d: -1 }, { n: "blue", c: 0x7fb8ff, x: -24, z: 30, d: -1 }, { n: "yellow", c: 0xffe07a, x: 24, z: 30, d: -1 },
  { n: "purple", c: 0xb99be0, x: 48, z: 30, d: -1 }, { n: "orange", c: 0xffb066, x: -30, z: -5, d: 1 }, { n: "green", c: 0x8fdc9c, x: 30, z: -5, d: 1 }];
const SPOTS = [{ n: "Beach", e: "🏖", x: 94, z: 23, cool: 0 }, { n: "Park", e: "🌳", x: -96, z: 23, cool: 0 }, { n: "School", e: "🏫", x: -60, z: -84, cool: 0 }];
const DOOR = { x: 0, z: .6 }, TRUCK_HOME = { x: 14, z: 5.5, a: Math.PI / 2 };
let beam;
(function town() {
  flat(420, 420, 0xa8e6a1, 0, 0, 0);
  flat(240, 8, 0x8d8a99, 0, .03, 14); flat(8, 108, 0x8d8a99, -70, .03, -40);
  for (let x = -114; x < 116; x += 8) flat(3, .4, 0xffffff, x, .05, 14); for (let z = -90; z < 8; z += 8) flat(.4, 3, 0xffffff, -70, .05, z);
  flat(10, 10, 0xf3d9b0, 0, .03, 5); flat(8, 9, 0xf3d9b0, 14, .035, 5.5);
  /* the shop from outside */
  const sh = new THREE.Group(); sh.position.set(0, 0, -7); scene.add(sh); obs(OBS, 0, -7, 13, 9.4);
  box(13, 5, 9, 0xfff0d9, 0, 2.5, 0, sh); box(13.6, .5, 9.6, 0xff7fb0, 0, 5.2, 0, sh); box(2.2, 3, .2, 0x8a5a44, 0, 1.5, 4.55, sh); sph(.1, 0xffd84a, .7, 1.5, 4.7, sh);
  [-4, 4].forEach(x => { box(3, 1.8, .15, 0x9fdcff, x, 2.3, 4.55, sh); box(3.3, .2, .5, 0xffffff, x, 1.3, 4.7, sh); });
  const aw = box(6, .15, 2, 0xff7fb0, 0, 3.5, 5.3, sh); aw.rotation.x = .25; [-2, 0, 2].forEach(x => { const s = box(1, .16, 2, 0xffffff, x, 3.5, 5.3, sh); s.rotation.x = .25; });
  cyl(1.5, 1.1, 3, 0xffffff, 0, 7, 0, sh, { transparent: true, opacity: .5 }); cyl(1.35, 1.05, 2.2, 0xcfa67c, 0, 6.7, 0, sh); sph(1.5, 0xff7fb0, 0, 8.5, 0, sh, 1, .4, 1);
  const st = cyl(.16, .16, 3.4, 0x7fd0ff, .4, 9.3, 0, sh); st.rotation.z = -.2; for (let i = 0; i < 9; i++) sph(.3, 0x3a2418, Math.cos(i * .7) * .75, 5.9, Math.sin(i * .7) * .75, sh);
  const sg = label("🧋 Bubble Tea Town", { h: 1.5, edge: "#ff7fb0" }); sg.position.set(0, 4.4, 4.9); sh.add(sg);
  mkRing(DOOR.x, DOOR.z, 0xff5fa2, 1.5); const dl = label("🚪 Go inside", { h: .9, top: 1 }); dl.position.set(0, 3.2, .6); scene.add(dl);
  /* houses */
  HOUSES.forEach(h => {
    const g = new THREE.Group(); g.position.set(h.x, 0, h.z); scene.add(g); obs(OBS, h.x, h.z, 9, 8);
    box(9, 4, 8, h.c, 0, 2, 0, g); const r = cone(7.2, 3.2, 0xffffff, 0, 5.6, 0, g, 4); r.rotation.y = Math.PI / 4;
    box(1.6, 2.6, .2, 0xffffff, 0, 1.3, h.d * 4.05, g); [-2.8, 2.8].forEach(x => box(1.6, 1.4, .2, 0xdff3ff, x, 2.4, h.d * 4.05, g));
    h.rx = h.x; h.rz = h.z + h.d * 6.6; mkRing(h.rx, h.rz, h.c, 1.4);
  });
  beam = cyl(1.3, 1.3, 40, 0xffe27a, 0, 20, 0, scene, { transparent: true, opacity: .35, emissive: 0xffd84a }); beam.castShadow = false; beam.visible = false;
  /* beach */
  flat(90, 150, 0xffe9b8, 135, .02, 20); flat(120, 220, 0x5fc8f0, 200, .06, 20);
  [[104, 40, 0xff7fb0], [110, 4, 0x7fd0ff], [100, -14, 0xffd84a], [112, 54, 0x9fe6a0]].forEach(u => { cyl(.08, .08, 3, 0xffffff, u[0], 1.5, u[1]); cone(2.2, 1, u[2], u[0], 3.2, u[1], scene, 10); box(1.6, .1, 2.6, u[2], u[0] + 1.6, .1, u[1]); });
  /* park */
  flat(46, 46, 0x8fdc8a, -112, .02, 44); cyl(3, 3.3, .6, 0xdfe6ee, -112, .3, 44); cyl(2.6, 2.6, .5, 0x7fd0ff, -112, .42, 44); cyl(.3, .3, 2, 0xdfe6ee, -112, 1.2, 44); sph(.6, 0x7fd0ff, -112, 2.4, 44);
  [[-104, 34], [-120, 36]].forEach(b => { box(2.6, .15, .7, 0xc98a5a, b[0], .6, b[1]); box(2.6, .7, .12, 0xc98a5a, b[0], 1, b[1] - .3); });
  /* school */
  obs(OBS, -70, -106, 26, 12); box(26, 7, 12, 0xffd6a8, -70, 3.5, -106); box(27, .6, 13, 0xe86a5a, -70, 7.2, -106); box(3, 3.4, .3, 0x7a5aa8, -70, 1.7, -99.9);
  [-9, -5, 5, 9].forEach(x => box(2.4, 2, .2, 0xdff3ff, -70 + x, 4, -99.9)); cyl(.1, .1, 6, 0xffffff, -56, 3, -98); box(1.6, 1, .05, 0xff5f8f, -55.2, 5.4, -98);
  SPOTS.forEach(s => { s.ring = mkRing(s.x, s.z, 0x7a4fd0, 3.4); s.lab = label(s.e + " Sell at the " + s.n, { h: 1.3, top: 1 }); s.lab.position.set(s.x, 5.2, s.z); scene.add(s.lab); });
  /* trees, bushes, clouds, hills */
  let seed = 7; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const TC = [0x8fd98a, 0x79cc86, 0xffb7d5, 0xffc9e1, 0x9be0c0];
  for (let i = 0; i < 150; i++) {
    const x = R() * 360 - 180, z = R() * 360 - 180; if (x > 86 || Math.abs(z - 14) < 9 || (Math.abs(x + 70) < 9 && z < 16 && z > -96) || (Math.abs(x) < 64 && z > -16 && z < 40) || (x < -52 && x > -90 && z < -76) || SPOTS.some(q => Math.hypot(x - q.x, z - q.z) < 26)) continue;
    const s = .8 + R() * .9, c = TC[Math.floor(R() * TC.length)]; cyl(.25 * s, .32 * s, 2.2 * s, 0xa9744f, x, 1.1 * s, z); sph(1.6 * s, c, x, 3.1 * s, z); sph(1.1 * s, c, x + .7 * s, 4.1 * s, z + .3 * s);
  }
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); g.position.set(R() * 400 - 200, 46 + R() * 22, R() * 400 - 200); scene.add(g); for (let j = 0; j < 4; j++) { const m = sph(5 + R() * 4, 0xffffff, j * 6 - 9, R() * 2, R() * 3, g, 1.3, .7, 1); m.castShadow = false; } }
})();

/* ------------------------------ the shop room ------------------------------ */
const IZ = -400;
const ROOMS = [{ n: "Boba stand", W: 12, D: 11, q: 3, cost: 0 }, { n: "Boba shop", W: 18, D: 14, q: 4, cost: 200 }, { n: "Boba café", W: 26, D: 17, q: 6, cost: 500 }];
const room = new THREE.Group(); room.position.z = IZ; scene.add(room);
const decorG = new THREE.Group(); decorG.position.z = IZ; scene.add(decorG);
const RM = { W: 12, D: 11, cz: 0, lab: { x: 0, z: 0 }, door: { x: 0, z: 0 } };   /* local coordinates, filled by buildRoom */
function clearGroup(g) { for (let i = g.children.length - 1; i >= 0; i--) { const c = g.children[i]; g.remove(c); c.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } const k = rings.indexOf(o); if (k >= 0) rings.splice(k, 1); }); } }
function buildRoom(S) {
  clearGroup(room); ROOM_OBS.length = 0;
  const R = ROOMS[S.lvl], W = R.W, D = R.D, cz = -D / 2 + 3.4; RM.W = W; RM.D = D; RM.cz = cz;
  flat(W + 60, D + 60, 0x4a2c3a, 0, -.05, 0, room).receiveShadow = false; flat(W, D, S.floor, 0, 0, 0, room);
  for (let x = -W / 2 + 1; x < W / 2; x += 2) for (let z = -D / 2 + 1; z < D / 2; z += 2) if (((x + z + 200) / 2 | 0) % 2) flat(1.96, 1.96, 0xffffff, x, .01, z, room).material = mat(0xffffff, { transparent: true, opacity: .25 });
  box(W, 6, .4, S.wall, 0, 3, -D / 2 - .2, room); [-1, 1].forEach(d => box(.4, 6, D, S.wall, d * (W / 2 + .2), 3, 0, room)); box(W, .5, .45, 0xffffff, 0, .25, -D / 2 - .15, room);
  /* counter, register, shelves of jars, menu board */
  const cw = Math.min(W - 4.5, 12); box(cw, 1.15, 1.3, 0xffffff, 0, .575, cz, room); box(cw + .2, .14, 1.5, 0xff9fc6, 0, 1.2, cz, room); obs(ROOM_OBS, 0, IZ + cz, cw, 1.3);
  box(.8, .5, .6, 0x8fd0ff, cw / 2 - .8, 1.5, cz, room); box(.6, .4, .05, 0x2c2c34, cw / 2 - .8, 1.85, cz + .1, room).rotation.x = -.3;
  const pot = cyl(.42, .36, .46, 0x8a8f9c, -cw / 2 + .8, 1.5, cz, room); cyl(.38, .38, .04, 0x3a2418, -cw / 2 + .8, 1.72, cz, room);
  box(W - 2, .16, .8, 0xffffff, 0, 2.2, -D / 2 + .5, room); box(W - 2, .16, .8, 0xffffff, 0, 3.4, -D / 2 + .5, room);
  const JC = [0xcfa67c, 0xff9fc0, 0xb79be0, 0xa6d48c, 0xffc34a, 0x8fd0ff, 0x3a2418, 0xff9a3d];
  for (let i = 0, x = -W / 2 + 1.8; x < W / 2 - 1.5; x += 1.15, i++) { cyl(.3, .3, .7, JC[i % 8], x, 2.65, -D / 2 + .5, room); cyl(.32, .32, .1, 0xffffff, x, 3.05, -D / 2 + .5, room); if (i % 2) cyl(.26, .2, .6, JC[(i + 3) % 8], x, 3.8, -D / 2 + .5, room); }
  const mb = label("🧋 Bubble Tea Town 🧋", { h: 1.1, bg: "#4a2c3a", fg: "#fff", edge: "#ff9fc6" }); mb.position.set(0, 5.2, -D / 2 + .1); room.add(mb);
  RM.cw = cw; RM.pot = pot;
  /* invent lab on the left wall */
  const lx = -W / 2 + 1.3, lz = cz + 3.6; RM.lab = { x: lx + 1.2, z: lz }; box(1.4, 1.1, 2.6, 0xd9c8ff, lx, .55, lz, room); box(1.6, .12, 2.8, 0xffffff, lx, 1.16, lz, room); obs(ROOM_OBS, lx, IZ + lz, 1.4, 2.6);
  [0xff6b8b, 0x6fdc8c, 0x6fb8ff, 0xffe66d].forEach((c, i) => { cyl(.14, .2, .5, c, lx, 1.47, lz - .9 + i * .6, room, { transparent: true, opacity: .85, emissive: c, emissiveIntensity: .3 }); });
  const ll = label("🧪 Invent a drink", { h: .8, top: 1 }); ll.position.set(lx + .4, 3, lz); room.add(ll); mkRing(RM.lab.x, RM.lab.z, 0x9a6bff, .9, room);
  /* recipe book stand on the right */
  const bx = W / 2 - 1.2, bz = cz + 3.6; RM.book = { x: bx - 1.1, z: bz }; cyl(.12, .3, 1.1, 0xc98a5a, bx, .55, bz, room); const bk = box(.9, .1, .7, 0xff7fb0, bx, 1.18, bz, room); bk.rotation.z = .3; obs(ROOM_OBS, bx, IZ + bz, .8, .8);
  const bl = label("📖 Recipes", { h: .7, top: 1 }); bl.position.set(bx - .3, 2.6, bz); room.add(bl); mkRing(RM.book.x, RM.book.z, 0xffb347, .8, room);
  /* door back to town */
  RM.door = { x: 0, z: D / 2 - 1.1 }; box(3, .06, 1.6, 0xff9fc6, 0, .03, D / 2 - 1.1, room); mkRing(0, D / 2 - 1.1, 0xff5fa2, 1.3, room);
  const dl = label("🚪 Go to town", { h: .8, top: 1 }); dl.position.set(0, 2.2, D / 2 - .6); room.add(dl);
  [-1, 1].forEach(d => { cyl(.3, .22, .5, 0xffffff, d * 2.4, .25, D / 2 - .8, room); sph(.5, 0x79cc86, d * 2.4, .9, D / 2 - .8, room); sph(.35, 0xffb7d5, d * 2.4 + .2, 1.4, D / 2 - .8, room); });
}
const DECOR = {
  table: { n: "Table", e: "🪑", cost: 30, say: "customers sit here", mk: g => { cyl(.75, .75, .1, 0xffffff, 0, .85, 0, g); cyl(.1, .3, .85, 0xff9fc6, 0, .42, 0, g); [-1, 1].forEach(d => { cyl(.3, .3, .1, 0xff9fc6, d * 1.15, .5, 0, g); cyl(.06, .2, .5, 0xffffff, d * 1.15, .25, 0, g); }); } },
  plant: { n: "Plant", e: "🪴", cost: 15, mk: g => { cyl(.32, .24, .5, 0xffffff, 0, .25, 0, g); sph(.5, 0x79cc86, 0, .95, 0, g); sph(.38, 0x8fd98a, .25, 1.4, .1, g); sph(.3, 0x79cc86, -.25, 1.3, -.1, g); } },
  lamp: { n: "Glow lamp", e: "💡", cost: 20, mk: g => { cyl(.3, .36, .1, 0xffffff, 0, .05, 0, g); cyl(.05, .05, 2, 0xffffff, 0, 1, 0, g); sph(.38, 0xfff3a8, 0, 2.2, 0, g, 1, 1, 1, { emissive: 0xffd84a }); } },
  rug: { n: "Rainbow rug", e: "🌈", cost: 25, mk: g => { [0xff6b8b, 0xffb347, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff].forEach((c, i) => { const m = cyl(1.8 - i * .28, 1.8 - i * .28, .03, c, 0, .02 + i * .006, 0, g); m.castShadow = false; }); } },
  beanbag: { n: "Beanbag", e: "🛋", cost: 25, mk: g => { sph(.75, 0xb99be0, 0, .42, 0, g, 1, .6, 1); sph(.5, 0xc9afea, 0, .75, -.3, g, 1, .7, .7); } },
  neon: { n: "Neon sign", e: "✨", cost: 50, mk: g => { cyl(.06, .06, 2.2, 0xffffff, 0, 1.1, 0, g); cyl(.4, .4, .08, 0xffffff, 0, .04, 0, g); const l = label("BOBA ♥", { h: .9, bg: "#2c1c3a", fg: "#ff7fe0", edge: "#7fe0ff" }); l.position.y = 2.5; g.add(l); } },
  gumball: { n: "Gumball machine", e: "🍬", cost: 40, mk: g => { cyl(.3, .4, .7, 0xff5f6f, 0, .35, 0, g); sph(.5, 0xffffff, 0, 1.15, 0, g, 1, 1, 1, { transparent: true, opacity: .45 }); [0xff6b8b, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff, 0xffb347].forEach((c, i) => sph(.13, c, Math.cos(i) * .22, 1 + (i % 3) * .14, Math.sin(i) * .22, g)); cyl(.18, .18, .1, 0xff5f6f, 0, 1.68, 0, g); } },
  plush: { n: "Giant boba plushie", e: "🧸", cost: 60, mk: g => { cyl(.6, .45, 1.2, 0xffd9ea, 0, .6, 0, g); sph(.6, 0xff9fc6, 0, 1.2, 0, g, 1, .45, 1); [-1, 1].forEach(d => { sph(.07, 0x2c2230, d * .2, .8, .52, g); sph(.09, 0xff9fb5, d * .34, .66, .47, g, 1, .6, .4); }); const s = cyl(.06, .06, 1, 0x7fd0ff, .15, 1.8, 0, g); s.rotation.z = -.2; for (let i = 0; i < 6; i++) sph(.1, 0x3a2418, Math.cos(i) * .33, .2, .3 + Math.sin(i) * .12, g); } }
};
function mkDecor(k) { const g = new THREE.Group(); DECOR[k].mk(g); return g; }
function buildDecor(S) { clearGroup(decorG); S.decor.forEach(d => { const g = mkDecor(d.k); g.position.set(d.x, 0, d.z); g.rotation.y = d.r || 0; decorG.add(g); }); }
