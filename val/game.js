"use strict";
/* ===========================================================================
   Val Training Academy. Part 3 of 3: playing the game.
   Player, camera, animals, training, crops, visitors, tractor, phone.
   =========================================================================== */
let mode = "title", tNow = 0, camYaw = 0, camPitch = .32, hot = null, saveT = 0, visT = 8, TR = null, makeCam = false;
const DAYLEN = 300, PROD_T = 70;
/* part two plugs in here */
let HOT_PRE = null, HOT_MORE = null, STEP_MORE = null, SERVE_MORE = null, WANT_MORE = null, JUMP_CB = null;
const PHONE = [["map", "🗺️", "Map"], ["shop", "🛒", "Animal shop"], ["texts", "💬", "Texts"], ["tractor", "🚜", "Get my tractor"], ["seasons", "🌦️", "Seasons"], ["make", "👗", "My look"], ["saveNow", "💾", "Save my game"], ["askReset", "🔄", "Start over"]];
function CAP() { return S.barn2 ? 80 : 45; }
const animals = [], plots = [], visitors = [], poops = [], starM = [];
const pl = { g: grp(scene), body: null, x: S.px, z: S.pz, hdg: Math.PI, ph: 0, ride: null, drive: false, alt: 0, vy: 0, boost: 0, up: false, down: false };
pl.g.scale.setScalar(.9);
function rebuildPlayer() { if (pl.body) pl.g.remove(pl.body); pl.body = buildPerson(S.look); pl.g.add(pl.body); }
const NAMES = ["Daisy", "Star", "Clover", "Honey", "Biscuit", "Willow", "Pepper", "Maple", "Sunny", "Luna", "Poppy", "Cocoa", "Snowy", "Sparkle", "Misty", "Blossom", "Comet", "Pearl", "Ginger", "Twinkle", "Breeze", "Ember", "Frost", "Rosie"];
const FRIENDS = ["Sonia", "Naeun", "Lucas", "Charlotte", "Christina", "DJ", "Nora", "Jules", "Mom", "Dad", "Grandma", "Grandpa", "Aunt Lily", "Mia", "Zoe", "Ben"];
const TRICKS = ["Spin", "Bow", "Hop", "Dance"];
function money(n, x, y, z) { S.money += n; SFX.coin(); if (n > 0) pop("+$" + n); if (x !== undefined) burst(x, y, z, [0xffd23f, 0xfff3a8], 10, 2, 3); hud(); }

/* ------------------------------ windows (modals) ------------------------------ */
const ACT = {};
function openM(html, low) { $("modalCard").innerHTML = html; $("modal").className = low ? "ov low" : "ov"; $("modal").hidden = false; $("modalCard").scrollTop = 0; }
function closeM() { $("modal").hidden = true; TR = null; makeCam = false; }
const X = '<button class="x" data-a="close">✕</button>';
ACT.close = closeM;
$("modalCard").addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (!b || b.disabled) return; audio(); SFX.tap(); ACT[b.dataset.a](b.dataset.v, b); });
function hud() {
  if (mode !== "play") { $("hud").hidden = true; return; } const se = SEASONS[S.season];
  $("hud").hidden = false; $("hud").innerHTML = '<span class="pill">💰 $' + S.money + '</span><span class="pill">' + se.e + " " + se.n + " · Day " + S.day + " " + (dayF > .5 ? "☀️" : "🌙") + '</span><button data-h="bag">🎒 Bag</button><button data-h="phone">📱 Phone</button>';
}
$("hud").addEventListener("click", e => { const b = e.target.closest("[data-h]"); if (!b) return; audio(); SFX.tap(); ACT[b.dataset.h](); });

/* ------------------------------ title, make your character, buy the farm ------------------------------ */
function showTitle() {
  mode = "title"; hud();
  openM('<h1>🦄 Val Training Academy</h1><p><b>A magic farm game by Jules</b></p><p>Buy a magic farm, raise horses and magical creatures, train them, grow magic plants and welcome visitors.</p><div class="row">' +
    (S.made ? '<button class="btn" data-a="go">▶ Keep playing' + (S.name ? " as " + esc(S.name) : "") + '</button><button class="btn red" data-a="askReset">Start over</button>' : '<button class="btn" data-a="make">▶ Start</button>') + "</div>");
}
ACT.go = () => { closeM(); if (!S.bought) return showBuy(); startPlay(); };
ACT.askReset = () => openM("<h2>Start the whole game over?</h2><p>Your farm, animals and money will be erased.</p><div class='row'><button class='btn red' data-a='reset'>Yes, start over</button><button class='btn alt' data-a='" + (mode === "play" ? "phone" : "title") + "'>No, keep my farm</button></div>");
ACT.title = showTitle;
ACT.reset = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} save = function () {}; location.reload(); };
function sw(list, cur, key) { return '<div class="row">' + list.map((c, i) => '<button class="sw' + (i === cur ? " on" : "") + '" data-a="look" data-v="' + key + ":" + i + '" style="background:#' + c.toString(16).padStart(6, "0") + '"></button>').join("") + "</div>"; }
function chips(list, cur, key) { return '<div class="row">' + list.map((c, i) => '<button class="chip' + (i === cur ? " on" : "") + '" data-a="look" data-v="' + key + ":" + i + '">' + c + "</button>").join("") + "</div>"; }
function showMake() {
  const L = S.look, sc = $("modalCard").scrollTop; makeCam = true; if (!pl.ride && !pl.drive) pl.hdg = camYaw;
  openM("<h2>Make your character</h2><input id='nm' maxlength='14' placeholder='Your name' value='" + esc(S.name) + "'><h3>Skin</h3>" + sw(SKINS, L.skin, "skin") + "<h3>Hair</h3>" + chips(HAIRS, L.hair, "hair") + "<h3>Dye your hair</h3>" + sw(HAIRC, L.hairC, "hairC") +
    "<h3>Top</h3>" + sw(TOPC, L.top, "top") + "<h3>Bottoms</h3>" + chips(BOTT, L.botT, "botT") + sw(BOTC, L.bot, "bot") + "<h3>Hat</h3>" + chips(HATS, L.hat, "hat") +
    "<div class='row'><button class='btn alt' data-a='rand'>🎲 Surprise me</button><button class='btn' data-a='made'>✓ Done</button></div>", true);
  $("modalCard").scrollTop = sc; $("nm").addEventListener("input", e => { S.name = e.target.value; });
}
ACT.make = showMake;
ACT.look = v => { const p = v.split(":"); S.look[p[0]] = +p[1]; rebuildPlayer(); showMake(); };
ACT.rand = () => { S.look = { skin: Math.floor(rnd(6)), hair: Math.floor(rnd(7)), hairC: Math.floor(rnd(14)), top: Math.floor(rnd(10)), bot: Math.floor(rnd(8)), botT: Math.floor(rnd(4)), hat: Math.floor(rnd(5)) }; rebuildPlayer(); showMake(); };
ACT.made = () => { S.name = (S.name || "").trim() || "Farmer"; S.made = true; save(); closeM(); if (!S.bought) showBuy(); else startPlay(); };
function showBuy() {
  mode = "buy"; pl.x = 0; pl.z = 56; pl.hdg = Math.PI; camYaw = 0; camPitch = .2;
  openM("<h2>🏡 Magic farm for sale!</h2><p>A big red barn, a cozy farmhouse, a pond, a field and a forest right next door.</p><p><b>Price: $300</b> · You have <b>$" + S.money + "</b></p><div class='row'><button class='btn' data-a='buy'>Buy the magic farm</button></div>", true);
}
ACT.buy = () => {
  S.money -= 300; S.bought = true; setGateSign(true); SFX.good(); pop("It's yours!"); burst(0, 6, GATE.z, [0xff7eb6, 0xffd23f, 0x9b5cff, 0x7ef29d], 50, 5, 5, .7);
  const mg = SHOP_ORDER.filter(k => SPECIES[k].magic && k !== "wishfish");
  setTimeout(() => openM("<h2>✨ The farm's magic woke up!</h2><p>Val Training Academy is yours, " + esc(S.name) + ". A horse and two chickens are waiting in the paddock.</p><p><b>Pick one magical creature to be your first friend:</b></p><div class='grid'>" +
    mg.map(k => '<button class="it magic" data-a="first" data-v="' + k + '"><span>' + SPECIES[k].e + "</span>" + SPECIES[k].n + "</button>").join("") + "</div>"), 900);
};
ACT.first = k => { newAnimal("horse", "Star", 0); newAnimal("chicken", "Henny", 0); newAnimal("chicken", "Penny", 1); const a = newAnimal(k, pick(NAMES)); closeM(); startPlay(); pl.x = 0; pl.z = 40; a.x = 3; a.z = 34; S.follow = a.d.id; askName(a, "Your " + a.sp.n + " is here! What is its name?"); };
function startPlay() { mode = "play"; hud(); save(); }

