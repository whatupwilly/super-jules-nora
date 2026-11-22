"use strict";
/* ===========================================================================
   Bubble Tea Town, by Nora. game.js
   Save, menus, the drink maker, customers, money, the shop menu, decorating,
   the truck, deliveries, helpers, the pet and the camera.
   =========================================================================== */
const SAVE_KEY = Arcade.key("bobaSave");
const NORA = { type: "nora", name: "Nora", skin: 0xf6cfa8, hair: 0x6b4226, style: "pig", apron: 0xff7fb0, animal: "pug" };
function fresh() { return { v: 1, made: 0, ch: Object.assign({}, NORA), money: 20, own: {}, lvl: 0, decor: [], wall: 0xffe3ef, floor: 0xf3d9b0, truck: { own: 0, col: 0xff8fc0, top: "cup" }, help: {}, pets: {}, pet: null, petNames: {}, rec: {}, mine: [], served: 0 }; }
let S = null; try { S = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {} if (!S || S.v !== 1) S = fresh();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

/* ------------------------------ what goes in a drink ------------------------------ */
const PEARL = { tapioca: { n: "Tapioca pearls", e: "⚫", c: ["#3a2418", "#4a2e1e"] }, popping: { n: "Popping boba", e: "🟠", c: ["#ff9a3d", "#ffb866", "#ff7f6a"], cost: 30 },
  rainbow: { n: "Rainbow pearls", e: "🌈", c: ["#ff6b8b", "#ffb347", "#ffe66d", "#6fdc8c", "#6fb8ff", "#b98bff"], cost: 80, magic: 1 }, glow: { n: "Glowing boba", e: "✨", c: ["#9ffcff", "#d6ffb0", "#fff7a8"], cost: 120, magic: 1, glow: 1 } };
const TEA = { milk: { n: "Milk tea", e: "🟤", c: "#cfa67c" }, straw: { n: "Strawberry milk", e: "🍓", c: "#ff9fc0" }, taro: { n: "Taro", e: "🟣", c: "#b79be0", cost: 25 }, matcha: { n: "Matcha", e: "🍵", c: "#a6d48c", cost: 25 },
  mango: { n: "Mango fruit tea", e: "🥭", c: "#ffc34a", cost: 40 }, sparkle: { n: "Sparkle tea", e: "💖", c: "#ff9fe0", c2: "#9fd0ff", cost: 100, magic: 1 }, magic: { n: "Color-change tea", e: "🔮", c: "#d9a0ff", cost: 150, magic: 1 } };
const TOP = { none: { n: "No topping", e: "🚫" }, jelly: { n: "Jelly", e: "🟩", cost: 20 }, pudding: { n: "Pudding", e: "🍮", cost: 30 }, foam: { n: "Cloud foam", e: "☁️", cost: 60, magic: 1 }, star: { n: "Star jelly", e: "⭐", cost: 90, magic: 1 } };
const SNACK = { cookie: { n: "Cookie", e: "🍪", p: 2 }, mochi: { n: "Mochi", e: "🍡", cost: 40, p: 3 }, waffle: { n: "Waffle", e: "🧇", cost: 60, p: 4 }, icecream: { n: "Ice cream", e: "🍦", cost: 80, p: 5 } };
const ALL = Object.assign({}, PEARL, TEA, TOP, SNACK);
const SECRETS = [
  { id: "panda", n: "Panda Cloud", e: "🐼", pearl: "tapioca", tea: "milk", top: "foam" }, { id: "pug", n: "Peach the Pug Special", e: "🐶", pearl: "tapioca", tea: "milk", top: "pudding" },
  { id: "snow", n: "Strawberry Snow", e: "🍓", pearl: "tapioca", tea: "straw", top: "pudding", ice: true }, { id: "mermaid", n: "Mermaid Lagoon", e: "🧜", pearl: "popping", tea: "matcha", top: "jelly" },
  { id: "dragon", n: "Dragon Fire", e: "🐲", pearl: "popping", tea: "mango", top: "jelly", ice: false }, { id: "unicorn", n: "Unicorn Dream", e: "🦄", pearl: "rainbow", tea: "straw", top: "foam" },
  { id: "volcano", n: "Rainbow Volcano", e: "🌋", pearl: "rainbow", tea: "mango", top: "star" }, { id: "galaxy", n: "Galaxy Glow", e: "🌌", pearl: "glow", tea: "taro", top: "star" },
  { id: "fairy", n: "Fairy Sparkle", e: "🧚", pearl: "rainbow", tea: "sparkle", top: "star" }, { id: "moon", n: "Moonlight", e: "🌙", pearl: "glow", tea: "magic", top: "foam" }];
const has = id => !ALL[id].cost || !!S.own[id];
const owned = T => Object.keys(T).filter(has);
const val = id => Math.round((ALL[id].cost || 0) / 20);
const price = o => 6 + val(o.pearl) + val(o.tea) + val(o.top) + (o.snack ? SNACK[o.snack].p : 0);
const hex = c => "#" + c.toString(16).padStart(6, "0");
const teaHex = id => parseInt(TEA[id].c.slice(1), 16);
const cozy = () => Math.min(10, S.decor.length) * .04;
function newOrder(magic) {
  const got = SECRETS.filter(s => S.rec[s.id] && has(s.pearl) && has(s.tea) && has(s.top));
  if (got.length && Math.random() < (magic ? .5 : .15)) { const s = pick(got); return { pearl: s.pearl, tea: s.tea, top: s.top, ice: s.ice == null ? Math.random() < .5 : s.ice, snack: null, special: s.e + " " + s.n }; }
  if (S.mine.length && Math.random() < .2) { const m = pick(S.mine); if (has(m.pearl) && has(m.tea) && has(m.top)) return { pearl: m.pearl, tea: m.tea, top: m.top, ice: m.ice, snack: null, special: "your “" + m.n + "”" }; }
  const tops = owned(TOP).filter(t => t !== "none");
  return { pearl: pick(owned(PEARL)), tea: pick(owned(TEA)), top: tops.length && Math.random() < .55 ? pick(tops) : "none", ice: Math.random() < .6, snack: Math.random() < .3 ? pick(owned(SNACK)) : null };
}
function ticket(o) { return (o.special ? "<div>" + esc(o.special) + "</div>" : "") + PEARL[o.pearl].e + " " + PEARL[o.pearl].n + " · " + TEA[o.tea].e + " " + TEA[o.tea].n + " · " + (o.ice ? "🧊 Ice" : "No ice") + (o.top !== "none" ? " · " + TOP[o.top].e + " " + TOP[o.top].n : "") + (o.snack ? " · " + SNACK[o.snack].e + " " + SNACK[o.snack].n : ""); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* ------------------------------ sound ------------------------------ */
let AC = null;
function audio() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} if (AC && AC.state === "suspended") AC.resume(); }
function beep(f, d, type, v, slide) { if (!AC) return; try { const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime; o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d); g.gain.setValueAtTime(v || .1, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); } catch (e) {} }
const SFX = { pop: () => beep(520, .09, "sine", .12, 1.7), plop: () => beep(220, .12, "sine", .16, .5), no: () => beep(210, .2, "sawtooth", .05, .6), shake: () => beep(800 + Math.random() * 500, .05, "square", .03),
  coin: () => { beep(880, .08, "square", .05); setTimeout(() => beep(1320, .16, "square", .05), 80); }, yay: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .18, "triangle", .1), i * 90)), pour: () => beep(260 + Math.random() * 90, .07, "sine", .03) };

/* ------------------------------ little UI helpers ------------------------------ */
let mode = "title", toastT = 0;
function toast(m, s) { const t = $("toast"); t.textContent = m; t.hidden = false; t.style.opacity = 1; toastT = s || 3.5; }
function pop(m) { const p = $("pop"); p.textContent = m; p.classList.remove("show"); void p.offsetWidth; p.classList.add("show"); }
function flash() { const d = $("dark"); d.style.transition = "none"; d.style.opacity = .9; void d.offsetWidth; d.style.transition = "opacity .5s"; d.style.opacity = 0; }
function openM(html, low) { $("modalCard").innerHTML = html; $("modal").className = low ? "ov low" : "ov"; $("modal").hidden = false; $("modalCard").scrollTop = 0; }
function closeM() { $("modal").hidden = true; mk = null; }
const X = '<button class="x" data-a="close">✕</button>';
function hud() { const n = deliv ? (deliv.state === "new" ? " ❗" : " 🧋") : ""; $("hud").innerHTML = '<span class="pill">💰 <b>$' + S.money + '</b></span><button data-a="shop">🛒 Shop</button><button data-a="book">📖 Recipes</button><button data-a="phone">📱 Phone' + n + "</button>"; }
function earn(n, why) { S.money += n; pop("+$" + n + (why ? " " + why : "")); SFX.coin(); hud(); save(); }
function pay(n) { if (S.money < n) { SFX.no(); toast("You need $" + n + ". Sell some more drinks first!"); return false; } S.money -= n; SFX.coin(); hud(); return true; }
const sw = (c, on, a) => '<button class="sw' + (on ? " on" : "") + '" style="background:' + hex(c) + '" data-a="' + a + '" data-v="' + c + '"></button>';
const chip = (t, on, a, v) => '<button class="chip' + (on ? " on" : "") + '" data-a="' + a + '" data-v="' + v + '">' + t + "</button>";
const ACT = {};
function click(e) { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; audio(); const f = ACT[b.dataset.a]; if (f) f(b.dataset.v, b); }
$("modalCard").addEventListener("click", click); $("hud").addEventListener("click", click);
ACT.close = () => closeM();

