"use strict";
/* ===========================================================================
   Val Training Academy. Part two: the country fair and its ribbon contests,
   helpers you hire, the dream barn and farmhouse, decorations and creature
   houses, your own room, cooking, fishing, hayrides and the corn maze.
   Plugs into game.js through HOT_PRE, HOT_MORE, STEP_MORE, SERVE_MORE,
   WANT_MORE and JUMP_CB.
   =========================================================================== */
S.rib = S.rib || { b: 0, r: 0, w: 0 }; S.help = S.help || {}; S.decor = S.decor || []; S.room = S.room || { floor: 0, wall: 0, items: [{ k: "bed0", x: -5, z: -403.5, r: 0 }] };
const FAIR = { x: -34, z: 72 }, ROOM = { x: 0, z: -400, w: 16, d: 12 }, MAZE = { x: 22, z: 58, n: 9, c: 3.2 };
let C = null, carry = null, FISHING = null, HAY = null;
const tim = document.createElement("div"); tim.style.cssText = "position:fixed;left:50%;top:calc(var(--sat) + 104px);transform:translateX(-50%);z-index:21;background:rgba(122,79,208,.94);color:#fff;border-radius:18px;padding:8px 18px;font:800 18px var(--font);text-align:center;pointer-events:none"; tim.hidden = true; document.body.appendChild(tim);
function near(x, z, r) { return Math.hypot(pl.x - x, pl.z - z) - (r || 0); }
function flash(fn) { $("dark").style.opacity = 1; setTimeout(() => { if (fn) fn(); $("dark").style.opacity = 0; }, 350); }
function snapCam() { const cp = Math.cos(camPitch); camera.position.set(pl.x + Math.sin(camYaw) * cp * 7, hgt(pl.x, pl.z) + 4, pl.z + Math.cos(camYaw) * cp * 7); }
function pay(n) { if (S.money < n) { SFX.no(); toast("You need $" + n + ". Sell some things to visitors first!"); return false; } S.money -= n; hud(); return true; }

/* ------------------------------ cooked food and fish are things you can sell ------------------------------ */
Object.assign(GOODS, { cake: { n: "Carrot cake", e: "🍰", sell: 45 }, soup: { n: "Tomato soup", e: "🍲", sell: 38 }, popcorn: { n: "Popcorn", e: "🍿", sell: 42 }, shake: { n: "Strawberry milkshake", e: "🥤", sell: 62 }, pie: { n: "Pumpkin pie", e: "🥧", sell: 56 }, applepie: { n: "Apple pie", e: "🍏", sell: 40 },
  mooncookie: { n: "Moon cookie", e: "🍪", sell: 150 }, cocoa: { n: "Candy cane cocoa", e: "☕", sell: 95 }, sorbet: { n: "Winter sorbet", e: "🍧", sell: 100 },
  fish: { n: "Fish", e: "🐟", sell: 18 }, rainbowfish: { n: "Rainbow fish", e: "🐠", sell: 36 }, crab: { n: "Crab", e: "🦀", sell: 24 }, boot: { n: "Old boot", e: "🥾", sell: 1 }, pearl: { n: "Pond pearl", e: "💎", sell: 70 } });
const RECIPES = [["cake", { carrot: 2, egg: 1 }], ["soup", { tomato: 2 }], ["popcorn", { corn: 2 }], ["shake", { strawberry: 2, milk: 1 }], ["pie", { pumpkin: 1, egg: 1 }], ["applepie", { apple: 2 }], ["mooncookie", { moonflower: 1, egg: 1 }], ["cocoa", { candycane: 1, milk: 1 }], ["sorbet", { winterflower: 1 }]];
ACT.cook = () => openM(X + "<h2>🍳 Cook with your crops</h2><div class='grid'>" + RECIPES.map((r, i) => { const ok = Object.keys(r[1]).every(k => (S.inv[k] || 0) >= r[1][k]), g = GOODS[r[0]]; return '<button class="it" data-a="cookIt" data-v="' + i + '"' + (ok ? "" : " disabled") + "><span>" + g.e + "</span>" + g.n + "<small>" + Object.keys(r[1]).map(k => r[1][k] + " " + itemInfo(k).e).join(" + ") + " · sells $" + g.sell + "</small></button>"; }).join("") + "</div><p><small>Cooked food sells for a lot more than plain crops.</small></p>");
ACT.cookIt = i => { const r = RECIPES[i]; Object.keys(r[1]).forEach(k => S.inv[k] -= r[1][k]); S.inv[r[0]] = (S.inv[r[0]] || 0) + 1; SFX.good(); pop("+1 " + GOODS[r[0]].e); burst(ROOM.x + 5.5, 2, ROOM.z - 4.6, [0xffffff, 0xfff3a8], 14, 1.2, 2.5, .4); ACT.cook(); save(); };

/* ------------------------------ fishing ------------------------------ */
ACT.fish = () => { FISHING = { bite: tNow + rnd(1.5, 4.5), state: 0 }; openM("<h2>🎣 Fishing</h2><p id='fsay'>Shhh… wait for a bite…</p><div class='row'><button class='btn mag' data-a='pull' style='font-size:22px;padding:16px 36px'>Pull!</button></div><div class='row'><button class='btn alt' data-a='close'>Stop fishing</button></div>"); };
ACT.pull = () => { const f = FISHING; if (!f) return; if (f.state !== 1) { FISHING = null; SFX.no(); closeM(); return toast(f.state === 0 ? "Too early! The fish swam away." : "Too slow! It got away."); }
  const r = Math.random(), k = r < .45 ? "fish" : r < .65 ? "crab" : r < .85 ? "rainbowfish" : r < .93 ? "pearl" : "boot"; S.inv[k] = (S.inv[k] || 0) + 1; FISHING = null; closeM(); SFX.good(); pop("You caught a " + GOODS[k].n.toLowerCase() + "! " + GOODS[k].e); burst(pl.x, 1.5, pl.z, [0xbfe9ff, 0xffffff], 16, 2, 3, .4); save(); };

/* ------------------------------ things you place yourself: room furniture, decorations, creature houses ------------------------------ */
function bx(g, c, x, y, z, sx, sy, sz, o) { return add(g, G.box, M(c, o), x, y, z, sx, sy, sz); }
function bedModel(frame, quilt, canopy, cloud) { const g = grp(); bx(g, frame, 0, .3, 0, 2, .4, 3.2); bx(g, 0xffffff, 0, .58, 0, 1.85, .25, 3.05); bx(g, quilt, 0, .68, .45, 1.9, .2, 2.1); add(g, G.sph, M(0xffffff), 0, .8, -1.15, .6, .16, .3); bx(g, frame, 0, .9, -1.6, 2, 1.4, .15);
  if (canopy) { [[-1, -1.55], [1, -1.55], [-1, 1.55], [1, 1.55]].forEach(p => add(g, G.cyl, M(0xffd76a, { metalness: .5, roughness: .3 }), p[0] * .95, 1.6, p[1], .05, 3, .05)); bx(g, quilt, 0, 3.1, 0, 2.1, .1, 3.3, { transparent: true, opacity: .75 }); add(g, G.sph, M(0xffd76a, { metalness: .5, roughness: .3 }), 0, 1.75, -1.6, .2); }
  if (cloud) for (let i = 0; i < 9; i++) add(g, G.sphLo, M(0xffffff, { emissive: 0xbfe3ff, emissiveIntensity: .25 }), Math.cos(i * .7) * 1.05, .35, Math.sin(i * .7) * 1.6, .5);
  return g; }
