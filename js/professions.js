// Professions and gold: gathering, crafting, where the gold goes, enchants.
"use strict";

// ---------- professions: gathering in the field, crafting on city visits ----------
// skill tiers like back then: Apprentice from level 5, Journeyman 10, Expert 20, Artisan 35
const PROF_TIERS = [[35, 300, "Artisan"], [20, 225, "Expert"], [10, 150, "Journeyman"], [5, 75, "Apprentice"]];
const trainCap = (L = S.level) => (PROF_TIERS.find(x => L >= x[0]) || [0, 0])[1];
const tierName = cap => (PROF_TIERS.find(x => x[1] === cap) || [0, 0, "Untrained"])[2];
// the pairs a hero can pick: anyone can do herbs + alchemy or mining + engineering, the rest goes by armor
const PROF_PAIRS = { smith: ["Mining", "Blacksmithing"], leather: ["Skinning", "Leatherworking"], tailor: ["Tailoring", "Enchanting"], herb: ["Herbalism", "Alchemy"], eng: ["Mining", "Engineering"] };
const PAIR_FOR = { Warrior: "smith", Paladin: "smith", Hunter: "leather", Rogue: "leather", Shaman: "leather", Druid: "leather", Priest: "tailor", Mage: "tailor", Warlock: "tailor" };
const pairsFor = c => [PAIR_FOR[c], "herb", "eng"];
const pairLabel = k => PROF_PAIRS[k].join(" + ");
const SECONDARY = ["First Aid", "Cooking"];
// materials in five tiers, found by zone level and skill
const MAT_REQ = [1, 65, 125, 175, 230];
const MATS = {
  Mining: ["Copper Ore", "Tin Ore", "Iron Ore", "Mithril Ore", "Thorium Ore"],
  Herbalism: ["Peacebloom", "Briarthorn", "Kingsblood", "Sungrass", "Dreamfoil"],
  Skinning: ["Light Leather", "Medium Leather", "Heavy Leather", "Thick Leather", "Rugged Leather"],
  Cloth: CLOTH,
  Dust: ["Strange Dust", "Soul Dust", "Vision Dust", "Dream Dust", "Illusion Dust"],
  Meat: ["Boar Meat", "Bear Meat", "Raptor Flank", "Tender Wolf Meat", "Chimaera Leg"],
};
const NODES = { Mining: ["Copper Vein", "Tin Vein", "Iron Deposit", "Mithril Deposit", "Thorium Vein"] };
// where each craft gets its materials
const CRAFT_SRC = { Blacksmithing: "Mining", Engineering: "Mining", Alchemy: "Herbalism", Leatherworking: "Skinning", Tailoring: "Cloth", Enchanting: "Dust", "First Aid": "Cloth", Cooking: "Meat" };
const CRAFT_AT = { Blacksmithing: "at the anvil", Leatherworking: "at the leatherworking bench", Tailoring: "at the loom", Alchemy: "at the alchemy lab", Engineering: "at the engineering bench", Enchanting: "at the enchanting table" };
const BLACK_LOTUS = 60000; // a flask's rare herb, bought on the AH
const matPrice = t => (t + 1) * (t + 1) * 500; // copper per material on the Auction House
const zoneTier = (z = curZone()) => { const d = ZONES[z], m = d ? (d[0] + d[1]) / 2 : S.level; return m < 13 ? 0 : m < 23 ? 1 : m < 33 ? 2 : m < 45 ? 3 : 4; };
const skillTier = sk => { let t = -1; MAT_REQ.forEach((r, i) => { if (sk >= r) t = i; }); return t; };
// orange always teaches something, yellow usually, green now and then, grey never
const skillChance = (sk, req) => { const d = sk - req; return d < 0 ? 0 : d < 25 ? 1 : d < 50 ? 0.55 : d < 90 ? 0.18 : 0; };
const profSkill = n => (S.prof && S.prof.sk[n]) || 0;
const hasProf = n => !!(S.prof && (S.prof.a === n || S.prof.b === n));
// the crafts in the pair (Tailoring + Enchanting has two)
const crafts = () => S.prof ? [S.prof.a, S.prof.b].filter(n => CRAFT_AT[n]) : [];
function skillUp(n, req) {
  const p = S.prof; if (!p || !(n in p.sk) || p.sk[n] >= p.cap) return 0;
  if (Math.random() >= skillChance(p.sk[n], req)) return 0;
  p.sk[n]++;
  if (p.sk[n] % 25 === 0) log(`${n} skill increased to ${p.sk[n]}.`, "spell");
  return 1;
}
const addMat = (src, t, n) => { const k = MATS[src][t]; S.prof.mats[k] = (S.prof.mats[k] || 0) + n; };
const matCount = (src, t) => S.prof.mats[MATS[src][t]] || 0;
const takeMat = (src, t, n) => { const k = MATS[src][t]; S.prof.mats[k] -= n; if (S.prof.mats[k] <= 0) delete S.prof.mats[k]; };
function newProf(pair, L = 1) {
  const [a, b] = PROF_PAIRS[pair], cap = trainCap(L), on = sk => Math.max(0, Math.min(cap, sk));
  const sk = {}; [a, b, ...SECONDARY].forEach(n => sk[n] = on(L * 5 - 5));
  return { pair, a, b, cap, sk, mats: {}, recent: [], ah: 0, made: 0 };
}