/* ------------------------------ player, pet, helpers ------------------------------ */
const pl = { x: 0, z: IZ + 1.5, ry: 0, inside: 1, drive: 0, sell: null, place: null, m: null, moving: 0 };
const SKINS = [0xffe0c4, 0xf6cfa8, 0xe0ac7e, 0xc68a5c, 0x8d5a3b, 0x5c3a26], HAIRS = [0x2c2230, 0x6b4226, 0xa86a3a, 0xf2d16b, 0xff7f50, 0xff8fd0, 0x9a6bff, 0x5fc8f0, 0x7fdc8c, 0xffffff];
const APRONS = [0xff7fb0, 0xb99bff, 0x7fd0ff, 0x8fdc9c, 0xffd84a, 0xff9a5a, 0xffffff], STYLES = { pig: "Pigtails", pony: "Ponytail", long: "Long", bun: "Bun", short: "Short" };
const WALLS = [0xffe3ef, 0xe6dcff, 0xdff3ff, 0xe3f7df, 0xfff3c9, 0xffd9c4], FLOORS = [0xf3d9b0, 0xffd9ea, 0xd9ecff, 0xe0d0c0, 0xcdeccd], TRUCKC = [0xff8fc0, 0xb99bff, 0x7fd0ff, 0x8fdc9c, 0xffd84a, 0xff9a5a, 0xffffff, 0x5fd0c0];
function buildPlayer() { const had = pl.m && pl.m.userData.hold ? carryCol : null; if (pl.m) scene.remove(pl.m); const c = S.ch; pl.m = c.type === "animal" ? mkChar({ kind: c.animal, apron: c.apron }) : mkChar({ skin: c.skin, hair: c.hair, style: c.style, apron: c.apron }); scene.add(pl.m); if (had != null) giveCup(pl.m, had); }
let carryCol = null;
const PETS = { pug: "Peach", kitten: "Biscuit", bunny: "Clover", panda: "Bamboo" };
let pet = null;
const petName = () => S.petNames[S.pet] || PETS[S.pet];
function buildPet() { if (pet) scene.remove(pet.m); pet = null; if (!S.pet) return; pet = { m: mkPet(S.pet), x: pl.x + 1, z: pl.z + 1, ry: 0, mv: 0 }; scene.add(pet.m); }
const HELP = { barista: { n: "Bao the barista", e: "🧑‍🍳", cost: 150, say: "makes drinks at the counter, even when you are out" }, greeter: { n: "Kiki the greeter", e: "🙋", cost: 120, say: "keeps customers happy longer, so tips are bigger" }, buddy: { n: "Max the truck buddy", e: "🚚", cost: 200, say: "helps serve the line at your truck" } };
const helpG = new THREE.Group(); scene.add(helpG); let buddyM = null;
function buildHelpers() {
  clearGroup(helpG);
  if (S.help.barista) { const m = mkChar({ skin: 0xe0ac7e, hair: 0x2c2230, style: "short", apron: 0x7fd0ff }); m.position.set(-RM.cw / 2 + 2, 0, IZ + RM.cz - 1.3); helpG.add(m); const l = label("Bao", { h: .5 }); l.position.y = 2.3; m.add(l); }
  if (S.help.greeter) { const m = mkChar({ skin: 0xffe0c4, hair: 0xff8fd0, style: "bun", apron: 0xffd84a }); m.position.set(3.2, 0, IZ + RM.D / 2 - 2.4); m.rotation.y = -2.4; helpG.add(m); const l = label("Kiki", { h: .5 }); l.position.y = 2.3; m.add(l); }
  if (buddyM) { tr.m.remove(buddyM); buddyM = null; }
  if (S.help.buddy) { buddyM = mkChar({ skin: 0xc68a5c, hair: 0x6b4226, style: "short", apron: 0x8fdc9c }); buddyM.position.set(2.3, 0, -2.9); buddyM.rotation.y = Math.PI / 2; tr.m.add(buddyM); }
}

/* ------------------------------ the truck ------------------------------ */
const tr = { x: TRUCK_HOME.x, z: TRUCK_HOME.z, a: TRUCK_HOME.a, v: 0, m: mkTruck(S.truck.col, S.truck.top) };
scene.add(tr.m); tr.m.visible = !!S.truck.own;
SPOTS.forEach(s => { const b = sph(1.7, 0xff7fb0, s.x, 15, s.z); b.castShadow = false; cyl(.04, .04, 12, 0xffffff, s.x, 9, s.z).castShadow = false; });
const toWorld = (lx, lz) => ({ x: tr.x + lx * Math.cos(tr.a) + lz * Math.sin(tr.a), z: tr.z - lx * Math.sin(tr.a) + lz * Math.cos(tr.a) });
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function startSell(s) {
  tr.v = 0; pl.drive = 0; pl.sell = s; pl.m.visible = true; s.lab.visible = false; const n = 5; SFX.yay(); toast("Window open at the " + s.n + "! Here comes a line.");
  for (let i = 0; i < n; i++) { const c = spawnCust("truck", i); const p = slotPos(c), a = Math.random() * 6.28; c.x = p.x + Math.cos(a) * rnd(9, 15); c.z = p.z + Math.sin(a) * rnd(9, 15); }
}
function endSell(sold) {
  const s = pl.sell; if (!s) return; s.cool = 70; s.lab.visible = true; setLabel(s.lab, "💤 " + s.n + " is resting", { h: 1.3, top: 1 }); s.ring.visible = false;
  cust.forEach(c => { if (c.where === "truck" && c.state === "wait") leave(c, null); }); pl.sell = null; pl.drive = 1; pl.m.visible = false; camSnap = 1;
  toast(sold ? "Sold out at the " + s.n + "! 🎉 Drive to another spot." : "Window closed. Off we go!");
}
function hopOut() { const p = toWorld(-2.6, 1.5); pl.x = p.x; pl.z = p.z; pl.drive = 0; pl.m.visible = true; tr.v = 0; if (pet) { pet.x = pl.x; pet.z = pl.z; } }

