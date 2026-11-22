// Class quests: what the trainer doesn't just hand over. While levelling, some spells wait for a quest (Bear Form and
// Moonglade, the warlock's demons, the shaman's totems, Tame Beast, the warrior's stances, the rogue's poisons, the
// paladin's Redemption, the class mounts at 40), done on a city visit once the level is there: a few trips and a named
// fight (`cqFight`: the result rolled up front, like world PvP; a death means a corpse run and another go). Some only
// give an item (Verigan's Fist, the Whirlwind Axe). At 60 the long ones run as chains in raidq.js (ATT_CHAINS with
// `cls`): the Charger and the Dreadsteed (worked on like an attunement, with a gold step for the materials, instead of
// the 1000 gold epic mount), Rhok'delar and Lok'delar, Benediction, Quel'Serrar (goals).
"use strict";

// text: a string, [Alliance, Horde], or a function
const cqT = x => typeof x === "function" ? x() : Array.isArray(x) ? x[S.faction === "Alliance" ? 0 : 1] : x;
const lockTrainer = () => ({ Human: "Gakin the Darkbinder in Stormwind", Gnome: "Gakin the Darkbinder in Stormwind", Orc: "Gan'rul Bloodeye in Orgrimmar", Undead: "Carendin Halgar in the Undercity" })[S.race] || "your trainer";
const druidTrainer = () => S.faction === "Alliance" ? "Mathrengyl Bearwalker in Darnassus" : "Turak Runetotem in Thunder Bluff";

