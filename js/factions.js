// Reputation at 60 (S.fac: points per faction, the game's scale: friendly 3000, honored 9000, revered 21000, exalted
// 42000): Timbermaw Hold (furbolgs in Felwood and Winterspring, the feathers and beads), the Hydraxian Waterlords (Molten
// Core only: the bosses, and the runes doused with Aqual Quintessence), the Zandalar Tribe (Zul'Gurub: the bosses, the
// coins and bijous), the Argent Dawn (Scourgestones, Stratholme and Scholomance, the Scourge Invasion) and the Thorium
// Brotherhood (Dark Iron Ore and cores for Lokhtos, Blackrock Depths). Raids and dungeons give some on their own; a
// goal sends free evenings to the grind (`fac:` goals, done at exalted). Each step has a reward: an item, an enchant
// that stays on the slot (`facEnchants` after every enchant visit), a recipe for the hero's craft, or just the story.
"use strict";

const FAC_RANKS = [[0, "Neutral"], [3000, "Friendly"], [9000, "Honored"], [21000, "Revered"], [42000, "Exalted"]];
const facPts = f => (S.fac && S.fac[f]) || 0;
const facRank = f => FAC_RANKS.reduce((a, r, i) => facPts(f) >= r[0] ? i : a, 0);
const facRankName = f => FAC_RANKS[facRank(f)][1];
const facThe = f => f === "Timbermaw Hold" ? f : "the " + f; // "with Timbermaw Hold", "with the Argent Dawn"
const role3 = () => heroRole() === "heal" ? 2 : isCaster() ? 1 : 0; // melee, caster, healer
// the factions: where the trips go (null: no trips, only raids), the foes, what's turned in, the rewards per rank
const FACTIONS = {
  "Timbermaw Hold": { zone: "Felwood and Winterspring", foes: ["Deadwood Warrior", "Deadwood Den Watcher", "Deadwood Shaman", "Winterfall Ursa", "Winterfall Den Watcher", "Winterfall Totemic"],
    turnin: "Deadwood Headdress Feathers and Winterfall Spirit Beads to Nafien and Salfa",
    rewards: { 1: { txt: "The Timbermaw no longer attack on sight: the tunnels from Felwood to Moonglade and Winterspring are open." },
      2: { txt: "Meilosh sells the Timbermaw recipes now.", craft: { Blacksmithing: "Plans: Heavy Timbermaw Belt", Leatherworking: "Pattern: Timbermaw Brawlers", Tailoring: "Pattern: Mantle of the Timbermaw" } },
      4: { txt: "The Root of All Evil: Gorn One Eye sends you after Xandivious, the demon in Felwood. The reward:", item: () => ({ name: "Defender of the Timbermaw", slot: "Trinket", ilvl: 64, q: 4 }) } } },
  "Hydraxian Waterlords": { zone: null,
    rewards: { 1: { txt: "Duke Hydraxis on his island off Azshara takes notice of what you do in the Molten Core." },
      2: { txt: "Duke Hydraxis gives you Aqual Quintessence: the runes in the Molten Core can be doused, and Majordomo Executus summoned." },
      3: { txt: "Eternal Quintessence, which never runs out, and A Hero's Reward from the Duke:", item: () => isCaster() || heroRole() === "heal" ? { name: "Ocean's Breeze", slot: "Finger", ilvl: 66, q: 3 } : { name: "Tidal Loop", slot: "Finger", ilvl: 66, q: 3 } } } },
  "Zandalar Tribe": { zone: "Zul'Gurub", foes: ["Gurubashi Berserker", "Hakkari Priest", "Zulian Prowler", "Gurubashi Axe Thrower", "Razzashi Serpent"], group: "with a few guildies",
    turnin: "Hakkari coin sets and bijous to the Zandalar on Yojamba Isle",
    rewards: { 1: { txt: "Molthor on Yojamba Isle trusts you with the Zandalar's errands." },
      2: { txt: "Primal Hakkari Idols become enchants:", ench: [["Head", () => ["Presence of Might", "Presence of Sight", "Prophetic Aura"][role3()], 2], ["Legs", () => ["Presence of Might", "Presence of Sight", "Prophetic Aura"][role3()], 2]] },
      4: { txt: "Rin'wosho the Trader sells the Zandalar's best enchant for the shoulders:", ench: [["Shoulder", () => ["Zandalar Signet of Might", "Zandalar Signet of Mojo", "Zandalar Signet of Serenity"][role3()], 3]] } } },
  "Argent Dawn": { zone: "the Plaguelands", foes: ["Cauldron Lord Bilemaw", "Scourge Champion", "Plaguehound", "Skeletal Executioner", "Cursed Mage", "Living Decay"],
    turnin: "Scourgestones to the Argent Dawn at Light's Hope Chapel",
    rewards: { 1: { txt: "Officer Pureheart at Light's Hope Chapel greets you by name." },
      2: { txt: "Quartermaster Lightspark sells the Dawn recipes.", craft: { Blacksmithing: "Plans: Girdle of the Dawn", Leatherworking: "Pattern: Dawn Treaders", Tailoring: "Pattern: Argent Boots" } },
      3: { txt: "The Dawn's best recipes, and the Naxxramas attunement for half the price.", craft: { Blacksmithing: "Plans: Gloves of the Dawn", Tailoring: "Pattern: Golden Mantle of the Dawn" } },
      4: { txt: "Exalted with the Argent Dawn: the Naxxramas attunement is free." } } },
  "Thorium Brotherhood": { zone: "Searing Gorge and Blackrock Depths", foes: ["Dark Iron Taskmaster", "Dark Iron Slaver", "Dark Iron Geologist", "Fireguard", "Molten Elemental"],
    turnin: "Dark Iron Ore, Fiery Cores and Lava Cores to Lokhtos Darkbargainer at Thorium Point",
    rewards: { 1: { txt: "Lokhtos Darkbargainer will trade with you now." },
      2: { txt: "Lokhtos sells the first fire resistance recipes.", craft: { Blacksmithing: "Plans: Dark Iron Helm", Leatherworking: "Pattern: Molten Helm", Tailoring: "Pattern: Flarecore Gloves" } },
      3: { txt: "The Brotherhood's better recipes.", craft: { Blacksmithing: "Plans: Dark Iron Gauntlets", Leatherworking: "Pattern: Corehound Belt", Tailoring: "Pattern: Flarecore Wraps" } },
      4: { txt: "Exalted with the Thorium Brotherhood: the Black Anvil is yours to use, and the Brotherhood's best plans." } } },
};
const FAC_PREF = 0.6; // a free evening with a faction goal goes to the grind this often