function rug(c, c2, star) { const g = grp(); add(g, G.cyl, M(c), 0, .03, 0, 2, .04, 2).castShadow = false; if (c2 !== undefined) add(g, G.cyl, M(c2), 0, .04, 0, 1.3, .04, 1.3).castShadow = false; if (star) add(g, G.cyl, M(0xfff3a8), 0, .05, 0, .6, .04, .6).castShadow = false; if (Array.isArray(star)) star.forEach((cc, i) => add(g, G.cyl, M(cc), 0, .035 + i * .004, 0, 2 - i * .32, .04, 2 - i * .32).castShadow = false); return g; }
function beanbag(c) { const g = grp(); add(g, G.sph, M(c), 0, .42, 0, .85, .5, .85); add(g, G.sph, M(c), 0, .75, -.35, .6, .45, .4); return g; }
const lampMat = Mu(0xfff3c8, { emissive: 0xffd98a, emissiveIntensity: .9 });
const FURN = {
  bed0: { n: "Cozy bed", e: "🛏️", cost: 0, bed: 1, build: () => bedModel(0xd9a66c, 0xff9ecb) }, bed1: { n: "Princess bed", e: "👑", cost: 120, bed: 1, build: () => bedModel(0xffffff, 0xc9a8ff, 1) }, bed2: { n: "Cloud bed", e: "☁️", cost: 150, bed: 1, build: () => bedModel(0xeaf4ff, 0x9fd0ff, 0, 1) },
  bed3: { n: "Rainbow bed", e: "🌈", cost: 100, bed: 1, build: () => { const g = bedModel(0xfff3a8, 0xff7eb6); [0xff5a4d, 0xff9a3c, 0xffd23f, 0x7ef29d, 0x3fa9ff, 0x9b5cff].forEach((c, i) => bx(g, c, 0, .8, -.4 + i * .36, 1.92, .03, .34)); return g; } },
  rug0: { n: "Pink rug", e: "🟣", cost: 30, build: () => rug(0xff9ecb, 0xffffff) }, rug1: { n: "Rainbow rug", e: "🌈", cost: 50, build: () => rug(0xff5a4d, undefined, [0xff5a4d, 0xff9a3c, 0xffd23f, 0x7ef29d, 0x3fa9ff, 0x9b5cff]) }, rug2: { n: "Star rug", e: "⭐", cost: 40, build: () => rug(0x4a3f8f, 0x6a5fc0, 1) },
  bean0: { n: "Pink beanbag", e: "🩷", cost: 40, build: () => beanbag(0xff7eb6) }, bean1: { n: "Blue beanbag", e: "💙", cost: 40, build: () => beanbag(0x3fa9ff) }, bean2: { n: "Purple beanbag", e: "💜", cost: 40, build: () => beanbag(0x9b5cff) },
  desk: { n: "Desk and chair", e: "✏️", cost: 60, build: () => { const g = grp(); bx(g, 0xffffff, 0, 1, 0, 2, .1, 1); [[-.9, -.4], [.9, -.4], [-.9, .4], [.9, .4]].forEach(p => bx(g, 0xffc4dd, p[0], .5, p[1], .1, 1, .1)); bx(g, 0xff9ecb, 0, .55, .9, .7, .1, .7); bx(g, 0xff9ecb, 0, 1, 1.22, .7, .9, .08); bx(g, 0x3fa9ff, -.5, 1.1, 0, .5, .08, .35); return g; } },
  lamp: { n: "Glow lamp", e: "💡", cost: 30, build: () => { const g = grp(); add(g, G.cyl, M(0xffffff), 0, .05, 0, .3, .1, .3); add(g, G.cyl, M(0xffd76a, { metalness: .5 }), 0, .9, 0, .04, 1.7, .04); add(g, G.cone, lampMat, 0, 1.9, 0, .45, .6, .45).castShadow = false; return g; } },
  plant: { n: "Plant", e: "🪴", cost: 20, build: () => { const g = grp(); add(g, G.cyl, M(0xd9824a), 0, .3, 0, .32, .6, .32); for (let i = 0; i < 6; i++) { const l = add(g, G.sph, M(0x4faa4a), Math.cos(i) * .3, 1 + (i % 2) * .3, Math.sin(i) * .3, .14, .5, .26); l.rotation.z = Math.cos(i) * .5; } return g; } },
  shelf: { n: "Bookshelf", e: "📚", cost: 50, build: () => { const g = grp(); bx(g, 0xffffff, 0, 1.2, 0, 1.8, 2.4, .5); for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) bx(g, [0xff7eb6, 0x3fa9ff, 0xffd23f, 0x7ef29d, 0x9b5cff][(i + r) % 5], -.7 + i * .22, .45 + r * .75, .1, .16, .5, .32); return g; } },
  chest: { n: "Toy chest", e: "🧸", cost: 40, build: () => { const g = grp(); bx(g, 0x9b5cff, 0, .35, 0, 1.4, .7, .8); bx(g, 0xffd23f, 0, .72, 0, 1.45, .08, .85); add(g, G.sph, M(0xb5825a), 0, 1, 0, .25); add(g, G.sph, M(0xb5825a), 0, 1.33, 0, .18); [-1, 1].forEach(s => add(g, G.sph, M(0xb5825a), s * .15, 1.48, 0, .07)); return g; } },
  teddy: { n: "Giant teddy", e: "🐻", cost: 45, build: () => { const g = grp(), m = M(0xc9925a); add(g, G.sph, m, 0, .6, 0, .6, .65, .55); add(g, G.sph, m, 0, 1.45, 0, .45); [-1, 1].forEach(s => { add(g, G.sph, m, s * .32, 1.85, 0, .16); add(g, G.sph, m, s * .6, .8, .1, .2, .35, .2); add(g, G.sph, m, s * .35, .2, .4, .22, .2, .32); add(g, G.sph, M(0x1e1814), s * .15, 1.52, .4, .05); }); add(g, G.sph, M(0xf2d9b0), 0, 1.38, .38, .18, .14, .12); return g; } },
  dolls: { n: "Dollhouse", e: "🏠", cost: 70, build: () => { const g = grp(); bx(g, 0xffc4dd, 0, .8, 0, 1.6, 1.6, .8); add(g, roofGeo, M(0x9b5cff, { side: 2 }), 0, 1.6, 0, 1.8, .7, 1); [[-.4, 1.1], [.4, 1.1], [-.4, .4]].forEach(p => bx(g, 0xbfe6ff, p[0], p[1], .41, .35, .35, .02)); bx(g, 0x9b5a3c, .4, .35, .41, .3, .6, .02); return g; } },
  vanity: { n: "Vanity mirror", e: "🪞", cost: 80, build: () => { const g = grp(); bx(g, 0xffffff, 0, .8, 0, 1.6, .1, .7); bx(g, 0xffc4dd, 0, .4, 0, 1.5, .7, .6); add(g, G.cyl, M(0xdff1ff, { metalness: .8, roughness: .1 }), 0, 1.6, -.25, .5, .05, .6).rotation.x = Math.PI / 2; for (let i = 0; i < 8; i++) add(g, G.sph, lampMat, Math.cos(i / 8 * TAU) * .55, 1.6 + Math.sin(i / 8 * TAU) * .66, -.22, .05).castShadow = false; return g; } },
  tank: { n: "Fish tank", e: "🐠", cost: 60, build: () => { const g = grp(); bx(g, 0xffffff, 0, .45, 0, 1.4, .9, .6); bx(g, 0x7fd8ff, 0, 1.3, 0, 1.3, .8, .5, { transparent: true, opacity: .5, roughness: .1 }); [0xff7a1a, 0xffd23f, 0xff7eb6].forEach((c, i) => add(g, G.sph, M(c), -.35 + i * .35, 1.2 + (i % 2) * .2, 0, .1, .07, .04)); return g; } },
  stars: { n: "Fairy light arch", e: "✨", cost: 35, build: () => { const g = grp(); [-1.2, 1.2].forEach(x => add(g, G.cyl, M(0xffffff), x, 1.2, 0, .04, 2.4, .04)); for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; add(g, G.sph, Mu([0xfff3a8, 0xff9ecb, 0x9fd0ff][i % 3], { emissive: [0xffe27a, 0xff7eb6, 0x7fb8ff][i % 3], emissiveIntensity: 1 }), Math.cos(a) * 1.2, 2.4 + Math.sin(a) * .6, 0, .09).castShadow = false; } return g; } }
};
function hut(body, roofC, door, glow) { const g = grp(); bx(g, body, 0, .9, 0, 2.6, 1.8, 2.4, glow); add(g, roofGeo, M(roofC, { side: 2 }), 0, 1.8, 0, 3, 1.2, 2.8); bx(g, door, 0, .65, 1.21, 1, 1.3, .06); return g; }
const DECOR = {
  fountain: { n: "Fountain", e: "⛲", cost: 120, build: () => { const g = grp(); add(g, G.cyl, M(0xd9dde6), 0, .3, 0, 2, .6, 2); add(g, G.cyl, M(0x7fd8ff, { roughness: .1, transparent: true, opacity: .8 }), 0, .62, 0, 1.8, .04, 1.8); add(g, G.cyl, M(0xd9dde6), 0, 1, 0, .25, 1.6, .25); add(g, G.cyl, M(0xd9dde6), 0, 1.8, 0, .9, .15, .9); add(g, G.sph, M(0xbfe9ff, { transparent: true, opacity: .7 }), 0, 2.2, 0, .3, .5, .3); return g; } },
  flowers: { n: "Flower bed", e: "🌷", cost: 25, build: () => { const g = grp(); bx(g, 0x8a5a3a, 0, .12, 0, 2.4, .24, 1.2); for (let i = 0; i < 10; i++) { const x = -1 + (i % 5) * .5, z = i < 5 ? -.25 : .25; add(g, G.cyl, M(0x4faa4a), x, .45, z, .025, .5, .025); add(g, G.sph, M([0xff7eb6, 0xffd23f, 0xc9a2ff, 0xff5a4d, 0xffffff][i % 5]), x, .75, z, .14); } return g; } },
  bench: { n: "Bench", e: "🪑", cost: 30, build: () => { const g = grp(); bx(g, 0xb98252, 0, .5, 0, 2, .1, .6); bx(g, 0xb98252, 0, .95, -.28, 2, .5, .08); [-.85, .85].forEach(x => bx(g, 0x4a4460, x, .25, 0, .1, .5, .55)); return g; } },
  scarecrow: { n: "Scarecrow", e: "🎃", cost: 35, build: () => { const g = grp(); add(g, G.cyl, M(0x8a5a3a), 0, 1.1, 0, .06, 2.2, .06); bx(g, 0x8a5a3a, 0, 1.6, 0, 1.8, .08, .08); bx(g, 0x3f6fc4, 0, 1.4, 0, .7, .8, .3); add(g, G.sph, M(0xf2c84a), 0, 2.2, 0, .3); add(g, G.cone, M(0x8a5a3a), 0, 2.6, 0, .4, .5, .4); [-1, 1].forEach(s => add(g, G.sph, M(0x1e1814), s * .1, 2.25, .27, .04)); return g; } },
  gnome: { n: "Garden gnome", e: "🧙", cost: 20, build: () => { const g = grp(); add(g, G.sph, M(0x3fa9ff), 0, .3, 0, .25, .3, .22); add(g, G.sph, M(0xf2c6a0), 0, .65, 0, .17); add(g, G.sph, M(0xffffff), 0, .52, .1, .15, .2, .1); add(g, G.cone, M(0xe8413a), 0, 1.05, 0, .19, .6, .19); return g; } },
  lantern: { n: "Fairy lantern", e: "🏮", cost: 40, build: () => { const g = grp(); add(g, G.cyl, M(0x4a4460), 0, 1, 0, .05, 2, .05); add(g, G.sph, Mu(0xffe9f5, { emissive: 0xff9ecb, emissiveIntensity: 1 }), 0, 2.2, 0, .3).castShadow = false; add(g, G.cone, M(0x4a4460), 0, 2.55, 0, .3, .25, .3); return g; } },
  balloons: { n: "Balloons", e: "🎈", cost: 15, build: () => { const g = grp(); [0xff5a4d, 0x3fa9ff, 0xffd23f, 0xff7eb6, 0x7ef29d].forEach((c, i) => { const x = Math.cos(i * 1.3) * .4, z = Math.sin(i * 1.3) * .4; add(g, G.sph, M(c, { roughness: .2 }), x, 2.3 + (i % 2) * .4, z, .3, .38, .3); add(g, G.cyl, M(0xffffff), x * .5, 1.1, z * .5, .01, 2.2, .01); }); return g; } },
  arch: { n: "Flower arch", e: "🌸", cost: 80, build: () => { const g = grp(); for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI, x = Math.cos(a) * 1.8, y = Math.sin(a) * 3; add(g, G.sph, M(0x4faa4a), x, y + .1, 0, .28); add(g, G.sph, M([0xff7eb6, 0xffffff, 0xffd23f, 0xc9a2ff][i % 4]), x, y + .2, .2, .15); } return g; } },
  pumpkins: { n: "Pumpkin pile", e: "🎃", cost: 20, build: () => { const g = grp(); [[0, 0, .5], [.7, .2, .35], [-.6, .3, .4], [.1, .7, .28]].forEach(p => { add(g, G.sph, M(0xff8a1e), p[0], p[2] * .75, p[1], p[2], p[2] * .75, p[2]); add(g, G.cyl, M(0x5a7a2a), p[0], p[2] * 1.5, p[1], .04, .15, .04); }); return g; } },
  birdbath: { n: "Bird bath", e: "🐦", cost: 45, build: () => { const g = grp(); add(g, G.cyl, M(0xd9dde6), 0, .6, 0, .12, 1.2, .12); add(g, G.cyl, M(0xd9dde6), 0, 1.25, 0, .7, .12, .7); add(g, G.cyl, M(0x7fd8ff, { roughness: .1 }), 0, 1.32, 0, .6, .02, .6); const b = buildBird({ s: .22, col: 0x4fa8ff, belly: 0xffd9a0, tailN: 3, tailL: .5 }); b.position.set(.35, 1.3, 0); g.add(b); return g; } },
  iceden: { n: "Ice den", e: "🧊", cost: 90, house: 1, build: () => { const g = grp(); add(g, G.half, M(0xdff3ff, { roughness: .15, emissive: 0x9fd8ff, emissiveIntensity: .25 }), 0, 0, 0, 1.9, 1.6, 1.9); add(g, G.half, M(0x3a5a80), 0, 0, 1.3, .7, .9, .7); for (let i = 0; i < 5; i++) add(g, G.cone, M(0xbfe9ff, { roughness: .1 }), Math.cos(i * 1.3) * 1.6, .5, Math.sin(i * 1.3) * 1.6, .2, 1, .2); return g; } },
  firenest: { n: "Fire nest", e: "🔥", cost: 90, house: 1, build: () => { const g = grp(); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; add(g, G.cyl, M(0x8a5a3a), Math.cos(a) * 1.4, .35, Math.sin(a) * 1.4, .12, 1.1, .12).rotation.set(Math.sin(a) * .6, 0, -Math.cos(a) * .6); } add(g, G.cyl, M(0xd9a66c), 0, .15, 0, 1.4, .3, 1.4); for (let i = 0; i < 6; i++) add(g, G.cone, Mu(0xff7a1a, { emissive: 0xff5a00, emissiveIntensity: .9 }), Math.cos(i) * .5, .6, Math.sin(i) * .5, .16, .7, .16).castShadow = false; return g; } },
  cloudstable: { n: "Cloud stable", e: "☁️", cost: 120, house: 1, build: () => { const g = hut(0xffffff, 0x9fd0ff, 0xbfe3ff, { emissive: 0xbfe3ff, emissiveIntensity: .2 }); for (let i = 0; i < 10; i++) add(g, G.sphLo, M(0xffffff), Math.cos(i * .63) * 1.7, .4, Math.sin(i * .63) * 1.6, .6); return g; } },
  crystal: { n: "Crystal cave", e: "💎", cost: 120, house: 1, build: () => { const g = grp(); add(g, G.half, M(0x6a5fa0), 0, 0, 0, 2, 1.7, 2); add(g, G.half, M(0x2a2040), 0, 0, 1.4, .75, 1, .7); [0xc9a8ff, 0xff9ecb, 0x9fd0ff, 0xa6f0c0, 0xfff59e].forEach((c, i) => { const cr = add(g, G.cone, Mu(c, { emissive: c, emissiveIntensity: .6, roughness: .1 }), Math.cos(i * 1.2 + .5) * 1.5, 1 + (i % 2) * .5, Math.sin(i * 1.2 + .5) * 1.3, .22, 1.2, .22); cr.rotation.z = Math.cos(i) * .4; }); return g; } },
  hutch: { n: "Cozy hutch", e: "🐰", cost: 60, house: 1, build: () => hut(0xf7d98a, 0xd9552b, 0x6b4226) }
};
const placed = [];
function cat(k) { return FURN[k] || DECOR[k]; }
function putItem(d, inside) { const c = cat(d.k); if (!c) return null; const it = { d, c, inside, g: c.build() }; scene.add(it.g); it.g.position.set(d.x, hgt(d.x, d.z), d.z); it.g.rotation.y = d.r; placed.push(it); return it; }
function buyItem(k) { const c = cat(k), inside = !!FURN[k]; if (inside !== (pl.inside === 1) || pl.inside === 2) return toast(inside ? "Go inside your house to put furniture in your room." : "Go outside to put this on your farm."); if (!pay(c.cost)) return; if (pl.ride) dismount(); if (pl.drive) leaveTractor();
  const d = { k, x: pl.x, z: pl.z, r: pl.hdg }; (inside ? S.room.items : S.decor).push(d); carry = putItem(d, inside); closeM(); SFX.good(); toast("Walk to where you want it, then tap Put it here."); }