/* ------------------------------ animals ------------------------------ */
function aKind(a) { return a.d.sp === "custom" ? a.d.word.charAt(0).toUpperCase() + a.d.word.slice(1) : a.sp.n; }
function aEmoji(a) { return a.d.sp === "custom" ? customInfo(a.d.word).e : a.sp.e; }
function homeSpot(a) {
  if (a.d.in && typeof stalls !== "undefined" && stalls[a.d.in - 1]) { const s = stalls[a.d.in - 1]; return [s.x + rnd(-.8, .8), s.z + rnd(-1.4, 1.4)]; }
  if (a.sp.home === "pond") { const an = rnd(TAU), r = rnd(2, POND.r - 3); return [POND.x + Math.cos(an) * r, POND.z + Math.sin(an) * r]; }
  if (a.sp.home === "coop") { const an = rnd(TAU), r = rnd(1, 7); return [clamp(COOP.x - 5 + Math.cos(an) * r, PADDOCK.x0 + 1, PADDOCK.x1 - 1), clamp(COOP.z + 4 + Math.sin(an) * r, PADDOCK.z0 + 1, PADDOCK.z1 - 1)]; }
  return [rnd(PADDOCK.x0 + 2, PADDOCK.x1 - 4), rnd(PADDOCK.z0 + 2, PADDOCK.z1 - 2)];
}
function spawnAnimal(d) {
  const sp = SPECIES[d.sp], g = sp.build(d.c || 0, d), a = { d, sp, g, sc: (sp.scale || 1) * (d.baby ? .55 : 1), x: 0, z: 0, hdg: rnd(TAU), wait: rnd(4), alt: 0, fade: 1, poopT: rnd(60, 150), act: null, mark: null, hold: 0, tipT: 0 };
  a.top = new THREE.Box3().setFromObject(g).max.y + .3; g.scale.setScalar(a.sc); dressAnimal(g, d.wear); scene.add(g);
  const h = homeSpot(a); a.x = a.tx = h[0]; a.z = a.tz = h[1]; setTag(a); animals.push(a); return a;
}
function setTag(a) { if (a.tag) a.g.remove(a.tag); a.tag = textSprite(a.d.name, { h: .42 }); a.tag.position.y = a.top; a.tag.scale.multiplyScalar(1 / a.sc); a.g.add(a.tag); }
function newAnimal(spk, name, c, word) {
  const sp = SPECIES[spk], d = { id: S.nextId++, sp: spk, c: c !== undefined ? c : Math.floor(rnd(sp.coats || 1)), name: name || pick(NAMES), love: 20, hun: 70, pt: 0, rdy: 0, tr: 0, mg: 0, wear: { hat: 0, scarf: 0, saddle: 0 }, baby: 0, born: 0 };
  if (word) d.word = word; S.animals.push(d); return spawnAnimal(d);
}
function respawn(a) { const x = a.x, z = a.z; scene.remove(a.g); animals.splice(animals.indexOf(a), 1); const b = spawnAnimal(a.d); b.x = b.tx = x; b.z = b.tz = z; return b; }
function love(a, n) { a.d.love = clamp(a.d.love + n, 0, 100); burst(a.x, a.g.position.y + a.top * a.sc, a.z, [0xff7eb6, 0xff9ecb], 6, 1, 2, .5); }
function perform(a, type, lvl) { a.act = { type, t: 0, dur: type === "magic" ? 2.2 : 1.8, lvl: lvl || 1 }; if (type === "magic") SFX.magic(); else SFX.good();
  if (tNow > a.tipT) { const v = visitors.find(v => v.state === "wait" && Math.hypot(v.x - a.x, v.z - a.z) < 22); if (v) { a.tipT = tNow + 20; setTimeout(() => { toast(v.name + " loved the show and gave you a tip!"); money(type === "magic" ? 10 : 6, v.x, 2, v.z); }, 1500); } } }
