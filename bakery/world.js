"use strict";
/* ===========================================================================
   Pocket Peaches, by Jules. world.js
   Three.js setup, little model builders (bakers, customers, pets, treats),
   the magical forest outside and the treehouse bakery room inside.
   =========================================================================== */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];

const cv = $("game");
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xb79cf0); scene.fog = new THREE.Fog(0xe6c6ea, 90, 250);
const camera = new THREE.PerspectiveCamera(50, 1, .1, 1200);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener("resize", resize); resize();

scene.add(new THREE.HemisphereLight(0xfff2ff, 0xa8dcc0, .8));
const sun = new THREE.DirectionalLight(0xffe8d0, .7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
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
function torus(r, t, c, x, y, z, p, arc, o) { return add(new THREE.TorusGeometry(r, t, 8, 28, arc || Math.PI * 2), c, x, y, z, p, o); }
const glow = (c, i) => ({ emissive: c, emissiveIntensity: i == null ? .8 : i });

function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const FONT = '"Avenir Next","Trebuchet MS",Arial,sans-serif';
function label(txt, o) {
  o = o || {}; const s = 56, c = document.createElement("canvas"); let ctx = c.getContext("2d"); ctx.font = "800 " + s + "px " + FONT;
  const w = Math.ceil(ctx.measureText(txt).width) + s; c.width = w; c.height = s * 1.7; ctx = c.getContext("2d");
  ctx.fillStyle = o.bg || "rgba(255,255,255,.94)"; rr(ctx, 3, 3, w - 6, c.height - 6, s * .5); ctx.fill();
  if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 6; ctx.stroke(); }
  ctx.font = "800 " + s + "px " + FONT; ctx.fillStyle = o.fg || "#4a2c2a"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, w / 2, c.height / 2 + 3);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: !o.top }));
  const h = o.h || 1; sp.scale.set(h * w / c.height, h, 1); if (o.top) sp.renderOrder = 9; return sp;
}
function setLabel(sp, txt, o) { const n = label(txt, o); sp.material.map.dispose(); sp.material.map = n.material.map; sp.scale.copy(n.scale); }

const rings = [];
function mkRing(x, z, c, r, p) { const m = new THREE.Mesh(new THREE.TorusGeometry(r || 1.5, .13, 8, 36), new THREE.MeshBasicMaterial({ color: c })); m.rotation.x = Math.PI / 2; m.position.set(x, .12, z); (p || scene).add(m); rings.push(m); return m; }
function clearGroup(g) { for (let i = g.children.length - 1; i >= 0; i--) { const c = g.children[i]; g.remove(c); c.traverse(o => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } const k = rings.indexOf(o); if (k >= 0) rings.splice(k, 1); }); } }

/* little emoji puffs for magic, picking and thank-yous */
const EMO = {}, parts = [];
function emoTex(e) { if (EMO[e]) return EMO[e]; const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.font = "46px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(e, 32, 36); return (EMO[e] = new THREE.CanvasTexture(c)); }
function puff(e, x, y, z, n) { for (let i = 0; i < (n || 1) && parts.length < 90; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoTex(e), transparent: true, depthWrite: false })); sp.position.set(x + rnd(-.5, .5), y + rnd(-.2, .3), z + rnd(-.5, .5)); sp.scale.setScalar(.6); scene.add(sp); parts.push({ sp, vx: rnd(-.6, .6), vy: rnd(.8, 1.8), vz: rnd(-.6, .6), life: rnd(.9, 1.5) }); } }
function tickParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { scene.remove(p.sp); p.sp.material.dispose(); parts.splice(i, 1); continue; } p.sp.position.x += p.vx * dt; p.sp.position.y += p.vy * dt; p.sp.position.z += p.vz * dt; p.sp.material.opacity = Math.min(1, p.life * 2); } }

/* ------------------------------ magic ingredients ------------------------------ */
const ING = {
  berry: { n: "Forest berries", e: "🍓", at: "red berry bushes near the bakery" }, moon: { n: "Moonberries", e: "🫐", at: "glowing blue bushes" },
  honey: { n: "Glow honey", e: "🍯", at: "golden beehives on tree stumps" }, egg: { n: "Golden eggs", e: "🥚", at: "nests in the grass" },
  star: { n: "Star sugar", e: "✨", at: "sparkly crystals far away (rare)", rare: 1 }, dew: { n: "Rainbow dew", e: "🌈", at: "rainbow flowers far away (rare)", rare: 1 } };