function dropItem() { const it = carry; carry = null; it.g.position.y = hgt(it.d.x, it.d.z); SFX.plop(); burst(it.d.x, .6, it.d.z, [0xffffff, 0xfff3a8], 10, 1.5, 1.5, .35); save(); }
let menuIt = null;
function itemMenu(it) { menuIt = it; openM(X + "<h2>" + it.c.e + " " + it.c.n + "</h2><div class='row'>" + (it.c.bed ? "<button class='btn mag' data-a='sleep'>😴 Sleep until morning</button>" : "") + "<button class='btn' data-a='itMove'>Move it</button><button class='btn alt' data-a='itTurn'>Turn it</button><button class='btn alt' data-a='itAway'>Put it away</button></div>"); }
ACT.itMove = () => { carry = menuIt; closeM(); toast("Walk to where you want it, then tap Put it here."); };
ACT.itTurn = () => { menuIt.d.r += Math.PI / 4; menuIt.g.rotation.y = menuIt.d.r; save(); };
ACT.itAway = () => { const it = menuIt, L = it.inside ? S.room.items : S.decor; L.splice(L.indexOf(it.d), 1); scene.remove(it.g); placed.splice(placed.indexOf(it), 1); const back = Math.floor(it.c.cost / 2); closeM(); if (back) money(back); save(); };
ACT.sleep = () => { closeM(); flash(() => { if (S.time > .27) newDay(); S.time = .27; animals.forEach(a => a.d.love = clamp(a.d.love + 2, 0, 100)); pop("Good morning! ☀️"); SFX.good(); }); };
ACT.build = () => { const sec = (title, keys) => "<h3>" + title + "</h3><div class='grid'>" + keys.map(k => '<button class="it' + (DECOR[k].house ? " magic" : "") + '" data-a="buyD" data-v="' + k + '"' + (S.money < DECOR[k].cost ? " disabled" : "") + "><span>" + DECOR[k].e + "</span>" + DECOR[k].n + "<small>$" + DECOR[k].cost + "</small></button>").join("") + "</div>";
  openM(X + "<h2>🔨 Build and decorate</h2><p>You have <b>$" + S.money + "</b>. You choose where everything goes!</p><h3>Big upgrades</h3><div class='grid'><button class='it magic' data-a='up' data-v='barn2'" + (S.barn2 || S.money < 400 ? " disabled" : "") + "><span>🏰</span>Dream barn<small>" + (S.barn2 ? "you have it!" : "$400 · room for 80 animals") + "</small></button><button class='it magic' data-a='up' data-v='house2'" + (S.house2 || S.money < 500 ? " disabled" : "") + "><span>🏡</span>Dream farmhouse<small>" + (S.house2 ? "you have it!" : "$500") + "</small></button></div>" +
    sec("Decorations", Object.keys(DECOR).filter(k => !DECOR[k].house)) + sec("Houses for your creatures", Object.keys(DECOR).filter(k => DECOR[k].house))); };
ACT.buyD = k => buyItem(k);
ACT.up = k => { if (!pay(k === "barn2" ? 400 : 500)) return; S[k] = 1; closeM(); upgrades(); const p = k === "barn2" ? BARN : HOUSE; SFX.magic(); pop(k === "barn2" ? "Dream barn! 🏰" : "Dream farmhouse! 🏡"); for (let i = 0; i < 5; i++) setTimeout(() => burst(p.x + rnd(-6, 6), rnd(3, 9), p.z + rnd(-3, 5), [0xff9ecb, 0xffd23f, 0xc9a8ff, 0xffffff], 22, 4, 4, .7), i * 200); save(); };
const FLOORS = ["Wood", "Pink", "Checkers", "Clouds", "Meadow"], WALLS = [0xfff1f6, 0xe6f0ff, 0xf1eaff, 0xe8fbe8, 0xfff7d6, 0xffd9e8];
ACT.roomShop = () => openM(X + "<h2>🛋️ Decorate my room</h2><p>You have <b>$" + S.money + "</b>. Buy something, then walk it to the spot you like.</p><div class='grid'>" + Object.keys(FURN).filter(k => FURN[k].cost).map(k => '<button class="it" data-a="buyD" data-v="' + k + '"' + (S.money < FURN[k].cost ? " disabled" : "") + "><span>" + FURN[k].e + "</span>" + FURN[k].n + "<small>$" + FURN[k].cost + "</small></button>").join("") +
  "</div><h3>Floor</h3><div class='row'>" + FLOORS.map((f, i) => '<button class="chip' + (S.room.floor === i ? " on" : "") + '" data-a="floor" data-v="' + i + '">' + f + "</button>").join("") + "</div><h3>Walls</h3><div class='row'>" + WALLS.map((c, i) => '<button class="sw' + (S.room.wall === i ? " on" : "") + '" data-a="wall" data-v="' + i + '" style="background:#' + c.toString(16).padStart(6, "0") + '"></button>').join("") + "</div>");