// out in the field: a node or a skinnable beast after a kill
function gatherTasks(t) {
  const p = S.prof; if (!p || !p.cap) return [];
  const out = [], mobs = t.mobs || [t.mob];
  const g = ["Mining", "Herbalism"].find(hasProf);
  if (g && Math.random() < 0.15) {
    const tier = Math.min(zoneTier(), skillTier(p.sk[g]));
    if (tier >= 0) out.push({ k: "gather", prof: g, tier, d: g === "Mining" ? `Mining ${article(NODES.Mining[tier])}` : `Picking ${tier ? "some " : "a "}${MATS.Herbalism[tier]}`, t: sec(2.5) });
  }
  if (hasProf("Skinning")) {
    const beast = mobs.find(m => foeKind(m) === "beast");
    if (beast && Math.random() < 0.9) { const tier = Math.min(zoneTier(), skillTier(p.sk.Skinning)); if (tier >= 0) out.push({ k: "gather", prof: "Skinning", tier, d: `Skinning the ${beast}`, t: sec(1.5) }); }
  }
  return out;
}
// loot that goes to the profession store instead of the bags: cloth from anyone, meat from beasts
function profLoot(t) {
  if (!S.prof) return false;
  const mobs = t.mobs || [t.mob], tier = zoneTier();
  if (mobs.some(m => foeKind(m) === "beast") && Math.random() < 0.35) addMat("Meat", tier, 1);
  if (mobs.some(m => foeKind(m) !== "beast") && Math.random() < 0.25) { addMat("Cloth", clamp(Math.floor(S.level / 12), 0, 4), 1 + R(2)); return true; }
  return false;
}
function finishGather(t) {
  const n = t.prof === "Skinning" ? 1 + R(2) : 1 + R(3);
  addMat(t.prof, t.tier, n);
  skillUp(t.prof, MAT_REQ[t.tier]);
}

