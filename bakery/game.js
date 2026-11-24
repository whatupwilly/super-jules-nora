"use strict";
/* ===========================================================================
   Pocket Peaches, by Jules. game.js
   Save, menus, customers, magic powers, picking ingredients, deliveries,
   the three ways to travel, helpers, the pet, the shop and the camera.
   =========================================================================== */
const SAVE_KEY = Arcade.key("bakerySave");
const PRESET = {
  jules: { type: "jules", name: "Jules", skin: 0xf6cfa8, hair: 0x6b4226, style: "long", apron: 0xb99bff, hat: 1, fairy: 0 },
  nora: { type: "nora", name: "Nora", skin: 0xf6cfa8, hair: 0x6b4226, style: "pig", apron: 0xff7fb0, hat: 1, fairy: 0 } };
function fresh() { return { v: 1, made: 0, ch: Object.assign({}, PRESET.jules), coins: 20, inv: { berry: 2, moon: 2, honey: 1, egg: 0, star: 0, dew: 0 }, lvl: 0, oven: 0, ovenMax: 0, decor: [], wall: 0xffe9d6, floor: 0xd9a877, help: {}, friend: "", pet: "dragon", petNames: {}, found: {}, rec: {}, served: 0, tipG: 0 }; }
let S = null; try { S = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {} if (!S || S.v !== 1) S = fresh();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
const hex = c => "#" + c.toString(16).padStart(6, "0"), cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const cozy = () => Math.min(10, S.decor.length) * .04;
const price = o => TYPES[o.type].p + (o.frost !== "none" ? 1 : 0) + (o.spr !== "none" ? 1 : 0) + (o.top ? 1 : 0) + (o.magic ? 15 : 0);
function newOrder(magic) {
  const recs = Object.keys(S.rec).filter(id => { const M = MAGIC.find(m => m.id === id); return M && S.inv[M.a] > 0 && S.inv[M.b] > 0; });
  if (recs.length && Math.random() < (magic ? .5 : .2)) { const id = pick(recs), r = S.rec[id]; return { type: r.type, flavor: r.flavor, frost: r.frost, spr: r.spr, top: r.top || null, magic: id, special: r.n }; }
  const easy = S.served < 3;
  return { type: pick(Object.keys(TYPES)), flavor: pick(Object.keys(FLAV)), frost: Math.random() < .85 ? pick(Object.keys(FROST).filter(k => k !== "none")) : "none",
    spr: Math.random() < (easy ? .25 : .55) ? pick(Object.keys(SPR).filter(k => k !== "none")) : "none", top: !easy && Math.random() < .4 ? pick(Object.keys(TOPS)) : null };
}

/* ------------------------------ sound ------------------------------ */
let AC = null;
function audio() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === "suspended") AC.resume(); }
function beep(f, d, type, v, slide) { if (!AC) return; try { const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d); g.gain.setValueAtTime(v || .1, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
const SFX = { pop: () => beep(520, .09, "sine", .12, 1.7), plop: () => beep(220, .12, "sine", .16, .5), no: () => beep(210, .2, "sawtooth", .05, .6), shake: () => beep(800 + Math.random() * 500, .05, "square", .03),
  coin: () => { beep(880, .08, "square", .05); setTimeout(() => beep(1320, .16, "square", .05), 80); }, yay: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .18, "triangle", .1), i * 90)), pour: () => beep(260 + Math.random() * 90, .07, "sine", .03),
  crack: () => { beep(900, .04, "square", .06); setTimeout(() => beep(300, .1, "sine", .12, .5), 50); }, slide: () => beep(900, 1.1, "sine", .08, .25), zip: () => beep(300, 1.2, "sawtooth", .04, 3), magic: () => [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => beep(f, .25, "sine", .08), i * 70)) };

/* ------------------------------ little UI helpers ------------------------------ */
let mode = "title", toastT = 0, closeUp = 0;
function toast(m, s) { const t = $("toast"); t.textContent = m; t.hidden = false; t.style.opacity = 1; toastT = s || 3.5; }
function pop(m) { const p = $("pop"); p.textContent = m; p.classList.remove("show"); void p.offsetWidth; p.classList.add("show"); }
function flash() { const d = $("dark"); d.style.transition = "none"; d.style.opacity = .9; void d.offsetWidth; d.style.transition = "opacity .5s"; d.style.opacity = 0; }
function openM(html, low) { $("modalCard").innerHTML = html; $("modal").className = low ? "ov low" : "ov"; $("modal").hidden = false; $("modalCard").scrollTop = 0; }
function closeM() { $("modal").hidden = true; mk = null; }
const X = '<button class="x" data-a="close">✕</button>';
function hud() { const n = deliv ? (deliv.state === "new" ? " ❗" : " 🎁") : ""; $("hud").innerHTML = '<span class="pill">💰 <b>' + S.coins + '</b></span><button data-a="basket">🧺 Basket</button><button data-a="shop">🛒 Shop</button><button data-a="book">📖 Recipes</button><button data-a="orders">📜 Orders' + n + '</button><button data-a="saveGame">💾 Save Game</button><button data-a="redo">🔄 Redo</button>'; }
function earn(n, why) { S.coins += n; pop("+💰" + n + (why ? " " + why : "")); SFX.coin(); hud(); save(); }
function pay(n) { if (S.coins < n) { SFX.no(); toast("You need 💰" + n + ". Sell some more treats first!"); return false; } S.coins -= n; SFX.coin(); hud(); return true; }
const sw = (c, on, a) => '<button class="sw' + (on ? " on" : "") + '" style="background:' + hex(c) + '" data-a="' + a + '" data-v="' + c + '"></button>';
const chip = (t, on, a, v) => '<button class="chip' + (on ? " on" : "") + '" data-a="' + a + '" data-v="' + v + '">' + t + "</button>";
const it = (e, n, sub, a, v, dis, cls) => '<button class="it' + (cls ? " " + cls : "") + '" data-a="' + a + '" data-v="' + v + '"' + (dis ? " disabled" : "") + "><span>" + e + "</span>" + n + (sub ? "<small>" + sub + "</small>" : "") + "</button>";
function click(e) { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; audio(); const f = ACT[b.dataset.a]; if (f) f(b.dataset.v, b); }
$("modalCard").addEventListener("click", click); $("hud").addEventListener("click", click); $("pad").addEventListener("click", click);
ACT.close = () => closeM();