ACT.floor = i => { S.room.floor = +i; paintRoom(); ACT.roomShop(); }; ACT.wall = i => { S.room.wall = +i; paintRoom(); ACT.roomShop(); };

/* ------------------------------ your room, inside the farmhouse ------------------------------ */
const roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({ roughness: .8 })), wallMat = Mu(WALLS[0], { roughness: .95 });
function floorTex(i) { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  if (i === 0) { x.fillStyle = "#c99a62"; x.fillRect(0, 0, 256, 256); x.strokeStyle = "#a87a48"; x.lineWidth = 3; for (let r = 0; r < 8; r++) { x.beginPath(); x.moveTo(0, r * 32); x.lineTo(256, r * 32); x.stroke(); x.beginPath(); x.moveTo((r % 2) * 64 + 60, r * 32); x.lineTo((r % 2) * 64 + 60, r * 32 + 32); x.stroke(); } }
  if (i === 1) { x.fillStyle = "#ffc9de"; x.fillRect(0, 0, 256, 256); x.fillStyle = "#ffb3d0"; for (let k = 0; k < 16; k++) { x.beginPath(); x.arc((k % 4) * 64 + 32, Math.floor(k / 4) * 64 + 32, 10, 0, TAU); x.fill(); } }
  if (i === 2) for (let k = 0; k < 64; k++) { x.fillStyle = (k + Math.floor(k / 8)) % 2 ? "#ffffff" : "#c9a8ff"; x.fillRect((k % 8) * 32, Math.floor(k / 8) * 32, 32, 32); }
  if (i === 3) { x.fillStyle = "#bfe3ff"; x.fillRect(0, 0, 256, 256); x.fillStyle = "#ffffff"; [[50, 60], [170, 40], [110, 150], [210, 200], [40, 210]].forEach(p => { for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(p[0] + k * 14 - 20, p[1] + (k % 2) * 6, 16, 0, TAU); x.fill(); } }); }
  if (i === 4) { x.fillStyle = "#8fd96b"; x.fillRect(0, 0, 256, 256); ["#ff7eb6", "#ffd23f", "#ffffff"].forEach((cc, j) => { x.fillStyle = cc; for (let k = 0; k < 9; k++) { x.beginPath(); x.arc((k * 67 + j * 40) % 256, (k * 97 + j * 70) % 256, 5, 0, TAU); x.fill(); } }); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); return t; }
function paintRoom() { roomFloor.material.map = floorTex(S.room.floor); roomFloor.material.needsUpdate = true; wallMat.color.setHex(WALLS[S.room.wall]); save(); }
(function buildRoom() {
  const g = grp(scene, ROOM.x, 0, ROOM.z), w = ROOM.w, d = ROOM.d, H = 5.5; roomFloor.rotation.x = -Math.PI / 2; roomFloor.receiveShadow = true; g.add(roomFloor);
  const yard = new THREE.Mesh(new THREE.CircleGeometry(70, 30), M(0x8fd96b)); yard.rotation.x = -Math.PI / 2; yard.position.y = -.05; g.add(yard);
  [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(p[3], H), wallMat); m.position.set(p[0], H / 2, p[1]); m.rotation.y = p[2]; m.receiveShadow = true; g.add(m);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(p[3], .3), M(0xffffff)); b.position.set(p[0] * .998, .15, p[1] * .998); b.rotation.y = p[2]; g.add(b); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3), M(0x9b5f3c)); door.position.set(0, 1.5, d / 2 - .02); door.rotation.y = Math.PI; g.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), Mu(0xbfe6ff, { emissive: 0x9fd0ff, emissiveIntensity: .6 })); win.position.set(-3, 3, -d / 2 + .02); g.add(win); bx(g, 0xffffff, -3, 3, -d / 2 + .05, .12, 2.2, .06); bx(g, 0xffffff, -3, 3, -d / 2 + .05, 3.4, .12, .06);
  [-1, 1].forEach(s => bx(g, 0xff9ecb, -3 + s * 2, 3, -d / 2 + .1, .7, 2.6, .08));
  /* the kitchen corner */
  bx(g, 0xffffff, 5.2, .9, -5.1, 5, 1.8, 1.4); bx(g, 0xff9ecb, 5.2, 1.84, -5.1, 5.1, .1, 1.5); bx(g, 0xd9dde6, 5.6, 1.9, -5.1, 1.5, .06, 1.2, { metalness: .5, roughness: .3 });
  [[-.35, -.3], [.35, -.3], [-.35, .3], [.35, .3]].forEach(p => add(g, G.cyl, M(0x2a2a33), 5.6 + p[0], 1.94, -5.1 + p[1], .22, .03, .22)); add(g, G.cyl, M(0xe8413a, { roughness: .3 }), 5.25, 2.15, -5.4, .25, .36, .25); bx(g, 0xbfe6ff, 7.2, 1.8, -5.1, 1.3, 3.6, 1.3); bx(g, 0xd9dde6, 6.62, 2.2, -4.42, .06, .8, .06);
  const L = new THREE.PointLight(0xfff0d8, .55, 30); L.position.set(0, 5, 0); g.add(L);
})();
function goInside() { if (pl.ride) dismount(); if (pl.drive) leaveTractor(); flash(() => { pl.inside = 1; pl.x = ROOM.x; pl.z = ROOM.z + 4.2; pl.hdg = Math.PI; camYaw = 0; camPitch = .5; snapCam(); toast("Your room! Tap Decorate my room to make it yours."); }); SFX.tap(); }
function goOutside() { flash(() => { pl.inside = 0; pl.x = HOUSE.x; pl.z = HOUSE.z + 8.5; pl.hdg = 0; camYaw = Math.PI; camPitch = .32; snapCam(); }); }

/* ------------------------------ dream barn and dream farmhouse ------------------------------ */
let barn2G = null, house2G = null;
function upgrades() {
  if (S.barn2 && !barn2G) { barnG.visible = false; const b = barn2G = grp(scene, BARN.x, 0, BARN.z); bx(b, 0xff8fb8, 0, 3.8, 0, 18, 7.6, 12); add(b, roofGeo, M(0x9b7fe0, { side: 2 }), 0, 7.6, 0, 19.4, 5.4, 13.4);
    bx(b, 0xffffff, 0, 2.5, 6.02, 5.2, 5, .12); [[-1.3], [1.3]].forEach(p => { bx(b, 0xffc4dd, p[0], 2.5, 6.1, 2.3, 4.6, .1); const d1 = bx(b, 0xffffff, p[0], 2.5, 6.18, 5, .14, .06); d1.rotation.z = 1.1; const d2 = bx(b, 0xffffff, p[0], 2.5, 6.18, 5, .14, .06); d2.rotation.z = -1.1; });
    [-9, 9].forEach(x => bx(b, 0xffffff, x, 3.8, 6.02, .3, 7.6, .14)); bx(b, 0xffffff, 0, 7.5, 6.02, 18, .3, .14);
    add(b, G.sph, winMat, 0, 9.3, 6.75, .9, .9, .08); [-1, 1].forEach(s => { bx(b, 0xbfe6ff, s * 6, 4.2, 6.02, 1.8, 1.6, .1).material = winMat; bx(b, 0x8a5a3a, s * 6, 3.2, 6.3, 2, .3, .5); [0xff7eb6, 0xffd23f, 0xffffff, 0xc9a2ff].forEach((c, i) => add(b, G.sph, M(c), s * 6 - .7 + i * .45, 3.5, 6.35, .2)); });
    for (let i = 0; i <= 20; i++) add(b, G.sph, Mu([0xfff3a8, 0xff9ecb, 0x9fd0ff][i % 3], { emissive: [0xffe27a, 0xff7eb6, 0x7fb8ff][i % 3], emissiveIntensity: 1 }), -9 + i * .9, 7.1 - Math.abs(Math.sin(i * .78)) * .4, 6.2, .13).castShadow = false;
    bx(b, 0xffffff, 0, 13.4, 0, 2.2, 1.6, 2.2); add(b, G.cone, M(0xffd76a, { metalness: .6, roughness: .3 }), 0, 15, 0, 1.8, 1.6, 1.8); add(b, G.cyl, M(0xffd76a, { metalness: .6, roughness: .3 }), 0, 16.4, 0, .05, 1.4, .05); const st = add(b, G.ico, M(0xffd76a, { metalness: .6, roughness: .3, emissive: 0xffc233, emissiveIntensity: .5 }), 0, 17.2, 0, .45); st.geometry = new THREE.OctahedronGeometry(1, 0);
    add(b, G.cyl, M(0xffe9f5, { metalness: .3, roughness: .4 }), 12.5, 4.5, -1, 2.4, 9, 2.4); add(b, G.half, M(0xff9ecb, { metalness: .3, roughness: .4 }), 12.5, 9, -1, 2.4); COL.push({ x: BARN.x - 7.5, z: BARN.z, r: 6 }, { x: BARN.x + 7.5, z: BARN.z, r: 6 }, { x: BARN.x + 12.5, z: BARN.z - 1, r: 2.8 }); }
  if (S.house2 && !house2G) { houseG.visible = false; const h = house2G = grp(scene, HOUSE.x, 0, HOUSE.z); bx(h, 0xe3d6fb, 0, 3.8, 0, 13, 7.6, 9); bx(h, 0xffffff, 0, .25, 0, 13.6, .5, 9.6); add(h, roofGeo, M(0xff8fb8, { side: 2 }), 0, 7.6, 0, 14.2, 3.8, 10.2); bx(h, 0xffffff, 0, 3.9, 4.52, 13, .25, .1);
    bx(h, 0xff7eb6, 0, 1.5, 4.52, 1.6, 3, .12); add(h, G.sph, M(0xffd24a, { metalness: .6, roughness: .3 }), .5, 1.5, 4.62, .09); add(h, G.sph, winMat, 0, 3.4, 4.56, .55, .55, .06);
    [[-4, 2.3], [4, 2.3], [-4, 5.9], [4, 5.9], [0, 5.9]].forEach(p => { const wn = bx(h, 0xbfe6ff, p[0], p[1], 4.52, 1.8, 1.7, .1); wn.material = winMat; bx(h, 0xffffff, p[0], p[1], 4.56, .1, 1.7, .08); bx(h, 0xffffff, p[0], p[1], 4.56, 1.8, .1, .08); bx(h, 0xffffff, p[0], p[1] - 1.05, 4.8, 2, .28, .5); [0xff7eb6, 0xffd23f, 0xc9a2ff].forEach((c, i) => add(h, G.sph, M(c), p[0] - .6 + i * .6, p[1] - .8, 4.85, .2)); });
    add(h, G.cyl, M(0xe3d6fb), -6.6, 5, 4.2, 1.9, 10, 1.9); add(h, G.cone, M(0xff8fb8), -6.6, 11.8, 4.2, 2.3, 3.6, 2.3); add(h, G.sph, M(0xffd76a, { metalness: .6, emissive: 0xffc233, emissiveIntensity: .4 }), -6.6, 13.8, 4.2, .25); [3, 7].forEach(y => add(h, G.sph, winMat, -6.6, y, 6.05, .6, .8, .08));
    bx(h, 0xffffff, 0, .5, 5.8, 6, .3, 2.8); [-2.7, 2.7].forEach(x => add(h, G.cyl, M(0xffffff), x, 2.2, 6.9, .16, 3.6, .16)); bx(h, 0xffffff, 0, 4, 5.8, 6.4, .2, 3); for (let i = 0; i < 9; i++) bx(h, 0xffffff, -2.8 + i * .7, 4.6, 7.2, .08, 1, .08); bx(h, 0xffffff, 0, 5.1, 7.2, 6, .1, .1);
    bx(h, 0xd99aae, 4.2, 9.6, -1, 1.1, 2.6, 1.1); COL.push({ x: HOUSE.x - 6.6, z: HOUSE.z + 4.2, r: 2.2 }); }
}

