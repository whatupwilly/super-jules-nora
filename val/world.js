"use strict";
/* ===========================================================================
   Val Training Academy, by Jules.  Part 1 of 3: the world.
   State and saving, the renderer, sky, light, seasons, ground, trees and
   the farm buildings. creatures.js builds people and animals; game.js plays.
   =========================================================================== */
const $ = id => document.getElementById(id);
const SAVE_KEY = Arcade.key("valSave");
const TAU = Math.PI * 2;
const rnd = (a, b) => b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function srand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hashStr(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* ------------------------------ saved game ------------------------------ */
function freshState() {
  return { v: 1, made: false, bought: false, name: "", look: { skin: 0, hair: 0, hairC: 0, top: 0, bot: 0, botT: 0, hat: 0 },
    money: 500, day: 1, time: .32, season: 0, sT: 0, animals: [], plots: [], inv: {}, nextId: 1, lastSeed: "carrot",
    stallDay: 0, wishDay: 0, starDay: 0, starGot: [], texts: [], tractor: { x: -8, z: -20, h: 0 }, follow: 0, px: 0, pz: 40 };
}
let S = freshState();
let save = function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
(function load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (d && d.v === 1) S = Object.assign(freshState(), d); } catch (e) {} })();

/* ------------------------------ little UI helpers ------------------------------ */
let toastT = 0;
function toast(text, ms) { const t = $("toast"); t.textContent = text; t.hidden = false; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => { t.style.opacity = 0; setTimeout(() => t.hidden = true, 300); }, ms || 2600); }
function pop(text) { const p = $("pop"); p.textContent = text; p.classList.remove("show"); void p.offsetWidth; p.classList.add("show"); }

let AC = null;
function audio() { if (AC) { if (AC.state === "suspended") AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
function tone(f, d, type, vol, slide, when) {
  if (!AC) return; const t = AC.currentTime + (when || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .12, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .05);
}
const SFX = {
  tap: () => tone(520, .08, "triangle", .08),
  coin: () => { tone(880, .1, "square", .05); tone(1320, .18, "square", .05, 0, .08); },
  good: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, "triangle", .1, 0, i * .09)),
  magic: () => [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .3, "sine", .08, 0, i * .06)),
  plop: () => tone(300, .15, "sine", .12, 120),
  water: () => { tone(700, .25, "sine", .06, 300); tone(900, .2, "sine", .05, 400, .1); },
  no: () => tone(200, .2, "sawtooth", .05, 150),
  jump: () => tone(300, .22, "triangle", .08, 700)
};

/* ------------------------------ renderer and scene ------------------------------ */
const cv = $("game");
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd5ecff, 70, 300);
const camera = new THREE.PerspectiveCamera(55, 1, .3, 900);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
window.addEventListener("resize", resize); resize();

const hemi = new THREE.HemisphereLight(0xdff1ff, 0x7fae6a, .7); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3da, 1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 10; sun.shadow.camera.far = 220;
sun.shadow.camera.left = -55; sun.shadow.camera.right = 55; sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55; sun.shadow.bias = -.0006; sun.shadow.normalBias = .04;
scene.add(sun); scene.add(sun.target);

/* shared geometry and tiny builders */
const G = {
  sph: new THREE.SphereGeometry(1, 22, 16), sphLo: new THREE.SphereGeometry(1, 10, 8), box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 16), cone: new THREE.ConeGeometry(1, 1, 14), prism: new THREE.CylinderGeometry(1, 1, 1, 3),
  ico: new THREE.IcosahedronGeometry(1, 1), tor: new THREE.TorusGeometry(1, .12, 8, 20), half: new THREE.SphereGeometry(1, 22, 12, 0, TAU, 0, Math.PI / 2)
};
const matCache = {};
function M(color, o) { const k = color + (o ? JSON.stringify(o) : ""); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .78, metalness: 0 }, o || {}))); }
function Mu(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .78, metalness: 0 }, o || {})); }
function add(par, geo, mat, x, y, z, sx, sy, sz) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.scale.set(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz); m.castShadow = true; m.receiveShadow = true; par.add(m); return m; }
function grp(par, x, y, z) { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (par) par.add(g); return g; }

