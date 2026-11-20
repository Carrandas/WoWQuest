// Save files and upgrading old saves.
"use strict";

// saves from before the journal existed: fill in what we can
function migrate() {
  S.buffs = S.buffs || {}; S.cons = S.cons || { hp: 0, mp: 0, elix: 0, stone: 0 };
  if (S.cons.food == null) { S.cons.food = 10; S.cons.drink = cls().mp ? 10 : 0; }
  S.elites = S.elites || []; S.feats = S.feats || []; S.dstat = S.dstat || {};
  if (!S.zones) { S.zones = route().slice(0, S.leg + (S.arrived ? 1 : 0)).map(l => ({ z: l.z, old: 1, q: 0, k: 0 })); }
  S.dungeons.forEach(n => { const e = dungeonEntry(n); if (!e.runs) { e.runs = 1; e.old = 1; } });
  if (!S.ach) { S.ach = {}; checkAch(true); }
  ["band", "bomb", "feast", "flask"].forEach(k => S.cons[k] = S.cons[k] || 0);
  S.parts = S.parts || {}; S.legendaries = S.legendaries || []; S.lock = S.lock || {}; S.cd = S.cd || {}; S.runs = S.runs || 0; S.trip = S.trip || 0;
  // heroes from before professions pick up their class's pair, already on pace for their level
  if (!S.prof) { S.prof = newProf(PAIR_FOR[S.cls], S.level); if (S.prof.cap) log(`Picked up ${S.prof.a} and ${S.prof.b} (${S.prof.sk[S.prof.b]} / ${S.prof.cap}).`, "spell"); }
  S.prof.count = S.prof.count || {};
  // raid lockouts used to be a time; now they remember the kills (a saved raid was a full clear). Bosses of raids
  // already cleared count as killed (no first-kill penalty)
  for (const n in S.lock) if (typeof S.lock[n] === "number") S.lock[n] = { at: S.lock[n], killed: (instanceRow(n) || { bosses: [] }).bosses.length, last: S.lock[n] };
  // attunements came later: heroes already at 60 count as attuned
  if (S.runs60 == null) S.runs60 = S.level >= 60 ? 99 : 0;
  if (!S.bossKills) { S.bossKills = {}; RAIDS.filter(r => S.dungeons.includes(r.name)).forEach(r => r.bosses.forEach(b => S.bossKills[b] = 1)); }
  // pets used to be a buff; now they're the real thing (pets.js)
  if (S.pet === undefined) S.pet = null;
  if (!S.mounts) { S.mounts = {}; mountOwn(true); }
  S.rep = S.rep || {}; S.wintersaber = S.wintersaber || 0; if (S.wsToday === undefined) S.wsToday = null;
  S.goals = S.goals || []; S.goalsDone = S.goalsDone || {}; if (S.goalAuto === undefined) S.goalAuto = true;
  S.minipets = S.minipets || {}; S.oox = S.oox || []; if (S.companion === undefined) S.companion = null;
  S.demons = S.demons || {}; S.petStats = S.petStats || { tamed: 0, rares: [], summoned: [], infernal: 0, doom: 0 }; S.rareHunt = S.rareHunt || null;
  ["Call Pet", "Summon Imp", "Summon Voidwalker", "Summon Succubus", "Summon Felhunter"].forEach(n => delete S.buffs[n]);
  // profession achievements came later: the ones already earned are noted quietly instead of all at once
  if (!S.achProf) { S.achProf = 1; checkAch(true, "prof"); }
}

// ---------- save files: the same data as the browser save, as a download ----------
function exportSave() {
  save();
  const blob = new Blob([JSON.stringify(S)], { type: "application/json" });
  const a = document.createElement("a"), d = new Date(), pad = n => String(n).padStart(2, "0");
  a.href = URL.createObjectURL(blob);
  a.download = `WoWQuest-${S.name.replace(/[^\w-]+/g, "_")}-L${S.level}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Save file downloaded");
}
function pickSaveFile() {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = ".json,application/json";
  inp.onchange = () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let data = null;
      try { data = JSON.parse(r.result); } catch (e) {}
      if (!data || typeof data !== "object" || !data.name || !CLASSES[data.cls] || !RACES[data.race] || !(data.level >= 1) || !Array.isArray(data.queue)) { toast("That isn't a WoWQuest save file"); return; }
      confirmLoad(data);
    };
    r.readAsText(f);
  };
  inp.click();
}
// a yes/no dialog: title and text are HTML (escape names first); clicking outside or "no" closes it
function confirmBox(title, text, no, yes, onYes) {
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">${title}</h3><p>${text}</p>`
    + `<div class="acts"><button type="button" class="ghost" id="mNo">${no}</button><button type="button" class="danger" id="mYes">${yes}</button></div></div>`;
  document.body.appendChild(m);
  $("mNo").focus();
  $("mNo").onclick = () => m.remove();
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  $("mYes").onclick = () => { m.remove(); onYes(); };
}
function confirmLoad(data) {
  const what = `level ${data.level} ${esc(data.race)} ${esc(data.cls.toLowerCase())}`;
  const replaces = S ? `. This replaces ${esc(S.name)} (level ${S.level}) in this browser, so save them to a file first if you want to keep them` : "";
  confirmBox(`Load ${esc(data.name)}?`, `Loads ${esc(data.name)}, a ${what}${replaces}.`, "Cancel", "Load save",
    () => { S = data; migrate(); S.savedAt = Date.now(); save(); startGame(); toast(`Loaded ${S.name}`); });
}
function confirmRetire() {
  confirmBox(`Delete ${esc(S.name)}?`, `This deletes your level ${S.level} ${esc(S.cls.toLowerCase())} and all progress. A new character starts at level 1.`, "Keep playing", "Delete character",
    () => { wipe(); S = null; showCreate(); });
}