/* ------------------------------ helpers you hire ------------------------------ */
const HELP = { farm: { n: "Farm hand", e: "🧑‍🌾", cost: 120, say: "plants, waters and picks the crops", home: [-24, 20] }, keeper: { n: "Animal keeper", e: "🧑‍🍼", cost: 150, say: "feeds the animals, scoops poop and collects eggs, milk and wool", home: [24, 0] },
  shop: { n: "Shopkeeper", e: "🧑‍💼", cost: 200, say: "sells your food to visitors at the stand", home: [STAND.x, STAND.z - 2] }, teacher: { n: "Riding teacher", e: "🏇", cost: 250, say: "gives riding lessons and shows visitors the bunnies and chickens", home: [ARENA.x - 14, ARENA.z - 3] } };
const helpers = [];
function spawnHelper(k) { const h = HELP[k], r = srand(hashStr(k)), g = buildPerson({ skin: Math.floor(r() * 6), hair: Math.floor(r() * 6), hairC: Math.floor(r() * 7), top: [7, 2, 8, 1][Object.keys(HELP).indexOf(k)], bot: 0, botT: 2, hat: 1 }); scene.add(g);
  const t = textSprite(h.n, { h: .36, bg: "rgba(47,168,90,.85)" }); t.position.y = 2.25; g.add(t); helpers.push({ k, g, x: h.home[0], z: h.home[1], tx: h.home[0], tz: h.home[1], hdg: 0, ph: 0, wait: 2, job: null }); }
ACT.helpers = () => openM(X + "<h2>🧑‍🌾 Helpers</h2><p>Pay a helper once and they work on your farm every day, and the money they make is yours. You have <b>$" + S.money + "</b>.</p>" + Object.keys(HELP).map(k => { const h = HELP[k]; return "<div class='bub' style='max-width:100%;width:auto'><b>" + h.e + " " + h.n + "</b> " + h.say + ".<div class='row' style='margin:6px 0 0'>" + (S.help[k] ? "<b>✓ Working for you</b>" : "<button class='btn' data-a='hire' data-v='" + k + "'" + (S.money < h.cost ? " disabled" : "") + ">Hire for $" + h.cost + "</button>") + "</div></div>"; }).join(""));
ACT.hire = k => { if (!pay(HELP[k].cost)) return; S.help[k] = 1; spawnHelper(k); SFX.good(); pop(HELP[k].n + " hired!"); ACT.helpers(); save(); };
function helperJob(h) {
  if (h.k === "farm") { const p = plots.find(p => !p.busy && (!p.d.c || p.d.g >= 1 || !p.d.w)); if (p) return { x: p.x, z: p.z + 2.6, fn: () => { p.busy = 0; const d = p.d; if (!d.c) plant(p, CROPS[S.lastSeed] && S.money >= CROPS[S.lastSeed].cost ? S.lastSeed : "carrot"); else if (d.g >= 1) harvest(p); else if (!d.w) waterPlot(p); }, p }; }
  if (h.k === "keeper") { const pp = poops[0]; if (pp) return { x: pp.position.x, z: pp.position.z, fn: () => { if (poops.includes(pp)) { scene.remove(pp); poops.splice(poops.indexOf(pp), 1); money(3, pp.position.x, .5, pp.position.z); } } };
    const a = animals.find(a => a.sp.home !== "pond" && a !== pl.ride && !a.lesson && (a.d.rdy || a.d.hun < 40)); if (a) return { a, fn: () => { if (a.d.rdy) { a.d.rdy = 0; const k = a.sp.prod; S.inv[k] = (S.inv[k] || 0) + 1; burst(a.x, 1.5, a.z, [0xfff3a8], 6, 1, 2, .4); } if (a.d.hun < 40) { a.d.hun = 100; love(a, 4); } } }; }
  if (h.k === "shop") { const v = visitors.find(v => v.state === "wait" && v.want.t === "buy" && (S.inv[v.want.id] || 0) >= v.want.n); if (v) return { x: STAND.x, z: STAND.z - 2, fn: () => { if (v.state === "wait") serve(v); } }; }
  if (h.k === "teacher") { const v = visitors.find(v => v.state === "wait" && (v.want.t === "bunny" || v.want.t === "birds" || (v.want.t === "lesson" && animals.some(a => a.sp.ride && !a.d.baby && a !== pl.ride && !a.lesson && (!v.want.magic || a.sp.magic))))); if (v) return { x: v.x + 1, z: v.z - 1.5, fn: () => { if (v.state === "wait") serve(v); } }; }
  return null;
}
function updateHelpers(dt) { for (const h of helpers) { const j = h.job; if (j && j.a) { h.tx = j.a.x + 1.3; h.tz = j.a.z + 1.3; }
  const dx = h.tx - h.x, dz = h.tz - h.z, dd = Math.hypot(dx, dz), mv = dd > .5; if (mv) { h.hdg = Math.atan2(dx, dz); h.x += dx / dd * 5 * dt; h.z += dz / dd * 5 * dt; h.ph += dt * 11; }
  else if (j) { j.fn(); h.job = null; h.wait = 1.5; } else if ((h.wait -= dt) < 0) { h.wait = 2; const nj = mode === "play" ? helperJob(h) : null; if (nj) { h.job = nj; if (nj.p) nj.p.busy = 1; if (!nj.a) { h.tx = nj.x; h.tz = nj.z; } } else { h.tx = HELP[h.k].home[0]; h.tz = HELP[h.k].home[1]; } }
  animPerson(h.g, h.ph, mv ? .6 : 0); h.g.position.set(h.x, hgt(h.x, h.z), h.z); h.g.rotation.y = h.hdg; } }

/* ------------------------------ hayrides ------------------------------ */
const wagon = grp(T.g, 0, 0, -4); (function () { bx(wagon, 0x9b5f3c, 0, .95, 0, 2.2, .2, 3.4); bx(wagon, 0xf2d06a, 0, 1.25, 0, 2, .5, 3.2); [[-1.1, 0], [1.1, 0]].forEach(p => bx(wagon, 0x9b5f3c, p[0], 1.5, 0, .1, .9, 3.4)); bx(wagon, 0x9b5f3c, 0, 1.5, -1.7, 2.2, .9, .1); bx(wagon, 0x4a4460, 0, .9, 2.2, .12, .12, 1.2);
  [[-1.15, -1], [1.15, -1], [-1.15, 1], [1.15, 1]].forEach(p => add(wagon, G.cyl, M(0x2a2a33), p[0], .5, p[1], .5, .25, .5).rotation.z = Math.PI / 2); })();
const HAY_SPOTS = [[0, 8], [-44, 10], [-12, -14], [4, -12], [-8, 26], [-44, -8]], hayFlags = HAY_SPOTS.map(p => { const g = grp(scene, p[0], 0, p[1]); add(g, G.cyl, M(0xf2d06a), 0, .6, 0, .9, 1.2, .9).rotation.z = Math.PI / 2; add(g, G.cyl, M(0xffffff), 0, 2.2, 0, .05, 2, .05); add(g, G.cone, Mu(0xff7eb6, { emissive: 0xff5fa2, emissiveIntensity: .6 }), .35, 2.9, 0, .25, .7, .05).rotation.z = -Math.PI / 2; g.visible = false; return g; });
function startHay(v) { if (!HAY) { HAY = { riders: [], left: HAY_SPOTS.length }; hayFlags.forEach(f => f.visible = true); } const n = HAY.riders.length; if (n >= 4) { toast("The hay wagon is full! Finish this ride first."); return; }
  v.state = "busy"; if (v.bub) { v.g.remove(v.bub); v.bub = null; } wagon.add(v.g); v.g.scale.setScalar(v.sc); v.g.position.set(n % 2 ? .5 : -.5, .9, n < 2 ? .7 : -.7); v.g.rotation.set(0, 0, 0); animPerson(v.g, 0, 0, true); HAY.riders.push(v); SFX.good(); toast(v.name + " hopped in the hay wagon! Drive the tractor to all " + HAY.left + " hay flags. 🚜"); if (!pl.drive && near(T.x, T.z) > 12) { T.x = pl.x + 4; T.z = pl.z; } }
