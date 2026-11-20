// The hero: state and saving to the browser, items, spells and levels, quests, buffs and supplies, a new character.
"use strict";

// ---------- state ----------
let S = null, dirty = true, speed = 1;
const SAVE_KEY = "wowquest-v1", DEV_KEY = "wowquest-dev";
let dev = false;
try { dev = localStorage.getItem(DEV_KEY) === "1"; } catch (e) {}

const SYL1 = ["Thal", "Bran", "Kor", "Gar", "Ael", "Mor", "Dra", "Vel", "Tor", "Gri", "Zul", "Ker", "Ash", "Fen", "Bel", "Ul", "Rok", "Sha"];
const SYL2 = ["a", "e", "i", "o", "u", "ar", "or", "en", "ae", "ra", ""];
const SYL3 = ["dris", "mok", "thas", "gar", "win", "nor", "dil", "rath", "zek", "ius", "ka", "lyn", "grim", "dor", "ash"];
function randomName() { return pick(SYL1) + pick(SYL2) + pick(SYL3); }

function load() { try { const t = localStorage.getItem(SAVE_KEY); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function save() { if (!S) return; S.savedAt = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); const el = document.getElementById("saved"); if (el) el.textContent = "saved"; } catch (e) {} }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

const cls = () => CLASSES[S.cls];
const race = () => RACES[S.race];
const xpNeed = L => XP_TABLE[L] || 1;
const mobXp = (mobL, L = S.level) => Math.round((45 + 5 * mobL) * clamp(1 + 0.05 * (mobL - L), 0.4, 1.2));
const isCaster = () => cls().prime === "INT" && !(S.cls === "Shaman" && S.spec === 1) && !(S.cls === "Druid" && S.spec === 1);
const bagCap = () => 16 + S.bagSlots.reduce((a, b) => a + b, 0);
const city = () => race().city;
function log(txt, kind = "") { S.log.unshift({ t: S.time, txt, k: kind, id: ++S.logId }); if (S.log.length > 220) S.log.length = 220; dirty = true; }
const spellName = n => n.replace("{city}", city());

function route() { return routeFor(S.race); }
function curZone() { const r = route(); return S.leg < r.length ? r[S.leg].z : S.endZone; }
function hub() { return ZONE_HUB(curZone(), S.faction); }
function hpMax() { return Math.round((cls().hp * S.level + S.stats.STA * 10) * talMod("h")); }
function resMax() { return cls().mp ? cls().mp * S.level + S.stats.INT * 15 : 100; }
function talents() {
  const pts = Math.max(0, S.level - 9), t = [0, 0, 0], second = (S.spec + 1) % 3;
  t[S.spec] = Math.min(pts, 31); t[second] = Math.min(pts - t[S.spec], 20); t[S.spec] += pts - t[S.spec] - t[second];
  return t;
}