/* ------------------------------ player, pet, helpers ------------------------------ */
const pl = { x: 0, y: 0, z: IZ + 1.5, ry: 0, inside: 1, place: null, m: null, moving: 0, ride: 0, bubble: 0, zip: null, slide: null, fx: null, fxT: 0, fxEnd: 0 };
let carry = 0;
const SKINS = [0xffe0c4, 0xf6cfa8, 0xe0ac7e, 0xc68a5c, 0x8d5a3b, 0x5c3a26], HAIRS = [0x2c2230, 0x6b4226, 0xa86a3a, 0xf2d16b, 0xff7f50, 0xff8fd0, 0x9a6bff, 0x5fc8f0, 0x7fdc8c, 0xffffff];
const APRONS = [0xb99bff, 0xff7fb0, 0x7fd0ff, 0x8fdc9c, 0xffd84a, 0xffa878, 0xffffff], STYLES = { long: "Long", pig: "Pigtails", pony: "Ponytail", bun: "Bun", short: "Short" };
const WALLS = [0xffe9d6, 0xffe3ef, 0xe6dcff, 0xdff3ff, 0xe3f7df, 0xfff3c9, 0xffc9b0], FLOORS = [0xd9a877, 0xf3d9b0, 0xb98a6a, 0xffd9ea, 0xcdeccd, 0xd9ecff];
const SHIRTS = [0xffffff, 0xffd9ea, 0xd9ecff, 0xfff3c9, 0xe3f7df, 0xe6dcff, 0xff9a5a, 0x7fd0ff];
function buildPlayer() { if (pl.m) scene.remove(pl.m); pl.fx = null; const c = S.ch; pl.m = mkChar({ skin: c.skin, hair: c.hair, style: c.style, apron: c.apron, hat: c.hat, wings: c.fairy, wingC: 0xff9fe6 }); scene.add(pl.m); pl.m.position.set(pl.x, pl.y, pl.z); pl.m.rotation.y = pl.ry; if (carry) giveItem(pl.m, mkBox()); }
const PETS = { dragon: "Sparky", horse: "Buttercup", dog: "Peach", kitty: "Biscuit", bunny: "Clover", panda: "Bamboo", fox: "Maple" };
let pet = null;
const petName = () => S.petNames[S.pet] || PETS[S.pet];
function buildPet() { if (pet) scene.remove(pet.m); pet = { m: mkPet(S.pet), x: pl.x - 1.3, z: pl.z + .4, ry: 0, mv: 0, hop: 0, findT: rnd(40, 70) }; scene.add(pet.m); pet.m.position.set(pet.x, 0, pet.z); }
const HELP = { counter: { n: "Twinkle the counter fairy", e: "🧚", cost: 100, say: "serves customers at the counter all by herself" }, oven: { n: "Poppy the oven fairy", e: "🧚‍♀️", cost: 120, say: "takes treats out of the oven at the perfect time" }, friend: { n: "A friend who gathers", e: "🧺", cost: 150, say: "picks forest ingredients for your basket" } };
const PALS = ["Sonia", "Naeun", "Lucas", "Charlotte", "Christina", "DJ", "Mia", "Zoe", "Ben"];
const helpG = new THREE.Group(); scene.add(helpG); let fairies = [];
const sisName = () => S.ch.type === "nora" || S.ch.name === "Nora" ? "Jules" : "Nora";
function mkFairy(name, x, y, z, col) { const m = mkChar({ kind: "fairy", skin: 0xffe0c4, hair: col, style: "bun", shirt: col }); m.scale.setScalar(.45); m.position.set(x, y, IZ + z); helpG.add(m); const l = label(name, { h: 1 }); l.position.y = 2.8; m.add(l); return { m, y, ph: Math.random() * 6 }; }
function buildHelpers() {
  clearGroup(helpG); fairies = [];
  const sp = PRESET[sisName().toLowerCase()], s = mkChar({ skin: sp.skin, hair: sp.hair, style: sp.style, apron: sp.apron, hat: 1 }); s.position.set(-RM.cw / 2 + 1.7, 0, IZ + RM.cz - 1.15); helpG.add(s); const l = label(sisName(), { h: .5 }); l.position.y = 2.7; s.add(l);
  if (S.help.counter) fairies.push(mkFairy("Twinkle", RM.cw / 2 - 2.9, 2, RM.cz - .2, 0xff9fd0));
  if (S.help.oven) fairies.push(mkFairy("Poppy", 2, 2.5, -RM.D / 2 + 1.7, 0xffc34a));
  if (S.help.friend && S.friend) { const h = S.friend.split("").reduce((a, c) => a + c.charCodeAt(0), 0), m = mkChar({ skin: SKINS[h % 4], hair: HAIRS[h % 5], style: Object.keys(STYLES)[h % 5], shirt: SHIRTS[h % 8], apron: 0x8fdc9c }); m.position.set(RM.W / 2 - 1.5, 0, IZ + RM.D / 2 - 2.4); m.rotation.y = -2.3; helpG.add(m); const fl = label(S.friend, { h: .5 }); fl.position.y = 2.4; m.add(fl); }
}

/* ------------------------------ magic powers ------------------------------ */
const FXE = { glow: "✨", hearts: "💕", bubbles: "🫧", sparkle: "✨", sing: "🎵", firefly: "🌟", zoom: "💨", rainbow: "🌈" };
function endFx(o) { const m = o.m, u = m.userData; if (u.halo) { m.remove(u.halo); u.halo = null; } if (u.fxW) { u.fxW.forEach(w => m.remove(w)); u.fxW = null; } m.scale.setScalar(1); m.rotation.x = 0; o.fx = null; }
function startFx(o, fx, secs) {
  if (o.fx) endFx(o); o.fx = fx; o.fxT = 0; o.fxEnd = secs; const m = o.m; SFX.magic();
  if (fx === "glow" || fx === "rainbow") { const h = sph(1.15, 0xfff3a8, 0, 1, 0, m, 1, 1.35, 1, { transparent: true, opacity: .32, emissive: 0xffe27a, depthWrite: false }); h.castShadow = false; m.userData.halo = h; }
  if (fx === "wings") m.userData.fxW = mkWings(m, 0xff9fd0, 1.05);
}
function fxTick(o, dt) {   /* returns how high the magic lifts them */
  if (!o.fx) return 0; o.fxT += dt; const t = o.fxT, m = o.m, u = m.userData, f = o.fx, k = Math.min(1, t); let y = 0;
  if (t > o.fxEnd) { endFx(o); return 0; }
  if (f === "float") y = k * 1.4 + Math.sin(t * 2) * .3;
  else if (f === "giant") m.scale.setScalar(1 + k * .9);
  else if (f === "tiny") m.scale.setScalar(1 - k * .55);
  else if (f === "bounce") y = Math.abs(Math.sin(t * 5)) * 1.3;
  else if (f === "spin") m.rotation.y += t * 9;
  else if (f === "flip") { y = .9 + Math.abs(Math.sin(t * 3)) * 1.2; m.rotation.x = t * 6; }
  else if (f === "wings") { y = k * .9 + Math.sin(t * 3) * .2; u.fxW.forEach((w, i) => { w.rotation.y = (i ? -1 : 1) * (.25 + Math.sin(t * 14) * .5); }); }
  if (u.halo) { u.halo.material.opacity = .3 + .1 * Math.sin(t * 5); if (f === "rainbow") { u.halo.material.color.setHSL(t * .4 % 1, .9, .7); u.halo.material.emissive.setHSL(t * .4 % 1, .9, .5); } }
  const e = FXE[f]; if (e && Math.random() < dt * (f === "firefly" ? 6 : 3)) puff(e, o.x, (o.y || 0) + y + rnd(.6, 2.2), o.z, 1);
  if (f === "sing" && Math.random() < dt * 1.5) beep(pick([523, 587, 659, 784, 880]), .2, "triangle", .05);
  return y;
}