/* ------------------------------ customers ------------------------------ */
const cust = [];
const FRIENDS = ["Jules", "Mom", "Dad", "Grandma", "Grandpa", "Sonia", "Naeun", "Lucas", "Charlotte", "Christina", "DJ", "Aunt Lily", "Mia", "Zoe", "Ben", "Nora"];
const ANIM_C = [["Peach", "pug"], ["Biscuit", "kitten"], ["Clover", "bunny"], ["Bamboo", "panda"], ["Mochi", "bunny"], ["Pudding", "pug"], ["Mittens", "kitten"], ["Dumpling", "panda"]];
const MAGIC_C = [["Starlight", "unicorn"], ["Ember", "dragon"], ["Petal", "fairy"], ["Snowdrop", "unicorn"], ["Zuzu", "dragon"], ["Twinkle", "fairy"]];
const SHIRTS = [0xffffff, 0xffd9ea, 0xd9ecff, 0xfff3c9, 0xe3f7df, 0xe6dcff, 0xff9a5a, 0x7fd0ff];
function castOne() {
  for (let i = 0; i < 12; i++) {
    const r = Math.random(); let name, kind = "person";
    if (r < .42) name = pick(FRIENDS); else if (r < .76) { const a = pick(ANIM_C); name = a[0]; kind = a[1]; } else { const a = pick(MAGIC_C); name = a[0]; kind = a[1]; }
    if (name === S.ch.name || (pet && name === petName()) || cust.some(c => c.name === name) || (deliv && deliv.name === name)) continue; return { name, kind };
  }
  return { name: "A new friend", kind: "person" };
}
function mkCast(k) { return mkChar({ kind: k, skin: pick(SKINS), hair: pick(HAIRS), style: pick(Object.keys(STYLES)), shirt: pick(SHIRTS), pants: pick([0x6a78b8, 0xff9fc0, 0x8fdc9c, 0xb99bff]) }); }
const FACES = ["🙂", "😊", "😍"];
function bubble(c) { return FACES[c.face] + " " + (c.order.special ? "⭐ " : "") + PEARL[c.order.pearl].e + TEA[c.order.tea].e + (c.order.top !== "none" ? TOP[c.order.top].e : "") + (c.order.ice ? "🧊" : "") + (c.order.snack ? SNACK[c.order.snack].e : ""); }
function spawnCust(where, slot) {
  const w = castOne(), magic = w.kind === "unicorn" || w.kind === "dragon" || w.kind === "fairy";
  const c = { name: w.name, kind: w.kind, magic, where, slot, state: "wait", order: newOrder(magic), pat: 1, face: 2, arr: 0, t: 0, x: 0, z: IZ + RM.D / 2 - .8, ry: Math.PI, m: mkCast(w.kind) };
  c.bub = label(bubble(c), { h: .62, top: 1 }); c.bub.position.y = 2.75; c.m.add(c.bub); const nl = label(c.name, { h: .34, top: 1 }); nl.position.y = 2.2; c.m.add(nl);
  scene.add(c.m); cust.push(c); return c;
}
function slotPos(c) { return c.where === "shop" ? { x: 0, z: IZ + RM.cz + 1.9 + c.slot * 1.5 } : toWorld(3.8 + c.slot * 1.4, -.5); }
const front = w => cust.find(c => c.where === w && c.state === "wait" && c.slot === 0 && c.arr);
const seats = {};
function freeSeat() { for (let i = 0; i < S.decor.length; i++) if (S.decor[i].k === "table") for (const s of [-1, 1]) if (!seats[i + ":" + s]) { const d = S.decor[i], r = d.r || 0; return { key: i + ":" + s, x: d.x + Math.cos(r) * s * 1.15, z: IZ + d.z - Math.sin(r) * s * 1.15 }; } return null; }
function leave(c, cupCol) {
  if (c.bub) { c.m.remove(c.bub); c.bub = null; } if (cupCol != null) giveCup(c.m, cupCol);
  cust.forEach(o => { if (o !== c && o.where === c.where && o.state === "wait" && o.slot > c.slot) { o.slot--; o.arr = 0; } });
  const st = c.where === "shop" && cupCol != null ? freeSeat() : null;
  if (st) { c.state = "sit"; c.seat = st.key; seats[st.key] = 1; c.tx = st.x; c.tz = st.z; c.t = 0; }
  else { c.state = "out"; if (c.where === "shop") { c.tx = 0; c.tz = IZ + RM.D / 2 - .3; } else { const a = Math.atan2(c.x - tr.x, c.z - tr.z) + rnd(-.6, .6); c.tx = c.x + Math.sin(a) * 16; c.tz = c.z + Math.cos(a) * 16; } }
}
function unseat() { cust.forEach(c => { if (c.state === "sit") { delete seats[c.seat]; c.state = "out"; c.m.position.y = 0; c.tx = 0; c.tz = IZ + RM.D / 2 - .3; } }); for (const k in seats) delete seats[k]; }
let spawnT = 2, baristaT = 0, buddyT = 0, awayT = 0, awayEarn = 0, awayN = 0;
function updateCust(dt) {
  const R = ROOMS[S.lvl];
  if (pl.inside) { spawnT -= dt; if (spawnT <= 0) { const n = cust.filter(c => c.where === "shop" && c.state === "wait").length; if (n < R.q) spawnCust("shop", n); spawnT = rnd(7, 13) - S.lvl; } }
  else if (S.help.barista) { awayT += dt; if (awayT > 16) { awayT = 0; const o = newOrder(); awayEarn += price(o); awayN++; S.money += price(o); S.served++; hud(); } }
  for (let i = cust.length - 1; i >= 0; i--) {
    const c = cust[i]; let tx, tz; if (c.state === "wait") { const p = slotPos(c); tx = p.x; tz = p.z; } else { tx = c.tx; tz = c.tz; }
    const dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz), mv = d > .12;
    if (mv) { const s = Math.min(d, 3.2 * dt); c.x += dx / d * s; c.z += dz / d * s; c.ry = Math.atan2(dx, dz); }
    else if (c.state === "wait") { c.arr = 1; c.ry = c.where === "shop" ? Math.PI : tr.a - Math.PI / 2; if (c.where === "truck" || pl.inside) c.pat = Math.max(0, c.pat - dt / (50 * (S.help.greeter ? 2 : 1))); const f = c.pat > .62 ? 2 : c.pat > .28 ? 1 : 0; if (f !== c.face) { c.face = f; setLabel(c.bub, bubble(c), { h: .62, top: 1 }); } }
    else if (c.state === "sit") { c.t += dt; c.m.position.y = -.18; if (c.t > 11) { delete seats[c.seat]; c.state = "out"; c.m.position.y = 0; c.tx = 0; c.tz = IZ + RM.D / 2 - .3; } }
    else if (c.state === "out") { scene.remove(c.m); cust.splice(i, 1); continue; }
    c.m.position.x = c.x; c.m.position.z = c.z; c.m.rotation.y = c.ry; animChar(c.m, mv, T + i);
  }
  /* helpers serve by themselves */
  const fs = front("shop"); if (S.help.barista && fs && !(mk && mk.c === fs)) { baristaT += dt; if (baristaT > 8) { baristaT = 0; autoServe(fs, "Bao"); } } else baristaT = 0;
  const ft = front("truck"); if (S.help.buddy && pl.sell && ft && !(mk && mk.c === ft)) { buddyT += dt; if (buddyT > 9) { buddyT = 0; autoServe(ft, "Max"); } } else buddyT = 0;
  if (pl.sell && !mk && !cust.some(c => c.where === "truck" && c.state === "wait")) endSell(1);
}
function autoServe(c, who) { const p = Math.round(price(c.order) * (c.where === "truck" ? 1.5 : 1)); S.served++; earn(p, "(" + who + ")"); leave(c, teaHex(c.order.tea)); }