// ---------- items ----------
const power = it => it ? it.ilvl * QMULT[it.q] : -1;
function armorType(L = S.level) { const a = cls().armor; return L >= 40 ? a[1] : a[0]; }
function tierOf(list, ilvl) { return list[clamp(Math.floor((ilvl - 1) / 6), 0, list.length - 1)]; }
function sfx() { const s = pick(cls().sfx); return /^(Strength|Agility|Stamina|Intellect|Spirit)$/.test(s) ? " of " + s : " of the " + s; }
function makeItem(slot, ilvl, q) {
  ilvl = clamp(Math.round(ilvl), 1, 80);
  const c = cls(); let name;
  if (ARMOR_BASE.Cloth[slot]) { const t = armorType(); name = tierOf(TIERS[t], ilvl) + " " + ARMOR_BASE[t][slot]; }
  else if (slot === "Back") name = tierOf(TIERS.Cloth, ilvl) + " " + pick(JEWEL.Back);
  else if (JEWEL[slot]) name = tierOf(TIERS.Gem, ilvl) + " " + pick(JEWEL[slot]);
  else { const base = pick(slot === "Main Hand" ? c.main : slot === "Off Hand" ? c.off : c.ranged); name = tierOf(MYSTIC.test(base) ? TIERS.Mystic : TIERS.Metal, ilvl) + " " + base; }
  if (q >= 2) name += sfx();
  return { name, ilvl, q, slot };
}
const SLOT_WORDS = [
  [/Bow\b|Gun\b|Rifle|Striker.s Mark|Crossbow|Wand\b|Twitchbow|Shortbow|Libram|Idol|Totem/, "Ranged"], [/Buckler|Shield|Deflector|Guardian|Aegis/, "Off Hand"],
  [/Cape|Cloak|Shroud|Drape|Hide$/, "Back"], [/Shoulder|Pauldrons|Mantle|Spaulders/, "Shoulder"], [/Leggings|Legguards|Dungarees|Legplates|Pants/, "Legs"],
  [/Belt|Girdle|Sash|Waistband/, "Waist"], [/Bracers|Bindings|Shackles|Bracelets|Cuffs/, "Wrist"], [/Gloves|Gauntlets|Fists|Knuckles|Handguards/, "Hands"],
  [/Boots|Ankleguards|Galoshes|Sabatons|Footpads|Treads/, "Feet"], [/Helm|Hood|Chapeau|Cap$|Crown|Barbute|Mask|Circlet|Head of/, "Head"],
  [/Armor|Robe|Overshirt|Breastplate|Tunic|Chain|Hauberk|Apron|Vest/, "Chest"], [/Ring\b|Band\b|Seal\b|Loop\b/, "Finger"],
  [/Amulet|Necklace|Choker|Pendant|Collar|Medallion|Heart|Diamond/, "Neck"],
  [/Talisman|Charm|Carrot|Reins|Caller|Stone|Shard|Skull|Backpack|Grimoire|Tear$|Gem$|Eye of Moam/, "Trinket"],
];
function namedSlot(n) { for (const [re, s] of SLOT_WORDS) if (re.test(n)) return s; return "Main Hand"; }
function setPiece(tier, ilvl, slot) {
  slot = slot || pick(SET_SLOTS[tier] || SET_SLOTS[0]); const set = SETS[S.cls][tier];
  return { name: (SETSHORT[set] || set) + " " + ARMOR_BASE[armorType()][slot], ilvl, q: tier ? 4 : 3, slot, set: tier };
}
const sellValue = it => Math.round(it.ilvl * it.ilvl * 2 * QMULT[it.q]);
// equip if better, otherwise into the bags as something to sell
function gain(it, how) {
  const cur = S.equip[it.slot];
  if (power(it) > power(cur)) {
    S.equip[it.slot] = it;
    log(`${how} ${it.name} (item level ${it.ilvl}). Equipped.`, "loot" + Math.min(5, Math.max(2, it.q)));
    if (cur && cur.q >= 1) addBag({ name: cur.name, val: sellValue(cur), q: cur.q });
    return true;
  }
  if (it.q >= 3) log(`${how} ${it.name}, but it's no upgrade. Into the bags.`, "loot" + Math.min(4, it.q));
  addBag({ name: it.name, val: sellValue(it), q: it.q });
  return false;
}
// a bigger bag than the smallest one carried (or a free bag slot)
const bagUpgrade = bag => S.bagSlots.length < 4 || Math.min(...S.bagSlots) < bag[2];
function giveBag(bag, how) {
  if (S.bagSlots.length < 4) S.bagSlots.push(bag[2]); else S.bagSlots[S.bagSlots.indexOf(Math.min(...S.bagSlots))] = bag[2];
  log(`${how} ${article(bag[1])} (${bag[2]} slots).`, "gold");
}
function addBag(x) { if (S.bags.length < bagCap()) S.bags.push(x); }
// the slot with the weakest item (the first one, on a tie)
function weakestSlot() { let slot = SLOTS[0]; SLOTS.forEach(s => { if (power(S.equip[s]) < power(S.equip[slot])) slot = s; }); return slot; }
// gear for the level: about 1 when it's level-appropriate
const gearFor = () => clamp(gearScore() / Math.max(1, S.level), 0.5, 1.4);
function gearScore() { let n = 0, s = 0; for (const k of SLOTS) { const it = S.equip[k]; s += it ? power(it) + enchBonus(it) * QMULT[it.q] : 0; n++; } return s / n; }

