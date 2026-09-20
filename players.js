/* ===========================================================================
   Arcade players — one profile picker shared by every game.

   Two sisters share one iPad, so a single browser has to hold more than one
   saved game. Every game's localStorage key gets the active player's id
   appended ("zombieSave" -> "zombieSave::p4k2x1"), which gives each player
   their own world in every game without any game having to know that other
   players exist.

   A game uses it in one line, capturing the key once at load:

       const SAVE_KEY = Arcade.key("zombieSave");

   ...and gets the picker for free at the top of its "Games" menu. Switching
   player reloads the page so the game re-reads the new profile's save.
   =========================================================================== */
(function (global, doc) {
  "use strict";

  var ROSTER_KEY = "arcade.players";
  var SEP = "::";

  /* Every save key used anywhere in the arcade. Listed here so a brand-new
     roster can adopt worlds that were saved before profiles existed, and so
     deleting a player can clean up after them. */
  var GAME_KEYS = [
    "julescity.v1", "julescity.v2", "zombieSave",
    "fpBestDay", "fpExact", "tennisBallSpd", "tennisRunSpd", "magicPigeonsOff"
  ];

  var AVATARS = ["🦄","🐱","🐼","🦊","🐸","🐧","🐢","🦋","🐨","🐙","🌈","⭐️","🍉","🍀"];
  var TINTS = ["#ff5fa2","#8b5cf6","#35d6ff","#7ef29d","#ffd166","#fb7185","#38bdf8","#a3e635"];

  /* ---- storage, every call defensive: Safari private mode throws ---- */
  function box() { try { return global.localStorage; } catch (e) { return null; } }
  function rd(k) { var s = box(); try { return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function wr(k, v) { var s = box(); try { if (!s) return false; s.setItem(k, v); return true; } catch (e) { return false; } }
  function rm(k) { var s = box(); try { if (s) s.removeItem(k); } catch (e) {} }

  function uid() { return "p" + Math.random().toString(36).slice(2, 8) + (Date.now() % 1000); }

  var roster = null;
  var frozen = null;   /* id pinned while a switch is mid-flight, see switchTo */

  function fresh() {
    var p = { id: uid(), name: "Player 1", avatar: AVATARS[0] };
    return { v: 1, active: p.id, players: [p] };
  }

  function persist() { wr(ROSTER_KEY, JSON.stringify(roster)); }

  /* Move the pre-profile saves (bare keys, no player suffix) onto a player,
     so nobody loses the world they already built. Copy, read back, and only
     then drop the original. */
  function adopt(id) {
    GAME_KEYS.forEach(function (k) {
      var v = rd(k);
      if (v === null) return;
      var dest = k + SEP + id;
      if (rd(dest) !== null) return;
      if (wr(dest, v) && rd(dest) === v) rm(k);
    });
  }

  function load() {
    if (roster) return roster;
    var d = null;
    try { d = JSON.parse(rd(ROSTER_KEY) || "null"); } catch (e) { d = null; }
    if (!d || !d.players || !d.players.length) {
      roster = fresh();
      persist();
      adopt(roster.players[0].id);
    } else {
      roster = d;
      if (!find(roster.active)) { roster.active = roster.players[0].id; persist(); }
    }
    return roster;
  }

  function find(id) {
    var ps = load().players;
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
    return null;
  }

  function tint(p) {
    var i = load().players.indexOf(p);
    return TINTS[(i < 0 ? 0 : i) % TINTS.length];
  }

  var API = {
    /* The namespaced key a game should read and write. */
    key: function (base) { return base + SEP + (frozen || load().active); },

    list: function () { return load().players.slice(); },
    active: function () { return find(load().active); },

    add: function (name) {
      var r = load();
      var p = { id: uid(), name: (name || "").trim() || ("Player " + (r.players.length + 1)),
                avatar: AVATARS[r.players.length % AVATARS.length] };
      r.players.push(p);
      persist();
      return p;
    },

    rename: function (id, name) {
      var p = find(id);
      if (!p) return;
      p.name = String(name).slice(0, 14);
      persist();
    },

    setAvatar: function (id, a) { var p = find(id); if (p) { p.avatar = a; persist(); } },

    /* Deleting a player takes their saved worlds with them. */
    destroy: function (id) {
      var r = load();
      if (r.players.length < 2) return false;
      r.players = r.players.filter(function (p) { return p.id !== id; });
      GAME_KEYS.forEach(function (k) { rm(k + SEP + id); });
      if (r.active === id) r.active = r.players[0].id;
      persist();
      return true;
    },

    /* Reload so the running game re-reads the new profile. Until the reload
       lands, key() keeps answering with the OLD id, so an autosave firing in
       that window still writes to the player who actually played it. */
    switchTo: function (id) {
      var r = load();
      if (!find(id) || r.active === id) return;
      frozen = r.active;
      r.active = id;
      persist();
      global.location.reload();
    },

    avatars: function () { return AVATARS.slice(); },
    tint: tint
  };

  /* =======================================================================
     UI. Two mount points — a chip row for the landing page, and a section
     prepended to the "Games" dropdown that every game already has — plus a
     shared manage-players card.
     ======================================================================= */

  var CSS = [
    ".arc-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}",
    ".arc-chip{display:inline-flex;align-items:center;gap:9px;padding:9px 16px 9px 10px;border-radius:999px;",
      "border:2px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;cursor:pointer;",
      "font:800 15px inherit;transition:transform .15s ease,border-color .15s ease}",
    ".arc-chip:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.4)}",
    ".arc-chip .av{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:18px;background:rgba(255,255,255,.14)}",
    ".arc-chip[aria-pressed=true]{border-color:var(--arc-tint);box-shadow:0 0 0 3px rgba(255,255,255,.16)}",
    ".arc-chip[aria-pressed=true] .av{background:var(--arc-tint)}",
    ".arc-chip .who{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.6;display:block;line-height:1.3}",
    ".arc-chip .nm{display:block;line-height:1.15;text-align:left}",

    /* the card, shown over a running game as well as over the landing page */
    ".arc-veil{position:fixed;inset:0;z-index:2147483000;background:rgba(6,6,20,.72);backdrop-filter:blur(6px);",
      "display:grid;place-items:center;padding:20px;overflow:auto;-webkit-overflow-scrolling:touch}",
    ".arc-card{width:min(420px,100%);background:#14142b;color:#f6f4ff;border:1px solid rgba(255,255,255,.14);",
      "border-radius:22px;padding:20px;box-shadow:0 30px 80px rgba(0,0,0,.6);",
      "font-family:'Avenir Next','Trebuchet MS',Arial,sans-serif;touch-action:auto}",
    ".arc-card h2{font-size:19px;font-weight:900;margin:0 0 4px}",
    ".arc-card .hint{font-size:13px;color:#a7a3c8;margin:0 0 16px;font-weight:600;line-height:1.45}",
    ".arc-p{display:flex;align-items:center;gap:10px;padding:9px;border-radius:15px;margin-bottom:9px;",
      "background:rgba(255,255,255,.06);border:2px solid transparent}",
    ".arc-p.on{border-color:var(--arc-tint);background:rgba(255,255,255,.1)}",
    ".arc-p .av{width:42px;height:42px;flex:none;border-radius:13px;font-size:22px;display:grid;place-items:center;",
      "background:rgba(255,255,255,.12);border:0;cursor:pointer;color:inherit}",
    ".arc-p .av:hover{background:var(--arc-tint)}",
    ".arc-p input{flex:1;min-width:0;background:transparent;border:0;border-bottom:2px dashed rgba(255,255,255,.18);",
      "color:#f6f4ff;font:800 16px inherit;padding:5px 2px}",
    ".arc-p input:focus{outline:none;border-bottom-color:var(--arc-tint)}",
    ".arc-p .go,.arc-p .del{border:0;border-radius:11px;padding:8px 11px;font:800 12px inherit;cursor:pointer}",
    ".arc-p .go{background:var(--arc-tint);color:#12081c}",
    ".arc-p .now{font:800 11px inherit;letter-spacing:.1em;text-transform:uppercase;color:var(--arc-tint);padding:0 8px}",
    ".arc-p .del{background:rgba(255,255,255,.1);color:#ffb4c8}",
    ".arc-p .del[disabled]{opacity:.28;cursor:default}",
    ".arc-add{width:100%;margin-top:4px;padding:12px;border-radius:15px;border:2px dashed rgba(255,255,255,.22);",
      "background:none;color:#cfc9f2;font:800 14px inherit;cursor:pointer}",
    ".arc-add:hover{border-color:rgba(255,255,255,.45);color:#fff}",
    ".arc-done{width:100%;margin-top:14px;padding:13px;border-radius:999px;border:0;cursor:pointer;",
      "font:900 15px inherit;color:#1a0a22;background:linear-gradient(135deg,#ffd166,#ff5fa2 60%,#8b5cf6)}",
    ".arc-note{font-size:12px;color:#8e88b8;margin-top:12px;text-align:center;font-weight:600}"
  ].join("");

  var cssDone = false;
  function styles() {
    if (cssDone || !doc.head) return;
    cssDone = true;
    var s = doc.createElement("style");
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  function chip(p, active) {
    var b = doc.createElement("button");
    b.type = "button";
    b.className = "arc-chip";
    b.style.setProperty("--arc-tint", tint(p));
    b.setAttribute("aria-pressed", active ? "true" : "false");
    b.innerHTML = '<span class="av">' + p.avatar + "</span><span><span class='who'>" +
      (active ? "Playing" : "Switch to") + "</span><span class='nm'></span></span>";
    b.querySelector(".nm").textContent = p.name;
    if (!active) b.addEventListener("click", function () { API.switchTo(p.id); });
    else b.addEventListener("click", function () { API.manage(); });
    return b;
  }

  /* A row of player chips — used on the landing page. */
  API.mountRow = function (host) {
    if (!host) return;
    styles();
    function draw() {
      host.innerHTML = "";
      host.className = "arc-row";
      var act = load().active;
      API.list().forEach(function (p) { host.appendChild(chip(p, p.id === act)); });
      var add = doc.createElement("button");
      add.type = "button";
      add.className = "arc-chip";
      add.style.setProperty("--arc-tint", "#8b5cf6");
      add.innerHTML = '<span class="av">＋</span><span><span class="who">Add</span><span class="nm">New player</span></span>';
      add.addEventListener("click", function () { API.add(); draw(); API.manage(draw); });
      host.appendChild(add);
    }
    draw();
    API.redraw = draw;
  };

  /* A "Playing as" section at the top of a game's Games dropdown. The menu is
     a plain white panel in every game, so these match its own link styling. */
  API.mountMenu = function (menu) {
    if (!menu) return;
    styles();
    var act = load().active, frag = doc.createDocumentFragment();

    var head = doc.createElement("b");
    head.textContent = "Playing as";
    frag.appendChild(head);

    API.list().forEach(function (p) {
      var a = doc.createElement("a");
      a.style.cursor = "pointer";
      a.textContent = p.avatar + " " + p.name;
      if (p.id === act) {
        a.style.cssText = "background:linear-gradient(90deg,#ffe8f4,#e6f0ff);color:#5b3fa8";
        a.addEventListener("click", function (e) { e.preventDefault(); menu.hidden = true; API.manage(); });
      } else {
        a.addEventListener("click", function (e) { e.preventDefault(); API.switchTo(p.id); });
      }
      frag.appendChild(a);
    });

    var mg = doc.createElement("a");
    mg.textContent = "👥 Players…";
    mg.style.cssText = "color:#6b7a94;cursor:pointer";
    mg.addEventListener("click", function (e) { e.preventDefault(); menu.hidden = true; API.manage(); });
    frag.appendChild(mg);

    menu.insertBefore(frag, menu.firstChild);
  };

  /* The manage card: rename, change avatar, add, delete, switch. */
  API.manage = function (after) {
    styles();
    var veil = doc.createElement("div");
    veil.className = "arc-veil";
    var card = doc.createElement("div");
    card.className = "arc-card";
    veil.appendChild(card);

    function close() {
      veil.remove();
      if (API.redraw) API.redraw();
      if (after) after();
    }

    function draw() {
      var act = load().active, only = load().players.length < 2;
      card.innerHTML = "<h2>Who's playing?</h2><p class='hint'>Each player gets their own saved worlds on this device — " +
        "your city, your house, your rescued pets. Tap a name to rename it, or the face to change it.</p>";

      API.list().forEach(function (p) {
        var row = doc.createElement("div");
        row.className = "arc-p" + (p.id === act ? " on" : "");
        row.style.setProperty("--arc-tint", tint(p));

        var av = doc.createElement("button");
        av.type = "button"; av.className = "av"; av.textContent = p.avatar;
        av.title = "Change face";
        av.addEventListener("click", function () {
          var all = API.avatars(), i = all.indexOf(p.avatar);
          API.setAvatar(p.id, all[(i + 1) % all.length]);
          av.textContent = p.avatar;
        });

        var nm = doc.createElement("input");
        nm.value = p.name; nm.maxLength = 14; nm.setAttribute("aria-label", "Player name");
        /* games listen on document for their own controls — keep typing here */
        ["keydown", "keyup", "keypress"].forEach(function (t) {
          nm.addEventListener(t, function (e) { e.stopPropagation(); });
        });
        nm.addEventListener("input", function () { API.rename(p.id, nm.value); });

        row.appendChild(av);
        row.appendChild(nm);

        if (p.id === act) {
          var now = doc.createElement("span");
          now.className = "now"; now.textContent = "Playing";
          row.appendChild(now);
        } else {
          var go = doc.createElement("button");
          go.type = "button"; go.className = "go"; go.textContent = "Play as";
          go.addEventListener("click", function () { API.switchTo(p.id); });
          row.appendChild(go);
        }

        var del = doc.createElement("button");
        del.type = "button"; del.className = "del"; del.textContent = "🗑";
        del.title = "Delete this player";
        del.disabled = only;
        del.addEventListener("click", function () {
          if (!global.confirm("Delete " + p.name + "? Their saved worlds in every game go too.")) return;
          API.destroy(p.id);
          draw();
        });
        row.appendChild(del);

        card.appendChild(row);
      });

      var add = doc.createElement("button");
      add.type = "button"; add.className = "arc-add"; add.textContent = "＋ Add a player";
      add.addEventListener("click", function () { API.add(); draw(); });
      card.appendChild(add);

      var done = doc.createElement("button");
      done.type = "button"; done.className = "arc-done"; done.textContent = "Done";
      done.addEventListener("click", close);
      card.appendChild(done);

      var note = doc.createElement("p");
      note.className = "arc-note";
      note.textContent = "Saved in this browser only — not shared between devices.";
      card.appendChild(note);
    }

    draw();
    veil.addEventListener("click", function (e) { if (e.target === veil) close(); });
    veil.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    doc.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); doc.removeEventListener("keydown", esc); }
    });
    (doc.body || doc.documentElement).appendChild(veil);
  };

  /* Wire the picker into whatever this page has: the landing page's row, and
     the Games dropdown that every game carries. */
  function wire() {
    API.mountRow(doc.getElementById("arcPlayers"));
    var menu = doc.getElementById("gamesMenu");
    if (menu && !doc.getElementById("arcPlayers")) API.mountMenu(menu);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", wire);
  else wire();

  global.Arcade = API;
})(window, document);