/* ------------------------------ customers ------------------------------ */
const cust = [], extras = [];
const FRIENDS = ["Nora", "Jules", "Mom", "Dad", "Grandma", "Grandpa", "Sonia", "Naeun", "Lucas", "Charlotte", "Christina", "DJ", "Aunt Lily", "Mia", "Zoe", "Ben"];
const ANIM_C = [["Peach", "dog"], ["Biscuit", "kitty"], ["Hopper", "bunny"], ["Dumpling", "panda"], ["Maple", "fox"], ["Honey", "bear"], ["Mittens", "kitty"], ["Mochi", "bunny"], ["Rusty", "fox"], ["Buttercup", "horse"], ["Pudding", "dog"]];
const MAGIC_C = [["Starlight", "unicorn"], ["Ember", "dragon"], ["Petal", "fairy"], ["Snowdrop", "unicorn"], ["Zuzu", "dragon"], ["Twinkle", "fairy"], ["Dewdrop", "fairy"]];
const taken = n => n === S.ch.name || n === sisName() || n === petName() || n === S.friend || (S.help.counter && n === "Twinkle") || cust.some(c => c.name === n) || (deliv && deliv.name === n);
function castOne() {
  for (let i = 0; i < 14; i++) { const r = Math.random(); let name, kind = "person"; if (r < .38) name = pick(FRIENDS); else if (r < .72) { const a = pick(ANIM_C); name = a[0]; kind = a[1]; } else { const a = pick(MAGIC_C); name = a[0]; kind = a[1]; } if (!taken(name)) return { name, kind }; }
  return { name: "A new friend", kind: "person" };
}
function mkCast(k) { return mkChar({ kind: k, skin: pick(SKINS), hair: pick(HAIRS), style: pick(Object.keys(STYLES)), shirt: pick(SHIRTS), pants: pick([0x6a78b8, 0xff9fc0, 0x8fdc9c, 0xb99bff]) }); }
const FACES = ["🙂", "😊", "😍"];
function bubble(c) { const o = c.order; return FACES[c.face] + " " + (o.magic ? "✨" : "") + TYPES[o.type].e + FLAV[o.flavor].e + FROST[o.frost].h + (o.top ? TOPS[o.top].e : ""); }
function spawnCust(slot) {
  const w = castOne(), magic = !!(ANIMALS[w.kind] && ANIMALS[w.kind].magic);
  const c = { name: w.name, kind: w.kind, magic, slot, state: "wait", order: newOrder(magic), pat: 1, face: 2, arr: 0, t: 0, x: 0, y: 0, z: IZ + RM.D / 2 - .8, ry: Math.PI, m: mkCast(w.kind), fx: null };
  c.bub = label(bubble(c), { h: .62, top: 1 }); c.bub.position.y = 2.85; c.m.add(c.bub); const nl = label(c.name, { h: .34, top: 1 }); nl.position.y = 2.25; c.m.add(nl);
  scene.add(c.m); cust.push(c); return c;
}
const slotPos = c => ({ x: 0, z: IZ + RM.cz + 1.9 + c.slot * 1.5 });
const front = () => cust.find(c => c.state === "wait" && c.slot === 0 && c.arr);
const seats = {};
function freeSeat() { for (let i = 0; i < S.decor.length; i++) if (S.decor[i].k === "table") for (const s of [-1, 1]) if (!seats[i + ":" + s]) { const d = S.decor[i], r = d.r || 0; return { key: i + ":" + s, x: d.x + Math.cos(r) * s * 1.15, z: IZ + d.z - Math.sin(r) * s * 1.15 }; } return null; }
const goOut = c => { c.state = "out"; c.tx = 0; c.tz = IZ + RM.D / 2 - .3; };
function leave(c, item, fx) {
  if (c.bub) { c.m.remove(c.bub); c.bub = null; } if (item) giveItem(c.m, item);
  cust.forEach(o => { if (o !== c && o.state === "wait" && o.slot > c.slot) { o.slot--; o.arr = 0; } });
  if (fx) { c.state = "show"; c.t = 0; c.tx = (Math.random() < .5 ? -1 : 1) * rnd(1.8, RM.W / 2 - 1.5); c.tz = IZ + rnd(RM.cz + 2.2, RM.D / 2 - 1.6); startFx(c, fx, 99); const M = MAGIC.find(m => m.id === fx); toast(c.name + " " + M.say + "! " + M.e, 4); return; }
  const st = item ? freeSeat() : null;
  if (st) { c.state = "sit"; c.seat = st.key; seats[st.key] = 1; c.tx = st.x; c.tz = st.z; c.t = 0; } else goOut(c);
}
function unseat() { cust.forEach(c => { if (c.state === "sit") goOut(c); }); for (const k in seats) delete seats[k]; }
let spawnT = 2, fairyT = 0, awayT = 0, awayEarn = 0, awayN = 0, friendT = 45;
function updateCust(dt) {
  const R = ROOMS[S.lvl];
  if (pl.inside) { spawnT -= dt; if (spawnT <= 0) { const n = cust.filter(c => c.state === "wait").length; if (n < R.q) spawnCust(n); spawnT = rnd(8, 14) - S.lvl; } }
  else { awayT += dt; if (awayT > 18) { awayT = 0; const p = Math.round(rnd(5, 11)); awayEarn += p; awayN++; S.coins += p; S.served++; hud(); } }
  for (let i = cust.length - 1; i >= 0; i--) {
    const c = cust[i]; let tx, tz, sitY = 0; if (c.state === "wait") { const p = slotPos(c); tx = p.x; tz = p.z; } else { tx = c.tx; tz = c.tz; }
    if (c.state === "show") c.t += dt;
    const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz), mv = d > .12;
    if (mv) { const s = Math.min(d, 3.2 * (c.fx === "zoom" ? 2.8 : 1) * dt); c.x += dx / d * s; c.z += dz / d * s; c.ry = Math.atan2(dx, dz); }
    else if (c.state === "wait") { c.arr = 1; c.ry = Math.PI; if (pl.inside) c.pat = Math.max(0, c.pat - dt / 70); const f = c.pat > .62 ? 2 : c.pat > .28 ? 1 : 0; if (f !== c.face) { c.face = f; setLabel(c.bub, bubble(c), { h: .62, top: 1 }); } }
    else if (c.state === "sit") { c.t += dt; sitY = -.18; if (c.t > 11) { delete seats[c.seat]; goOut(c); } }
    else if (c.state === "show") { c.ry = 0; if (c.t > 8) goOut(c); else if (c.fx === "zoom") { c.tx = rnd(-RM.W / 2 + 1.5, RM.W / 2 - 1.5); c.tz = IZ + rnd(RM.cz + 2, RM.D / 2 - 1.6); } }
    else if (c.state === "out") { scene.remove(c.m); cust.splice(i, 1); continue; }
    c.m.rotation.y = c.ry; animChar(c.m, mv, T + i); c.m.position.set(c.x, sitY + fxTick(c, dt), c.z);
  }
  const f = front(); if (S.help.counter && f && !f.order.magic && !(mk && mk.c === f)) { fairyT += dt; if (fairyT > 9) { fairyT = 0; const o = f.order; S.served++; earn(price(o), "(Twinkle)"); leave(f, mkTreat(o.type, fcol(o.frost), parseInt(FLAV[o.flavor].done.slice(1), 16))); } } else fairyT = 0;
}

/* ------------------------------ picking magic ingredients ------------------------------ */
function gather(s) {
  const I = ING[s.k], n = I.rare ? 1 : 2; S.inv[s.k] += n; s.ready = 0; s.t = I.rare ? 80 : 38; s.f.visible = s.lab.visible = false; puff(I.e, s.x, 1.6, s.z, 4); SFX.pop(); pop("+" + n + " " + I.e);
  if (!S.tipG) { S.tipG = 1; toast("Magic ingredients go in your 🧺 basket. Mix two different ones into a treat at the ✨ magic table in your bakery to invent a magic recipe!", 8); } save();
}
ACT.basket = () => openM(X + "<h2>🧺 Basket</h2><p>Magic ingredients from the forest. Mix <b>two different ones</b> into a treat at the ✨ magic table to invent a magic recipe!</p><div class=\"grid\">" +
  Object.keys(ING).map(k => '<div class="it' + (ING[k].rare ? " magic" : "") + '"><span>' + ING[k].e + "</span>" + ING[k].n + " ×" + S.inv[k] + "<small>Look for " + ING[k].at + "</small></div>").join("") + "</div>");