/* ------------------------------ the drink maker ------------------------------ */
let mk = null;
const STEPS = [["cook", "Cook the pearls"], ["scoop", "Scoop the pearls"], ["tea", "Pick the tea and pour"], ["ice", "Ice?"], ["top", "Pick a topping"], ["shake", "Lid on, then shake!"], ["straw", "Poke the straw"], ["snack", "A snack on the side?"]];
const STRAWS = [0xff5fa2, 0x7fd0ff, 0xffd84a, 0x8fdc9c, 0xb99bff, 0x2c2230];
function openMaker(kind, order, c) {
  mk = { kind, order, c, step: 0, pearl: owned(PEARL)[0], cooked: 0, stir: 0, drops: [], scoops: 0, tea: "milk", fill: 0, pour: 0, ice: 0, top: "none", lid: 0, lidT: 0, shakes: 0, wob: 0, straw: STRAWS[0], strawT: 0, strawOn: 0, snack: null, t: 0, done: 0 };
  openM(X + '<h2 id="mkT"></h2>' + (order ? '<div class="tick">' + (c ? esc(c.name) : esc(deliv.name)) + " wants " + ticket(order) + "</div>" : '<p>Mix anything you like. There are secret recipes to find!</p>') + '<canvas id="mk" width="520" height="580"></canvas><div id="mkc"></div>');
  toastT = .01; mkUI();
}
function mkUI() {
  if (!mk || mk.done) return; const s = STEPS[mk.step][0]; $("mkT").textContent = (mk.step + 1) + " of 8: " + STEPS[mk.step][1]; let h = "";
  const next = (lab, dis) => '<button class="btn" id="mkNext" data-a="mkNext"' + (dis ? " disabled" : "") + ">" + (lab || "Next ➜") + "</button>";
  const chips = (T, cur, a) => '<div class="row">' + owned(T).map(id => chip(T[id].e + " " + T[id].n, cur === id, a, id)).join("") + "</div>";
  if (s === "cook") h = chips(PEARL, mk.pearl, "mkPearl") + '<div class="bar"><i id="mkBar" style="width:' + mk.cooked * 100 + '%"></i></div><div class="row"><button class="btn big mag" data-a="mkStir">🥄 Stir!</button></div>';
  if (s === "scoop") h = '<div class="row"><button class="btn big mag" data-a="mkScoop"' + (mk.scoops >= 3 ? " disabled" : "") + ">🥄 Scoop! (" + mk.scoops + " of 3)</button>" + next(0, !mk.scoops) + "</div>";
  if (s === "tea") h = chips(TEA, mk.tea, "mkTea") + '<p>Hold the button. Stop at the pink line!</p><div class="row"><button class="btn big mag" id="pourB">🫖 Hold to pour</button>' + next(0, mk.fill < .45) + "</div>";
  if (s === "ice") h = '<div class="row"><button class="btn big mag" data-a="mkIce"' + (mk.ice >= 4 ? " disabled" : "") + ">🧊 Add ice</button>" + next(mk.ice ? 0 : "No ice ➜") + "</div>";
  if (s === "top") h = chips(TOP, mk.top, "mkTop") + '<div class="row">' + next() + "</div>";
  if (s === "shake") h = '<div class="row">' + (mk.lid ? '<button class="btn big mag" data-a="mkShake">🤝 Shake! (' + mk.shakes + " of 8)</button>" : '<button class="btn big mag" data-a="mkLid">🥤 Lid on!</button>') + "</div>";
  if (s === "straw") h = '<div class="row">' + STRAWS.map(c => sw(c, mk.straw === c, "mkStrawC")).join("") + '</div><div class="row"><button class="btn big mag" data-a="mkStraw">👇 Poke the straw!</button></div>';
  if (s === "snack") h = '<div class="row">' + chip("No snack", !mk.snack, "mkSnack", "") + owned(SNACK).map(id => chip(SNACK[id].e + " " + SNACK[id].n, mk.snack === id, "mkSnack", id)).join("") + '</div><div class="row">' + next("✔ All done!") + "</div>";
  $("mkc").innerHTML = h;
}
function mkGo() { mk.step++; SFX.pop(); if (mk.step >= STEPS.length) mkFinish(); else mkUI(); }
ACT.mkNext = () => mkGo();
ACT.mkPearl = v => { mk.pearl = v; mkUI(); };
ACT.mkStir = () => { if (mk.cooked >= 1) return; mk.cooked = Math.min(1, mk.cooked + .14); mk.stir += 1.6; SFX.plop(); $("mkBar").style.width = mk.cooked * 100 + "%"; if (mk.cooked >= 1) { SFX.yay(); const m = mk; setTimeout(() => { if (mk === m && m.step === 0) mkGo(); }, 500); } };
function addScoop(d, quiet) { for (let j = 0; j < 8; j++) { const i = d.drops.length, row = Math.floor(i / 7), col = i % 7; d.drops.push({ x: 130 + (col - 3) * 12.5 + (row % 2 ? 5 : 0) + rnd(-1.5, 1.5), ty: 246 - row * 11.5, y: quiet ? 400 : 20 - j * 9, c: pick(PEARL[d.pearl].c) }); } }
ACT.mkScoop = () => { if (mk.scoops >= 3) return; mk.scoops++; addScoop(mk); SFX.plop(); mkUI(); };
ACT.mkTea = v => { mk.tea = v; mkUI(); };
ACT.mkIce = () => { if (mk.ice < 4) { mk.ice++; SFX.pop(); mkUI(); } };
ACT.mkTop = v => { mk.top = v; SFX.pop(); mkUI(); };
ACT.mkLid = () => { mk.lid = 1; SFX.plop(); mkUI(); };
ACT.mkShake = () => { if (mk.shakes >= 8) return; mk.shakes++; mk.wob = 1; SFX.shake(); if (mk.shakes >= 8) { SFX.yay(); const m = mk; setTimeout(() => { if (mk === m && STEPS[m.step][0] === "shake") mkGo(); }, 450); } else mkUI(); };
ACT.mkStrawC = v => { mk.straw = +v; mkUI(); };
ACT.mkStraw = () => { if (mk.strawOn) return; mk.strawOn = 1; SFX.plop(); const m = mk; setTimeout(() => { if (mk === m && STEPS[m.step][0] === "straw") mkGo(); }, 650); };
ACT.mkSnack = v => { mk.snack = v || null; SFX.pop(); mkUI(); };
$("modalCard").addEventListener("pointerdown", e => { if (mk && e.target.id === "pourB") { audio(); mk.pour = 1; try { e.target.setPointerCapture(e.pointerId); } catch (err) {} } });
["pointerup", "pointercancel"].forEach(ev => window.addEventListener(ev, () => { if (mk && mk.pour) { mk.pour = 0; mkUI(); } }));
function mkTick(dt) {
  mk.t += dt; mk.stir = Math.max(0, mk.stir - dt * 3); mk.wob = Math.max(0, mk.wob - dt * 2.5);
  if (mk.pour && mk.fill < 1) { mk.fill = Math.min(1, mk.fill + dt * .42); if (Math.random() < .3) SFX.pour(); const b = $("mkNext"); if (b) b.disabled = mk.fill < .45; }
  if (mk.lid) mk.lidT = Math.min(1, mk.lidT + dt * 4); if (mk.strawOn) mk.strawT = Math.min(1, mk.strawT + dt * 2.2);
  mk.drops.forEach(p => { p.y = Math.min(p.ty, p.y + 520 * dt); });
  const c = $("mk"); if (!c) return; const g = c.getContext("2d"); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 260, 290);
  if (mk.step === 0 && !mk.done) return drawPot(g);
  g.save(); g.translate(130, 255); g.rotate(Math.sin(mk.t * 38) * mk.wob * .13); g.translate(-130, -255); drawCup(g, mk, mk.t); g.restore();
  if (mk.pour && mk.fill < 1) { g.fillStyle = teaCol(g, mk.tea, mk.t); g.fillRect(124, 0, 12, 255 - mk.fill * 180); }
  if (STEPS[Math.min(7, mk.step)][0] === "tea" && !mk.done) { g.strokeStyle = "#ff5fa2"; g.lineWidth = 3; g.setLineDash([7, 5]); g.beginPath(); g.moveTo(52, 111); g.lineTo(208, 111); g.stroke(); g.setLineDash([]); }
  if (mk.snack && (mk.done || STEPS[mk.step][0] === "snack")) { g.font = "44px serif"; g.textAlign = "center"; g.fillText(SNACK[mk.snack].e, 226, 262); }
}
function teaCol(g, id, t) { const T = TEA[id]; if (id === "magic") return "hsl(" + ((t * 70) % 360) + ",80%,76%)"; if (T.c2) { const gr = g.createLinearGradient(0, 70, 0, 255); gr.addColorStop(0, T.c2); gr.addColorStop(1, T.c); return gr; } return T.c; }
function cupPath(g) { g.beginPath(); g.moveTo(62, 60); g.lineTo(198, 60); g.lineTo(180, 246); g.quadraticCurveTo(179, 256, 170, 256); g.lineTo(90, 256); g.quadraticCurveTo(81, 256, 80, 246); g.closePath(); }
function starPath(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
function drawCup(g, d, t) {
  const lv = 255 - d.fill * 180;
  g.save(); cupPath(g); g.fillStyle = "rgba(255,255,255,.8)"; g.fill(); g.clip();
  if (d.fill > 0) {
    g.fillStyle = teaCol(g, d.tea, t); g.fillRect(40, lv, 180, 262 - lv);
    if (d.tea === "sparkle" || d.tea === "magic") { g.fillStyle = "#fff"; for (let i = 0; i < 12; i++) { const a = .5 + .5 * Math.sin(t * 4 + i * 2); g.globalAlpha = a; starPath(g, 70 + (i * 53) % 120, lv + 12 + (i * 37) % Math.max(10, 240 - lv), 3 + a * 3); g.fill(); } g.globalAlpha = 1; }
    if (d.top === "pudding") { g.fillStyle = "#ffd76a"; g.fillRect(40, lv, 180, 20); g.fillStyle = "#c9843a"; g.fillRect(40, lv, 180, 6); }
    if (d.top === "jelly" || d.top === "star") for (let i = 0; i < 8; i++) { const x = 76 + i * 15 + Math.sin(i * 5) * 5, y = Math.max(lv + 12, 228 - (i * 41) % 90) + Math.sin(t * 1.6 + i) * 2;
      if (d.top === "jelly") { g.fillStyle = ["rgba(110,220,150,.85)", "rgba(255,150,190,.85)"][i % 2]; g.save(); g.translate(x, y); g.rotate(i); rr(g, -6, -6, 12, 12, 3); g.fill(); g.restore(); } else { g.fillStyle = "#ffe45c"; g.strokeStyle = "#e0a800"; g.lineWidth = 1; starPath(g, x, y, 8); g.fill(); g.stroke(); } }
    for (let i = 0; i < d.ice; i++) { g.save(); g.translate(86 + i * 29, lv + 13 + Math.sin(t * 2 + i) * 2); g.rotate(.3 + i * .7); g.fillStyle = "rgba(255,255,255,.62)"; g.strokeStyle = "rgba(160,210,255,.9)"; g.lineWidth = 2; rr(g, -11, -11, 22, 22, 5); g.fill(); g.stroke(); g.restore(); }
    if (d.top === "foam") { g.fillStyle = "#fff"; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(56 + i * 19, lv + 3 + Math.sin(t * 2 + i) * 1.5, 13, 0, 6.3); g.fill(); } }
  }
  const P = PEARL[d.pearl]; d.drops.forEach(p => { if (P.glow) { g.shadowColor = p.c; g.shadowBlur = 10 + 5 * Math.sin(t * 5 + p.x); } g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 6, 0, 6.3); g.fill(); g.shadowBlur = 0; g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(p.x - 2, p.y - 2, 1.6, 0, 6.3); g.fill(); });
  g.restore();
  cupPath(g); g.strokeStyle = "rgba(150,110,135,.55)"; g.lineWidth = 3; g.stroke(); g.fillStyle = "rgba(255,255,255,.4)"; rr(g, 80, 76, 9, 140, 4); g.fill();
  if (d.strawOn) { g.strokeStyle = hex(d.straw); g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(166, -30 + d.strawT * 40); g.lineTo(166 - d.strawT * 34, 10 + d.strawT * 220); g.stroke(); g.lineCap = "butt"; }
  if (d.lid) { const y = 60 - (1 - d.lidT) * 90; g.fillStyle = "rgba(255,255,255,.55)"; g.strokeStyle = "rgba(150,110,135,.55)"; g.lineWidth = 3; g.beginPath(); g.moveTo(60, y); g.quadraticCurveTo(130, y - 78, 200, y); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#ff9fc6"; rr(g, 54, y - 5, 152, 11, 5); g.fill(); }
}
function drawPot(g) {
  const t = mk.t, P = PEARL[mk.pearl];
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? "#ffb347" : "#ff7f50"; g.beginPath(); const x = 80 + i * 25, h = 22 + Math.sin(t * 9 + i * 2) * 8; g.moveTo(x - 12, 272); g.quadraticCurveTo(x, 272 - h * 2, x + 12, 272); g.fill(); }
  g.fillStyle = "#8a8f9c"; rr(g, 48, 130, 164, 122, 22); g.fill(); g.fillStyle = "#6f7480"; rr(g, 26, 150, 28, 14, 7); g.fill(); rr(g, 206, 150, 28, 14, 7); g.fill();
  g.fillStyle = "#bfe6ff"; g.beginPath(); g.ellipse(130, 134, 78, 22, 0, 0, 6.3); g.fill();
  for (let i = 0; i < 16; i++) { const x = 130 + Math.cos(i * 2.4 + mk.stir * .8 + t * .3) * (20 + (i * 13) % 46), y = 134 + Math.sin(i * 2.4 + mk.stir * .8 + t * .3) * (5 + (i * 7) % 12) + Math.sin(t * 6 + i) * 1.5;
    g.fillStyle = "#efe3d6"; g.beginPath(); g.arc(x, y, 6.5, 0, 6.3); g.fill(); g.globalAlpha = mk.cooked; g.fillStyle = P.c[i % P.c.length]; g.beginPath(); g.arc(x, y, 6.5, 0, 6.3); g.fill(); g.globalAlpha = 1; }
  for (let i = 0; i < 6; i++) { const k = (t * .6 + i / 6) % 1; g.globalAlpha = (1 - k) * .5; g.fillStyle = "#fff"; g.beginPath(); g.arc(70 + i * 24 + Math.sin(t * 2 + i) * 6, 118 - k * 80, 8 + k * 10, 0, 6.3); g.fill(); } g.globalAlpha = 1;
  const a = Math.sin(mk.stir * 2) * .5; g.strokeStyle = "#c98a5a"; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(130 + Math.sin(a) * 70, 40); g.lineTo(130 - Math.sin(a) * 30, 136); g.stroke(); g.lineCap = "butt";
}
function mkFinish() {
  const m = mk, d = { pearl: m.pearl, tea: m.tea, top: m.top, ice: m.ice > 0, snack: m.snack }; m.done = 1;
  const sec = SECRETS.find(s => s.pearl === d.pearl && s.tea === d.tea && s.top === d.top && (s.ice == null || s.ice === d.ice)), isNew = sec && !S.rec[sec.id];
  let h = ""; if (isNew) { S.rec[sec.id] = 1; S.money += 25; h += '<div class="tick">🎉 Secret recipe found: <b>' + sec.e + " " + sec.n + "</b>! +$25</div>"; } else if (sec) h += "<p>That is a " + sec.e + " <b>" + sec.n + "</b>!</p>";
  if (m.kind === "invent") {
    $("mkT").textContent = "Your own drink!"; SFX.yay();
    h += '<p>Give it a name and put it on your menu. Customers will ask for it!</p><div class="row"><input id="mkName" maxlength="18" placeholder="Name your drink"></div><div class="row"><button class="btn" data-a="mkSave">⭐ Put it on my menu</button><button class="btn alt" data-a="close">Just for fun</button></div>'; m.made = d;
  } else {
    const o = m.order, miss = []; let ok = 0, n = 4;
    if (d.pearl === o.pearl) ok++; else miss.push(PEARL[o.pearl].n); if (d.tea === o.tea) ok++; else miss.push(TEA[o.tea].n); if (d.top === o.top) ok++; else miss.push(TOP[o.top].n.toLowerCase()); if (d.ice === o.ice) ok++; else miss.push(o.ice ? "ice" : "no ice");
    if (o.snack) { n++; if (d.snack === o.snack) ok++; else miss.push("a " + SNACK[o.snack].n.toLowerCase()); }
    const frac = ok / n, stars = Math.max(1, Math.round(frac * 5)), base = price(o), mult = m.kind === "truck" ? 1.5 : m.kind === "deliv" ? 2 : 1;
    let p = Math.round(base * (.4 + .6 * frac) * mult) + (o.special ? 5 : 0), tip = 0; const good = Math.abs(m.fill - .8) < .09;
    if (m.c && stars >= 4) tip = Math.round(base * .5 * m.c.pat * (1 + cozy()) * (m.c.magic ? 2 : 1)); if (good) tip += 1;
    $("mkT").textContent = stars >= 5 ? "Perfect!" : stars >= 3 ? "Yummy!" : "Good try!";
    h += '<div class="stars">' + "⭐".repeat(stars) + "☆".repeat(5 - stars) + "</div>" + (miss.length ? "<p>They wanted " + miss.join(" and ") + ".</p>" : "") + (good ? "<p>Perfect pour! 🎯</p>" : "");
    if (m.kind === "deliv") { deliv.state = "made"; deliv.pay = p + tip; deliv.col = teaHex(d.tea); carryCol = deliv.col; giveCup(pl.m, carryCol); h += "<p>Now carry it to the <b>" + deliv.h.n + " house</b>. Follow the yellow light!</p>"; if (isNew) SFX.yay(); hud(); save(); }
    else { S.served++; h += "<p><b>+$" + p + "</b>" + (tip ? " and a <b>$" + tip + " tip</b>" + (m.c.magic ? " (magic tip!)" : "") : "") + "</p>"; earn(p + tip); if (stars >= 5) SFX.yay(); leave(m.c, teaHex(d.tea)); }
    h += '<div class="row"><button class="btn" data-a="close">Yay!</button></div>';
  }
  if (isNew) { hud(); save(); } $("mkc").innerHTML = h;
}
ACT.mkSave = () => { const n = ($("mkName").value || "").trim() || "Mystery boba"; S.mine.unshift(Object.assign({ n }, { pearl: mk.made.pearl, tea: mk.made.tea, top: mk.made.top, ice: mk.made.ice })); S.mine.length = Math.min(8, S.mine.length); save(); closeM(); SFX.yay(); toast("“" + n + "” is on your menu now!"); };