// points in: the rank-up lines and rewards
function facGain(f, n) {
  if (!S.fac || n <= 0) return;
  const was = facRank(f);
  S.fac[f] = Math.min(FAC_RANKS[4][0] + 999, facPts(f) + n);
  for (let r = was + 1; r <= facRank(f); r++) facReward(f, r);
}
function facReward(f, r) {
  log(`${FAC_RANKS[r][1]} with ${facThe(f)}!`, "ach");
  const w = FACTIONS[f] && FACTIONS[f].rewards[r]; if (!w) return;
  const craft = w.craft && crafts().map(c => w.craft[c]).find(Boolean);
  log(`${w.txt}${craft ? ` ${S.name} buys ${craft}.` : ""}`, "quest");
  if (w.item) gain(w.item(), "Reputation reward:");
  if (w.ench) facEnchants(true);
}
// the reputation enchants: on the item in the slot now, and again on whatever replaces it (after each enchant visit)
function facEnchants(loud) {
  if (!S.fac) return;
  Object.entries(FACTIONS).forEach(([f, d]) => Object.entries(d.rewards).forEach(([r, w]) => {
    if (!w.ench || facRank(f) < +r) return;
    w.ench.forEach(([slot, nm, t]) => {
      const it = S.equip[slot]; if (!it || (it.ench && it.ench.t >= t)) return;
      it.ench = { name: nm(), t };
      if (loud) log(`${nm()} on ${it.name}.`, "spell");
    });
  }));
}

