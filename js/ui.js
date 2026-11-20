// Rendering the game: the page, bars, lists, the enemy frame, group frames, damage meter and journal tabs.
"use strict";

// ---------- rendering: game ----------

const SPEEDS = [1, 10, 100, 1000];
// pieces of the page: a collapse button, a progress meter (top row), a health or resource bar, a unit frame
const foldBtn = (k, what) => `<button type="button" class="fold" data-fold="${k}" aria-expanded="true" aria-label="Collapse ${what}" title="Collapse"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>`;
const progMeter = (cls, p, label, lblId) => `<div class="meter ${cls}"><div class="top"><span class="lbl"${lblId ? ` id="${lblId}"` : ""}>${label}</span><span class="val" id="${p}V"></span></div><div class="name" id="${p}N"></div><div class="bar"><i id="${p}B"></i></div></div>`;
const poolBar = (p, label, lblId) => `<div class="meter"><div class="top"><span class="lbl"${lblId ? ` id="${lblId}"` : ""}>${label}</span><span class="val" id="${p}V"></span></div><div class="bar"><i id="${p}B"></i></div></div>`;
// u: the id prefixes for name, subtitle, health, resource (and its label), casts
const unitFrame = (cls, u) => `<div class="unit${cls ? " " + cls : ""}"><div class="who"><h1 id="${u.name}"></h1><span class="sub" id="${u.sub}"></span></div>
          <div class="pools">${poolBar(u.hp, "health")}
          ${poolBar(u.res, u.resLabel, u.res + "L")}</div>
          <div class="casts" id="${u.casts}"></div></div>`;