// ---------- spells & level ups ----------
function trainSpells() {
  const c = cls(); let cost = 0; const learned = [], ranked = [];
  for (const sp of c.list) {
    if (sp.lvl > S.level) continue;
    const name = spellName(sp.name), rank = RANK_SPELL(sp, S.level);
    if (!(name in S.spells)) { S.spells[name] = rank; learned.push(name); cost += S.level * S.level * 4 + 10; }
    else if (S.spells[name] < rank) { S.spells[name] = rank; ranked.push(`${name} (Rank ${rank})`); cost += S.level * S.level * 4 + 10; }
    if (/^Summon (Warhorse|Felsteed)$/.test(name)) S.mount = Math.max(S.mount, 1);
    if (/^Summon (Charger|Dreadsteed)$/.test(name)) S.mount = 2;
  }
  cost = Math.min(cost, S.money); S.money -= cost;
  if (learned.length) log(`Learned ${learned.join(", ")}.`, "spell");
  if (ranked.length) log(`Trained ${ranked.join(", ")}.`, "spell");
  if (!learned.length && !ranked.length) log(`Nothing new to learn yet.`, "spell");
  else if (cost) log(`Training cost ${moneyTxt(cost)}.`, "gold");
}
let xpPop = 0; // experience gained since the last frame, shown as a green "+x" on the experience bar
function gainXp(n) {
  if (S.level >= 60) return;
  S.xp += Math.round(n); xpPop += Math.round(n);
  while (S.level < 60 && S.xp >= xpNeed(S.level)) {
    S.xp -= xpNeed(S.level); S.level++;
    const c = cls(); const gains = [];
    STATS.forEach((k, i) => { const g = Math.floor(c.w[i] / 2) + (Math.random() < (c.w[i] % 2) / 2 + 0.25 ? 1 : 0) + (k === "STA" ? 1 : 0); if (g) { S.stats[k] += g; gains.push(`+${g} ${k}`); } });
    if (S.level === 60) { S.xp = 0; log(`DING! Level 60! ${S.name} has reached the level cap after ${fmtPlayed(S.time)} played.`, "ding"); }
    else log(`Level ${S.level}! ${gains.join(", ")}.`, "lvl");
    if (S.level === 10) log(`Talent points unlocked. Going ${c.trees[S.spec]}.`, "spell");
    talentGains(S.level - 1, S.level).forEach(g => log(`Talent: ${g}.`, "spell"));
  }
  dirty = true;
}

// ---------- quests ----------
const PARTS = [
  [/Wolf|Prowler|Worg|Coyote|Hyena|Hound|Darkhound|Jackal/, ["Fang", "Pelt", "Paw"]], [/Boar|Tusk|Goretusk|Plainstrider|Strider/, ["Tusk", "Flank", "Feather"]],
  [/Bear|Ursa|Grizzly|Mauler/, ["Pelt", "Claw"]], [/Spider|Widow|Tarantula|Webwood|Webspinner|Skitterer/, ["Silk Gland", "Venom Sac"]],
  [/Murloc|Mirefin|Bluegill|Sorrowscale|Tidehunter/, ["Fin", "Eye"]], [/Raptor|Scytheclaw|Ravasaur|Stegodon|Stomper/, ["Talon", "Horn"]],
  [/Crocolisk|Thresher|Basilisk|Snapjaw|Tortoise/, ["Scale", "Tooth"]], [/Harpy|Owl|Fleshripper|Buzzard|Roc|Hippogryph|Wyvern|Pterrordax|Chimaera|Darter/, ["Feather", "Talon"]],
  [/Kobold/, ["Candle", "Ear"]], [/Defias|Syndicate|Bandit|Brigand|Bloodsail|Smuggler|Highwayman|Pirate/, ["Red Bandana", "Orders"]],
  [/Gnoll|Mongrel|Mosshide/, ["Paw", "Mane"]], [/Skeleton|Skeletal|Rotted|Zombie|Ghoul|Rattlecage|Rotting|Crypt|Scourge|Plague|Dead/, ["Bone Fragment", "Ichor"]],
  [/Elemental|Golem|Ooze|Sludge|Dust Devil|Watcher|Stormer|Rumbler|Tar Beast|Horror/, ["Core", "Essence"]], [/Scorpid|Silithid|Hive/, ["Stinger", "Carapace"]],
  [/Tiger|Panther|Saber|Cougar|Lion|Leopard|Stalker|Jaguar|Cheetah/, ["Pelt", "Fang"]],
];
function mobPart(mob) { for (const [re, a] of PARTS) if (re.test(mob)) return mob.replace(/^(Young|Elder|Dire|Giant|Greater|Adult) /, "") + " " + pick(a); return mob + " " + pick(["Trophy", "Totem", "Sample", "Ear"]); }
function zoneMobs(z = curZone()) { return ZONES[z].mobs; }
function newQuest() {
  const z = curZone(), list = ZONES[z].quests, i = S.zq[z] || 0, mob = pick(zoneMobs(z));
  let name;
  if (i < list.length) { name = list[i]; S.zq[z] = i + 1; }
  else { const taken = S.quests.map(x => x.name); const opts = [`${mob} Menace`, `Thinning the ${plural(mob)}`, `Bounty: ${plural(mob)}`, `Culling the ${plural(mob)}`, `Trouble in ${z}`, `A Task for ${hub()}`, `${hub()} Needs You`, `Supplies for ${hub()}`].filter(n => !taken.includes(n)); name = pick(opts.length ? opts : [`${plural(mob)} Again`]); }
  const q = { id: ++S.qid, name, zone: z, mob, prog: 0, xp: 0, money: 0 };
  const wanted = name.match(/^Wanted:? ?-? ?"?([^"]+?)"?$/i);
  if (wanted) { q.type = "elite"; q.mob = wanted[1].trim(); q.max = 1; }
  else if (Math.random() < 0.5) { q.type = "col"; q.item = mobPart(mob); q.max = 5 + R(6); }
  else { q.type = "kill"; q.max = 6 + R(7); }
  const L = S.level;
  q.xp = Math.round(mobXp(L) * (q.type === "elite" ? 14 : 7 + R(5)) * 1.15);
  q.money = Math.round((L * L * 3 + 60) * (0.7 + Math.random() * 0.6));
  S.quests.push(q);
  return q;
}
function questText(q) { return q.type === "col" ? `${plural(q.item)} ${q.prog}/${q.max}` : q.type === "elite" ? `${q.mob} slain ${q.prog}/1` : `${plural(q.mob)} slain ${q.prog}/${q.max}`; }
const questDone = q => q.prog >= q.max;
function plural(s) { return /Tooth$/.test(s) ? s.slice(0, -5) + "Teeth" : /[^aeiou]y$/.test(s) ? s.slice(0, -1) + "ies" : /(ss|x|ch|sh)$/.test(s) ? s + "es" : /s$/.test(s) ? s : /(Wolf|Thief)$/.test(s) ? s.slice(0, -1) + "ves" : s + "s"; }