// a levelling quest: { id, cls, lvl, name, spells (held back until it's done), steps, reward, fee, when }
// steps: ["go", text, sec()] or ["fight", text, foe, levels above the hero]
const CLASS_QUESTS = [
  { id: "warDef", cls: "Warrior", lvl: 10, name: ["Bartleby the Drunk", "Path of Defense"], spells: ["Defensive Stance"], steps: [
    ["go", ["Harry Burlguard in Stormwind wants his mug back from Bartleby, by force if need be", "Veteran Uzzek at the Crossroads sends you after Thun'grim Firegaze"], 40],
    ["fight", ["Teaching Bartleby the Drunk a lesson", "Fighting Thun'grim Firegaze on his hill"], ["Bartleby", "Thun'grim Firegaze"], 1],
    ["go", ["Bartleby's Mug back to Harry Burlguard: Defensive Stance", "Back to Veteran Uzzek: Defensive Stance"], 20]] },
  { id: "warBers", cls: "Warrior", lvl: 30, name: "The Affray", spells: ["Berserker Stance"], steps: [
    ["go", "The trainer sends you to Klannoc Macleod at the Affray, in the Barrens", 70],
    ["go", "The Affray: the Grimtotem challengers, one after another", 40],
    ["fight", "Fighting Big Will in the Affray", "Big Will", 2],
    ["go", "Back to the trainer: Berserker Stance", 30]] },
  { id: "warWW", cls: "Warrior", lvl: 32, name: "Whirlwind Weapon", when: () => S.spec !== 2, reward: { name: "Whirlwind Axe", slot: "Main Hand", ilvl: 40, q: 3 }, steps: [
    ["go", "Tormus Deepforge wants the heart of an air elemental for a weapon", 50],
    ["fight", "Fighting Cyclonian in the Arathi Highlands", "Cyclonian", 3],
    ["go", "Cyclonian's heart goes into the forge", 30]] },
  { id: "palRedemption", cls: "Paladin", lvl: 12, name: "The Tome of Divinity", spells: ["Redemption"], steps: [
    ["go", "Duthorian Rall's tasks: alms for the poor, a prayer at the cathedral", 50],
    ["go", "The Tome of Divinity's last pages: Redemption", 25]] },
  { id: "palValor", cls: "Paladin", lvl: 22, name: "The Tome of Valor", reward: { name: "Verigan's Fist", slot: "Main Hand", ilvl: 30, q: 3 }, steps: [
    ["go", "Duthorian Rall sends you out to defend the farms of Westfall", 60],
    ["fight", "Holding off the Defias raiders at the farm", "Defias Raider", 2],
    ["go", "The Tome of Valor's reward: Verigan's Fist, a hammer from the forges of Ironforge", 30]] },
  { id: "palMount", cls: "Paladin", lvl: 40, name: "The Tome of Nobility", spells: ["Summon Warhorse"], fee: 200000, steps: [
    ["go", "Lord Grayson Shadowbreaker in the Cathedral of Light: a warhorse is earned with deeds", 40],
    ["go", "The Tome of Nobility: Summon Warhorse", 25]] },
  { id: "huntTame", cls: "Hunter", lvl: 10, name: "Taming the Beast", spells: ["Tame Beast", "Call Pet"], steps: [
    ["go", "The trainer hands over a Taming Rod: tame three beasts, one after another", 60],
    ["go", "Training the Beast: the pet trainer explains the rest", 20]] },
  { id: "rogPoison", cls: "Rogue", lvl: 20, name: ["Klaven's Tower", "Mission: Possible But Not Probable"], spells: ["Instant Poison"], steps: [
    ["go", ["Mathias Shaw's contact wants the Defias poison recipe from Klaven Mortwake's tower", "Sneaking into the Venture Co. tower for their poison recipe"], 60],
    ["fight", ["Klaven Mortwake catches you at the top of his tower", "A Venture Co. foreman catches you on the way out"], ["Klaven Mortwake", "Venture Co. Foreman"], 2],
    ["go", "The recipe back to the poison trainer: Instant Poison", 25]] },
  { id: "shamEarth", cls: "Shaman", lvl: 4, name: "Call of Earth", spells: ["Stoneskin Totem", "Earthbind Totem", "Stoneclaw Totem", "Tremor Totem"], steps: [
    ["go", "Call of Earth: an Earth Sapta from the trainer, and the spirit of earth on the hill", 35],
    ["fight", "Fighting the earth spirit's test", "Minor Manifestation of Earth", 1],
    ["go", "The Earth Totem: Stoneskin Totem", 15]] },
  { id: "shamFire", cls: "Shaman", lvl: 10, name: "Call of Fire", spells: ["Searing Totem", "Fire Nova Totem"], steps: [
    ["go", "Call of Fire: Kranal Fiss sends you to Telf Joolam, and Telf to the Burning Blade for a Fire Sapta", 60],
    ["fight", "Fighting the Burning Blade for the Fire Sapta", "Burning Blade Cultist", 1],
    ["go", "The Fire Altar on top of Thunder Ridge: the Fire Totem", 40]] },
  { id: "shamWater", cls: "Shaman", lvl: 20, name: "Call of Water", spells: ["Healing Stream Totem", "Mana Spring Totem"], steps: [
    ["go", "Call of Water: Islen Waterseer in the Barrens, and a long road after her", 70],
    ["go", "Brine's water from the bottom of the Well of the Forgotten", 50],
    ["fight", "Fighting the corrupted water spirit in Ashenvale", "Corrupt Minor Manifestation of Water", 2],
    ["go", "The Water Totem: Healing Stream Totem", 30]] },
  { id: "shamAir", cls: "Shaman", lvl: 30, name: "Call of Air", spells: ["Grounding Totem", "Windfury Totem"], steps: [
    ["go", "Call of Air: the trainer sends you to the windriders, and the spirit of air in the high places", 70],
    ["go", "An Air Sapta: the spirit's trial, carried up to where the wind starts", 40],
    ["go", "The Air Totem: Grounding Totem", 25]] },
  { id: "druBear", cls: "Druid", lvl: 10, name: "Body and Heart", spells: ["Bear Form", "Teleport: Moonglade"], steps: [
    ["go", () => `Heeding the Call: ${druidTrainer()} sends you to Moonglade`, 70],
    ["go", "Dendrite Starblaze in Nighthaven teaches you the way back: Teleport: Moonglade", 20],
    ["fight", "Body and Heart: facing Lunaclaw's spirit at the moonkin stone", "Lunaclaw", 1],
    ["go", "Back to Dendrite Starblaze: Bear Form", 15]] },
  { id: "druAqua", cls: "Druid", lvl: 16, name: "The Pendant of the Sea Lion", spells: ["Aquatic Form"], steps: [
    ["go", "Aquatic Form: the two halves of the Pendant of the Sea Lion, from under the water", 80],
    ["go", "Dendrite Starblaze joins the halves: Aquatic Form", 25]] },
  { id: "lockVoid", cls: "Warlock", lvl: 10, name: "The Binding", spells: ["Summon Voidwalker"], steps: [
    ["go", () => `${lockTrainer()} hands over a Bloodstone Choker and a summoning scroll`, 35],
    ["fight", "The Binding: a Voidwalker answers the summoning circle, and fights the leash", "Summoned Voidwalker", 1],
    ["go", "The Voidwalker is bound: Summon Voidwalker", 15]] },
  { id: "lockSucc", cls: "Warlock", lvl: 20, name: "Devourer of Souls", spells: ["Summon Succubus"], steps: [
    ["go", () => `${lockTrainer()} wants a soul gem filled for a Succubus's binding`, 60],
    ["fight", "Binding the Succubus at the summoning circle", "Summoned Succubus", 1],
    ["go", "The Succubus is bound: Summon Succubus", 15]] },
  { id: "lockFel", cls: "Warlock", lvl: 30, name: "The Tome of the Cabal", spells: ["Summon Felhunter"], steps: [
    ["go", "The Tome of the Cabal: its torn pages, from Desolace to the Swamp of Sorrows", 90],
    ["fight", "Binding the Felhunter at the summoning circle", "Summoned Felhunter", 2],
    ["go", "The Felhunter is bound: Summon Felhunter", 15]] },
  { id: "lockMount", cls: "Warlock", lvl: 40, name: "The Felsteed", spells: ["Summon Felsteed"], fee: 200000, steps: [
    ["go", () => `${lockTrainer()} names the price of a felsteed, and the reagents`, 40],
    ["fight", "Breaking in the Felsteed", "Felsteed", 2],
    ["go", "The Felsteed is bound: Summon Felsteed", 15]] },
  // the priest's racial spells, one at 10 and one at 20 (not trainer spells: given by the quest, `grant`)
  { id: "priHuman10", cls: "Priest", race: "Human", lvl: 10, name: "Desperate Prayer", grant: ["Desperate Prayer"], steps: [
    ["go", "A lesson in Stormwind's cathedral: a prayer for when nothing else is left", 40],
    ["go", "Back to the trainer: Desperate Prayer", 20]] },
  { id: "priHuman20", cls: "Priest", race: "Human", lvl: 20, name: "Arcane Feedback", grant: ["Feedback"], steps: [
    ["go", "Arcane Feedback: Brother Joshua in Stormwind, and a lesson about turning a mage's magic against them", 60],
    ["go", "Back to the trainer: Feedback", 20]] },
  { id: "priDwarf10", cls: "Priest", race: "Dwarf", lvl: 10, name: "Desperate Prayer", grant: ["Desperate Prayer"], steps: [
    ["go", "A lesson from High Priest Rohan in Ironforge: a prayer for when nothing else is left", 40],
    ["go", "Back to the trainer: Desperate Prayer", 20]] },
  { id: "priDwarf20", cls: "Priest", race: "Dwarf", lvl: 20, name: "A Lack of Fear", grant: ["Fear Ward"], steps: [
    ["go", "A Lack of Fear: Toldren Deepiron in Ironforge, and a test of nerve", 60],
    ["go", "Back to the trainer: Fear Ward", 20]] },
  { id: "priNightElf10", cls: "Priest", race: "Night Elf", lvl: 10, name: "Returning Home", grant: ["Starshards"], steps: [
    ["go", "Returning Home: the priestesses of Elune, and the stars called down", 40],
    ["go", "Back to the trainer: Starshards", 20]] },
  { id: "priNightElf20", cls: "Priest", race: "Night Elf", lvl: 20, name: "Elune's Grace", grant: ["Elune's Grace"], steps: [
    ["go", "A lesson from Astarii Starseeker in Darnassus: Elune's protection", 60],
    ["go", "Back to the trainer: Elune's Grace", 20]] },
  { id: "priUndead10", cls: "Priest", race: "Undead", lvl: 10, name: "Touch of Weakness", grant: ["Touch of Weakness"], steps: [
    ["go", "A lesson in the Undercity: the Forsaken's curse, passed on with a touch", 40],
    ["go", "Back to the trainer: Touch of Weakness", 20]] },
  { id: "priUndead20", cls: "Priest", race: "Undead", lvl: 20, name: "Devouring Plague", grant: ["Devouring Plague"], steps: [
    ["go", "A lesson in the Undercity: the plague that feeds the one who spreads it", 60],
    ["go", "Back to the trainer: Devouring Plague", 20]] },
  { id: "priTroll10", cls: "Priest", race: "Troll", lvl: 10, name: "Hex of Weakness", grant: ["Hex of Weakness"], steps: [
    ["go", "A lesson from the Darkspear priests: the old hex of weakness", 40],
    ["go", "Back to the trainer: Hex of Weakness", 20]] },
  { id: "priTroll20", cls: "Priest", race: "Troll", lvl: 20, name: "Shadowguard", grant: ["Shadowguard"], steps: [
    ["go", "A lesson from the Darkspear priests: shadows that bite back", 60],
    ["go", "Back to the trainer: Shadowguard", 20]] },
];
const cqMine = c => c.cls === S.cls && (!c.race || c.race === S.race);
const cqDoneQ = c => (S.cq[c.id] || 0) >= c.steps.length;
const cqDef = id => CLASS_QUESTS.find(c => c.id === id);
// the epic mount spells wait for their chain at 60
const CQ_CHAIN_SPELL = { "Summon Charger": "charger", "Summon Dreadsteed": "dreadsteed" };
// a spell the trainer won't teach yet
function cqHeld(name) {
  if (CLASS_QUESTS.some(c => cqMine(c) && c.spells && c.spells.includes(name) && !cqDoneQ(c))) return true;
  const k = CQ_CHAIN_SPELL[name]; return !!k && !attDone(k);
}
// the class mounts: learning the spell is the mount
function classMountSpell(name) {
  if (/^Summon (Warhorse|Felsteed)$/.test(name)) S.mount = Math.max(S.mount, 1);
  if (/^Summon (Charger|Dreadsteed)$/.test(name)) S.mount = 2;
}
const classMount = () => S.cls === "Paladin" || S.cls === "Warlock";
const classMountChain = () => S.cls === "Paladin" ? "charger" : "dreadsteed";
// gold kept back for the epic mount chain's materials from 56 (like the epic mount savings), until its gold step comes up
// (attReserve has it then)
function classMountReserve() {
  if (S.level < 56) return 0;
  const k = classMountChain(), st = ATT_CHAINS[k].steps, gi = st.findIndex(s => s[0] === "gold");
  return attStep(k) < gi ? st[gi][2] : 0;
}