/* ------------------------------ the map ------------------------------ */
const POND = { x: -50, z: 34, r: 11 };
const ARENA = { x: 44, z: 33, r: 11 };
const PADDOCK = { x0: 6, x1: 46, z0: -18, z1: 14 };
const HOUSE = { x: -24, z: -30 }, BARN = { x: 26, z: -36 }, COOP = { x: 42, z: -14 }, STAND = { x: -7, z: 34 }, GATE = { x: 0, z: 46 };
const PATHS = [[0, 100, 0, 22], [0, 22, -22, -20], [0, 22, 26, -27], [0, 34, -5, 34], [0, 20, 70, 17], [-16, 6, 0, 16]];
function trailZ(x) { return 17 + 24 * Math.sin((x - 70) * .05); }
function segDist(px, pz, a) { const dx = a[2] - a[0], dz = a[3] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); }
function pathDist(x, z) { let d = 99; for (const p of PATHS) d = Math.min(d, segDist(x, z, p)); if (x > 68 && x < 152) d = Math.min(d, Math.abs(z - trailZ(x)) * .9); return d; }
function hgt(x, z) {
  if (z < -300) return 0;   /* inside the farmhouse room */
  const d = Math.hypot(x, z), s = sstep(60, 120, d);
  let h = s * (Math.sin(x * .045) * Math.cos(z * .04) * 5 + Math.sin(x * .09 + z * .06) * 1.6 + 2);
  const pd = Math.hypot(x - POND.x, z - POND.z); h -= 1.7 * sstep(POND.r + 2.5, POND.r - 4, pd);
  return h;
}
const COL = [];   /* things you bump into: {x, z, r} */

/* ------------------------------ seasons ------------------------------ */
const SEASONS = [
  { n: "Spring", e: "🌸", g: [0x7fd15c, 0x9fe070], leaf: [0x8fd96b, 0xffb7d5, 0xa8e07a, 0xffd0e4], pine: 0x3f9a55, top: 0x4fa8ff, hor: 0xcfeaff, dirt: 0xc9a674 },
  { n: "Summer", e: "☀️", g: [0x4fb54a, 0x70c653], leaf: [0x2f9a45, 0x3fae4f, 0x58b947, 0x2a8c40], pine: 0x2f8048, top: 0x2f8fff, hor: 0xbfe3ff, dirt: 0xc49c66 },
  { n: "Fall", e: "🍂", g: [0xa7ad4c, 0xc4ae52], leaf: [0xe8732a, 0xd9412b, 0xf2b632, 0xc85a1e], pine: 0x3a7d48, top: 0x5a9be0, hor: 0xffe6c8, dirt: 0xb8905c },
  { n: "Winter", e: "❄️", g: [0xeef3fc, 0xd9e4f5], leaf: [0xf4f8ff, 0xe2ecf8, 0xffffff, 0xeaf1fb], pine: 0xa9cdb6, top: 0x6fa6e8, hor: 0xeaf2ff, dirt: 0xd9d4d2 }
];
const SEASON_LEN = 2;   /* game days per season */

/* ------------------------------ sky ------------------------------ */
const skyU = { top: { value: new THREE.Color(0x4fa8ff) }, bot: { value: new THREE.Color(0xcfeaff) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 p; void main(){ float h = max(normalize(p).y, 0.0); gl_FragColor = vec4(mix(bot, top, pow(h, 0.55)), 1.0); }" }));
scene.add(sky);
function glowTex(inner, outer) { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 2, 64, 64, 64); g.addColorStop(0, inner); g.addColorStop(.35, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,250,220,1)", "rgba(255,220,120,0)"), fog: false, depthWrite: false })); sunSpr.scale.set(110, 110, 1); scene.add(sunSpr);
const moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(245,248,255,1)", "rgba(190,210,255,0)"), fog: false, depthWrite: false })); moonSpr.scale.set(60, 60, 1); scene.add(moonSpr);
const stars = (function () { const n = 700, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rnd(TAU), y = rnd(.05, 1), r = Math.sqrt(1 - y * y); p[i * 3] = Math.cos(a) * r * 600; p[i * 3 + 1] = y * 600; p[i * 3 + 2] = Math.sin(a) * r * 600; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(m); return m; })();
const clouds = []; (function () { const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: .93 });
  for (let i = 0; i < 12; i++) { const g = grp(scene, rnd(-320, 320), rnd(70, 110), rnd(-320, 320)); const n = 4 + (i % 3); for (let j = 0; j < n; j++) { const m = new THREE.Mesh(G.sphLo, cm); m.position.set((j - n / 2) * 7 + rnd(-2, 2), rnd(-1, 2), rnd(-4, 4)); const s = rnd(6, 11); m.scale.set(s, s * .55, s * .8); g.add(m); } clouds.push(g); } })();