function seat(person, a, sc) { a.g.add(person); person.scale.setScalar(sc / a.sc); person.position.set(0, a.g.userData.seatY - .62 * sc / a.sc, a.g.userData.kind === "bird" ? 0 : -a.g.userData.backL * .04); person.rotation.set(0, 0, 0); }
function mount(a) { if (pl.drive) leaveTractor(); pl.ride = a; pl.alt = 0; pl.vy = 0; pl.x = a.x; pl.z = a.z; pl.hdg = a.hdg; seat(pl.g, a, .9); animPerson(pl.body, 0, 0, true); SFX.jump(); toast(a.sp.fly ? "Hold ▲ to fly up and ▼ to come down!" : "Press ⬆ to jump!"); }
function dismount() { const a = pl.ride; if (!a) return; pl.ride = null; scene.add(pl.g); pl.g.scale.setScalar(.9); pl.g.rotation.set(0, 0, 0); pl.x = a.x + Math.cos(a.hdg) * 1.6; pl.z = a.z - Math.sin(a.hdg) * 1.6; pl.alt = 0; a.tx = a.x; a.tz = a.z; a.wait = 4; }
function updateAnimals(dt) {
  for (const a of animals) {
    const d = a.d, u = a.g.userData, fish = u.kind === "fish"; let moving = false, flying = false, hop = 0;
    d.hun = Math.max(0, d.hun - dt * .28); if (a.sp.prod && !d.baby && !d.rdy && d.hun > 0) { d.pt += dt; if (d.pt >= PROD_T) { d.pt = 0; d.rdy = 1; } }
    if (!!d.rdy !== !!a.mark) { if (d.rdy) { a.mark = textSprite(GOODS[a.sp.prod].e, { h: .6, bg: "rgba(255,255,255,.92)" }); a.mark.position.y = a.top + .6 / a.sc; a.mark.scale.multiplyScalar(1 / a.sc); a.g.add(a.mark); } else { a.g.remove(a.mark); a.mark = null; } }
    if (a === pl.ride) { a.x = pl.x; a.z = pl.z; a.hdg = pl.hdg; a.alt = pl.alt; moving = pl.moving; flying = a.sp.fly && pl.alt > .3; }
    else if (a.lesson) { const L = a.lesson; L.t += dt; const an = L.t * .55; a.x = ARENA.x + Math.cos(an) * 7; a.z = ARENA.z + Math.sin(an) * 7; a.hdg = Math.atan2(-Math.sin(an), Math.cos(an)); moving = true; if (L.t > 12) endLesson(a); }
    else if (a.act) { const A = a.act; A.t += dt; const k = A.t / A.dur;
      if (A.type === "Spin") a.hdg += dt * 9; if (A.type === "Hop") hop = Math.abs(Math.sin(k * Math.PI * 3)) * .9; if (A.type === "Dance") { a.hdg += Math.sin(k * 20) * dt * 5; hop = Math.abs(Math.sin(k * Math.PI * 5)) * .35; }
      if (A.type === "Bow" && u.neck) u.neck.rotation.x = u.neckA + Math.sin(k * Math.PI) * 1.1;
      if (A.type === "magic") { hop = Math.sin(k * Math.PI) * .5; if (Math.random() < .7) { const r = 1 + k * 3 * A.lvl, an = tNow * 7; burst(a.x + Math.cos(an) * r, a.g.position.y + 1 + k * 2.5, a.z + Math.sin(an) * r, a.sp.sp || [0xffffff], 2 + A.lvl, 1.5 + A.lvl, 2, .5 + A.lvl * .15); } }
      if (k >= 1) a.act = null; }
    else if (a.hold > 0) a.hold -= dt;
    else {
      let sp = fish ? 1.5 : a.sp.hop ? 2.2 : u.kind === "bird" && !a.sp.ride ? 1.3 : 1.7;
      if (S.follow === d.id && !fish && mode === "play") { const bx = pl.x - Math.sin(pl.hdg) * 1.5 + Math.cos(pl.hdg) * 2.8, bz = pl.z - Math.cos(pl.hdg) * 1.5 - Math.sin(pl.hdg) * 2.8, dd = Math.hypot(bx - a.x, bz - a.z); a.tx = bx; a.tz = bz; a.wait = 0; sp = dd > 2.2 ? Math.min(pl.ride ? 20 : 9, 2 + dd * 1.2) : 0; if (dd > 60) { a.x = bx; a.z = bz; } }
      if (Math.hypot(a.tx - a.x, a.tz - a.z) > 90) { a.x = a.tx; a.z = a.tz; }
      const dx = a.tx - a.x, dz = a.tz - a.z, dd = Math.hypot(dx, dz);
      if (a.wait > 0) a.wait -= dt; else if (dd < .5 || sp === 0) { if (S.follow !== d.id || fish) { const h = homeSpot(a); a.tx = h[0]; a.tz = h[1]; a.wait = fish ? 0 : rnd(2, 8); } }
      else { const th = Math.atan2(dx, dz); let df = th - a.hdg; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU; a.hdg += clamp(df, -4 * dt, 4 * dt); a.x += Math.sin(a.hdg) * sp * dt; a.z += Math.cos(a.hdg) * sp * dt; moving = true; if (a.sp.hop) hop = Math.abs(Math.sin(tNow * 9)) * .22; }
      a.alt = Math.max(0, a.alt - 8 * dt);
      if (!fish && a.sp !== SPECIES.custom || !fish) { a.poopT -= dt; if (a.poopT < 0) { a.poopT = rnd(90, 200); if (poops.length < 10 && !a.sp.magic && !a.d.in && a.z > -300 && mode === "play") { const p = buildPoop(); p.position.set(a.x - Math.sin(a.hdg), hgt(a.x, a.z), a.z - Math.cos(a.hdg)); scene.add(p); poops.push(p); } } }
    }
    let y = hgt(a.x, a.z) + a.alt + hop;
    if (fish) { const j = Math.sin(tNow * .5 + d.id) > .96 ? Math.sin((Math.sin(tNow * .5 + d.id) - .96) / .04 * Math.PI) * 1.4 : 0; y = -.75 + j; if (j > .3 && Math.random() < .3) burst(a.x, -.3, a.z, [0xbfe9ff, 0xffffff], 2, 1.5, 2, .3); }
    if (a.sp.water) { const inW = Math.hypot(a.x - POND.x, a.z - POND.z) < POND.r - 1, f = lerp(a.fade, inW ? .12 : 1, .06); if (Math.abs(f - a.fade) > .004) { a.fade = f; fadeAnimal(a.g, f); } if (inW && moving && Math.random() < .3) burst(a.x, -.2, a.z, [0xbfe9ff, 0xffffff, 0x7fd8ff], 2, 2, 2, .35); }
    if (a.sp.magic && Math.random() < .02 && !fish) burst(a.x + rnd(-.8, .8), y + rnd(.5, 2) * a.sc, a.z + rnd(-.8, .8), a.sp.sp, 1, .3, .6, .3);
    a.g.position.set(a.x, y, a.z); a.g.rotation.y = a.hdg; a.g.rotation.x = flying ? -.08 : 0; animAnimal(a.g, tNow + d.id, moving, flying, a === pl.ride ? 1.5 : 1);
    a.tag.visible = Math.hypot(a.x - pl.x, a.z - pl.z) < 26;
  }
}
/* the animal's card: everything you can do with it */
let cardA = null;
function byId(id) { return animals.find(a => a.d.id === +id); }
function showCard(a) {
  cardA = a; const d = a.d, mate = !d.baby && animals.some(b => b !== a && b.d.sp === d.sp && (b.d.word || "") === (d.word || "") && !b.d.baby), hungry = d.hun < 35;
  const b = (act, label, cls, dis) => '<button class="btn ' + (cls || "alt") + '" data-a="' + act + '"' + (dis ? " disabled" : "") + ">" + label + "</button>";
  openM(X + "<h2>" + aEmoji(a) + " " + esc(d.name) + "</h2><p>" + (d.baby ? "Baby " : "") + aKind(a) + (a.sp.magic ? " · magical ✨" : "") + (hungry ? " · <b>hungry!</b>" : "") + "</p><h3>Love</h3><div class='bar'><i style='width:" + d.love + "%'></i></div>" +
    (d.tr || d.mg ? "<p>Knows: " + TRICKS.slice(0, d.tr).concat(d.mg ? [magicName(a)] : []).join(", ") + "</p>" : "") +
    "<div class='row'>" + (d.rdy ? b("collect", "Collect " + GOODS[a.sp.prod].e, "") : "") + b("feed", "🍎 Feed", hungry ? "" : "alt") + b("pet", "💗 Pet") + b("brush", "🪮 Brush") +
    (a.sp.ride && !d.baby ? b("ride", "🏇 Ride", "mag") : "") + (a.sp.home !== "pond" ? b("follow", S.follow === d.id ? "✋ Stay here" : "🚶 Follow me") : "") + (typeof stableBtn === "function" ? stableBtn(a, b) : "") + "</div><div class='row'>" +
    (!d.baby ? b("train", "🎓 Train", "mag") : "") + (d.tr || d.mg ? b("show", "✨ Do a trick") : "") + b("dress", "👒 Dress up") + b("rename", "✏️ Name") + (mate ? b("baby", "🍼 Have a baby", "alt", d.love < 50) : "") + "</div>" + (mate && d.love < 50 ? "<p><small>Fill the love bar halfway to have a baby.</small></p>" : ""));
}
function magicName(a) { return (a.d.mg >= 3 ? "Super " : "") + (a.d.mg >= 2 ? a.sp.magic : "Sparkles"); }
ACT.feed = () => { const a = cardA; a.d.hun = 100; love(a, 8); SFX.plop(); closeM(); toast(a.d.name + " says yum! 🍎"); };
ACT.pet = () => { love(cardA, 5); SFX.tap(); showCard(cardA); };
ACT.brush = () => { const a = cardA; love(a, 7); burst(a.x, a.g.position.y + 1, a.z, [0xffffff, 0xfff3a8], 14, 1.5, 2, .4); closeM(); toast(a.d.name + " is shiny and clean! ✨"); };
ACT.collect = () => { const a = cardA, k = a.sp.prod; a.d.rdy = 0; S.inv[k] = (S.inv[k] || 0) + 1; SFX.coin(); closeM(); pop("+1 " + GOODS[k].e); toast("You got " + GOODS[k].n.toLowerCase() + " from " + a.d.name + ". Sell it to a visitor!"); };
ACT.ride = () => { const a = cardA; closeM(); if (a.lesson) return toast(a.d.name + " is giving a lesson right now."); mount(a); };
ACT.follow = () => { const a = cardA; S.follow = S.follow === a.d.id ? 0 : a.d.id; closeM(); toast(S.follow ? a.d.name + " will follow you. 🚶" : a.d.name + " will stay here."); };
ACT.show = () => { const a = cardA, opts = TRICKS.slice(0, a.d.tr); closeM(); if (a.d.mg && Math.random() < .5 || !opts.length) perform(a, "magic", a.d.mg); else perform(a, pick(opts)); };
ACT.rename = () => askName(cardA, "What is its name?");
function askName(a, title) { cardA = a; openM("<h2>" + aEmoji(a) + " " + esc(title) + "</h2><input id='an' maxlength='14' value='" + esc(a.d.name) + "'><div class='row'><button class='btn' data-a='named'>✓ OK</button></div>"); }
ACT.named = () => { const v = $("an").value.trim(); if (v) cardA.d.name = v; setTag(cardA); closeM(); save(); };
ACT.baby = () => { const a = cardA; if (animals.length >= CAP()) return toast("The farm is full!"); const b = newAnimal(a.d.sp, "Baby " + a.d.name, a.d.c, a.d.word); b.d.baby = 1; b.d.born = S.day; const n = respawn(b); n.x = n.tx = a.x + 1.5; n.z = n.tz = a.z + 1; a.d.love = Math.max(20, a.d.love - 20);
  closeM(); SFX.magic(); pop("A baby " + aKind(a).toLowerCase() + "! 🍼"); burst(n.x, 1.5, n.z, [0xff9ecb, 0xffffff, 0xfff3a8], 30, 2.5, 3, .5); setTimeout(() => askName(n, "A baby was born! Name it:"), 1200); };