// on a city visit: the lowest quest that's due, from where it was left
function cqQueue(q) {
  const c = CLASS_QUESTS.find(x => cqMine(x) && S.level >= x.lvl && !cqDoneQ(x) && (!x.when || x.when()));
  if (c) q.push(...cqTasks(c));
}
function cqTasks(c) {
  const from = S.cq[c.id] || 0, name = cqT(c.name);
  return c.steps.slice(from).map((s, j) => s[0] === "fight"
    ? cqFight(`${name}: ${cqT(s[1])}`, cqT(s[2]), S.level + (s[3] || 0), { cqid: c.id, st: from + j })
    : { k: "cq", d: `${name}: ${cqT(s[1])}`, t: sec(s[2]), cqid: c.id, st: from + j });
}
// a named fight, the result rolled now (soloFight's health follows it, see wpOutcome): most heroes win, gear helps
function cqFight(d, foe, L, extra) {
  const gear = gearFor(), win = clamp(0.84 + (gear - 1) * 0.6 + (S.pet ? 0.04 : 0), 0.6, 0.96);
  return { k: "kill", cq: true, d, t: sec((9 + S.level * 0.12) * 2.2 * clamp(1.35 - gear * 0.35, 0.8, 1.2) * buffSpeed() * petSpeed() / talMod("d")),
    mob: foe, mobs: [foe], mobL: clamp(L, 1, 63), casts: rotation(false, 7 + R(4)), die: Math.random() >= win, dieAt: +(0.55 + Math.random() * 0.35).toFixed(2), ...extra };
}
function cqFightEnd(t) {
  const sf = soloFight(t);
  if (sf.drank && S.cons.hp > 0) S.cons.hp--;
  petAfterFight(t, sf);
  if (t.die) {
    loseBuffs(); S.repair += S.level * S.level * 4 + 20; if (S.pet) S.pet.dead = true; S.hpF = 0;
    log(`${t.mob} wins this one. ${S.name} releases spirit${t.cqid ? " and tries again" : ""}…`, "death");
    const back = [{ k: "ghost", d: "Running back to your corpse as a ghost", t: sec(45) }, { k: "rez", d: "Resurrecting and drinking up", t: sec(10) }];
    if (t.cqid) { S.queue = S.queue.filter(x => x.cqid !== t.cqid); back.push(...cqTasks(cqDef(t.cqid))); }
    S.queue.unshift(...back);
    return;
  }
  log(`${t.mob} has been defeated.`, "boss");
  gainXp(mobXp(t.mobL) * 3);
  if (t.cqid) cqStep(t);
  else if (t.ch && attStep(t.ch) === t.st) attCount(t.ch, attCur(t.ch)[3]);
  else if (t.si) siKill(t); // the Scourge Invasion (scourge.js)
  else if (t.fac) facGain(t.fac, 30); // a reputation grind (factions.js)
}
function cqStep(t) {
  const c = cqDef(t.cqid); if (!c || (S.cq[c.id] || 0) !== t.st) return;
  S.cq[c.id] = t.st + 1;
  if (cqDoneQ(c)) cqFinish(c);
  dirty = true;
}
// a quest done: its spells (at the rank for the level, no training fee), the fee, the reward
function cqFinish(c) {
  const learned = [];
  (c.grant || []).forEach(n => { if (!(n in S.spells)) { S.spells[n] = 1; learned.push(n); } });
  (c.spells || []).forEach(n => { const sp = cls().list.find(x => spellName(x.name) === n); if (!sp || sp.lvl > S.level || n in S.spells) return; S.spells[n] = RANK_SPELL(sp, S.level); learned.push(n); classMountSpell(n); });
  if (c.fee) { const f = Math.min(c.fee, S.money); if (f) { spend("gear", f); log(`Paid ${moneyTxt(f)} for the reagents.`, "gold"); } }
  log(`Class quest complete: ${cqT(c.name)}.${learned.length ? ` Learned ${learned.join(", ")}.` : ""}`, "ach");
  if (c.reward) gain({ ...c.reward }, "Quest reward:");
  if (S.mounts) mountOwn();
}
const CQ_FINISH = { cq(t) { log(`${t.d}.`, "quest"); cqStep(t); } };