// ---------- crafting ----------
// each craft has two recipes per material tier: the basic one and a harder one a bit further up
const recipes = craft => { const out = []; for (let t = 0; t < 5; t++) for (let v = 0; v < 2; v++) out.push({ t, v, req: MAT_REQ[t] + v * 30, n: 2 + v * 2 }); return out; };
const CRAFT_WORDS = {
  Blacksmithing: ["Copper", "Bronze", "Iron", "Mithril", "Thorium"],
  Leather: ["Embossed", "Fine", "Barbaric", "Nightscape", "Wicked"], Mail: ["Scorpid", "Turtle Scale", "Green Dragonscale", "Blue Dragonscale", "Black Dragonscale"],
  Tailoring: ["Linen", "Woolen", "Silk", "Mageweave", "Runecloth"],
};
const GOGGLES = ["Flying Tiger Goggles", "Green Tinted Goggles", "Catseye Ultra Goggles", "Gnomish Goggles", "Goblin Rocket Helmet"];
const BOMBS = ["Rough Copper Bomb", "Coarse Dynamite", "Iron Grenade", "Mithril Frag Bomb", "Thorium Grenade"];
const BANDAGES = ["Linen Bandage", "Wool Bandage", "Silk Bandage", "Mageweave Bandage", "Runecloth Bandage"];
const DISHES = ["Roasted Boar Meat", "Bear Steak", "Roast Raptor", "Tender Wolf Steak", "Monster Omelet"];
const ROD = ["Runed Copper Rod", "Lesser Magic Wand", "Runed Silver Rod", "Greater Mystic Wand", "Runed Arcanite Rod"];
const ARMOR_SLOTS = ["Head", "Shoulder", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet"];
// the gear slots a craft can make for this hero
function craftSlots(craft) {
  const a = armorType();
  if (craft === "Blacksmithing") return (a === "Plate" || a === "Mail" ? ARMOR_SLOTS : []).concat(["Main Hand"]);
  if (craft === "Leatherworking") return a === "Leather" || a === "Mail" ? ARMOR_SLOTS.concat(["Back"]) : ["Back"];
  if (craft === "Tailoring") return a === "Cloth" ? ARMOR_SLOTS.concat(["Back"]) : ["Back"];
  if (craft === "Engineering") return ["Head"];
  return [];
}
function craftItem(craft, r, slot) {
  const ilvl = Math.round(r.req / 5 + 3 + r.v * 3), a = armorType();
  let name;
  if (craft === "Engineering") name = GOGGLES[r.t];
  else if (slot === "Back") name = (craft === "Tailoring" ? CRAFT_WORDS.Tailoring[r.t] : CRAFT_WORDS.Leather[r.t]) + " Cloak";
  else if (slot === "Main Hand") name = CRAFT_WORDS.Blacksmithing[r.t] + " " + pick(cls().main.filter(x => !MYSTIC.test(x)).concat(["Mace"]));
  else { const w = craft === "Leatherworking" ? CRAFT_WORDS[a === "Mail" ? "Mail" : "Leather"] : craft === "Tailoring" ? CRAFT_WORDS.Tailoring : CRAFT_WORDS.Blacksmithing; name = w[r.t] + " " + ARMOR_BASE[a][slot]; }
  return { name: (r.v ? (craft === "Tailoring" ? "Embroidered " : craft === "Engineering" ? "Improved " : "Heavy ") : "") + name, ilvl, q: 2, slot, made: true };
}
// what the hero still wants from a consumable craft, and what it's called
const CONS_CRAFT = {
  Alchemy: () => [["hp", hpPot(), 8], ...(cls().mp && S.level >= 5 ? [["mp", mpPot(), 8]] : []), ...(elixirName() ? [["elix", elixirName(), 5]] : []), ...(S.level >= 60 && profSkill("Alchemy") >= 300 ? [["flask", flaskName(), 3]] : [])],
  Engineering: () => [["bomb", BOMBS[Math.min(4, skillTier(profSkill("Engineering")))], 5]],
  "First Aid": () => [["band", BANDAGES[Math.min(4, skillTier(profSkill("First Aid")))], 10]],
  Cooking: () => [["feast", DISHES[Math.min(4, skillTier(profSkill("Cooking")))], 10]],
};
// the AH can make up a shortfall when the skill falls behind (cloth and dust are hard to come by)
function buyMats(src, t, n, why) {
  const c = n * matPrice(t), k = MATS[src][t];
  if (spendable() < c * 3) return false;
  spend("mats", c); addMat(src, t, n);
  const b = why[k] || (why[k] = [0, 0]); b[0] += n; b[1] += c;
  return true;
}
// one profession at the crafting station: useful things first, then skill-ups with what's left
function craftRun(craft, primary) {
  const p = S.prof, src = CRAFT_SRC[craft], sk0 = p.sk[craft], made = [], notes = {};
  let crafts = 0, vend = 0;
  const can = r => p.sk[craft] >= r.req && matCount(src, r.t) >= r.n;
  const best = () => recipes(craft).filter(r => p.sk[craft] >= r.req).pop();
  const behind = () => p.sk[craft] < Math.min(p.cap, S.level * 5) - 10;
  const use = r => { takeMat(src, r.t, r.n); crafts++; skillUp(craft, r.req); };
  // gear: the best recipe, for a slot where it beats what's worn
  const slots = craftSlots(craft).filter(s => !(craft === "Engineering" && s === "Head" && S.level < 20));
  if (slots.length) {
    for (let i = 0; i < 2; i++) {
      const r = best(); if (!r) break;
      const slot = slots.filter(s => power(craftItem(craft, r, s)) > power(S.equip[s])).sort((a, b) => power(S.equip[a]) - power(S.equip[b]))[0];
      if (!slot) break;
      if (!can(r) && !buyMats(src, r.t, r.n - matCount(src, r.t), notes)) break;
      use(r); const it = craftItem(craft, r, slot); gain(it, "Crafted"); p.made++; made.push(it.name);
    }
  }
  // consumables: refill what the hero uses
  const want = CONS_CRAFT[craft] ? CONS_CRAFT[craft]() : [];
  for (const [k, name, top] of want) {
    let n = 0;
    while ((S.cons[k] || 0) < top) {
      const r = recipes(craft).filter(can).pop(); if (!r) break;
      if (k === "flask") { if (r.t < 4 || spendable() < BLACK_LOTUS * 2) break; spend("mats", BLACK_LOTUS); } // a flask needs a Black Lotus
      use(r); S.cons[k] = (S.cons[k] || 0) + (k === "band" || k === "feast" ? 2 : 1); n++; }
    if (n) { made.push(`${n}× ${name}`); p.made += n; }
  }
  // bags from the loom
  if (craft === "Tailoring") {
    const bag = BAGS.filter(b => b[0] <= S.level).pop(), r = bag && recipes(craft).filter(x => x.t <= BAGS.indexOf(bag) && p.sk[craft] >= x.req).pop();
    if (bag && r && bagUpgrade(bag) && (matCount(src, r.t) >= 6 || buyMats(src, r.t, 6 - matCount(src, r.t), notes))) { takeMat(src, r.t, 6); crafts++; skillUp(craft, r.req); giveBag(bag, "Sewed"); made.push(bag[1]); }
  }
  // enchanters enchant their own gear for the cost of the dust
  if (craft === "Enchanting") enchantGear(true, made);
  // skill-ups: orange and yellow recipes while the materials last (bought when behind), sold to a vendor after
  let ups = 0;
  for (let i = 0; i < 12; i++) {
    const r = recipes(craft).filter(x => p.sk[craft] >= x.req && skillChance(p.sk[craft], x.req) >= 0.5).pop() || recipes(craft).filter(x => p.sk[craft] >= x.req && skillChance(p.sk[craft], x.req) > 0).pop();
    if (!r) break;
    if (!can(r) && !(behind() && buyMats(src, r.t, r.n - matCount(src, r.t), notes))) break;
    use(r); ups++; vend += Math.round((r.t + 1) * (r.t + 1) * 300 * (r.v + 1));
  }
  if (vend) S.money += vend;
  if (!crafts) return;
  const gained = p.sk[craft] - sk0;
  log(`${craft}${made.length ? ": made " + made.join(", ") : ""}${ups ? `${made.length ? ", plus" : ":"} ${ups} practice piece${ups > 1 ? "s" : ""}` : ""}${gained ? ` (${craft} ${sk0} → ${p.sk[craft]})` : ""}.${Object.keys(notes).length ? " Bought " + Object.entries(notes).map(([k, [n, c]]) => `${n} ${k} for ${moneyTxt(c)}`).join(", ") + " on the AH." : ""}`, primary ? "spell" : "");
  if (primary) p.recent.unshift(...made.map(n => ({ n, L: S.level })));
  if (p.recent.length > 8) p.recent.length = 8;
}
// materials nobody here will use go to the Auction House
function sellMats() {
  const p = S.prof, uses = new Set([...crafts().map(n => CRAFT_SRC[n]), "Cloth", "Meat"]), got = [];
  let sum = 0;
  for (const src of Object.keys(MATS)) MATS[src].forEach((k, t) => {
    const have = p.mats[k] || 0; if (!have) return;
    const tailor = hasProf("Tailoring"), craft = src === "Cloth" ? (tailor ? "Tailoring" : "First Aid") : src === "Meat" ? "Cooking" : crafts().find(n => CRAFT_SRC[n] === src) || p.b;
    const top = skillTier(profSkill(craft)), keep = !uses.has(src) ? 0 : t < top - 1 ? 0 : src === "Cloth" && !tailor ? 10 : src === "Meat" ? 10 : 40;
    if (have > keep) { const n = have - keep, c = Math.round(n * matPrice(t) * 0.3); sum += c; got.push(`${n} ${k}`); p.mats[k] = keep; if (!keep) delete p.mats[k]; }
  });
  if (!sum) return;
  S.money += sum; p.ah += sum;
  log(`Sold ${got.join(", ")} on the Auction House for ${moneyTxt(sum)}.`, "gold");
}
function finishCraft() {
  const p = S.prof; if (!p || !p.cap) return;
  crafts().forEach(n => craftRun(n, true));
  SECONDARY.forEach(n => craftRun(n, false));
  crafts().forEach(masterwork);
  sellMats();
}
// the top end at 300: one great piece per craft, with rare materials bought on the AH
const MASTER = {
  Blacksmithing: () => ({ name: "Lionheart Helm", slot: "Head", mat: "Arcanite Bar", cost: 1500000 }),
  Leatherworking: () => armorType() === "Mail" ? { name: "Black Dragonscale Breastplate", slot: "Chest", mat: "Black Dragonscale", cost: 1200000 } : { name: "Devilsaur Leggings", slot: "Legs", mat: "Devilsaur Leather", cost: 1200000 },
  Tailoring: () => ({ name: S.cls === "Priest" ? "Truefaith Vestments" : S.cls === "Warlock" ? "Robe of the Void" : "Robe of the Archmage", slot: "Chest", mat: "Mooncloth", cost: 1500000 }),
  Engineering: () => ({ name: "Gnomish Battle Goggles", slot: "Head", mat: "Enchanted Thorium Bar", cost: 900000 }),
};
function masterwork(craft) {
  const p = S.prof, m = MASTER[craft] && MASTER[craft](); if (!m || p.sk[craft] < 300) return;
  const it = { name: m.name, ilvl: 70, q: 4, slot: m.slot, made: true };
  if (power(it) <= power(S.equip[m.slot]) || spendable() < m.cost) return;
  spend("mats", m.cost);
  log(`Bought the ${m.mat} for ${moneyTxt(m.cost)} and crafted ${m.name}!`, "loot4");
  gain(it, "Crafted"); p.made++; p.recent.unshift({ n: m.name, L: S.level });
}

// ---------- gold: what's spare, and where it went this week ----------
const WEEK = 7 * 86400000;
// gold kept back for the next mount
const mountReserve = () => S.level >= 34 && S.mount < 1 ? 900000 : S.level >= 56 && S.mount < 2 ? 10000000 : 0;
const spendable = () => Math.max(0, S.money - mountReserve());
function spend(kind, c) {
  c = Math.max(0, Math.round(c)); S.money -= c;
  const wk = Math.floor(S.time / WEEK);
  if (!S.spend || S.spend.wk !== wk) S.spend = { wk, ench: 0, sup: 0, rep: 0, mats: 0, gear: 0 };
  S.spend[kind] = (S.spend[kind] || 0) + c;
}

// ---------- enchants ----------
// per slot, by the level they come in at (the enchanter's skill when they do it themselves)
const ENCH = {
  "Main Hand": [[1, "Minor Striking"], [20, "Lesser Striking"], [35, "Striking"], [48, "Greater Striking"], [56, "Superior Striking"], [60, "Crusader"]],
  Chest: [[1, "Minor Health"], [20, "Lesser Health"], [30, "Minor Stats"], [44, "Lesser Stats"], [55, "Stats"], [60, "Greater Stats"]],
  Wrist: [[1, "Minor Stamina"], [20, "Lesser Stamina"], [35, "Stamina"], [48, "Greater Stamina"], [58, "Superior Stamina"]],
  Feet: [[1, "Minor Stamina"], [30, "Lesser Agility"], [45, "Stamina"], [55, "Greater Agility"]],
  Hands: [[35, "Agility"], [48, "Strength"], [58, "Greater Agility"]],
  Back: [[1, "Minor Protection"], [30, "Lesser Agility"], [45, "Defense"], [55, "Greater Resistance"]],
};
const CASTER_ENCH = { "Main Hand": { "Superior Striking": "Spell Power", Crusader: "Healing Power" }, Hands: { Agility: "Minor Haste", Strength: "Shadow Power", "Greater Agility": "Fire Power" }, Feet: { "Lesser Agility": "Lesser Spirit", "Greater Agility": "Spirit" } };
const enchName = (slot, n) => (isCaster() && CASTER_ENCH[slot] && CASTER_ENCH[slot][n]) || n;
// how much an enchant adds to the gear score (in item levels on that slot)
const enchBonus = it => it && it.ench ? 1.5 + it.ench.t * 1.4 + (it.ench.t >= 5 ? 2 : 0) : 0;
const enchPrice = lv => Math.round(lv * lv * lv * 1.5 * (lv >= 60 ? 1.5 : 1));
const ENCH_ORDER = ["Main Hand", "Chest", "Wrist", "Feet", "Hands", "Back"];
// the hero enchants new gear on a city visit: weapon and chest first; while levelling only blues and up,
// at 60 everything; the expensive ones wait until the gold is there. Enchanters do it themselves for dust
function enchantGear(self, made) {
  const p = S.prof, enchanter = self && p && p.b === "Enchanting", lvl = enchanter ? Math.min(60, Math.floor(p.sk.Enchanting / 5)) : S.level;
  const done = [];
  for (const slot of ENCH_ORDER) {
    const it = S.equip[slot]; if (!it || it.q < 2) continue;
    if (!enchanter && S.level < 60 && (it.q < 3 || !["Main Hand", "Chest"].includes(slot))) continue;
    const list = ENCH[slot].filter(e => e[0] <= lvl); if (!list.length) continue;
    const t = list.length - 1, e = list[t];
    if (it.ench && it.ench.t >= t) continue;
    if (enchanter) {
      const dt = Math.min(4, Math.floor(e[0] / 13)), need = 2 + (t >= 4 ? 4 : 0);
      if (matCount("Dust", dt) < need && !buyMats("Dust", dt, need - matCount("Dust", dt), {})) continue;
      takeMat("Dust", dt, need); skillUp("Enchanting", e[0] * 5);
    } else {
      const c = enchPrice(e[0]); if (spendable() < c * (S.level >= 60 ? 3 : 4)) continue;
      spend("ench", c);
    }
    it.ench = { name: enchName(slot, e[1]), t }; done.push(`${it.ench.name} on ${it.name}`);
  }
  if (!done.length) return;
  if (made) made.push(...done.map(x => "Enchant " + x));
  else log(`Enchanted ${done.join(", ")}.`, "spell");
}