function updateHay() { if (!HAY) { tim.hidden = !C; return; } if (!C) { tim.hidden = false; tim.textContent = "🚜 Hayride: " + HAY.left + " flags to go"; }
  if (pl.drive) hayFlags.forEach(f => { if (f.visible && Math.hypot(T.x - f.position.x, T.z - f.position.z) < 4) { f.visible = false; HAY.left--; SFX.coin(); burst(f.position.x, 2, f.position.z, [0xf2d06a, 0xfff3a8], 16, 2.5, 3, .5); } });
  hayFlags.forEach(f => f.position.y = hgt(f.position.x, f.position.z));
  if (HAY.left <= 0) { HAY.riders.forEach((v, i) => { scene.add(v.g); v.g.scale.setScalar(v.sc); v.x = T.x + 3 + i; v.z = T.z + 2; animPerson(v.g, 0, 0, false); money(v.want.pay, v.x, 2, v.z); leave(v, v.name + ": Best hayride ever! 🌾"); }); HAY = null; tim.hidden = true; save(); } }

/* ------------------------------ the corn maze ------------------------------ */
const mazeGoal = grp(scene); (function buildMaze() {
  const n = MAZE.n, c = MAZE.c, r = srand(4242), E = [], Sx = [], seen = []; for (let i = 0; i < n * n; i++) { E[i] = 1; Sx[i] = 1; seen[i] = 0; }
  const st = [0]; seen[0] = 1; while (st.length) { const cur = st[st.length - 1], cx = cur % n, cz = Math.floor(cur / n), opts = []; if (cx < n - 1 && !seen[cur + 1]) opts.push(cur + 1); if (cx > 0 && !seen[cur - 1]) opts.push(cur - 1); if (cz < n - 1 && !seen[cur + n]) opts.push(cur + n); if (cz > 0 && !seen[cur - n]) opts.push(cur - n);
    if (!opts.length) { st.pop(); continue; } const nx = opts[Math.floor(r() * opts.length)]; if (nx === cur + 1) E[cur] = 0; if (nx === cur - 1) E[nx] = 0; if (nx === cur + n) Sx[cur] = 0; if (nx === cur - n) Sx[nx] = 0; seen[nx] = 1; st.push(nx); }
  const walls = []; for (let i = 0; i < n * n; i++) { const cx = i % n, cz = Math.floor(i / n), x0 = MAZE.x + cx * c, z0 = MAZE.z + cz * c; if (E[i]) walls.push([x0 + c, z0 + c / 2, 1]); if (Sx[i]) walls.push([x0 + c / 2, z0 + c, 0]); if (cx === 0) walls.push([x0, z0 + c / 2, 1]); if (cz === 0 && cx !== 0) walls.push([x0 + c / 2, z0, 0]); }
  const corn = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: .9 }), walls.length), tops = new THREE.InstancedMesh(G.box, new THREE.MeshStandardMaterial({ color: 0xe8c84a, roughness: .9 }), walls.length);
  walls.forEach((w, i) => { const y = hgt(w[0], w[1]); dummy.position.set(w[0], y + 1.1, w[1]); dummy.rotation.set(0, w[2] ? Math.PI / 2 : 0, 0); dummy.scale.set(c + .5, 2.4, .6); dummy.updateMatrix(); corn.setMatrixAt(i, dummy.matrix); dummy.position.y = y + 2.45; dummy.scale.set(c + .5, .35, .7); dummy.updateMatrix(); tops.setMatrixAt(i, dummy.matrix);
    for (let k = -1; k <= 1; k++) COL.push({ x: w[0] + (w[2] ? 0 : k * c * .36), z: w[1] + (w[2] ? k * c * .36 : 0), r: .62 }); });
  [corn, tops].forEach(m => { m.castShadow = m.receiveShadow = true; scene.add(m); });
  const gx = MAZE.x + (n - .5) * c, gz = MAZE.z + (n - .5) * c; mazeGoal.position.set(gx, hgt(gx, gz), gz); add(mazeGoal, G.cyl, M(0xffffff), 0, .3, 0, .6, .6, .6); const tr = add(mazeGoal, G.sph, Mu(0xffd23f, { metalness: .6, roughness: .25, emissive: 0xffc233, emissiveIntensity: .6 }), 0, 1.3, 0, .3, .7, .3); tr.castShadow = false;
  const sg = add(scene, G.box, new THREE.MeshStandardMaterial({ map: signTex(["CORN MAZE", "find the golden corn"], "#fff7d6", "#7a5a12") }), MAZE.x - 1.2, hgt(MAZE.x, MAZE.z - 2) + 2.6, MAZE.z - 2.2, 5.6, 1.4, .15); [-2.4, 2.4].forEach(x => add(scene, G.cyl, M(0x8a5a3a), MAZE.x - 1.2 + x, hgt(MAZE.x, MAZE.z - 2) + 1.3, MAZE.z - 2.2, .1, 2.6, .1));
})();

/* ------------------------------ the country fair ------------------------------ */
let wheel = null; const stage = { x: FAIR.x + 9, z: FAIR.z + 6 };
(function buildFair() {
  PATHS.push([0, 54, FAIR.x + 6, FAIR.z - 4], [0, 54, MAZE.x - 1, MAZE.z - 3]); paintGround();
  const y = hgt(FAIR.x, FAIR.z), g = grp(scene, FAIR.x, y, FAIR.z);
  [[-9, -3, 0xff7eb6], [-4, 9, 0x3fa9ff], [7, -8, 0xffd23f]].forEach(p => { add(g, G.cyl, M(0xffffff), p[0], 1.3, p[1], 2.8, 2.6, 2.8); add(g, G.cone, M(p[2]), p[0], 3.8, p[1], 3.4, 2.6, 3.4); add(g, G.cone, M(0xffffff), p[0], 4.6, p[1], 1.6, 1.3, 1.6); add(g, G.cyl, M(0xffffff), p[0], 5.8, p[1], .04, 1.2, .04); add(g, G.cone, M(p[2]), p[0] + .3, 6.2, p[1], .2, .6, .04).rotation.z = -Math.PI / 2; COL.push({ x: FAIR.x + p[0], z: FAIR.z + p[1], r: 3 }); });
  /* the judges' booth */
  bx(g, 0xb98252, 0, .6, 0, 4.4, 1.2, 1.4); bx(g, 0xffffff, 0, 1.25, 0, 4.7, .1, 1.7); [-2.2, 2.2].forEach(x => add(g, G.cyl, M(0xffffff), x, 2.2, -.6, .08, 4.4, .08)); add(g, G.box, new THREE.MeshStandardMaterial({ map: signTex(["COUNTRY FAIR", "ribbon contests"], "#ffe9f5", "#c0397a") }), 0, 4, -.6, 5.4, 1.4, .15);
  [0x3f6fff, 0xe8413a, 0xffffff].forEach((c, i) => { add(g, G.cyl, M(c), -1.2 + i * 1.2, 1.55, 0, .22, .06, .22).rotation.x = Math.PI / 2; bx(g, c, -1.2 + i * 1.2, 1.35, .02, .12, .3, .03); }); COL.push({ x: FAIR.x, z: FAIR.z, r: 1.9 });
  /* stage */
  bx(g, 0x9b5cff, 9, .25, 6, 7, .5, 4.5); bx(g, 0xff7eb6, 9, 2.4, 8.2, 7, 4, .2); for (let i = 0; i < 9; i++) add(g, G.sph, Mu(0xfff3a8, { emissive: 0xffe27a, emissiveIntensity: 1 }), 5.8 + i * .8, 4.5, 8.05, .14).castShadow = false;
  /* ferris wheel */
  const fw = grp(g, -13, 0, 9); [-1, 1].forEach(s => { const l1 = bx(fw, 0xffffff, -2.2, 3.6, s * .9, .25, 7.8, .25); l1.rotation.z = -.32; const l2 = bx(fw, 0xffffff, 2.2, 3.6, s * .9, .25, 7.8, .25); l2.rotation.z = .32; });
  wheel = grp(fw, 0, 7.2, 0); const rim = new THREE.Mesh(new THREE.TorusGeometry(5.4, .14, 8, 40), M(0xff7eb6)); wheel.add(rim); wheel.userData.cabs = [];
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, sp = bx(wheel, 0xffffff, Math.cos(a) * 2.7, Math.sin(a) * 2.7, 0, 5.4, .1, .1); sp.rotation.z = a; const cb = grp(wheel, Math.cos(a) * 5.4, Math.sin(a) * 5.4, 0); bx(cb, [0xff5a4d, 0x3fa9ff, 0xffd23f, 0x7ef29d, 0x9b5cff, 0xff9a3c, 0xff7eb6, 0x2fd3b0][i], 0, -.7, 0, 1.2, .9, 1.2); bx(cb, 0xffffff, 0, -.1, 0, 1.4, .1, 1.4); wheel.userData.cabs.push(cb); }
  COL.push({ x: FAIR.x - 13, z: FAIR.z + 9, r: 2.6 });
  for (let i = 0; i < 16; i++) add(g, G.cone, M([0xff7eb6, 0x3fa9ff, 0xffd23f, 0x7ef29d][i % 4]), -7 + i * .95, 3.3 - Math.sin(i / 15 * Math.PI) * .7, -9, .28, .5, .04).rotation.z = Math.PI;
  [-7.6, 7.6].forEach(x => add(g, G.cyl, M(0xffffff), x, 1.8, -9, .08, 3.6, .08));
})();
const CONTESTS = [["veg", "🥕", "Best food", "Enter something you grew or cooked."], ["cute", "🎀", "Cutest animal", "Love and dress-up win this one."], ["talent", "✨", "Talent show", "Tricks and magic win this one."], ["jump", "🏇", "Horse show", "Jump as many fences as you can in 45 seconds."], ["race", "🏁", "Forest race", "Race three riders down the forest trail."]];
function ribLine() { return "🔵 " + S.rib.b + " blue · 🔴 " + S.rib.r + " red · ⚪ " + S.rib.w + " white"; }
ACT.fair = () => openM(X + "<h2>🎡 Country fair</h2><p>Win ribbons and prize money! Your ribbons: <b>" + ribLine() + "</b></p><div class='grid'>" + CONTESTS.map(c => '<button class="it" data-a="contest" data-v="' + c[0] + '"><span>' + c[1] + "</span>" + c[2] + "<small>" + c[3] + "</small></button>").join("") + "</div>");
ACT.ribbons = ACT.fair;
ACT.contest = k => { if (k === "veg") { const ks = Object.keys(S.inv).filter(i => S.inv[i] > 0 && i !== "boot"); if (!ks.length) return toast("Your bag is empty! Grow or cook something to enter."); return openM(X + "<h2>🥕 Best food</h2><p>Which one do you want the judges to taste?</p><div class='grid'>" + ks.map(i => '<button class="it" data-a="enterVeg" data-v="' + i + '"><span>' + itemInfo(i).e + "</span>" + itemInfo(i).n + "</button>").join("") + "</div>"); }
  const L = animals.filter(a => !a.lesson && (k === "jump" || k === "race" ? a.sp.ride && !a.d.baby : a.sp.home !== "pond")); if (!L.length) return toast(k === "jump" || k === "race" ? "You need an animal you can ride!" : "You need an animal first!");
  openM(X + "<h2>Who do you want to enter?</h2><div class='grid'>" + L.map(a => '<button class="it' + (a.sp.magic ? " magic" : "") + '" data-a="enter" data-v="' + k + ":" + a.d.id + '"><span>' + aEmoji(a) + "</span>" + esc(a.d.name) + "</button>").join("") + "</div>"); };