// ---------- buffs & supplies ----------
const FOREVER = 1e15;
const tierAt = (list, L = S.level) => { let r = null; for (const e of list) if (e[0] <= L) r = e; return r; };
const ROMAN = ["", "", " II", " III", " IV", " V", " VI", " VII", " VIII"];
const HP_POT = [[1, "Minor Healing Potion"], [3, "Lesser Healing Potion"], [12, "Healing Potion"], [21, "Greater Healing Potion"], [35, "Superior Healing Potion"], [45, "Major Healing Potion"]];
const MP_POT = [[5, "Minor Mana Potion"], [14, "Lesser Mana Potion"], [22, "Mana Potion"], [31, "Greater Mana Potion"], [41, "Superior Mana Potion"], [49, "Major Mana Potion"]];
const ELIXIR = {
  STR: [[1, "Elixir of Lion's Strength"], [20, "Elixir of Ogre's Strength"], [46, "Elixir of Giants"]],
  AGI: [[2, "Elixir of Minor Agility"], [27, "Elixir of Agility"], [38, "Elixir of Greater Agility"], [46, "Elixir of the Mongoose"]],
  INT: [[10, "Elixir of Wisdom"], [37, "Elixir of Greater Intellect"], [47, "Greater Arcane Elixir"]],
};
const STONE = [[1, "Rough"], [15, "Coarse"], [25, "Heavy"], [35, "Solid"], [45, "Dense"]];
// class buffs: each entry is a chain, best spell first; minutes, 0 = until death
const CLASS_BUFFS = {
  Mage: () => [[["Arcane Intellect"], 30], [["Ice Armor", "Frost Armor"], 30]],
  Priest: () => [[["Power Word: Fortitude"], 30], [["Inner Fire"], 10]],
  Druid: () => [[["Mark of the Wild"], 30], [["Thorns"], 10]],
  Paladin: () => [[S.spec === 2 ? ["Retribution Aura", "Devotion Aura"] : ["Devotion Aura"], 0], [S.spec === 0 ? ["Blessing of Wisdom", "Blessing of Might"] : ["Blessing of Might"], 5]],
  Hunter: () => [[["Aspect of the Hawk", "Aspect of the Monkey"], 0], [["Call Pet"], 0]],
  Warlock: () => [[["Demon Armor", "Demon Skin"], 30], [["Summon Voidwalker", "Summon Imp"], 0]],
  Shaman: () => [[["Lightning Shield"], 10], [S.spec === 1 ? ["Windfury Weapon", "Flametongue Weapon", "Rockbiter Weapon"] : ["Flametongue Weapon", "Rockbiter Weapon"], 5]],
  Warrior: () => [[S.spec === 2 ? ["Defensive Stance", "Battle Stance"] : ["Battle Stance"], 0]],
  Rogue: () => [],
};
const usesStone = () => S.cls === "Warrior" || S.cls === "Paladin" || (S.cls === "Rogue" && !("Instant Poison" in S.spells));
const stoneName = () => tierAt(STONE)[1] + (S.cls === "Paladin" ? " Weightstone" : " Sharpening Stone");
const hpPot = () => tierAt(HP_POT)[1], mpPot = () => (tierAt(MP_POT) || MP_POT[0])[1];
// the stat that matters most for this class and spec (feral druids and enhancement shamans don't want intellect)
const mainStat = () => isCaster() ? "INT" : cls().prime !== "INT" ? cls().prime : S.cls === "Shaman" ? "STR" : "AGI";
function elixirName() { const e = tierAt(ELIXIR[mainStat()]); return e && e[1]; }
function flaskName() { return S.cls === "Priest" || (S.cls === "Druid" && S.spec === 2) || (S.cls === "Paladin" && S.spec === 0) ? "Flask of Distilled Wisdom" : isCaster() ? "Flask of Supreme Power" : "Flask of the Titans"; }