ACT.dress = () => { const a = cardA, w = a.d.wear, col = (key) => '<div class="row"><button class="chip' + (!w[key] ? " on" : "") + '" data-a="wear" data-v="' + key + ':0">None</button>' + A_COL.map((c, i) => '<button class="sw' + (w[key] === i + 1 ? " on" : "") + '" data-a="wear" data-v="' + key + ":" + (i + 1) + '" style="background:#' + c.toString(16).padStart(6, "0") + '"></button>').join("") + "</div>";
  openM(X + "<h2>👒 Dress up " + esc(a.d.name) + "</h2><h3>Hat</h3><div class='row'>" + A_HATS.map((h, i) => '<button class="chip' + (w.hat === i ? " on" : "") + '" data-a="wear" data-v="hat:' + i + '">' + h + "</button>").join("") + "</div><h3>Scarf</h3>" + col("scarf") + "<h3>Saddle blanket</h3>" + col("saddle") + "<div class='row'><button class='btn' data-a='close'>✓ Done</button></div>", true); };
ACT.wear = v => { const p = v.split(":"); cardA.d.wear[p[0]] = +p[1]; dressAnimal(cardA.g, cardA.d.wear); ACT.dress(); };
/* training: tap when the marker is in the green */
ACT.train = () => { const a = cardA, d = a.d, tm = d.tr >= 4, mm = d.mg >= 3;
  openM(X + "<h2>🎓 Train " + esc(d.name) + "</h2><p>Tap <b>NOW!</b> when the purple marker is in the green. Get 2 out of 3 to learn something new.</p><div class='row'><button class='btn' data-a='trgo' data-v='tr'" + (tm ? " disabled" : "") + ">" + (tm ? "Knows every trick!" : "Teach a trick: " + TRICKS[d.tr]) + "</button>" +
    (a.sp.magic ? "<button class='btn mag' data-a='trgo' data-v='mg'" + (mm ? " disabled" : "") + ">" + (mm ? "Knows all its magic!" : "Teach magic: " + ["Sparkles", a.sp.magic, "Super " + a.sp.magic][d.mg]) + "</button>" : "") + "</div><p><small>Jumping: ride into the arena and jump the fences!</small></p>"); };
ACT.trgo = v => { TR = { a: cardA, kind: v, pos: 0, dir: 1, hits: 0, tries: 0, sp: 85 + cardA.d[v] * 22 }; $("modalCard").innerHTML = "<h2>Get ready…</h2><div id='tr'><div class='zone'></div><div class='mk' id='trm'></div></div><p class='stars' id='trs'>☆☆☆</p><div class='row'><button class='btn mag' data-a='trtap' style='font-size:24px;padding:18px 40px'>NOW!</button></div>"; TR.a.g; };
ACT.trtap = () => { if (!TR || TR.tries >= 3) return; const ok = TR.pos > 36 && TR.pos < 64; TR.tries++; if (ok) { TR.hits++; SFX.coin(); } else SFX.no(); $("trs").textContent = "★".repeat(TR.hits) + "✗".repeat(TR.tries - TR.hits) + "☆".repeat(3 - TR.tries); TR.sp += 12;
  if (TR.tries >= 3) { const t = TR, a = t.a; setTimeout(() => { closeM(); if (t.hits >= 2) { a.d[t.kind]++; love(a, 6); if (t.kind === "tr") { pop(a.d.name + " learned " + TRICKS[a.d.tr - 1] + "!"); perform(a, TRICKS[a.d.tr - 1]); } else { pop(a.d.name + " learned " + magicName(a) + "!"); perform(a, "magic", a.d.mg); } money(5); save(); } else toast("So close! " + a.d.name + " wants to try again."); }, 500); } };

/* ------------------------------ crops ------------------------------ */
function initPlots() {
  if (S.plots.length !== 12) { S.plots = []; for (let i = 0; i < 12; i++) S.plots.push({ c: null, g: 0, w: 0 }); }
  S.plots.forEach((d, i) => { const x = -36 + (i % 4) * 6, z = Math.floor(i / 4) * 6, soil = add(scene, G.box, Mu(0x8a5a3a, { roughness: 1 }), x, .08, z, 4.6, .22, 4.6); soil.castShadow = false; for (let r = 0; r < 4; r++) add(scene, G.cyl, M(0x7a4e30, { roughness: 1 }), x, .2, z - 1.7 + r * 1.13, .22, 4.4, .22).rotation.z = Math.PI / 2;
    plots.push({ d, x, z, soil, crop: null, stage: -1, cool: 0 }); });
}
function stageOf(d) { return d.g >= 1 ? 2 : d.g >= .45 ? 1 : 0; }
function refreshPlot(p) { const st = p.d.c ? stageOf(p.d) : -1; p.soil.material.color.setHex(p.d.w ? 0x5e3d28 : 0x8a5a3a); if (st === p.stage && (p.crop ? p.cid === p.d.c : !p.d.c)) return; if (p.crop) scene.remove(p.crop); p.crop = null; p.stage = st; p.cid = p.d.c; if (p.d.c) { p.crop = buildCrop(p.d.c, st); p.crop.position.set(p.x, .2, p.z); scene.add(p.crop); } }
function updatePlots(dt) { let moon = 0; for (const p of plots) { const d = p.d; p.cool -= dt; if (d.c) { if (d.w && d.g < 1) { d.g = Math.min(1, d.g + dt / CROPS[d.c].t * (d.c === "winterflower" && S.season === 3 ? 2 : 1)); if (stageOf(d) !== p.stage) { refreshPlot(p); if (d.g >= 1) burst(p.x, 1.2, p.z, CROPS[d.c].magic ? [0xbfe9ff, 0xfff3a8, 0xff9ecb] : [0x8fd96b, 0xfff3a8], 12, 2, 2.5, .4); } }
      if (d.c === "moonflower" && d.g >= 1) moon = 1; if (CROPS[d.c].magic && d.g >= 1 && Math.random() < .04) burst(p.x + rnd(-1.5, 1.5), 1, p.z + rnd(-1.5, 1.5), d.c === "candycane" ? [0xff9ecb, 0xffffff] : d.c === "moonflower" ? [0xfff3a8] : [0xbfe9ff], 1, .2, .8, .3); } }
  if (moon && !moonGlow && dayF < .4) toast("🌙 Your moon flower lit up the moon!"); moonGlow = lerp(moonGlow, moon, .02); if (moonGlow < .01) moonGlow = 0; }
function plant(p, id) { const c = CROPS[id]; if (S.money < c.cost) { SFX.no(); toast("You need $" + c.cost + " for " + c.n.toLowerCase() + " seeds."); return false; } S.money -= c.cost; p.d.c = id; p.d.g = 0; p.d.w = 0; S.lastSeed = id; SFX.plop(); refreshPlot(p); hud(); return true; }
function waterPlot(p) { p.d.w = 1; SFX.water(); burst(p.x, 1.4, p.z, [0x7fd8ff, 0xbfe9ff], 14, 1.6, 1, .35); refreshPlot(p); }
function harvest(p) { const id = p.d.c, c = CROPS[id], n = c.give || (c.magic ? 2 : 3); S.inv[id] = (S.inv[id] || 0) + n; SFX.good(); pop("+" + n + " " + c.e); burst(p.x, 1.2, p.z, [0xfff3a8, 0x8fd96b], 14, 2, 3, .4); if (c.tree) { p.d.g = .5; p.d.w = 0; } else { p.d.c = null; p.d.g = 0; p.d.w = 0; } refreshPlot(p); }
let plotP = null;
function showSeeds(p) { plotP = p; openM(X + "<h2>🌱 What do you want to plant?</h2><div class='grid'>" + Object.keys(CROPS).map(k => { const c = CROPS[k]; return '<button class="it' + (c.magic ? " magic" : "") + '" data-a="plant" data-v="' + k + '"><span>' + c.e + "</span>" + c.n + "<small>" + (c.cost ? "$" + c.cost : "free") + (c.magic ? " · magic" : "") + "</small></button>"; }).join("") + "</div><p><small>Plant, water, wait, then pick. You have $" + S.money + ".</small></p>"); }
ACT.plant = k => { if (plant(plotP, k)) closeM(); };

