// Farming runs at 60 (the `farm` task between raid nights, finish.js): a route per gathering profession (herbs, ore,
// leather, or Stratholme and the Plaguelands for a hero without one), and the rare finds on the way (S.farm.mats):
// Black Lotus (the alchemist's flasks, no AH price to pay), Arcane Crystals (the Arcanite transmute), Dark Iron Ore
// (for Lokhtos: Thorium Brotherhood), Devilsaur Leather, Righteous Orbs, Essence of Undeath. What the hero's crafts
// need is kept (the top crafts at 300 get much cheaper, `farmMat` in `masterwork`), the rest is sold. Plus the daily
// cooldowns on a city visit: the alchemist's Transmute: Arcanite (an Arcane Crystal and a Thorium Bar), the tailor's
// Mooncloth (every four days).
"use strict";

// routes: [zone, what's farmed, rare finds: [material, chance per run]]
const FARM_ROUTES = {
  Herbalism: [["Winterspring", "Icecap and Mountain Silversage", [["Black Lotus", 0.12]]], ["Eastern Plaguelands", "Plaguebloom", [["Black Lotus", 0.1], ["Essence of Undeath", 0.3]]],
    ["Felwood", "Gromsblood and Plaguebloom", [["Black Lotus", 0.08]]], ["Silithus", "Dreamfoil", [["Black Lotus", 0.15]]], ["Burning Steppes", "Sungrass and Golden Sansam", [["Black Lotus", 0.15]]]],
  Mining: [["Un'Goro Crater", "the Thorium veins around the crater", [["Arcane Crystal", 0.3]]], ["Winterspring", "Rich Thorium Veins", [["Arcane Crystal", 0.35]]],
    ["Burning Steppes", "Thorium and Dark Iron", [["Arcane Crystal", 0.25], ["Dark Iron Ore", 0.6]]], ["Searing Gorge", "Dark Iron Deposits", [["Dark Iron Ore", 0.8]]]],
  Skinning: [["Un'Goro Crater", "devilsaurs, avoiding the Tyrant Devilsaur", [["Devilsaur Leather", 0.45]]], ["Winterspring", "Rugged Leather from the chimaeras", []], ["Eastern Plaguelands", "Rugged Leather from the plaguebats", [["Essence of Undeath", 0.2]]]],
  none: [["Stratholme", "the Scarlet side for Righteous Orbs and Runecloth", [["Righteous Orb", 0.35]]], ["Eastern Plaguelands", "Runecloth from the Scourge", [["Essence of Undeath", 0.4]]], ["Winterspring", "Runecloth from the Winterfall", []]],
};
// copper each on the Auction House
const FARM_PRICE = { "Black Lotus": BLACK_LOTUS, "Arcane Crystal": 30000, "Devilsaur Leather": 20000, "Righteous Orb": 20000, "Essence of Undeath": 8000, "Dark Iron Ore": 6000, Mooncloth: 30000, "Arcanite Bar": 45000 };
// what each craft keeps for itself (the rest goes on the AH): material, how many to hold
const FARM_KEEP = { Alchemy: [["Black Lotus", 6], ["Arcane Crystal", 2]], Blacksmithing: [["Arcanite Bar", 3], ["Arcane Crystal", 3], ["Dark Iron Ore", 20]], Leatherworking: [["Devilsaur Leather", 3]], Tailoring: [["Mooncloth", 4]], Engineering: [["Arcane Crystal", 2]] };
// the top crafts (MASTER in professions.js): the own material that makes them cheap, and how many
const FARM_OWN = { "Arcanite Bar": ["Arcanite Bar", 3, "Arcane Crystal"], "Devilsaur Leather": ["Devilsaur Leather", 3], Mooncloth: ["Mooncloth", 4], "Enchanted Thorium Bar": ["Arcane Crystal", 2] };
const newFarm = () => ({ mats: {}, cd: {}, runs: 0 });
const farmHas = (m, n = 1) => (S.farm.mats[m] || 0) >= n;
const farmTake = (m, n = 1) => { S.farm.mats[m] -= n; if (S.farm.mats[m] <= 0) delete S.farm.mats[m]; };
const farmKeep = m => crafts().concat(hasProf("Alchemy") ? ["Alchemy"] : []).reduce((a, c) => Math.max(a, ((FARM_KEEP[c] || []).find(x => x[0] === m) || [0, 0])[1]), 0);