function gameShell() {
  $("app").innerHTML = `
  <div class="topbar">
    <div class="brand" id="brand">WoWQuest</div>
    <div class="controls">
      <span class="speedbox" id="speedbox" ${dev ? "" : "hidden"}><span class="lbl">speed</span>
        <div class="seg" id="speed">${SPEEDS.map(n => `<button type="button" data-s="${n}" aria-pressed="false">${n}×</button>`).join("")}</div></span>
      <button type="button" class="ghost" id="exportSave" title="Download your save as a file">Save file</button>
      <button type="button" class="ghost" id="importSave" title="Load a save file">Load file</button>
      <button type="button" class="ghost" id="retire">New character</button>
      <span class="saved" id="saved"></span>
    </div>
  </div>
  <section class="meters" data-fold-box="meters">${foldBtn("meters", "progress")}
    ${progMeter("m-xp", "xp", "experience", "xpL")}
    ${progMeter("m-zone", "z", "zone", "zL")}
    ${progMeter("m-quest", "q", "quest")}
  </section>
  <section class="now">
    <div class="lbl" id="tWhere"></div>
    <div class="desc" id="tDesc"></div>
    <div class="bigbar"><div class="fill" id="tFill"></div><div class="pct" id="tPct"></div></div>
  </section>
  <section class="group" id="group" hidden><div class="ghead" data-fold-box="group"><h2 id="gTitle">Group</h2>${foldBtn("group", "group frames")}</div><div class="gcards" id="gcards"></div>
    <div class="dmeter" data-fold-box="meter"><div class="dmh"><span class="lbl">Damage meter</span><small id="dmNote"></small>
      <div class="seg" id="dmMode"><button type="button" data-m="dmg">Damage</button><button type="button" data-m="heal">Healing</button></div>
      <div class="seg" id="dmScope"><button type="button" data-s="fight">This fight</button><button type="button" data-s="run">Whole run</button></div>${foldBtn("meter", "damage meter")}</div>
      <ol class="dmrows" id="dmRows"></ol></div></section>
  <section class="main">
    <div class="col">
      <div class="sec">
        ${unitFrame("hero", { name: "hName", sub: "hSub", hp: "hp", res: "mp", resLabel: "mana", casts: "tCasts" })}
        <ul class="adds petf" id="petf" hidden></ul>
        <div class="tabs ctabs" role="tablist" id="ctabs">${CTABS.map(([k, n]) => `<button type="button" role="tab" data-c="${k}" aria-selected="${k === charTab}" aria-label="${n}" title="${n}">${tabIcon(k)}<span class="tl">${n}</span></button>`).join("")}</div>
        <div class="cpane" data-c="char"><div class="stats" id="stats"></div>
        <ul class="rows vitals" id="vitals"></ul>
        <h3 class="paneh">Buffs <small id="bCount"></small></h3><ul class="rows" id="buffs"></ul></div>
        <div class="cpane" data-c="equip"><div class="tabmeta"><small id="gs"></small></div><ul class="rows" id="equip"></ul></div>
        <div class="cpane" data-c="bags"><div class="tabmeta"><small id="money"></small></div>
          <h3 class="paneh">Supplies</h3><ul class="rows" id="supplies"></ul>
          <h3 class="paneh">Bags</h3><ul class="rows" id="bags"></ul></div>
        <div class="cpane" data-c="tal"><div class="tabmeta"><small id="talPts"></small></div><div class="talsum" id="talSum"></div><div class="seg ttabs" id="talTabs"></div><ul class="tal" id="tal"></ul></div>
        <div class="cpane" data-c="spells"><div class="tabmeta"><small id="spCount"></small></div><ul class="rows" id="spells"></ul></div>
        <div class="cpane" data-c="prof"><div class="tabmeta"><small id="profMeta"></small></div><ul class="rows profs" id="profs"></ul>
          <h3 class="paneh">Totals</h3><ul class="rows vitals" id="pTotals"></ul>
          <h3 class="paneh">Materials</h3><ul class="rows" id="mats"></ul>
          <h3 class="paneh">Recent crafts</h3><ul class="rows" id="crafts"></ul></div>
      </div>
    </div>
    <div class="col c-log">
      <div class="chron sec">
        <div class="tabs" role="tablist" id="tabs">${TABS.map(([k, n]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === uiTab}" aria-label="${n}" title="${n}">${tabIcon(k)}<span class="tl">${n}</span><small id="tab-${k}"></small></button>`).join("")}</div>
        <div class="tabmeta"><small id="elapsed"></small></div>
        <ul class="log" id="log"></ul><ul class="journal" id="journal" hidden></ul><ul class="rows quests" id="quests" hidden></ul>
      </div>
    </div>
    <div class="col c-foe">
      <div class="sec foe idle" id="foe">
        ${unitFrame("", { name: "eName", sub: "eSub", hp: "eHp", res: "eMp", resLabel: "resource", casts: "eCasts" })}
        <ul class="adds" id="eAdds"></ul>
        <div class="edetail"><ul class="rows vitals" id="eInfo"></ul><h3 class="paneh">Abilities</h3><ul class="chips" id="eAbil"></ul></div>
      </div>
    </div>
  </section>`;
  onButton("speed", b => { speed = S.speed = +b.dataset.s; renderSpeed(); });
  $("retire").addEventListener("click", confirmRetire);
  $("exportSave").addEventListener("click", exportSave);
  $("importSave").addEventListener("click", pickSaveFile);
  onButton("tabs", b => { uiTab = b.dataset.t; document.querySelectorAll("#tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b))); dirty = true; });
  onButton("ctabs", b => { charTab = b.dataset.c; renderCharTab(); });
  onButton("quests", goalClick);
  $("brand").addEventListener("click", brandTap);
  onButton("talTabs", b => { talTab = +b.dataset.tt; renderTalents(); });
  document.querySelectorAll(".fold").forEach(b => b.addEventListener("click", () => toggleFold(b.dataset.fold)));
  renderFolds();
  onButton("dmMode", b => { dmMode = b.dataset.m; renderMeter(true); });
  onButton("dmScope", b => { dmScope = b.dataset.s; renderMeter(true); });
  renderSpeed(); renderCharTab();
}
// collapsible boxes (progress meters, group frames, damage meter), remembered in this browser
const FOLD_KEY = "wowquest-fold";
let folds = {};
try { folds = JSON.parse(localStorage.getItem(FOLD_KEY) || "{}") || {}; } catch (e) {}
function renderFolds() {
  document.querySelectorAll("[data-fold-box]").forEach(el => {
    const k = el.dataset.foldBox, shut = !!folds[k], box = k === "group" ? el.parentNode : el, b = el.querySelector(`.fold[data-fold="${k}"]`);
    box.classList.toggle("folded", shut); box.classList.toggle("fold-" + k, true);
    if (b) { b.setAttribute("aria-expanded", String(!shut)); b.title = shut ? "Expand" : "Collapse"; b.setAttribute("aria-label", b.getAttribute("aria-label").replace(/^(Collapse|Expand)/, shut ? "Expand" : "Collapse")); }
  });
}
function toggleFold(k) {
  folds[k] = !folds[k];
  try { localStorage.setItem(FOLD_KEY, JSON.stringify(folds)); } catch (e) {}
  renderFolds();
}
// tab icons, shown instead of the names on a phone
const TAB_ICONS = {
  char: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  equip: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  bags: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  tal: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  spells: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/><path d="M12 7l1 2.2 2.2 1-2.2 1L12 13.4l-1-2.2-2.2-1 2.2-1z"/>',
  log: '<path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7"/><path d="M7 3a2 2 0 0 0-2 2v2h4V5a2 2 0 0 0-2-2z"/><path d="M10 9h6M10 13h6M10 17h4"/>',
  quests: '<path d="M12 4v10"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/>',
  ach: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 21h6M10 17h4"/>',
  zones: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  coll: '<circle cx="7" cy="9" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="9" r="2"/><path d="M8 18c0-3 1.8-5 4-5s4 2 4 5c0 1.5-1.5 2-4 2s-4-.5-4-2z"/>',
  dung: '<path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-5a3 3 0 0 1 6 0v5"/>',
  prof: '<path d="M14.5 4.5l5 5-2 2-5-5z"/><path d="M13.5 7.5L4 17l3 3 9.5-9.5"/><path d="M3 21h7"/>',
};
const tabIcon = k => `<svg class="ti" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[k] || ""}</svg>`;
// character panel tabs: character, equipment, bags (with supplies), talents, spellbook
const CTABS = [["char", "Character"], ["equip", "Gear"], ["bags", "Bags"], ["tal", "Talents"], ["spells", "Spells"], ["prof", "Professions"]];
let charTab = "char";
function renderCharTab() {
  document.querySelectorAll("#ctabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.c === charTab)));
  document.querySelectorAll(".cpane").forEach(p => p.hidden = p.dataset.c !== charTab);
}
function renderSpeed() { document.querySelectorAll("#speed button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.s === speed))); }

// tap the logo five times quickly to reveal (or hide) the speed controls
let taps = 0, tapTimer = 0;
function brandTap() {
  taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => taps = 0, 1500);
  if (taps >= 2 && taps < 5) toast(`${5 - taps} more…`);
  if (taps < 5) return;
  taps = 0; dev = !dev;
  try { localStorage.setItem(DEV_KEY, dev ? "1" : "0"); } catch (e) {}
  if (!dev && S) { speed = S.speed = 1; renderSpeed(); }
  $("speedbox").hidden = !dev;
  toast(dev ? "Speed controls unlocked" : "Speed controls hidden");
}
let toastTimer = 0;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 1400);
}

// floating numbers: red for damage, green for healing, on whoever's health just changed in a fight
const bubPrev = {};
function bubble(key, el, val, max, fight) {
  const prev = bubPrev[key]; bubPrev[key] = val;
  if (!fight || prev == null || !el) return;
  const d = Math.round((val - prev) * max);
  if (!d || Math.abs(d) < max * 0.004) return;
  floatText(el, d > 0 ? "up" : "dn", (d > 0 ? "+" : "−") + Math.abs(d).toLocaleString(), 25 + Math.random() * 50);
}
function xpBubble(el, n) {
  floatText(el, "up xp", "+" + n.toLocaleString() + " xp", 55 + Math.random() * 30);
}
// a number that floats up from an element and fades (left: % across it)
function floatText(el, cls, text, left) {
  const b = document.createElement("span"); b.className = "bub " + cls;
  b.textContent = text; b.style.left = left + "%";
  el.appendChild(b); setTimeout(() => b.remove(), 1300);
}
const memberMax = (c, L) => CLASSES[c].hp * L + (20 + 2 * L) * 10;
// health bar colour, same as the hero's: green, yellow, orange, red
const resCol = res => res === "Mana" ? "var(--mana)" : res === "Rage" ? "var(--rage)" : "var(--energy)";
const hpCol = f => f > 0.6 ? "var(--hp-ok)" : f > 0.35 ? "var(--hp-mid)" : f > 0.15 ? "var(--hp-low)" : "var(--hp-crit)";
// the enemy frame mirrors the hero's: name, health, resource, what it's doing; the rest of the pack below
const FOE_RANK = { elite: "Elite", boss: "Boss", "raid elite": "Elite", "raid boss": "Boss" };
let foeSig = "", foeMain = -1, foeHtml = {};
const setHtml = (id, h) => { if (foeHtml[id] !== h) { foeHtml[id] = h; $(id).innerHTML = h; } };
function renderFoe() {
  const t = S.task, f = foeOf(t), box = $("foe");
  if (!f) {
    if (foeSig !== "idle") { foeSig = "idle"; foeMain = -1; box.classList.add("idle"); box.classList.remove("elite", "boss");
      $("eHpB").style.width = "0%"; $("eMpB").style.width = "0%"; $("eHpV").textContent = ""; $("eMpV").textContent = ""; $("eMpL").textContent = "resource"; }
    setHtml("eName", "No target"); setHtml("eSub", esc(foeIdle())); setHtml("eCasts", ""); setHtml("eAdds", ""); setHtml("eAbil", ""); setHtml("eInfo", "");
    return;
  }
  const n = f.w.length, k = Math.floor(taskDone(t) * n), st = f.units.map(u => foeAt(f, u, k));
  let mi = f.units.findIndex(u => (u.segs || []).some(g => k >= g.a && k < g.b));
  if (mi < 0 || !st[mi].alive) mi = st.findIndex(s => s.alive && !s.hidden); if (mi < 0) mi = f.units.length - 1;
  const sig = t.d + "|" + t.t;
  if (sig !== foeSig) {
    foeSig = sig; foeMain = -1; box.classList.remove("idle");
    $("eAdds").dataset.n = f.units.length;
  }
  const u = f.units[mi], s = st[mi];
  if (mi !== foeMain) {
    foeMain = mi;
    box.classList.toggle("elite", u.rank === "elite" || u.rank === "raid elite"); box.classList.toggle("boss", /boss/.test(u.rank));
    setHtml("eName", esc(u.name));
    setHtml("eSub", `Level <b>${u.rank === "raid boss" ? "??" : u.L}</b> ${FOE_RANK[u.rank] ? `<b class="rank">${FOE_RANK[u.rank]}</b> ` : ""}${u.kind}`);
    $("eMpL").textContent = u.res.toLowerCase(); $("eMpB").style.background = resCol(u.res);
    const p = foePool(u.name, u.kind, u.rank), ab = [...new Set([...p.open, ...p.fill, ...p.extra, p.end, ...(u.phases || []).flatMap(x => x.pool || [])])];
    setHtml("eAbil", ab.map(a => `<li>${esc(a)}</li>`).join(""));
  }
  bubble("e" + foeSig + "|" + mi, box.querySelector(".unit"), s.hp, u.max, true);
  const hpNow = Math.round(s.hp * u.max);
  $("eHpV").textContent = `${hpNow.toLocaleString()} / ${u.max.toLocaleString()}`;
  $("eHpB").style.width = (s.hp * 100).toFixed(1) + "%"; $("eHpB").style.background = hpCol(s.hp);
  $("eMpV").textContent = u.res === "Mana" ? `${s.res}%` : `${s.res} / 100`; $("eMpB").style.width = s.res + "%";
  const from = Math.max(u.spawn || 0, s.ci - 3), acts = s.alive ? u.acts.slice(from, s.ci + 1) : [];
  setHtml("eCasts", s.alive ? (from > (u.spawn || 0) ? "… › " : "") + acts.map((a, i) => `<span${i + from === s.ci ? ' class="cur"' : ""}>${esc(a)}</span>`).join(" › ") : '<span class="dead">dead</span>');
  setHtml("eAdds", f.units.length > 1 ? f.units.map((x, i) => i === mi || !st[i].present ? "" : `<li class="${st[i].alive ? "" : "dead"}"><div class="an"><span>${esc(x.name)}</span><small>${st[i].alive ? esc(st[i].act) : "dead"}</small></div><div class="gbar thin"><i style="width:${(st[i].hp * 100).toFixed(1)}%;background:${hpCol(st[i].hp)}"></i></div></li>`).join("") : "");
  const left = st.filter(x => x.alive).length, seen = st.filter(x => x.present).length, bi = f.units.findIndex(x => x.phases), ph = bi >= 0 ? st[bi].phase : null;
  setHtml("eInfo", [ph ? ["phase", esc(ph.label)] : null, ["target", esc(petHolding(f, k) ? S.pet.name : foeTarget())], seen > 1 ? ["pack", `${left} of ${seen} standing`] : null, ["health", u.max.toLocaleString()]]
    .filter(Boolean).map(([a, b]) => `<li><span class="k">${a}</span><span class="v">${b}</span></li>`).join(""));
}

// ---------- damage meter (dungeons and raids) ----------
// who did how much of the damage dealt to the enemies: dps the bulk, tanks some, healers a little,
// scaled by gear and level, with some luck per pull. Healing comes straight from the heals that landed
const DM_ROLE = { dps: 1, tank: 0.3, heal: 0.04 };
const DMF = new WeakMap();
function meterFight(t) {
  if (!t || !S.party || !(t.k === "trash" || t.k === "boss")) return null;
  let m = DMF.get(t); if (m) return m;
  const pf = partyFight(t); if (!pf || !pf.hero || !foeOf(t)) return null;
  // your gear against theirs: both measured as gear for the level, so being over- or undergeared shows
  const P = [pf.hero, ...pf.m], all = [{ role: heroRole(), L: S.level, gear: clamp(gearScore() / Math.max(1, S.level), 0.5, 2) * talMod("d") }, ...S.party.map(x => ({ role: x.role, L: x.L, gear: x.gear ?? (x.gear = contentGear()) }))];
  if ((t.cds || []).some(c => c.type === "burst")) all[0].gear *= 1.2;
  const w = all.map(a => (DM_ROLE[a.role] || 0.5) * a.gear * (a.L / Math.max(1, S.level)) * (0.85 + Math.random() * 0.3)), ws = w.reduce((a, b) => a + b, 0) || 1;
  if (S.pet) { const ps = petShare(); w.push(w[0] * ps); w[0] *= 1 - ps; } // the pet's damage is its share of the hero's
  m = { share: w.map(x => x / ws), heal: P.map(p => p.healEv || []) };
  DMF.set(t, m); return m;
}
// damage and healing so far in a pull (raw = how far through it is, 0..1), per group member
function meterNow(t, raw) {
  const m = meterFight(t); if (!m) return null;
  const f = foeOf(t), k = Math.floor(raw * f.w.length);
  const total = f.units.reduce((a, u) => a + Math.max(0, 1 - foeAt(f, u, k).hp) * u.max, 0);
  return { dmg: m.share.map(s => s * total), heal: m.heal.map(ev => ev.reduce((a, e) => a + (e.at <= raw + 1e-9 ? e.amt : 0), 0)), secs: raw * t.t / 1000 / SPAN(S.level) };
}
// the run's totals (saves from before the meter existed start one mid-run)
const meterRun = () => S.meter || (S.dg && S.party ? (S.meter = { dn: S.dg.name, dmg: [], heal: [], secs: 0, last: null }) : null);
// a finished pull goes into the run's totals
function meterFinish(t) {
  const M = meterRun(), mn = M && meterNow(t, 1); if (!mn) return;
  mn.dmg.forEach((v, i) => M.dmg[i] = (M.dmg[i] || 0) + v);
  mn.heal.forEach((v, i) => M.heal[i] = (M.heal[i] || 0) + v);
  M.secs += mn.secs; M.last = { dmg: mn.dmg.map(Math.round), heal: mn.heal.map(Math.round), secs: mn.secs, what: t.boss || "trash" };
}
// a darker shade of a class colour (the stripes on a pet's part of the meter bar)
const shade = c => "#" + c.slice(1).match(/../g).map(h => Math.round(parseInt(h, 16) * 0.55).toString(16).padStart(2, "0")).join("");
const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(2) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "k" : Math.round(n).toLocaleString();
let dmMode = "dmg", dmScope = "fight", dmTick = 0;
function renderMeter(force) {
  if (!force && ++dmTick % 8) return; // a few times a second is plenty (the first call after the frames appear always draws)
  const M = meterRun(), t = S.task, live = t ? meterNow(t, taskDone(t)) : null;
  document.querySelectorAll("#dmMode button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === dmMode)));
  document.querySelectorAll("#dmScope button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === dmScope)));
  if (!M || !S.party) { setHtml("dmRows", ""); return; }
  const all = [{ name: S.name, cls: S.cls, me: true }, ...S.party.map(x => ({ name: x.name, cls: x.cls })), ...(S.pet ? [{ name: S.pet.name + " (pet)", cls: S.cls }] : [])];
  let vals, secs, what;
  if (dmScope === "fight") {
    const src = live || M.last;
    if (!src) { setHtml("dmNote", ""); setHtml("dmRows", '<li class="dmempty">No pulls yet</li>'); return; }
    vals = src[dmMode]; secs = src.secs; what = live ? (t.boss || "this pack") : M.last.what === "trash" ? "last pack" : M.last.what;
  } else {
    vals = all.map((_, i) => (M[dmMode][i] || 0) + (live ? live[dmMode][i] : 0)); secs = M.secs + (live ? live.secs : 0); what = M.dn;
  }
  // a pet's damage goes on its owner's bar: the owner's part solid, the pet's part striped
  const rows = all.map((a, i) => ({ ...a, v: vals[i] || 0 }));
  if (S.pet) { const p = rows.pop(); rows[0].pet = p.v; rows[0].v += p.v; }
  rows.sort((a, b) => b.v - a.v);
  const top = rows[0].v || 1, sum = rows.reduce((s, r) => s + r.v, 0);
  rows.forEach((r, i) => r.rank = i + 1);
  const shown = rows.slice(0, 10), me = rows.find(r => r.me);
  if (me.rank > 10) shown.push(me);
  setHtml("dmNote", `${esc(what)} · ${fmtN(sum)} ${dmMode === "dmg" ? "damage" : "healing"} in ${Math.max(1, Math.round(secs))}s`);
  setHtml("dmRows", shown.map(r => { const c = CLASSES[r.cls].color, own = r.pet ? (r.v - r.pet) / (r.v || 1) * 100 : 100;
    const bg = r.pet ? `linear-gradient(90deg, ${c} 0 ${own.toFixed(1)}%, transparent ${own.toFixed(1)}%), repeating-linear-gradient(-45deg, ${c} 0 4px, ${shade(c)} 4px 8px)` : c;
    return `<li class="${r.me ? "me" : ""}"${r.pet ? ` title="${esc(S.name)} ${fmtN(r.v - r.pet)} · ${esc(S.pet.name)} ${fmtN(r.pet)}"` : ""}><i style="width:${(r.v / top * 100).toFixed(1)}%;background:${bg}"></i><span class="dmn"><b>${r.rank}</b> <span style="color:${c}">${esc(r.name)}</span>${r.pet ? ` <small class="dmpet">+ ${esc(S.pet.name)}</small>` : ""}</span><span class="dmv">${fmtN(r.v)} · ${fmtN(secs > 0 ? r.v / secs : 0)} ${dmMode === "dmg" ? "dps" : "hps"}</span></li>`; }).join(""));
}

// where the hero is right now, shown above the current task
function where() {
  if (S.loc === "dungeon" && S.dg) return S.dg.name;
  if (S.loc === "city") return S.level < 10 ? hub() : city();
  if (!S.arrived) return "On the road";
  return S.loc === "hub" ? `${hub()}, ${S.arrived}` : S.arrived;
}
// the level 60 goal: clear every raid once (the current first clear counts boss by boss)
function raidGoal() {
  const left = RAIDS.filter(r => !S.dungeons.includes(r.name)), done = RAIDS.length - left.length;
  const cur = S.dg && S.dg.raid && left.some(r => r.name === S.dg.name) ? S.dg : null;
  // next raid plus the next boss to kill in it (bosses fall in list order)
  const r = cur ? left.find(x => x.name === cur.name) : left[0], bosses = r ? r.bosses : [], k = cur ? cur.killed : 0;
  return { name: r ? `Next: ${r.name} – ${k < bosses.length ? bosses[k] : "cleared"}` : "Every raid cleared", val: `${done} / ${RAIDS.length} raids`,
    p: (done + (cur ? cur.killed / cur.total : 0)) / RAIDS.length };
}
// the quest meter: a dungeon or raid quest inside an instance, otherwise the current zone quest
function questMeter() {
  const dq = S.dg && S.dq && S.dq.length ? S.dq.find(x => !x.done) || S.dq[S.dq.length - 1] : null;
  if (dq) return { name: dq.name, val: `${dq.done ? 1 : 0} / 1`, p: dq.done ? 1 : 0 };
  const q = S.quests.find(x => x.id === S.curQ);
  return q ? { name: q.name, val: `${q.prog} / ${q.max}`, p: q.prog / q.max } : null;
}
function legInfo() {
  const r = route();
  if (S.leg >= r.length) return { name: `Endgame · ${curZone()}`, val: `${Math.min(S.cycleQ, 8)} / 8 quests`, p: Math.min(1, S.cycleQ / 8) };
  const start = S.leg ? r[S.leg - 1].until : 1, end = r[S.leg].until, lv = S.level + S.xp / xpNeed(S.level);
  return { name: `${r[S.leg].z} (${ZONES[r[S.leg].z].min}–${ZONES[r[S.leg].z].max})`, val: `until level ${end}`, p: clamp((lv - start) / Math.max(1, end - start), 0, 1) };
}

let lastLogId = 0;
// redraws everything that changes when something happens (when dirty): one function per part of the page
function renderLists() {
  renderHero(); renderGear(); renderProfs(); renderTalents(); renderSpells(); renderBags(); renderQuests(); renderJournal(); renderLog(); renderMeterNames();
}
// the character tab: name, stats, money and counts, buffs
function renderHero() {
  const c = cls();
  $("hName").textContent = S.name; $("hName").style.color = c.color;
  $("tWhere").textContent = where();
  $("hSub").innerHTML = `Level <b>${S.level}</b> ${esc(S.race)} <b style="color:${c.color}">${esc(S.cls)}</b> · ${esc(c.trees[S.spec])}`;
  $("stats").innerHTML = STATS.map(k => `<div class="stat ${k === mainStat() ? "prime" : ""}"><span class="lbl">${k}</span><b>${S.stats[k]}</b></div>`).join("");
  $("vitals").innerHTML = [
    ["money", money(S.money)],
    ["mount", S.mount ? esc(rideName()) : S.level >= 40 ? "saving up…" : "on foot until 40"],
    ...(S.companion ? [["companion", esc(S.companion)]] : []), ["kills", S.kills.toLocaleString()], ["quests done", S.qdone.toLocaleString()], ["deaths", S.deaths.toLocaleString()], ...spentRow(),
  ].map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${v}</span></li>`).join("");
  const act = activeBuffs();
  $("bCount").textContent = `${act.length} active`;
  $("buffs").innerHTML = act.map(n => { const left = S.buffs[n] - S.time; return `<li><span class="l buff">${esc(n)}</span><span class="rank">${left > 1e13 ? "" : Math.max(1, Math.ceil(left / MIN)) + " min"}</span></li>`; }).join("") || `<li><span class="empty">none right now</span></li>`;
}
function renderGear() {
  $("gs").textContent = `avg item level ${Math.round(SLOTS.reduce((a, s) => a + (S.equip[s] ? S.equip[s].ilvl : 0), 0) / SLOTS.length)}`;
  $("equip").innerHTML = SLOTS.map(s => { const it = S.equip[s]; return `<li><span class="k">${s.toLowerCase()}</span><span class="v">${it ? `<span class="q${it.q}">${esc(it.name)}</span><span class="ilvl">${it.ilvl}</span>${it.ench ? `<small class="ench">${esc(it.ench.name)}</small>` : ENCH[s] && it.q >= 2 && S.level >= 20 ? '<small class="ench no">not enchanted</small>' : ""}` : '<span class="empty">empty</span>'}</span></li>`; }).join("");
}
function renderSpells() {
  const c = cls();
  const known = c.list.filter(sp => spellName(sp.name) in S.spells).reverse();
  const tsp = talentSpells().filter(x => !known.some(sp => spellName(sp.name) === x.name));
  $("spCount").textContent = `${known.length + tsp.length} known`;
  $("spells").innerHTML = tsp.map(x => `<li><span class="l talent">${esc(x.name)}</span><span class="rank">talent</span></li>`).join("")
    + known.map(sp => { const n = spellName(sp.name), r = S.spells[n]; return `<li><span class="l">${esc(n)}</span><span class="rank">${sp.max > 1 ? "Rank " + r : ""}</span></li>`; }).join("") || `<li><span class="empty">nothing yet</span></li>`;
}
// the bags tab: supplies and loot to sell
function renderBags() {
  $("money").innerHTML = `${S.bags.length >= bagCap() ? '<span class="full">full</span> ' : ""}${S.bags.length} / ${bagCap()} slots · ${money(S.money)}`;
  const groups = groupBags();
  $("bags").innerHTML = groups.length ? groups.map(g => { const b = S.bags.find(x => x.name === g.name); return `<li><span class="l q${b.q}">${esc(g.name)}${g.n > 1 ? ` <span class="ilvl">×${g.n}</span>` : ""}</span></li>`; }).join("") : `<li><span class="empty">empty</span></li>`;
  const sup = [...restKinds().map(k => [k, rationName(k)]), ["hp", hpPot()], ["mp", cls().mp && S.level >= 5 ? mpPot() : null], ["elix", elixirName()], ["stone", usesStone() ? stoneName() : null], ["flask", flaskName()],
    ["band", profItem(BANDAGES, "First Aid")], ["feast", profItem(DISHES, "Cooking")], ["bomb", profItem(BOMBS, "Engineering")]].filter(x => x[1] && S.cons[x[0]] > 0);
  $("supplies").innerHTML = sup.map(([k, n]) => `<li><span class="l">${esc(n)}</span><span class="rank">×${S.cons[k]}</span></li>`).join("") || `<li><span class="empty">restocks in the capital</span></li>`;
}
function renderQuests() {
  const dqs = S.dq || [];
  $("tab-quests").textContent = ` ${S.quests.length + dqs.length}`;
  const qs = dqs.map(x => `<li><span class="l">${esc(x.name)} <span class="ilvl">(${x.raid ? "raid" : "dungeon"})</span><br><small style="color:var(--dim)">${esc(x.obj)} ${x.done ? 1 : 0}/1</small></span>${x.done ? '<span class="done">✓</span>' : ""}</li>`).concat(S.quests.map(q => `<li><span class="l ${q.id === S.curQ && !questDone(q) ? "cur" : ""}">${esc(q.name)}<br><small style="color:var(--dim)">${esc(questText(q))}</small></span>${questDone(q) ? '<span class="done">✓</span>' : ""}</li>`));
  $("quests").innerHTML = renderGoals() + (qs.join("") || `<li><span class="empty">no quests right now</span></li>`);
}
function renderLog() {
  $("log").innerHTML = S.log.map(l => `<li class="${l.k}${l.id > lastLogId && lastLogId ? " fresh" : ""}"><time>${fmtTime(l.t)}</time><span>${esc(l.txt)}</span></li>`).join("");
  lastLogId = S.log.length ? S.log[0].id : 0;
}
// the names on the three progress meters (their bars move in renderBars)
function renderMeterNames() {
  $("xpL").textContent = S.level >= 60 ? "raids" : "experience";
  $("xpN").textContent = S.level >= 60 ? raidGoal().name : `Level ${S.level} → ${S.level + 1}`; $("xpN").title = $("xpN").textContent;
  const qm = questMeter();
  $("qN").textContent = qm ? qm.name : "between quests"; $("qN").title = qm ? qm.name : "";
  document.querySelector(".m-quest").classList.toggle("idle", !qm);
  if (S.dg) { $("zL").textContent = S.dg.raid ? "raid" : "dungeon"; $("zN").textContent = S.dg.name; }
  else { const li = legInfo(); $("zL").textContent = "zone"; $("zN").textContent = li.name; }
}