const cDay = new THREE.Color(), cTmp = new THREE.Color(), cNightTop = new THREE.Color(0x0a0f2e), cNightHor = new THREE.Color(0x1f2a5c), cDusk = new THREE.Color(0xffa76b);
let dayF = 1, moonGlow = 0;
function updateSky(px, pz) {
  const a = (S.time - .25) * TAU, sh = Math.sin(a), se = SEASONS[S.season];
  dayF = sstep(-.12, .22, sh); const dusk = clamp(1 - Math.abs(sh) / .3, 0, 1) * (sh > -.15 ? 1 : 0);
  skyU.top.value.copy(cNightTop).lerp(cDay.setHex(se.top), dayF);
  skyU.bot.value.copy(cNightHor).lerp(cDay.setHex(se.hor), dayF).lerp(cDusk, dusk * .6);
  scene.fog.color.copy(skyU.bot.value);
  const dx = Math.cos(a) * .85, dy = sh, dz = .4;
  sunSpr.position.set(px + dx * 520, dy * 520, pz + dz * 520); moonSpr.position.set(px - dx * 520, -dy * 520 + 40, pz - dz * 520);
  const mg = 60 + moonGlow * 110; moonSpr.scale.set(mg, mg, 1);
  stars.material.opacity = (1 - dayF) * .95; stars.position.set(px, 0, pz); sky.position.set(px, 0, pz);
  const night = dy < 0, lx = night ? -dx : dx, ly = Math.max(.25, Math.abs(dy)), lz = night ? -dz : dz;
  sun.position.set(px + lx * 90, ly * 90, pz + lz * 90); sun.target.position.set(px, 0, pz);
  sun.intensity = lerp(.22 + moonGlow * .25, 1.02, dayF); sun.color.setHex(night ? 0xbfd0ff : 0xfff3da).lerp(cDusk, dusk * .5);
  hemi.intensity = lerp(.3 + moonGlow * .15, .72, dayF); hemi.color.setHex(0xdff1ff); hemi.groundColor.setHex(S.season === 3 ? 0xdfe8f5 : 0x7fae6a);
}

/* ------------------------------ ground ------------------------------ */
const groundGeo = new THREE.PlaneGeometry(340, 340, 170, 170); groundGeo.rotateX(-Math.PI / 2);
(function () { const p = groundGeo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, hgt(p.getX(i), p.getZ(i))); groundGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(p.count * 3), 3)); groundGeo.computeVertexNormals(); })();
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); ground.receiveShadow = true; scene.add(ground);
function noise(x, z) { return (Math.sin(x * .31 + z * .17) + Math.sin(x * .13 - z * .29 + 1.7) + Math.sin(x * .07 + z * .05)) / 6 + .5; }
function paintGround() {
  const se = SEASONS[S.season], p = groundGeo.attributes.position, c = groundGeo.attributes.color, a = new THREE.Color(), b = new THREE.Color(), d = new THREE.Color(se.dirt), sand = new THREE.Color(S.season === 3 ? 0xece6dc : 0xe6d3a3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); a.setHex(se.g[0]).lerp(b.setHex(se.g[1]), noise(x, z));
    const pd = pathDist(x, z); if (pd < 3.4) a.lerp(d, sstep(3.4, 1.6, pd));
    const ad = Math.hypot(x - ARENA.x, z - ARENA.z); if (ad < ARENA.r + 1) a.lerp(sand, sstep(ARENA.r + 1, ARENA.r - 1, ad));
    const wd = Math.hypot(x - POND.x, z - POND.z); if (wd < POND.r + 3) a.lerp(sand, sstep(POND.r + 3, POND.r, wd));
    if (x > -41 && x < -13 && z > -5 && z < 17) a.lerp(d, .55);
    c.setXYZ(i, a.r, a.g, a.b);
  }
  c.needsUpdate = true;
}
const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r + 1.2, 40), new THREE.MeshStandardMaterial({ color: 0x4fb8e8, roughness: .12, metalness: .25, transparent: true, opacity: .78 }));
water.rotation.x = -Math.PI / 2; water.position.set(POND.x, -.42, POND.z); water.receiveShadow = true; scene.add(water);

/* grass tufts and wild flowers */
function onFarmStuff(x, z) { return pathDist(x, z) < 3.2 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 2 || Math.hypot(x - ARENA.x, z - ARENA.z) < ARENA.r + 1 || (x > -41 && x < -13 && z > -5 && z < 17) || Math.hypot(x - HOUSE.x, z - HOUSE.z) < 9 || Math.hypot(x - BARN.x, z - BARN.z) < 11; }
const tufts = new THREE.InstancedMesh(new THREE.ConeGeometry(.09, .42, 4), new THREE.MeshLambertMaterial({ color: 0xffffff }), 4200); tufts.receiveShadow = true; scene.add(tufts);
const blooms = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 7, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }), 700); scene.add(blooms);
const tuftPos = [], bloomPos = [];
(function () { const r = srand(77); while (tuftPos.length < 4200) { const a = r() * TAU, d = Math.sqrt(r()) * 105, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!onFarmStuff(x, z)) tuftPos.push([x, z, .5 + r() * .6, r()]); }
  while (bloomPos.length < 700) { const a = r() * TAU, d = Math.sqrt(r()) * 120, x = Math.cos(a) * d, z = Math.sin(a) * d; if (!onFarmStuff(x, z)) bloomPos.push([x, z, r()]); } })();
