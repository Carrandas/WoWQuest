// Achievements and the zone and dungeon journal.
"use strict";

// ---------- achievements, zones & dungeons journal ----------
let simClock = null;                       // wall clock while catching up on offline time
const realNow = () => simClock ?? Date.now();
const stamp = () => ({ at: realNow(), p: S.time, L: S.level });
const eq = f => SLOTS.some(s => S.equip[s] && f(S.equip[s]));
const full = f => SLOTS.every(s => S.equip[s] && f(S.equip[s]));
const fullSet = t => (SET_SLOTS[t] || SET_SLOTS[0]).every(s => S.equip[s] && S.equip[s].set >= t);
const onRoute = z => route().some(l => l.z === z);
const factionDungeons = () => DUNGEONS.filter(d => d[3] === "B" || d[3] === S.faction[0]);
const ACH = [
  ...[10, 20, 30, 40, 50].map(n => ({ id: "L" + n, name: `Level ${n}`, desc: `Reach level ${n}.`, test: () => S.level >= n })),
  { id: "L60", name: "Level 60", desc: "Reach the level cap.", test: () => S.level >= 60 },
  { id: "kill1", name: "First Blood", desc: "Win your first fight.", test: () => S.kills >= 1 },
  { id: "kill1k", name: "Seasoned Fighter", desc: "Kill 1,000 enemies.", test: () => S.kills >= 1000 },
  { id: "kill10k", name: "Exterminator", desc: "Kill 10,000 enemies.", test: () => S.kills >= 10000 },
  { id: "q50", name: "Helping Hand", desc: "Complete 50 quests.", test: () => S.qdone >= 50 },
  { id: "q250", name: "Errand Runner", desc: "Complete 250 quests.", test: () => S.qdone >= 250 },
  { id: "q1000", name: "Loremaster", desc: "Complete 1,000 quests.", test: () => S.qdone >= 1000 },
  { id: "hogger", name: "Hogger", desc: "Take down Hogger, the big bad gnoll of Elwynn Forest.", show: () => onRoute("Elwynn Forest"), test: () => S.elites.includes("Hogger") },
  { id: "mankrik", name: "Mankrik's Wife", desc: "Find what became of Mankrik's wife in the Barrens.", show: () => onRoute("The Barrens"), test: () => S.feats.includes("Mankrik's Wife") },
  { id: "wanted1", name: "Bounty Hunter", desc: "Slay a Wanted elite.", test: () => S.elites.length >= 1 },
  { id: "wanted3", name: "Most Wanted", desc: "Slay three Wanted elites.", test: () => S.elites.length >= 3 },
  { id: "green", name: "Fine Threads", desc: "Equip your first green item.", test: () => eq(it => it.q >= 2) },
  { id: "blue", name: "Rare Find", desc: "Equip your first blue item.", test: () => eq(it => it.q >= 3) },
  { id: "purple", name: "Epic!", desc: "Equip your first purple item.", test: () => eq(it => it.q >= 4) },
  { id: "legend", name: "Legendary!", desc: "Wield a legendary weapon: Thunderfury, Sulfuras or Atiesh.", test: () => eq(it => it.q >= 5) },
  { id: "fgreen", name: "Head to Toe in Green", desc: "Every slot green or better.", test: () => full(it => it.q >= 2) },
  { id: "fblue", name: "Blue Steel", desc: "Every slot blue or better.", test: () => full(it => it.q >= 3) },
  { id: "fepic", name: "Purple Reign", desc: "Every slot epic or better.", test: () => full(it => it.q >= 4) },
  { id: "t0", name: "Dressed for Dungeons", desc: "Equip a piece of your dungeon set.", test: () => eq(it => it.set >= 0) },
  { id: "ft0", name: "Full Dungeon Set", desc: "Wear all eight pieces of your dungeon set (or better tier pieces).", test: () => fullSet(0) },
  ...[1, 2, 3, 4].flatMap(t => [
    { id: "t" + t, name: TIER_NAME[t], desc: `Equip a ${TIER_NAME[t]} piece (${["", "Molten Core", "Blackwing Lair", "Temple of Ahn'Qiraj", "Naxxramas"][t]}).`, test: () => eq(it => it.set >= t) },
    { id: "ft" + t, name: "Full " + TIER_NAME[t], desc: `Wear every ${TIER_NAME[t]} slot (${(SET_SLOTS[t] || SET_SLOTS[0]).length} pieces), or better tier pieces.`, test: () => fullSet(t) },
  ]),
  { id: "bags", name: "Four Bags", desc: "Fill all four bag slots.", test: () => S.bagSlots.length >= 4 },
  { id: "mount", name: "Giddy Up!", desc: "Get your first mount.", test: () => S.mount >= 1 },
  { id: "epic", name: "Epic Steed", desc: "Ride an epic mount.", test: () => S.mount >= 2 },
  { id: "deep", name: "Deep Specialization", desc: "Put 31 points into one talent tree.", test: () => S.level >= 40 },
  { id: "g10", name: "Pocket Money", desc: "Hold 10 gold.", test: () => S.money >= 100000 },
  { id: "g100", name: "Well Off", desc: "Hold 100 gold.", test: () => S.money >= 1000000 },
  { id: "g1000", name: "Rolling in It", desc: "Hold 1,000 gold.", test: () => S.money >= 10000000 },
  { id: "death", name: "Spirit Healer's Friend", desc: "Die for the first time.", test: () => S.deaths >= 1 },
  { id: "close", name: "Close Call", desc: "Survive a deadly fight by drinking a healing potion.", test: () => S.feats.includes("close call") },
  { id: "z10", name: "Explorer", desc: "Quest in 10 zones.", test: () => S.zones.length >= 10 },
  { id: "z20", name: "World Traveler", desc: "Quest in 20 zones.", test: () => S.zones.length >= 20 },
  { id: "d1", name: "Dungeon Delver", desc: "Clear your first dungeon.", test: () => S.dungeons.length >= 1 },
  { id: "d10", name: "Seasoned Adventurer", desc: "Clear 10 different dungeons.", test: () => S.dungeons.filter(n => !RAIDS.some(r => r[0] === n)).length >= 10 },
  { id: "dall", name: "Dungeon Master", desc: "Clear every dungeon open to your faction.", test: () => factionDungeons().every(d => S.dungeons.includes(d[0])) },
  ...RAIDS.map(r => ({ id: "raid-" + r[4], name: r[0], desc: `Defeat ${RAID_INFO[r[0]].last} (${RAID_INFO[r[0]].size}-man raid).`, test: () => S.dungeons.includes(r[0]) })),
  { id: "raidall", name: "Raider", desc: "Clear every raid, from Molten Core to Naxxramas.", test: () => RAIDS.every(r => S.dungeons.includes(r[0])) },
];
function checkAch(quiet) {
  for (const a of ACH) {
    if (S.ach[a.id] || !a.test()) continue;
    S.ach[a.id] = quiet ? { at: null, p: null, L: null } : stamp();
    if (!quiet) log(`Achievement earned: [${a.name}]`, "ach");
  }
}
function zoneEntry(z) {
  let e = S.zones.find(x => x.z === z);
  if (!e) { e = { z, L0: S.level, L1: S.level, q: 0, k: 0, t0: realNow(), p0: S.time }; S.zones.push(e); }
  return e;
}
function dungeonEntry(n) { return S.dstat[n] || (S.dstat[n] = { runs: 0, at: null, L: null, loot: [] }); }