function ribbon(place, what) { const R = [["b", "🔵 BLUE RIBBON!", "First place", 60], ["r", "🔴 Red ribbon!", "Second place", 35], ["w", "⚪ White ribbon!", "Third place", 20]][place - 1];
  if (R) { S.rib[R[0]]++; S.money += R[3]; SFX.magic(); burst(pl.x, 3, pl.z, [0xff7eb6, 0xffd23f, 0x3fa9ff, 0xffffff], 50, 5, 5, .7); } else SFX.tap(); hud(); save();
  openM("<h2>" + (R ? R[1] : "🌟 Good try!") + "</h2><p><b>" + (R ? R[2] : "Fourth place") + "</b> " + what + "</p><p>" + (R ? "Prize: <b>$" + R[3] + "</b>" : "No ribbon this time. Practice and come back!") + "</p><p>Your ribbons: " + ribLine() + "</p><div class='row'><button class='btn' data-a='close'>Yay!</button></div>"); }
function judge(score, rivals, what) { closeM(); toast("The judges are thinking… 🤔", 1800); setTimeout(() => ribbon(1 + rivals.filter(r => r > score).length, what), 1900); }
ACT.enterVeg = i => { S.inv[i]--; judge(itemInfo(i).sell * rnd(.8, 1.3), [rnd(5, 22), rnd(12, 45), rnd(25, 75)], "for your " + itemInfo(i).n.toLowerCase() + "."); };
ACT.enter = v => { const p = v.split(":"), k = p[0], a = byId(p[1]), d = a.d; closeM();
  if (k === "cute") { const w = d.wear; love(a, 3); return judge(d.love * .6 + ((w.hat ? 1 : 0) + (w.scarf ? 1 : 0) + (w.saddle ? 1 : 0)) * 15 + (d.baby ? 15 : 0) + rnd(0, 20), [rnd(20, 50), rnd(30, 70), rnd(45, 92)], "in the cutest animal contest with " + d.name + "."); }
  if (k === "talent") { if (S.follow === d.id) S.follow = 0; a.x = a.tx = stage.x; a.z = a.tz = stage.z; a.hdg = Math.PI; a.wait = 9; a.act = null; const tricks = TRICKS.slice(0, d.tr); let i = 0; const go = () => { if (i < tricks.length) perform(a, tricks[i++]); else if (d.mg && i === tricks.length) { i++; perform(a, "magic", d.mg); } else return; setTimeout(go, 1900); }; if (tricks.length || d.mg) go(); else toast(d.name + " does not know any tricks yet… but the crowd still claps!");
    return setTimeout(() => judge(d.tr * 18 + d.mg * 25 + rnd(0, 20), [rnd(10, 40), rnd(25, 60), rnd(45, 96)], "in the talent show with " + d.name + "."), Math.min(6000, (tricks.length + (d.mg ? 1 : 0)) * 1900 + 400)); }
  flash(() => { if (pl.drive) leaveTractor(); if (pl.ride && pl.ride !== a) dismount(); pl.inside = 0;
    if (k === "jump") { a.x = pl.x = ARENA.x; a.z = pl.z = ARENA.z; if (pl.ride !== a) mount(a); camYaw = 0; C = { k, a, t: 45, n: 0, state: "go" }; toast("Jump the fences! Go go go!"); }
    else { a.x = pl.x = RACE[0][0]; a.z = pl.z = RACE[0][1]; if (pl.ride !== a) mount(a); pl.hdg = Math.PI / 2; camYaw = -Math.PI / 2; C = { k, a, t: 3.5, state: "count", done: 0, riv: [0, 1, 2].map(i => { const g = SPECIES.horse.build([1, 3, 4][i]), r = buildPerson({ skin: i * 2, hair: i, hairC: i + 1, top: [5, 2, 4][i], bot: 1, botT: 0, hat: 1 }); scene.add(g); r.scale.setScalar(.95); r.position.set(0, g.userData.seatY - .6, -.1); animPerson(r, 0, 0, true); g.add(r); return { g, s: 0, v: [11.3, 12.2, 12.9][i], off: (i + 1) * 2.6, fin: 0 }; }) }; }
    pl.alt = 0; snapCam(); }); };
const RACE = [[12, 19]]; for (let x = 20; x <= 70; x += 10) RACE.push([x, lerp(19.4, 17, (x - 12) / 58)]); for (let x = 73; x <= 147; x += 3) RACE.push([x, trailZ(x)]);
const RLEN = [0]; for (let i = 1; i < RACE.length; i++) RLEN.push(RLEN[i - 1] + Math.hypot(RACE[i][0] - RACE[i - 1][0], RACE[i][1] - RACE[i - 1][1]));
function raceAt(s) { let i = 1; while (i < RACE.length - 1 && RLEN[i] < s) i++; const k = clamp((s - RLEN[i - 1]) / (RLEN[i] - RLEN[i - 1]), 0, 1), a = RACE[i - 1], b = RACE[i]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), Math.atan2(b[0] - a[0], b[1] - a[1])]; }
function endContest(msg) { if (C && C.riv) C.riv.forEach(r => scene.remove(r.g)); C = null; tim.hidden = true; if (msg) toast(msg); }
function updateContest(dt) {
  if (!C) return; if (pl.ride !== C.a) return endContest("You left the contest.");
  tim.hidden = false; C.t -= dt;
  if (C.k === "jump") { tim.textContent = "🏇 " + Math.ceil(C.t) + "s · " + C.n + " jumps"; if (C.a.sp.fly) for (const h of HURDLES) if (Math.hypot(h.x - pl.x, h.z - pl.z) < 1.7 && tNow > h.ok) { h.ok = tNow + 2.5; if (pl.alt > .75 && pl.alt < 6) { C.n++; pop("Nice jump!"); SFX.coin(); } }
    if (C.t <= 0) { const n = C.n; endContest(); ribbon(n >= 6 ? 1 : n >= 4 ? 2 : n >= 2 ? 3 : 4, "in the horse show with " + n + " jumps."); } return; }
  const fin = RLEN[RLEN.length - 1];
  if (C.state === "count") { pl.x = RACE[0][0]; pl.z = RACE[0][1]; tim.textContent = C.t > .5 ? "🏁 " + Math.ceil(C.t - .5) : "GO!"; if (C.t <= 0) { C.state = "go"; SFX.good(); } }
  else tim.textContent = "🏁 Race to the end of the forest trail!";
  C.riv.forEach((r, i) => { if (C.state === "go" && !r.fin) { r.s += r.v * (.92 + .16 * Math.sin(tNow * .7 + i * 2)) * dt; if (r.s >= fin) { r.fin = 1; C.done++; } } const p = raceAt(r.s); r.g.position.set(p[0] - Math.cos(p[2]) * r.off, hgt(p[0], p[1]), p[1] + Math.sin(p[2]) * r.off); r.g.rotation.y = p[2]; animAnimal(r.g, tNow + i, C.state === "go" && !r.fin, false, 1.5); });
  if (C.state === "go" && pl.x > 142) { const place = 1 + C.done; endContest(); ribbon(Math.min(place, 4), "in the forest race."); }
}
JUMP_CB = () => { if (C && C.k === "jump") C.n++; };

