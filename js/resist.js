// Resistance as a stat: fire, nature, frost and shadow. The hero's own (the resistance gear chains in raidq.js, the
// Onyxia Scale Cloak) plus the raid's buffs from whoever is in it (a paladin's aura, a shaman's totem, a hunter's
// Aspect of the Wild, a priest's Shadow Protection, a druid's Gift of the Wild). The bosses that check it wipe more the
// further the raid is below what they ask for (`resWipe` in wipeChance): Ragnaros a little, Princess Huhuran more,
// Sapphiron is a wall without frost resistance, Nefarian's Shadow Flame without the Onyxia Scale Cloak. The chains are
// worked on without a goal once their raid comes up (`auto` on the chain), so the timeline holds.
"use strict";

const RES_SCHOOLS = ["fire", "nature", "frost", "shadow"];
// the bosses: [school, the resistance they ask for, how hard they punish the gap]
const RES_BOSS = { Ragnaros: ["fire", 130, 1.2], Magmadar: ["fire", 80, 0.5], "Princess Huhuran": ["nature", 190, 2], Sapphiron: ["frost", 240, 4], "Kel'Thuzad": ["frost", 110, 0.8] };
const newResist = () => ({ cloak: false });
// the hero's own resistance in a school: the gear chain's steps so far, the cloak's bit of shadow
const resGear = sc => (RES_KEYS.includes(sc) ? resNow(sc) : 0) + (sc === "shadow" && S.resist && S.resist.cloak ? 10 : 0);
// the raid's buffs: one of each kind, from the classes in the group (the hero counts)
function resBuffs(sc) {
  const has = c => S.cls === c || (S.party || []).some(m => m.cls === c);
  let r = has("Druid") ? 20 : 0; // Gift of the Wild
  if (sc === "fire" || sc === "frost") r += has("Paladin") || has("Shaman") ? 60 : 0; // the aura or the totem
  if (sc === "nature") r += has("Shaman") || has("Hunter") ? 60 : 0;                  // the totem, Aspect of the Wild
  if (sc === "shadow") r += has("Priest") ? 60 : has("Paladin") ? 60 : 0;             // Shadow Protection, the aura
  return r;
}
const resTotal = sc => resGear(sc) + resBuffs(sc);
// the wipe chance on a boss that checks resistance: up to 1 + punish × the gap (a curve: the last bit matters less)
function resWipe(boss) {
  if (boss === "Nefarian") return S.resist && S.resist.cloak ? 1 : 2.2; // Shadow Flame
  const b = RES_BOSS[boss]; if (!b) return 1;
  const gap = Math.max(0, 1 - resTotal(b[0]) / b[1]);
  return 1 + b[2] * Math.pow(gap, 1.5);
}
function resLine(boss) {
  if (Math.random() < 0.5) return;
  if (boss === "Nefarian") return log(S.resist.cloak ? `Shadow Flame washes over the raid. The Onyxia Scale Cloaks hold.` : `Shadow Flame! Without an Onyxia Scale Cloak, ${S.name} burns.`, "spell");
  const b = RES_BOSS[boss]; if (!b) return;
  const r = resTotal(b[0]);
  log(`${r} ${b[0]} resistance against ${boss} (${resGear(b[0])} from ${S.name}'s gear, ${resBuffs(b[0])} from the raid's buffs; ${boss} wants about ${b[1]}). ${r >= b[1] ? pick(["It barely tickles.", "The healers notice."]) : pick(["Not enough.", "The healers are sweating.", "Somebody says frost resistance in raid chat. Again."])}`, "spell");
}
// the Onyxia Scale Cloak: once the hero has killed Onyxia and can enter Blackwing Lair, a leatherworker makes one
function resCity(q) {
  if (S.level < 60 || S.resist.cloak || !(S.bossKills.Onyxia > 0) || !attuned("Blackwing Lair")) return;
  q.push({ k: "rescloak", d: hasProf("Leatherworking") ? "Making an Onyxia Scale Cloak from a Scale of Onyxia" : "Buying an Onyxia Scale Cloak from a leatherworker", t: sec(10) });
}
function resCloak() {
  if (S.resist.cloak) return;
  if (!hasProf("Leatherworking")) spend("gear", Math.min(S.money, 400000));
  S.resist.cloak = true;
  log(`An Onyxia Scale Cloak for Nefarian's Shadow Flame: kept in the bags and worn for him.`, "loot3");
}
const RES_FINISH = { rescloak() { resCloak(); } };
// the gear tab: the hero's own resistance (without the raid's buffs)
const resTxt = () => RES_SCHOOLS.map(sc => `${sc} ${resGear(sc)}`).join(" · ");