/* ------------------------------ recipe book ------------------------------ */
const recLine = r => PEARL[r.pearl].e + " " + PEARL[r.pearl].n + " + " + TEA[r.tea].e + " " + TEA[r.tea].n + (r.top !== "none" ? " + " + TOP[r.top].e + " " + TOP[r.top].n : "") + (r.ice === true ? " + 🧊" : r.ice === false ? ", no ice" : "");
ACT.book = () => {
  const n = SECRETS.filter(s => S.rec[s.id]).length;
  openM(X + "<h2>📖 Recipe book</h2><p>Secret recipes found: <b>" + n + " of " + SECRETS.length + "</b>. Try mixing things in the 🧪 lab!</p>" +
    SECRETS.map(s => '<div class="bub" style="max-width:100%;width:auto">' + (S.rec[s.id] ? "<b>" + s.e + " " + s.n + "</b><br>" + recLine(s) : "<b>❓ Secret drink</b><br>Hint: it has " + TEA[s.tea].e + " " + TEA[s.tea].n + (has(s.tea) ? "" : " (buy it in the shop)")) + "</div>").join("") +
    "<h3>My own drinks</h3>" + (S.mine.length ? S.mine.map((m, i) => '<div class="bub" style="max-width:100%;width:auto"><b>⭐ ' + esc(m.n) + "</b> <button class=\"chip\" data-a=\"delMine\" data-v=\"" + i + '">✕</button><br>' + recLine(m) + "</div>").join("") : "<p>Invent a drink at the 🧪 lab and name it.</p>"));
};
ACT.delMine = v => { S.mine.splice(+v, 1); save(); ACT.book(); };