/* ------------------------------ bag ------------------------------ */
ACT.bag = () => { const ks = Object.keys(S.inv).filter(k => S.inv[k] > 0);
  openM(X + "<h2>🎒 Your bag</h2>" + (ks.length ? "<div class='grid'>" + ks.map(k => { const c = itemInfo(k); return '<button class="it" ' + (k === "candycane" ? 'data-a="candy"' : "disabled style='opacity:1'") + "><span>" + c.e + "</span>" + c.n + " × " + S.inv[k] + "<small>" + (k === "candycane" ? "tap to suck on one!" : "sells for $" + c.sell) + "</small></button>"; }).join("") + "</div><p><small>Visitors by the farm stand will buy these.</small></p>" : "<p>Your bag is empty. Grow something in the field or collect eggs, milk and wool from your animals!</p>")); };
ACT.candy = () => { S.inv.candycane--; pl.boost = 45; closeM(); SFX.magic(); pop("Zoom! 🍭"); toast("Yum, candy cane! You are super fast for a while."); };

/* ------------------------------ visitors ------------------------------ */
function visitorWant() {
  const o = []; if (animals.some(a => a.sp.ride && !a.d.baby)) o.push("lesson", "lesson"); if (animals.some(a => a.d.sp === "bunny")) o.push("bunny"); if (animals.some(a => a.d.sp === "chicken" || a.d.sp === "duck")) o.push("birds");
  const have = Object.keys(S.inv).filter(k => S.inv[k] > 0); for (let i = 0; i < 5; i++) o.push("buy");
  if (WANT_MORE) WANT_MORE(o); const t = pick(o);
  if (typeof t === "object") return t;
  if (t === "lesson") { const m = animals.some(a => a.sp.ride && a.sp.magic && !a.d.baby) && Math.random() < .5; return { t, pay: m ? 80 : 40, magic: m, bub: m ? "🦄🏇" : "🏇", say: m ? "a ride on a magical creature" : "a horse riding lesson" }; }
  if (t === "bunny") return { t, pay: 22, bub: "🐰💗", say: "to cuddle the bunnies" };
  if (t === "birds") return { t, pay: 16, bub: "🐔🌾", say: "to feed the chickens" };
  const id = have.length && Math.random() < .8 ? pick(have) : pick(Object.keys(CROPS).filter(k => !CROPS[k].magic)), n = Math.min(have.includes(id) ? S.inv[id] : 3, 1 + Math.floor(rnd(3))), c = itemInfo(id);
  return { t, id, n, pay: Math.round(c.sell * n * rnd(1, 1.3)), bub: c.e + (n > 1 ? "×" + n : ""), say: n + " " + c.n.toLowerCase() + (n > 1 ? "s" : "") };
}
function spawnVisitor() {
  const used = visitors.map(v => v.slot), slot = [0, 1, 2, 3, 4].find(i => !used.includes(i)); if (slot === undefined) return;
  const names = FRIENDS.filter(n => n !== S.name && !visitors.some(v => v.name === n)), name = pick(names), grown = /Mom|Dad|Grand|Aunt/.test(name), r = srand(hashStr(name));
  const g = buildPerson({ skin: Math.floor(r() * 6), hair: /Dad|Grandpa|Lucas|DJ|Ben/.test(name) ? 5 : Math.floor(r() * 5), hairC: /Grand/.test(name) ? 12 : Math.floor(r() * 7), top: Math.floor(r() * 10), bot: Math.floor(r() * 8), botT: /Dad|Grandpa|Lucas|DJ|Ben/.test(name) ? 0 : Math.floor(r() * 4), hat: r() < .25 ? 1 : 0 });
  const v = { g, name, sc: grown ? 1.05 : .86, x: rnd(-1.5, 1.5), z: 100, hdg: Math.PI, slot, tx: STAND.x - 5 + slot * 3.2, tz: STAND.z + 4.5, state: "in", want: visitorWant(), t: 0, ph: 0, bub: null };
  g.scale.setScalar(v.sc); scene.add(g); v.bub = textSprite(v.want.bub, { h: .7, bg: "rgba(255,255,255,.95)", fg: "#2f2450" }); v.bub.position.y = 2.5; g.add(v.bub); visitors.push(v);
  S.texts.unshift(name + ": I'm coming to your farm! I would love " + v.want.say + "."); S.texts.length = Math.min(S.texts.length, 14);
}
function leave(v, msg) { v.state = "out"; v.tx = rnd(-1.5, 1.5); v.tz = 104; if (v.bub) { v.g.remove(v.bub); v.bub = null; } if (msg) toast(msg); }
function serve(v) {
  const w = v.want; if (SERVE_MORE && SERVE_MORE(v)) return;
  if (w.t === "buy") { if ((S.inv[w.id] || 0) < w.n) { SFX.no(); return toast(v.name + " wants " + w.say + ". " + (CROPS[w.id] ? "Grow some in the field!" : "Collect some from your animals!")); } S.inv[w.id] -= w.n; money(w.pay, v.x, 2, v.z); leave(v, v.name + ": Thank you! 💛"); }
  else if (w.t === "lesson") { const a = animals.find(a => a.sp.ride && !a.d.baby && a !== pl.ride && !a.lesson && (!w.magic || a.sp.magic)); if (!a) return toast("Your riding animals are all busy!"); v.state = "busy"; a.lesson = { v, t: 0 }; if (S.follow === a.d.id) S.follow = 0; a.act = null; v.g.remove(v.bub); v.bub = null; seat(v.g, a, v.sc); animPerson(v.g, 0, 0, true); toast(v.name + " is riding " + a.d.name + " in the arena! 🏇"); SFX.good(); }
  else { const a = animals.find(a => w.t === "bunny" ? a.d.sp === "bunny" : (a.d.sp === "chicken" || a.d.sp === "duck")); if (!a) return; v.state = "visit"; v.pet = a; v.t = 0; toast(v.name + " is going to see " + a.d.name + "."); }
  save();
}
function endLesson(a) { const v = a.lesson.v; a.lesson = null; scene.add(v.g); v.g.scale.setScalar(v.sc); v.x = a.x + 1.5; v.z = a.z + 1.5; animPerson(v.g, 0, 0, false); love(a, 5); money(v.want.pay, v.x, 2, v.z); leave(v, v.name + ": That was the best ride ever!"); a.tx = a.x; a.tz = a.z; a.wait = 2; }
function updateVisitors(dt) {
  if (mode === "play") { visT -= dt; if (visT < 0) { visT = rnd(16, 30); if (dayF > .4 && visitors.length < 5) spawnVisitor(); } }
  for (let i = visitors.length - 1; i >= 0; i--) { const v = visitors[i]; if (v.state === "busy") continue; v.t += dt;
    if (v.state === "visit") { v.tx = v.pet.x + 1.2; v.tz = v.pet.z + 1.2; if (Math.hypot(v.tx - v.x, v.tz - v.z) < 1) { v.pet.hold = 1; v.vt = (v.vt || 0) + dt; if (Math.random() < .1) burst(v.pet.x, 1, v.pet.z, [0xff7eb6, 0xff9ecb], 1, .6, 1.5, .4); if (v.vt > 5) { love(v.pet, 4); money(v.want.pay, v.x, 2, v.z); leave(v, v.name + ": So cute! Thank you!"); } } }
    if (v.state === "wait" && v.t > 170) leave(v);
    const dx = v.tx - v.x, dz = v.tz - v.z, dd = Math.hypot(dx, dz), mv = dd > .4;
    if (mv) { const sp = v.state === "visit" ? 4 : 3.2; v.hdg = Math.atan2(dx, dz); v.x += dx / dd * sp * dt; v.z += dz / dd * sp * dt; v.ph += dt * 9; } else if (v.state === "in") { v.state = "wait"; v.t = 0; v.hdg = Math.PI; } else if (v.state === "out") { scene.remove(v.g); visitors.splice(i, 1); continue; }
    if (v.state === "wait") v.hdg = Math.atan2(pl.x - v.x, pl.z - v.z);
    animPerson(v.g, v.ph, mv ? .6 : 0); v.g.position.set(v.x, hgt(v.x, v.z), v.z); v.g.rotation.y = v.hdg; }
}