// food & drink: everyone eats, mana users also drink; mages conjure their own
const CONJURED = {
  drink: ["Conjured Water", "Conjured Fresh Water", "Conjured Purified Water", "Conjured Spring Water", "Conjured Mineral Water", "Conjured Sparkling Water", "Conjured Crystal Water"],
  food: ["Conjured Muffin", "Conjured Bread", "Conjured Rye", "Conjured Pumpernickel", "Conjured Sourdough", "Conjured Sweet Roll", "Conjured Cinnamon Roll"],
};
const CONJURE_SPELL = { drink: "Conjure Water", food: "Conjure Food" };
const restKinds = () => cls().mp ? ["food", "drink"] : ["food"];
const canConjure = k => S.cls === "Mage" && CONJURE_SPELL[k] in S.spells;
function rationName(k) {
  if (canConjure(k)) return CONJURED[k][Math.min(6, S.spells[CONJURE_SPELL[k]] - 1)];
  return (k === "drink" ? DRINK : FOOD)[Math.min(5, Math.floor(S.level / 10))];
}
// a rest task that eats from the bags, or a slow rest when they are empty
function restTask() {
  if (S.cons.band > 0 && (S.hpF ?? 1) < 0.6) { S.cons.band--; return { k: "rest", d: `Using ${article(profItem(BANDAGES, "First Aid"))} and catching a breath`, t: sec(9) }; }
  const have = restKinds().filter(k => S.cons[k] > 0);
  have.forEach(k => S.cons[k]--);
  if (!have.length) return { k: "rest", d: cls().mp ? "Out of food and water. Sitting down to recover slowly" : "Out of food. Sitting down to recover slowly", t: sec(26) };
  const words = have.map(k => (k === "drink" ? "drinking " : "eating ") + rationName(k));
  words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return { k: "rest", d: words.join(" and "), t: sec(14) };
}
// what to do about rations at the quest hub: conjure (mage) or buy from the innkeeper
function rationTasks(where) {
  const out = [];
  for (const k of restKinds()) {
    if (S.cons[k] >= 8) continue;
    if (canConjure(k)) out.push({ k: "conjure", kind: k, d: `Casting ${CONJURE_SPELL[k]} for a stack of ${rationName(k)}`, t: sec(3) });
    else out.push({ k: "ration", kind: k, d: `Buying ${rationName(k)} from the innkeeper in ${where}`, t: sec(4) });
  }
  return out;
}
const rationPrice = () => Math.round(5 + S.level * S.level * 0.15);