/* ------------------------------ recipe book ------------------------------ */
ACT.book = () => {
  const n = MAGIC.filter(m => S.found[m.id]).length;
  openM(X + "<h2>📖 Magic recipe book</h2><p>Magic powers found: <b>" + n + " of " + MAGIC.length + "</b>. Bake at the ✨ magic table and try two different magic ingredients!</p>" +
    MAGIC.map(m => '<div class="bub">' + (S.found[m.id] ? "<b>" + m.e + " " + m.n + "</b> = " + ING[m.a].e + " " + ING[m.a].n + " + " + ING[m.b].e + " " + ING[m.b].n + "<br>Whoever eats it " + m.say + "." + (S.rec[m.id] ? "<br>⭐ On your menu: “" + esc(S.rec[m.id].n) + "” <button class=\"chip\" data-a=\"delRec\" data-v=\"" + m.id + '">✕ take off</button>' : "")
      : "<b>❓ Secret power</b><br>Hint: one part is " + ING[m.a].e + " " + ING[m.a].n + ".") + "</div>").join(""));
};
ACT.delRec = v => { delete S.rec[v]; save(); ACT.book(); };

/* ------------------------------ the shop menu ------------------------------ */
let tab = "decor";
const TABS = { decor: "🪴 Decorate", oven: "🔥 Ovens", grow: "🌳 Bigger bakery", help: "🧚 Helpers", pets: "🐾 Pets" };
ACT.shop = v => {
  if (v && TABS[v]) tab = v; let h = X + "<h2>🛒 Shop</h2><p>You have <b>💰" + S.coins + "</b></p><div class=\"tabs\">" + Object.keys(TABS).map(k => chip(TABS[k], tab === k, "shop", k)).join("") + "</div>";
  if (tab === "decor") {
    h += "<p>Buy something, then walk to where you want it. A pretty bakery gets bigger tips!</p><div class=\"grid\">" + Object.keys(DECOR).map(k => it(DECOR[k].e, DECOR[k].n, "💰" + DECOR[k].cost + (DECOR[k].say ? ", " + DECOR[k].say : ""), "decor", k)).join("") + "</div>";
    h += '<h3>Wallpaper</h3><div class="row">' + WALLS.map(c => sw(c, S.wall === c, "wall")).join("") + '</div><h3>Floor</h3><div class="row">' + FLOORS.map(c => sw(c, S.floor === c, "floor")).join("") + "</div>";
  }
  if (tab === "oven") h += "<p>A better oven bakes faster and has a bigger green part, so treats come out perfect more often.</p><div class=\"grid\">" + OVENS.map((o, i) => it(o.e, o.n, S.oven === i ? "✔ baking with it" : i <= S.ovenMax ? "tap to use it" : "💰" + o.cost, "oven", i, S.oven === i, i ? "magic" : "")).join("") + "</div>";
  if (tab === "grow") { const R = ROOMS[S.lvl], N = ROOMS[S.lvl + 1]; h += "<p>Right now you have a <b>" + R.n + "</b>. It fits " + R.q + " customers in line.</p>" + (N ? '<div class="row"><button class="btn mag" data-a="grow">Grow into a ' + N.n + " for 💰" + N.cost + "</button></div><p>More room to decorate and a longer line of customers.</p>" : "<p>It is the grandest bakery in the whole forest! 🎉</p>"); }
  if (tab === "help") {
    h += "<p>👩‍🍳 <b>" + sisName() + "</b> already works here. She sells treats while you are out in the forest!</p><div class=\"grid\">" + ["counter", "oven"].map(k => it(HELP[k].e, HELP[k].n, S.help[k] ? "✔ works for you" : "💰" + HELP[k].cost + ", " + HELP[k].say, "hire", k, S.help[k], "magic")).join("") + "</div>";
    h += "<h3>" + HELP.friend.e + " " + HELP.friend.n + "</h3><p>" + (S.help.friend ? "<b>" + esc(S.friend) + "</b> picks ingredients for your basket. Tap a name to swap friends." : "💰" + HELP.friend.cost + ". A friend " + HELP.friend.say + ". Tap the friend you want!") + '</p><div class="row">' + PALS.map(n => chip(n, S.friend === n, "hireFriend", n)).join("") + "</div>";
  }
  if (tab === "pets") {
    h += "<p>You can have any pet you want. Tap one to bring it along!</p><div class=\"grid\">" + Object.keys(PETS).map(k => it(ANIMALS[k].e, (S.petNames[k] || PETS[k]) + " the " + ANIMALS[k].n.toLowerCase(), S.pet === k ? "✔ with you now" : "tap to bring along", "pet", k, S.pet === k)).join("") + "</div>";
    h += '<div class="row"><input id="petN" maxlength="14" value="' + esc(petName()) + '"><button class="btn alt" data-a="petName">Name my pet</button></div>';
  }
  openM(h);
};
ACT.decor = k => { if (!pl.inside) return toast("Go up to your bakery first, then buy it."); if (pl.place) return toast("Put down what you are holding first."); if (!pay(DECOR[k].cost)) return; save(); closeM(); startPlace(k); toast("Walk to a good spot, then tap “Put it here”."); };
ACT.wall = v => { S.wall = +v; buildRoom(S); save(); ACT.shop(); }; ACT.floor = v => { S.floor = +v; buildRoom(S); save(); ACT.shop(); };
ACT.oven = v => { const i = +v; if (i > S.ovenMax) { if (i > S.ovenMax + 1) return toast("Buy the " + OVENS[S.ovenMax + 1].n + " first."); if (!pay(OVENS[i].cost)) return; S.ovenMax = i; SFX.yay(); toast("The " + OVENS[i].n + " is in your bakery now!"); } S.oven = i; buildRoom(S); save(); ACT.shop(); };
ACT.grow = () => { const N = ROOMS[S.lvl + 1]; if (!N || !pay(N.cost)) return; S.lvl++; unseat(); buildRoom(S); buildHelpers(); if (pl.inside) { pl.x = 0; pl.z = IZ + RM.cz - 1.25; camSnap = 1; } save(); closeM(); flash(); SFX.yay(); toast("Wow! Your " + N.n + " is open! 🎉"); };
ACT.hire = k => { if (S.help[k] || !pay(HELP[k].cost)) return; S.help[k] = 1; buildHelpers(); save(); SFX.yay(); toast(HELP[k].n + " works for you now!"); ACT.shop(); };
ACT.hireFriend = n => { if (!S.help.friend) { if (!pay(HELP.friend.cost)) return; S.help.friend = 1; SFX.yay(); } S.friend = n; buildHelpers(); save(); toast(n + " is picking ingredients for you now!"); ACT.shop(); };
ACT.pet = k => { S.pet = k; pl.ride = 0; buildPet(); padKey = ""; save(); SFX.yay(); toast(petName() + " is your bakery pet! 🐾"); ACT.shop(); };
ACT.petName = () => { const n = $("petN").value.trim(); if (n) { S.petNames[S.pet] = n; save(); ACT.shop(); } };

/* ------------------------------ decorating ------------------------------ */
function startPlace(k, r) { const g = mkDecor(k); scene.add(g); pl.place = { k, g, r: r || 0 }; }
function putDown() { const p = pl.place, x = clamp(pl.x + Math.sin(pl.ry) * 1.7, -RM.W / 2 + 1, RM.W / 2 - 1), z = clamp(pl.z - IZ + Math.cos(pl.ry) * 1.7, RM.cz + 1.6, RM.D / 2 - 1); scene.remove(p.g); pl.place = null; S.decor.push({ k: p.k, x, z, r: p.r }); unseat(); buildDecor(S); save(); SFX.plop(); }
let decorI = -1;
function decorCard(i) { decorI = i; const d = DECOR[S.decor[i].k]; openM(X + "<h2>" + d.e + " " + d.n + '</h2><div class="row"><button class="btn" data-a="dMove">Move it</button><button class="btn alt" data-a="dTurn">Turn it</button><button class="btn red" data-a="dSell">Sell it for 💰' + Math.round(d.cost / 2) + "</button></div>", 1); }
ACT.dMove = () => { const d = S.decor.splice(decorI, 1)[0]; unseat(); buildDecor(S); closeM(); startPlace(d.k, d.r); };
ACT.dTurn = () => { S.decor[decorI].r = (S.decor[decorI].r || 0) + Math.PI / 4; unseat(); buildDecor(S); save(); };
ACT.dSell = () => { const d = S.decor.splice(decorI, 1)[0]; unseat(); buildDecor(S); closeM(); earn(Math.round(DECOR[d.k].cost / 2)); };