/* ------------------------------ tractor, poop, stars ------------------------------ */
const T = { g: buildTractor(), x: S.tractor.x, z: S.tractor.z, hdg: S.tractor.h || 0 }; scene.add(T.g);
function driveTractor() { if (pl.ride) dismount(); pl.drive = true; pl.x = T.x; pl.z = T.z; pl.hdg = T.hdg; T.g.userData.seat.add(pl.g); pl.g.position.set(0, -.5, 0); pl.g.rotation.set(0, 0, 0); pl.g.scale.setScalar(.9); animPerson(pl.body, 0, 0, true); pl.body.userData.legL.rotation.z = pl.body.userData.legR.rotation.z = 0; toast("Drive over the field and the tractor plants, waters and picks for you! 🚜"); }
function leaveTractor() { pl.drive = false; scene.add(pl.g); pl.g.rotation.set(0, 0, 0); pl.x = T.x + Math.cos(T.hdg) * 2.2; pl.z = T.z - Math.sin(T.hdg) * 2.2; S.tractor = { x: T.x, z: T.z, h: T.hdg }; }
function updateTractor(dt) {
  if (pl.drive) { T.x = pl.x; T.z = pl.z; T.hdg = pl.hdg; if (pl.moving) { T.g.userData.wheels.forEach(w => w.rotation.x += dt * 8); if (Math.random() < .3) burst(T.x - Math.sin(T.hdg) * 1.2, .3, T.z - Math.cos(T.hdg) * 1.2, [0xd9c9a8], 1, .5, .6, .4); }
    for (const p of plots) if (p.cool < 0 && Math.abs(p.x - T.x) < 3 && Math.abs(p.z - T.z) < 3) { p.cool = 2.5; const d = p.d; if (!d.c) plant(p, CROPS[S.lastSeed] ? S.lastSeed : "carrot"); else if (d.g >= 1) harvest(p); else if (!d.w) waterPlot(p); } }
  T.g.position.set(T.x, hgt(T.x, T.z), T.z); T.g.rotation.y = T.hdg;
}
const STARS = []; for (let i = 0; i < 14; i++) { const x = 76 + i * 5.6; STARS.push([x, trailZ(x) + (i % 2 ? 5 : -5)]); }
function initStars() { if (S.starDay !== S.day) { S.starDay = S.day; S.starGot = []; } STARS.forEach((s, i) => { if (!starM[i]) { starM[i] = buildStar(); scene.add(starM[i]); } starM[i].visible = !S.starGot.includes(i); }); }
function updateStars(dt) { STARS.forEach((s, i) => { const m = starM[i]; if (!m.visible) return; m.position.set(s[0], hgt(s[0], s[1]) + 1.4 + Math.sin(tNow * 2 + i) * .25, s[1]); m.rotation.y += dt * 2;
  if (mode === "play" && Math.hypot(pl.x - s[0], pl.z - s[1]) < 2.6) { m.visible = false; S.starGot.push(i); burst(s[0], 1.6, s[1], [0xfff3a8, 0xffffff, 0xffd23f], 18, 2.5, 3, .5); if (S.starGot.length === STARS.length) { money(40); toast("⭐ You found every forest star today! Bonus!"); SFX.magic(); } else money(5); } }); }

/* ------------------------------ phone ------------------------------ */
ACT.phone = () => openM(X + "<h2>📱 Phone</h2><div class='grid'>" + PHONE.map(a => '<button class="it" data-a="' + a[0] + '"><span>' + a[1] + "</span>" + a[2] + "</button>").join("") + "</div>");
const PLACES = [["🏠", "House", HOUSE.x, HOUSE.z + 9], ["🐴", "Barn", BARN.x, BARN.z + 9], ["🥕", "Field", -27, 20], ["🛍️", "Stand", STAND.x, STAND.z - 4], ["🐟", "Pond", POND.x + 15, POND.z], ["🏇", "Arena", ARENA.x - 16, ARENA.z], ["🌲", "Forest", 82, trailZ(82)], ["🚪", "Gate", 0, 40]];
ACT.map = () => { const px = x => (x + 75) / 230 * 100, pz = z => (z + 80) / 230 * 100;
  openM(X + "<h2>🗺️ Map</h2><p>Tap a place to go there.</p><div id='map'>" + PLACES.map((p, i) => '<button data-a="goto" data-v="' + i + '" style="left:' + px(p[2]) + "%;top:" + pz(p[3]) + '%"><span>' + p[0] + "</span>" + p[1] + "</button>").join("") + '<i style="left:' + px(pl.x) + "%;top:" + pz(pl.z) + '%">📍</i></div>'); };
ACT.goto = i => { const p = PLACES[i]; pl.x = p[2]; pl.z = p[3]; pl.alt = 0; closeM(); $("dark").style.opacity = 1; setTimeout(() => $("dark").style.opacity = 0, 250); };
ACT.shop = () => openM(X + "<h2>🛒 Animal shop</h2><p>You have <b>$" + S.money + "</b></p><div class='grid'>" + SHOP_ORDER.map(k => { const s = SPECIES[k]; return '<button class="it' + (s.magic ? " magic" : "") + '" data-a="buyA" data-v="' + k + '"' + (S.money < s.cost ? " disabled" : "") + "><span>" + s.e + "</span>" + s.n + "<small>$" + s.cost + "</small></button>"; }).join("") +
  "</div><h3>Any animal you want</h3><p>Type any animal and buy it for $150.</p><div class='row'><input id='any' maxlength='16' placeholder='cow, panda, parrot…'><button class='btn mag' data-a='buyAny'" + (S.money < 150 ? " disabled" : "") + ">Buy it</button></div>");