const dummy = new THREE.Object3D();
function paintPlants() {
  const se = SEASONS[S.season], a = new THREE.Color(), b = new THREE.Color(), win = S.season === 3;
  tuftPos.forEach((t, i) => { dummy.position.set(t[0], hgt(t[0], t[1]) + (win ? .05 : .22) * t[2], t[1]); dummy.rotation.set(0, t[3] * 6, 0); dummy.scale.set(t[2], win ? t[2] * .35 : t[2], t[2]); dummy.updateMatrix(); tufts.setMatrixAt(i, dummy.matrix);
    a.setHex(se.g[0]).lerp(b.setHex(se.g[1]), t[3]).multiplyScalar(win ? 1 : .86); tufts.setColorAt(i, a); });
  tufts.instanceMatrix.needsUpdate = true; tufts.instanceColor.needsUpdate = true;
  const fc = [[0xff8fc0, 0xfff27a, 0xffffff, 0xc9a2ff], [0xff6b6b, 0xffd23f, 0xffffff, 0x7fb8ff], [0xffa93f, 0xd9552b, 0xf2d04a, 0xb86a3a], []][S.season];
  bloomPos.forEach((t, i) => { const show = fc.length && (S.season !== 2 || t[2] < .4); dummy.position.set(t[0], show ? hgt(t[0], t[1]) + .16 : -50, t[1]); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(.8 + t[2] * .6); dummy.updateMatrix(); blooms.setMatrixAt(i, dummy.matrix);
    blooms.setColorAt(i, a.setHex(fc.length ? fc[i % fc.length] : 0xffffff)); });
  blooms.instanceMatrix.needsUpdate = true; blooms.instanceColor.needsUpdate = true;
}