// ---------- on their own: raid bosses and dungeon clears ----------
const FAC_RUNES = { Magmadar: "the Rune of Kress", Gehennas: "the Rune of Mohn", Garr: "the Rune of Blaz", Shazzrah: "the Rune of Zeth", "Baron Geddon": "the Rune of Theri", "Golemagg the Incinerator": "the Rune of Koro", "Sulfuron Harbinger": "the Rune of Mazj" };
function facBoss(dn, boss) {
  if (S.level < 60) return;
  if (dn === "Molten Core") {
    // only Golemagg and Ragnaros give reputation past honored, as in classic
    if (facRank("Hydraxian Waterlords") < 2 || boss === "Ragnaros" || boss === "Golemagg the Incinerator") facGain("Hydraxian Waterlords", boss === "Ragnaros" ? 1000 : 300);
    if (FAC_RUNES[boss] && facRank("Hydraxian Waterlords") >= 2 && Math.random() < 0.4) log(`${S.name} douses ${FAC_RUNES[boss]} with Aqual Quintessence. Steam everywhere.`, "spell");
    facGain("Thorium Brotherhood", 40); // a Fiery Core or a Lava Core for Lokhtos
  }
  if (dn === "Zul'Gurub") facGain("Zandalar Tribe", boss === "Hakkar" ? 600 : 200);
  if (dn === "Naxxramas") facGain("Argent Dawn", 150);
}
function facRun(dn) {
  if (S.level < 60) return;
  if (dn === "Stratholme" || dn === "Scholomance") facGain("Argent Dawn", 250);
  if (dn === "Blackrock Depths") facGain("Thorium Brotherhood", 200);
}

// ---------- the grind: a goal's free evenings ----------
const facGoalOf = () => { const g = goalWith("fac:"); return g ? g.id.slice(4) : null; };
const facPick = () => { const f = facGoalOf(); return S.level >= 60 && f && FACTIONS[f] && FACTIONS[f].zone && Math.random() < FAC_PREF ? { name: f, fac: true } : null; };
function queueFac(row) {
  const q = S.queue, f = row.name, d = FACTIONS[f];
  q.push({ k: "move", d: `Flying to ${d.zone} for ${facThe(f)}${d.group ? `, ${d.group}` : ""}`, t: sec(70) });
  for (let i = 0, n = 5 + R(3); i < n; i++) {
    if (i && i % 3 === 0) q.push({ k: "move", d: `Looking for the next camp`, t: sec(30) });
    q.push(cqFight(`Grinding reputation with ${facThe(f)}`, pick(d.foes), 60 + R(2), { fac: f, die: Math.random() < 0.015 }));
  }
  q.push({ k: "facturn", d: `Turning in ${d.turnin}`, t: sec(10), fac: f });
}
const FAC_FINISH = { facturn(t) { facGain(t.fac, 120 + R(80)); S.money += 8000 + R(8000); log(`Turned in ${FACTIONS[t.fac].turnin.replace(/ to .*$/, "")}. ${facRankName(t.fac)} with ${facThe(t.fac)} (${facPts(t.fac).toLocaleString()}).`, "quest"); } };

// ---------- goals and the Quests tab ----------
function facGoals(out) {
  if (S.level < 60) return;
  Object.entries(FACTIONS).forEach(([f, d]) => {
    if (!d.zone || facRank(f) >= 4) return;
    const top = FAC_RANKS[4][0];
    out.push({ id: "fac:" + f, name: `Exalted with ${facThe(f)}`, what: `Free evenings go to ${facThe(f)}: ${d.zone}, ${d.turnin}. ${Object.entries(d.rewards).map(([r, w]) => `${FAC_RANKS[r][1]}: ${w.item ? w.item().name : w.ench ? w.ench.map(e => e[1]()).filter((x, i, a) => a.indexOf(x) === i).join(", ") : w.craft ? "recipes" : "the story"}`).join(" · ")}. Weeks.`,
      prog: () => [Math.min(facPts(f), top), top], txt: () => `${facRankName(f)} (${facPts(f).toLocaleString()} of ${top.toLocaleString()})`, done: () => facRank(f) >= 4 });
  });
}
function facRender() {
  if (S.level < 60 || !S.fac) return "";
  const rows = Object.keys(FACTIONS).filter(f => facPts(f) > 0).map(f => { const r = facRank(f), lo = FAC_RANKS[r][0], hi = r < 4 ? FAC_RANKS[r + 1][0] : lo, pct = r < 4 ? Math.round(100 * (facPts(f) - lo) / (hi - lo)) : 100;
    return `<li class="goal"><div class="gl"><b>${esc(f)} <span class="ilvl">(${esc(FAC_RANKS[r][1])})</span></b><small>${r < 4 ? `${(facPts(f) - lo).toLocaleString()} of ${(hi - lo).toLocaleString()} to ${FAC_RANKS[r + 1][1]}` : "Exalted"}</small><div class="bar"><i style="width:${pct}%"></i></div></div></li>`; });
  return rows.length ? `<li class="qhead">Reputation</li>` + rows.join("") : "";
}
