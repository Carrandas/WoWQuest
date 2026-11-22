// Pre-raid best in slot: the dungeon set (Tier 0) piece by piece, the four big pieces from their own bosses (the helm
// from Darkmaster Gandling, the shoulders from Overlord Wyrmthalak, the chest from General Drakkisath, the legs from
// Baron Rivendare), the rest from any level 55+ dungeon; the "preraid" goal sends the hero where a missing piece drops.
// Then Dungeon Set 2 (Tier 0.5): the long upgrade chain from Deliana in Ironforge or Mokvar in Orgrimmar (Bodley's
// Ghost Revealer, Kormok, Jarien and Sothos, Mor Grayhoof, Isalien, Lord Valthalak), an ATT_CHAINS goal (raidq.js runs
// it, classq.js hands out the set).
"use strict";

const DSET_SRC = { Head: ["Scholomance", "Darkmaster Gandling"], Shoulder: ["Lower Blackrock Spire", "Overlord Wyrmthalak"], Chest: ["Upper Blackrock Spire", "General Drakkisath"], Legs: ["Stratholme", "Baron Rivendare"] };
const DSET_FREE = () => SET_SLOTS[0].filter(s => !DSET_SRC[s]);
const SET05 = { Warrior: "Heroism", Paladin: "Soulforge", Hunter: "Beastmaster", Rogue: "Darkmantle", Priest: "Virtue", Shaman: "Five Thunders", Mage: "Sorcerer's", Warlock: "Deathmist", Druid: "Feralheart" };
const newPreb = () => ({ slots: [] });
const dsetHave = () => S.preb.slots.length;
const dsetMissing = () => SET_SLOTS[0].filter(s => !S.preb.slots.includes(s));
// a dungeon set piece from this boss, or null (lootDrop asks, in level 55+ dungeons at 58+): its own slot for the
// four big bosses, otherwise one of the free slots (a missing one first with the goal)
function dsetDrop(boss) {
  const pinned = Object.keys(DSET_SRC).find(s => DSET_SRC[s][1] === boss);
  if (pinned) return Math.random() < (hasGoal("preraid") ? 0.5 : 0.35) ? pinned : null;
  if (Math.random() >= 0.15) return null;
  const free = DSET_FREE(), want = free.filter(s => !S.preb.slots.includes(s));
  return hasGoal("preraid") && want.length ? pick(want) : pick(free);
}
function dsetGot(slot) {
  if (S.preb.slots.includes(slot)) return;
  S.preb.slots.push(slot);
  if (dsetHave() === SET_SLOTS[0].length) log(`The ${SETS[S.cls][0]} set is complete: all eight pieces of the dungeon set.`, "ach");
}
// with the goal: the dungeon of a missing big piece, or any level 55+ dungeon for the rest (goalDungeon)
function dsetDungeon() {
  if (!hasGoal("preraid") || Math.random() >= 0.7) return null;
  const big = dsetMissing().filter(s => DSET_SRC[s]);
  if (big.length && (Math.random() < 0.7 || dsetMissing().length === big.length)) return instanceRow(DSET_SRC[pick(big)][0]);
  return instanceRow(pick(["Lower Blackrock Spire", "Upper Blackrock Spire", "Scholomance", "Stratholme", "Dire Maul"]));
}
// Molten Core past the first three bosses needs the pre-raid set: worn dungeon set pieces count one each, Tier 0.5
// (and raid set pieces) a bit more, and every missing piece makes the later bosses wipe more (up to DSET_WIPE more)
const DSET_WIPE = 1.3;
const dsetReady = () => Math.min(8, SET_SLOTS[0].reduce((a, s) => { const it = S.equip[s], st = it && it.set; return a + (st == null ? 0 : st === 0 ? 1 : 1.3); }, 0));
const dsetWipe = (dn, i) => dn === "Molten Core" && i >= 3 ? 1 + DSET_WIPE * (1 - dsetReady() / 8) : 1;
function dsetGoals(out) {
  if (S.level < 60 || dsetHave() >= SET_SLOTS[0].length) return;
  const n = SET_SLOTS[0].length;
  out.push({ id: "preraid", name: "Pre-raid best in slot", what: `Every free evening in the level 60 dungeons for the ${SETS[S.cls][0]} set: the helm from Darkmaster Gandling, the shoulders from Overlord Wyrmthalak, the chest from General Drakkisath, the legs from Baron Rivendare, the rest from any of them. One to three weeks.`,
    prog: () => [dsetHave(), n], txt: () => `${dsetHave()} of ${n} pieces${dsetMissing().length && dsetMissing().length <= 3 ? ` · missing: ${dsetMissing().join(", ")}` : ""}`, done: () => dsetHave() >= n });
}

// ---------- Dungeon Set 2 ----------
Object.assign(ATT_CHAINS, {
  dset2: { cls: Object.keys(SETS), goal: true, name: "Dungeon Set 2",
    item: () => SET_SLOTS[0].map(slot => ({ name: `${SET05[S.cls]} ${ARMOR_BASE[armorType()][slot]}`, ilvl: 66, q: 3, slot, set: 0.5 })),
    need: () => dsetHave() < SET_SLOTS[0].length ? `Needs the full dungeon set (${dsetHave()} of ${SET_SLOTS[0].length})` : null,
    what: "The upgrade for the dungeon set: Deliana in Ironforge (Mokvar in Orgrimmar), Bodley's Extra-Dimensional Ghost Revealer, the spirits called with the Brazier of Beckoning in Scholomance, Stratholme, Lower Blackrock Spire and Dire Maul, the materials for every piece, and Lord Valthalak in Upper Blackrock Spire. The reward: Tier 0.5, the whole set. One to two weeks.",
    steps: [
      ["go", "An Earnest Proposition: Deliana in Ironforge (Mokvar in Orgrimmar) has an offer for a hero in a full dungeon set", 40],
      ["go", "A Supernatural Device: Bodley's Extra-Dimensional Ghost Revealer, on top of Blackrock Mountain", 70],
      ["go", "The reagents for the Brazier of Beckoning: Bodley wants something from every corner of the world", 150, "x3"],
      ["run", "Kormok in Scholomance, called with the Brazier of Beckoning (if the group survives him)", "Scholomance", 0.5],
      ["run", "Jarien and Sothos in Stratholme", "Stratholme", 0.5],
      ["run", "Mor Grayhoof in Lower Blackrock Spire", "Lower Blackrock Spire", 0.5],
      ["run", "Isalien in Dire Maul", "Dire Maul", 0.5],
      ["go", "Bodley's Brazier of Invocation: more reagents, and the Mark of Valthalak", 150, "x2"],
      ["gold", "Just Compensation: the materials for every piece (Arcanite, Thorium, Runecloth, Enchanted Leather, Righteous Orbs)", 1500000],
      ["run", "Lord Valthalak in Upper Blackrock Spire, summoned with the Brazier of Invocation", "Upper Blackrock Spire", 0.4],
      ["go", "Bodley and the reforged set: Tier 0.5", 40],
    ] },
});
// old saves: the dungeon set pieces worn count as found
function prebMigrate() {
  if (S.preb) return;
  S.preb = newPreb();
  SET_SLOTS[0].forEach(s => { const it = S.equip[s]; if (it && it.set === 0) S.preb.slots.push(s); });
}
