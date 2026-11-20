// Mounts to collect: your own race's (and class mounts), the other races' at exalted with their capital (Runecloth
// turn-ins at 60), the Winterspring Frostsaber, and the rare drops: the Deathcharger, the Zul'Gurub raptor and tiger,
// the Qiraji battle tanks. The hero rides the best one it has.
"use strict";

const RUNECLOTH_EXALTED = 30;     // Runecloth turn-ins (20 cloth each, one every 12 hours of play) to reach exalted with a race
const WINTERSABER_EXALTED = 240;  // Wintersaber Trainers quests done in Winterspring to buy the Frostsaber (weeks of it)
// the reputation each race's mounts need (the trolls and gnomes have their own factions, not a capital)
const RACE_REP = { Human: "Stormwind", Dwarf: "Ironforge", "Night Elf": "Darnassus", Gnome: "Gnomeregan Exiles", Orc: "Orgrimmar", Undead: "Undercity", Tauren: "Thunder Bluff", Troll: "Darkspear Trolls" };
const RACE_MOUNT_COST = 80000, RACE_EPIC_COST = 100000; // another race's mount at exalted: 8g, the epic one 100g (with epic riding)
// rare drops: boss, mount, 1 in n (the tanks: one of the three colours, the red one much rarer)
const MOUNT_DROPS = [
  ["Baron Rivendare", "Deathcharger's Reins", 100], ["Bloodlord Mandokir", "Swift Razzashi Raptor", 100], ["High Priest Thekal", "Swift Zulian Tiger", 100],
];
const QIRAJI = ["Blue Qiraji Battle Tank", "Green Qiraji Battle Tank", "Yellow Qiraji Battle Tank"], RED_QIRAJI = "Red Qiraji Battle Tank";
const otherRaces = () => Object.keys(RACES).filter(r => RACES[r].f === S.faction && r !== S.race);
// every mount this hero could collect: { name, epic, where }
function mountList() {
  const r = race(), out = [{ name: r.mount, epic: false, where: `Riding trainer in ${r.city}, from level 40 (90g)` }, { name: r.epic, epic: true, where: `Epic riding in ${r.city}, at 60 (1000g)` }];
  if (S.cls === "Paladin") out.push({ name: "Warhorse", epic: false, where: "Paladin class mount, level 40" }, { name: "Charger", epic: true, where: "Paladin class quest, level 60" });
  if (S.cls === "Warlock") out.push({ name: "Felsteed", epic: false, where: "Warlock class mount, level 40" }, { name: "Dreadsteed", epic: true, where: "Warlock class quest, level 60" });
  otherRaces().forEach(o => { const c = RACE_REP[o];
    out.push({ name: RACES[o].mount, epic: false, where: `Exalted with ${c} (Runecloth turn-ins at 60)`, rep: c }, { name: RACES[o].epic, epic: true, where: `Exalted with ${c}, with epic riding`, rep: c }); });
  if (S.faction === "Alliance") out.push({ name: "Winterspring Frostsaber", epic: true, rare: true, where: "Exalted with the Wintersaber Trainers (Winterspring quests at 60)" });
  MOUNT_DROPS.forEach(([boss, name]) => out.push({ name, epic: true, rare: true, where: `A rare drop from ${boss} (${boss === "Baron Rivendare" ? "Stratholme" : "Zul'Gurub"})` }));
  QIRAJI.forEach(name => out.push({ name, epic: true, where: "Temple of Ahn'Qiraj (only inside it)" }));
  out.push({ name: RED_QIRAJI, epic: true, where: "Temple of Ahn'Qiraj, very rare" });
  return out;
}
const hasMount = n => !!S.mounts[n];
// the mount ridden: a rare one if the hero has it (and epic riding), then the newest epic, then the newest normal one
function rideName() {
  if (!S.mount) return null;
  const owned = mountList().filter(m => hasMount(m.name) && (m.epic ? S.mount >= 2 : true) && !/Qiraji/.test(m.name));
  owned.sort((a, b) => (!!b.rare - !!a.rare) || (b.epic - a.epic) || ((S.mounts[b.name].p ?? 0) - (S.mounts[a.name].p ?? 0)));
  return owned.length ? owned[0].name : S.mount >= 2 ? race().epic : race().mount;
}
// a new mount; text: the chronicle line (none for the hero's own riding and class mounts, which log when bought);
// old: from a save made before the collection existed (no date)
function addMount(name, text, old) {
  if (hasMount(name)) return;
  S.mounts[name] = old ? { at: null, p: null, L: null } : stamp();
  if (text) log(`${text} A new mount for the collection.`, "loot4");
}