/* ------------------------------ deliveries and the map ------------------------------ */
let deliv = null, delivT = 25;
function newDeliv() {
  const h = pick(HOMES), w = pick(h.who.filter(a => !taken(a[0]))) || h.who[0], m = mkCast(w[1]), a = Math.atan2(h.x - h.rx, h.z - h.rz), x = h.rx + Math.sin(a) * 2.2, z = h.rz + Math.cos(a) * 2.2;
  m.position.set(x, 0, z); m.rotation.y = a + Math.PI; scene.add(m); const l = label("🎁 " + w[0], { h: .6, top: 1 }); l.position.y = 2.6; m.add(l);
  deliv = { name: w[0], h, m, x, z, order: newOrder(!!(ANIMALS[w[1]] && ANIMALS[w[1]].magic)), state: "new", t: 0 }; beam.position.set(h.rx, 20, h.rz); beam.visible = true; SFX.yay(); toast("📜 A note flew in! " + w[0] + " at the " + h.n + " wants a treat delivered. Tap 📜 Orders.", 6); hud();
}
function doDeliver() {
  const d = deliv, tip = Math.max(1, Math.round(9 - d.t / 12)); giveItem(d.m, mkTreat(d.item.type, d.item.fc, d.item.bc)); giveItem(pl.m, null); carry = 0; S.served++; earn(d.pay + tip, "delivery!"); SFX.yay(); puff("💕", d.x, 2.4, d.z, 4);
  const o = { m: d.m, x: d.x, y: 0, z: d.z, ry: d.m.rotation.y, life: 8, fx: null }; if (d.fx) { startFx(o, d.fx, 99); const M = MAGIC.find(q => q.id === d.fx); toast(d.name + " says thank you and " + M.say + "! " + M.e, 5); } else toast(d.name + " says thank you! 💕");
  extras.push(o); beam.visible = false; deliv = null; delivT = rnd(40, 70); hud();
}
function mapHtml() {
  const P = (x, z) => 'style="left:' + ((x + 125) / 250 * 100).toFixed(1) + "%;top:" + ((z + 125) / 250 * 100).toFixed(1) + '%"'; let h = '<div id="map"><button data-a="zipTo" data-v="bakery" ' + P(0, -8) + "><span>🍑</span>Bakery</button>";
  HOMES.forEach(q => { h += '<button data-a="zipTo" data-v="' + q.id + '" ' + P(q.x, q.z) + (deliv && deliv.h === q ? ' class="star"' : "") + "><span>" + q.e + "</span>" + q.s + "</button>"; });
  return h + (pl.inside ? "" : "<i " + P(pl.x, pl.z) + ">📍</i>") + "</div>";
}
ACT.orders = () => {
  let h = X + "<h2>📜 Orders</h2>";
  if (deliv) h += '<div class="tick">' + esc(deliv.name) + " at the <b>" + deliv.h.e + " " + deliv.h.n + "</b> wants: " + ticket(deliv.order) + "</div>" + (deliv.state === "new" ? (pl.inside ? '<div class="row"><button class="btn mag" data-a="mkDeliv">🧁 Bake it now</button></div>' : "<p>Go up to your bakery to bake it.</p>") : "<p>The treat is in its box. Carry it to the " + deliv.h.n + " and follow the yellow light. Delivered treats pay double!</p>");
  else h += "<p>No delivery notes right now. A note will fly in when somebody in the forest wants a treat.</p>";
  openM(h + "<h3>Forest map</h3><p>Outside, tap a place to zip line there.</p>" + mapHtml());
};
ACT.mkDeliv = () => { if (!pl.inside || pl.place) return toast("Put that down first."); openMaker("deliv", deliv.order, null); };
ACT.saveGame = () => { save(); SFX.yay(); pop("💾 Saved!"); toast("Your game is saved, " + S.ch.name + ". It also saves by itself as you play."); };
ACT.redo = () => openM(X + '<h2>🔄 Redo</h2><p>What do you want to redo?</p><div class="grid">' + it("🎨", "My baker", "keep my bakery and coins", "look", "") + it("🐾", "My pet", "pick a different pet", "shop", "pets") + it("🧹", "The whole game", "start over from the beginning", "reset", "") + "</div>");
ACT.reset = () => openM(X + '<h2>Start over?</h2><p>This erases your bakery, your coins and your recipes.</p><div class="row"><button class="btn red" data-a="reset2">Yes, start over</button><button class="btn alt" data-a="close">No, keep my bakery</button></div>');
ACT.reset2 = () => { S = fresh(); save(); location.reload(); };

/* ------------------------------ three ways to travel ------------------------------ */
let padKey = "", zipG = null;
const bub = sph(1.75, 0xcfefff, 0, 0, 0, scene, 1, 1, 1, { transparent: true, opacity: .32, depthWrite: false }); bub.castShadow = false; bub.visible = false;
const canTravel = () => mode === "play" && !pl.inside && !pl.zip && !pl.slide;
ACT.ride = () => { if (!canTravel()) return; pl.bubble = 0; pl.ride = pl.ride ? 0 : 1; if (pl.ride) { SFX.magic(); puff("✨", pl.x, 1.5, pl.z, 6); toast(petName() + " grew big with magic. Hold on tight!"); } else { SFX.pop(); pet.x = pl.x + 1.4; pet.z = pl.z; } };
ACT.bubble = () => { if (!canTravel()) return; pl.ride = 0; pl.bubble = pl.bubble ? 0 : 1; SFX.pop(); if (pl.bubble) toast("You are floating in a magic bubble! Tap it again to pop it."); else puff("🫧", pl.x, pl.y + 1, pl.z, 6); };
ACT.zip = () => { if (!canTravel()) return; openM(X + "<h2>🪢 Zip line</h2><p>Where do you want to zoom to?</p>" + mapHtml()); };
ACT.zipTo = v => {
  if (pl.inside) return toast("Slide down to the forest first. Then you can zip line anywhere!"); if (!canTravel()) return; const h = HOMES.find(q => q.id === v), tx = h ? h.rx : 3, tz = h ? h.rz : 3; closeM();
  const d = Math.hypot(tx - pl.x, tz - pl.z); if (d < 8) return toast("You are already here!");
  pl.ride = pl.bubble = 0; pl.zip = { x0: pl.x, z0: pl.z, x1: tx, z1: tz, t: 0, dur: clamp(d / 26, 1.8, 6) }; pl.ry = Math.atan2(tx - pl.x, tz - pl.z); zipG = new THREE.Group(); scene.add(zipG);
  zipG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(pl.x, 12.7, pl.z), new THREE.Vector3(tx, 3.3, tz)]), new THREE.LineBasicMaterial({ color: 0x4fb873 }))); cyl(.13, .16, 12.7, 0x6fd08a, pl.x, 6.35, pl.z, zipG); sph(.5, 0xffb7d5, pl.x, 12.9, pl.z, zipG);
  SFX.zip(); pop("Wheee!");
};
function endZip() { pl.zip = null; if (zipG) { scene.remove(zipG); zipG = null; } SFX.plop(); if (pet) { pet.x = pl.x + 1.2; pet.z = pl.z; puff("✨", pet.x, .8, pet.z, 3); } }
function padUI() {
  const p = $("pad"), show = mode === "play" && !pl.inside && !pl.slide && !pl.zip && $("modal").hidden; p.hidden = !show; if (!show) return;
  const k = pl.ride + ":" + pl.bubble + S.pet; if (k === padKey) return; padKey = k;
  p.innerHTML = '<button data-a="ride"' + (pl.ride ? ' class="on"' : "") + "><span>" + ANIMALS[S.pet].e + "</span>" + (pl.ride ? "Hop off" : "Ride") + '</button><button data-a="zip"><span>🪢</span>Zip line</button><button data-a="bubble"' + (pl.bubble ? ' class="on"' : "") + "><span>🫧</span>" + (pl.bubble ? "Pop it" : "Bubble") + "</button>";
}

