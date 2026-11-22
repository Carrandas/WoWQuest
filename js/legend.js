// The legendaries as goals at 60, the long way: Thunderfury (the Bindings of the Windseeker from Garr and Baron Geddon,
// Highlord Demitrian, ten Enchanted Elementium Bars, Prince Thunderaan summoned in Silithus: a world boss fight,
// wboss.js), Sulfuras (the Eye of Sulfuras from Ragnaros, Sulfuron Ingots from Golemagg, the Sulfuron Hammer from a
// blacksmith) and Atiesh (forty Splinters from Naxxramas, Anachronos, C'Thun and Kel'Thuzad, the demon in Stratholme;
// one staff per class: mage, warlock, priest, druid). They are ATT_CHAINS entries with `cls` and `legend` (raidq.js
// runs them, classq.js hands out the reward): only the player picks them, and the drops only come with the goal set.
"use strict";

const SMITH_FEE = (own, paid) => () => hasProf("Blacksmithing") ? own : paid;
const MC_NEED = () => attuned("Molten Core") ? null : "Needs the Molten Core attunement";
Object.assign(ATT_CHAINS, {
  thunderfury: { cls: ["Warrior", "Rogue", "Paladin", "Hunter"], noHeal: true, goal: true, legend: true, name: "Thunderfury, Blessed Blade of the Windseeker",
    item: { name: "Thunderfury, Blessed Blade of the Windseeker", slot: "Main Hand", ilvl: 80, q: 5 },
    need: MC_NEED,
    what: "The first legendary: the left Binding of the Windseeker from Garr and the right from Baron Geddon (when the raid hands them to you), Highlord Demitrian in Silithus, Elementium Ingots from Blackwing Lair made into ten Enchanted Elementium Bars (cheaper for a blacksmith), and Prince Thunderaan, summoned by Demitrian for a raid fight. Months.",
    steps: [
      ["boss", "The Bindings of the Windseeker: the left from Garr, the right from Baron Geddon, when the raid hands them to you", "Garr/Baron Geddon", 0.2, "x2"],
      ["go", "Examine the Vessel: Highlord Demitrian in Silithus, and the Vessel of Rebirth", 70],
      ["boss", "Elementium Ingots from the bosses of Blackwing Lair", "Razorgore the Untamed/Vaelastrasz the Corrupt/Broodlord Lashlayer/Firemaw/Ebonroc/Flamegor/Chromaggus/Nefarian", 0.35, "x10", [1, 2]],
      ["gold", "Ten Enchanted Elementium Bars: Arcanite Bars, Fiery Cores and Elemental Flux, smelted at the anvil", SMITH_FEE(4000000, 6000000)],
      ["boss", "Prince Thunderaan: Demitrian calls him down in Silithus, and the raid has to kill him", "Prince Thunderaan", 1],
      ["go", "Rise, Thunderfury!: the Dormant Wind Kissed Blade back to Highlord Demitrian", 40],
    ] },
  sulfuras: { cls: ["Warrior", "Paladin", "Shaman", "Druid"], noHeal: true, goal: true, legend: true, name: "Sulfuras, Hand of Ragnaros",
    item: { name: "Sulfuras, Hand of Ragnaros", slot: "Main Hand", ilvl: 80, q: 5 },
    need: MC_NEED,
    what: "The Eye of Sulfuras from Ragnaros (when the raid hands it to you), Sulfuron Ingots from Golemagg the Incinerator, the Plans: Sulfuron Hammer from Lokhtos Darkbargainer, and the hammer forged at the Black Anvil: by the hero if they're a blacksmith, by a paid one if not. Months.",
    steps: [
      ["boss", "The Eye of Sulfuras: from Ragnaros, when the raid hands it to you", "Ragnaros", 0.18],
      ["boss", "Sulfuron Ingots from Golemagg the Incinerator", "Golemagg the Incinerator", 1, "x8", [1, 2]],
      ["go", "A Binding Contract: one Sulfuron Ingot to Lokhtos Darkbargainer in Blackrock Depths for the Plans: Sulfuron Hammer", 60],
      ["gold", "The Sulfuron Hammer at the Black Anvil: Dark Iron Bars, Arcanite, Essence of Fire, Lava Cores, Fiery Cores, Blood of the Mountain (and a blacksmith's fee, for a hero who isn't one)", SMITH_FEE(3500000, 5500000)],
      ["go", "The Eye of Sulfuras set in the Sulfuron Hammer: Sulfuras, Hand of Ragnaros", 40],
    ] },
  atiesh: { cls: ["Mage", "Warlock", "Priest", "Druid"], goal: true, legend: true, name: "Atiesh, Greatstaff of the Guardian",
    item: () => ({ name: "Atiesh, Greatstaff of the Guardian", slot: "Main Hand", ilvl: 90, q: 5 }),
    need: () => attuned("Naxxramas") ? null : "Needs the Naxxramas attunement (The Dread Citadel)",
    what: "Forty Splinters of Atiesh from the bosses of Naxxramas, the Frame of Atiesh for Anachronos, C'Thun and Kel'Thuzad killed for the Befouled Greatstaff, and the demon Atiesh fought on Festival Lane in Stratholme. Anachronos purifies the staff: the version for the hero's class. Months.",
    steps: [
      ["boss", "Splinters of Atiesh from the bosses of Naxxramas, when the raid hands them to you", RAIDS.find(r => r.name === "Naxxramas").bosses.join("/"), 0.4, "x40", [1, 3]],
      ["go", "Frame of Atiesh: the forty splinters joined, to Anachronos at the Caverns of Time", 80],
      ["boss", "Atiesh, the Befouled Greatstaff: C'Thun must die with the frame in the bags", "C'Thun", 1],
      ["boss", "Atiesh, the Befouled Greatstaff: and Kel'Thuzad", "Kel'Thuzad", 1],
      ["run", "Atiesh, Greatstaff of the Guardian: the befouled staff used on Festival Lane in Stratholme, and the demon Atiesh killed", "Stratholme", "x1"],
      ["go", "Anachronos purifies the staff", 40],
    ] },
});
const ATIESH_VERSION = { Mage: "the mage's version (spell damage and crit, Atiesh's aura for the casters)", Warlock: "the warlock's version (spell damage, the aura for the casters)", Priest: "the priest's version (healing, the aura for the healers)", Druid: "the druid's version (healing, the aura for the healers)" };
// a legendary done (from cqChainDone): the line, and the name kept with the others
function legendDone(it) {
  if (!S.legendaries.includes(it.name)) S.legendaries.push(it.name);
  log(it.name.startsWith("Atiesh") ? `${it.name}: ${ATIESH_VERSION[S.cls] || "the staff"}.` : `${it.name}! The whole raid gathers to see it.`, "loot5");
}
// Prince Thunderaan comes up when Demitrian summons him (wboss.js: the summoned world boss)
const thunderaanCalled = () => attMine("thunderfury") && attWorking("thunderfury") && attCur("thunderfury")[2] === "Prince Thunderaan";
// old saves: the legendaries made on the spot count as done, the parts found count toward their step
function legendMigrate() {
  if (!S.attGot || typeof S.attGot !== "object") S.attGot = {};
  if (S.legendMig) return;
  S.legendMig = 1;
  const p = S.parts || {}, has = n => (S.legendaries || []).includes(n);
  ["thunderfury", "sulfuras", "atiesh"].forEach(k => { if (has(ATT_CHAINS[k].name)) S.att[k] = ATT_CHAINS[k].steps.length; });
  if (!S.att.thunderfury && p["Bindings of the Windseeker"]) S.attGot.thunderfury = Math.min(1, p["Bindings of the Windseeker"]);
  if (!S.att.sulfuras && p["Eye of Sulfuras"]) S.att.sulfuras = 1;
  if (!S.att.atiesh && p.splinter) S.attGot.atiesh = Math.min(39, p.splinter);
}