/* ------------------------------ characters ------------------------------ */
const ANIMALS = {
  dog: { n: "Dog", e: "🐶", body: 0xe6bb80, limb: 0xe6bb80, dark: 0x8a5a34 },
  kitty: { n: "Kitty", e: "🐱", body: 0xf4a95c, limb: 0xf4a95c, dark: 0xffffff },
  bunny: { n: "Bunny", e: "🐰", body: 0xffffff, limb: 0xffffff, dark: 0xffb3cf },
  panda: { n: "Panda", e: "🐼", body: 0xffffff, limb: 0x2c2c34, dark: 0x2c2c34 },
  fox: { n: "Fox", e: "🦊", body: 0xf08a3c, limb: 0x4a3028, dark: 0xffffff },
  horse: { n: "Horse", e: "🐴", body: 0xc08a5a, limb: 0xc08a5a, dark: 0x4a2e1e },
  dragon: { n: "Baby dragon", e: "🐲", body: 0x8fdcb0, limb: 0x8fdcb0, dark: 0xffe27a, magic: 1 },
  unicorn: { n: "Unicorn", e: "🦄", body: 0xffffff, limb: 0xffe3f3, dark: 0xff8fd0, magic: 1 },
  bear: { n: "Bear", e: "🐻", body: 0xa9744f, limb: 0xa9744f, dark: 0xe6c9a0 },
  fairy: { n: "Fairy", e: "🧚", magic: 1 }
};
function animalHead(k, head) {
  const A = ANIMALS[k], nose = 0x2c2230;
  if (k === "dog") { [-1, 1].forEach(d => sph(.17, A.dark, d * .38, .16, 0, head, .6, 1.2, .9)); sph(.18, 0xf7e3c4, 0, -.1, .33, head, 1.2, .8, .9); sph(.055, nose, 0, -.04, .49, head); }
  if (k === "kitty") { [-1, 1].forEach(d => cone(.14, .26, A.body, d * .24, .43, 0, head, 4)); sph(.12, 0xffffff, 0, -.1, .36, head, 1.2, .7, .6); sph(.04, 0xff8fb0, 0, -.06, .43, head); }
  if (k === "bunny") { [-1, 1].forEach(d => { sph(.11, A.body, d * .16, .66, 0, head, 1, 3, .7); sph(.06, A.dark, d * .16, .66, .05, head, 1, 3.4, .5); }); sph(.045, A.dark, 0, -.06, .41, head); }
  if (k === "panda") { [-1, 1].forEach(d => { sph(.15, A.dark, d * .31, .33, 0, head); sph(.12, A.dark, d * .15, .04, .34, head, 1, 1.2, .5); }); sph(.05, A.dark, 0, -.08, .41, head); }
  if (k === "fox") { [-1, 1].forEach(d => { cone(.16, .34, A.body, d * .26, .45, 0, head, 4); cone(.08, .16, 0x3a2a2a, d * .26, .58, 0, head, 4); }); sph(.17, 0xffffff, 0, -.13, .3, head, 1.3, .75, .9); sph(.05, nose, 0, -.08, .46, head); }
  if (k === "horse") { sph(.23, A.body, 0, -.14, .3, head, .85, .8, 1.3); [-1, 1].forEach(d => { cone(.08, .22, A.body, d * .2, .44, 0, head, 8); sph(.03, nose, d * .08, -.14, .58, head); }); [0, 1, 2].forEach(i => sph(.15, A.dark, 0, .36 - i * .2, -.3 - i * .03, head)); }
  if (k === "unicorn") { cone(.09, .46, 0xffd25c, 0, .56, .12, head, 10).rotation.x = .25; [-1, 1].forEach(d => cone(.09, .2, A.body, d * .25, .42, 0, head, 8)); [0xff8fd0, 0xb99bff, 0x8fd0ff].forEach((c, i) => sph(.16, c, 0, .3 - i * .22, -.36 + i * .02, head)); }
  if (k === "dragon") { [-1, 1].forEach(d => cone(.07, .26, A.dark, d * .2, .46, -.05, head, 8)); sph(.2, A.body, 0, -.12, .32, head, 1.1, .7, .9); [-1, 1].forEach(d => sph(.03, nose, d * .07, -.08, .5, head)); }
  if (k === "bear") { [-1, 1].forEach(d => sph(.14, A.body, d * .31, .34, 0, head)); sph(.17, A.dark, 0, -.1, .33, head, 1.2, .8, .8); sph(.05, nose, 0, -.05, .46, head); }
}
function mkWings(g, c, y) { return [-1, 1].map(d => { const w = new THREE.Group(); w.position.set(0, y || 1.05, -.3); g.add(w); sph(.5, c, d * .56, .16, 0, w, .9, 1.25, .08, { transparent: true, opacity: .85 }).castShadow = false; sph(.3, c, d * .42, -.42, 0, w, .85, 1, .08, { transparent: true, opacity: .85 }).castShadow = false; return w; }); }
/* a little upright character: a person, or an animal standing up like a person */
function mkChar(o) {
  const g = new THREE.Group(), k = o.kind || "person", A = k !== "person" && k !== "fairy" ? ANIMALS[k] : null;
  const skin = A ? A.body : o.skin, limb = A ? A.limb : skin;
  const legs = [-.17, .17].map(x => { const l = new THREE.Group(); l.position.set(x, .42, 0); g.add(l); cyl(.11, .11, .42, A ? limb : (o.pants || 0x6a78b8), 0, -.21, 0, l); sph(.13, A ? limb : 0xffffff, 0, -.42, .04, l, 1, .6, 1.3); return l; });
  cyl(.28, .38, .62, A ? A.body : (o.shirt || 0xffffff), 0, .7, 0, g);
  if (o.apron != null) { box(.52, .46, .05, o.apron, 0, .66, .34, g); box(.3, .16, .05, o.apron, 0, .95, .28, g); }
  if (k === "dragon") { sph(.24, A.dark, 0, .68, .2, g, 1, 1.1, .6); [-1, 1].forEach(d => { const w = box(.5, .5, .04, 0x5fbf86, d * .42, 1.0, -.3, g); w.rotation.set(0, d * -.5, d * .5); }); cone(.14, .6, A.body, 0, .45, -.45, g, 8).rotation.x = -1.9; }
  if (k === "kitty") cyl(.05, .05, .6, A.body, 0, .75, -.4, g).rotation.x = -.6;
  if (k === "bunny") sph(.13, 0xffffff, 0, .5, -.36, g);
  if (k === "fox") { sph(.2, A.body, 0, .62, -.5, g, .8, .8, 1.6).rotation.x = .6; sph(.13, 0xffffff, 0, .78, -.74, g); }
  if (k === "horse") sph(.14, A.dark, 0, .5, -.42, g, .8, 2, .8);
  if (k === "dog") cyl(.05, .04, .36, A.body, 0, .78, -.38, g).rotation.x = -.7;
  const wings = k === "fairy" || o.wings ? mkWings(g, o.wingC || 0xd9f3ff) : null;
  const arms = [-1, 1].map(d => { const a = new THREE.Group(); a.position.set(d * .36, .95, 0); a.rotation.z = d * .28; g.add(a); cyl(.085, .085, .44, limb, 0, -.2, 0, a); sph(.1, limb, 0, -.44, 0, a); return a; });
  const head = new THREE.Group(); head.position.y = 1.4; g.add(head);
  sph(.42, skin, 0, 0, 0, head);
  [-1, 1].forEach(d => { sph(.055, k === "panda" ? 0xffffff : 0x2c2230, d * .15, .04, k === "panda" ? .42 : .385, head); if (!A) sph(.07, 0xff9fb5, d * .27, -.1, .31, head, 1, .6, .4, { transparent: true, opacity: .7 }); });
  if (A) animalHead(k, head);
  else {
    const hc = o.hair || 0x6b4226; sph(.45, hc, 0, .09, -.08, head);
    const st = o.style || "long";
    if (st === "pig") [-1, 1].forEach(d => { sph(.17, hc, d * .47, -.02, -.05, head); sph(.13, hc, d * .52, -.28, -.05, head); });
    if (st === "long") cyl(.36, .4, .7, hc, 0, -.3, -.16, head);
    if (st === "bun") sph(.2, hc, 0, .52, -.1, head);
    if (st === "pony") { sph(.16, hc, 0, .2, -.5, head); sph(.13, hc, 0, -.08, -.6, head); }
    if (k === "fairy") [-.25, 0, .25].forEach((x, i) => sph(.08, [0xff8fd0, 0xffe27a, 0x8fd0ff][i], x, .46, .2, head));
  }
  if (o.hat) { cyl(.3, .27, .22, 0xffffff, 0, .5, -.02, head); sph(.34, 0xffffff, 0, .74, -.02, head, 1, .68, 1); }
  g.userData = { legs, arms, head, hold: null, wings };
  return g;
}
function animChar(g, moving, t) {
  const u = g.userData, s = moving ? Math.sin(t * 11) * .7 : 0; u.legs[0].rotation.x = s; u.legs[1].rotation.x = -s; u.legs[0].rotation.z = u.legs[1].rotation.z = 0;
  if (!u.hold) u.arms[0].rotation.x = -s * .7; u.arms[1].rotation.x = s * .7; u.head.position.y = 1.4 + (moving ? Math.abs(Math.sin(t * 11)) * .04 : Math.sin(t * 2) * .012);
  if (u.wings) u.wings.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (.25 + Math.sin(t * 16) * .35); });
}
/* treats you can hold */
function mkTreat(ty, fc, bc) {
  const g = new THREE.Group(); bc = bc == null ? 0xe9b96a : bc; fc = fc == null ? bc : fc;
  if (ty === "cake") { cyl(.2, .2, .2, bc, 0, 0, 0, g); cyl(.21, .21, .07, fc, 0, .12, 0, g); sph(.04, 0xf0405a, 0, .19, 0, g); }
  else if (ty === "donut") { const a = torus(.13, .07, bc, 0, 0, 0, g); a.rotation.x = Math.PI / 2; const f = torus(.13, .06, fc, 0, .035, 0, g); f.rotation.x = Math.PI / 2; }
  else if (ty === "bread") sph(.16, bc, 0, 0, 0, g, 1.5, .8, .9);
  else if (ty === "croissant") { sph(.12, bc, 0, 0, 0, g, 1.8, .7, .8); sph(.08, bc, .17, 0, .06, g); sph(.08, bc, -.17, 0, .06, g); }
  else if (ty === "cookie" || ty === "pie" || ty === "brownie") { cyl(.2, .2, .06, bc, 0, 0, 0, g); cyl(.15, .15, .03, fc, 0, .04, 0, g); }
  else { cyl(.15, .11, .18, 0xff9fc6, 0, 0, 0, g); sph(.16, fc, 0, .13, 0, g, 1, .8, 1); sph(.04, 0xf0405a, 0, .27, 0, g); }
  return g;
}
function mkBox() { const g = new THREE.Group(); box(.4, .24, .4, 0xffc9de, 0, 0, 0, g); box(.42, .06, .1, 0xff5fa2, 0, .1, 0, g); box(.1, .06, .42, 0xff5fa2, 0, .1, 0, g); sph(.07, 0xff5fa2, 0, .17, 0, g); return g; }
function giveItem(ch, item) { const u = ch.userData; if (u.hold) { u.arms[0].remove(u.hold); u.hold = null; } if (!item) { u.arms[0].rotation.x = 0; return; } u.hold = item; item.position.set(0, -.5, .16); item.rotation.x = 1.3; u.arms[0].add(item); u.arms[0].rotation.x = -1.3; }