function renderBars() {
  const t = S.task;
  if (t) { const p = taskDone(t); $("tDesc").textContent = t.d;
    const cs = t.casts || [], ci = Math.min(cs.length - 1, Math.floor(p * cs.length));
    const from = Math.max(0, ci - 5); $("tCasts").innerHTML = (from ? "… › " : "") + cs.slice(from, ci + 1).map((s, i) => `<span${i + from === ci ? ' class="cur"' : ""}>${esc(s)}</span>`).join(" › "); $("tFill").style.width = (p * 100).toFixed(1) + "%"; $("tPct").textContent = Math.floor(p * 100) + "%"; }
  const [hf, mf] = vitalsNow(), hm = hpMax();
  bubble("hero", document.querySelector(".unit.hero"), hf, hm, !!(t && FIGHTS.includes(t.k)));
  if (hf <= 0 && t && FIGHTS.includes(t.k)) $("tCasts").innerHTML = '<span class="dead">dead</span>';
  $("hpV").textContent = `${Math.round(hf * hm).toLocaleString()} / ${hm.toLocaleString()}`;
  $("hpB").style.width = (hf * 100).toFixed(1) + "%"; $("hpB").style.background = hpCol(hf);
  const res = cls().res; $("mpL").textContent = res.toLowerCase();
  if (cls().mp) { const mm = resMax(); $("mpV").textContent = `${Math.round(mf * mm).toLocaleString()} / ${mm.toLocaleString()}`; $("mpB").style.width = (mf * 100).toFixed(1) + "%"; $("mpB").style.background = resCol(res); }
  else { const v = secondPool(); $("mpV").textContent = `${v} / 100`; $("mpB").style.width = v + "%"; $("mpB").style.background = resCol(res); }
  const need = xpNeed(S.level);
  if (xpPop > 0) { const el = document.querySelector(".m-xp"); if (el) xpBubble(el, xpPop); xpPop = 0; }
  if (S.level >= 60) { const g = raidGoal(); $("xpV").textContent = g.val; $("xpB").style.width = (g.p * 100) + "%"; }
  else { $("xpV").textContent = `${S.xp.toLocaleString()} / ${need.toLocaleString()}`; $("xpB").style.width = (S.xp / need * 100) + "%"; }
  const qm = questMeter();
  $("qV").textContent = qm ? qm.val : ""; $("qB").style.width = (qm ? qm.p * 100 : 0) + "%";
  if (S.dg) { $("zV").textContent = `${S.dg.killed} / ${S.dg.total} bosses`; $("zB").style.width = (S.dg.killed / S.dg.total * 100) + "%"; }
  else { const li = legInfo(); $("zV").textContent = li.val; $("zB").style.width = (li.p * 100) + "%"; }
  renderGroup(hf, mf); renderFoe(); renderPet();
  if (uiTab === "log") $("elapsed").textContent = "/played " + fmtTime(S.time);
}

