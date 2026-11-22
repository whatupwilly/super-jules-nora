"use strict";
/* ===========================================================================
   Val Training Academy. Part 2 of 3: people, animals, magic creatures,
   crops and the tractor. Everything here only builds models and describes
   what each animal is; game.js makes them do things.
   =========================================================================== */

/* ------------------------------ people ------------------------------ */
const SKINS = [0xffdfc4, 0xf2c6a0, 0xd9a577, 0xb07a4f, 0x8a5a38, 0x5e3b25];
const HAIRC = [0x2b1b12, 0x5a3a22, 0x8a5a2e, 0xd9a441, 0xf3d27a, 0xc0502c, 0x151515, 0xff6fb5, 0x9b5cff, 0x3fa9ff, 0x2fd3b0, 0xff4d4d, 0xf4f4f4, 0x7ef29d];
const TOPC = [0xff7eb6, 0x9b5cff, 0x3fa9ff, 0x2fd3b0, 0xffd23f, 0xff5a4d, 0xffffff, 0x7ef29d, 0xff9a3c, 0x2b2b3a];
const BOTC = [0x3f6fc4, 0x2b2b3a, 0xff7eb6, 0x9b5cff, 0xf2efe8, 0x8a5a3a, 0x2fd3b0, 0xffd23f];
const HAIRS = ["Long", "Ponytail", "Pigtails", "Braids", "Bun", "Short", "Curly"], HATS = ["No hat", "Cowgirl hat", "Bow", "Flower crown", "Beanie"], BOTT = ["Jeans", "Skirt", "Overalls", "Shorts"];
function buildPerson(L) {
  const g = grp(), skin = M(SKINS[L.skin % SKINS.length]), hair = M(HAIRC[L.hairC % HAIRC.length], { roughness: .6 }), top = M(TOPC[L.top % TOPC.length]), bot = M(BOTC[L.bot % BOTC.length]), bt = L.botT % 4, u = g.userData;
  const legMat = bt === 1 || bt === 3 ? skin : bot;
  [-1, 1].forEach(s => { const lg = grp(g, s * .11, .78, 0); add(lg, G.cyl, legMat, 0, -.31, 0, .082, .62, .082); if (bt === 3) add(lg, G.cyl, bot, 0, -.1, 0, .1, .26, .1); add(lg, G.sph, M(0x7a4a2e), 0, -.69, .04, .1, .09, .16); u[s < 0 ? "legL" : "legR"] = lg; });
  add(g, G.cyl, bt === 2 ? bot : top, 0, 1.06, 0, .2, .56, .14); add(g, G.sph, top, 0, 1.32, 0, .25, .11, .15); add(g, G.sph, bt === 1 ? top : bot, 0, .8, 0, .2, .12, .15);
  if (bt === 1) add(g, G.cone, bot, 0, .78, 0, .36, .46, .3);
  if (bt === 2) { add(g, G.box, bot, 0, 1.12, .13, .26, .3, .04); [-.1, .1].forEach(x => add(g, G.box, bot, x, 1.3, .1, .05, .3, .1)); add(g, G.sph, top, 0, 1.3, 0, .26, .13, .16); }
  [-1, 1].forEach(s => { const ar = grp(g, s * .27, 1.32, 0); add(ar, G.cyl, top, 0, -.14, 0, .065, .28, .065); add(ar, G.cyl, skin, 0, -.38, 0, .055, .24, .055); add(ar, G.sph, skin, 0, -.53, 0, .07); ar.rotation.z = s * .12; u[s < 0 ? "armL" : "armR"] = ar; });
  add(g, G.cyl, skin, 0, 1.42, 0, .07, .12, .07);
  const hd = grp(g, 0, 1.63, 0); u.head = hd; add(hd, G.sph, skin, 0, 0, 0, .23, .25, .23);
  [-1, 1].forEach(s => { add(hd, G.sph, M(0x2a1f1a, { roughness: .3 }), s * .085, .02, .205, .033, .045, .02); add(hd, G.sph, M(0xffffff), s * .092, .035, .222, .011); add(hd, G.sph, M(0xff9db0), s * .13, -.06, .185, .04, .028, .015); });
  const sm = new THREE.Mesh(new THREE.TorusGeometry(.06, .012, 6, 12, Math.PI), M(0xb8455a)); sm.position.set(0, -.07, .215); sm.rotation.z = Math.PI; hd.add(sm);
  const cap = add(hd, G.half, hair, 0, .02, -.01, .25, .27, .25); cap.rotation.x = -.28; add(hd, G.sph, hair, 0, .17, .14, .2, .08, .1);
  const hs = L.hair % HAIRS.length;
  if (hs === 0) { add(hd, G.sph, hair, 0, -.2, -.13, .24, .4, .15); [-1, 1].forEach(s => add(hd, G.sph, hair, s * .2, -.15, -.02, .07, .3, .12)); }
  if (hs === 1) { add(hd, G.sph, hair, 0, .14, -.24, .09); add(hd, G.sph, hair, 0, -.12, -.31, .08, .28, .08); }
  if (hs === 2) [-1, 1].forEach(s => { add(hd, G.sph, M(0xff7eb6), s * .25, .03, -.04, .05); add(hd, G.sph, hair, s * .29, -.14, -.04, .08, .2, .08); });
  if (hs === 3) [-1, 1].forEach(s => { for (let i = 0; i < 5; i++) add(hd, G.sph, hair, s * .2, -.1 - i * .1, .06, .06 - i * .004); add(hd, G.sph, M(0xff7eb6), s * .2, -.6, .06, .04); });
  if (hs === 4) add(hd, G.sph, hair, 0, .3, -.08, .13);
  if (hs === 5) add(hd, G.sph, hair, 0, -.08, -.1, .235, .16, .17);
  if (hs === 6) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; add(hd, G.sph, hair, Math.cos(a) * .22, .08 + (i % 3) * .1 - .12, Math.sin(a) * .2 - .04, .1); }
  const ht = L.hat % HATS.length;
  if (ht === 1) { add(hd, G.cyl, M(0xd9b27a), 0, .2, 0, .4, .03, .4); add(hd, G.cyl, M(0xd9b27a), 0, .3, 0, .2, .2, .2); add(hd, G.cyl, M(0xff7eb6), 0, .24, 0, .205, .05, .205); }
  if (ht === 2) { [-1, 1].forEach(s => { const b = add(hd, G.cone, M(0xff5fa2), s * .09, .27, 0, .08, .16, .05); b.rotation.z = s * Math.PI / 2; }); add(hd, G.sph, M(0xff8fc0), 0, .27, 0, .045); }
  if (ht === 3) for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; add(hd, G.sph, M([0xff7eb6, 0xffd23f, 0xffffff, 0xc9a2ff][i % 4]), Math.cos(a) * .235, .15, Math.sin(a) * .235, .055); }
  if (ht === 4) { add(hd, G.half, M(0xff5a4d), 0, .06, 0, .26, .25, .26); add(hd, G.sph, M(0xffffff), 0, .32, 0, .07); add(hd, G.cyl, M(0xffffff), 0, .08, 0, .265, .06, .265); }
  return g;
}
function animPerson(p, ph, amp, sit) {
  const u = p.userData; if (sit) { u.legL.rotation.set(-1.25, 0, -.5); u.legR.rotation.set(-1.25, 0, .5); u.armL.rotation.x = u.armR.rotation.x = -.7; return; }
  const s = Math.sin(ph) * amp; u.legL.rotation.set(s, 0, 0); u.legR.rotation.set(-s, 0, 0); u.armL.rotation.x = -s * .8; u.armR.rotation.x = s * .8;
}