/* trees: round ones change with the seasons, pines stay green */
const TREES = [];
(function () { const r = srand(2026);
  const ok = (x, z) => !onFarmStuff(x, z) && pathDist(x, z) > 5.5 && Math.hypot(x, z - 10) > 66 && !(x > 16 && x < 56 && z > 52 && z < 94) && Math.hypot(x + 34, z - 72) > 20;
  for (let i = 0; i < 2400 && TREES.length < 300; i++) { const x = 66 + r() * 96, z = -150 + r() * 300; if (ok(x, z) && TREES.every(t => Math.hypot(t.x - x, t.z - z) > 5.2)) TREES.push({ x, z, s: .9 + r() * .9, pine: r() < .38, k: r() }); }
  for (let i = 0; i < 900 && TREES.length < 400; i++) { const a = r() * TAU, d = 88 + r() * 70, x = Math.cos(a) * d, z = Math.sin(a) * d; if (x < 64 && Math.abs(x) > 9 && ok(x, z) && TREES.every(t => Math.hypot(t.x - x, t.z - z) > 8)) TREES.push({ x, z, s: 1 + r() * 1, pine: r() < .5, k: r() }); }
  [[-36, -22], [-10, -40], [-34, -40], [12, -46], [-56, 8], [-60, 52], [-20, 50], [20, 52], [58, 2], [-52, -8]].forEach((p, i) => TREES.push({ x: p[0], z: p[1], s: 1.3, pine: false, k: (i * .37) % 1 }));
  TREES.forEach(t => COL.push({ x: t.x, z: t.z, r: .75 * t.s }));
})();
const nRound = TREES.filter(t => !t.pine).length, nPine = TREES.length - nRound;
const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.3, .48, 1, 8), new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: .95 }), TREES.length);
const leafI = new THREE.InstancedMesh(G.ico, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, flatShading: false }), nRound * 4);
const pineI = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 9), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 }), nPine * 3);
[trunks, leafI, pineI].forEach(m => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
function paintTrees() {
  const se = SEASONS[S.season], c = new THREE.Color(), w = new THREE.Color(0xffffff); let li = 0, pi = 0;
  TREES.forEach((t, i) => { const y = hgt(t.x, t.z), s = t.s, th = t.pine ? 1.6 * s : 3.2 * s;
    dummy.position.set(t.x, y + th / 2 - .2, t.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(s, th, s); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    if (t.pine) { for (let j = 0; j < 3; j++) { const r = (2.3 - j * .55) * s; dummy.position.set(t.x, y + (1.9 + j * 1.5) * s, t.z); dummy.scale.set(r, 2.6 * s, r); dummy.updateMatrix(); pineI.setMatrixAt(pi, dummy.matrix); c.setHex(se.pine); if (S.season === 3 && j === 2) c.lerp(w, .5); pineI.setColorAt(pi++, c); } }
    else { const bl = [[0, 4.2, 0, 2.3], [1.3, 3.5, .5, 1.6], [-1.2, 3.6, -.4, 1.7], [.2, 3.4, -1.3, 1.5]]; bl.forEach((b, j) => { const r = b[3] * s * (S.season === 3 ? .82 : 1); dummy.position.set(t.x + b[0] * s, y + b[1] * s, t.z + b[2] * s); dummy.rotation.set(0, t.k * 6 + j, 0); dummy.scale.set(r, r * .9, r); dummy.updateMatrix(); leafI.setMatrixAt(li, dummy.matrix);
      c.setHex(se.leaf[Math.floor(t.k * 97 + (S.season === 0 ? 0 : j)) % se.leaf.length]); leafI.setColorAt(li++, c); }); } });
  [trunks, leafI, pineI].forEach(m => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
}

/* falling things: petals, fireflies, leaves, snow */
const fallN = 520, fallP = new Float32Array(fallN * 3), fallS = new Float32Array(fallN);
for (let i = 0; i < fallN; i++) { fallP[i * 3] = rnd(-45, 45); fallP[i * 3 + 1] = rnd(0, 30); fallP[i * 3 + 2] = rnd(-45, 45); fallS[i] = rnd(.6, 1.4); }
const fallGeo = new THREE.BufferGeometry(); fallGeo.setAttribute("position", new THREE.BufferAttribute(fallP, 3));
const fall = new THREE.Points(fallGeo, new THREE.PointsMaterial({ map: glowTex("rgba(255,255,255,1)", "rgba(255,255,255,0)"), color: 0xffffff, size: .5, transparent: true, depthWrite: false, opacity: .9 })); fall.frustumCulled = false; scene.add(fall);
function updateFall(dt, t, cx, cz) {
  const se = S.season, fm = fall.material, night = 1 - dayF;
  fall.visible = se !== 1 || night > .5; if (!fall.visible) return;
  fm.color.setHex([0xffc4dd, 0xfff27a, 0xf08a2c, 0xffffff][se]); fm.size = [.42, .38, .6, .5][se]; fm.opacity = se === 1 ? night : .9;
  fall.geometry.setDrawRange(0, [150, 120, 240, fallN][se]);
  const sp = [1.3, 0, 2.2, 3.4][se];
  for (let i = 0; i < fallN; i++) { const k = i * 3; fallP[k + 1] -= sp * fallS[i] * dt; fallP[k] += Math.sin(t * fallS[i] + i) * (se === 1 ? .6 : 1.1) * dt; if (se === 1) fallP[k + 1] += Math.cos(t * .8 + i) * .5 * dt;
    if (fallP[k + 1] < 0) fallP[k + 1] += 30; if (fallP[k] < -45) fallP[k] += 90; if (fallP[k] > 45) fallP[k] -= 90; }
  fall.geometry.attributes.position.needsUpdate = true; fall.position.set(cx, hgt(cx, cz) - 1, cz);
}
function applySeason() { paintGround(); paintPlants(); paintTrees(); water.material.color.setHex(S.season === 3 ? 0xcfe9f7 : 0x4fb8e8); water.material.opacity = S.season === 3 ? .93 : .78; }

/* ------------------------------ sparkles ------------------------------ */
const sparkTex = glowTex("rgba(255,255,255,1)", "rgba(255,255,255,0)");
const sparks = []; for (let i = 0; i < 170; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkTex, transparent: true, depthWrite: false })); s.visible = false; scene.add(s); sparks.push({ s, life: 0, vx: 0, vy: 0, vz: 0, max: 1, size: .4 }); }
let sparkI = 0;
function burst(x, y, z, colors, n, spread, up, size) {
  for (let i = 0; i < n; i++) { const p = sparks[sparkI = (sparkI + 1) % sparks.length], a = rnd(TAU), v = rnd(.3, 1) * (spread || 2);
    p.s.position.set(x + rnd(-.3, .3), y + rnd(-.3, .3), z + rnd(-.3, .3)); p.vx = Math.cos(a) * v; p.vz = Math.sin(a) * v; p.vy = rnd(.5, 1) * (up === undefined ? 2.5 : up);
    p.life = p.max = rnd(.6, 1.3); p.size = (size || .45) * rnd(.6, 1.3); p.s.material.color.setHex(Array.isArray(colors) ? pick(colors) : colors); p.s.visible = true; }
}
function updateSparks(dt) { for (const p of sparks) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; } p.vy -= 2.2 * dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; const k = p.life / p.max; p.s.material.opacity = k; p.s.scale.setScalar(p.size * (.5 + k)); } }

