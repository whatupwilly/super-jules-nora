"use strict";
/* ===========================================================================
   Pocket Peaches, by Jules. bake.js
   The treats, the step by step baking table (bowl, mix, pour, oven, frosting,
   sprinkles, toppers, magic) and how each treat is drawn.
   =========================================================================== */
const ACT = {};
const TYPES = {
  cupcake: { n: "cupcake", e: "🧁", p: 6, pour: "Pour the batter" }, cake: { n: "cake", e: "🎂", p: 10, pour: "Pour the batter" },
  cookie: { n: "cookie", e: "🍪", p: 4, pour: "Scoop the dough" }, brownie: { n: "brownie", e: "🟫", p: 5, pour: "Pour the batter" },
  donut: { n: "donut", e: "🍩", p: 5, pour: "Squeeze the dough" }, croissant: { n: "croissant", e: "🥐", p: 5, pour: "Roll the dough" },
  bread: { n: "bread", e: "🍞", p: 6, pour: "Shape the dough" }, pie: { n: "pie", e: "🥧", p: 8, pour: "Pour the filling" } };
const FLAV = {
  vanilla: { n: "Vanilla", e: "🍦", raw: "#fbeec8", done: "#eebd72", pie: "#f7e08a" }, choc: { n: "Chocolate", e: "🍫", raw: "#a9795a", done: "#6b3f24", pie: "#7a4a2a" },
  straw: { n: "Strawberry", e: "🍓", raw: "#ffd6df", done: "#f59ab0", pie: "#e8506a" }, peach: { n: "Peach", e: "🍑", raw: "#ffe3c4", done: "#f8ac6c", pie: "#ffa94a" } };
const FROST = {
  none: { n: "None", h: "" }, pink: { n: "Pink", c: "#ff8fc0", h: "💗" }, white: { n: "White", c: "#fffaf2", h: "🤍" }, choc: { n: "Chocolate", c: "#6b3f24", h: "🤎" }, blue: { n: "Blue", c: "#7fc4ff", h: "💙" },
  purple: { n: "Purple", c: "#b48cff", h: "💜" }, yellow: { n: "Yellow", c: "#ffe066", h: "💛" }, mint: { n: "Mint", c: "#8fe3b4", h: "💚" }, peach: { n: "Peach", c: "#ffb38a", h: "🧡" }, red: { n: "Red", c: "#f0506a", h: "❤️" }, rainbow: { n: "Rainbow", c: "#ff8fd0", h: "🌈" } };
const RAINBOW = ["#ff6b8b", "#ffb347", "#ffe66d", "#6fdc8c", "#6fb8ff", "#b98bff"];
const FWORD = { cupcake: "frosting", cake: "frosting", cookie: "icing", brownie: "frosting", donut: "glaze", croissant: "drizzle", bread: "glaze", pie: "cream" };
const SPR = { none: { n: "No sprinkles", e: "🚫" }, rainbow: { n: "Rainbow sprinkles", e: "🌈" }, choc: { n: "Chocolate sprinkles", e: "🍫" }, stars: { n: "Star sprinkles", e: "⭐" }, hearts: { n: "Heart sprinkles", e: "💗" }, pearls: { n: "Sugar pearls", e: "⚪" } };
const SPRC = { rainbow: RAINBOW.concat("#ffffff"), choc: ["#4a2c1a", "#6b3f24", "#8a5a34"], stars: ["#ffe45c", "#ffffff", "#ff9fd0"], hearts: ["#ff5f8f", "#ff9fc6", "#e8344e"], pearls: ["#ffffff", "#ffe9f2", "#e6f0ff", "#fff3c9"] };
const TOPS = { cherry: { n: "Cherry", e: "🍒" }, straw: { n: "Strawberry", e: "🍓" }, blue: { n: "Blueberries", e: "🫐" }, peach: { n: "Peach", e: "🍑" }, star: { n: "Star", e: "⭐" }, heart: { n: "Heart", e: "💗" }, flower: { n: "Flower", e: "🌸" }, candle: { n: "Candle", e: "🕯️" }, fly: { n: "Butterfly", e: "🦋" } };
/* two different magic ingredients make a magic power */
const MAGIC = [
  { id: "glow", a: "honey", b: "moon", n: "Glowy", e: "💡", say: "glows like a lantern" }, { id: "float", a: "star", b: "dew", n: "Floaty", e: "🎈", say: "floats up in the air" },
  { id: "rainbow", a: "dew", b: "berry", n: "Rainbow", e: "🌈", say: "shines in rainbow colors" }, { id: "giant", a: "egg", b: "honey", n: "Giant", e: "🦕", say: "grows really big" },
  { id: "tiny", a: "moon", b: "star", n: "Teeny", e: "🐭", say: "shrinks teeny tiny" }, { id: "hearts", a: "berry", b: "honey", n: "Lovey", e: "💕", say: "has hearts popping out everywhere" },
  { id: "spin", a: "egg", b: "star", n: "Twirly", e: "🌀", say: "twirls around and around" }, { id: "bubbles", a: "dew", b: "moon", n: "Bubbly", e: "🫧", say: "blows bubbles everywhere" },
  { id: "bounce", a: "berry", b: "egg", n: "Bouncy", e: "🦘", say: "bounces like a kangaroo" }, { id: "sparkle", a: "berry", b: "star", n: "Sparkly", e: "✨", say: "leaves a trail of sparkles" },
  { id: "zoom", a: "berry", b: "moon", n: "Zoomy", e: "💨", say: "runs super fast" }, { id: "firefly", a: "honey", b: "star", n: "Twinkly", e: "🌟", say: "is circled by twinkling stars" },
  { id: "wings", a: "honey", b: "dew", n: "Fluttery", e: "🦋", say: "grows butterfly wings" }, { id: "sing", a: "egg", b: "moon", n: "Singing", e: "🎵", say: "sings a little song" },
  { id: "flip", a: "egg", b: "dew", n: "Flippy", e: "🤸", say: "does flips in the air" }];