// ---------- the chains at 60 ----------
Object.assign(ATT_CHAINS, {
  charger: { cls: "Paladin", name: "The Charger", mount: "Summon Charger",
    what: "Lord Grayson Shadowbreaker's quest line for the paladin's epic mount: Stratholme and Scholomance, Grimand Elmore's Blessed Arcanite Barding (expensive), the spirits of Terrordale, and Death Knight Darkreaver. Weeks, instead of the 1000 gold.",
    steps: [
      ["go", "Lord Grayson Shadowbreaker in the Cathedral of Light: a paladin's charger is earned, not bought", 40],
      ["go", "Duke Nicholas Zverenhoff at Light's Hope Chapel, in the Eastern Plaguelands", 60],
      ["run", "Righteous Orbs from the Scarlet Crusade in Stratholme, for the barding", "Stratholme", "x4"],
      ["gold", "Grimand Elmore's price for the Blessed Arcanite Barding: Arcanite Bars, Thorium, Enchanted Leather (800 gold)", 8000000],
      ["go", "Exorcising Terrordale: the Divination Scryer and the restless spirits of Terrordale", 120],
      ["run", "Summon Death Knight Darkreaver in the Great Ossuary of Scholomance and take back his charger's soul", "Scholomance", 0.6],
      ["go", "The Charger's Redemption: Lord Grayson blesses the barding", 30],
    ] },
  dreadsteed: { cls: "Warlock", name: "The Dreadsteed of Xoroth", mount: "Summon Dreadsteed",
    what: "Mor'zul Bloodbringer's quest line for the warlock's epic mount: an imp from Scholomance, Gorzeeki Wildeyes's reagents (expensive), and the ritual in Dire Maul, where the Dreadsteed has to be beaten before it's bound. Weeks, instead of the 1000 gold.",
    steps: [
      ["go", "Mor'zul Bloodbringer in the Burning Steppes: the Dreadsteed of Xoroth", 50],
      ["run", "Imp Delivery: catch an Imp in a Jar from the Scholomance imps for Gorzeeki Wildeyes", "Scholomance", 0.6],
      ["go", "Gorzeeki Wildeyes reads the Xorothian Glyphs and writes the shopping list", 80],
      ["gold", "Gorzeeki's reagents for the ritual: Xorothian Stardust, a Black Lotus, Dark Runes, Fel Elemental Rods (800 gold)", 8000000],
      ["run", "The ritual in Dire Maul: hold the circle, then beat the Dreadsteed of Xoroth", "Dire Maul", 0.6],
      ["go", "The Dreadsteed's spirit, bound: Mor'zul teaches Summon Dreadsteed", 30],
    ] },
  rhok: { cls: "Hunter", goal: true, name: "Rhok'delar", item: [{ name: "Rhok'delar, Longbow of the Ancient Keepers", slot: "Ranged", ilvl: 75, q: 4 }, { name: "Lok'delar, Stave of the Ancient Keepers", slot: "Main Hand", ilvl: 75, q: 4 }],
    what: "An Ancient Petrified Leaf from Majordomo Executus's cache, Vartrus the Ancient in Felwood, four demons hiding as friendly faces across the world, each fought alone (a real test for the pet), and a Mature Black Dragon Sinew from Onyxia. The reward: Rhok'delar, Longbow of the Ancient Keepers, and Lok'delar, Stave of the Ancient Keepers. Weeks.",
    steps: [
      ["boss", "An Ancient Petrified Leaf from the Cache of the Firelord: kill Majordomo Executus until it's in there", "Majordomo Executus", 0.35],
      ["go", "The Ancient Leaf: Vartrus the Ancient in Felwood knows what it is", 70],
      ["fight", "Artorius the Amiable: a friendly face in Winterspring, until he's Artorius the Doombringer", "Artorius the Doombringer", 62],
      ["fight", "Klinfran the Crazed: in the west of the Burning Steppes", "Klinfran the Crazed", 62],
      ["fight", "Simone the Seductress: in the west of Un'Goro Crater", "Simone the Seductress", 62],
      ["fight", "Solenor the Slayer: in Silithus", "Solenor the Slayer", 62],
      ["go", "Stave of the Ancients: the four heads to Vartrus, for the Ancient Rune Etched Stave", 50],
      ["boss", "Mature Black Dragon Sinew: from Onyxia, to string the stave", "Onyxia", 0.25],
      ["go", "Vartrus strings the bow: Rhok'delar. Talk to him again: Lok'delar", 30],
    ] },
  bene: { cls: "Priest", goal: true, name: "The Balance of Light and Shadow", item: () => S.spec === 2 ? { name: "Anathema", slot: "Main Hand", ilvl: 75, q: 4 } : { name: "Benediction", slot: "Main Hand", ilvl: 75, q: 4 },
    what: "The Eye of Divinity from Majordomo Executus's cache shows the way to Eris Havenfire, whose test in the Eastern Plaguelands gives the Splinter of Nordrassil; with the Eye of Shadow (Lord Kazzak, or the elite demons of the Blasted Lands and Winterspring) it becomes Benediction, or Anathema for a shadow priest. Weeks.",
    steps: [
      ["boss", "The Eye of Divinity, in the Cache of the Firelord: kill Majordomo Executus until it's in there", "Majordomo Executus", 0.35],
      ["go", "With the Eye of Divinity worn, Eris Havenfire appears in the Eastern Plaguelands", 50],
      ["fight", "The Balance of Light and Shadow: heal fifty fleeing peasants through the Scourge archers, and don't let fifteen die", "Scourge Archer", 61],
      ["go", "Eris Havenfire's reward: the Splinter of Nordrassil", 20],
      ["go", "The Eye of Shadow: hunting the elite demons of the Blasted Lands and Winterspring, a rare drop", 200, "x12"],
      ["go", "The Splinter and the two Eyes joined: Benediction, and in its shadow Anathema", 30],
    ] },
  lamina: { cls: "Hunter", goal: true, name: "Ancient Sinew Wrapped Lamina", bag: { name: "Ancient Sinew Wrapped Lamina", slots: 18 },
    need: () => attStep("rhok") < 2 ? "Needs the Ancient Petrified Leaf shown to Vartrus (Rhok'delar)" : null,
    what: "Vartrus sends you on to Hastat the Ancient, who wants a Mature Blue Dragon Sinew from Azuregos: the hunter's quiver, the Ancient Sinew Wrapped Lamina. Needs Azuregos up and dead.",
    steps: [
      ["go", "Hastat the Ancient in Felwood: the sinew of a blue dragon", 40],
      ["boss", "Mature Blue Dragon Sinew: from Azuregos in Azshara", "Azuregos", 0.8],
      ["go", "Hastat wraps the sinew: the Ancient Sinew Wrapped Lamina", 30],
    ] },
  quel: { cls: ["Warrior", "Paladin"], tank: true, goal: true, name: "The Forging of Quel'Serrar", item: { name: "Quel'Serrar", slot: "Main Hand", ilvl: 71, q: 4 },
    what: "A sword for warrior and paladin tanks: Foror's Compendium of Dragon Slaying from Dire Maul, Lorekeeper Lydros's Unfired Ancient Blade, laid where Onyxia's flame breath will hit it, and back to Lydros. Weeks.",
    steps: [
      ["run", "Foror's Compendium of Dragon Slaying: a rare find, from a Dire Maul boss or a dusty tome", "Dire Maul", 0.12],
      ["run", "Lorekeeper Lydros in the Athenaeum of Dire Maul: The Forging of Quel'Serrar", "Dire Maul", "x1"],
      ["gold", "Lydros's materials for the Unfired Ancient Blade (100 gold)", 1000000],
      ["boss", "Onyxia's Lair: lay the Unfired Ancient Blade where her flame breath hits it in the last phase, and pick it up glowing", "Onyxia", 0.5],
      ["go", "The heated blade back to Lydros: Quel'Serrar", 60],
    ] },
});
// a class chain done: the mount spell, or the item
function cqChainDone(k) {
  const c = ATT_CHAINS[k];
  log(`${c.name} is done!`, "ach");
  if (c.mount) {
    const sp = cls().list.find(x => x.name === c.mount);
    if (sp && !(c.mount in S.spells)) { S.spells[c.mount] = 1; classMountSpell(c.mount); log(`Learned ${c.mount}. No 1000 gold needed: the ${c.mount.replace("Summon ", "")} is ${S.name}'s.`, "loot4"); }
    mountOwn();
  }
  if (c.bag) { if (bagUpgrade(c.bag)) giveBag(c.bag, "Quest reward:"); else log(`Quest reward: ${c.bag.name}, but the bags are better already.`, "loot4"); }
  if (c.item) [].concat(typeof c.item === "function" ? c.item() : c.item).forEach(it => { gain({ ...it }, c.legend ? "LEGENDARY!" : "Quest reward:"); if (c.legend) legendDone(it); });
}
// old saves: the quests below the hero's level count as done (the spells are known already), and a paladin or warlock
// who already knows the epic mount spell has done the chain
function cqMigrate() {
  if (!S.cq) { S.cq = {}; CLASS_QUESTS.forEach(c => { if (cqMine(c) && S.level >= c.lvl) S.cq[c.id] = c.steps.length; }); }
  Object.entries(CQ_CHAIN_SPELL).forEach(([n, k]) => { if (n in S.spells && !attDone(k)) S.att[k] = ATT_CHAINS[k].steps.length; });
}