/* ------------------------------ title and baker maker ------------------------------ */
function title() {
  mode = "title"; $("hud").hidden = true; $("act").hidden = true;
  openM("<h1>🍑 Pocket Peaches</h1><p><b>A magic bakery game by Jules</b></p><p>Bake cupcakes, cakes, cookies, brownies, donuts, croissants, bread and pies in your fairy treehouse. Decorate them your way, pick magic ingredients in the forest, invent treats with magic powers, and deliver them by pet, zip line or bubble!</p>" +
    '<div class="row">' + (S.made ? '<button class="btn big" data-a="play">▶ Play</button>' : '<button class="btn big" data-a="who">▶ Start</button>') + "</div>");
}
ACT.who = () => { closeUp = 1; if (pl.inside && mode === "title") { pl.x = 1.4; pl.z = IZ + RM.cz + 1.7; pet.x = pl.x - 1.3; pet.z = pl.z + .4; camSnap = 1; } openM('<h2>Who is the baker?</h2><div class="grid">' + it("👩‍🍳", "Jules", "", "pickWho", "jules") + it("👧", "Nora", "", "pickWho", "nora") + it("🎨", "Make my own", "", "pickWho", "own") + "</div>" + (S.made ? '<div class="row"><button class="btn alt" data-a="lookCard">Keep this baker</button></div>' : ""), 1); };
ACT.look = () => {
  closeM(); if (pl.place) return toast("Put that down first."); if (pl.zip) endZip(); pl.slide = null; pl.ride = pl.bubble = 0; pl.y = 0; if (pl.inside) { pl.x = 1.4; pl.z = IZ + RM.cz + 1.7; } pl.ry = 0; pl.m.position.set(pl.x, 0, pl.z); pl.m.rotation.set(0, 0, 0);
  if (pet) { pet.x = pl.x - 1.3; pet.z = pl.z + .4; } mode = "title"; $("act").hidden = true; $("pad").hidden = true; toastT = .01; camSnap = 1; ACT.who();
};
ACT.pickWho = v => { if (v === "own") { if (S.ch.type !== "own") S.ch = Object.assign({}, S.ch, { type: "own", name: "" }); } else S.ch = Object.assign({}, PRESET[v], { fairy: S.ch.fairy, apron: S.ch.type === v ? S.ch.apron : PRESET[v].apron }); buildPlayer(); lookCard(); };
function lookCard() {
  const c = S.ch; closeUp = 1; let h = "<h2>" + (c.type === "own" ? "🎨 Make your baker" : "👩‍🍳 " + esc(c.name) + " the baker") + "</h2>";
  if (c.type === "own") h += '<div class="row"><input id="chName" maxlength="14" placeholder="Your name" value="' + esc(c.name) + '"></div><div class="row">' + SKINS.map(x => sw(x, c.skin === x, "chSkin")).join("") + '</div><div class="row">' + HAIRS.map(x => sw(x, c.hair === x, "chHair")).join("") + '</div><div class="row">' + Object.keys(STYLES).map(k => chip(STYLES[k], c.style === k, "chSet", "style:" + k)).join("") + "</div>";
  h += '<div class="row">' + chip("👩‍🍳 Baker", !c.fairy, "chNum", "fairy:0") + chip("🧚 Fairy baker", !!c.fairy, "chNum", "fairy:1") + chip(c.hat ? "🎩 Chef hat on" : "🎩 Chef hat off", !!c.hat, "chNum", "hat:" + (c.hat ? 0 : 1)) + "</div>";
  h += '<h3>Apron</h3><div class="row">' + APRONS.map(x => sw(x, c.apron === x, "chApron")).join("") + '</div><div class="row"><button class="btn big" data-a="petCard">Next: pick a pet ➜</button></div>'; openM(h, 1);
}
ACT.lookCard = lookCard;
const keepName = () => { const i = $("chName"); if (i) S.ch.name = i.value.trim(); const p = $("petN0"); if (p && p.value.trim() && p.value.trim() !== PETS[S.pet]) S.petNames[S.pet] = p.value.trim(); };
ACT.chSet = v => { keepName(); const p = v.split(":"); S.ch[p[0]] = p[1]; buildPlayer(); lookCard(); };
ACT.chNum = v => { keepName(); const p = v.split(":"); S.ch[p[0]] = +p[1]; buildPlayer(); lookCard(); };
ACT.chSkin = v => { keepName(); S.ch.skin = +v; buildPlayer(); lookCard(); }; ACT.chHair = v => { keepName(); S.ch.hair = +v; buildPlayer(); lookCard(); }; ACT.chApron = v => { keepName(); S.ch.apron = +v; buildPlayer(); lookCard(); };
function petCard() { closeUp = 1; openM("<h2>🐾 Pick your pet</h2><p>Your pet helps in the bakery and you can ride it in the forest.</p><div class=\"row\">" + Object.keys(PETS).map(k => chip(ANIMALS[k].e + " " + ANIMALS[k].n, S.pet === k, "petPick", k)).join("") + '</div><div class="row"><input id="petN0" maxlength="14" placeholder="Pet name" value="' + esc(petName()) + '"><button class="btn big" data-a="play">✔ Done</button></div>', 1); }
ACT.petCard = () => { keepName(); petCard(); };
ACT.petPick = v => { keepName(); S.pet = v; buildPet(); padKey = ""; SFX.pop(); petCard(); };
ACT.play = () => {
  keepName(); if (!S.ch.name) S.ch.name = "Baker"; const first = !S.made; S.made = 1; save(); closeM(); closeUp = 0; mode = "play"; camSnap = 1; $("hud").hidden = false; hud(); buildHelpers();
  if (first || !S.served) toast("Welcome to Pocket Peaches, " + S.ch.name + "! Walk to the counter. Your first customer is coming! " + (("ontouchstart" in window) ? "Drag on the left side to walk." : "Use the arrow keys or WASD."), 8);
};

/* ------------------------------ input ------------------------------ */
const keys = {}; let joy = null, look = null, camYaw = 0, camPitch = .5;
window.addEventListener("keydown", e => { if (e.target && e.target.tagName === "INPUT") return; keys[e.code] = true; if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault(); if (e.repeat || !$("modal").hidden) return; audio(); if (e.code === "Space" || e.code === "KeyE" || e.code === "Enter") doAct(); });
window.addEventListener("keyup", e => { keys[e.code] = false; });
cv.addEventListener("pointerdown", e => { audio(); $("gamesMenu").hidden = true; if (e.pointerType !== "mouse" && e.clientX < window.innerWidth * .45 && !joy) { joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0 }; $("joyB").hidden = $("joyK").hidden = false; $("joyB").style.left = $("joyK").style.left = e.clientX + "px"; $("joyB").style.top = $("joyK").style.top = e.clientY + "px"; } else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
cv.addEventListener("pointermove", e => { if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), mx = 50; if (l > mx) { dx *= mx / l; dy *= mx / l; } joy.x = dx / mx; joy.y = -dy / mx; $("joyK").style.left = joy.x0 + dx + "px"; $("joyK").style.top = joy.y0 + dy + "px"; }
  else if (look && e.pointerId === look.id) { if (mode === "play" && !pl.inside) { camYaw -= (e.clientX - look.x) * .006; camPitch = clamp(camPitch + (e.clientY - look.y) * .004, .15, 1.1); } look.x = e.clientX; look.y = e.clientY; } });