// current health / mana (fractions, display only): fights drain, rests and walking refill
const FIGHTS = ["kill", "trash", "boss"];
function vitalEnd(t) {
  const f = partyFight(t); if (f && f.hero) return [f.hero.end, f.hero.mpEnd];
  if (t.ve) return t.ve;
  const hp = S.hpF ?? 1, mp = S.mpF ?? 1, r = rnd, lo = x => Math.max(0.04, x), up = x => Math.min(1, x);
  let e;
  if (t.k === "kill") {
    const n = 1 + 0.8 * ((t.mobs || [1]).length - 1), sf = S.party ? null : soloFight(t);
    const tm = talMod("m");
    e = t.elite ? [lo(hp - r(0.35, 0.6)), lo(mp - r(0.3, 0.5) * tm)] : [lo(hp - r(0.07, 0.17) * n), lo(mp - r(0.08, 0.18) * n * tm)];
    if (sf) e[0] = sf.end;
  }
  else if (t.k === "trash" || t.k === "boss") { const d = fightDrop(heroRole(), t.k); e = [lo(hp - d[0]), lo(mp - d[1])]; }
  else if (t.k === "rest" || t.k === "rez" || t.k === "regroup") e = [1, 1];
  else if (t.k === "ghost") e = [0, 0];
  else if (t.k === "buff" || t.k === "conjure" || t.k === "dbuff") e = [up(hp + 0.05), lo(mp - 0.08)];
  else e = [up(hp + 0.25), up(mp + 0.15)];
  return (t.ve = e);
}
// fights drop in blocks, one per finished cast; everything else moves smoothly
function poolProgress(t) {
  const p = Math.min(1, t.el / t.t);
  if (!FIGHTS.includes(t.k)) return p;
  const n = (t.casts && t.casts.length) || 4;
  return Math.floor(p * n) / n;
}
function vitalsNow() {
  const t = S.task; let hp = S.hpF ?? 1, mp = S.mpF ?? 1;
  if (t) {
    const p = poolProgress(t), raw = Math.min(1, t.el / t.t), e = vitalEnd(t), f = partyFight(t);
    hp = f && f.hero ? hpAt(f.hero, raw) : t.k === "kill" && !S.party ? hpAt(soloFight(t), raw) : hp + (e[0] - hp) * p; mp += (e[1] - mp) * p;
  }
  return [hp, mp];
}
// rage builds during a fight and fades after; energy dips and ticks back
function secondPool() {
  const t = S.task, fight = t && FIGHTS.includes(t.k), p = t ? poolProgress(t) : 0;
  return pool2(cls().res, fight, p);
}