// gold spent this week, with where it went
function spentRow() {
  const w = S.spend; if (!w || w.wk !== Math.floor(S.time / WEEK)) return [];
  const parts = [["enchants", w.ench], ["supplies", w.sup], ["repairs", w.rep], ["materials", w.mats], ["gear", w.gear]].filter(x => x[1] > 0);
  const tot = parts.reduce((a, b) => a + b[1], 0); if (!tot) return [];
  return [["spent this week", `<span title="${parts.map(([k, v]) => k + " " + moneyTxt(v)).join(", ")}">${money(tot)}</span>`]];
}
// the professions tab: skill bars, materials, the last things made
function renderProfs() {
  const p = S.prof; if (!p) return;
  $("profMeta").textContent = p.cap ? pairLabel(p.pair) : "trainers teach professions from level 5";
  const c = k => profCount(k), gear = [[c("q2"), "green"], [c("q3"), "blue"], [c("q4"), "epic"]].filter(x => x[0]).map(([n, q]) => `${n} ${q}`).join(" · ");
  const totals = [
    ["crafted", p.made.toLocaleString()], ["gear crafted", gear],
    ...["Mining", "Herbalism", "Skinning"].filter(hasProf).map(n => [`${n.toLowerCase()} gathered`, c(n).toLocaleString()]),
    ["bags sewn", c("bags")], ["potions brewed", c("pots")], ["flasks made", c("flask")], ["disenchanted", c("de")],
    ["own gear enchanted", c("selfEnch")], ["bombs thrown", c("bombs")], ["bandages used", c("band")], ["meals eaten", c("meals")],
    ["sold on the AH", p.ah ? money(p.ah) : 0],
  ].filter(([k, v]) => v || k === "crafted");
  $("pTotals").innerHTML = totals.map(([k, v]) => `<li><span class="k">${k}</span><span class="v">${v}</span></li>`).join("");
  $("profs").innerHTML = [p.a, p.b, ...SECONDARY].map((n, i) => `<li class="prow${i > 1 ? " sec2" : ""}"><span class="l">${esc(n)}</span><span class="rank">${p.cap ? tierName(p.cap) : "untrained"}</span><span class="v">${p.sk[n]} / ${p.cap || 0}</span><div class="gbar thin"><i style="width:${(p.sk[n] / 300 * 100).toFixed(1)}%"></i><b style="left:${(p.cap / 300 * 100).toFixed(1)}%"></b></div></li>`).join("");
  const mats = Object.entries(p.mats).filter(x => x[1] > 0);
  $("mats").innerHTML = mats.map(([k, n]) => `<li><span class="l">${esc(k)}</span><span class="rank">×${n}</span></li>`).join("") || `<li><span class="empty">nothing gathered yet</span></li>`;
  $("crafts").innerHTML = p.recent.map(x => `<li><span class="l">${esc(x.n)}</span><span class="rank">level ${x.L}</span></li>`).join("") || `<li><span class="empty">nothing made yet</span></li>`;
}
// a group member's health, resource and cast lines (filled in by renderGroup's paint)
const memberBars = i => `<div class="gbar"><i id="gh${i}"></i><span id="ghv${i}"></span></div>
        <div class="gbar thin"><i id="gm${i}"></i><span id="gmv${i}"></span></div>
        <div class="gcast" id="gc${i}"></div>`;