function arrive(a) { a.x = rnd(-2, 2); a.z = 44; a.wait = 0; closeM(); SFX.good(); pop("Welcome, " + aKind(a) + "!"); hud(); save(); setTimeout(() => askName(a, "Your new " + aKind(a).toLowerCase() + " is walking in from the gate! Name it:"), 900); }
ACT.buyA = k => { if (animals.length >= CAP()) return toast("The farm is full!"); const s = SPECIES[k]; if (S.money < s.cost) return; S.money -= s.cost; arrive(newAnimal(k)); };
ACT.buyAny = () => { const w = $("any").value.trim().replace(/[<>&"]/g, "").toLowerCase(); if (!w) return toast("Type an animal first!"); if (animals.length >= CAP()) return toast("The farm is full!"); S.money -= 150; arrive(newAnimal("custom", null, 0, w)); };
ACT.texts = () => openM(X + "<h2>💬 Texts</h2>" + (S.texts.length ? S.texts.map(t => "<div class='bub'>" + esc(t) + "</div>").join("") : "<p>No texts yet. Friends and family will text when they are coming to visit!</p>"));
ACT.tractor = () => { closeM(); if (pl.drive) return; T.x = pl.x + Math.sin(pl.hdg) * 4; T.z = pl.z + Math.cos(pl.hdg) * 4; T.hdg = pl.hdg; burst(T.x, 1.5, T.z, [0xffffff, 0xffd23f], 20, 3, 2, .5); toast("Your tractor is ready! 🚜"); };
ACT.seasons = () => openM(X + "<h2>🌦️ Seasons</h2><p>The seasons change by themselves every " + SEASON_LEN + " days. You can also jump to the one you want:</p><div class='grid'>" + SEASONS.map((s, i) => '<button class="it" data-a="season" data-v="' + i + '"><span>' + s.e + "</span>" + s.n + (i === S.season ? "<small>now</small>" : "") + "</button>").join("") + "</div>");
ACT.season = i => { S.sT = (+i - Math.floor((S.day - 1) / SEASON_LEN) % 4 + 4) % 4; closeM(); checkSeason(); };
ACT.saveNow = () => { S.px = pl.x; S.pz = pl.z; save(); closeM(); SFX.good(); toast("💾 Saved! Your farm will be here when you come back."); };
function checkSeason() { const s = (Math.floor((S.day - 1) / SEASON_LEN) + S.sT) % 4; if (s !== S.season) { S.season = s; applySeason(); pop(SEASONS[s].e + " " + SEASONS[s].n + " is here!"); SFX.magic(); hud(); } }
function newDay() { S.day++; initStars(); animals.slice().forEach(a => { if (a.d.baby && S.day - a.d.born >= 2) { a.d.baby = 0; if (a.d.name.indexOf("Baby ") === 0) a.d.name = a.d.name.slice(5); const b = respawn(a); toast(b.d.name + " is all grown up! 🎉"); } }); checkSeason(); hud(); save(); }

/* ------------------------------ what the big button does ------------------------------ */
function findHot() {
  if (HOT_PRE) { const h = HOT_PRE(); if (h !== undefined) return h; }
  if (pl.ride) return { label: "Hop off " + pl.ride.d.name, fn: dismount }; if (pl.drive) return { label: "Hop off the tractor", fn: leaveTractor };
  let best = null, bd = 99; const tryIt = (d, o) => { if (d < bd) { bd = d; best = o; } };
  for (const p of poops) { const d = Math.hypot(p.position.x - pl.x, p.position.z - pl.z); if (d < 2) tryIt(d - 1, { label: "Scoop the poop 💩", fn: () => { scene.remove(p); poops.splice(poops.indexOf(p), 1); SFX.plop(); money(3, p.position.x, .5, p.position.z); } }); }
  for (const v of visitors) { if (v.state !== "wait") continue; const d = Math.hypot(v.x - pl.x, v.z - pl.z); if (d < 3.4) { const w = v.want; tryIt(d - .5, { label: w.t === "buy" ? "Sell " + w.bub + " to " + v.name + " ($" + w.pay + ")" : w.t === "lesson" ? "Give " + v.name + " a riding lesson ($" + w.pay + ")" : w.t === "bunny" ? "Let " + v.name + " cuddle the bunnies ($" + w.pay + ")" : w.t === "birds" ? "Let " + v.name + " feed the chickens ($" + w.pay + ")" : w.label.replace("{n}", v.name), fn: () => serve(v) }); } }
  for (const a of animals) { if (a.lesson) continue; const fish = a.sp.home === "pond", d = fish ? Math.max(.5, Math.hypot(POND.x - pl.x, POND.z - pl.z) - POND.r - 1.5) : Math.hypot(a.x - pl.x, a.z - pl.z) - a.g.userData.r * a.sc; if (d < 1.9) tryIt(d, fish && S.wishDay !== S.day ? { label: "Make a wish with " + a.d.name + " 🌟", fn: () => wish(a) } : { label: (a.d.rdy ? GOODS[a.sp.prod].e + " " : "") + "Say hi to " + a.d.name, fn: () => showCard(a) }); }
  for (const p of plots) { const d = Math.max(Math.abs(p.x - pl.x), Math.abs(p.z - pl.z)); if (d < 3) { const c = p.d.c && CROPS[p.d.c]; tryIt(d - 1.2, !c ? { label: "Plant seeds 🌱", fn: () => showSeeds(p) } : p.d.g >= 1 ? { label: "Pick the " + c.n.toLowerCase().replace(" tree", "s") + " " + c.e, fn: () => harvest(p) } : !p.d.w ? { label: "Water the " + c.n.toLowerCase() + " 💧", fn: () => waterPlot(p) } : { label: c.e + " growing… " + Math.round(p.d.g * 100) + "%", fn: () => toast("It is growing! Come back soon.") }); } }
  const td = Math.hypot(T.x - pl.x, T.z - pl.z); if (td < 3.6) tryIt(td - 1.5, { label: "Drive the tractor 🚜", fn: driveTractor });
  const bd2 = Math.hypot(BARN.x - pl.x, BARN.z + 7 - pl.z); if (bd2 < 4) tryIt(bd2, { label: S.stallDay !== S.day ? "Go in and clean the stable 🧹" : "Go inside the stable 🐴", fn: goStable });
  if (HOT_MORE) HOT_MORE(tryIt);
  return best;
}
function cleanStalls() { S.stallDay = S.day; $("dark").style.opacity = 1; setTimeout(() => { $("dark").style.opacity = 0; burst(BARN.x, 3, BARN.z + 7, [0xffffff, 0xfff3a8, 0xbfe9ff], 40, 4, 4, .6); animals.forEach(a => a.d.love = clamp(a.d.love + 5, 0, 100)); money(15); toast("The stables are sparkling clean! All your animals are happier."); }, 500); SFX.water(); }
function wish(a) { S.wishDay = S.day; SFX.magic(); perform(a, "magic", 2); const r = Math.floor(rnd(4));
  if (r === 0) { money(60); toast("🌟 " + a.d.name + " granted your wish: $60!"); } else if (r === 1) { const k = pick(["winterflower", "candycane", "moonflower"]); S.inv[k] = (S.inv[k] || 0) + 2; toast("🌟 " + a.d.name + " granted your wish: 2 " + CROPS[k].n.toLowerCase() + "s!"); }
  else if (r === 2) { S.inv.stardust = (S.inv.stardust || 0) + 2; toast("🌟 " + a.d.name + " granted your wish: 2 stardust!"); } else { animals.forEach(b => { b.d.hun = 100; b.d.love = clamp(b.d.love + 15, 0, 100); }); toast("🌟 " + a.d.name + " granted your wish: every animal is fed and happy!"); } save(); }
function doAction() { if (mode !== "play" || !hot || !$("modal").hidden) return; SFX.tap(); hot.fn(); }
function setPad() {
  const a = pl.ride, key = !a || mode !== "play" ? "" : a.sp.fly ? "fly" : "jump"; if ($("pad").dataset.k === key) return; $("pad").dataset.k = key; $("pad").hidden = !key;
  $("pad").innerHTML = (key === "fly" ? '<button data-p="up"><span>▲</span>Fly</button><button data-p="down"><span>▼</span>Land</button>' : '<button data-p="jump"><span>⬆</span>Jump</button>') + '<button data-p="magic"><span>✨</span>Trick</button>';
}
function padDown(p) { audio(); if (p === "up") pl.up = true; if (p === "down") pl.down = true; if (p === "jump") jump(); if (p === "magic") rideTrick(); }
function jump() { if (pl.ride && !pl.ride.sp.fly && pl.alt <= 0) { pl.vy = 8; SFX.jump(); } }
function rideTrick() { const a = pl.ride; if (!a) return; if (a.d.mg) { a.act = null; SFX.magic(); for (let i = 0; i < 4; i++) setTimeout(() => burst(pl.x, a.g.position.y + 1.5, pl.z, a.sp.sp, 14 + a.d.mg * 6, 3 + a.d.mg * 1.5, 3, .6), i * 180); } else toast(a.sp.magic ? "Teach " + a.d.name + " magic first: hop off and tap Train." : a.d.name + " whinnies! Only magical creatures can do magic."); }
$("pad").addEventListener("pointerdown", e => { const b = e.target.closest("[data-p]"); if (b) { e.preventDefault(); padDown(b.dataset.p); } });
["pointerup", "pointercancel", "pointerleave"].forEach(ev => $("pad").addEventListener(ev, () => { pl.up = pl.down = false; }));

/* ------------------------------ input ------------------------------ */
const keys = {}; let joy = null, look = null;
window.addEventListener("keydown", e => { if (e.target && e.target.tagName === "INPUT") return; keys[e.code] = true; if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (e.repeat || !$("modal").hidden) return; audio(); if (e.code === "Space") { if (pl.ride) { if (!pl.ride.sp.fly) jump(); } else doAction(); } if (e.code === "KeyE" || e.code === "Enter") doAction(); if (e.code === "KeyP" && mode === "play") ACT.phone(); if (e.code === "KeyB" && mode === "play") ACT.bag(); if (e.code === "KeyM") rideTrick(); });
window.addEventListener("keyup", e => { keys[e.code] = false; });
cv.addEventListener("pointerdown", e => { audio(); $("gamesMenu").hidden = true; if (e.pointerType !== "mouse" && e.clientX < window.innerWidth * .45 && !joy) { joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0 }; $("joyB").hidden = $("joyK").hidden = false; $("joyB").style.left = $("joyK").style.left = e.clientX + "px"; $("joyB").style.top = $("joyK").style.top = e.clientY + "px"; }
  else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} });
cv.addEventListener("pointermove", e => { if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), mx = 50; if (l > mx) { dx *= mx / l; dy *= mx / l; } joy.x = dx / mx; joy.y = -dy / mx; $("joyK").style.left = joy.x0 + dx + "px"; $("joyK").style.top = joy.y0 + dy + "px"; }
  else if (look && e.pointerId === look.id) { if (mode === "play") { camYaw -= (e.clientX - look.x) * .006; camPitch = clamp(camPitch + (e.clientY - look.y) * .004, .06, 1.1); } look.x = e.clientX; look.y = e.clientY; } });