/* four-legged pets */
function mkPet(k) {
  const A = ANIMALS[k], g = new THREE.Group(), tall = k === "horse", by = tall ? .64 : .42, lh = tall ? .52 : .3;
  sph(.3, A.body, 0, by, 0, g, .9, .85, tall ? 1.55 : 1.4);
  const legs = [[-.16, .26], [.16, .26], [-.16, -.26], [.16, -.26]].map(p => { const l = new THREE.Group(); l.position.set(p[0], by - .12, p[1]); g.add(l); cyl(.07, .07, lh, A.limb, 0, -lh / 2, 0, l); return l; });
  if (tall) cyl(.13, .17, .5, A.body, 0, by + .28, .36, g).rotation.x = .6;
  const head = new THREE.Group(); head.position.set(0, by + (tall ? .52 : .24), tall ? .52 : .42); head.scale.setScalar(tall ? .6 : .66); g.add(head); sph(.42, A.body, 0, 0, 0, head);
  [-1, 1].forEach(d => sph(.06, k === "panda" ? 0xffffff : 0x2c2230, d * .15, .04, k === "panda" ? .42 : .385, head)); animalHead(k, head);
  let tail, wings = null;
  if (k === "bunny") tail = sph(.12, 0xffffff, 0, by + .08, -.42, g);
  else if (k === "panda") tail = sph(.1, A.dark, 0, by + .08, -.42, g);
  else if (k === "fox") { tail = sph(.17, A.body, 0, by + .16, -.56, g, .8, .8, 1.7); tail.rotation.x = .5; sph(.11, 0xffffff, 0, by + .32, -.8, g); }
  else if (k === "horse") tail = sph(.12, A.dark, 0, by - .1, -.5, g, .8, 2.4, .8);
  else if (k === "dragon") { tail = cone(.13, .6, A.body, 0, by, -.6, g, 8); tail.rotation.x = -1.7; sph(.22, A.dark, 0, by - .12, .05, g, .8, .5, 1.3); wings = [-1, 1].map(d => { const w = new THREE.Group(); w.position.set(d * .16, by + .2, -.05); g.add(w); const m = box(.56, .04, .44, 0x5fbf86, d * .3, 0, 0, w); m.rotation.y = d * .3; return w; }); [0, 1, 2].forEach(i => cone(.05, .14, A.dark, 0, by + .3 - i * .03, .05 - i * .2, g, 6)); }
  else { tail = cyl(.045, .045, .5, A.body, 0, by + .26, -.46, g); tail.rotation.x = k === "kitty" ? -.5 : -.9; }
  g.userData = { legs, tail, head, wings, seat: (by + .22) }; return g;
}
function animPet(g, moving, t) { const u = g.userData; u.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(t * 14 + (i % 3 ? 0 : 3.14)) * .6 : 0; }); u.tail.rotation.z = Math.sin(t * 9) * .4; if (u.wings) u.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (.2 + Math.sin(t * (moving ? 16 : 5)) * .45); }); }

/* ------------------------------ the forest ------------------------------ */
const OBS = [], ROOM_OBS = [];
function obs(list, x, z, w, d) { list.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 }); }
function pushOut(p, r, list) {
  for (const o of list) if (p.x > o.x0 - r && p.x < o.x1 + r && p.z > o.z0 - r && p.z < o.z1 + r) {
    const a = p.x - (o.x0 - r), b = (o.x1 + r) - p.x, c = p.z - (o.z0 - r), d = (o.z1 + r) - p.z, m = Math.min(a, b, c, d);
    if (m === a) p.x = o.x0 - r; else if (m === b) p.x = o.x1 + r; else if (m === c) p.z = o.z0 - r; else p.z = o.z1 + r; return true;
  }
  return false;
}
const TREE = { x: 0, z: -8 }, DOOR = { x: 0, z: -2.6 }, SLIDE = [{ x: 6, y: 8.5, z: -6 }, { x: 10, y: .5, z: 4.5 }];
const HOMES = [
  { id: "fairy", n: "Fairy Flower House", s: "Fairies", e: "🧚", x: -62, z: 38, who: [["Petal", "fairy"], ["Twinkle", "fairy"], ["Dewdrop", "fairy"]] },
  { id: "dragon", n: "Dragon Cave", s: "Dragons", e: "🐲", x: 78, z: -46, who: [["Ember", "dragon"], ["Zuzu", "dragon"]] },
  { id: "bunny", n: "Bunny Burrow", s: "Bunnies", e: "🐰", x: -80, z: -44, who: [["Hopper", "bunny"], ["Mochi", "bunny"], ["Rusty", "fox"]] },
  { id: "unicorn", n: "Unicorn Meadow", s: "Unicorns", e: "🦄", x: 60, z: 66, who: [["Starlight", "unicorn"], ["Snowdrop", "unicorn"]] },
  { id: "panda", n: "Panda Bamboo Grove", s: "Pandas", e: "🐼", x: 0, z: 96, who: [["Dumpling", "panda"], ["Bao", "panda"], ["Honey", "bear"]] },
  { id: "family", n: "Grandma's Cottage", s: "Grandma", e: "🏡", x: -8, z: -98, who: [["Grandma", "person"], ["Grandpa", "person"], ["Mom", "person"], ["Dad", "person"]] }];
const SPOTS = [
  { k: "berry", x: 18, z: 14 }, { k: "berry", x: -20, z: 16 }, { k: "berry", x: 36, z: -20 }, { k: "berry", x: -40, z: -16 }, { k: "berry", x: 8, z: 46 },
  { k: "moon", x: -30, z: 58 }, { k: "moon", x: 46, z: 28 }, { k: "moon", x: 24, z: -58 }, { k: "moon", x: -58, z: -6 },
  { k: "honey", x: -46, z: 14 }, { k: "honey", x: 44, z: -72 }, { k: "honey", x: 28, z: 62 },
  { k: "egg", x: -22, z: -50 }, { k: "egg", x: 62, z: 6 }, { k: "egg", x: -44, z: 80 },
  { k: "star", x: 104, z: 22 }, { k: "star", x: -108, z: 4 }, { k: "dew", x: 34, z: 112 }, { k: "dew", x: -62, z: -92 }];