// party / raid frames: the hero plus the companions
let gCache = {};
function renderGroup(hf, mf) {
  const show = !!(S.party && S.dg && S.dg.formed), box = $("group");
  if (box.hidden === show) box.hidden = !show;
  if (!show) return;
  const sig = S.party.map(m => m.name).join() + S.level;
  if (box.dataset.sig !== sig) {
    box.dataset.sig = sig; gCache = {}; dmTick = -1;
    const all = [{ name: S.name, race: S.race, cls: S.cls, role: heroRole(), L: S.level, me: true }, ...S.party], raid = all.length > 5;
    $("gTitle").innerHTML = raid ? `Raid <small>${esc(S.dg.name)} · ${all.length} players · ${all.filter(m => m.role === "tank").length} tanks, ${all.filter(m => m.role === "heal").length} healers</small><span class="legend"><span><i style="background:#4a7bd8"></i>tank</span><span><i style="background:#3fbf3f"></i>healer</span><span><i style="background:#c8312b"></i>dps</span></span>` : `Group <small>${esc(S.dg.name)}</small>`;
    box.classList.toggle("raid", raid);
    if (raid) {
      const groups = []; for (let g = 0; g * 5 < all.length; g++) groups.push(all.slice(g * 5, g * 5 + 5).map((m, k) => [m, g * 5 + k]));
      $("gcards").innerHTML = `<div class="rgroups" style="--ng:${groups.length}">${groups.map((g, gi) => `<div class="rgroup"><div class="rgh">Group ${gi + 1}</div>${g.map(([m, i]) => `<div class="rcell r-${m.role}${m.me ? " me" : ""}" title="${esc(m.name)}: level ${m.L} ${esc(m.race)} ${m.cls} (${ROLE_NAME[m.role]})">
        <div class="rname" style="color:${CLASSES[m.cls].color}">${esc(m.name)}</div>
        ${memberBars(i)}</div>`).join("")}</div>`).join("")}</div>`;
    } else
    $("gcards").innerHTML = all.map((m, i) => `<div class="gcard r-${m.role}${m.me ? " me" : ""}">
      <div class="gtop"><span class="gname" style="color:${CLASSES[m.cls].color}">${esc(m.name)}</span><span class="grole">${ROLE_NAME[m.role]}</span></div>
      <div class="gsub">Level ${m.L} ${esc(m.race)} ${m.cls}${m.me ? " · you" : ""}</div>
      ${memberBars(i)}</div>`).join("");
  }
  const paint = (i, c, hp, mp, fight, p, cast, L) => {
    bubble("g" + box.dataset.sig + "|" + i, $("gh" + i).closest(".gcard,.rcell"), hp, memberMax(c, L), fight);
    const C = CLASSES[c], v = C.mp ? Math.round(mp * 100) : pool2(C.res, fight, p), key = Math.round(hp * 1000) + "|" + v + "|" + cast;
    if (gCache[i] === key) return; gCache[i] = key;
    $("gh" + i).style.width = (hp * 100).toFixed(1) + "%"; $("gh" + i).style.background = hpCol(hp); $("ghv" + i).textContent = Math.round(hp * 100) + "%";
    $("gm" + i).style.width = v + "%"; $("gm" + i).style.background = resCol(C.res); $("gmv" + i).textContent = C.mp ? v + "%" : v;
    $("gc" + i).innerHTML = cast;
  };
  const raidUi = box.classList.contains("raid"), t = S.task, castHtml = (cs, ci) => ci < 0 ? "&nbsp;" : (ci > 0 && !raidUi ? `<span>${esc(cs[ci - 1])}</span> › ` : "") + `<span class="cur">${esc(cs[ci])}</span>`;
  const hc = t && t.casts && FIGHTS.includes(t.k) ? t.casts : [], hci = hc.length ? Math.min(hc.length - 1, Math.floor(taskDone(t) * hc.length)) : -1;
  const dead = '<span class="dead">dead</span>';
  paint(0, S.cls, hf, mf, hc.length > 0, t ? poolProgress(t) : 0, hf <= 0 && hc.length ? dead : castHtml(hc, hci), S.level);
  renderMeter();
  S.party.forEach((m, i) => { const n = memberNow(i); paint(i + 1, m.cls, n.hp, n.mp, n.fight, n.p, n.hp <= 0 && n.fight ? dead : castHtml(n.casts, n.ci), m.L); });
}