/* ------------------------------ the shop menu ------------------------------ */
let tab = "flavors";
const TABS = { flavors: "🧋 Flavors", decor: "🪴 Decorate", grow: "🏠 Bigger shop", truck: "🚚 Truck", help: "🧑‍🍳 Helpers", pets: "🐾 Pets" };
ACT.shop = v => {
  if (v && TABS[v]) tab = v; let h = X + "<h2>🛒 Shop</h2><p>You have <b>$" + S.money + "</b></p><div class=\"tabs\">" + Object.keys(TABS).map(k => chip(TABS[k], tab === k, "shop", k)).join("") + "</div>";
  const it = (e, n, sub, a, v, dis, magic) => '<button class="it' + (magic ? " magic" : "") + '" data-a="' + a + '" data-v="' + v + '"' + (dis ? " disabled" : "") + "><span>" + e + "</span>" + n + "<small>" + sub + "</small></button>";
  if (tab === "flavors") { [["Pearls", PEARL], ["Teas", TEA], ["Toppings", TOP], ["Snacks", SNACK]].forEach(g => { h += "<h3>" + g[0] + '</h3><div class="grid">' + Object.keys(g[1]).filter(id => id !== "none").map(id => it(g[1][id].e, g[1][id].n, has(id) ? "✔ you have it" : "$" + g[1][id].cost, "buy", id, has(id), g[1][id].magic)).join("") + "</div>"; }); }
  if (tab === "decor") {
    h += "<p>Buy something, then walk to where you want it. A pretty shop gets bigger tips!</p><div class=\"grid\">" + Object.keys(DECOR).map(k => it(DECOR[k].e, DECOR[k].n, "$" + DECOR[k].cost + (DECOR[k].say ? ", " + DECOR[k].say : ""), "decor", k)).join("") + "</div>";
    h += '<h3>Wall color</h3><div class="row">' + WALLS.map(c => sw(c, S.wall === c, "wall")).join("") + '</div><h3>Floor color</h3><div class="row">' + FLOORS.map(c => sw(c, S.floor === c, "floor")).join("") + "</div>";
  }
  if (tab === "grow") { const R = ROOMS[S.lvl], N = ROOMS[S.lvl + 1]; h += "<p>Right now you have a <b>" + R.n + "</b>. It fits " + R.q + " customers in line.</p>" + (N ? '<div class="row"><button class="btn mag" data-a="grow">Grow into a ' + N.n + " for $" + N.cost + "</button></div><p>More room to decorate and a longer line of customers.</p>" : "<p>It is the biggest boba café in town! 🎉</p>"); }
  if (tab === "truck") {
    if (!S.truck.own) h += '<p>Drive your own boba truck around town and sell at the 🏖 beach, the 🌳 park and the 🏫 school. Drinks cost more at the truck!</p><div class="row"><button class="btn mag" data-a="buyTruck">🚚 Buy the boba truck for $250</button></div>';
    else h += '<p>Your truck is parked next to the shop.</p><h3>Paint</h3><div class="row">' + TRUCKC.map(c => sw(c, S.truck.col === c, "paint")).join("") + '</div><h3>On the roof</h3><div class="row">' + [["cup", "🧋 Giant cup"], ["pearl", "⚫ Giant pearl"], ["star", "⭐ Star"], ["heart", "💗 Heart"], ["none", "Nothing"]].map(t => chip(t[1], S.truck.top === t[0], "roof", t[0])).join("") + "</div>";
  }
  if (tab === "help") h += '<div class="grid">' + Object.keys(HELP).map(k => it(HELP[k].e, HELP[k].n, S.help[k] ? "✔ works for you" : "$" + HELP[k].cost + ", " + HELP[k].say, "hire", k, S.help[k])).join("") + "</div>";
  if (tab === "pets") {
    h += '<div class="grid">' + Object.keys(PETS).map(k => it(ANIMALS[k].e, (S.petNames[k] || PETS[k]) + " the " + ANIMALS[k].n.toLowerCase(), S.pet === k ? "✔ with you now" : S.pets[k] ? "tap to bring along" : "$60", "pet", k, S.pet === k)).join("") + "</div>";
    if (S.pet) h += '<div class="row"><input id="petN" maxlength="14" value="' + esc(petName()) + '"><button class="btn alt" data-a="petName">Name my pet</button></div>';
  }
  openM(h);
};
ACT.buy = id => { if (has(id) || !pay(ALL[id].cost)) return; S.own[id] = 1; save(); SFX.yay(); toast(ALL[id].e + " " + ALL[id].n + " is in your shop now!"); ACT.shop(); };
ACT.decor = k => { if (!pl.inside || pl.sell || pl.drive) return toast("Go inside your shop first, then buy it."); if (pl.place) return toast("Put down what you are holding first."); if (!pay(DECOR[k].cost)) return; save(); closeM(); startPlace(k); toast("Walk to a good spot, then tap “Put it here”."); };
ACT.wall = v => { S.wall = +v; buildRoom(S); save(); ACT.shop(); }; ACT.floor = v => { S.floor = +v; buildRoom(S); save(); ACT.shop(); };
ACT.grow = () => { const N = ROOMS[S.lvl + 1]; if (!N || !pay(N.cost)) return; S.lvl++; unseat(); buildRoom(S); buildHelpers(); if (pl.inside) { pl.x = 0; pl.z = IZ + RM.cz - 1.25; camSnap = 1; } save(); closeM(); flash(); SFX.yay(); toast("Wow! Your " + N.n + " is open! 🎉"); };
ACT.buyTruck = () => { if (!pay(250)) return; S.truck.own = 1; tr.m.visible = true; save(); SFX.yay(); toast("The boba truck is yours! It is parked outside your shop."); ACT.shop(); };
ACT.paint = v => { S.truck.col = +v; tr.m.userData.paint.color.setHex(+v); save(); ACT.shop(); }; ACT.roof = v => { S.truck.top = v; setTruckTop(tr.m, v); save(); ACT.shop(); };
ACT.hire = k => { if (S.help[k] || !pay(HELP[k].cost)) return; S.help[k] = 1; buildHelpers(); save(); SFX.yay(); toast(HELP[k].n + " works for you now!"); ACT.shop(); };
ACT.pet = k => { if (!S.pets[k]) { if (!pay(60)) return; S.pets[k] = 1; SFX.yay(); } S.pet = k; buildPet(); save(); toast(petName() + " is your shop pet! 🐾"); ACT.shop(); };
ACT.petName = () => { const n = $("petN").value.trim(); if (n) { S.petNames[S.pet] = n; save(); ACT.shop(); } };

/* ------------------------------ decorating ------------------------------ */
function startPlace(k, r) { const g = mkDecor(k); scene.add(g); pl.place = { k, g, r: r || 0 }; }
function putDown() { const p = pl.place, x = clamp(pl.x + Math.sin(pl.ry) * 1.7, -RM.W / 2 + 1, RM.W / 2 - 1), z = clamp(pl.z - IZ + Math.cos(pl.ry) * 1.7, RM.cz + 1.6, RM.D / 2 - 1); scene.remove(p.g); pl.place = null; S.decor.push({ k: p.k, x, z, r: p.r }); unseat(); buildDecor(S); save(); SFX.plop(); }
let decorI = -1;
function decorCard(i) { decorI = i; const d = DECOR[S.decor[i].k]; openM(X + "<h2>" + d.e + " " + d.n + '</h2><div class="row"><button class="btn" data-a="dMove">Move it</button><button class="btn alt" data-a="dTurn">Turn it</button><button class="btn red" data-a="dSell">Sell it for $' + Math.round(d.cost / 2) + "</button></div>", 1); }
ACT.dMove = () => { const d = S.decor.splice(decorI, 1)[0]; unseat(); buildDecor(S); closeM(); startPlace(d.k, d.r); };
ACT.dTurn = () => { S.decor[decorI].r = (S.decor[decorI].r || 0) + Math.PI / 4; unseat(); buildDecor(S); save(); };
ACT.dSell = () => { const d = S.decor.splice(decorI, 1)[0]; unseat(); buildDecor(S); closeM(); earn(Math.round(DECOR[d.k].cost / 2)); };

/* ------------------------------ deliveries and the phone ------------------------------ */
let deliv = null, delivT = 25;
function newDeliv() {
  const w = castOne(), h = pick(HOUSES), m = mkCast(w.kind); m.position.set(h.rx, 0, h.rz - h.d * 1.9); m.rotation.y = h.d > 0 ? 0 : Math.PI; scene.add(m);
  const l = label("📱 " + w.name, { h: .6, top: 1 }); l.position.y = 2.5; m.add(l);
  deliv = { name: w.name, h, m, order: newOrder(), state: "new", t: 0 }; beam.position.set(h.rx, 20, h.rz); beam.visible = true; SFX.yay(); toast("📱 " + w.name + " wants a drink delivered to the " + h.n + " house! Tap the phone.", 5); hud();
}
function doDeliver() { const d = deliv, tip = Math.max(1, Math.round(9 - d.t / 12)); giveCup(d.m, d.col); giveCup(pl.m, null); carryCol = null; S.served++; earn(d.pay + tip, "delivery!"); SFX.yay(); toast(d.name + " says thank you! 💕"); const m = d.m; setTimeout(() => scene.remove(m), 5000); beam.visible = false; deliv = null; delivT = rnd(35, 60); hud(); }
ACT.phone = () => {
  let h = X + "<h2>📱 Phone</h2>";
  if (deliv) h += '<div class="tick">' + esc(deliv.name) + " at the <b>" + deliv.h.n + " house</b> wants " + ticket(deliv.order) + "</div>" + (deliv.state === "new" ? (pl.inside ? '<div class="row"><button class="btn mag" data-a="mkDeliv">🧋 Make it now</button></div>' : "<p>Go back inside your shop to make it.</p>") : "<p>The drink is ready. Carry it to the " + deliv.h.n + " house and follow the yellow light. Delivered drinks pay double!</p>");
  else h += "<p>No delivery orders right now. Your phone will ring when somebody wants one.</p>";
  h += '<h3>Where things are</h3><p>The houses are on the street by your shop. 🏖 Beach: follow the road right. 🌳 Park: follow the road left. 🏫 School: up the side road on the left. Look for the pink balloons!</p>';
  h += '<div class="row"><button class="btn alt" data-a="home">🏠 Zoom back to my shop</button><button class="btn alt" data-a="look">🎨 Change my character</button><button class="btn red" data-a="reset">Start over</button></div>';
  openM(h);
};
ACT.mkDeliv = () => { if (!pl.inside || pl.place) return toast("Put that down first."); openMaker("deliv", deliv.order, null); };
ACT.home = () => { closeM(); if (pl.place) return toast("Put that down first."); if (pl.sell) endSell(0); if (pl.drive) { pl.drive = 0; pl.m.visible = true; } tr.x = TRUCK_HOME.x; tr.z = TRUCK_HOME.z; tr.a = TRUCK_HOME.a; tr.v = 0; goInside(); };
ACT.reset = () => openM(X + '<h2>Start over?</h2><p>This erases your shop, your money and your recipes.</p><div class="row"><button class="btn red" data-a="reset2">Yes, start over</button><button class="btn alt" data-a="close">No, keep my shop</button></div>');
ACT.reset2 = () => { S = fresh(); save(); location.reload(); };