/* ------------------------------ four-legged animals ------------------------------ */
const QD = { len: 1.2, girth: .4, legH: .55, legW: .08, neckL: .35, neckW: .16, neckA: .7, headW: .2, headL: .24, headA: .5, ear: "round", tail: "short", col: 0xffffff, hoof: 0x4a4038 };
function buildQuad(q) {
  const p = Object.assign({}, QD, q), g = grp(), u = g.userData, mo = p.mat || {}, bm = M(p.col, mo), hm = p.head !== undefined ? M(p.head, mo) : bm, lm = p.legC !== undefined ? M(p.legC, mo) : bm;
  const col = c => M(c, mo), mane = i => col(Array.isArray(p.mane) ? p.mane[i % p.mane.length] : p.mane);
  const by = p.legH + p.girth * .85, L = p.len, gi = p.girth;
  const body = grp(g, 0, by, 0); u.body = body; u.by = by;
  add(body, G.sph, bm, 0, 0, 0, gi * .95, gi, L / 2); add(body, G.sph, bm, 0, .02, L * .28, gi * .92, gi * .98, L * .26); add(body, G.sph, bm, 0, .03, -L * .28, gi * .98, gi * 1.02, L * .27);
  if (p.belly !== undefined) add(body, G.sph, col(p.belly), 0, -gi * .22, 0, gi * .8, gi * .85, L * .46);
  if (p.wool) { const r = srand(7); for (let i = 0; i < 26; i++) { const a = r() * TAU, z = (r() - .5) * L * .95, rr = gi * (.95 + r() * .15); add(body, G.sphLo, bm, Math.cos(a) * rr * .72, Math.abs(Math.sin(a)) * rr * .75 - gi * .1, z, gi * (.34 + r() * .16)); } }
  if (p.patch !== undefined) { const r = srand(p.patch); for (let i = 0; i < 5; i++) add(body, G.sph, col(p.patchC), (r() - .5) * gi * 1.1, gi * (.35 + r() * .4), (r() - .5) * L * .8, gi * .5, gi * .32, gi * .6); }
  u.legs = []; const ll = by - gi * .3;
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(s => { const lg = grp(g, s[0] * gi * .52, ll, s[1] * L * .33); add(lg, G.cyl, lm, 0, -ll / 2 + .04, 0, p.legW, ll, p.legW); add(lg, G.sph, lm, 0, -.02, 0, p.legW * 1.5, p.legW * 2, p.legW * 1.7); add(lg, G.cyl, col(p.hoof), 0, -ll + .07, 0, p.legW * 1.25, .14, p.legW * 1.25); u.legs.push(lg); });
  const neck = grp(body, 0, gi * .3, L * .4); neck.rotation.x = p.neckA; u.neck = neck; u.neckA = p.neckA;
  add(neck, G.cyl, hm === bm || p.woolNeck ? bm : bm, 0, p.neckL / 2, 0, p.neckW, p.neckL + p.neckW, p.neckW * 1.15);
  if (p.woolNeck) for (let i = 0; i < 6; i++) add(neck, G.sphLo, bm, Math.cos(i * 2.4) * p.neckW * .5, p.neckL * (i / 6 + .1), Math.sin(i * 2.4) * p.neckW * .5, p.neckW * .95);
  const head = grp(neck, 0, p.neckL + p.neckW * .3, 0); head.rotation.x = p.headA - p.neckA; u.head = head;
  const hw = p.headW, hl = p.headL;
  add(head, G.sph, hm, 0, 0, hl * .25, hw, hw * 1.02, hl); add(head, G.sph, p.snout !== undefined ? col(p.snout) : hm, 0, -hw * .22, hl * 1.05, hw * (p.snoutW || .68), hw * .62, hl * (p.snoutL || .62));
  [-1, 1].forEach(s => { add(head, G.sph, M(p.eye || 0x1e1814, { roughness: .25 }), s * hw * .78, hw * .28, hl * .62, hw * .19, hw * .23, hw * .14); add(head, G.sph, M(0xffffff), s * hw * .86, hw * .36, hl * .7, hw * .06); });
  if (p.nose !== undefined) add(head, G.sph, col(p.nose), 0, -hw * .12, hl * 1.62, hw * .17);
  if (p.fluff) for (let i = 0; i < 7; i++) add(head, G.sphLo, bm, Math.cos(i * .9) * hw * .6, hw * .75, Math.sin(i * .9) * hw * .5, hw * .5);
  if (p.beard) add(head, G.cone, col(0xf2efe8), 0, -hw * 1.1, hl * .9, hw * .25, hw * .9, hw * .25).rotation.x = Math.PI;
  const ec = p.earC !== undefined ? col(p.earC) : hm;
  [-1, 1].forEach(s => {
    if (p.ear === "point") { const e = add(head, G.cone, ec, s * hw * .55, hw * 1.15, -hl * .1, hw * .26, hw * .9, hw * .18); e.rotation.z = -s * .25; }
    if (p.ear === "bigpoint") { const e = add(head, G.cone, ec, s * hw * .6, hw * 1.25, -hl * .1, hw * .42, hw * 1.3, hw * .22); e.rotation.z = -s * .3; add(head, G.cone, col(0xffc4dd), s * hw * .6, hw * 1.2, -hl * .02, hw * .24, hw * .9, hw * .1).rotation.z = -s * .3; }
    if (p.ear === "round") add(head, G.sph, ec, s * hw * .8, hw * .85, -hl * .15, hw * .34, hw * .34, hw * .14);
    if (p.ear === "floppy") { const e = add(head, G.sph, ec, s * hw * 1.05, hw * .3, -hl * .1, hw * .2, hw * .5, hw * .3); e.rotation.z = s * .5; }
    if (p.ear === "long") { const e = add(head, G.sph, ec, s * hw * .4, hw * 1.9, -hl * .2, hw * .26, hw * 1.25, hw * .14); e.rotation.z = -s * .16; add(head, G.sph, col(0xffc4dd), s * hw * .4, hw * 1.85, -hl * .1, hw * .14, hw * .95, hw * .08).rotation.z = -s * .16; }
    if (p.ear === "big") { const e = add(head, G.sph, ec, s * hw * 1.25, hw * .2, -hl * .2, hw * .2, hw * 1.0, hw * .9); e.rotation.z = s * .3; }
  });
  if (p.horns) [-1, 1].forEach(s => { const h = add(head, G.cone, col(p.hornC || 0xe9dcc0), s * hw * .45, hw * 1.2, -hl * .45, hw * .16, hw * p.horns, hw * .16); h.rotation.x = -.7; h.rotation.z = -s * .25; });
  if (p.horn) { const h = add(head, G.cone, M(0xffd76a, { metalness: .55, roughness: .25, emissive: 0xffc233, emissiveIntensity: .35 }), 0, hw * 1.45, hl * .5, hw * .16, hw * 2, hw * .16); h.rotation.x = .25; }
  if (p.mane !== undefined) { const n = Math.max(4, Math.round(p.neckL / .16)); for (let i = 0; i <= n; i++) add(neck, G.sph, mane(i), 0, p.neckL * (i / n) + .05, -p.neckW * 1.05, p.neckW * (p.crest ? .28 : .55), p.neckL / n * 1.1 + .04, p.neckW * (p.crest ? 1.5 : .95)); add(head, G.sph, mane(n + 1), 0, hw * .95, hl * .3, hw * .5, hw * .32, hl * .7); }
  if (p.trunk) { for (let i = 0; i < 6; i++) add(head, G.sph, hm, 0, -hw * (.3 + i * .32), hl * (1.4 + Math.sin(i * .5) * .3), hw * (.34 - i * .03)); }
  const tail = grp(body, 0, gi * .35, -L * .5); u.tail = tail;
  const tc = i => p.tailC !== undefined ? col(Array.isArray(p.tailC) ? p.tailC[i % p.tailC.length] : p.tailC) : (p.mane !== undefined ? mane(i) : bm);
  if (p.tail === "horse") for (let i = 0; i < 5; i++) { const t = add(tail, G.sph, tc(i), (i - 2) * gi * .09, -gi * .75, -gi * .32 - Math.abs(i - 2) * .02, gi * .16, gi * 1.05, gi * .2); t.rotation.x = .32; }
  if (p.tail === "puff") add(tail, G.sphLo, tc(0), 0, 0, -gi * .1, gi * .32);
  if (p.tail === "short") add(tail, G.sph, tc(0), 0, .02, -gi * .25, gi * .12, gi * .14, gi * .45).rotation.x = -.5;
  if (p.tail === "thin") { add(tail, G.cyl, tc(0), 0, -gi * .5, -gi * .2, .03, gi * 1.3, .03).rotation.x = .25; add(tail, G.sph, tc(1), 0, -gi * 1.15, -gi * .37, .09, .14, .09); }
  if (p.tail === "bushy") { const t = add(tail, G.sph, tc(0), 0, gi * .25, -gi * 1.5, gi * .62, gi * .62, gi * 1.7); t.rotation.x = -.35; add(tail, G.sph, col(p.tailTip !== undefined ? p.tailTip : p.col), 0, gi * .85, -gi * 2.75, gi * .42, gi * .42, gi * .6).rotation.x = -.35; }
  if (p.tail === "dragon") for (let i = 0; i < 7; i++) { add(tail, G.sph, bm, 0, -i * gi * .12, -i * gi * .55, gi * (.6 - i * .075), gi * (.55 - i * .07), gi * .5); if (p.spikes !== undefined && i < 6) add(tail, G.cone, col(p.spikes), 0, -i * gi * .12 + gi * (.55 - i * .07), -i * gi * .55, gi * .1, gi * .35, gi * .1); }
  if (p.tail === "feather") for (let i = 0; i < 7; i++) { const a = (i - 3) * .24, t = add(tail, G.sph, tc(i), Math.sin(a) * gi * 1.4, gi * .5, -gi * 1.5 * Math.cos(a), gi * .2, gi * .06, gi * 1.5); t.rotation.y = a; t.rotation.x = .5; }
  if (p.spikes !== undefined) for (let i = 0; i < 7; i++) add(body, G.cone, col(p.spikes), 0, gi * 1.05, L * (.38 - i * .13), gi * .13, gi * .5, gi * .13);
  if (p.wings) { u.wings = []; [-1, 1].forEach(s => { const w = grp(body, s * gi * .6, gi * .62, L * .12), wc = p.wingC || [p.col];
    if (p.wings === "bat") { for (let i = 0; i < 4; i++) { const f = add(w, G.sph, col(wc[i % wc.length]), s * (.5 + i * .55) * L * .34, .02, -i * L * .09, L * .26, .035, L * (.3 - i * .035)); f.rotation.y = s * i * .12; } add(w, G.cyl, bm, s * L * .5, .05, L * .08, .05, L * 1.05, .05).rotation.z = Math.PI / 2; }
    else for (let i = 0; i < 6; i++) { const f = add(w, G.sph, col(wc[i % wc.length]), s * (.28 + i * .3) * L * .34, .02, -i * L * .045 - L * .06, L * .1, .035, L * (.36 - i * .03)); f.rotation.y = s * (.15 + i * .09); }
    u.wings.push(w); }); }
  u.hatA = grp(head, 0, hw * 1.0, hl * .1); u.hatS = hw / .2; u.scarfA = grp(neck, 0, p.neckW * .6, 0); u.scarfS = p.neckW / .16; u.backA = grp(body, 0, gi * .98, -L * .02); u.backS = gi / .5; u.backL = L;
  u.seatY = by + gi * .95; u.r = L * .5 + .3; u.kind = "quad";
  return g;
}
/* ------------------------------ birds ------------------------------ */
function buildBird(p) {
  const g = grp(), u = g.userData, s = p.s, mo = p.mat || {}, bm = M(p.col, mo), wm = M(p.wing !== undefined ? p.wing : p.col, mo), col = c => M(c, mo), lh = s * .55;
  const body = grp(g, 0, lh + s * .5, 0); u.body = body; u.by = lh + s * .5;
  add(body, G.sph, bm, 0, 0, 0, s * .5, s * .52, s * .72); add(body, G.sph, col(p.belly !== undefined ? p.belly : p.col), 0, -s * .1, s * .16, s * .42, s * .42, s * .5);
  u.legs = []; [-1, 1].forEach(k => { const lg = grp(g, k * s * .2, lh + s * .1, 0); add(lg, G.cyl, col(p.legC || 0xf2a53a), 0, -lh / 2, 0, s * .045, lh + s * .1, s * .045); add(lg, G.sph, col(p.legC || 0xf2a53a), 0, -lh - s * .05 + .03, s * .1, s * .14, s * .04, s * .2); u.legs.push(lg); });
  const neck = grp(body, 0, s * .3, s * .45); neck.rotation.x = .25; u.neck = neck; u.neckA = .25; add(neck, G.cyl, bm, 0, s * .2 * (p.neck || 1), 0, s * .2, s * .5 * (p.neck || 1), s * .2);
  const head = grp(neck, 0, s * .5 * (p.neck || 1), 0); head.rotation.x = -.25; u.head = head; add(head, G.sph, p.headC !== undefined ? col(p.headC) : bm, 0, 0, 0, s * .29);
  const bk = add(head, p.bill === "flat" ? G.sph : G.cone, col(p.beak || 0xf2a53a), 0, -s * .03, s * .36, s * (p.bill === "flat" ? .15 : .1), s * (p.bill === "flat" ? .06 : .3), s * (p.bill === "flat" ? .22 : .1)); if (p.bill !== "flat") bk.rotation.x = Math.PI / 2;
  [-1, 1].forEach(k => { add(head, G.sph, M(0x1e1814, { roughness: .25 }), k * s * .2, s * .07, s * .19, s * .055); add(head, G.sph, M(0xffffff), k * s * .22, s * .09, s * .225, s * .018); });
  if (p.comb !== undefined) { for (let i = 0; i < 3; i++) add(head, G.sph, col(p.comb), 0, s * (.3 - Math.abs(i - 1) * .04), s * (.12 - i * .12), s * .07, s * .12, s * .09); add(head, G.sph, col(p.comb), 0, -s * .22, s * .26, s * .06, s * .1, s * .05); }
  if (p.crest) for (let i = 0; i < 5; i++) { const c = add(head, G.sph, col(p.crest[i % p.crest.length]), (i - 2) * s * .06, s * .5, -s * .1 - Math.abs(i - 2) * s * .03, s * .04, s * .32, s * .07); c.rotation.x = -.5; c.rotation.z = -(i - 2) * .2; }
  u.wings = []; [-1, 1].forEach(k => { const w = grp(body, k * s * .42, s * .18, 0);
    if (p.big) for (let i = 0; i < 6; i++) { const f = add(w, G.sph, col(p.wingC[i % p.wingC.length]), k * (.25 + i * .28) * s, 0, -i * s * .07, s * .16, s * .03, s * (.6 - i * .05)); f.rotation.y = k * (.1 + i * .08); }
    else add(w, G.sph, wm, k * s * .04, -s * .05, -s * .05, s * .1, s * .34, s * .52);
    u.wings.push(w); });
  const tail = grp(body, 0, s * .12, -s * .62); u.tail = tail; const tn = p.tailN || 3;
  for (let i = 0; i < tn; i++) { const a = (i - (tn - 1) / 2) * (p.big ? .2 : .3), tl = p.tailL || .5, t = add(tail, G.sph, col(p.tailC ? p.tailC[i % p.tailC.length] : p.col), Math.sin(a) * s * tl, s * (p.big ? -.05 : .2), -Math.cos(a) * s * tl, s * .1, s * .04, s * tl); t.rotation.y = a; t.rotation.x = p.big ? -.12 : .6;
    if (p.big) add(tail, G.sph, col(p.eyeC || 0xffffff), Math.sin(a) * s * tl * 1.9, s * -.16, -Math.cos(a) * s * tl * 1.9, s * .13, s * .05, s * .17).rotation.y = a; }
  u.hatA = grp(head, 0, s * .27, 0); u.hatS = s * 1.3; u.scarfA = grp(neck, 0, s * .12, 0); u.scarfS = s * 1.35; u.backA = grp(body, 0, s * .5, -s * .05); u.backS = s; u.backL = s * 1.2;
  u.seatY = lh + s * 1.02; u.r = s * .8 + .2; u.kind = "bird";
  return g;
}
function buildFish() {
  const g = grp(), u = g.userData, gm = M(0xffb92e, { metalness: .5, roughness: .25, emissive: 0xff9a1a, emissiveIntensity: .35 }), fm = M(0xfff0b0, { transparent: true, opacity: .85, emissive: 0xffd76a, emissiveIntensity: .4 });
  const body = grp(g, 0, 0, 0); u.body = body; add(body, G.sph, gm, 0, 0, 0, .22, .3, .6); add(body, G.sph, M(0xffffff), 0, -.08, .1, .18, .2, .4);
  [-1, 1].forEach(s => { add(body, G.sph, M(0x1e1814), s * .15, .08, .4, .05); add(body, G.sph, fm, s * .25, -.08, .12, .2, .03, .14).rotation.z = s * .5; });
  const tail = grp(body, 0, 0, -.55); u.tail = tail; [-1, 0, 1].forEach(s => { const t = add(tail, G.sph, fm, 0, s * .2, -.3, .03, .16, .4); t.rotation.x = s * .5; });
  add(body, G.sph, fm, 0, .32, -.05, .03, .14, .3); add(body, G.sph, M(0xffd76a, { emissive: 0xffe9a0, emissiveIntensity: .8 }), 0, .42, .3, .07);
  u.legs = []; u.kind = "fish"; u.r = 1; u.seatY = 0; u.hatA = grp(body, 0, .3, .3); u.hatS = 1; u.scarfA = grp(body); u.scarfS = 0; u.backA = grp(body); u.backS = 0;
  return g;
}