let beam, SKY;
(function sky() {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#6a66d6"); gr.addColorStop(.4, "#a98ff0"); gr.addColorStop(.5, "#f3c2e6"); gr.addColorStop(.62, "#ffe2c9"); gr.addColorStop(1, "#ffe9c9"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  SKY = new THREE.Mesh(new THREE.SphereGeometry(520, 16, 12), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide, fog: false })); scene.add(SKY);
})();
(function treehouse() {
  const g = new THREE.Group(); g.position.set(TREE.x, 0, TREE.z); scene.add(g); obs(OBS, TREE.x, TREE.z, 6.4, 6.4);
  const bark = 0x9a6b4a, wood = 0xc98a5a;
  cyl(2.6, 3.4, 15, bark, 0, 7.5, 0, g);
  for (let i = 0; i < 6; i++) { const a = i * 1.047 + .5; cone(1.2, 2.6, bark, Math.cos(a) * 3.2, 1, Math.sin(a) * 3.2, g, 8); }
  box(1.8, 2.6, .3, 0x6b4226, 0, 1.3, 3.2, g); sph(.9, 0x6b4226, 0, 2.6, 3.2, g, 1, 1, .17); sph(.1, 0xffd84a, .55, 1.4, 3.42, g);
  for (let i = 0; i < 16; i++) { const a = i * .42 + 2.2, s = box(1.6, .16, .7, wood, Math.cos(a) * 3.6, .5 + i * .47, Math.sin(a) * 3.6, g); s.rotation.y = -a; }
  cyl(7.6, 7.2, .5, wood, 0, 8, 0, g);
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283; if (Math.abs(a - .32) < .3) continue; cyl(.09, .09, 1.1, 0xffffff, Math.cos(a) * 7.3, 8.8, Math.sin(a) * 7.3, g); }
  const rail = torus(7.3, .07, 0xffffff, 0, 9.35, 0, g, 5.6); rail.rotation.x = Math.PI / 2; rail.rotation.z = .66;
  /* the bakery cottage up top */
  cyl(3.9, 4.1, 3.6, 0xfff0d9, 0, 10.05, -.6, g); cone(5.2, 3.4, 0xff9a7a, 0, 13.55, -.6, g, 16); sph(.5, 0xfff0d9, 0, 15.3, -.6, g);
  box(1.3, 2.2, .2, 0x8a5a44, 0, 9.35, 3.42, g); sph(.65, 0x8a5a44, 0, 10.45, 3.42, g, 1, 1, .15);
  [-1, 1].forEach(d => sph(.62, 0xfff3a8, d * 2.3, 10.5, 2.58, g, 1, 1, .3, glow(0xffd84a, .7)));
  cyl(.35, .35, 1.7, 0xd98a6a, 2.2, 14, -1.8, g); sph(.5, 0xffffff, 2.4, 15.4, -1.8, g, 1, .8, 1, { transparent: true, opacity: .7 });
  const sg = label("🍑 Pocket Peaches", { h: 1.5, edge: "#ff9a7a" }); sg.position.set(0, 12.3, 4.4); g.add(sg);
  /* leaves and blossoms */
  cyl(.8, 1.3, 9, bark, -2.5, 16, -5, g).rotation.set(-.35, 0, .25); cyl(.7, 1.1, 9, bark, 3, 16, -5.5, g).rotation.set(-.4, 0, -.3);
  [[-6, 20, -6, 6, 0x6fc98a], [6, 20.5, -7, 5.6, 0x7fd69a], [0, 23, -8, 6.2, 0x62bf80], [-9, 17, -3, 3.6, 0x7fd69a], [9, 17, -3, 3.4, 0x6fc98a], [-4, 24.5, -4, 3, 0xffb7d5], [5, 25, -9, 3.2, 0xffc9e1], [0, 19, -12, 5, 0x7fd69a]].forEach(c => { sph(c[3], c[4], c[0], c[1], c[2], g).castShadow = false; });
  [[-7, 15.5, -1, 0xffb7d5], [7.5, 15, -1.5, 0xffc9e1], [-3, 18.4, -1.6, 0xffe27a]].forEach(c => sph(.7, c[3], c[0], c[1], c[2], g));
  /* lanterns under the deck */
  const LC = [0xffe27a, 0xff9fc6, 0x9fe6ff], LE = [0xffc83a, 0xff5fa2, 0x4fc8ff];
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + .3, x = Math.cos(a) * 6.7, z = Math.sin(a) * 6.7; cyl(.02, .02, 1.2, 0xffffff, x, 7.2, z, g).castShadow = false; sph(.3, LC[i % 3], x, 6.45, z, g, 1, 1.25, 1, glow(LE[i % 3])).castShadow = false; }
  /* the slide down */
  const a = new THREE.Vector3(6, 8.3, 2), b = new THREE.Vector3(10, .3, 12.5), len = a.distanceTo(b), sl = new THREE.Group(); sl.position.copy(a).add(b).multiplyScalar(.5); g.add(sl); sl.lookAt(b.clone().add(g.position));
  box(1.6, .14, len, 0xff9fc6, 0, 0, 0, sl); [-1, 1].forEach(d => box(.14, .5, len, 0xffffff, d * .8, .22, 0, sl));
  cyl(.14, .14, 4, 0xffffff, 8, 2, 7.2, g); flat(3, 3, 0xffe9b8, 10, .04, 13.6, g);
  /* the little tree next door and the rope bridge */
  cyl(1.3, 1.7, 12, bark, -14, 6, -4, g); cyl(3.4, 3.2, .4, wood, -14, 7, -4, g); obs(OBS, TREE.x - 14, TREE.z - 4, 3.2, 3.2);
  cyl(1.5, 1.6, 1.8, 0xffe3ef, -14, 8.1, -4.4, g); cone(2.1, 1.6, 0xb99bff, -14, 9.8, -4.4, g, 12); sph(.3, 0xfff3a8, -14, 8.2, -2.85, g, 1, 1, .3, glow(0xffd84a, .7));
  [[-14, 13.5, -4, 4.4, 0x7fd69a], [-16, 15.5, -6, 3.2, 0xffb7d5], [-12, 15, -2.5, 3, 0x6fc98a]].forEach(c => { sph(c[3], c[4], c[0], c[1], c[2], g).castShadow = false; });
  for (let i = 0; i <= 8; i++) { const u = i / 8, x = lerp(-7.2, -11, u), z = lerp(-1.4, -3.2, u), y = lerp(8.2, 7.2, u) - Math.sin(u * Math.PI) * .5; box(.42, .1, 1.5, wood, x, y, z, g).rotation.y = Math.atan2(1.8, -3.8); if (i % 2 === 0) [-1, 1].forEach(d => cyl(.03, .03, 1, 0xffffff, x + d * .32, y + .5, z + d * .68, g).castShadow = false); }
  mkRing(DOOR.x, DOOR.z, 0xff7fb0, 1.5); const dl = label("🧚 Up to the bakery", { h: .9, top: 1 }); dl.position.set(DOOR.x, 3.7, DOOR.z); scene.add(dl);
})();
function mkHome(h, i) {
  const g = new THREE.Group(), a = Math.atan2(-h.x, -h.z); g.position.set(h.x, 0, h.z); g.rotation.y = a; scene.add(g); obs(OBS, h.x, h.z, 9, 9);
  h.rx = h.x + Math.sin(a) * 8.6; h.rz = h.z + Math.cos(a) * 8.6; h.ring = mkRing(h.rx, h.rz, 0xffd84a, 1.6);
  const win = (x, y, z, r) => sph(r || .45, 0xfff3a8, x, y, z, g, 1, 1, .3, glow(0xffd84a, .7));
  if (h.id === "fairy") {
    sph(3.4, 0xff9fc6, 0, 3.6, 0, g, 1, 1.15, 1); for (let j = 0; j < 6; j++) { const q = j * 1.047, p = cone(1.3, 2.6, 0xffb7d5, Math.cos(q) * 1.9, 7.2, Math.sin(q) * 1.9, g, 8); p.rotation.set(Math.sin(q) * .5, 0, -Math.cos(q) * .5); }
    sph(.9, 0xffe27a, 0, 7.3, 0, g, 1, .6, 1, glow(0xffc83a, .5)); sph(.85, 0x8a5a44, 0, 1.3, 2.95, g, 1, 1.5, .2); sph(.08, 0xffd84a, .4, 1.3, 3.15, g); win(-1.7, 4.2, 2.75); win(1.7, 4.2, 2.75);
    [-1, 1].forEach(d => { sph(2.4, 0x79cc86, d * 4, .3, .5, g, 1, .25, .6).rotation.y = d * .5; });
  }
  if (h.id === "dragon") {
    sph(6, 0x9a94a6, 0, 0, 0, g, 1, .85, 1); sph(2.6, 0x2c2230, 0, .6, 4.5, g, 1, 1, .6); sph(.9, 0xff9a3d, 0, .9, 3.9, g, 1, 1, 1, glow(0xff7a1a));
    [[-5, 2.2], [5.4, 1.6], [-3.4, 5.2], [4, 5]].forEach(p => sph(1.2 + Math.abs(p[0]) * .12, 0x8a8496, p[0], .4, p[1], g, 1, .8, 1)); for (let j = 0; j < 9; j++) sph(.22, 0xffd84a, 3.4 + (j % 3) * .34, .2 + Math.floor(j / 3) * .22, 6 + (j % 2) * .3, g, 1, .6, 1);
    [-1, 1].forEach(d => cone(.4, 1.4, 0xfff3e0, d * 1.5, 2.6, 4.9, g, 8).rotation.x = Math.PI);
  }
  if (h.id === "bunny") {
    sph(6, 0x79cc86, 0, 0, 0, g, 1, .7, 1); cyl(1.5, 1.5, .3, 0xc98a5a, 0, 1.5, 5.45, g).rotation.x = Math.PI / 2; sph(.12, 0xffd84a, .9, 1.5, 5.65, g); win(2.9, 2.5, 4.3, .6); win(-2.9, 2.5, 4.3, .6);
    cyl(.4, .4, 1.4, 0xd98a6a, -1.5, 4.4, 0, g); for (let j = 0; j < 6; j++) { const x = -5 + j * 2, z = 7.2 + (j % 2) * .8; if (Math.abs(x) < 2) continue; cone(.22, .6, 0xff8a3c, x, .2, z, g, 8).rotation.x = Math.PI; sph(.2, 0x5fb873, x, .62, z, g, 1, 1.4, 1); }
  }
  if (h.id === "unicorn") {
    [0xff6b8b, 0xffb347, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff].forEach((c, j) => torus(5.2 - j * .42, .22, c, 0, 0, 2, g, Math.PI, glow(c, .25)));
    [-1, 1].forEach(d => { sph(1.3, 0xffffff, d * 4.2, .6, 2, g); sph(1, 0xffffff, d * 5.2, .5, 2.6, g); sph(.9, 0xffffff, d * 3.4, .5, 2.8, g); });
    cyl(3, 3, .3, 0xffffff, 0, .15, -1.5, g); [[-2.2, -3], [2.2, -3], [-2.2, 0], [2.2, 0]].forEach(p => cyl(.14, .14, 3.6, 0xffe3f3, p[0], 1.9, p[1], g)); cone(3.8, 2, 0xff9fd0, 0, 4.7, -1.5, g, 12); sph(.4, 0xffd25c, 0, 5.9, -1.5, g, 1, 1, 1, glow(0xffc83a, .5));
  }
  if (h.id === "panda") {
    cyl(3, 3.2, 3, 0xe9dcb8, 0, 1.5, 0, g); cone(4.2, 2.4, 0x6fbf73, 0, 4.2, 0, g, 14); box(1.3, 2.2, .2, 0x4a3528, 0, 1.1, 3.12, g); win(-1.7, 2, 2.6, .5); win(1.7, 2, 2.6, .5);
    for (let j = 0; j < 16; j++) { const q = 1.2 + j * .26, r = 4.2 + (j % 3) * .5, x = Math.cos(q) * r * (j % 2 ? 1 : -1), z = -Math.abs(Math.sin(q) * r) + (j % 4) * .6 - .5, hh = 5.5 + (j % 4) * 1.1; cyl(.15, .17, hh, 0x8fd06a, x, hh / 2, z, g); sph(.6, 0x6fbf73, x + .2, hh, z, g, 1.2, .5, .8); }
  }
  if (h.id === "family") {
    box(8, 4, 7, 0xfff0d9, 0, 2, 0, g); cone(6.8, 3, 0xe86a5a, 0, 5.5, 0, g, 4).rotation.y = Math.PI / 4; box(1.5, 2.6, .2, 0x7a5aa8, 0, 1.3, 3.55, g); sph(.09, 0xffd84a, .5, 1.3, 3.7, g);
    [-2.6, 2.6].forEach(x => { win(x, 2.5, 3.5, .6); box(1.6, .3, .4, 0xc98a5a, x, 1.6, 3.7, g); [-.4, 0, .4].forEach((q, j) => sph(.18, [0xff8fc0, 0xffe27a, 0xb99bff][j], x + q, 1.9, 3.7, g)); }); box(.8, 1.8, .8, 0xd98a6a, 2.2, 6, -1, g);
    for (let j = 0; j < 9; j++) { const x = -5.4 + j * 1.35; if (Math.abs(x) < 1.6) continue; box(.14, .9, .14, 0xffffff, x, .45, 6, g); } box(3.4, .1, .1, 0xffffff, -3.6, .7, 6, g); box(3.4, .1, .1, 0xffffff, 3.6, .7, 6, g);
  }
  const l = label(h.e + " " + h.n, { h: 1.2, top: 1 }); l.position.set(h.x, 9.6, h.z); scene.add(l);
  /* the path and its lanterns */
  const dx = h.rx - 2, dz = h.rz - 3, len = Math.hypot(dx, dz), p = flat(3.2, len, 0xf3dfb8, 2 + dx / 2, .03 + i * .004, 3 + dz / 2); p.rotation.z = Math.atan2(dx, dz);
  [.3, .55, .8].forEach((u, j) => { const s = j % 2 ? 1 : -1, x = 2 + dx * u + dz / len * 2.6 * s, z = 3 + dz * u - dx / len * 2.6 * s; cyl(.08, .1, 2.2, 0x8a5a44, x, 1.1, z); sph(.3, 0xfff3a8, x, 2.4, z, scene, 1, 1.2, 1, glow(0xffc83a)).castShadow = false; });
}
function mkSpot(s) {
  const g = new THREE.Group(), f = new THREE.Group(), k = s.k; g.position.set(s.x, 0, s.z); scene.add(g); g.add(f); s.m = g; s.f = f; s.ready = 1; s.t = 0; let ly = 2.9;
  if (k === "berry" || k === "moon") {
    const c = k === "berry" ? [0x5fb873, 0x6fc98a] : [0x3f9a8a, 0x4fb0a0]; sph(1.1, c[0], 0, .8, 0, g); sph(.8, c[1], .75, .7, .3, g); sph(.75, c[0], -.7, .65, -.2, g);
    for (let i = 0; i < 9; i++) { const a = i * .7, r = .85 + (i % 2) * .2; sph(k === "berry" ? .15 : .17, k === "berry" ? 0xf0405a : 0x6f8bff, Math.cos(a) * r, .75 + (i % 3) * .32, Math.sin(a) * r, f, 1, 1, 1, k === "moon" ? glow(0x4f6bff) : null); }
  }
  if (k === "honey") { cyl(.7, .85, 1.1, 0x9a6b4a, 0, .55, 0, g); cyl(.72, .72, .06, 0xd9b88a, 0, 1.12, 0, g); [0, 1, 2].forEach(i => sph(.62 - i * .12, 0xffc34a, 0, 1.5 + i * .34, 0, g, 1, .5, 1)); sph(.14, 0x4a3528, 0, 1.6, .56, g); [[.5, 1.25], [-.45, 1.05], [.1, .95]].forEach(p => sph(.14, 0xffd84a, p[0], p[1], .6, f, 1, 1.5, 1, glow(0xffb300))); ly = 3.5; }
  if (k === "egg") { const n = torus(.7, .24, 0xb98a5a, 0, .24, 0, g); n.rotation.x = Math.PI / 2; cyl(.6, .6, .12, 0xd9b88a, 0, .14, 0, g); [[-.22, .1], [.24, .05], [0, -.22]].forEach(p => sph(.2, 0xffd84a, p[0], .42, p[1], f, 1, 1.3, 1, glow(0xc98a00, .5))); ly = 2.2; }
  if (k === "star") { sph(.9, 0x9a94a6, 0, .2, 0, g, 1, .4, 1); [[0, 0, 1.3], [.5, .2, .8], [-.5, -.15, .9], [.1, -.5, .7]].forEach(p => { const m = add(new THREE.OctahedronGeometry(.34), 0xfffbe0, p[0], p[2] * .9 + .3, p[1], f, glow(0xffe27a, .9)); m.scale.set(1, 1 + p[2], 1); }); ly = 3.4; }
  if (k === "dew") { cyl(.1, .13, 1.5, 0x5fb873, 0, .75, 0, g); [0xff6b8b, 0xffb347, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff].forEach((c, i) => { const a = i * 1.047; sph(.5, c, Math.cos(a) * .55, 1.6, Math.sin(a) * .55, g, 1, .25, .7).rotation.y = -a; }); sph(.32, 0xdff6ff, 0, 1.8, 0, f, 1, 1, 1, Object.assign({ transparent: true, opacity: .85 }, glow(0x8fd8ff, .9))); ly = 3.4; }
  s.lab = label(ING[k].e, { h: .95, top: 1, bg: "rgba(255,255,255,.88)" }); s.lab.position.y = ly; s.ly = ly; g.add(s.lab);
}
const FLY = (function forest() {
  flat(600, 600, 0x70c98c, 0, 0, 0); cyl(11, 11, .04, 0xf3dfb8, 2, .02, 3).castShadow = false;
  HOMES.forEach(mkHome); SPOTS.forEach(mkSpot);
  beam = cyl(1.3, 1.3, 40, 0xffe27a, 0, 20, 0, scene, { transparent: true, opacity: .35, emissive: 0xffd84a }); beam.castShadow = false; beam.visible = false;
  /* pond */
  cyl(9, 9, .08, 0x7fd0ff, 30, .04, -34, scene, { transparent: true, opacity: .85 }).castShadow = false; [[27, -32], [33, -37], [31, -30]].forEach(p => { cyl(.9, .9, .05, 0x5fb873, p[0], .1, p[1]); sph(.22, 0xff9fc6, p[0], .22, p[1]); });
  let seed = 11; const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const nearPath = (x, z) => HOMES.some(h => { const ax = 2, az = 3, bx = h.rx - ax, bz = h.rz - az, u = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1); return Math.hypot(x - ax - bx * u, z - az - bz * u) < 4.2; });
  const free = (x, z, r) => Math.hypot(x - 2, z - 1) > 17 + r && Math.hypot(x - 30, z + 34) > 10 + r && !nearPath(x, z) && !HOMES.some(h => Math.hypot(x - h.x, z - h.z) < 13 + r) && !SPOTS.some(s => Math.hypot(x - s.x, z - s.z) < 4 + r);
  const TC = [0x6fc98a, 0x62bf80, 0x7fd69a, 0xffb7d5, 0xc9a6f0, 0x8fe0c8];
  for (let i = 0; i < 170; i++) { const x = R() * 300 - 150, z = R() * 300 - 150; if (!free(x, z, 0)) continue; const s = 1 + R() * 1.2, c = TC[Math.floor(R() * TC.length)]; cyl(.28 * s, .4 * s, 3 * s, 0x9a6b4a, x, 1.5 * s, z); sph(1.8 * s, c, x, 4 * s, z); sph(1.25 * s, c, x + .8 * s, 5.2 * s, z + .3 * s); }
  const MC = [0xff6b8b, 0xff9fd0, 0xb98bff, 0x6fb8ff, 0xffb347];
  for (let i = 0; i < 46; i++) { const x = R() * 260 - 130, z = R() * 260 - 130; if (!free(x, z, -1)) continue; const s = .5 + R() * 1.3, c = MC[Math.floor(R() * MC.length)]; cyl(.32 * s, .45 * s, 1.8 * s, 0xfff3e0, x, .9 * s, z); sph(1.3 * s, c, x, 1.8 * s, z, scene, 1, .55, 1, glow(c, .35)); [[.5, .3], [-.5, .1], [0, -.55], [.1, .6]].forEach(p => sph(.16 * s, 0xffffff, x + p[0] * s, 2.36 * s - Math.hypot(p[0], p[1]) * .3 * s, z + p[1] * s)); }
  for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.position.set(R() * 400 - 200, 60 + R() * 25, R() * 400 - 200); scene.add(g); for (let j = 0; j < 4; j++) { const m = sph(5 + R() * 4, 0xfff0fa, j * 6 - 9, R() * 2, R() * 3, g, 1.3, .7, 1); m.castShadow = false; } }
  /* fireflies */
  const n = 170, p = new Float32Array(n * 3), base = []; for (let i = 0; i < n; i++) base.push([R() * 240 - 120, 1 + R() * 6, R() * 240 - 120, R() * 6.28]);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff7a8, size: .42, transparent: true, opacity: .95, depthWrite: false })));
  return { n, p, base, geo };
})();
function tickFlies(t) { for (let i = 0; i < FLY.n; i++) { const b = FLY.base[i]; FLY.p[i * 3] = b[0] + Math.sin(t * .6 + b[3]) * 1.6; FLY.p[i * 3 + 1] = b[1] + Math.sin(t * .9 + b[3] * 2) * .8; FLY.p[i * 3 + 2] = b[2] + Math.cos(t * .5 + b[3]) * 1.6; } FLY.geo.attributes.position.needsUpdate = true; }