const pairKey = a => a.slice().sort().join("+"); MAGIC.forEach(m => { m.key = pairKey([m.a, m.b]); });
const magicOf = arr => arr.length === 2 ? MAGIC.find(m => m.key === pairKey(arr)) : null;
function mixc(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t)); return "#" + (r << 16 | g << 8 | bl).toString(16).padStart(6, "0"); }
const dot = k => '<i style="background:' + (k === "rainbow" ? "linear-gradient(90deg," + RAINBOW.join(",") + ")" : FROST[k].c) + '"></i>';
function ticket(o) {
  const T = TYPES[o.type], M = o.magic && MAGIC.find(m => m.id === o.magic);
  return (o.special ? "<div>⭐ “" + esc(o.special) + "”</div>" : "") + "<b>" + T.e + " " + FLAV[o.flavor].e + " " + FLAV[o.flavor].n + " " + T.n + "</b> · " + (o.frost === "none" ? "no " + FWORD[o.type] : dot(o.frost) + FROST[o.frost].n + " " + FWORD[o.type]) +
    " · " + (o.spr === "none" ? "no sprinkles" : SPR[o.spr].e + " " + SPR[o.spr].n.toLowerCase()) + (o.top ? " · " + TOPS[o.top].e + " " + TOPS[o.top].n.toLowerCase() + " on top" : "") + (M ? " · ✨ magic: " + ING[M.a].e + " + " + ING[M.b].e : "");
}