/* ------------------------------ every kind of animal ------------------------------ */
const HORSE = { len: 2.2, girth: .52, legH: 1.08, legW: .1, neckL: .95, neckW: .21, neckA: .62, headW: .21, headL: .34, headA: 1.25, ear: "point", tail: "horse", snoutW: .74, snoutL: .7 };
const HORSE_COATS = [[0x9b5a2e, 0x3a2416], [0x2e2a2c, 0x151312], [0xf5f1ea, 0xe6dfd2], [0xe0b56a, 0xfff3d6], [0x9aa0a8, 0x4c4f58], [0x6e3f22, 0x1c1410]];
const glowy = (c, k) => ({ emissive: c, emissiveIntensity: k, roughness: .5 });
const SPECIES = {
  horse: { n: "Horse", e: "🐴", cost: 120, ride: 1, speed: 13, coats: 6, build: c => buildQuad(Object.assign({}, HORSE, { col: HORSE_COATS[c][0], mane: HORSE_COATS[c][1], patch: c === 5 ? 3 : undefined, patchC: 0xffffff })) },
  chicken: { n: "Chicken", e: "🐔", cost: 20, prod: "egg", home: "coop", coats: 3, build: c => buildBird({ s: .42, col: [0xffffff, 0xb5723c, 0x3a3436][c], comb: 0xe8413a, tailN: 4, tailL: .42 }) },
  duck: { n: "Duck", e: "🦆", cost: 25, prod: "egg", home: "coop", coats: 2, build: c => buildBird({ s: .44, col: [0xffffff, 0xffe27a][c], bill: "flat", beak: 0xff9a2a, legC: 0xff9a2a, tailN: 3, tailL: .32, neck: 1.2 }) },
  sheep: { n: "Sheep", e: "🐑", cost: 50, prod: "wool", coats: 2, build: c => buildQuad({ len: 1.15, girth: .5, legH: .42, legW: .07, neckL: .2, neckW: .17, neckA: .95, headW: .17, headL: .2, headA: 1.2, ear: "floppy", tail: "puff", col: [0xfaf6ea, 0x8a7a70][c], wool: 1, head: 0x3a3436, legC: 0x3a3436 }) },
  goat: { n: "Goat", e: "🐐", cost: 50, prod: "milk", coats: 2, build: c => buildQuad({ len: 1.05, girth: .36, legH: .55, legW: .06, neckL: .34, neckW: .13, neckA: .5, headW: .15, headL: .21, headA: 1.1, ear: "floppy", tail: "short", horns: 1.4, beard: 1, col: [0xf2efe8, 0xa87a50][c] }) },
  alpaca: { n: "Alpaca", e: "🦙", cost: 80, prod: "wool", coats: 3, build: c => buildQuad({ len: 1.2, girth: .46, legH: .72, legW: .09, neckL: .95, neckW: .2, neckA: .14, headW: .19, headL: .2, headA: 1.35, ear: "point", tail: "puff", wool: 1, woolNeck: 1, fluff: 1, col: [0xf7ecd8, 0xa6764e, 0xffffff][c], snout: 0xe9d6bd }) },
  bunny: { n: "Bunny", e: "🐰", cost: 30, hop: 1, coats: 4, build: c => buildQuad({ len: .5, girth: .2, legH: .09, legW: .05, neckL: .06, neckW: .13, neckA: .5, headW: .15, headL: .14, headA: 1.3, ear: "long", tail: "puff", tailC: 0xffffff, col: [0xffffff, 0x9aa0a8, 0xb5825a, 0x3a3436][c], nose: 0xff9db0 }) },
  unicorn: { n: "Unicorn", e: "🦄", cost: 300, magic: "Rainbow", ride: 1, speed: 15, prod: "stardust", sp: [0xff9ecb, 0xffd27a, 0xa6f0c0, 0x9fd0ff, 0xc9a8ff], build: () => buildQuad(Object.assign({}, HORSE, { col: 0xffffff, mane: [0xff9ecb, 0xffd27a, 0xfff59e, 0xa6f0c0, 0x9fd0ff, 0xc9a8ff], horn: 1, hoof: 0xffd76a, mat: glowy(0xffe6f5, .12) })) },
  pegasus: { n: "Pegasus", e: "🪽", cost: 350, magic: "Cloud puff", ride: 1, fly: 1, speed: 15, prod: "stardust", sp: [0xffffff, 0xbfe3ff], build: () => buildQuad(Object.assign({}, HORSE, { col: 0xf4f8ff, mane: [0x8fc4ff, 0xbfe3ff], wings: "feather", wingC: [0xffffff, 0xeaf4ff, 0xbfe3ff], hoof: 0xbfc8d6 })) },
  alicorn: { n: "Alicorn", e: "💜", cost: 500, magic: "Star shower", ride: 1, fly: 1, speed: 16, prod: "stardust", sp: [0xc9a8ff, 0xff7eb6, 0xfff59e], build: () => buildQuad(Object.assign({}, HORSE, { col: 0xd9c2ff, mane: [0x7a4fd0, 0xff7eb6, 0x4fa8ff], horn: 1, wings: "feather", wingC: [0xd9c2ff, 0xf0c2f5, 0xff9ecb], hoof: 0xffd76a, mat: glowy(0xb48cff, .14) })) },
  windfire: { n: "Windfire", e: "🌬️", cost: 350, magic: "Whirlwind", ride: 1, fly: 1, speed: 17, prod: "stardust", sp: [0x7fe3d0, 0xffffff, 0xbff5ff], scale: .86, build: () => buildQuad(Object.assign({}, HORSE, { col: 0x7fe3d0, belly: 0xeafffa, mane: [0xffffff, 0x4fd0e0, 0xffd23f], crest: 1, wings: "feather", wingC: [0x4fd0e0, 0x9af0e4, 0xffffff], tail: "feather", tailC: [0x4fd0e0, 0xffffff, 0xffd23f], snout: 0xffc94a, snoutW: .5, hoof: 0xffc94a, mat: glowy(0x4fd0e0, .1) })) },
  waterhorse: { n: "Water Horse", e: "🌊", cost: 300, magic: "Splash wave", ride: 1, speed: 15, prod: "stardust", water: 1, sp: [0x7fd8ff, 0xffffff, 0x3fa9ff], build: () => buildQuad(Object.assign({}, HORSE, { col: 0x58c8f0, mane: [0xbff0ff, 0xffffff, 0x7fd8ff], hoof: 0xbff0ff, mat: { roughness: .15, metalness: .2, emissive: 0x1f7fc0, emissiveIntensity: .2 } })) },
  winterfox: { n: "Winter Fox", e: "🦊", cost: 200, magic: "Snow flurry", prod: "stardust", sp: [0xffffff, 0xbfe9ff], build: () => buildQuad({ len: .95, girth: .24, legH: .36, legW: .05, neckL: .2, neckW: .12, neckA: .7, headW: .17, headL: .2, headA: 1.2, ear: "bigpoint", tail: "bushy", col: 0xf4faff, tailTip: 0x8fd4ff, earC: 0xdff1ff, eye: 0x2f8fe0, snoutW: .5, snoutL: .75, nose: 0x3a4a60, legC: 0xcfe6fa, mat: glowy(0xbfe9ff, .16) }) },
  winterdragon: { n: "Winter Dragon", e: "🐉", cost: 600, magic: "Ice breath", ride: 1, fly: 1, speed: 18, prod: "stardust", sp: [0xbfe9ff, 0xffffff, 0x7fc4ff], build: () => buildQuad({ len: 2.7, girth: .62, legH: .85, legW: .14, neckL: 1.3, neckW: .24, neckA: .45, headW: .27, headL: .42, headA: 1.0, ear: "none", horns: 2.2, hornC: 0x8fd4ff, tail: "dragon", spikes: 0x8fd4ff, wings: "bat", wingC: [0xa9dcff, 0xcfeeff], col: 0xe6f6ff, belly: 0xa9dcff, eye: 0x2f8fe0, hoof: 0x8fd4ff, snoutL: .8, mat: glowy(0x9fd8ff, .14) }) },
  firebird: { n: "Firebird", e: "🔥", cost: 400, magic: "Fire swirl", ride: 1, fly: 1, speed: 17, prod: "feather", sp: [0xff7a1a, 0xffc233, 0xff4d1a], build: () => buildBird({ s: 1.25, col: 0xff7a1a, belly: 0xffc233, big: 1, wingC: [0xff7a1a, 0xffa52a, 0xffc233], tailN: 6, tailL: .95, tailC: [0xff4d1a, 0xffc233, 0xff7a1a], eyeC: 0xffe27a, crest: [0xffc233, 0xff4d1a], beak: 0xffd23f, legC: 0xffc233, mat: glowy(0xff5a00, .4) }) },
  phoenix: { n: "Phoenix", e: "🐦‍🔥", cost: 500, magic: "Sun burst", ride: 1, fly: 1, speed: 18, prod: "feather", sp: [0xffd23f, 0xff5a2a, 0xb04cff], build: () => buildBird({ s: 1.5, col: 0xd9263a, belly: 0xff9a2a, headC: 0xff5a2a, big: 1, wingC: [0xd9263a, 0xff5a2a, 0xff9a2a, 0xffd23f], tailN: 8, tailL: 1.15, tailC: [0xffd23f, 0xff5a2a, 0xb04cff], eyeC: 0xb04cff, crest: [0xffd23f, 0xffe9a0], beak: 0xffd23f, legC: 0xffd23f, neck: 1.2, mat: glowy(0xff2a00, .38) }) },
  wishfish: { n: "Wishing Fish", e: "🐠", cost: 250, magic: "Wish bubbles", home: "pond", sp: [0xffd76a, 0xffffff, 0x9fd0ff], build: () => buildFish() },
  custom: { n: "Animal", e: "✨", cost: 150, build: (c, an) => buildCustom(an.word || "animal") }
};
const SHOP_ORDER = ["chicken", "duck", "bunny", "sheep", "goat", "alpaca", "horse", "winterfox", "unicorn", "waterhorse", "pegasus", "windfire", "firebird", "alicorn", "phoenix", "winterdragon", "wishfish"];
/* any animal you type: a few we know, and a mystery animal for the rest */
const KNOWN = [
  ["cow", "🐮", { len: 1.7, girth: .58, legH: .7, legW: .1, neckL: .35, neckW: .22, neckA: .9, headW: .22, headL: .28, headA: 1.2, ear: "floppy", tail: "thin", col: 0xffffff, patch: 5, patchC: 0x2e2a2c, snout: 0xffb7c8, horns: .8 }],
  ["pig", "🐷", { len: 1.2, girth: .5, legH: .32, legW: .08, neckL: .12, neckW: .24, neckA: 1.1, headW: .24, headL: .22, headA: 1.4, ear: "point", tail: "puff", col: 0xffb0c4, snout: 0xff8fae, snoutL: .4 }],
  ["dog|puppy", "🐶", { len: .95, girth: .28, legH: .42, legW: .06, neckL: .2, neckA: .6, headW: .19, headL: .2, headA: 1.2, ear: "floppy", tail: "short", col: 0xe0b56a, nose: 0x2a2020, earC: 0xb5823c }],
  ["cat|kitten|kitty", "🐱", { len: .75, girth: .2, legH: .3, legW: .045, neckL: .12, neckA: .6, headW: .17, headL: .15, headA: 1.25, ear: "bigpoint", tail: "thin", col: 0xf2a04a, nose: 0xff9db0, snoutL: .4 }],
  ["zebra", "🦓", Object.assign({}, HORSE, { col: 0xffffff, mane: [0x1a1a1a, 0xffffff], patch: 9, patchC: 0x1a1a1a })],
  ["donkey|mule", "🫏", Object.assign({}, HORSE, { len: 1.7, legH: .8, col: 0x8f8a88, mane: 0x3a3436, ear: "long", snout: 0xf2efe8 })],
  ["pony", "🐴", Object.assign({}, HORSE, { len: 1.6, legH: .7, col: 0xc98a4a, mane: 0xfff3d6 })],
  ["giraffe", "🦒", { len: 1.8, girth: .5, legH: 1.6, legW: .09, neckL: 2.2, neckW: .2, neckA: .2, headW: .2, headL: .28, headA: 1.35, ear: "point", tail: "thin", col: 0xf2c84a, patch: 4, patchC: 0xa8642a, horns: .6, hornC: 0xa8642a }],
  ["elephant", "🐘", { len: 2.4, girth: .95, legH: .9, legW: .22, neckL: .2, neckW: .4, neckA: 1.0, headW: .5, headL: .42, headA: 1.3, ear: "big", tail: "thin", col: 0x9aa0a8, trunk: 1 }],
  ["lion", "🦁", { len: 1.5, girth: .42, legH: .6, legW: .09, neckL: .3, neckW: .3, neckA: .7, headW: .26, headL: .24, headA: 1.2, ear: "round", tail: "thin", col: 0xe0a94a, mane: 0x9b5a2e, nose: 0x3a2416 }],
  ["tiger", "🐯", { len: 1.6, girth: .42, legH: .58, legW: .09, neckL: .3, neckW: .22, neckA: .7, headW: .25, headL: .24, headA: 1.2, ear: "round", tail: "thin", col: 0xf28a2a, patch: 6, patchC: 0x1e1814, belly: 0xffffff, nose: 0xff9db0 }],
  ["panda", "🐼", { len: 1.3, girth: .55, legH: .42, legW: .13, neckL: .15, neckW: .3, neckA: .9, headW: .3, headL: .26, headA: 1.3, ear: "round", tail: "puff", col: 0xffffff, legC: 0x1e1814, earC: 0x1e1814, nose: 0x1e1814 }],
  ["bear", "🐻", { len: 1.5, girth: .6, legH: .5, legW: .14, neckL: .18, neckW: .32, neckA: .9, headW: .3, headL: .27, headA: 1.3, ear: "round", tail: "puff", col: 0x8a5a3a, snout: 0xd9b27a, nose: 0x1e1814 }],
  ["wolf", "🐺", { len: 1.2, girth: .3, legH: .52, legW: .06, neckL: .25, neckA: .6, headW: .19, headL: .22, headA: 1.2, ear: "bigpoint", tail: "bushy", col: 0x8f959e, tailTip: 0xffffff, nose: 0x1e1814, snoutL: .8 }],
  ["fox", "🦊", { len: .95, girth: .24, legH: .36, legW: .05, neckL: .2, neckW: .12, neckA: .7, headW: .17, headL: .2, headA: 1.2, ear: "bigpoint", tail: "bushy", col: 0xf2782a, tailTip: 0xffffff, legC: 0x3a2416, nose: 0x1e1814, snoutL: .75 }],
  ["deer|reindeer|moose", "🦌", { len: 1.5, girth: .4, legH: .9, legW: .06, neckL: .6, neckW: .15, neckA: .4, headW: .17, headL: .24, headA: 1.2, ear: "point", tail: "puff", tailC: 0xffffff, col: 0xb5825a, horns: 2.4, hornC: 0xe9dcc0, nose: 0x1e1814 }],
  ["llama", "🦙", { len: 1.3, girth: .46, legH: .85, legW: .09, neckL: 1.05, neckW: .2, neckA: .14, headW: .19, headL: .22, headA: 1.35, ear: "point", tail: "puff", wool: 1, woolNeck: 1, col: 0xd9b88a }],
  ["mouse|hamster|rat|guinea", "🐭", { len: .4, girth: .17, legH: .06, legW: .035, neckL: .04, neckW: .1, neckA: .5, headW: .13, headL: .13, headA: 1.3, ear: "round", tail: "thin", col: 0xcfc6c0, nose: 0xff9db0 }],
  ["koala", "🐨", { len: .8, girth: .36, legH: .26, legW: .09, neckL: .08, neckW: .2, neckA: .8, headW: .25, headL: .2, headA: 1.3, ear: "round", tail: "puff", col: 0x9aa0a8, nose: 0x2a2020, earC: 0xffffff }],
  ["monkey", "🐵", { len: .8, girth: .26, legH: .42, legW: .06, neckL: .12, neckA: .4, headW: .2, headL: .17, headA: 1.2, ear: "round", tail: "thin", col: 0x8a5a3a, snout: 0xf2c6a0 }],
  ["dinosaur|dino|t-rex|trex", "🦖", { len: 2.6, girth: .62, legH: .85, legW: .15, neckL: 1.1, neckW: .26, neckA: .5, headW: .28, headL: .46, headA: 1.0, ear: "none", tail: "dragon", spikes: 0xffd23f, col: 0x58b947, belly: 0xd8f0a0, snoutL: .85 }],
  ["dragon", "🐲", { len: 2.6, girth: .62, legH: .85, legW: .14, neckL: 1.2, neckW: .24, neckA: .45, headW: .27, headL: .42, headA: 1.0, ear: "none", horns: 2, tail: "dragon", spikes: 0xffd23f, wings: "bat", wingC: [0xff9a2a, 0xffd23f], col: 0x4fb26a, belly: 0xffe9a0, snoutL: .8 }]
];
const KNOWN_BIRDS = [
  ["penguin", "🐧", { s: .6, col: 0x23232e, belly: 0xffffff, tailN: 2, tailL: .2, legC: 0xff9a2a }], ["owl", "🦉", { s: .55, col: 0x8a6a4a, belly: 0xe9d6bd, tailN: 3, tailL: .3 }],
  ["parrot|macaw", "🦜", { s: .55, col: 0xe8413a, wing: 0x3fa9ff, belly: 0xffd23f, tailN: 4, tailL: .9, tailC: [0x3fa9ff, 0xe8413a] }], ["flamingo", "🦩", { s: .6, col: 0xff8fb8, neck: 2.6, tailN: 3, tailL: .3, legC: 0xff8fb8, beak: 0x2a2020 }],
  ["peacock", "🦚", { s: .7, col: 0x1f7fd0, big: 1, wingC: [0x1f9a8a, 0x2fd3b0], tailN: 9, tailL: 1.1, tailC: [0x1f9a6a, 0x2fd3b0], eyeC: 0x3f6fff, crest: [0x1f7fd0], neck: 1.5 }], ["swan|goose", "🦢", { s: .7, col: 0xffffff, neck: 2.2, bill: "flat", beak: 0xff9a2a, tailN: 3, tailL: .3, legC: 0x3a3436 }],
  ["turkey", "🦃", { s: .7, col: 0x6e4a32, comb: 0xe8413a, big: 1, wingC: [0x6e4a32, 0x8a5a3a], tailN: 9, tailL: .7, tailC: [0x8a5a3a, 0xd9a66c], eyeC: 0xffffff }], ["eagle|hawk|falcon", "🦅", { s: .8, col: 0x5a3a22, headC: 0xffffff, big: 1, wingC: [0x5a3a22, 0x7a5236], tailN: 4, tailL: .6, tailC: [0xffffff], beak: 0xffd23f }],
  ["bird|robin|dove|pigeon|sparrow", "🐦", { s: .4, col: 0x4fa8ff, belly: 0xffd9a0, tailN: 3, tailL: .5 }]
];
function customInfo(word) {
  const w = word.toLowerCase(); for (const k of KNOWN) if (k[0].split("|").some(x => w.includes(x))) return { e: k[1], quad: k[2] }; for (const k of KNOWN_BIRDS) if (k[0].split("|").some(x => w.includes(x))) return { e: k[1], bird: k[2] };
  const r = srand(hashStr(w)), c = new THREE.Color().setHSL(r(), .55 + r() * .3, .6 + r() * .15).getHex(), c2 = new THREE.Color().setHSL(r(), .7, .55).getHex();
  return { e: "✨", quad: { len: .8 + r() * 1.2, girth: .28 + r() * .3, legH: .3 + r() * .6, legW: .07, neckL: .2 + r() * .5, neckA: .3 + r() * .5, headW: .2, headL: .22, headA: 1.2, ear: pick2(r, ["point", "round", "long", "floppy", "bigpoint"]), tail: pick2(r, ["puff", "bushy", "horse", "thin"]), col: c, mane: r() < .5 ? c2 : undefined, tailTip: c2, belly: 0xffffff, nose: 0x2a2020 } };
}
function pick2(r, a) { return a[Math.floor(r() * a.length)]; }
function buildCustom(word) { const i = customInfo(word); return i.bird ? buildBird(i.bird) : buildQuad(i.quad); }