const pup = e => { if (joy && e.pointerId === joy.id) { joy = null; $("joyB").hidden = $("joyK").hidden = true; } if (look && e.pointerId === look.id) look = null; };
cv.addEventListener("pointerup", pup); cv.addEventListener("pointercancel", pup);
function getInput() { if (mode !== "play" || !$("modal").hidden) return { x: 0, y: 0 }; let x = 0, y = 0; if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1; if (keys.KeyW || keys.ArrowUp) y += 1; if (keys.KeyS || keys.ArrowDown) y -= 1; if (joy) { x += joy.x; y += joy.y; } const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } return { x, y }; }
$("act").addEventListener("click", () => { audio(); doAction(); });
$("gamesBtn").addEventListener("click", () => { $("gamesMenu").hidden = !$("gamesMenu").hidden; });
try { Arcade.mountMenu($("gamesMenu")); } catch (e) {}

/* ------------------------------ player and camera ------------------------------ */
function updatePlayer(dt) {
  const inp = getInput(), a = pl.ride, mag = Math.hypot(inp.x, inp.y); pl.moving = mag > .1; pl.boost = Math.max(0, pl.boost - dt);
  if (pl.moving) {
    camYaw -= inp.x * 1.5 * dt; const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), mx = fx * inp.y - fz * inp.x * .6, mz = fz * inp.y + fx * inp.x * .6;
    let sp = pl.drive ? 10 : a ? (a.sp.speed || 9) * (pl.alt > .5 && a.sp.fly ? 1.25 : 1) : 6; if (pl.boost > 0) sp *= 1.7;
    const th = Math.atan2(mx, mz); let df = th - pl.hdg; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU; pl.hdg += clamp(df, -(pl.drive ? 2.5 : 9) * dt, (pl.drive ? 2.5 : 9) * dt);
    if (pl.drive || a) { const k = Math.max(0, Math.cos(df)) * Math.min(1, mag); pl.x += Math.sin(pl.hdg) * sp * dt * k; pl.z += Math.cos(pl.hdg) * sp * dt * k; } else { pl.x += mx * sp * dt; pl.z += mz * sp * dt; }
    pl.ph += dt * (pl.boost > 0 ? 16 : 11); if (pl.boost > 0 && Math.random() < .5) burst(pl.x, 1, pl.z, [0xff9ecb, 0xffffff, 0xe8413a], 1, .6, 1, .35);
  }
  if (a && a.sp.fly) { const up = pl.up || keys.Space, dn = pl.down || keys.ShiftLeft || keys.ShiftRight; pl.alt = clamp(pl.alt + (up ? 9 : dn ? -11 : 0) * dt, 0, 48); }
  else if (a) { if (pl.alt > 0 || pl.vy > 0) { pl.vy -= 20 * dt; pl.alt += pl.vy * dt; if (pl.alt <= 0) { pl.alt = 0; pl.vy = 0; } }
    for (const h of HURDLES) { const d = Math.hypot(h.x - pl.x, h.z - pl.z); if (d < 1.7 && tNow > h.ok) { h.ok = tNow + 2.5; if (pl.alt > .75) { pop("Nice jump!"); money(6, h.x, 2, h.z); love(a, 2); if (JUMP_CB) JUMP_CB(); } else { SFX.no(); toast("Oops! Press Jump just before the fence."); } } } }
  else pl.alt = 0;
  if (pl.alt < 3 && !pl.inside) { const r = pl.drive ? 1.5 : a ? 1 : .45; for (const c of COL) { const dx = pl.x - c.x, dz = pl.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > .001) { pl.x = c.x + dx / d * m; pl.z = c.z + dz / d * m; } } }
  if (!pl.inside) { pl.x = clamp(pl.x, -160, 160); pl.z = clamp(pl.z, -160, 160); }
  if (!a && !pl.drive) { pl.g.position.set(pl.x, hgt(pl.x, pl.z) - (Math.hypot(pl.x - POND.x, pl.z - POND.z) < POND.r ? 0 : 0), pl.z); pl.g.rotation.y = pl.hdg; animPerson(pl.body, pl.ph, pl.moving ? .7 : 0); }
}
function updateCamera(dt) {
  if (window.__cam) return;
  if (makeCam || mode === "buy" || mode === "title") { const fx = Math.sin(pl.hdg), fz = Math.cos(pl.hdg), y = hgt(pl.x, pl.z); if (makeCam) { camera.position.set(pl.x + fx * 3.6, y + 1.5, pl.z + fz * 3.6); camera.lookAt(pl.x, y + .45, pl.z); } else { camera.position.set(0, 7, 78); camera.lookAt(0, 4, 20); } return; }
  const a = pl.ride, dist = pl.drive ? 11 : a ? 9 + a.g.userData.r * 2 + pl.alt * .12 : 6.5, ty = hgt(pl.x, pl.z) + pl.alt + (a ? a.g.userData.seatY * a.sc + .6 : pl.drive ? 2.4 : 1.5);
  const cp = Math.cos(camPitch), x = pl.x + Math.sin(camYaw) * cp * dist, z = pl.z + Math.cos(camYaw) * cp * dist, y = Math.max(ty + Math.sin(camPitch) * dist, hgt(x, z) + .6);
  camera.position.x = lerp(camera.position.x, x, .25); camera.position.y = lerp(camera.position.y, y, .25); camera.position.z = lerp(camera.position.z, z, .25); camera.lookAt(pl.x, ty, pl.z);
}

/* ------------------------------ the loop ------------------------------ */
function step(dt) {
  tNow += dt;
  if (mode === "play") { S.time += dt / DAYLEN * (dayF < .3 ? 2.4 : 1); if (S.time >= 1) { S.time -= 1; newDay(); } updatePlayer(dt); saveT += dt; if (saveT > 12) { saveT = 0; S.px = pl.x; S.pz = pl.z; save(); } }
  else if (!pl.ride && !pl.drive) { pl.g.position.set(pl.x, hgt(pl.x, pl.z), pl.z); pl.g.rotation.y = pl.hdg; animPerson(pl.body, 0, 0); }
  updateAnimals(dt); updateVisitors(dt); updatePlots(dt); updateTractor(dt); updateStars(dt); updateSparks(dt);
  updateSky(pl.x, pl.z); updateFall(dt, tNow, camera.position.x, camera.position.z); updateCamera(dt);
  winMat.emissiveIntensity = (1 - dayF) * 1.3; water.position.y = -.42 + Math.sin(tNow * .8) * .03; clouds.forEach((c, i) => { c.position.x += dt * (1 + i % 3) * .6; if (c.position.x > 340) c.position.x = -340; });
  if (TR && $("trm")) { TR.pos += TR.dir * TR.sp * dt; if (TR.pos > 100) { TR.pos = 100; TR.dir = -1; } if (TR.pos < 0) { TR.pos = 0; TR.dir = 1; } $("trm").style.left = TR.pos + "%"; }
  if (STEP_MORE) STEP_MORE(dt);
  if (mode === "play") { hot = $("modal").hidden ? findHot() : null; const b = $("act"); if (hot) { if (b.textContent !== hot.label) b.textContent = hot.label; b.hidden = false; } else b.hidden = true; setPad(); if (Math.floor(tNow * 2) !== Math.floor((tNow - dt) * 2)) hud(); } else { $("act").hidden = true; $("pad").hidden = true; $("pad").dataset.k = ""; }
}
let last = performance.now();
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt); renderer.render(scene, camera); requestAnimationFrame(frame); }
window.__step = n => { for (let i = 0; i < n; i++) step(.033); renderer.render(scene, camera); };

/* ------------------------------ go ------------------------------ */
buildFarm(); setGateSign(S.bought); S.season = (Math.floor((S.day - 1) / SEASON_LEN) + S.sT) % 4; applySeason(); initPlots(); plots.forEach(refreshPlot); initStars(); rebuildPlayer();
S.animals.forEach(spawnAnimal); updateSky(pl.x, pl.z); showTitle(); requestAnimationFrame(frame);