/* ------------------------------ inside the stable: really clean it ------------------------------ */
const STAB = { x: 60, z: -400, w: 14, d: 20 }, stalls = [];
S.stalls = S.stalls || { day: 0, st: [0, 0, 0, 0, 0, 0] };
(function buildStable() {
  const g = grp(scene, STAB.x, 0, STAB.z), w = STAB.w, d = STAB.d, H = 6, wood = Mu(0xc98a5a, { roughness: .95 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M(0xb9a07a, { roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const yard = new THREE.Mesh(new THREE.CircleGeometry(60, 30), M(0x8fd96b)); yard.rotation.x = -Math.PI / 2; yard.position.y = -.05; g.add(yard);
  [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]].forEach(p => { const m = new THREE.Mesh(new THREE.PlaneGeometry(p[3], H), wood); m.position.set(p[0], H / 2, p[1]); m.rotation.y = p[2]; m.receiveShadow = true; g.add(m); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4), M(0x7a3a30)); door.position.set(0, 2, d / 2 - .02); door.rotation.y = Math.PI; g.add(door);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), Mu(0xbfe6ff, { emissive: 0x9fd0ff, emissiveIntensity: .6 })); win.position.set(0, 4, -d / 2 + .02); g.add(win);
  for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, z = -6 + Math.floor(i / 2) * 5.6, x = s * 4.3, sg = grp(g, x, 0, z);
    bx(sg, 0x9b6a42, 0, 1, -2.7, 5, 2, .18); bx(sg, 0x9b6a42, 0, 1, 2.7, 5, 2, .18); bx(sg, 0x9b6a42, -s * 2.5, 1, 1.7, .18, 2, 2); bx(sg, 0x9b6a42, -s * 2.5, 1, -1.7, .18, 2, 2);
    const bed = add(sg, G.box, Mu(0x6e5a32, { roughness: 1 }), s * .2, .08, 0, 4.4, .16, 5); bed.castShadow = false; bx(sg, 0xd9dde6, s * 2.1, .7, -1.8, .6, .6, 1.2, { metalness: .4, roughness: .4 });
    const pp = [0, 1, 2].map(k => { const p = buildPoop(); p.position.set(s * .2 + Math.cos(k * 2.1 + i) * 1.2, .15, Math.sin(k * 2.1 + i) * 1.4); p.scale.setScalar(1.3); sg.add(p); return p; });
    const straw = []; for (let k = 0; k < 14; k++) { const st = add(sg, G.cyl, M(0xf2d06a), s * .2 + Math.cos(k * 2.4) * (k % 5) * .4, .22, Math.sin(k * 2.4) * (k % 5) * .5, .05, 1.1, .05); st.rotation.set(Math.PI / 2, k * 1.1, 0); straw.push(st); }
    stalls.push({ i, x: STAB.x + x, z: STAB.z + z, bed, pp, straw }); }
  [[-1, 8.6], [1, 8.6]].forEach(p => add(g, G.cyl, M(0xe6c46a), p[0] * 5.5, .8, p[1], .8, 1.4, .8).rotation.z = Math.PI / 2);
  const L = new THREE.PointLight(0xfff0d8, .6, 34); L.position.set(0, 5.5, 0); g.add(L);
})();
function paintStalls() { if (S.stalls.day !== S.day) S.stalls = { day: S.day, st: [0, 0, 0, 0, 0, 0] }; stalls.forEach(s => { const v = S.stalls.st[s.i]; s.pp.forEach(p => p.visible = v < 1); s.bed.material.color.setHex(v < 2 ? 0x6e5a32 : v < 3 ? 0xb9a07a : 0xf2d98a); s.straw.forEach(m => m.visible = v >= 3); }); }
function goStable() { if (pl.ride) dismount(); if (pl.drive) leaveTractor(); SFX.tap(); flash(() => { paintStalls(); pl.inside = 2; pl.x = STAB.x; pl.z = STAB.z + 8; pl.hdg = Math.PI; camYaw = 0; camPitch = .55; snapCam(); const n = S.stalls.st.filter(v => v < 3).length; toast(n ? "Phew, " + n + " stalls need cleaning! Scoop, sweep, then fresh straw." : "The stable is already sparkling clean today! ✨"); }); }
function leaveStable() { flash(() => { pl.inside = 0; pl.x = BARN.x; pl.z = BARN.z + 10; pl.hdg = 0; camYaw = Math.PI; camPitch = .32; snapCam(); }); }
function cleanStep(s) { const v = ++S.stalls.st[s.i]; paintStalls();
  if (v === 1) { SFX.plop(); burst(s.x, .8, s.z, [0xb9a07a, 0xffffff], 12, 1.5, 2, .4); toast("Scooped! Now sweep it out. 🧹"); }
  if (v === 2) { SFX.water(); burst(s.x, .5, s.z, [0xd9c9a8, 0xffffff], 20, 2.5, 1.2, .45); toast("All swept! Now put down fresh straw. 🌾"); }
  if (v === 3) { SFX.good(); burst(s.x, 1, s.z, [0xfff3a8, 0xffffff, 0xf2d06a], 26, 2.5, 3, .5); money(5, s.x, 1.5, s.z); const left = S.stalls.st.filter(x => x < 3).length;
    if (!left) { S.stallDay = S.day; setTimeout(() => { SFX.magic(); pop("Sparkling clean! ✨"); money(20); animals.forEach(a => a.d.love = clamp(a.d.love + 6, 0, 100)); toast("Every stall is clean! All your animals are happier."); for (let i = 0; i < 6; i++) burst(STAB.x + rnd(-5, 5), rnd(1, 4), STAB.z + rnd(-8, 8), [0xffffff, 0xfff3a8, 0xbfe9ff], 14, 3, 3, .6); }, 900); } else toast("One stall done! " + left + " to go."); }
  save(); }
function stableHot() { let best = null, bd = 99; for (const s of stalls) { const v = S.stalls.st[s.i]; if (v >= 3) continue; const dd = near(s.x, s.z); if (dd < 3.6 && dd < bd) { bd = dd; best = { label: ["Scoop the poop 💩", "Sweep the stall 🧹", "Put down fresh straw 🌾"][v], fn: () => cleanStep(s) }; } }
  if (near(STAB.x, STAB.z + 9.6) < 2.4) return { label: "Go outside 🚪", fn: leaveStable }; if (best) return best;
  const left = S.stalls.st.filter(x => x < 3).length; return { label: left ? "🧹 " + left + " stalls left to clean" : "The stable is sparkling ✨", fn: () => toast(left ? "Walk into a messy stall to clean it." : "Come back tomorrow, it will be messy again!") }; }

/* ------------------------------ plugging into the game ------------------------------ */
PHONE.splice(2, 0, ["build", "🔨", "Build & decorate"], ["helpers", "🧑‍🌾", "Helpers"], ["ribbons", "🎀", "Fair & ribbons"]);
PLACES.push(["🎡", "Fair", FAIR.x + 3, FAIR.z - 5], ["🌽", "Maze", MAZE.x - 1, MAZE.z - 4]);
const goOld = ACT.goto; ACT.goto = i => { pl.inside = 0; goOld(i); snapCam(); };
WANT_MORE = o => { o.push({ t: "hayride", pay: 35, bub: "🚜🌾", say: "a hayride", label: "Take {n} on a hayride ($35)" }); };
SERVE_MORE = v => { if (v.want.t !== "hayride") return false; startHay(v); return true; };
HOT_PRE = () => {
  if (carry) return { label: "Put the " + carry.c.n.toLowerCase() + " here", fn: dropItem };
  if (C) return { label: "Stop the contest", fn: () => endContest("You stopped the contest.") };
  if (!pl.inside) return undefined;
  if (pl.inside === 2) return stableHot();
  let best = { label: "Decorate my room 🛋️", fn: ACT.roomShop }, bd = 1.6; const tryIt = (d, o) => { if (d < bd) { bd = d; best = o; } };
  tryIt(near(ROOM.x, ROOM.z + 5.6) - 1, { label: "Go outside 🚪", fn: goOutside }); tryIt(near(ROOM.x + 5.5, ROOM.z - 4.2) - 1, { label: "Cook 🍳", fn: ACT.cook });
  for (const it of placed) if (it.inside) tryIt(near(it.d.x, it.d.z) - (it.c.bed ? 1.2 : .6), { label: it.c.bed ? "Bed 🛏️" : it.c.e + " " + it.c.n, fn: () => itemMenu(it) });
  return best;
};
HOT_MORE = tryAny => {
  const tryIt = (d, o) => { if (d < 1.9) tryAny(d, o); };
  tryIt(near(HOUSE.x, HOUSE.z + 7.5) - 1.2, { label: "Go inside your house 🏠", fn: goInside });
  tryIt(near(FAIR.x, FAIR.z, 2) , { label: "Enter the country fair 🎡", fn: ACT.fair });
  const pd = near(POND.x, POND.z); if (pd > POND.r - 2 && pd < POND.r + 3.5) tryIt(1.2, { label: "Go fishing 🎣", fn: ACT.fish });
  if (mazeGoal.visible) tryIt(near(mazeGoal.position.x, mazeGoal.position.z) - .8, { label: "Take the golden corn 🌽", fn: () => { S.mazeDay = S.day; SFX.magic(); pop("You solved the maze!"); money(50, mazeGoal.position.x, 2, mazeGoal.position.z); save(); } });
  for (const it of placed) if (!it.inside) tryIt(near(it.d.x, it.d.z) + .4, { label: it.c.e + " " + it.c.n, fn: () => itemMenu(it) });
};
STEP_MORE = dt => {
  if (pl.inside) { const R = pl.inside === 2 ? STAB : ROOM; pl.x = clamp(pl.x, R.x - R.w / 2 + .6, R.x + R.w / 2 - .6); pl.z = clamp(pl.z, R.z - R.d / 2 + .6, R.z + R.d / 2 - .6); if (!pl.ride && !pl.drive) pl.g.position.set(pl.x, 0, pl.z); fall.visible = false; }
  if (carry) { const d = carry.d; d.x = pl.x + Math.sin(pl.hdg) * 2.2; d.z = pl.z + Math.cos(pl.hdg) * 2.2; d.r = pl.hdg + Math.PI; if (carry.inside) { d.x = clamp(d.x, ROOM.x - ROOM.w / 2 + .8, ROOM.x + ROOM.w / 2 - .8); d.z = clamp(d.z, ROOM.z - ROOM.d / 2 + .8, ROOM.z + ROOM.d / 2 - .8); } carry.g.position.set(d.x, hgt(d.x, d.z) + .35 + Math.sin(tNow * 5) * .08, d.z); carry.g.rotation.y = d.r; if (!!carry.inside !== (pl.inside === 1)) dropItem(); }
  if (FISHING && $("fsay")) { if (FISHING.state === 0 && tNow > FISHING.bite) { FISHING.state = 1; FISHING.until = tNow + 1.3; $("fsay").innerHTML = "<b style='font-size:26px'>❗ A bite! Pull!</b>"; SFX.plop(); } else if (FISHING.state === 1 && tNow > FISHING.until) { FISHING.state = 2; $("fsay").textContent = "It got away… tap Pull to try again."; } } else if (FISHING && $("modal").hidden) FISHING = null;
  if (wheel) { wheel.rotation.z += dt * .25; wheel.userData.cabs.forEach(c => c.rotation.z = -wheel.rotation.z); }
  mazeGoal.visible = S.mazeDay !== S.day; mazeGoal.rotation.y += dt * 1.5; lampMat.emissiveIntensity = .5 + (1 - dayF) * .9;
  updateHelpers(dt); updateHay(); updateContest(dt);
};
S.room.items.forEach(d => putItem(d, 1)); S.decor.forEach(d => putItem(d, 0)); Object.keys(S.help).forEach(k => { if (S.help[k] && HELP[k]) spawnHelper(k); }); paintRoom(); upgrades();