/* dress-up: hats, scarves and saddles that fit any animal */
const A_HATS = ["Nothing", "Bow", "Flower crown", "Cowboy hat", "Party hat", "Crown"], A_COL = [0xff7eb6, 0x9b5cff, 0x3fa9ff, 0x2fd3b0, 0xffd23f, 0xff5a4d, 0xffffff];
function dressAnimal(g, wear) {
  const u = g.userData; [u.hatA, u.scarfA, u.backA].forEach(a => { while (a.children.length) a.remove(a.children[0]); }); if (!wear) return;
  const h = grp(u.hatA); h.scale.setScalar(u.hatS);
  if (wear.hat === 1) { [-1, 1].forEach(s => { const b = add(h, G.cone, M(0xff5fa2), s * .08, .06, 0, .08, .16, .05); b.rotation.z = s * Math.PI / 2; }); add(h, G.sph, M(0xff8fc0), 0, .06, 0, .045); }
  if (wear.hat === 2) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(h, G.sph, M([0xff7eb6, 0xffd23f, 0xffffff, 0xc9a2ff][i % 4]), Math.cos(a) * .15, 0, Math.sin(a) * .15, .05); }
  if (wear.hat === 3) { add(h, G.cyl, M(0xd9b27a), 0, 0, 0, .3, .025, .3); add(h, G.cyl, M(0xd9b27a), 0, .09, 0, .15, .17, .15); add(h, G.cyl, M(0xff7eb6), 0, .04, 0, .155, .04, .155); }
  if (wear.hat === 4) { add(h, G.cone, M(0x3fa9ff), 0, .15, 0, .12, .34, .12); add(h, G.sph, M(0xffd23f), 0, .33, 0, .045); }
  if (wear.hat === 5) { add(h, G.cyl, M(0xffd23f, { metalness: .7, roughness: .25 }), 0, .04, 0, .14, .1, .14); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(h, G.cone, M(0xffd23f, { metalness: .7, roughness: .25 }), Math.cos(a) * .13, .13, Math.sin(a) * .13, .035, .1, .035); } add(h, G.sph, M(0xff5fa2), 0, .06, .14, .03); }
  if (wear.scarf && u.scarfS) { const s = grp(u.scarfA); s.scale.setScalar(u.scarfS); const m = M(A_COL[(wear.scarf - 1) % A_COL.length]); const t = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 8, 18), m); t.rotation.x = Math.PI / 2; t.castShadow = true; s.add(t); add(s, G.box, m, .08, -.16, .2, .09, .3, .04); }
  if (wear.saddle && u.backS) { const s = grp(u.backA), m = M(A_COL[(wear.saddle - 1) % A_COL.length]), k = u.backS; add(s, G.sph, m, 0, -.04 * k, 0, .56 * k, .1 * k, u.backL * .24); add(s, G.sph, M(0x8a5a3a), 0, .03 * k, 0, .3 * k, .09 * k, u.backL * .14); [-1, 1].forEach(x => add(s, G.sph, M(0xffd23f, { metalness: .6, roughness: .3 }), x * .5 * k, -.12 * k, u.backL * .2, .04 * k)); }
}
function fadeAnimal(g, o) { g.traverse(m => { if (m.isMesh) { if (!m.userData.own) { m.material = m.material.clone(); m.material.transparent = true; m.userData.own = 1; m.userData.o0 = m.material.opacity; } m.material.opacity = m.userData.o0 * o; m.castShadow = o > .5; } }); }
function animAnimal(g, t, moving, flying, k) {
  const u = g.userData; if (u.kind === "fish") { u.tail.rotation.y = Math.sin(t * 6) * .5; return; }
  const ph = t * (u.kind === "bird" ? 12 : 9) * (k || 1), amp = moving ? .55 : 0;
  u.legs.forEach((l, i) => { const tgt = flying ? (u.kind === "bird" ? 1.1 : (i < 2 ? .7 : -.7)) : Math.sin(ph + ((u.kind === "bird" ? i : (i === 0 || i === 3)) ? 0 : Math.PI)) * amp; l.rotation.x += (tgt - l.rotation.x) * .3; });
  if (u.tail) u.tail.rotation.y = Math.sin(t * 2.2 + u.by) * .16;
  if (u.neck) u.neck.rotation.x = u.neckA + Math.sin(t * 1.3 + u.by * 3) * .04 + (moving ? Math.sin(ph * 2) * .03 : 0);
  if (u.wings) { const small = u.kind === "bird" && u.wings[0].children.length < 2, fy = flying || small ? 0 : 1.25, f = flying ? Math.sin(t * 9) * .7 + .1 : small ? 0 : -.3 + Math.sin(t * 1.5) * .03, w = u.wings;
    w[0].rotation.z += (-f - w[0].rotation.z) * .3; w[1].rotation.z += (f - w[1].rotation.z) * .3; w[0].rotation.y += (-fy - w[0].rotation.y) * .2; w[1].rotation.y += (fy - w[1].rotation.y) * .2; }
}