/* ------------------------------ title and character maker ------------------------------ */
function title() {
  mode = "title"; $("hud").hidden = true; $("act").hidden = true;
  openM("<h1>🧋 Bubble Tea Town</h1><p><b>A boba shop game by Nora</b></p><p>Cook pearls, pour tea, shake it up and serve friends, animals and magic creatures. Invent your own drinks, find secret recipes, decorate your shop and drive a boba truck!</p>" +
    '<div class="row">' + (S.made ? '<button class="btn big" data-a="play">▶ Play</button>' : '<button class="btn big" data-a="who">▶ Start</button>') + "</div>");
}
ACT.who = () => openM('<h2>Who runs the shop?</h2><div class="grid"><button class="it" data-a="pickWho" data-v="nora"><span>👧</span>Nora</button><button class="it" data-a="pickWho" data-v="me"><span>🎨</span>Make my own</button><button class="it" data-a="pickWho" data-v="animal"><span>🐾</span>An animal</button></div>', 1);
ACT.look = () => { closeM(); if (pl.drive || pl.sell || !pl.inside) return toast("Go inside your shop to change your look."); mode = "title"; $("act").hidden = true; ACT.who(); };
ACT.pickWho = v => { if (v === "nora") { S.ch = Object.assign({}, NORA); buildPlayer(); return ACT.play(); } S.ch.type = v; if (S.ch.name === "Nora") S.ch.name = ""; buildPlayer(); lookCard(); };
function lookCard() {
  const c = S.ch; let h = "<h2>" + (c.type === "animal" ? "🐾 Pick your animal" : "🎨 Make your character") + '</h2><div class="row"><input id="chName" maxlength="14" placeholder="Your name" value="' + esc(c.name) + '"></div>';
  if (c.type === "animal") h += '<div class="row">' + ["pug", "kitten", "bunny", "panda"].map(k => chip(ANIMALS[k].e + " " + ANIMALS[k].n, c.animal === k, "chSet", "animal:" + k)).join("") + "</div>";
  else h += '<div class="row">' + SKINS.map(x => sw(x, c.skin === x, "chSkin")).join("") + '</div><div class="row">' + HAIRS.map(x => sw(x, c.hair === x, "chHair")).join("") + '</div><div class="row">' + Object.keys(STYLES).map(k => chip(STYLES[k], c.style === k, "chSet", "style:" + k)).join("") + "</div>";
  h += '<h3>Apron</h3><div class="row">' + APRONS.map(x => sw(x, c.apron === x, "chApron")).join("") + '</div><div class="row"><button class="btn big" data-a="play">✔ Done</button></div>'; openM(h, 1);
}
const keepName = () => { const i = $("chName"); if (i) S.ch.name = i.value.trim(); };
ACT.chSet = v => { keepName(); const p = v.split(":"); S.ch[p[0]] = p[1]; buildPlayer(); lookCard(); };
ACT.chSkin = v => { keepName(); S.ch.skin = +v; buildPlayer(); lookCard(); }; ACT.chHair = v => { keepName(); S.ch.hair = +v; buildPlayer(); lookCard(); }; ACT.chApron = v => { keepName(); S.ch.apron = +v; buildPlayer(); lookCard(); };
ACT.play = () => {
  keepName(); if (!S.ch.name) S.ch.name = S.ch.type === "animal" ? ANIMALS[S.ch.animal].n : "Boss"; const first = !S.made; S.made = 1; save(); closeM(); mode = "play"; $("hud").hidden = false; hud();
  if (first || !S.served) toast("Welcome, " + S.ch.name + "! Walk to the counter. Your first customer is coming! " + (("ontouchstart" in window) ? "Drag on the left side to walk." : "Use the arrow keys or WASD."), 7);
};

/* ------------------------------ input ------------------------------ */
const keys = {}; let joy = null, look = null, camYaw = 0, camPitch = .5;
window.addEventListener("keydown", e => { if (e.target && e.target.tagName === "INPUT") return; keys[e.code] = true; if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault(); if (e.repeat || !$("modal").hidden) return; audio(); if (e.code === "Space" || e.code === "KeyE" || e.code === "Enter") doAct(); });
window.addEventListener("keyup", e => { keys[e.code] = false; });
cv.addEventListener("pointerdown", e => { audio(); $("gamesMenu").hidden = true; if (e.pointerType !== "mouse" && e.clientX < window.innerWidth * .45 && !joy) { joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0 }; $("joyB").hidden = $("joyK").hidden = false; $("joyB").style.left = $("joyK").style.left = e.clientX + "px"; $("joyB").style.top = $("joyK").style.top = e.clientY + "px"; } else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
cv.addEventListener("pointermove", e => { if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), mx = 50; if (l > mx) { dx *= mx / l; dy *= mx / l; } joy.x = dx / mx; joy.y = -dy / mx; $("joyK").style.left = joy.x0 + dx + "px"; $("joyK").style.top = joy.y0 + dy + "px"; }
  else if (look && e.pointerId === look.id) { if (mode === "play" && !pl.inside && !pl.drive && !pl.sell) { camYaw -= (e.clientX - look.x) * .006; camPitch = clamp(camPitch + (e.clientY - look.y) * .004, .15, 1.1); } look.x = e.clientX; look.y = e.clientY; } });
const pup = e => { if (joy && e.pointerId === joy.id) { joy = null; $("joyB").hidden = $("joyK").hidden = true; } if (look && e.pointerId === look.id) look = null; };
cv.addEventListener("pointerup", pup); cv.addEventListener("pointercancel", pup);
function getInput() { if (mode !== "play" || !$("modal").hidden) return { x: 0, y: 0 }; let x = 0, y = 0; if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1; if (joy) { x += joy.x; y += joy.y; } const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return { x, y }; }
$("act").addEventListener("click", () => { audio(); doAct(); });
$("gamesBtn").addEventListener("click", () => { $("gamesMenu").hidden = !$("gamesMenu").hidden; });
try { Arcade.mountMenu($("gamesMenu")); } catch (e) {}

/* ------------------------------ what the big button does ------------------------------ */
let curHot = null, actLabel = "";
function hot() {
  if (pl.place) return { l: "⬇️ Put the " + DECOR[pl.place.k].n.toLowerCase() + " here", f: putDown };
  if (pl.sell) { const f = front("truck"); return f ? { l: "🧋 Make " + f.name + "’s drink", f: () => openMaker("truck", f.order, f) } : { l: "🚚 Close the window and drive", f: () => endSell(0) }; }
  if (pl.drive) { const s = SPOTS.find(s => s.cool <= 0 && dist(tr, s) < 8); return s ? { l: s.e + " Park and sell here", f: () => startSell(s) } : { l: "🚶 Hop out", f: hopOut }; }
  if (pl.inside) {
    const lx = pl.x, lz = pl.z - IZ;
    if (Math.abs(lx) < RM.cw / 2 + 1.3 && Math.abs(lz - RM.cz) < 2.8) { const f = front("shop"); if (f) return { l: "🧋 Make " + f.name + "’s drink", f: () => openMaker("shop", f.order, f) }; }
    if (Math.hypot(lx - RM.lab.x, lz - RM.lab.z) < 1.6) return { l: "🧪 Invent a drink", f: () => openMaker("invent", null, null) };
    if (Math.hypot(lx - RM.book.x, lz - RM.book.z) < 1.5) return { l: "📖 Open the recipe book", f: ACT.book };
    for (let i = 0; i < S.decor.length; i++) if (Math.hypot(lx - S.decor[i].x, lz - S.decor[i].z) < 1.5) return { l: DECOR[S.decor[i].k].e + " Move the " + DECOR[S.decor[i].k].n.toLowerCase(), f: () => decorCard(i) };
  } else if (S.truck.own && dist(pl, tr) < 5) return { l: "🚚 Drive the boba truck", f: () => { pl.drive = 1; pl.m.visible = false; camSnap = 1; toast("Drive to a pink balloon to sell! " + (("ontouchstart" in window) ? "Push up to go, sideways to turn." : "Up to go, left and right to turn.")); } };
  if (pet && dist(pl, pet) < 1.9) return { l: "💗 Pet " + petName(), f: () => { pop("💗"); SFX.pop(); pet.hop = .5; } };
  return null;
}
function doAct() { if (mode !== "play" || !$("modal").hidden) return; const h = hot(); if (h) h.f(); }