/* ------------------------------ drawing the treats ------------------------------ */
function ell(g, x, y, rx, ry) { g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); }
function wob(g, x, y, r, amp, n, ph) { for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.2832, q = r + Math.sin(a * n + ph) * amp, px = x + Math.cos(a) * q, py = y + Math.sin(a) * q * .93; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); }
function starPath(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, q = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); }
function heartPath(g, x, y, r) { g.beginPath(); g.moveTo(x, y + r); g.bezierCurveTo(x - r * 1.7, y - r * .2, x - r * .6, y - r * 1.4, x, y - r * .4); g.bezierCurveTo(x + r * .6, y - r * 1.4, x + r * 1.7, y - r * .2, x, y + r); g.closePath(); }
const CRO = [[65, 198, 19, 23, -150], [195, 198, 19, 23, -30], [93, 171, 23, 30, -120], [167, 171, 23, 30, -60], [130, 161, 26, 34, -90]];
function croSeg(g, c) { const r = (c[4] + 90) * Math.PI / 180; g.moveTo(c[0] + Math.cos(r) * c[2], c[1] + Math.sin(r) * c[2]); g.ellipse(c[0], c[1], c[2], c[3], r, 0, 6.2832); }
const BT = { cupcake: [156, 254], cake: [160, 250], cookie: [110, 250], brownie: [150, 256], donut: [110, 250], croissant: [126, 232], bread: [142, 246], pie: [104, 256] };
/* where the frosting goes (also where sprinkles land) */
function frostPath(g, ty) {
  g.beginPath();
  if (ty === "cupcake") { ell(g, 130, 168, 56, 22); ell(g, 130, 146, 44, 19); ell(g, 130, 126, 31, 15); ell(g, 130, 110, 17, 11); }
  else if (ty === "cake") { ell(g, 130, 176, 62, 16); g.moveTo(68, 176); g.lineTo(192, 176); g.lineTo(192, 194); for (let i = 0; i < 6; i++) { const x = 192 - i * 20.67; g.quadraticCurveTo(x - 10.3, 194 + (i % 2 ? 26 : 12), x - 20.67, 194); } g.closePath(); }
  else if (ty === "cookie") wob(g, 130, 180, 54, 4, 5, 1);
  else if (ty === "brownie") { g.moveTo(80, 156); g.lineTo(180, 156); g.quadraticCurveTo(188, 156, 188, 164); g.lineTo(188, 218); g.quadraticCurveTo(188, 226, 180, 226); g.lineTo(80, 226); g.quadraticCurveTo(72, 226, 72, 218); g.lineTo(72, 164); g.quadraticCurveTo(72, 156, 80, 156); g.closePath(); }
  else if (ty === "donut") { wob(g, 130, 180, 62, 4, 6, 0); ell(g, 130, 180, 30, 26); return "evenodd"; }
  else if (ty === "croissant") CRO.forEach(c => croSeg(g, c));
  else if (ty === "bread") { g.moveTo(64, 190); g.bezierCurveTo(64, 136, 196, 136, 196, 190); for (let i = 0; i < 6; i++) { const x = 196 - i * 22; g.quadraticCurveTo(x - 11, 190 + (i % 2 ? 20 : 9), x - 22, 190); } g.closePath(); }
  else if (ty === "pie") wob(g, 130, 180, 34, 4, 7, 2);
  return "nonzero";
}
function treatBody(g, ty, col, d) {
  const dk = mixc(col, "#5a3418", .3), lt = mixc(col, "#ffffff", .3); g.lineWidth = 3; g.strokeStyle = dk; g.lineCap = "round";
  if (ty === "cupcake") {
    g.fillStyle = col; g.beginPath(); ell(g, 130, 180, 54, 24); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(80, 182); g.lineTo(180, 182); g.lineTo(165, 250); g.quadraticCurveTo(130, 258, 95, 250); g.closePath(); g.fillStyle = "#ff9fc6"; g.fill();
    g.save(); g.clip(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 5; for (let x = 84; x < 180; x += 13) { g.beginPath(); g.moveTo(x, 180); g.lineTo(130 + (x - 130) * .72, 258); g.stroke(); } g.restore();
  } else if (ty === "cake") {
    g.fillStyle = "#fff"; g.beginPath(); ell(g, 130, 250, 96, 12); g.fill(); g.strokeStyle = "#e6d8e0"; g.stroke(); g.strokeStyle = dk;
    g.fillStyle = col; rr(g, 68, 176, 124, 72, 12); g.fill(); g.stroke(); g.fillStyle = "#fff4dc"; g.fillRect(70, 209, 120, 7);
    g.fillStyle = lt; g.beginPath(); ell(g, 130, 176, 62, 16); g.fill(); g.stroke();
  } else if (ty === "cookie") {
    g.fillStyle = col; g.beginPath(); ell(g, 130, 180, 72, 68); g.fill(); g.stroke(); g.fillStyle = mixc(col, "#3a2012", .55);
    [[98, 150], [160, 148], [182, 190], [150, 222], [100, 212], [84, 180], [130, 128]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 5, 0, 6.3); g.fill(); });
  } else if (ty === "brownie") {
    g.fillStyle = dk; rr(g, 64, 172, 132, 84, 12); g.fill(); g.fillStyle = col; rr(g, 64, 150, 132, 84, 12); g.fill(); g.stroke();
    g.strokeStyle = lt; g.lineWidth = 2; [[84, 170, 104, 164], [150, 214, 176, 220], [160, 168, 176, 176]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
  } else if (ty === "donut") { g.fillStyle = col; g.beginPath(); ell(g, 130, 180, 76, 70); ell(g, 130, 180, 24, 20); g.fill("evenodd"); g.stroke(); }
  else if (ty === "croissant") { g.fillStyle = col; CRO.forEach(c => { g.beginPath(); croSeg(g, c); g.fill(); g.stroke(); }); g.strokeStyle = lt; g.lineWidth = 3; CRO.forEach(c => { g.beginPath(); g.arc(c[0], c[1], c[2] * .5, 3.6, 5.2); g.stroke(); }); }
  else if (ty === "bread") {
    g.fillStyle = col; g.beginPath(); g.moveTo(58, 236); g.lineTo(58, 190); g.bezierCurveTo(58, 128, 202, 128, 202, 190); g.lineTo(202, 236); g.quadraticCurveTo(202, 246, 192, 246); g.lineTo(68, 246); g.quadraticCurveTo(58, 246, 58, 236); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = lt; g.lineWidth = 6; [0, 1, 2].forEach(i => { g.beginPath(); g.moveTo(92 + i * 30, 160); g.lineTo(108 + i * 30, 184); g.stroke(); });
  } else if (ty === "pie") {
    g.fillStyle = col; g.beginPath(); wob(g, 130, 180, 78, 3, 14, 0); g.fill(); g.stroke(); g.fillStyle = FLAV[d.flavor].pie; g.beginPath(); ell(g, 130, 180, 62, 58); g.fill();
    if (d.lattice) { g.save(); g.beginPath(); ell(g, 130, 180, 62, 58); g.clip(); g.fillStyle = col; g.strokeStyle = dk; g.lineWidth = 1.5; [150, 180, 210].forEach(y => { g.fillRect(60, y - 5, 140, 10); g.strokeRect(60, y - 5, 140, 10); }); [100, 130, 160].forEach(x => { g.fillRect(x - 5, 110, 10, 140); g.strokeRect(x - 5, 110, 10, 140); }); g.restore(); }
  }
}
function frostFill(g, k) { if (k !== "rainbow") return FROST[k].c; const gr = g.createLinearGradient(62, 0, 198, 0); RAINBOW.forEach((c, i) => gr.addColorStop(i / 5, c)); return gr; }
function drawFrost(g, d) {
  const fc = frostFill(g, d.frost), ty = d.type;
  if (ty === "croissant") { g.save(); g.strokeStyle = fc; g.lineWidth = 7; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); const n = Math.floor(d.cover * 16); for (let i = 0; i <= n; i++) { const a = (-155 + i / 16 * 130) * Math.PI / 180, r = 75 + (i % 2 ? 22 : -20), x = 130 + Math.cos(a) * r, y = 235 + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.restore(); return; }
  g.save(); const rule = frostPath(g, ty); g.clip(rule); g.fillStyle = fc; g.beginPath(); g.arc(130, 172, 10 + d.cover * 125, 0, 6.2832); g.fill();
  g.fillStyle = "rgba(255,255,255,.3)"; g.beginPath(); g.ellipse(108, 150, 16, 7, -.5, 0, 6.2832); g.fill(); g.restore();
  if (d.cover >= 1) { frostPath(g, ty); g.strokeStyle = "rgba(90,40,60,.22)"; g.lineWidth = 2; g.stroke(); }
}
function makeSpr(d) {
  const c = document.createElement("canvas"); c.width = 260; c.height = 290; const g = c.getContext("2d"), rule = frostPath(g, d.type), out = [];
  for (let i = 0; i < 1200 && out.length < 46; i++) { const x = rnd(48, 212), y = rnd(98, 256); if (g.isPointInPath(x, y, rule)) out.push({ x, y, a: rnd(0, 3.14), ci: Math.floor(rnd(0, 7)), dl: Math.random() * .5 }); }
  d.sprPts = out; d.sprT = 0;
}
function drawSpr(g, d) {
  const C = SPRC[d.spr];
  d.sprPts.forEach(p => {
    const k = clamp((d.sprT - p.dl) * 2.4, 0, 1); if (k <= 0) return; const y = p.y - (1 - k) * (1 - k) * 170; g.fillStyle = C[p.ci % C.length];
    if (d.spr === "stars") { starPath(g, p.x, y, 5); g.fill(); }
    else if (d.spr === "hearts") { heartPath(g, p.x, y, 4.2); g.fill(); }
    else if (d.spr === "pearls") { g.beginPath(); g.arc(p.x, y, 3, 0, 6.3); g.fill(); g.strokeStyle = "rgba(160,120,140,.4)"; g.lineWidth = .8; g.stroke(); }
    else { g.save(); g.translate(p.x, y); g.rotate(p.a); rr(g, -4.5, -1.6, 9, 3.2, 1.6); g.fill(); g.restore(); }
  });
}
function drawTreat(g, d, t) {
  const F = d.type === "pie" ? FLAV.vanilla : FLAV[d.flavor]; let col = mixc(F.raw, F.done, clamp(d.baked, 0, 1)); if (d.baked > 1.15) col = mixc(col, "#4a2c1a", Math.min(.6, (d.baked - 1.15) * 1.6));
  treatBody(g, d.type, col, d);
  if (d.frost !== "none" && d.cover > 0) drawFrost(g, d);
  if (d.spr !== "none" && d.sprPts.length) drawSpr(g, d);
  g.textAlign = "center"; g.textBaseline = "middle";
  d.tops.forEach(p => { const s = Math.min(1, p.s); g.font = Math.round(30 * (s < 1 ? .5 + s * .7 : 1)) + "px serif"; g.fillText(TOPS[p.k].e, p.x, p.y); });
  if (d.magic.length) for (let i = 0; i < 9; i++) { const a = .5 + .5 * Math.sin(t * 4 + i * 2); g.globalAlpha = a; g.fillStyle = RAINBOW[i % 6]; starPath(g, 40 + (i * 67) % 190, 90 + (i * 43) % 170, 3 + a * 5); g.fill(); g.globalAlpha = 1; }
}
function drawBowl(g, m, t) {
  const F = FLAV[m.flavor], A = m.added, bat = mixc("#fff8e6", F.raw, .3 + .7 * m.mixed);
  g.fillStyle = "#f3c6da"; g.beginPath(); ell(g, 130, 150, 84, 24); g.fill();
  if (A.flour || A.sugar || A.egg || A.butter) {
    g.save(); g.beginPath(); ell(g, 130, 153, 78, 20); g.clip(); g.fillStyle = bat; g.fillRect(40, 120, 180, 70); g.globalAlpha = 1 - m.mixed;
    if (A.flour) { g.fillStyle = "#fff"; g.beginPath(); g.ellipse(104, 150, 30, 12, 0, 0, 6.3); g.fill(); }
    if (A.sugar) { g.fillStyle = "#e9f1ff"; for (let i = 0; i < 16; i++) g.fillRect(138 + (i * 17) % 46, 141 + (i * 7) % 18, 3, 3); }
    for (let i = 0; i < A.egg; i++) { g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.ellipse(116 + i * 30, 160, 15, 8, 0, 0, 6.3); g.fill(); g.fillStyle = "#ffc62e"; g.beginPath(); g.arc(116 + i * 30, 159, 6, 0, 6.3); g.fill(); }
    if (A.butter) { g.fillStyle = "#ffe36e"; rr(g, 152, 150, 24, 13, 3); g.fill(); }
    g.globalAlpha = 1;
    if (m.mixed > 0) { g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 3; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(130, 153, 18 + i * 20, 4 + i * 5, 0, m.stir * .9 + i, m.stir * .9 + i + 2.4); g.stroke(); } }
    g.restore();
  }
  g.beginPath(); g.moveTo(46, 150); g.quadraticCurveTo(54, 262, 130, 264); g.quadraticCurveTo(206, 262, 214, 150); g.ellipse(130, 150, 84, 24, 0, 0, Math.PI, false); g.closePath();
  g.fillStyle = "#ffb3d1"; g.fill(); g.strokeStyle = "#e07fa8"; g.lineWidth = 3; g.stroke();
  g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 6; g.beginPath(); g.moveTo(66, 205); g.quadraticCurveTo(130, 232, 194, 205); g.stroke();
  if (m.steps[m.step] === "mix") { const a = Math.sin(m.stir * 1.6) * .5; g.strokeStyle = "#c98a5a"; g.lineWidth = 10; g.lineCap = "round"; g.beginPath(); g.moveTo(130 + Math.sin(a) * 80, 34); g.lineTo(130 - Math.sin(a) * 34, 152); g.stroke(); g.lineCap = "butt"; }
  g.font = "34px serif"; m.falls.forEach(f => g.fillText(f.e, f.x, f.y));
}
function drawPour(g, m, t) {
  const B = BT[m.type], y = B[1] - (B[1] - B[0]) * Math.min(1, m.fill), raw = m.type === "pie" ? FLAV[m.flavor].pie : FLAV[m.flavor].raw;
  g.save(); g.globalAlpha = .2; drawTreat(g, m, t); g.restore();
  if (m.fill > 1.03) { g.fillStyle = raw; g.beginPath(); g.ellipse(130, B[1] + 10, 70 + (m.fill - 1) * 260, 9, 0, 0, 6.3); g.fill(); }
  g.save(); g.beginPath(); g.rect(0, y, 260, 300); g.clip(); drawTreat(g, m, t); g.restore();
  g.strokeStyle = "#ff5fa2"; g.lineWidth = 3; g.setLineDash([7, 5]); g.beginPath(); g.moveTo(36, B[0]); g.lineTo(224, B[0]); g.stroke(); g.setLineDash([]);
  if (m.pour && m.fill < 1.15) { g.fillStyle = raw; g.fillRect(124, 0, 12, y); }
}
function drawOven(g, m, t) {
  const C = [["#9a94a6", "#77718a"], ["#ff9fc6", "#e0559a"], ["#b48cff", "#7a4fd0"]][S.oven];
  g.fillStyle = C[0]; rr(g, 28, 36, 204, 236, 26); g.fill(); g.strokeStyle = C[1]; g.lineWidth = 5; g.stroke();
  if (S.oven === 2) RAINBOW.forEach((c, i) => { g.fillStyle = c; g.fillRect(46 + i * 28, 46, 28, 8); });
  g.fillStyle = "#2c1c16"; rr(g, 52, 78, 156, 134, 18); g.fill();
  if (m.inOven) {
    const gl = g.createRadialGradient(130, 200, 10, 130, 150, 110); gl.addColorStop(0, "rgba(255,170,60," + (.7 + .15 * Math.sin(t * 6)) + ")"); gl.addColorStop(1, "rgba(255,90,30,0)"); g.fillStyle = gl; rr(g, 52, 78, 156, 134, 18); g.fill();
    g.save(); g.translate(130, 148); g.scale(.55, .55); g.translate(-130, -182); drawTreat(g, m, t); g.restore();
  }
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 4; rr(g, 52, 78, 156, 134, 18); g.stroke();
  [80, 130, 180].forEach(x => { g.fillStyle = "#fff"; g.beginPath(); g.arc(x, 242, 10, 0, 6.3); g.fill(); g.fillStyle = C[1]; g.beginPath(); g.arc(x, 242, 4, 0, 6.3); g.fill(); });
  g.fillStyle = "#fff"; rr(g, 90, 58, 80, 10, 5); g.fill();
  if (S.pet === "dragon" && m.inOven) { g.font = "38px serif"; g.fillText("🐲", 34, 258); g.font = Math.round(20 + Math.sin(t * 14) * 5) + "px serif"; g.fillText("🔥", 66, 248); }
}

