// Professions and gold: gathering, crafting, where the gold goes, enchants.
"use strict";

// ---------- professions: gathering in the field, crafting on city visits ----------
// skill tiers like back then: Apprentice from level 5, Journeyman 10, Expert 20, Artisan 35
const PROF_TIERS = [{ L: 35, cap: 300, name: "Artisan" }, { L: 20, cap: 225, name: "Expert" }, { L: 10, cap: 150, name: "Journeyman" }, { L: 5, cap: 75, name: "Apprentice" }];
const trainCap = (L = S.level) => (PROF_TIERS.find(x => L >= x.L) || { cap: 0 }).cap;
const tierName = cap => (PROF_TIERS.find(x => x.cap === cap) || { name: "Untrained" }).name;
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
// copper per material on the Auction House: Linen and Copper are cheap, Runecloth and Thorium are not
const MAT_PRICE = [100, 400, 2000, 5000, 9000], matPrice = t => MAT_PRICE[t];
const zoneTier = (z = curZone()) => { const d = ZONES[z], m = d ? (d.min + d.max) / 2 : S.level; return m < 13 ? 0 : m < 23 ? 1 : m < 33 ? 2 : m < 45 ? 3 : 4; };
const skillTier = sk => { let t = -1; MAT_REQ.forEach((r, i) => { if (sk >= r) t = i; }); return t; };
// orange always teaches something, yellow usually, green now and then, grey never
const skillChance = (sk, req) => { const d = sk - req; return d < 0 ? 0 : d < 25 ? 1 : d < 50 ? 0.55 : d < 90 ? 0.18 : 0; };
// mining and herbalism stay useful a little longer, so the skill keeps up until the next material opens (Tin at 65,
// Iron at 125...); nodes are rarer than skinnable beasts, so skinning keeps the normal curve
const gatherChance = (sk, req) => { const d = sk - req; return d < 0 ? 0 : d < 35 ? 1 : d < 60 ? 0.55 : d < 100 ? 0.18 : 0; };
const profSkill = n => (S.prof && S.prof.sk[n]) || 0;
// what a profession makes at its current skill (bandages, dishes, bombs)
const profItem = (list, n) => list[clamp(skillTier(profSkill(n)), 0, list.length - 1)];
const hasProf = n => !!(S.prof && (S.prof.a === n || S.prof.b === n));
// enchanters disenchant instead of selling, and enchant their own gear
const isEnchanter = () => !!(S.prof && S.prof.b === "Enchanting" && S.prof.cap);
// the crafts in the pair (Tailoring + Enchanting has two)
const crafts = () => S.prof ? [S.prof.a, S.prof.b].filter(n => CRAFT_AT[n]) : [];
function skillUp(n, req, chance = skillChance) {
  const p = S.prof; if (!p || !(n in p.sk) || p.sk[n] >= p.cap) return 0;
  if (Math.random() >= chance(p.sk[n], req)) return 0;
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
  return { pair, a, b, cap, sk, mats: {}, recent: [], ah: 0, made: 0, count: {} };
}
// running totals for the professions tab and achievements: gathered per gathering skill ("top:" for the top tier),
// crafted gear by quality (q2, q3, q4), pots, flask, bags, selfEnch, de (disenchanted), band, meals, bombs
const bump = (k, n = 1) => { const c = S.prof && S.prof.count; if (c) c[k] = (c[k] || 0) + n; };
const profCount = k => (S.prof && S.prof.count && S.prof.count[k]) || 0;

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
  addMat(t.prof, t.tier, n); bump(t.prof, n); if (t.tier === 4) bump("top:" + t.prof, n);
  skillUp(t.prof, MAT_REQ[t.tier], t.prof === "Skinning" ? skillChance : gatherChance);
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
  Engineering: () => [["bomb", profItem(BOMBS, "Engineering"), 5]],
  "First Aid": () => [["band", profItem(BANDAGES, "First Aid"), 10]],
  Cooking: () => [["feast", profItem(DISHES, "Cooking"), 10]],
};
// the AH can make up a shortfall when the skill falls behind (cloth and dust are hard to come by)
function buyMats(src, t, n, why) {
  const c = n * matPrice(t), k = MATS[src][t];
  if (spendable() < c * 1.5) return false;
  spend("mats", c); addMat(src, t, n);
  const b = why[k] || (why[k] = [0, 0]); b[0] += n; b[1] += c;
  return true;
}
// one profession at the crafting station: useful things first, then skill-ups with what's left.
// The steps share a run: what's been made, materials bought on the AH (notes), and how many crafts
function craftRun(craft, primary) {
  const p = S.prof, run = { craft, p, src: CRAFT_SRC[craft], made: [], notes: {}, crafts: 0 }, sk0 = p.sk[craft];
  craftBlue(run);
  craftGear(run);
  craftConsumables(run);
  if (craft === "Tailoring") sewBag(run);
  // enchanters enchant their own gear for the cost of the dust
  if (craft === "Enchanting") enchantGear(true, run.made);
  const ups = craftPractice(run);
  if (!run.crafts) return;
  const { made, notes } = run, gained = p.sk[craft] - sk0;
  const practice = ups ? `${made.length ? ", plus" : ":"} ${ups} practice piece${ups > 1 ? "s" : ""}` : "";
  const bought = Object.keys(notes).length ? " Bought " + Object.entries(notes).map(([k, [n, c]]) => `${n} ${k} for ${moneyTxt(c)}`).join(", ") + " on the AH." : "";
  log(`${craft}${made.length ? ": made " + made.join(", ") : ""}${practice}${gained ? ` (${craft} ${sk0} → ${p.sk[craft]})` : ""}.${bought}`, primary ? "spell" : "");
  if (primary) p.recent.unshift(...made.map(n => ({ n, L: S.level })));
  if (p.recent.length > 8) p.recent.length = 8;
}
// helpers for a run: has the skill and the materials for a recipe, and crafting one
const canCraft = (run, r) => run.p.sk[run.craft] >= r.req && matCount(run.src, r.t) >= r.n;
const useRecipe = (run, r) => { takeMat(run.src, r.t, r.n); run.crafts++; skillUp(run.craft, r.req); };
// buys what's missing for a recipe on the AH (when there's gold for it)
const topUp = (run, t, n) => matCount(run.src, t) >= n || buyMats(run.src, t, n - matCount(run.src, t), run.notes);
// gear: the best recipe, for a slot where it beats what's worn (up to two pieces)
function craftGear(run) {
  const { craft, p } = run;
  const slots = craftSlots(craft).filter(s => !(craft === "Engineering" && s === "Head" && S.level < 20));
  if (!slots.length) return;
  for (let i = 0; i < 2; i++) {
    const r = recipes(craft).filter(x => p.sk[craft] >= x.req).pop(); if (!r) break;
    const slot = slots.filter(s => power(craftItem(craft, r, s)) > power(S.equip[s])).sort((a, b) => power(S.equip[a]) - power(S.equip[b]))[0];
    if (!slot) break;
    if (!canCraft(run, r) && !buyMats(run.src, r.t, r.n - matCount(run.src, r.t), run.notes)) break;
    useRecipe(run, r); const it = craftItem(craft, r, slot); gain(it, "Crafted"); p.made++; bump("q" + it.q); run.made.push(it.name);
  }
}
// blue crafts: a few signature pieces per craft, from skill 150 (a new one at 200 and 250), a little below
// dungeon blues. An extra on top of the green levelling gear: made once a piece beats what's worn
const BLUE_REQ = [150, 200, 250];
function blueRecipes(craft) {
  const a = armorType(), out = [], add = (slot, names) => out.push({ slot, names });
  if (craft === "Blacksmithing") {
    add("Main Hand", ["Massive Iron Axe", "Moonsteel Broadsword", "Truesilver Champion"]);
    if (a === "Plate" || a === "Mail") add("Chest", ["Golden Scale Cuirass", "Truesilver Breastplate", "Imperial Plate Chest"]);
  } else if (craft === "Leatherworking") {
    add("Back", ["Guardian Cloak", "Black Whelp Cloak", "Onyxia Scale Cloak"]);
    if (a === "Leather") add("Chest", ["Guardian Armor", "Nightscape Tunic", "Wicked Leather Armor"]);
    if (a === "Mail") add("Chest", ["Turtle Scale Breastplate", "Green Dragonscale Breastplate", "Blue Dragonscale Breastplate"]);
  } else if (craft === "Tailoring") {
    add("Back", ["Cloak of Fire", "Cindercloth Cloak", "Gaea's Embrace"]);
    if (a === "Cloth") add("Chest", ["Robe of Power", "Frostweave Robe", "Robe of Winter Night"]);
  } else if (craft === "Engineering") add("Head", ["Fire Goggles", "Green Lens", "Spellpower Goggles Xtreme"]);
  return out;
}
function craftBlue(run) {
  const { craft, p } = run, t = BLUE_REQ.filter(r => p.sk[craft] >= r).length - 1;
  if (t < 0) return;
  const req = BLUE_REQ[t], mt = skillTier(req);
  for (const { slot, names } of blueRecipes(craft)) {
    const it = { name: names[t], ilvl: Math.round(req / 5 + 7), q: 3, slot, made: true };
    if (power(it) <= power(S.equip[slot]) || !topUp(run, mt, 8)) continue;
    takeMat(run.src, mt, 8); run.crafts++; skillUp(craft, req);
    gain(it, "Crafted"); p.made++; bump("q3"); run.made.push(it.name);
  }
}
// consumables: refill what the hero uses (potions, bandages, food, bombs, flasks)
function craftConsumables(run) {
  const want = CONS_CRAFT[run.craft] ? CONS_CRAFT[run.craft]() : [];
  for (const [k, name, top] of want) {
    let n = 0;
    while ((S.cons[k] || 0) < top) {
      const r = recipes(run.craft).filter(x => canCraft(run, x)).pop(); if (!r) break;
      if (k === "flask") { if (r.t < 4) break; if (!farmLotus()) { if (spendable() < BLACK_LOTUS * 2) break; spend("mats", BLACK_LOTUS); } } // a flask needs a Black Lotus (a farmed one, or the AH's)
      useRecipe(run, r); S.cons[k] = (S.cons[k] || 0) + (k === "band" || k === "feast" ? 2 : 1); n++;
      if (k === "flask") bump("flask"); else if (k === "hp" || k === "mp" || k === "elix") bump("pots");
    }
    if (n) { run.made.push(`${n}× ${name}`); run.p.made += n; }
  }
}
// tailors sew the best bag for their level when it beats the smallest one carried
function sewBag(run) {
  const { craft, p, src } = run;
  const bag = BAGS.filter(b => b.lvl <= S.level).pop(), r = bag && recipes(craft).filter(x => x.t <= BAGS.indexOf(bag) && p.sk[craft] >= x.req).pop();
  if (!bag || !r || !bagUpgrade(bag) || !topUp(run, r.t, 6)) return;
  takeMat(src, r.t, 6); run.crafts++; skillUp(craft, r.req); giveBag(bag, "Sewed"); bump("bags"); run.made.push(bag.name);
}
// skill-ups: orange and yellow recipes while the materials last (bought when behind), sold to a vendor after.
// Returns how many were made
function craftPractice(run) {
  const { craft, p, src } = run, sk = () => p.sk[craft];
  const behind = () => sk() < Math.min(p.cap, S.level * 5) - 10;
  let ups = 0, vend = 0;
  // up to 12 practice pieces, or more (up to 30) while the skill is still behind the level
  for (let i = 0; i < 30; i++) {
    if (i >= 12 && !behind()) break;
    const r = recipes(craft).filter(x => sk() >= x.req && skillChance(sk(), x.req) >= 0.5).pop() || recipes(craft).filter(x => sk() >= x.req && skillChance(sk(), x.req) > 0).pop();
    if (!r) break;
    if (!canCraft(run, r) && !(behind() && buyMats(src, r.t, r.n - matCount(src, r.t), run.notes))) break;
    useRecipe(run, r); ups++; vend += Math.round((r.t + 1) * 120 * (r.v + 1));
  }
  if (vend) S.money += vend;
  return ups;
}
// materials nobody here will use go to the Auction House
function sellMats() {
  const p = S.prof, uses = new Set([...crafts().map(n => CRAFT_SRC[n]), "Cloth", "Meat"]), got = [];
  let sum = 0;
  for (const src of Object.keys(MATS)) MATS[src].forEach((k, t) => {
    const have = p.mats[k] || 0; if (!have) return;
    const tailor = hasProf("Tailoring"), craft = src === "Cloth" ? (tailor ? "Tailoring" : "First Aid") : src === "Meat" ? "Cooking" : crafts().find(n => CRAFT_SRC[n] === src) || p.b;
    const top = skillTier(profSkill(craft)), keep = !uses.has(src) ? 0 : t < top - 1 ? 0 : src === "Cloth" && !tailor ? 10 : src === "Meat" ? 10 : 40;
    if (have > keep) { const n = have - keep, c = Math.round(n * matPrice(t) * 0.1); sum += c; got.push(`${n} ${k}`); p.mats[k] = keep; if (!keep) delete p.mats[k]; }
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
  const own = farmCan(m.mat), cost = own ? Math.round(m.cost * 0.3) : m.cost; // farmed materials (farming.js): only the rest of the recipe to buy
  if (power(it) <= power(S.equip[m.slot]) || spendable() < cost) return;
  if (own) farmMat(m.mat);
  spend("mats", cost);
  log(own ? `Crafted ${m.name} from farmed materials (${moneyTxt(cost)} for the rest)!` : `Bought the ${m.mat} for ${moneyTxt(m.cost)} and crafted ${m.name}!`, "loot4");
  gain(it, "Crafted"); p.made++; bump("q4"); p.recent.unshift({ n: m.name, L: S.level });
}

// ---------- gold: what's spare, and where it went this week ----------
// gold kept back for the next mount
const MOUNT_COST = 900000, EPIC_MOUNT_COST = 10000000; // 90g at 40, 1000g at 60
const mountReserve = () => classMount() ? classMountReserve() : S.level >= 34 && S.mount < 1 ? MOUNT_COST : S.level >= 56 && S.mount < 2 ? EPIC_MOUNT_COST : 0;
const spendable = () => Math.max(0, S.money - mountReserve() - attReserve());
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
      takeMat("Dust", dt, need); skillUp("Enchanting", e[0] * 5); bump("selfEnch");
    } else {
      const c = enchPrice(e[0]); if (spendable() < c * (S.level >= 60 ? 3 : 4)) continue;
      spend("ench", c);
    }
    it.ench = { name: enchName(slot, e[1]), t }; done.push(`${it.ench.name} on ${it.name}`);
  }
  facEnchants(); // the reputation enchants stay on their slot (factions.js)
  if (!done.length) return;
  if (made) made.push(...done.map(x => "Enchant " + x));
  else log(`Enchanted ${done.join(", ")}.`, "spell");
}