/* ------------------------------ words in the world ------------------------------ */
function textSprite(text, o) {
  o = o || {}; const c = document.createElement("canvas"), x = c.getContext("2d"), fs = o.fs || 44; x.font = "800 " + fs + "px 'Avenir Next','Trebuchet MS',Arial"; const w = Math.ceil(x.measureText(text).width) + 36, h = fs + 26; c.width = w; c.height = h;
  x.font = "800 " + fs + "px 'Avenir Next','Trebuchet MS',Arial"; x.fillStyle = o.bg || "rgba(40,30,80,.72)"; const r = h / 2; x.beginPath(); x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.fill();
  x.fillStyle = o.fg || "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, w / 2, h / 2 + 2);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); const k = (o.h || .5) / h; s.scale.set(w * k, h * k, 1); return s;
}
function signTex(lines, bg, fg) { const c = document.createElement("canvas"); c.width = 768; c.height = 192; const x = c.getContext("2d"); x.fillStyle = bg; x.fillRect(0, 0, 768, 192); x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(10, 10, 748, 172); x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  if (lines.length === 1) { x.font = "800 86px 'Avenir Next','Trebuchet MS',Arial"; x.fillText(lines[0], 384, 100); } else { x.font = "800 62px 'Avenir Next','Trebuchet MS',Arial"; x.fillText(lines[0], 384, 66); x.font = "700 44px 'Avenir Next','Trebuchet MS',Arial"; x.fillText(lines[1], 384, 136); }
  return new THREE.CanvasTexture(c); }