/* ------------------------------ crops and things to sell ------------------------------ */
const CROPS = {
  carrot: { n: "Carrot", e: "🥕", cost: 0, sell: 6, t: 30 }, tomato: { n: "Tomato", e: "🍅", cost: 3, sell: 10, t: 38 }, corn: { n: "Corn", e: "🌽", cost: 4, sell: 12, t: 42 },
  strawberry: { n: "Strawberry", e: "🍓", cost: 5, sell: 14, t: 42 }, pumpkin: { n: "Pumpkin", e: "🎃", cost: 6, sell: 18, t: 50 }, sunflower: { n: "Sunflower", e: "🌻", cost: 4, sell: 13, t: 40 },
  apple: { n: "Apple tree", e: "🍎", cost: 15, sell: 11, t: 60, tree: 1, give: 3 },
  winterflower: { n: "Winter flower", e: "❄️", cost: 12, sell: 38, t: 55, magic: 1 }, candycane: { n: "Candy cane", e: "🍭", cost: 10, sell: 26, t: 50, magic: 1 }, moonflower: { n: "Moon flower", e: "🌙", cost: 20, sell: 55, t: 60, magic: 1 }
};
const GOODS = { egg: { n: "Egg", e: "🥚", sell: 8 }, milk: { n: "Milk", e: "🥛", sell: 12 }, wool: { n: "Wool", e: "🧶", sell: 15 }, stardust: { n: "Stardust", e: "✨", sell: 32 }, feather: { n: "Glowing feather", e: "🪶", sell: 36 } };
function itemInfo(id) { return CROPS[id] || GOODS[id]; }
const candyTex = (function () { const c = document.createElement("canvas"); c.width = 16; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 16, 64); x.fillStyle = "#e8413a"; for (let i = -1; i < 9; i++) { x.beginPath(); x.moveTo(0, i * 8); x.lineTo(16, i * 8 + 6); x.lineTo(16, i * 8 + 10); x.lineTo(0, i * 8 + 4); x.fill(); } const t = new THREE.CanvasTexture(c); t.wrapT = THREE.RepeatWrapping; return t; })();
const candyMat = new THREE.MeshStandardMaterial({ map: candyTex, roughness: .35 });
function buildCrop(id, stage) {
  const g = grp(), gr = M(0x4faa4a), spots = id === "apple" ? [[0, 0]] : id === "pumpkin" ? [[-1, -1], [1, -1], [0, 1]] : [[-1.2, -1.2], [1.2, -1.2], [0, 0], [-1.2, 1.2], [1.2, 1.2]], k = [.35, .7, 1][stage], ripe = stage === 2;
  spots.forEach((s, si) => { const p = grp(g, s[0], 0, s[1]); p.rotation.y = si * 1.3;
    if (stage === 0 && id !== "apple") { [-1, 1].forEach(d => add(p, G.sph, M(0x7fd15c), d * .1, .2, 0, .1, .04, .06).rotation.z = d * .6); add(p, G.cyl, gr, 0, .1, 0, .02, .2, .02); return; }
    if (id === "carrot") { for (let i = 0; i < 5; i++) { const f = add(p, G.cone, gr, Math.cos(i * 1.26) * .08, .32 * k, Math.sin(i * 1.26) * .08, .06, .65 * k, .06); f.rotation.z = Math.cos(i * 1.26) * .4; f.rotation.x = Math.sin(i * 1.26) * .4; } if (ripe) add(p, G.sph, M(0xff8a2a), 0, .05, 0, .14, .1, .14); }
    if (id === "tomato" || id === "strawberry") { const low = id === "strawberry"; add(p, G.ico, gr, 0, (low ? .22 : .5) * k, 0, (low ? .5 : .45) * k, (low ? .28 : .55) * k, (low ? .5 : .45) * k); if (!low) add(p, G.cyl, M(0x8a5a3a), .0, .5 * k, 0, .025, 1 * k, .025); if (ripe) for (let i = 0; i < 5; i++) add(p, low ? G.cone : G.sph, M(low ? 0xe8283a : 0xe8413a), Math.cos(i * 1.3) * .36, low ? .2 : .35 + (i % 3) * .2, Math.sin(i * 1.3) * .36, low ? .08 : .11, low ? .16 : .11, low ? .08 : .11).rotation.x = low ? Math.PI : 0; }
    if (id === "corn") { add(p, G.cyl, gr, 0, .9 * k, 0, .045, 1.8 * k, .045); for (let i = 0; i < 4; i++) { const l = add(p, G.sph, M(0x5fba4f), Math.cos(i * 1.6) * .25, (.5 + i * .3) * k, Math.sin(i * 1.6) * .25, .3, .03, .07); l.rotation.y = -i * 1.6; l.rotation.z = .4; } if (ripe) { add(p, G.sph, M(0xffd23f), .08, 1.05, 0, .08, .2, .08); add(p, G.sph, M(0xe9d6a0), 0, 1.85, 0, .05, .14, .05); } }
    if (id === "pumpkin") { for (let i = 0; i < 4; i++) add(p, G.sph, gr, Math.cos(i * 1.6) * .5 * k, .08, Math.sin(i * 1.6) * .5 * k, .28 * k, .04, .22 * k); if (stage >= 1) { const s2 = ripe ? .5 : .22; add(p, G.sph, M(ripe ? 0xff8a1e : 0x9fc24a), 0, s2 * .75, 0, s2, s2 * .75, s2); add(p, G.cyl, M(0x5a7a2a), 0, s2 * 1.5, 0, .04, .18, .04); } }
    if (id === "sunflower") { add(p, G.cyl, gr, 0, .8 * k, 0, .04, 1.6 * k, .04); add(p, G.sph, M(0x5fba4f), .15, .6 * k, 0, .2, .03, .1); if (stage >= 1) { const h = grp(p, 0, 1.6 * k, .05); h.rotation.x = -.3; add(h, G.cyl, M(0x6b4226), 0, 0, 0, .16 * k, .05, .16 * k).rotation.x = Math.PI / 2; if (ripe) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, pt = add(h, G.sph, M(0xffd23f), Math.cos(a) * .26, Math.sin(a) * .26, 0, .12, .05, .03); pt.rotation.z = a; } } }
    if (id === "apple") { const s2 = [.45, .75, 1][stage]; add(p, G.cyl, M(0x7a5236), 0, 1.1 * s2, 0, .16 * s2, 2.2 * s2, .16 * s2); [[0, 2.7, 0, 1.3], [.8, 2.3, .3, .9], [-.8, 2.4, -.2, .95]].forEach(b => add(p, G.ico, M(0x4faa4a), b[0] * s2, b[1] * s2, b[2] * s2, b[3] * s2)); if (ripe) for (let i = 0; i < 9; i++) { const a = i * .7; add(p, G.sph, M(0xe8283a, { roughness: .3 }), Math.cos(a) * 1.15, 2.1 + (i % 3) * .5, Math.sin(a) * 1.15, .15); } }
    if (id === "winterflower") { add(p, G.cyl, M(0x9fd8c8), 0, .35 * k, 0, .03, .7 * k, .03); if (stage >= 1) { const h = grp(p, 0, .72 * k, 0), pm = M(0xeaf8ff, { emissive: 0x9fd8ff, emissiveIntensity: ripe ? .8 : .3, roughness: .2 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, pt = add(h, G.sph, pm, Math.cos(a) * .2 * k, .02, Math.sin(a) * .2 * k, .2 * k, .03, .08 * k); pt.rotation.y = -a; } add(h, G.sph, M(0xffffff, { emissive: 0xffffff, emissiveIntensity: .9 }), 0, .04, 0, .07 * k); } }
    if (id === "candycane") { const c = add(p, G.cyl, candyMat, 0, .5 * k, 0, .06, 1 * k, .06); if (stage >= 1) { const hk = new THREE.Mesh(new THREE.TorusGeometry(.16 * k, .06, 8, 14, Math.PI), candyMat); hk.position.set(.16 * k, 1 * k, 0); hk.castShadow = true; p.add(hk); } if (ripe) add(p, G.sph, M(0x2fa85a), 0, .45, .07, .09, .05, .03); }
    if (id === "moonflower") { add(p, G.cyl, M(0x6f8fb8), 0, .45 * k, 0, .035, .9 * k, .035); if (stage >= 1) { const h = grp(p, 0, .92 * k, 0), pm = M(0xfdfbe8, { emissive: 0xfff3a8, emissiveIntensity: ripe ? 1 : .35, roughness: .3 }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, pt = add(h, G.sph, pm, Math.cos(a) * .22 * k, .05, Math.sin(a) * .22 * k, .22 * k, .05, .1 * k); pt.rotation.y = -a; pt.rotation.z = .25; } add(h, G.sph, M(0xfff3a8, { emissive: 0xffffff, emissiveIntensity: 1 }), 0, .1, 0, .1 * k); } }
  });
  return g;
}