/* ------------------------------ the baking table ------------------------------ */
let mk = null;
const STEPN = { pick: "Pick a treat to bake", bowl: "Put everything in the bowl", mix: "Mix it up!", bake: "Bake it in the oven", spr: "Shake on sprinkles", top: "Decorate the top", magic: "Add the magic" };
function openMaker(kind, order, c) {
  const steps = (kind === "invent" ? ["pick"] : []).concat(["bowl", "mix", "pour", "bake", "frost", "spr", "top"], kind === "invent" || (order && order.magic) ? ["magic"] : []);
  mk = { kind, order, c, steps, step: 0, type: order ? order.type : "cupcake", flavor: "vanilla", added: { flour: 0, sugar: 0, egg: 0, butter: 0 }, falls: [], mixed: 0, stir: 0, fill: 0, pour: 0, lattice: 0, inOven: 0, out: 0, bake: 0, baked: 0, bakeGood: 0, bakeSay: "",
    frost: "pink", cover: 0, spr: "none", sprPts: [], sprT: 0, tops: [], topK: "cherry", magic: [], t: 0, done: 0, drag: null };
  const who = c ? c.name : deliv ? deliv.name : "";
  openM(X + '<h2 id="mkT"></h2>' + (order ? '<div class="tick">' + esc(who) + " wants: " + ticket(order) + "</div>" : "<p>Bake anything you like. At the end, add <b>two magic ingredients</b> from your basket to find a magic power!</p>") + '<canvas id="mk" width="520" height="580"></canvas><div id="mkc"></div>');
  toastT = .01; mkUI();
}
function mkUI() {
  if (!mk || mk.done) return; const m = mk, s = m.steps[m.step], T = TYPES[m.type], last = m.step === m.steps.length - 1; let h = "";
  $("mkT").textContent = (m.step + 1) + " of " + m.steps.length + ": " + (s === "pour" ? T.pour : s === "frost" ? "Put on the " + FWORD[m.type] : STEPN[s]); $("mk").hidden = s === "pick";
  const next = (lab, dis) => '<button class="btn" id="mkNext" data-a="mkNext"' + (dis ? " disabled" : "") + ">" + (lab || (last ? "✔ All done!" : "Next ➜")) + "</button>";
  if (s === "pick") h = '<div class="grid">' + Object.keys(TYPES).map(k => '<button class="it' + (m.type === k ? " sel" : "") + '" data-a="mkType" data-v="' + k + '"><span>' + TYPES[k].e + "</span>" + cap(TYPES[k].n) + "</button>").join("") + '</div><div class="row">' + next() + "</div>";
  if (s === "bowl") {
    const A = m.added, all = A.flour && A.sugar && A.egg >= 2 && A.butter;
    h = '<div class="row">' + Object.keys(FLAV).map(k => chip(FLAV[k].e + " " + FLAV[k].n, m.flavor === k, "mkFlav", k)).join("") + '</div><div class="row">' +
      [["flour", "🌾 Flour"], ["sugar", "🍚 Sugar"], ["egg", "🥚 Crack an egg (" + A.egg + " of 2)"], ["butter", "🧈 Butter"]].map(a => '<button class="btn mag" data-a="mkAdd" data-v="' + a[0] + '"' + (A[a[0]] >= (a[0] === "egg" ? 2 : 1) ? " disabled" : "") + ">" + a[1] + "</button>").join("") + '</div><div class="row">' + next(0, !all) + "</div>";
  }
  if (s === "mix") h = '<div class="bar"><i id="mkBar" style="width:' + m.mixed * 100 + '%"></i></div><div class="row"><button class="btn big mag" data-a="mkStir">🥄 Stir!</button></div><p>Or rub the bowl round and round with your finger.</p>';
  if (s === "pour") h = "<p>Hold the button. Stop at the pink line!</p>" + '<div class="row"><button class="btn big mag" id="pourB">👇 Hold</button>' + next(0, m.fill < .5) + "</div>";
  if (s === "bake") {
    const z = OVENS[S.oven].z;
    if (!m.inOven) h = '<div class="row"><button class="btn big mag" data-a="mkOvenIn">🚪 Put it in the oven</button></div>';
    else if (!m.out) h = '<div id="tr"><div class="zone" style="left:' + (1 - z) / 1.6 * 100 + "%;width:" + 2 * z / 1.6 * 100 + '%"></div><div class="mk" id="trM"></div></div><div class="row"><button class="btn big mag" data-a="mkOut">🧤 Take it out!</button></div><p>Take it out when the white marker is in the green.</p>';
    else h = "<p><b>" + m.bakeSay + "</b></p>";
  }
  if (s === "frost") h = '<div class="row">' + Object.keys(FROST).filter(k => k !== "none").map(k => '<button class="sw' + (m.frost === k ? " on" : "") + '" style="background:' + (k === "rainbow" ? "linear-gradient(90deg," + RAINBOW.join(",") + ")" : FROST[k].c) + '" data-a="mkFrost" data-v="' + k + '"></button>').join("") + "</div>" +
    '<div class="row">' + chip("🚫 No " + FWORD[m.type], m.frost === "none", "mkFrost", "none") + '<button class="btn big mag" data-a="mkSwirl"' + (m.cover >= 1 ? " disabled" : "") + ">🧁 Swirl it on!</button>" + next() + "</div><p>Or rub it on with your finger.</p>";
  if (s === "spr") h = '<div class="row">' + Object.keys(SPR).map(k => chip(SPR[k].e + " " + SPR[k].n, m.spr === k, "mkSpr", k)).join("") + '</div><div class="row">' + next() + "</div>";
  if (s === "top") h = '<div class="row">' + Object.keys(TOPS).map(k => chip(TOPS[k].e + " " + TOPS[k].n, m.topK === k, "mkTopK", k)).join("") + "</div><p>Pick one, then <b>tap your treat</b> to put it on. As many as you like!</p>" + '<div class="row"><button class="btn alt" data-a="mkUndo"' + (m.tops.length ? "" : " disabled") + ">↩ Take one off</button>" + next() + "</div>";
  if (s === "magic") h = "<p>Pick <b>two different</b> magic ingredients from your basket.</p>" + '<div class="row">' + Object.keys(ING).map(k => '<button class="chip' + (m.magic.includes(k) ? " on" : "") + (S.inv[k] > 0 ? "" : " off") + '" data-a="mkMagic" data-v="' + k + '">' + ING[k].e + " " + ING[k].n + " ×" + S.inv[k] + "</button>").join("") + '</div><div class="row">' + next(m.magic.length ? "✨ Do the magic!" : "No magic this time ➜") + "</div>";
  $("mkc").innerHTML = h;
}
function mkGo() { const m = mk, s = m.steps[m.step]; if (s === "pour") m.lattice = 1; if (s === "frost" && m.cover < .3) { m.frost = "none"; m.cover = 0; } m.step++; SFX.pop(); if (m.step >= m.steps.length) mkFinish(); else mkUI(); }
ACT.mkNext = () => mkGo();
ACT.mkType = v => { mk.type = v; SFX.pop(); mkUI(); };
ACT.mkFlav = v => { mk.flavor = v; SFX.pop(); mkUI(); };
ACT.mkAdd = v => { const A = mk.added; if (A[v] >= (v === "egg" ? 2 : 1)) return; A[v]++; mk.falls.push({ e: { flour: "🌾", sugar: "🍚", egg: "🥚", butter: "🧈" }[v], x: rnd(100, 160), y: 10 }); if (v === "egg") SFX.crack(); else SFX.plop(); mkUI(); };
function stir(a) { const m = mk; if (!m || m.mixed >= 1) return; m.mixed = Math.min(1, m.mixed + a); m.stir += a * 12; const b = $("mkBar"); if (b) b.style.width = m.mixed * 100 + "%"; if (a > .05) SFX.plop(); if (m.mixed >= 1) { SFX.yay(); setTimeout(() => { if (mk === m && m.steps[m.step] === "mix") mkGo(); }, 500); } }
ACT.mkStir = () => stir(.13);
ACT.mkOvenIn = () => { mk.inOven = 1; SFX.plop(); mkUI(); };
function takeOut(how) {
  const m = mk; if (!m.inOven || m.out) return; m.out = 1; m.baked = m.bake; const d = m.baked - 1; m.bakeGood = Math.abs(d) <= OVENS[S.oven].z; if (m.bakeGood) SFX.yay(); else SFX.pop();
  m.bakeSay = how === 2 ? "🧚 Poppy the oven fairy took it out at the perfect time!" : m.bakeGood ? "🌟 Perfectly golden!" : d < 0 ? "A little bit gooey, but still yummy." : "A little bit toasty, but still yummy.";
  mkUI(); setTimeout(() => { if (mk === m && m.steps[m.step] === "bake") mkGo(); }, 1300);
}
ACT.mkOut = () => takeOut(0);
ACT.mkFrost = v => { mk.frost = v; if (v === "none") mk.cover = 0; SFX.pop(); mkUI(); };
ACT.mkSwirl = () => { if (mk.frost === "none") mk.frost = "pink"; mk.cover = Math.min(1, mk.cover + .26); SFX.plop(); mkUI(); };
ACT.mkSpr = v => { mk.spr = v; if (v !== "none") { makeSpr(mk); SFX.shake(); setTimeout(SFX.shake, 90); } else SFX.pop(); mkUI(); };
ACT.mkTopK = v => { mk.topK = v; SFX.pop(); mkUI(); };
ACT.mkUndo = () => { mk.tops.pop(); SFX.pop(); mkUI(); };
ACT.mkMagic = v => { const i = mk.magic.indexOf(v); if (i >= 0) mk.magic.splice(i, 1); else if (S.inv[v] <= 0) { SFX.no(); return toast("You have no " + ING[v].n.toLowerCase() + ". Look for " + ING[v].at + "!"); } else if (mk.magic.length >= 2) { SFX.no(); return toast("Two is enough! Tap one to take it out."); } else mk.magic.push(v); SFX.pop(); mkUI(); };
function mkXY(e) { const r = e.target.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 260, y: (e.clientY - r.top) / r.height * 290 }; }
$("modalCard").addEventListener("pointerdown", e => {
  if (!mk) return; audio();
  if (e.target.id === "pourB") { mk.pour = 1; try { e.target.setPointerCapture(e.pointerId); } catch (err) {} return; }
  if (e.target.id !== "mk" || mk.done) return; const p = mkXY(e), s = mk.steps[mk.step];
  if (s === "top") { if (mk.tops.length >= 18) return toast("That is a LOT of toppings! Take one off to add more."); mk.tops.push({ x: p.x, y: p.y, k: mk.topK, s: 0 }); SFX.pop(); const b = $("mkc").querySelector('[data-a="mkUndo"]'); if (b) b.disabled = false; }
  else if (s === "mix" || s === "frost") { mk.drag = p; try { e.target.setPointerCapture(e.pointerId); } catch (err) {} }
});
$("modalCard").addEventListener("pointermove", e => {
  if (!mk || !mk.drag || e.target.id !== "mk") return; const p = mkXY(e), d = Math.hypot(p.x - mk.drag.x, p.y - mk.drag.y), s = mk.steps[mk.step]; mk.drag = p;
  if (s === "mix") stir(Math.min(.04, d / 900)); else if (s === "frost" && mk.frost !== "none" && mk.cover < 1) { mk.cover = Math.min(1, mk.cover + d / 700); if (mk.cover >= 1) mkUI(); }
});
["pointerup", "pointercancel"].forEach(ev => window.addEventListener(ev, () => { if (!mk) return; mk.drag = null; if (mk.pour) { mk.pour = 0; mkUI(); } }));
function mkTick(dt) {
  const m = mk; m.t += dt; if (m.steps[m.step] === "mix") m.stir += dt * .5;
  if (m.pour && m.fill < 1.15) { m.fill = Math.min(1.15, m.fill + dt * .45); if (Math.random() < .3) SFX.pour(); const b = $("mkNext"); if (b) b.disabled = m.fill < .5; }
  if (m.inOven && !m.out) { m.bake += dt * .2 * OVENS[S.oven].spd * (S.pet === "dragon" ? 1.3 : 1); m.baked = m.bake; const k = $("trM"); if (k) k.style.left = clamp(m.bake / 1.6, 0, 1) * 100 + "%"; if (S.help.oven && m.bake >= 1) takeOut(2); else if (m.bake >= 1.6) takeOut(1); }
  m.sprT += dt; m.tops.forEach(p => { p.s += dt * 6; });
  for (let i = m.falls.length - 1; i >= 0; i--) { m.falls[i].y += 420 * dt; if (m.falls[i].y > 150) m.falls.splice(i, 1); }
  const c = $("mk"); if (!c || c.hidden) return; const g = c.getContext("2d"); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 260, 290); g.textAlign = "center"; g.textBaseline = "middle"; g.lineCap = "butt";
  const s = m.done ? "done" : m.steps[m.step];
  if (s === "bowl" || s === "mix") drawBowl(g, m, m.t); else if (s === "pour") drawPour(g, m, m.t); else if (s === "bake" && !m.out) drawOven(g, m, m.t); else drawTreat(g, m, m.t);
}
const fcol = k => k === "none" ? null : parseInt(FROST[k].c.slice(1), 16);
function mkFinish() {
  const m = mk, T = TYPES[m.type]; m.done = 1;
  const d = { type: m.type, flavor: m.flavor, frost: m.frost, spr: m.spr, top: m.tops.length ? m.tops[0].k : null };
  m.magic.forEach(k => { S.inv[k] = Math.max(0, S.inv[k] - 1); }); const P = magicOf(m.magic), pourGood = m.fill >= .86 && m.fill <= 1.03; let h = "";
  if (m.kind === "invent") {
    SFX.yay();
    if (P) {
      const isNew = !S.found[P.id]; S.found[P.id] = 1; if (isNew) S.coins += 25; m.made = d; m.P = P; $("mkT").textContent = "✨ It is magic!";
      h += '<div class="tick">' + (isNew ? "🎉 New magic power found: " : "Magic power: ") + "<b>" + P.e + " " + P.n + "</b>!<br>Whoever eats it " + P.say + "." + (isNew ? " +💰25" : "") + "</div>";
      h += '<p>Name your magic treat and put it on your menu. Customers will ask for it!</p><div class="row"><input id="mkName" maxlength="22" value="' + esc(S.rec[P.id] ? S.rec[P.id].n : P.n + " " + T.n) + '"></div><div class="row"><button class="btn" data-a="mkSave">⭐ Put it on my menu</button><button class="btn alt" data-a="close">Just for fun</button></div>';
      startFx(pl, P.id, 14); toast("You took a bite... " + P.e + " Close this to see!", 5);
    } else {
      $("mkT").textContent = "Yummy!";
      h += "<p>" + (m.magic.length === 1 ? "One magic ingredient makes it extra yummy, but you need <b>two different ones</b> to make a magic power." : "Next time add <b>two magic ingredients</b> at the end to find a magic power. You can pick them in the forest!") + '</p><div class="row"><button class="btn" data-a="close">Okay!</button></div>';
    }
  } else {
    const o = m.order, miss = []; let ok = 0, n = 3;
    if (d.flavor === o.flavor) ok++; else miss.push(FLAV[o.flavor].n.toLowerCase() + " flavor");
    if (d.frost === o.frost) ok++; else miss.push(o.frost === "none" ? "no " + FWORD[o.type] : FROST[o.frost].n.toLowerCase() + " " + FWORD[o.type]);
    if (d.spr === o.spr) ok++; else miss.push(o.spr === "none" ? "no sprinkles" : SPR[o.spr].n.toLowerCase());
    if (o.top) { n++; if (m.tops.some(t => t.k === o.top)) ok++; else miss.push("a " + TOPS[o.top].n.toLowerCase() + " on top"); }
    if (o.magic) { n++; const M = MAGIC.find(x => x.id === o.magic); if (P && P.id === o.magic) ok++; else miss.push("the " + M.n.toLowerCase() + " magic (" + ING[M.a].e + " + " + ING[M.b].e + ")"); }
    const frac = ok / n, stars = Math.max(1, Math.round(frac * 5)), base = price(o), mult = m.kind === "deliv" ? 2 : 1, fx = P ? P.id : null;
    let p = Math.round(base * (.4 + .6 * frac) * mult), tip = 0;
    if (m.c && stars >= 4) tip = Math.round(base * .5 * m.c.pat * (1 + cozy()) * (m.c.magic ? 2 : 1)); if (m.bakeGood) tip += 1; if (pourGood) tip += 1;
    $("mkT").textContent = stars >= 5 ? "Perfect!" : stars >= 3 ? "Yummy!" : "Good try!";
    h += '<div class="stars">' + "⭐".repeat(stars) + "☆".repeat(5 - stars) + "</div>" + (miss.length ? "<p>They wanted " + miss.join(" and ") + ".</p>" : "") + (m.bakeGood ? "<p>Perfectly baked! 🌟</p>" : "");
    const item = { type: d.type, fc: fcol(d.frost), bc: parseInt(FLAV[d.flavor].done.slice(1), 16) };
    if (m.kind === "deliv") { deliv.state = "made"; deliv.pay = p + tip; deliv.item = item; deliv.fx = fx; carry = 1; giveItem(pl.m, mkBox()); h += "<p>It is in a box! Slide down to the forest and take it to the <b>" + deliv.h.e + " " + deliv.h.n + "</b>. Follow the yellow light, and pick 🐾 Ride, 🪢 Zip line or 🫧 Bubble!</p>"; }
    else { S.served++; h += "<p><b>+💰" + p + "</b>" + (tip ? " and a <b>💰" + tip + " tip</b>" + (m.c.magic ? " (magic tip!)" : "") : "") + "</p>"; earn(p + tip); if (stars >= 5) SFX.yay(); leave(m.c, mkTreat(item.type, item.fc, item.bc), fx); }
    h += '<div class="row"><button class="btn" data-a="close">Yay!</button></div>';
  }
  hud(); save(); $("mkc").innerHTML = h;
}
ACT.mkSave = () => { const P = mk.P, n = ($("mkName").value || "").trim() || P.n + " " + TYPES[mk.made.type].n; S.rec[P.id] = Object.assign({ n }, mk.made); save(); closeM(); SFX.yay(); toast("“" + n + "” is on your menu now! Customers ask for it when you have " + ING[P.a].e + " and " + ING[P.b].e + " in your basket.", 6); };