/* ------------------------------ buildings ------------------------------ */
const winMat = Mu(0xbfe6ff, { emissive: 0xffd98a, emissiveIntensity: 0, roughness: .2 });
const roofGeo = (function () { const v = [-.5,0,.5, .5,0,.5, 0,1,.5,  .5,0,-.5, -.5,0,-.5, 0,1,-.5,  -.5,0,-.5, -.5,0,.5, 0,1,.5,  -.5,0,-.5, 0,1,.5, 0,1,-.5,  .5,0,.5, .5,0,-.5, 0,1,-.5,  .5,0,.5, 0,1,-.5, 0,1,.5];
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(v), 3)); g.computeVertexNormals(); return g; })();
function roof(par, w, d, h, y, color) { return add(par, roofGeo, M(color, { side: 2 }), 0, y, 0, w + 1, h, d + 1); }
function fence(pts, closed, color, skip) {
  const g = grp(scene), mat = M(color || 0xffffff), n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) { if (skip && skip.includes(i)) continue; const a = pts[i], b = pts[(i + 1) % n], len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(len / 3));
    for (let j = 0; j <= k; j++) { const x = lerp(a[0], b[0], j / k), z = lerp(a[1], b[1], j / k); add(g, G.box, mat, x, hgt(x, z) + .6, z, .2, 1.3, .2); }
    [.55, 1].forEach(h => { const r = add(g, G.box, mat, (a[0] + b[0]) / 2, hgt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + h, (a[1] + b[1]) / 2, len, .13, .1); r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); }); }
  return g;
}
let gateSign = null, houseG = null, barnG = null;
function buildFarm() {
  /* farmhouse */
  const h = houseG = grp(scene, HOUSE.x, 0, HOUSE.z);
  add(h, G.box, M(0xfff4dc), 0, 2.4, 0, 11, 4.8, 8); add(h, G.box, M(0xe9dcc0), 0, .25, 0, 11.6, .5, 8.6);
  roof(h, 11, 8, 3.4, 4.8, 0xc4566a);
  add(h, G.box, M(0x9b5f3c), 0, 1.4, 4.02, 1.5, 2.8, .12); add(h, G.sph, M(0xffd24a, { metalness: .6, roughness: .3 }), .5, 1.4, 4.12, .09);
  [[-3.4, 2.6], [3.4, 2.6]].forEach(p => { add(h, G.box, winMat, p[0], p[1], 4.02, 1.7, 1.5, .1); add(h, G.box, M(0xffffff), p[0], p[1], 4.05, .1, 1.5, .1); add(h, G.box, M(0xffffff), p[0], p[1], 4.05, 1.7, .1, .1); add(h, G.box, M(0x8a5a3a), p[0], p[1] - .95, 4.3, 1.9, .3, .5);
    [0xff7eb6, 0xffd23f, 0xc9a2ff].forEach((c, i) => add(h, G.sph, M(c), p[0] - .6 + i * .6, p[1] - .7, 4.35, .2)); });
  add(h, G.box, winMat, 0, 5.6, 4.5, 1.2, 1.1, .1);
  add(h, G.box, M(0xb86a5a), 3.6, 7.4, -1, 1, 2.4, 1); add(h, G.box, M(0xe9dcc0), 0, .5, 5.3, 5, .3, 2.6);
  [-2.2, 2.2].forEach(x => add(h, G.cyl, M(0xffffff), x, 1.9, 6.3, .14, 3, .14)); add(h, G.box, M(0xc4566a), 0, 3.5, 5.4, 5.4, .2, 2.9);
  COL.push({ x: HOUSE.x, z: HOUSE.z, r: 6.2 }, { x: HOUSE.x - 3.5, z: HOUSE.z, r: 5 }, { x: HOUSE.x + 3.5, z: HOUSE.z, r: 5 });
  /* the big red barn */
  const b = barnG = grp(scene, BARN.x, 0, BARN.z);
  add(b, G.box, M(0xc8423a), 0, 3.2, 0, 15, 6.4, 11); roof(b, 15, 11, 4.6, 6.4, 0x6b4a5c);
  add(b, G.box, M(0x7a3a30), 0, 2.2, 5.52, 4.6, 4.4, .12);
  [[-1.15, 0], [1.15, 0]].forEach(p => { add(b, G.box, M(0xffffff), p[0], 2.2, 5.6, 2.1, .16, .1); add(b, G.box, M(0xffffff), p[0], 4.3, 5.6, 2.1, .16, .1); add(b, G.box, M(0xffffff), p[0], .15, 5.6, 2.1, .16, .1);
    const d1 = add(b, G.box, M(0xffffff), p[0], 2.2, 5.6, 4.6, .14, .1); d1.rotation.z = 1.12; const d2 = add(b, G.box, M(0xffffff), p[0], 2.2, 5.6, 4.6, .14, .1); d2.rotation.z = -1.12; });
  [[-2.3], [0], [2.3]].forEach(p => add(b, G.box, M(0xffffff), p[0], 2.2, 5.58, .16, 4.4, .1));
  add(b, G.box, winMat, 0, 7.6, 5.9, 1.6, 1.4, .1); [-5.4, 5.4].forEach(x => add(b, G.box, winMat, x, 3.4, 5.52, 1.5, 1.3, .1));
  add(b, G.cyl, M(0xd9dde6, { metalness: .4, roughness: .4 }), 10.5, 4, -1, 2.2, 8, 2.2); add(b, G.half, M(0xb9c1d0, { metalness: .4, roughness: .4 }), 10.5, 8, -1, 2.2);
  for (let i = 0; i < 4; i++) { const hb = add(scene, G.cyl, M(0xe6c46a), BARN.x - 10 + (i % 2) * 2.3, .9 + Math.floor(i / 2) * 0, BARN.z + 7 + Math.floor(i / 2) * 2.2, .95, 1.5, .95); hb.rotation.z = Math.PI / 2; }
  COL.push({ x: BARN.x, z: BARN.z, r: 6.5 }, { x: BARN.x - 4.5, z: BARN.z, r: 6 }, { x: BARN.x + 4.5, z: BARN.z, r: 6 }, { x: BARN.x + 10.5, z: BARN.z - 1, r: 2.6 }, { x: BARN.x - 9, z: BARN.z + 8, r: 2.2 });
  /* chicken coop */
  const c = grp(scene, COOP.x, 0, COOP.z); add(c, G.box, M(0xf7d98a), 0, 1.3, 0, 3, 1.8, 2.4); roof(c, 3, 2.4, 1.2, 2.2, 0xd9552b);
  [[-1.2, -1], [1.2, -1], [-1.2, 1], [1.2, 1]].forEach(p => add(c, G.box, M(0x8a5a3a), p[0], .25, p[1], .15, .6, .15)); add(c, G.box, M(0x6b4226), 0, 1.1, 1.22, .7, .8, .08);
  const ramp = add(c, G.box, M(0x8a5a3a), 0, .4, 1.9, .6, .08, 1.5); ramp.rotation.x = .5; COL.push({ x: COOP.x, z: COOP.z, r: 2 });
  /* the farm stand */
  const s = grp(scene, STAND.x, 0, STAND.z); add(s, G.box, M(0xb98252), 0, .6, 0, 5, 1.2, 1.6); add(s, G.box, M(0xd9a66c), 0, 1.25, 0, 5.3, .12, 1.9);
  [[-2.4, -.8], [2.4, -.8], [-2.4, .8], [2.4, .8]].forEach(p => add(s, G.cyl, M(0xffffff), p[0], 1.9, p[1], .07, 3.2, .07));
  for (let i = 0; i < 8; i++) { const a = add(s, G.box, M(i % 2 ? 0xffffff : 0xff7eb6), -2.3 + i * .66, 3.5, 0, .66, .1, 2.6); a.rotation.x = .12; }
  [[0xff7a3c, -1.6], [0xe8413a, -.6], [0xffd23f, .4], [0x8fd96b, 1.4]].forEach(p => { add(s, G.box, M(0x8a5a3a), p[1], 1.42, 0, .8, .22, .8); for (let i = 0; i < 4; i++) add(s, G.sph, M(p[0]), p[1] - .2 + (i % 2) * .4, 1.6, -.2 + Math.floor(i / 2) * .4, .2); });
  COL.push({ x: STAND.x - 1.5, z: STAND.z, r: 1.5 }, { x: STAND.x + 1.5, z: STAND.z, r: 1.5 });
  /* fences, the gate and its sign */
  const P = PADDOCK; fence([[P.x0, P.z0], [P.x1, P.z0], [P.x1, P.z1], [P.x0, P.z1]], true, 0xffffff);
  const ring = []; for (let i = 0; i < 18; i++) ring.push([ARENA.x + Math.cos(i / 18 * TAU) * (ARENA.r + .6), ARENA.z + Math.sin(i / 18 * TAU) * (ARENA.r + .6)]); fence(ring, true, 0xf6e7c8, [13]);
  fence([[-62, 46], [-4, 46]], false, 0xffffff); fence([[4, 46], [62, 46]], false, 0xffffff);
  [-4, 4].forEach(x => add(scene, G.cyl, M(0x8a5a3a), x, 2.6, GATE.z, .22, 5.2, .22));
  gateSign = add(scene, G.box, new THREE.MeshStandardMaterial({ map: signTex(["FOR SALE"], "#fff7e0", "#c0392b"), roughness: .8 }), 0, 5, GATE.z, 8.6, 1.9, .2);
  COL.push({ x: -4, z: GATE.z, r: .5 }, { x: 4, z: GATE.z, r: .5 });
  /* jumps in the arena */
  HURDLES.forEach((hd, i) => { const g = grp(scene, hd.x, 0, hd.z); g.rotation.y = hd.a; [-1.8, 1.8].forEach(x => add(g, G.box, M(0xffffff), x, .6, 0, .22, 1.2, .22)); for (let j = 0; j < 6; j++) add(g, G.cyl, M(j % 2 ? 0xffffff : [0xff7eb6, 0x7fb8ff, 0xffd23f][i % 3]), -1.5 + j * .6, .75, 0, .09, .6, .09).rotation.z = Math.PI / 2; });
  /* pond rocks and reeds */
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, x = POND.x + Math.cos(a) * (POND.r + 1.6), z = POND.z + Math.sin(a) * (POND.r + 1.6); add(scene, G.sphLo, M(0x9aa3ad), x, hgt(x, z) + .1, z, rnd(.5, 1), rnd(.35, .6), rnd(.5, .9));
    if (i % 2) for (let j = 0; j < 3; j++) add(scene, G.cyl, M(0x5d9c4a), x + rnd(-1, 1) - Math.cos(a) * 2, hgt(x, z) + .5, z + rnd(-1, 1) - Math.sin(a) * 2, .04, 1.6, .04); }
  /* a bench and lamp posts so the yard feels lived in */
  [[-10, 26], [8, 26], [-14, -14], [12, -20]].forEach(p => { add(scene, G.cyl, M(0x4a4460), p[0], 1.6, p[1], .08, 3.2, .08); const l = add(scene, G.sph, winMat, p[0], 3.3, p[1], .28); l.castShadow = false; });
}
const HURDLES = [0, 1, 2].map(i => { const a = i / 3 * TAU + .6; return { x: ARENA.x + Math.cos(a) * 6.5, z: ARENA.z + Math.sin(a) * 6.5, a: -a, ok: 0 }; });
function setGateSign(sold) { gateSign.material.map = sold ? signTex(["VAL TRAINING ACADEMY", "✦ magic farm ✦"], "#f3e9ff", "#6a3fc0") : signTex(["FOR SALE"], "#fff7e0", "#c0392b"); gateSign.material.needsUpdate = true; }