const pup = e => { if (joy && e.pointerId === joy.id) { joy = null; $("joyB").hidden = $("joyK").hidden = true; } if (look && e.pointerId === look.id) look = null; };
cv.addEventListener("pointerup", pup); cv.addEventListener("pointercancel", pup);
function getInput() { if (mode !== "play" || !$("modal").hidden) return { x: 0, y: 0 }; let x = 0, y = 0; if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1; if (joy) { x += joy.x; y += joy.y; } const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return { x, y }; }
$("act").addEventListener("click", () => { audio(); doAct(); });
$("gamesBtn").addEventListener("click", () => { $("gamesMenu").hidden = !$("gamesMenu").hidden; });
try { Arcade.mountMenu($("gamesMenu")); } catch (e) {}

/* ------------------------------ what the big button does ------------------------------ */
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
let actLabel = "";
function hot() {
  if (pl.place) return { l: "⬇️ Put the " + DECOR[pl.place.k].n.toLowerCase() + " here", f: putDown };
  if (pl.slide || pl.zip) return null;
  if (pl.inside) {
    const lx = pl.x, lz = pl.z - IZ;
    if (Math.abs(lx) < RM.cw / 2 + 1.3 && Math.abs(lz - RM.cz) < 2.8) { const f = front(); if (f) return { l: TYPES[f.order.type].e + " Bake " + f.name + "’s " + TYPES[f.order.type].n, f: () => openMaker("shop", f.order, f) }; }
    if (Math.hypot(lx - RM.lab.x, lz - RM.lab.z) < 1.7) return { l: "✨ Invent a magic treat", f: () => openMaker("invent", null, null) };
    if (Math.hypot(lx - RM.book.x, lz - RM.book.z) < 1.5) return { l: "📖 Open the recipe book", f: ACT.book };
    for (let i = 0; i < S.decor.length; i++) if (Math.hypot(lx - S.decor[i].x, lz - S.decor[i].z) < 1.5) return { l: DECOR[S.decor[i].k].e + " Move the " + DECOR[S.decor[i].k].n.toLowerCase(), f: () => decorCard(i) };
  } else if (!pl.bubble) { const s = SPOTS.find(q => q.ready && Math.hypot(pl.x - q.x, pl.z - q.z) < (pl.ride ? 3.8 : 2.7)); if (s) return { l: ING[s.k].e + " Pick the " + ING[s.k].n.toLowerCase(), f: () => gather(s) }; }
  if (pet && !pl.ride && !pl.bubble && dist(pl, pet) < 1.9) return { l: "💗 Pet " + petName(), f: () => { pop("💗"); SFX.pop(); pet.hop = .5; puff("💗", pet.x, 1.2, pet.z, 2); } };
  return null;
}
function doAct() { if (mode !== "play" || !$("modal").hidden) return; const h = hot(); if (h) h.f(); }