// the farm task for the evening (choose, finish.js)
function farmTask() {
  const g = ["Herbalism", "Mining", "Skinning"].find(hasProf) || "none", [zone, what, rares] = pick(FARM_ROUTES[g]);
  const d = g === "none" ? (zone === "Stratholme" ? `Running Stratholme for ${what.replace(/^the Scarlet side for /, "")}` : `Farming ${what} in ${zone}`) : `Farming ${what} in ${zone}`;
  return { k: "farm", d, t: sec(240), route: { g, zone, rares } };
}
// the run's end: the gold (as before, finish.js) and the rare finds, kept or sold
function farmEnd(t) {
  const f = S.farm, found = []; let sold = 0; f.runs++;
  t.route.rares.forEach(([m, ch]) => {
    if (Math.random() >= ch) return;
    const n = m === "Dark Iron Ore" ? 4 + R(6) : m === "Essence of Undeath" ? 1 + R(3) : 1;
    found.push(n > 1 ? `${n} ${m}` : m);
    if (m === "Black Lotus") bump("lotus");
    if (m === "Dark Iron Ore") { facGain("Thorium Brotherhood", 25 * n); }
    f.mats[m] = (f.mats[m] || 0) + n;
  });
  // anything over what the crafts want goes on the AH
  Object.keys(f.mats).forEach(m => { const over = f.mats[m] - farmKeep(m); if (over > 0 && FARM_PRICE[m]) { sold += over * FARM_PRICE[m]; farmTake(m, over); } });
  if (sold) { S.money += sold; if (S.prof) S.prof.ah += sold; }
  if (found.length) log(`Found on the way: ${found.join(", ")}${t.route.rares.some(r => r[0] === "Black Lotus") && found.some(x => x === "Black Lotus") ? ". A Black Lotus! Someone in /general is very upset" : ""}.${sold ? ` Sold the spares for ${moneyTxt(sold)}.` : ""}`, "loot3");
}
// a Black Lotus for a flask: from the bags when there is one (craftConsumables)
function farmLotus() { if (!farmHas("Black Lotus")) return false; farmTake("Black Lotus"); return true; }
// the top craft's rare material: from the bags (a fraction of the price is left: the rest of the recipe)
// (a blacksmith without an alchemist's transmute brings Arcane Crystals and pays one)
const farmCan = m => { const o = FARM_OWN[m]; return !!o && (farmHas(o[0], o[1]) || (!!o[2] && farmHas(o[2], o[1]))); };
function farmMat(m) {
  const o = FARM_OWN[m]; if (!farmCan(m)) return false;
  farmTake(farmHas(o[0], o[1]) ? o[0] : o[2], o[1]);
  return true;
}

// ---------- the daily cooldowns, on a city visit at 60 ----------
function farmCity(q) {
  if (S.level < 60 || !S.prof) return;
  const day = Math.floor(S.time / DAY), cd = S.farm.cd;
  if (hasProf("Alchemy") && profSkill("Alchemy") >= 275 && cd.arcanite !== day) q.push({ k: "farmcd", d: "Transmute: Arcanite Bar (the daily cooldown)", t: sec(5), cd: "arcanite" });
  if (hasProf("Tailoring") && profSkill("Tailoring") >= 250 && (cd.moon == null || day - cd.moon >= 4)) q.push({ k: "farmcd", d: "Sewing Mooncloth at the moonwell (every four days)", t: sec(8), cd: "moon" });
}
function farmCd(t) {
  const f = S.farm, day = Math.floor(S.time / DAY);
  if (t.cd === "arcanite") {
    f.cd.arcanite = day;
    const own = farmHas("Arcane Crystal"); if (own) farmTake("Arcane Crystal"); else spend("mats", Math.min(S.money, FARM_PRICE["Arcane Crystal"]));
    f.mats["Arcanite Bar"] = (f.mats["Arcanite Bar"] || 0) + 1; bump("transmute");
    const sell = farmKeep("Arcanite Bar") < f.mats["Arcanite Bar"];
    if (sell) { farmTake("Arcanite Bar"); S.money += FARM_PRICE["Arcanite Bar"]; S.prof.ah += FARM_PRICE["Arcanite Bar"]; }
    log(`Transmuted an Arcanite Bar${own ? " from a farmed Arcane Crystal" : ""}${sell ? `, sold for ${moneyTxt(FARM_PRICE["Arcanite Bar"])}` : ""}.`, "spell");
  } else {
    f.cd.moon = day;
    f.mats.Mooncloth = (f.mats.Mooncloth || 0) + 1; bump("mooncloth");
    const sell = farmKeep("Mooncloth") < f.mats.Mooncloth;
    if (sell) { farmTake("Mooncloth"); S.money += FARM_PRICE.Mooncloth; S.prof.ah += FARM_PRICE.Mooncloth; }
    log(`Felcloth into Mooncloth under the moon${sell ? `, sold for ${moneyTxt(FARM_PRICE.Mooncloth)}` : ` (${f.mats.Mooncloth} kept for the robe)`}.`, "spell");
  }
}
const FARM_FINISH = { farmcd(t) { farmCd(t); } };