// buffs the hero wants up right now: [{name, min, item, cast}]
function wantedBuffs() {
  const out = [];
  for (const [chain, min] of CLASS_BUFFS[S.cls]()) { const n = chain.find(x => x in S.spells); if (n) out.push({ name: n, min, cast: /^(Summon|Call)/.test(n) ? `${n.replace("Summon", "Summoning").replace("Call Pet", "Calling your pet")}` : `Casting ${n}` }); }
  if (S.cls === "Rogue" && "Instant Poison" in S.spells) { const n = "Instant Poison" + ROMAN[S.spells["Instant Poison"]]; out.push({ name: n, min: 30, cast: `Applying ${n} to both daggers` }); }
  else if (usesStone() && S.cons.stone > 0) out.push({ name: stoneName(), min: 30, item: "stone", cast: `Using ${article(stoneName())} on your weapon` });
  if (S.cons.feast > 0) out.push({ name: "Well Fed", min: 15, item: "feast", cast: `Eating ${profItem(DISHES, "Cooking")} for the Well Fed buff` });
  return out;
}
const buffUp = n => (S.buffs[n] || 0) > S.time;
function missingBuff() { return wantedBuffs().find(b => !buffUp(b.name)); }
function applyBuff(b) {
  if (b.item) { if (!(S.cons[b.item] > 0)) return; S.cons[b.item]--; }
  S.buffs[b.name] = b.min ? S.time + b.min * MIN : FOREVER;
}
function activeBuffs() { return Object.keys(S.buffs).filter(buffUp); }
// a fully buffed hero kills a little faster (up to 6%)
const buffSpeed = () => 1 - 0.015 * Math.min(4, activeBuffs().length);
function loseBuffs() { S.buffs = {}; }
// elixir before an elite or a dungeon, a flask before a raid
function drinkElixir(raid) {
  if (raid && S.cons.flask > 0) { S.cons.flask--; S.buffs[flaskName()] = S.time + 120 * MIN; return flaskName(); }
  const n = elixirName(); if (!n || !(S.cons.elix > 0)) return null;
  S.cons.elix--; S.buffs[n] = S.time + 60 * MIN; return n;
}
// fold a potion into a hard fight's casts
function potionCasts(out) {
  const at = () => Math.max(2, out.length - 1 - R(2));
  if (S.cons.hp > 0 && Math.random() < 0.3) { S.cons.hp--; out.splice(at(), 0, hpPot()); }
  if (cls().mp && S.cons.mp > 0 && S.level >= 5 && Math.random() < 0.35) { S.cons.mp--; out.splice(at(), 0, mpPot()); }
}
const FLASK_PRICE = 150000;
// restock at the capital; returns the copper spent
function buySupplies(budget) {
  const L = S.level, price = tier => Math.round(tier * tier * 3 + 30), want = [["hp", 5, tierAt(HP_POT)[0]]];
  if (cls().mp && L >= 5) want.push(["mp", 5, tierAt(MP_POT)[0]]);
  if (elixirName()) want.push(["elix", 3, tierAt(ELIXIR[mainStat()])[0]]);
  if (usesStone()) want.push(["stone", 4, tierAt(STONE)[0]]);
  let spent = 0; const got = [];
  for (const [k, n, tier] of want) {
    const need = n - (S.cons[k] || 0), p = price(tier); let b = 0;
    while (b < need && spent + p <= budget) { b++; spent += p; }
    if (b) { S.cons[k] = (S.cons[k] || 0) + b; got.push(k); }
  }
  // a flask for every raid night at 60 (alchemists make their own)
  if (S.level >= 60 && !(hasProf("Alchemy") && profSkill("Alchemy") >= 300)) {
    let b = 0; while ((S.cons.flask || 0) + b < 2 && spent + FLASK_PRICE <= budget * 3 && spendable() - spent >= FLASK_PRICE * 3) { b++; spent += FLASK_PRICE; }
    if (b) { S.cons.flask = (S.cons.flask || 0) + b; got.push("flask"); }
  }
  spend("sup", spent);
  if (spent) log(`Restocked supplies (${got.map(k => ({ hp: hpPot(), mp: mpPot(), elix: elixirName(), stone: stoneName(), flask: flaskName() })[k]).map(plural).join(", ")}) for ${moneyTxt(spent)}.`, "gold");
}

// ---------- new character ----------
function newHero(f) {
  const r = RACES[f.race], c = CLASSES[f.cls], stats = {};
  STATS.forEach((k, i) => stats[k] = r.base[i] + Math.round(c.w[i] * 0.7));
  S = { v: 1, name: (f.name || "").trim() || randomName(), race: f.race, cls: f.cls, spec: f.spec, faction: r.f,
    level: 1, xp: 0, money: 0, stats, equip: {}, bags: [], bagSlots: [], spells: {}, leg: 0, endZone: "Eastern Plaguelands",
    loc: "start", arrived: null, quests: [], zq: {}, done: [], dungeons: [], nextCity: 2, cycleQ: 0, mount: 0,
    buffs: {}, cons: { hp: 0, mp: 0, elix: 0, stone: 0, food: 10, drink: CLASSES[f.cls].mp ? 10 : 0, band: 0, bomb: 0, feast: 0, flask: 0 },
    prof: newProf(pairsFor(f.cls).includes(f.prof) ? f.prof : PAIR_FOR[f.cls], 1), elites: [], feats: [], zones: [], dstat: {}, ach: {},
    parts: {}, legendaries: [], lock: {}, runs: 0, trip: 0, cd: {},
    kills: 0, deaths: 0, qdone: 0, qid: 0, since: 0, curQ: 0, repair: 0, dg: null, time: 0, log: [], logId: 0, task: null, queue: [], speed: 1, savedAt: Date.now() };
  SLOTS.forEach(s => S.equip[s] = null);
  S.equip["Main Hand"] = { name: c.start, ilvl: 2, q: 1, slot: "Main Hand" };
  ["Chest", "Legs", "Feet"].forEach(s => { const it = makeItem(s, 1, 1); S.equip[s] = it; });
  trainSpells();
  S.log = [];
  log(`${S.name} the ${S.race} ${S.cls} awakens in ${curZone()}. The ${S.faction} needs heroes.`, "zone");
  save();
}