let rafId = 0, lastNow = 0, saveTimer = 0;
function loop(now) {
  const dt = Math.min(now - lastNow, 1000); lastNow = now;
  if (S) {
    advance(dt * speed);
    if (dirty) { renderLists(); dirty = false; }
    renderBars();
    saveTimer += dt;
    if (saveTimer > 5000) { saveTimer = 0; save(); setTimeout(() => { const el = $("saved"); if (el) el.textContent = ""; }, 1200); }
  }
  rafId = requestAnimationFrame(loop);
}
function startGame() {
  speed = dev ? (S.speed || 1) : 1;
  gameShell(); lastLogId = 0; dirty = true;
  cancelAnimationFrame(rafId); lastNow = performance.now(); rafId = requestAnimationFrame(loop);
}

// ---------- journal tabs: achievements, zones, dungeons ----------
const TABS = [["log", "Chronicle"], ["quests", "Quests"], ["ach", "Achievements"], ["zones", "Zones"], ["dung", "Dungeons"], ["coll", "Collection"]];
let uiTab = "log";
const fmtDate = t => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const shortPlayed = ms => { const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor(m / 60) % 24; return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m % 60}m`; };
const when = (at, L, p, pre) => at ? `${fmtDate(at)}${L ? " · level " + L : ""}${p != null ? " · " + shortPlayed(p) + " played" : ""}` : pre === "prof" ? "earned before profession achievements existed" : "earned before the journal existed";
function renderJournal() {
  const shown = ACH.filter(a => !a.show || a.show()), got = shown.filter(a => S.ach[a.id]);
  const r = route(), legs = [...new Set(r.map(l => l.z))], extra = S.zones.filter(e => !legs.includes(e.z));
  const doneZ = S.zones.filter(e => e.z !== S.arrived || S.leg >= r.length).length;
  const dl = factionDungeons().concat(RAIDS).sort((a, b) => a.min - b.min);
  $("tab-ach").textContent = ` ${got.length}`; // the totals are in the line under the tabs
  $("tab-zones").textContent = ` ${S.zones.length}`;
  $("tab-dung").textContent = ` ${dl.filter(d => S.dungeons.includes(d.name)).length}`;
  $("tab-coll").textContent = ` ${Object.keys(S.minipets).length + Object.keys(S.mounts).length}`;
  $("log").hidden = uiTab !== "log"; $("quests").hidden = uiTab !== "quests"; $("journal").hidden = uiTab === "log" || uiTab === "quests";
  $("elapsed").textContent = uiTab === "log" ? "/played " + fmtTime(S.time) : uiTab === "quests" ? `${S.level >= 60 ? `${S.goals.length} goals · ` : ""}${S.quests.length + (S.dq || []).length} active` : uiTab === "ach" ? `${got.length} of ${shown.length} earned` : uiTab === "zones" ? `${doneZ} zones done` : uiTab === "coll" ? `${Object.keys(S.mounts).length} mounts · ${Object.keys(S.minipets).length} minipets` : `${dl.filter(d => S.dungeons.includes(d.name)).length} of ${dl.length} cleared`;
  if (uiTab === "log" || uiTab === "quests") return;
  let h = "";
  if (uiTab === "ach") {
    // earned first (latest on top), then the ones still to get; professions and collections under their own headings
    const order = as => as.filter(a => S.ach[a.id]).sort((a, b) => (S.ach[b.id].p ?? -1) - (S.ach[a.id].p ?? -1)).concat(as.filter(a => !S.ach[a.id]));
    const row = a => { const e = S.ach[a.id]; return `<li class="${e ? "got" : "locked"}"><span class="ico">${e ? "★" : "☆"}</span><div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span>${e ? `<time>${when(e.at, e.L, e.p, e.pre)}</time>` : ""}</div></li>`; };
    const CATS = [["prof", "Professions"], ["coll", "Collections"]];
    h = order(shown.filter(a => !a.cat)).map(row).join("") + CATS.map(([c, title]) => {
      const as = shown.filter(a => a.cat === c);
      return as.length ? `<li class="jhead">${title} <small>${as.filter(a => S.ach[a.id]).length} of ${as.length}</small></li>` + order(as).map(row).join("") : "";
    }).join("");
  } else if (uiTab === "zones") {
    const row = (z, e, cur) => { const { min: a, max: b } = ZONES[z] || { min: 0, max: 0 };
      const st = cur ? "in progress" : e ? "done" : "ahead";
      const det = e ? (e.old ? "visited before the journal existed" : `level ${e.L0}${e.L1 > e.L0 ? "–" + e.L1 : ""} · ${e.q} quests · ${e.k.toLocaleString()} kills${e.t0 ? " · from " + fmtDate(e.t0) : ""}`) : `levels ${a}–${b}`;
      return `<li class="${st === "ahead" ? "locked" : st === "in progress" ? "cur" : "got"}"><span class="ico">${st === "done" ? "✓" : st === "in progress" ? "▸" : "·"}</span><div><b>${esc(z)}</b><span>${det}</span></div><em>${st}</em></li>`; };
    h = legs.map(z => row(z, S.zones.find(x => x.z === z), z === curZone() && S.leg < r.length)).join("")
      + extra.map(e => row(e.z, e, e.z === curZone())).join("");
  } else if (uiTab === "coll") {
    h = renderCollection();
  } else {
    h = dl.map(d => { const e = S.dstat[d.name], raid = RAIDS.includes(d), done = S.dungeons.includes(d.name) && e;
      const loot = done && e.loot.length ? `<span class="loot">${e.loot.map(x => `<i class="q${x.q}">${esc(x.n)}</i>`).join(", ")}</span>` : "";
      return `<li class="${done ? "got" : "locked"}"><span class="ico">${done ? "✓" : "·"}</span><div><b>${esc(d.name)}${raid ? ` (${RAID_INFO[d.name].size}-man raid)` : ""}</b><span>${done ? `cleared ${e.runs}× · ${e.old ? "first clear before the journal" : "first at level " + e.L + " on " + fmtDate(e.at)}${raid && raidLock(d.name) ? ` · saved (${raidKilled(d.name)}/${d.bosses.length}), resets in ${Math.ceil((RAID_INFO[d.name].lock * DAY - (S.time - raidLock(d.name).at)) / DAY)}d` : ""}` : `levels ${d.min}–${d.max}`}</span>${loot}</div></li>`; }).join("");
  }
  $("journal").innerHTML = h;
}