// ---------- getting them ----------
// riding and epic riding bought, class mounts learned: the hero's own mounts
function mountOwn(old) {
  [["Summon Warhorse", "Warhorse"], ["Summon Felsteed", "Felsteed"], ["Summon Charger", "Charger"], ["Summon Dreadsteed", "Dreadsteed"]].forEach(([sp, n]) => { if (sp in S.spells) addMount(n, null, old); });
  if (S.mount >= 1 && !["Paladin", "Warlock"].includes(S.cls)) addMount(race().mount, null, old);
  if (S.mount >= 2 && !["Paladin", "Warlock"].includes(S.cls)) addMount(race().epic, null, old);
}
// boss kills: the rare mounts, and the Qiraji crystals in the Temple of Ahn'Qiraj
function mountDrops(boss, dn) {
  for (const [b, name, n] of MOUNT_DROPS) if (b === boss && !hasMount(name) && Math.random() < 1 / n) addMount(name, `${boss} dropped ${name}!`);
  if (dn === "Temple of Ahn'Qiraj") {
    if (!hasMount(RED_QIRAJI) && Math.random() < 0.003) addMount(RED_QIRAJI, `A Red Qiraji Resonating Crystal! The rarest of the battle tanks.`);
    else if (Math.random() < 0.04) { const c = pick(QIRAJI); if (!hasMount(c)) addMount(c, `${boss} dropped a ${c.split(" ")[0]} Qiraji Resonating Crystal.`); }
  }
}
// a city visit at 60: one stack of 20 Runecloth for the next race not yet exalted, and the mounts it opens up
function mountTurnins() {
  if (S.level < 60 || !S.prof) return;
  const next = otherRaces().map(o => RACE_REP[o]).find(c => (S.rep[c] || 0) < RUNECLOTH_EXALTED);
  const k = MATS.Cloth[4];
  if (next && (S.prof.mats[k] || 0) >= 20 && S.time - (S.turnin || 0) >= 12 * HOUR) {
    S.prof.mats[k] -= 20; S.turnin = S.time; if (!S.prof.mats[k]) delete S.prof.mats[k];
    S.rep[next] = (S.rep[next] || 0) + 1;
    if (S.rep[next] === RUNECLOTH_EXALTED) log(`Exalted with ${next}! They'll sell you their mounts now.`, "ach");
    else if (S.rep[next] % 10 === 0) log(`Turned in Runecloth for ${next} (${S.rep[next]} of ${RUNECLOTH_EXALTED} toward exalted).`, "quest");
  }
  // buy the other races' mounts once exalted (the epic ones with epic riding): a luxury, only with gold to spare
  otherRaces().forEach(o => {
    const R0 = RACES[o]; if ((S.rep[RACE_REP[o]] || 0) < RUNECLOTH_EXALTED) return;
    if (!hasMount(R0.mount) && spendable() >= RACE_MOUNT_COST * 5) { spend("gear", RACE_MOUNT_COST); addMount(R0.mount, `Bought a ${R0.mount} in ${R0.city} for ${moneyTxt(RACE_MOUNT_COST)}.`); }
    if (S.mount >= 2 && !hasMount(R0.epic) && spendable() >= RACE_EPIC_COST * 4) { spend("gear", RACE_EPIC_COST); addMount(R0.epic, `Bought a ${R0.epic} in ${R0.city} for ${moneyTxt(RACE_EPIC_COST)}.`); }
  });
}
// a quest done in Winterspring at 60 (Alliance): the Wintersaber Trainers, toward the Frostsaber
function mountQuest(q) {
  if (S.faction !== "Alliance" || S.level < 60 || q.zone !== "Winterspring" || hasMount("Winterspring Frostsaber")) return;
  S.wintersaber = (S.wintersaber || 0) + 1;
  if (S.wintersaber >= WINTERSABER_EXALTED) addMount("Winterspring Frostsaber", "Exalted with the Wintersaber Trainers: Rivern Frostwind hands over the reins of a Winterspring Frostsaber.");
  else if (S.wintersaber % 15 === 0) log(`The Wintersaber Trainers warm up to you (${S.wintersaber} of ${WINTERSABER_EXALTED}).`, "quest");
}

// ---------- the collection tab ----------
function renderMounts() {
  const all = mountList(), got = all.filter(m => hasMount(m.name)), ride = rideName();
  const order = got.slice().sort((a, b) => (S.mounts[b.name].p ?? 0) - (S.mounts[a.name].p ?? 0)).concat(all.filter(m => !hasMount(m.name)));
  const repNote = m => m.rep && !hasMount(m.name) ? ` · ${Math.min(S.rep[m.rep] || 0, RUNECLOTH_EXALTED)} of ${RUNECLOTH_EXALTED} turn-ins` : m.name === "Winterspring Frostsaber" && !hasMount(m.name) ? ` · ${S.wintersaber || 0} of ${WINTERSABER_EXALTED}` : "";
  return `<li class="jhead">Mounts <small>${got.length} of ${all.length}</small></li>` + order.map(m => { const e = S.mounts[m.name];
    return `<li class="${e ? "got" : "locked"}"><span class="ico">${e ? "✓" : "·"}</span><div><b class="${m.epic ? "q4" : "q3"}">${esc(m.name)}${ride === m.name ? ' <small class="comp">riding</small>' : ""}</b><span>${esc(m.where)}${repNote(m)}</span>${e ? `<time>${e.at ? when(e.at, e.L, e.p) : "learned before the collection existed"}</time>` : ""}</div></li>`; }).join("");
}