/* ------------------------------ moving around ------------------------------ */
let doorCool = 0, camSnap = 1, T = 0;
function goInside() { pl.inside = 1; pl.x = 0; pl.z = IZ + RM.D / 2 - 3.6; pl.ry = Math.PI; doorCool = 1; camSnap = 1; flash(); if (pet) { pet.x = pl.x + 1; pet.z = pl.z; } spawnT = Math.min(spawnT, 1.5); if (awayN) { toast("While you were out, Bao sold " + awayN + " drinks: +$" + awayEarn + "!", 5); awayN = awayEarn = 0; save(); } }
function goTown() { pl.inside = 0; pl.x = DOOR.x; pl.z = DOOR.z + 3.4; pl.ry = 0; doorCool = 1; camSnap = 1; camYaw = 0; camPitch = .5; flash(); if (pet) { pet.x = pl.x + 1; pet.z = pl.z; } awayT = 0; }
function updatePlayer(dt) {
  const inp = getInput(); doorCool -= dt;
  if (pl.sell) { const p = toWorld(2.1, -.5); pl.x = p.x; pl.z = p.z; pl.m.position.set(p.x, 0, p.z); pl.m.rotation.y = tr.a + Math.PI / 2; animChar(pl.m, 0, T); return; }
  if (pl.drive) {
    tr.v = lerp(tr.v, inp.y * (inp.y < 0 ? 8 : 21), 1 - Math.exp(-dt * 2)); tr.a += inp.x * dt * 1.7 * clamp(tr.v / 6, -1, 1);
    const p = { x: tr.x + Math.sin(tr.a) * tr.v * dt, z: tr.z + Math.cos(tr.a) * tr.v * dt }; if (pushOut(p, 2.4, OBS)) tr.v *= .5; tr.x = clamp(p.x, -170, 118); tr.z = clamp(p.z, -170, 170); pl.x = tr.x; pl.z = tr.z;
  } else {
    const yaw = pl.inside ? 0 : camYaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw), dx = rx * inp.x + fx * inp.y, dz = rz * inp.x + fz * inp.y, l = Math.hypot(dx, dz);
    pl.moving = l > .1; if (pl.moving) { const sp = 6.2; pl.x += dx * sp * dt; pl.z += dz * sp * dt; let a = Math.atan2(dx, dz) - pl.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); pl.ry += a * Math.min(1, dt * 14); }
    if (pl.inside) { pl.x = clamp(pl.x, -RM.W / 2 + .5, RM.W / 2 - .5); pl.z = clamp(pl.z, IZ - RM.D / 2 + 1.3, IZ + RM.D / 2 - .4); pushOut(pl, .45, ROOM_OBS); if (doorCool <= 0 && mode === "play" && Math.hypot(pl.x - RM.door.x, pl.z - IZ - RM.door.z) < 1.1) { if (pl.place) { toast("Put that down before you go to town."); doorCool = 2; } else goTown(); } }
    else { pl.x = clamp(pl.x, -175, 122); pl.z = clamp(pl.z, -175, 175); pushOut(pl, .5, OBS); if (doorCool <= 0 && dist(pl, DOOR) < 1.3) goInside(); }
    pl.m.position.set(pl.x, 0, pl.z); pl.m.rotation.y = pl.ry; animChar(pl.m, pl.moving, T);
    if (pl.place) { pl.place.g.position.set(pl.x + Math.sin(pl.ry) * 1.7, .25 + Math.sin(T * 5) * .06, pl.z + Math.cos(pl.ry) * 1.7); pl.place.g.rotation.y = pl.place.r; }
  }
  tr.m.position.set(tr.x, 0, tr.z); tr.m.rotation.y = tr.a;
  if (deliv && deliv.state === "made" && Math.hypot(pl.x - deliv.h.rx, pl.z - deliv.h.rz) < (pl.drive ? 8 : 2)) doDeliver();
}
function updateMisc(dt) {
  if (!deliv && S.served >= 2) { delivT -= dt; if (delivT <= 0) newDeliv(); } if (deliv) { if (deliv.state === "made") deliv.t += dt; animChar(deliv.m, 0, T); beam.material.opacity = .25 + .12 * Math.sin(T * 4); }
  SPOTS.forEach(s => { if (s.cool > 0 && pl.sell !== s) { s.cool -= dt; if (s.cool <= 0) { setLabel(s.lab, s.e + " Sell at the " + s.n, { h: 1.3, top: 1 }); s.ring.visible = true; } } });
  if (pet) {
    pet.m.visible = !pl.drive && !pl.sell; const d = dist(pl, pet); pet.mv = d > 1.7; if (d > 14) { pet.x = pl.x + 1; pet.z = pl.z; }
    if (pet.mv) { const s = Math.min(d - 1.5, 7 * dt); pet.x += (pl.x - pet.x) / d * s; pet.z += (pl.z - pet.z) / d * s; pet.ry = Math.atan2(pl.x - pet.x, pl.z - pet.z); }
    pet.hop = Math.max(0, (pet.hop || 0) - dt); pet.m.position.set(pet.x, Math.sin(pet.hop * 12) * .25 * (pet.hop > 0) + (pet.mv ? Math.abs(Math.sin(T * 12)) * .08 : 0), pet.z); pet.m.rotation.y = pet.ry;
    pet.m.userData.legs.forEach((l, i) => { l.rotation.x = pet.mv ? Math.sin(T * 14 + (i % 3 ? 0 : 3.14)) * .6 : 0; }); pet.m.userData.tail.rotation.z = Math.sin(T * 9) * .4;
  }
  const h = hot(), l = h ? h.l : ""; if (l !== actLabel) { actLabel = l; $("act").textContent = l; } $("act").hidden = !h || !$("modal").hidden;
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast").style.opacity = 0; }
}
const camT = new THREE.Vector3(), camL = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCam(dt) {
  if (mode === "title" && S.ch.type !== "nora" && !$("modal").hidden && $("modal").className.includes("low")) { camT.set(pl.x, 2.4, pl.z + 5.2); camL.set(pl.x, 1.5, pl.z); pl.m.rotation.y = Math.sin(T * .8) * .5; }
  else if (pl.sell) { const p = toWorld(9, 13); camT.set(p.x, 7, p.z); const q = toWorld(5, -.5); camL.set(q.x, 1.4, q.z); }
  else if (pl.drive) { camT.set(tr.x - Math.sin(tr.a) * 13, 7.5, tr.z - Math.cos(tr.a) * 13); camL.set(tr.x + Math.sin(tr.a) * 4, 1.6, tr.z + Math.cos(tr.a) * 4); }
  else if (pl.inside) { const a = camera.aspect < 1 ? 1.5 : 1; camT.set(pl.x * .55, (7 + RM.D * .32) * a, IZ + RM.D / 2 + (4.5 + RM.D * .22) * a); camL.set(pl.x * .55, 1, IZ - .8); }
  else { const d = 10.5, c = Math.cos(camPitch); camT.set(pl.x + Math.sin(camYaw) * d * c, 1.5 + d * Math.sin(camPitch), pl.z + Math.cos(camYaw) * d * c); camL.set(pl.x, 1.4, pl.z); }
  const k = camSnap ? 1 : 1 - Math.exp(-dt * 7); camSnap = 0; camera.position.lerp(camT, k); camLook.lerp(camL, k); camera.lookAt(camLook);
  sun.position.set(camL.x + 18, 40, camL.z + 14); sun.target.position.copy(camL);
}

/* ------------------------------ main loop ------------------------------ */
function step(dt) {
  T += dt;
  if (mode === "play") { updatePlayer(dt); updateCust(dt); updateMisc(dt); } else animChar(pl.m, 0, T);
  if (mk) mkTick(dt);
  rings.forEach((r, i) => { const s = 1 + Math.sin(T * 3 + i) * .08; r.scale.set(s, s, 1); });
  updateCam(dt); renderer.render(scene, camera);
}
let last = 0;
function frame(t) { const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; step(dt); requestAnimationFrame(frame); }
window.__step = n => { for (let i = 0; i < (n || 1); i++) step(1 / 30); };

buildRoom(S); buildDecor(S); buildPlayer(); buildPet(); buildHelpers();
pl.z = IZ + RM.cz - 1.25; pl.m.position.set(pl.x, 0, pl.z); pl.m.rotation.y = 0;
title(); requestAnimationFrame(frame);