/* ------------------------------ moving around ------------------------------ */
let doorCool = 0, camSnap = 1, T = 0;
function goInside() { pl.inside = 1; pl.ride = pl.bubble = 0; pl.y = 0; pl.x = 0; pl.z = IZ + RM.D / 2 - 3.6; pl.ry = Math.PI; doorCool = 1; camSnap = 1; flash(); puff("✨", pl.x, 1.5, pl.z, 6); pet.x = pl.x + 1; pet.z = pl.z; spawnT = Math.min(spawnT, 1.5); if (awayN) { toast("While you were out, " + sisName() + " sold " + awayN + " treats: +💰" + awayEarn + "!", 5); awayN = awayEarn = 0; save(); } }
function goForest() { pl.inside = 0; pl.slide = { t: 0 }; pl.x = SLIDE[0].x; pl.y = SLIDE[0].y; pl.z = SLIDE[0].z; camSnap = 1; camYaw = -.5; camPitch = .45; flash(); SFX.slide(); pop("Wheee!"); awayT = 0; pet.x = SLIDE[1].x + 1.5; pet.z = SLIDE[1].z + 2; }
function updatePlayer(dt) {
  const inp = getInput(), u = pl.m.userData; doorCool -= dt; let off = 0;
  if (pl.slide) {
    const s = pl.slide, a = SLIDE[0], b = SLIDE[1]; s.t += dt / 1.3; const k = Math.min(1, s.t), e = k * k * .5 + k * .5; pl.x = lerp(a.x, b.x, e); pl.z = lerp(a.z, b.z, e); pl.y = lerp(a.y, b.y, e); pl.ry = Math.atan2(b.x - a.x, b.z - a.z); pl.moving = 0;
    if (k >= 1) { pl.slide = null; pl.y = 0; pl.x = b.x + .5; pl.z = b.z + 1.8; doorCool = 1; if (!S.tipT) { S.tipT = 1; toast("Welcome to the magic forest! Pick ingredients with the big button. The round buttons let you 🐾 ride your pet, 🪢 zip line or float in a 🫧 bubble.", 9); } }
  } else if (pl.zip) {
    const z = pl.zip; z.t += dt / z.dur; const k = Math.min(1, z.t); pl.moving = 0;
    if (k < .12) pl.y = lerp(0, 10.6, k / .12); else { const v = (k - .12) / .88, e = v * v * (3 - 2 * v); pl.x = lerp(z.x0, z.x1, e); pl.z = lerp(z.z0, z.z1, e); pl.y = lerp(10.6, 1.2, e) - Math.sin(v * Math.PI) * 1.2; if (Math.random() < dt * 14) puff("✨", pl.x, pl.y + 1, pl.z, 1); }
    if (k >= 1) endZip();
  } else {
    const yaw = pl.inside ? 0 : camYaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), dx = rx * inp.x + fx * inp.y, dz = rz * inp.x + fz * inp.y, l = Math.hypot(dx, dz);
    pl.moving = l > .1; const sp = (pl.ride ? 14 : pl.bubble ? 9 : S.ch.fairy ? 7 : 6.2) * (pl.fx === "zoom" ? 1.8 : 1);
    if (pl.moving) { pl.x += dx * sp * dt; pl.z += dz * sp * dt; let a = Math.atan2(dx, dz) - pl.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); pl.ry += a * Math.min(1, dt * 14); }
    if (pl.inside) {
      pl.y = 0; pl.x = clamp(pl.x, -RM.W / 2 + .5, RM.W / 2 - .5); pl.z = clamp(pl.z, IZ - RM.D / 2 + 1.3, IZ + RM.D / 2 - .4); pushOut(pl, .45, ROOM_OBS);
      if (doorCool <= 0 && mode === "play" && Math.hypot(pl.x - RM.door.x, pl.z - IZ - RM.door.z) < 1.1) { if (pl.place) { toast("Put that down before you slide out."); doorCool = 2; } else goForest(); }
    } else {
      pl.x = clamp(pl.x, -140, 140); pl.z = clamp(pl.z, -140, 140); if (!pl.bubble && pl.y < 2) pushOut(pl, pl.ride ? 1.1 : .5, OBS);
      pl.y = lerp(pl.y, pl.bubble ? 8 : 0, 1 - Math.exp(-dt * (pl.bubble ? 2 : 5))); if (pl.y < .02) pl.y = 0;
      if (doorCool <= 0 && !pl.bubble && pl.y < 1 && dist(pl, DOOR) < 1.4) goInside();
    }
  }
  pl.m.rotation.y = pl.ry; animChar(pl.m, pl.moving && !pl.ride && !pl.bubble, T);
  if (pl.zip) { u.arms[1].rotation.x = Math.PI; if (!u.hold) u.arms[0].rotation.x = Math.PI; }
  if (pl.ride) { off += pet.m.userData.seat * 2.4 - .36; u.legs[0].rotation.x = u.legs[1].rotation.x = -1.35; u.legs[0].rotation.z = -.5; u.legs[1].rotation.z = .5; }
  else if (S.ch.fairy && !pl.slide) off += .2 + Math.sin(T * 4) * .07;
  off += fxTick(pl, dt); pl.m.position.set(pl.x, pl.y + off, pl.z);
  bub.visible = !!pl.bubble && !pl.inside; if (bub.visible) { bub.position.set(pl.x, pl.y + 1.15 + off, pl.z); bub.scale.setScalar(1.75 * (1 + Math.sin(T * 3) * .04)); }
  if (pl.place) { pl.place.g.position.set(pl.x + Math.sin(pl.ry) * 1.7, .25 + Math.sin(T * 5) * .06, pl.z + Math.cos(pl.ry) * 1.7); pl.place.g.rotation.y = pl.place.r; }
  if (deliv && deliv.state === "made" && !pl.inside && !pl.zip && !pl.slide && Math.hypot(pl.x - deliv.h.rx, pl.z - deliv.h.rz) < (pl.bubble || pl.ride ? 4.5 : 2.6)) { pl.bubble = 0; doDeliver(); }
}
function updatePet(dt) {
  const g = pet.m;
  if (pl.ride && !pl.inside) { pet.x = pl.x; pet.z = pl.z; pet.ry = pl.ry; g.scale.setScalar(2.4); g.position.set(pl.x, pl.y + (pl.moving ? Math.abs(Math.sin(T * 10)) * .16 : 0), pl.z); g.rotation.y = pl.ry; g.visible = true; animPet(g, pl.moving, T); return; }
  g.scale.setScalar(1); g.visible = !pl.zip; const d = dist(pl, pet); pet.mv = d > 1.7; if (d > 16) { pet.x = pl.x + 1; pet.z = pl.z; }
  if (pet.mv) { const s = Math.min(d - 1.5, (pl.bubble ? 10 : 8) * dt); pet.x += (pl.x - pet.x) / d * s; pet.z += (pl.z - pet.z) / d * s; pet.ry = Math.atan2(pl.x - pet.x, pl.z - pet.z); }
  pet.hop = Math.max(0, pet.hop - dt); g.position.set(pet.x, (pl.bubble || pl.slide ? Math.max(0, pl.y - 1) : 0) + (pet.hop > 0 ? Math.abs(Math.sin(pet.hop * 12)) * .25 : 0) + (pet.mv ? Math.abs(Math.sin(T * 12)) * .08 : 0), pet.z); g.rotation.y = pet.ry; animPet(g, pet.mv, T);
  if (!pl.inside && !pl.zip && !pl.slide) { pet.findT -= dt * (S.pet === "bunny" ? 1.6 : 1); if (pet.findT <= 0) { pet.findT = rnd(45, 80); const k = pick(["berry", "berry", "moon", "honey", "egg"]); S.inv[k]++; pet.hop = .7; puff(ING[k].e, pet.x, 1.2, pet.z, 2); toast(petName() + " found " + ING[k].e + " for your basket!", 2.5); save(); } }
}
function updateMisc(dt) {
  if (!deliv && S.served >= 2) { delivT -= dt; if (delivT <= 0) newDeliv(); } if (deliv) { if (deliv.state === "made") deliv.t += dt; animChar(deliv.m, 0, T); beam.material.opacity = .25 + .12 * Math.sin(T * 4); }
  SPOTS.forEach((s, i) => { if (!s.ready) { s.t -= dt; if (s.t <= 0) { s.ready = 1; s.f.visible = s.lab.visible = true; } } else s.lab.position.y = s.ly + Math.sin(T * 2.4 + i) * .15; });
  for (let i = extras.length - 1; i >= 0; i--) { const o = extras[i]; o.life -= dt; animChar(o.m, 0, T); o.m.rotation.y = o.ry; o.m.position.y = fxTick(o, dt); if (o.life <= 0) { scene.remove(o.m); extras.splice(i, 1); } }
  if (S.help.friend && S.friend) { friendT -= dt; if (friendT <= 0) { friendT = rnd(40, 60); const k = pick(["berry", "moon", "honey", "egg", "berry", "moon", Math.random() < .25 ? "star" : "honey", Math.random() < .25 ? "dew" : "egg"]); S.inv[k]++; toast(S.friend + " picked " + ING[k].e + " for your basket!", 2.5); save(); } }
  const h = hot(), l = h ? h.l : ""; if (l !== actLabel) { actLabel = l; $("act").textContent = l; } $("act").hidden = !h || !$("modal").hidden; padUI();
}
const camT = new THREE.Vector3(), camL = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCam(dt) {
  if (mode === "title" && closeUp) { camT.set(pl.x - .5, 1.6, pl.z + 7.2); camL.set(pl.x - .5, -.6, pl.z); pl.m.rotation.y = Math.sin(T * .8) * .5; }
  else if (pl.inside) { const a = camera.aspect < 1 ? 1.5 : 1; camT.set(pl.x * .55, (7 + RM.D * .32) * a, IZ + RM.D / 2 + (4.5 + RM.D * .22) * a); camL.set(pl.x * .55, 1, IZ - .8); }
  else { const d = 10.5 + (pl.ride ? 3 : 0) + (pl.bubble || pl.zip ? 4 : 0), c = Math.cos(camPitch); camT.set(pl.x + Math.sin(camYaw) * d * c, pl.y + 1.5 + d * Math.sin(camPitch), pl.z + Math.cos(camYaw) * d * c); camL.set(pl.x, pl.y + 1.4, pl.z); }
  const k = camSnap ? 1 : 1 - Math.exp(-dt * 7); camSnap = 0; camera.position.lerp(camT, k); camLook.lerp(camL, k); camera.lookAt(camLook); SKY.position.copy(camera.position);
  sun.position.set(camL.x + 18, 40, camL.z + 14); sun.target.position.copy(camL);
}

/* ------------------------------ main loop ------------------------------ */
function step(dt) {
  T += dt;
  if (mode === "play") { updatePlayer(dt); updatePet(dt); updateCust(dt); updateMisc(dt); }
  else { animChar(pl.m, 0, T); pl.m.position.set(pl.x, (S.ch.fairy ? .2 + Math.sin(T * 4) * .07 : 0), pl.z); pet.m.scale.setScalar(1); pet.m.visible = true; pet.m.position.set(pet.x, 0, pet.z); pet.m.rotation.y = .4; animPet(pet.m, 0, T); bub.visible = false; }
  if (mk) mkTick(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast").style.opacity = 0; }
  rings.forEach((r, i) => { const s = 1 + Math.sin(T * 3 + i) * .08; r.scale.set(s, s, 1); });
  fairies.forEach(f => { f.m.position.y = f.y + Math.sin(T * 2.2 + f.ph) * .18; f.m.rotation.y = Math.sin(T * .7 + f.ph) * .6; animChar(f.m, 0, T + f.ph); });
  tickFlies(T); tickParts(dt); updateCam(dt); renderer.render(scene, camera);
}
let last = 0;
function frame(t) { const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; step(dt); requestAnimationFrame(frame); }
window.__step = n => { for (let i = 0; i < (n || 1); i++) step(1 / 30); };

if (S.ovenMax == null) S.ovenMax = S.oven || 0; if (!S.found) S.found = {}; if (!PETS[S.pet]) S.pet = "dragon";
buildRoom(S); buildDecor(S); pl.z = IZ + RM.cz - 1.25; buildPlayer(); buildPet(); buildHelpers();
title(); requestAnimationFrame(frame);