/* ------------------------------ tractor, poop, forest stars ------------------------------ */
function buildTractor() {
  const g = grp(), red = M(0xe8413a, { roughness: .4, metalness: .2 }), dk = M(0x2a2a33), u = g.userData; u.wheels = [];
  add(g, G.box, red, 0, 1.25, .9, 1.3, .9, 2.2); add(g, G.box, red, 0, 1.7, -.7, 1.5, 1.6, 1.5); add(g, G.box, M(0xbfe6ff, { roughness: .1, transparent: true, opacity: .55 }), 0, 2.2, -.7, 1.52, .7, 1.52);
  add(g, G.box, M(0xffd23f), 0, 2.62, -.7, 1.8, .12, 1.8); add(g, G.cyl, dk, .45, 2.2, 1.4, .07, 1.1, .07); add(g, G.box, dk, 0, 1.2, 2.02, 1.1, .6, .06);
  [-1, 1].forEach(s => { add(g, G.sph, M(0xfff3a8, { emissive: 0xffe27a, emissiveIntensity: .7 }), s * .45, 1.45, 2.05, .13); [[-.7, .95, .45], [1.4, .6, .3]].forEach(w => { const wh = grp(g, s * .95, w[1], w[0]); const t = add(wh, G.cyl, dk, 0, 0, 0, w[1], w[2], w[1]); t.rotation.z = Math.PI / 2; add(wh, G.cyl, M(0xffd23f), s * .02, 0, 0, w[1] * .5, w[2] + .04, w[1] * .5).rotation.z = Math.PI / 2; u.wheels.push(wh); }); });
  u.seat = grp(g, 0, 1.25, -.75); return g;
}
function buildPoop() { const g = grp(), m = M(0x7a5236); add(g, G.sph, m, 0, .1, 0, .22, .12, .22); add(g, G.sph, m, 0, .24, 0, .16, .1, .16); add(g, G.sph, m, 0, .35, 0, .09, .09, .09); return g; }
function buildStar() { const g = grp(); const m = M(0xfff3a8, { emissive: 0xffe27a, emissiveIntensity: 1, roughness: .3 }); const a = add(g, G.ico, m, 0, 0, 0, .28); a.geometry = new THREE.OctahedronGeometry(1, 0); a.scale.set(.25, .42, .25); a.castShadow = false; return g; }