/* ------------------------------ the bakery room ------------------------------ */
const IZ = -400;
const ROOMS = [{ n: "Cozy nook", W: 12, D: 11, q: 3, cost: 0 }, { n: "Treehouse bakery", W: 18, D: 14, q: 4, cost: 200 }, { n: "Grand fairy bakery", W: 26, D: 17, q: 6, cost: 500 }];
const OVENS = [{ n: "Stone oven", e: "🪨", cost: 0, z: .14, spd: 1 }, { n: "Sparkle oven", e: "💖", cost: 150, z: .2, spd: 1.25 }, { n: "Rainbow oven", e: "🌈", cost: 350, z: .28, spd: 1.5 }];
const room = new THREE.Group(); room.position.z = IZ; scene.add(room);
const decorG = new THREE.Group(); decorG.position.z = IZ; scene.add(decorG);
const RM = { W: 12, D: 11, cz: 0, cw: 6, lab: { x: 0, z: 0 }, book: { x: 0, z: 0 }, door: { x: 0, z: 0 } };   /* local coordinates, filled by buildRoom */
function mkOven(lv, p, x, z) {
  if (lv === 0) { sph(1.5, 0x9a94a6, x, 1.1, z, p, 1, 1.05, .8); sph(.75, 0x2c2230, x, 1.05, z + .92, p, 1, .8, .4); sph(.4, 0xff9a3d, x, .9, z + 1, p, 1, .6, .4, glow(0xff7a1a)); cyl(.3, .36, 1.6, 0x8a8496, x + .6, 3, z - .2, p); }
  else {
    const C = lv === 1 ? [0xff9fc6] : [0xff6b8b, 0xffb347, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff], hh = 2.7 / C.length; C.forEach((c, i) => box(2.8, hh, 1.4, c, x, hh / 2 + i * hh, z, p));
    box(1.7, 1, .1, 0x2c1c16, x, 1.5, z + .72, p); box(1.5, .8, .1, 0xff9a3d, x, 1.5, z + .74, p, Object.assign({ transparent: true, opacity: .55 }, glow(0xff7a1a))); box(2.9, .14, 1.5, 0xffd84a, x, 2.75, z, p);
    [-.8, 0, .8].forEach(q => sph(.12, 0xffffff, x + q, 2.4, z + .74, p)); const s = add(new THREE.OctahedronGeometry(.36), 0xffe27a, x, 3.3, z, p, glow(0xffc83a)); s.scale.set(1, 1.3, .5);
  }
}
function buildRoom(S) {
  clearGroup(room); ROOM_OBS.length = 0;
  const R = ROOMS[S.lvl], W = R.W, D = R.D, cz = -D / 2 + 4; RM.W = W; RM.D = D; RM.cz = cz;
  flat(W + 60, D + 60, 0x3a2a4a, 0, -.05, 0, room).receiveShadow = false; flat(W, D, S.floor, 0, 0, 0, room);
  const lineM = mat(0x4a2c1a, { transparent: true, opacity: .16 }); for (let z = -D / 2 + 1; z < D / 2; z += 1) flat(W, .06, lineM, 0, .01, z, room);
  box(W, 6, .4, S.wall, 0, 3, -D / 2 - .2, room); [-1, 1].forEach(d => box(.4, 6, D, S.wall, d * (W / 2 + .2), 3, 0, room));
  box(W, .6, .45, 0x9a6b4a, 0, .3, -D / 2 - .15, room); box(W + .8, .35, .5, 0x9a6b4a, 0, 5.85, -D / 2 - .15, room);
  [-1, 1].forEach(d => { const x = d * (W / 2 - 2.2), z = -D / 2 + .03; cyl(1.05, 1.05, .1, 0x9a6b4a, x, 4.1, z, room).rotation.x = Math.PI / 2; cyl(.88, .88, .12, 0xbfe6ff, x, 4.1, z + .02, room).rotation.x = Math.PI / 2; sph(.42, 0x6fc98a, x - .3, 3.8, z + .08, room, 1, 1, .2); sph(.3, 0xffb7d5, x + .35, 4.4, z + .08, room, 1, 1, .2); });
  const LC = [0xffe27a, 0xff9fc6, 0x9fe6ff, 0xb9f0a8, 0xc9a6ff];
  for (let i = 0, n = Math.floor(W / 1.1); i <= n; i++) sph(.13, LC[i % 5], -W / 2 + .6 + i * (W - 1.2) / n, 5.45 - Math.pow(Math.sin(i / n * Math.PI * 3), 2) * .3, -D / 2 + .1, room, 1, 1, 1, glow(LC[i % 5])).castShadow = false;
  /* counter, display case and till */
  const cw = Math.min(W - 4.5, 12); RM.cw = cw;
  box(cw, 1.15, 1.3, 0xc98a5a, 0, .575, cz, room); box(cw + .2, .14, 1.5, 0xffc9a8, 0, 1.2, cz, room); obs(ROOM_OBS, 0, IZ + cz, cw, 1.3);
  const dx = cw / 2 - 1.3; box(2.1, .7, 1, 0xdff3ff, dx, 1.62, cz, room, { transparent: true, opacity: .32 }).castShadow = false;
  ["cupcake", "donut", "cake"].forEach((t, i) => { const m = mkTreat(t, [0xff8fc0, 0xb48cff, 0xfffaf2][i]); m.position.set(dx - .62 + i * .62, 1.42, cz); m.scale.setScalar(1.35); room.add(m); });
  box(.7, .45, .55, 0xff9a7a, -cw / 2 + .7, 1.5, cz, room); box(.5, .3, .05, 0x2c2c34, -cw / 2 + .7, 1.85, cz + .1, room).rotation.x = -.3;
  /* the oven and the shelves along the back wall */
  mkOven(S.oven, room, 0, -D / 2 + .9); obs(ROOM_OBS, 0, IZ - D / 2 + .9, 3, 1.6);
  const sw = W / 2 - 2.6, JC = [0xffc34a, 0xff9fc0, 0xb79be0, 0xa6d48c, 0x8fd0ff, 0xf0405a];
  [-1, 1].forEach(d => { const sx = d * (1.9 + sw / 2); box(sw, .16, .8, 0x9a6b4a, sx, 1.9, -D / 2 + .5, room); for (let i = 0, x = sx - sw / 2 + .5; x < sx + sw / 2 - .3; x += 1.05, i++) { if (i % 3 === 0) sph(.3, 0xe9b96a, x, 2.2, -D / 2 + .5, room, 1.4, .8, .9); else if (i % 3 === 1) { cyl(.26, .26, .6, JC[i % 6], x, 2.28, -D / 2 + .5, room); cyl(.28, .28, .08, 0xffffff, x, 2.62, -D / 2 + .5, room); } else { const m = mkTreat("cake", JC[(i + 2) % 6]); m.position.set(x, 2.1, -D / 2 + .5); m.scale.setScalar(1.6); room.add(m); } } });
  const mb = label("🍑 Pocket Peaches 🍑", { h: 1, bg: "#4a2c2a", fg: "#fff", edge: "#ffb38a" }); mb.position.set(0, 4.9, -D / 2 + .15); room.add(mb);
  /* magic table on the left */
  const lx = -W / 2 + 1.3, lz = cz + 3.4; RM.lab = { x: lx + 1.3, z: lz }; cyl(.75, .5, .85, 0x5a4a8a, lx, .62, lz, room); torus(.75, .08, 0x4a3a7a, lx, 1.05, lz, room).rotation.x = Math.PI / 2; cyl(.66, .66, .06, 0xb98bff, lx, 1.03, lz, room, glow(0x9a5bff));
  [[.2, 1.4, .1, 0xff9fd0], [-.25, 1.75, -.1, 0x9fe6ff], [.05, 2.15, .2, 0xffe27a]].forEach(b => sph(.13, b[3], lx + b[0], b[1], lz + b[2], room, 1, 1, 1, glow(b[3])).castShadow = false); [-1, 1].forEach(d => cyl(.07, .07, .3, 0x3a2a5a, lx + d * .4, .15, lz + .3, room)); obs(ROOM_OBS, lx, IZ + lz, 1.4, 1.4);
  const ll = label("✨ Invent a magic treat", { h: .55, top: 1 }); ll.position.set(lx + .9, 3.1, lz); room.add(ll); mkRing(RM.lab.x, RM.lab.z, 0x9a6bff, .9, room);
  /* recipe book on the right */
  const bx = W / 2 - 1.2, bz = cz + 3.4; RM.book = { x: bx - 1.1, z: bz }; cyl(.12, .3, 1.1, 0xc98a5a, bx, .55, bz, room); box(.9, .1, .7, 0xff7fb0, bx, 1.18, bz, room).rotation.z = .3; obs(ROOM_OBS, bx, IZ + bz, .8, .8);
  const bl = label("📖 Recipes", { h: .5, top: 1 }); bl.position.set(bx - .4, 2.6, bz); room.add(bl); mkRing(RM.book.x, RM.book.z, 0xffb347, .8, room);
  /* the slide back down */
  RM.door = { x: 0, z: D / 2 - 1.1 }; cyl(1.25, 1.25, .06, 0xff9fc6, 0, .03, D / 2 - 1.1, room); cyl(.85, .85, .07, 0x3a2a4a, 0, .04, D / 2 - 1.1, room); mkRing(0, D / 2 - 1.1, 0xff5fa2, 1.3, room);
  const dl = label("🛝 Slide down to the forest", { h: .55, top: 1 }); dl.position.set(0, 2.2, D / 2 - .6); room.add(dl);
  [-1, 1].forEach(d => { cyl(.3, .22, .5, 0xffffff, d * 2.6, .25, D / 2 - .8, room); sph(.5, 0x79cc86, d * 2.6, .9, D / 2 - .8, room); sph(.35, 0xffb7d5, d * 2.6 + .2, 1.4, D / 2 - .8, room); });
}
const DECOR = {
  table: { n: "Mushroom table", e: "🍄", cost: 30, say: "customers sit here", mk: g => { cyl(.3, .4, .8, 0xfff3e0, 0, .4, 0, g); sph(.85, 0xff6b8b, 0, .8, 0, g, 1, .35, 1); [[.4, .2], [-.3, .35], [0, -.45]].forEach(p => sph(.11, 0xffffff, p[0], 1.03, p[1], g, 1, .5, 1)); [-1, 1].forEach(d => { cyl(.16, .2, .4, 0xfff3e0, d * 1.15, .2, 0, g); sph(.34, 0xffb347, d * 1.15, .42, 0, g, 1, .4, 1); }); } },
  flowers: { n: "Flower pot", e: "🌷", cost: 15, mk: g => { cyl(.32, .24, .5, 0xd98a6a, 0, .25, 0, g); sph(.42, 0x79cc86, 0, .8, 0, g); [[0, 1.3, 0, 0xff8fc0], [.3, 1.1, .1, 0xffe27a], [-.3, 1.05, -.1, 0xb99bff]].forEach(f => sph(.2, f[3], f[0], f[1], f[2], g)); } },
  lantern: { n: "Fairy lantern", e: "🏮", cost: 20, mk: g => { cyl(.3, .36, .1, 0x8a5a44, 0, .05, 0, g); cyl(.05, .05, 2, 0x8a5a44, 0, 1, 0, g); sph(.36, 0xfff3a8, 0, 2.2, 0, g, 1, 1.25, 1, glow(0xffd84a)); cone(.3, .25, 0x8a5a44, 0, 2.75, 0, g, 8); } },
  rug: { n: "Rainbow rug", e: "🌈", cost: 25, mk: g => { [0xff6b8b, 0xffb347, 0xffe66d, 0x6fdc8c, 0x6fb8ff, 0xb98bff].forEach((c, i) => { cyl(1.8 - i * .28, 1.8 - i * .28, .03, c, 0, .02 + i * .006, 0, g).castShadow = false; }); } },
  stool: { n: "Acorn chair", e: "🌰", cost: 20, mk: g => { sph(.6, 0xc98a5a, 0, .45, 0, g, 1, .75, 1); sph(.63, 0x8a5a34, 0, .72, -.25, g, 1, .7, .55); cyl(.05, .05, .2, 0x6b4226, 0, 1.2, -.3, g); } },
  arch: { n: "Fairy light arch", e: "✨", cost: 45, mk: g => { torus(1.4, .07, 0x79cc86, 0, 0, 0, g, Math.PI); for (let i = 0; i < 9; i++) { const a = (i + .5) / 9 * Math.PI, c = [0xffe27a, 0xff9fc6, 0x9fe6ff][i % 3]; sph(.13, c, Math.cos(a) * 1.4, Math.sin(a) * 1.4, .08, g, 1, 1, 1, glow(c)).castShadow = false; } } },
  peach: { n: "Peach tree", e: "🍑", cost: 50, mk: g => { cyl(.34, .28, .5, 0xffffff, 0, .25, 0, g); cyl(.1, .13, 1.5, 0x9a6b4a, 0, 1.2, 0, g); sph(.8, 0x6fc98a, 0, 2.3, 0, g); [[.5, 2.1, .5], [-.55, 2.4, .35], [.1, 2.8, .55], [-.2, 1.9, .65], [.6, 2.6, -.2]].forEach(p => sph(.17, 0xffa878, p[0], p[1], p[2], g)); } },
  cupcake: { n: "Giant cupcake", e: "🧁", cost: 60, mk: g => { cyl(.6, .45, .8, 0xff9fc6, 0, .4, 0, g); sph(.68, 0xfffaf2, 0, .95, 0, g, 1, .6, 1); sph(.5, 0xfffaf2, 0, 1.3, 0, g, 1, .6, 1); sph(.3, 0xfffaf2, 0, 1.58, 0, g, 1, .7, 1); sph(.16, 0xf0405a, 0, 1.86, 0, g); [-1, 1].forEach(d => sph(.06, 0x2c2230, d * .2, .5, .5, g)); } },
  fountain: { n: "Chocolate fountain", e: "🍫", cost: 70, mk: g => { [[.8, .2], [.55, .75], [.32, 1.3]].forEach(t => { cyl(t[0], t[0] * .85, .14, 0xffffff, 0, t[1], 0, g); cyl(t[0] * .9, t[0] * .9, .1, 0x6b3f24, 0, t[1] + .1, 0, g); }); cyl(.1, .1, 1.5, 0x6b3f24, 0, .8, 0, g); sph(.16, 0x6b3f24, 0, 1.6, 0, g); } }
};
function mkDecor(k) { const g = new THREE.Group(); DECOR[k].mk(g); return g; }
function buildDecor(S) { clearGroup(decorG); S.decor.forEach(d => { const g = mkDecor(d.k); g.position.set(d.x, 0, d.z); g.rotation.y = d.r || 0; decorG.add(g); }); }
