// Raid quests at 60: the attunement chains (Molten Core, Onyxia's Lair, Blackwing Lair, Naxxramas), each a string of
// steps the hero works through between raid nights (or faster, as a goal), and the Gates of Ahn'Qiraj: the server's war
// effort, the Scepter of the Shifting Sands (a goal: whoever finishes it first bangs the gong), the Ten Hours War, and
// only then Ruins and Temple of Ahn'Qiraj. Zul'Gurub, the Ruins and the world bosses need no attunement.
"use strict";

// a step: [kind, text, arg, n]
//   go:   a trip, a talk, a hunt (arg: how long, in sec() seconds; n "xN": that many trips, for a reputation)
//   run:  a level 60 dungeon cleared (arg: the dungeon, or two joined by "/"; n: the chance a clear does it (the drop isn't
//         there, the group skips the boss), or with "x": that many clears)
//   boss: a raid boss killed (arg: the boss)
//   boss: with n a number: only kills from now on count, each with that chance (a drop); arg may name several, joined by "/"
//   gold: paid (arg: copper)
//   fight: a named fight alone (arg: the foe, n: its level), played out like a class quest's (classq.js)
const ATT_CHAINS = {
  mc: { raid: "Molten Core", name: "Attunement to the Core", steps: [
    ["go", "Find Lothos Riftwaker at the foot of Blackrock Mountain", 40],
    ["run", "Bring Lothos a Core Fragment from the Molten Core portal in Blackrock Depths", "Blackrock Depths", 0.7],
    ["run", "Clear Blackrock Depths with the guild until everyone has their fragment", "Blackrock Depths/Lower Blackrock Spire", "x2"],
  ] },
  onyA: { raid: "Onyxia's Lair", side: "A", name: "The Drakefire Amulet", steps: [
    ["go", "Dragonkin Menace: kill Blackrock dragonspawn in the Burning Steppes", 150],
    ["go", "The True Masters: report to Magistrate Solomon in Lakeshire, then Highlord Bolvar in Stormwind", 60],
    ["go", "Marshal Windsor: find him at the top of Blackrock Mountain", 50],
    ["run", "Abandoned Hope: Marshal Windsor's lost notes in Blackrock Depths", "Blackrock Depths", 0.85],
    ["run", "Jail Break!: free Marshal Windsor from the Detention Block", "Blackrock Depths", 0.85],
    ["go", "Stormwind Rendezvous and The Great Masquerade: unmask Lady Prestor in front of Bolvar", 70],
    ["go", "The Dragon's Eye: take it to Haleh at the top of Mazthoril in Winterspring", 90],
    ["run", "Seal of Ascension: three gemstones from Lower Blackrock Spire, for the key to the upper spire", "Lower Blackrock Spire", 0.8],
    ["run", "Drakefire Amulet: kill General Drakkisath for the Blood of the Black Dragon Champion", "Upper Blackrock Spire", 0.85],
  ] },
  onyH: { raid: "Onyxia's Lair", side: "H", name: "The Blood of the Black Dragon Champion", steps: [
    ["run", "Warlord's Command: Highlord Omokk, War Master Voone, Overlord Wyrmthalak and the Important Blackrock Documents", "Lower Blackrock Spire", 0.8],
    ["go", "Eitrigg's Wisdom: report to Thrall in Orgrimmar", 50],
    ["run", "For the Horde!: bring back Warchief Rend Blackhand's head", "Upper Blackrock Spire", 0.85],
    ["go", "What the Wind Carries and The Champion of the Horde: Rexxar in Desolace", 80],
    ["go", "Oculus Illusions: Myranda the Hag's disguise in the Western Plaguelands", 60],
    ["go", "Emberstrife: fly into the Wyrmbog in Dustwallow Marsh, disguised as a black dragon", 70],
    ["go", "The Test of Skulls: Scryer in Winterspring, Somnus in the Swamp of Sorrows, Chronalis in Tanaris", 160],
    ["go", "Ascension: Emberstrife's last test", 40],
    ["run", "Blood of the Black Dragon Champion: kill General Drakkisath", "Upper Blackrock Spire", 0.85],
  ] },
  bwl: { raid: "Blackwing Lair", name: "Blackhand's Command", steps: [
    ["run", "Blackhand's Command: the Scarshield Quartermaster's orders in Blackrock Spire", "Lower Blackrock Spire", 0.7],
    ["run", "Touch the orb in General Drakkisath's chamber, after Drakkisath falls", "Upper Blackrock Spire", 0.8],
  ] },
  naxx: { raid: "Naxxramas", name: "The Dread Citadel", steps: [
    ["go", "Report to Archmage Angela Dosantos at Light's Hope Chapel", 60],
    ["run", "Argent Dawn: Scourgestones and Plaguelands quests until honored", "Stratholme/Scholomance", "x6"],
    ["gold", "Pay Archmage Angela Dosantos 60 gold for the attunement (honored with the Argent Dawn)", 600000],
  ] },
  scepter: { name: "The Scepter of the Shifting Sands", goal: true, steps: [
    ["go", "Call to Arms: Anachronos in the Caverns of Time, Tanaris", 50],
    ["go", "Long Forgotten Memories: the Bronze Dragonflight's past, deep in Silithus", 140],
    ["go", "A Pawn on the Eternal Board: Baristolth of the Shifting Sands at Cenarion Hold", 40],
    ["go", "Never Ask Me About My Business: Narain Soothfancy in Tanaris, and Azuregos's riddles", 120],
    ["go", "Draconic for Dummies: the three chapters, from Stormwind, Orgrimmar and Gadgetzan", 160, "x2"],
    ["go", "Translating the Ledger: twenty Encrypted Twilight Texts from the cultists in Silithus", 200, "x4"],
    ["go", "The Blue Scepter Shard: Azuregos's Magical Ledger in Azshara", 120],
    ["go", "The Green Scepter Shard: Eranikus and the Nightmare in Moonglade", 200, "x3"],
    ["boss", "The Red Scepter Shard: free Vaelastrasz from Nefarian's corruption in Blackwing Lair", "Vaelastrasz the Corrupt"],
    ["boss", "Nefarius's Corruption: kill Nefarian, so Vaelastrasz's spirit hands over the red shard", "Nefarian"],
    ["go", "The Scepter of the Shifting Sands: Anachronos binds the three shards", 50],
  ] },
  // resistance gear for the bosses that ask for it (goals only): a step's fifth entry is the resistance it adds.
  // A run step may name a raid: a raid night there counts
  fire: { name: "Fire resistance gear", goal: true, res: "fire", vs: "Molten Core", bosses: ["Magmadar", "Ragnaros"], steps: [
    ["go", "Thorium Brotherhood: Dark Iron Ore and Core Leather to Lokhtos Darkbargainer at Thorium Point, until friendly", 200, "x4", 0],
    ["go", "Greater Fire Resistance on the cloak, and a stack of Greater Fire Protection Potions", 50, 0, 15],
    ["run", "Dark Iron Ore and Fiery Cores from Blackrock Depths", "Blackrock Depths", "x3", 0],
    ["go", "Thorium Brotherhood honored: the Molten Helm and the Dark Iron Gauntlets, made at the Black Anvil", 160, "x5", 55],
    ["run", "Lava Cores and Fiery Cores from Molten Core, for the Dark Iron Leggings", "Molten Core", "x2", 0],
    ["go", "Thorium Brotherhood revered: the Dark Iron Leggings, the Corehound Belt, Flarecore Wraps", 200, "x7", 80],
  ] },
  nature: { name: "Nature resistance gear", goal: true, res: "nature", vs: "Temple of Ahn'Qiraj", bosses: ["Princess Huhuran", "Viscidus"], steps: [
    ["go", "Cenarion Circle: the Silithus quests at Cenarion Hold and the Twilight cultists, until friendly", 220, "x5", 0],
    ["go", "Greater Nature Protection Potions, and Greater Nature Resistance on the cloak", 50, 0, 15],
    ["run", "Ruins of Ahn'Qiraj for Cenarion Circle reputation and Silithid Carapace", "Ruins of Ahn'Qiraj", "x2", 0],
    ["go", "Cenarion Circle honored: the Sandstalker, Spitfire and Bramblewood bracers", 140, "x5", 60],
    ["go", "Cenarion Circle revered: the rest of the Sandstalker, Spitfire and Bramblewood sets", 220, "x7", 85],
  ] },
  frost: { name: "Frost resistance gear", goal: true, res: "frost", vs: "Naxxramas", bosses: ["Sapphiron", "Kel'Thuzad"], steps: [
    ["go", "Argent Dawn revered: Scourgestones, Plaguelands quests, the Argent Dawn tabard", 240, "x8", 0],
    ["go", "Frost Protection Potions and a Glacial Cloak from a tailor", 60, 0, 30],
    ["run", "Frozen Runes from the Naxxramas trash", "Naxxramas", "x2", 0],
    ["go", "The first pieces of the Argent Dawn sets: Glacial for tailors, Polar and Icy Scale for leatherworkers, Icebane for smiths", 140, "x4", 90],
    ["run", "More Frozen Runes", "Naxxramas", "x2", 0],
    ["go", "The rest of the set, and Frost Resistance on the cloak", 160, "x5", 100],
  ] },
};
// resistance: what a set aims for (the sum of its steps), and the hero's so far
const RES_KEYS = ["fire", "nature", "frost"];
const resOf = s => s[4] || 0;
const resTarget = k => ATT_CHAINS[k].steps.reduce((a, s) => a + resOf(s), 0);
const resNow = k => ATT_CHAINS[k].steps.slice(0, attStep(k)).reduce((a, s) => a + resOf(s), 0);
const resFor = boss => RES_KEYS.find(x => ATT_CHAINS[x].bosses.includes(boss)) || null;
// on the bosses that check it: fewer wipes with the gear on (up to a fifth with the full set; without it, as before)
const resWipe = boss => { const k = resFor(boss); return k ? 1 - 0.2 * resNow(k) / resTarget(k) : 1; };
function resLine(boss) {
  const k = resFor(boss); if (!k || !resNow(k) || Math.random() < 0.5) return;
  log(`${S.name} swaps into ${ATT_CHAINS[k].res} resistance gear for ${boss} (${resNow(k)} ${ATT_CHAINS[k].res} resistance). ${pick(["It barely tickles.", "The healers notice.", "Worth every Thorium Bar."])}`, "spell");
}
const ATT_PREF = 0.75; // without a goal: the chance a free evening goes to the dungeon the next step needs
// the chain for a raid (for this faction), and the raids each chain opens
const attChain = raid => Object.keys(ATT_CHAINS).find(k => ATT_CHAINS[k].raid === raid && (!ATT_CHAINS[k].side || ATT_CHAINS[k].side === S.faction[0])) || null;
const attStep = k => S.att[k] || 0;
const attDone = k => attStep(k) >= ATT_CHAINS[k].steps.length;
const attCur = k => attDone(k) ? null : ATT_CHAINS[k].steps[attStep(k)];
// the chains this hero works on: the raid ones (its own faction's); the Scepter and the resistance sets only as goals
// (class quest chains, classq.js: only the hero's class)
const attMine = k => (!ATT_CHAINS[k].side || ATT_CHAINS[k].side === S.faction[0]) && (!ATT_CHAINS[k].cls || [].concat(ATT_CHAINS[k].cls).includes(S.cls)) && (!ATT_CHAINS[k].tank || heroRole() === "tank");
const attKeys = () => Object.keys(ATT_CHAINS).filter(k => !ATT_CHAINS[k].goal && attMine(k));
const attGoalKeys = () => Object.keys(ATT_CHAINS).filter(k => ATT_CHAINS[k].goal && attMine(k));
const attStepTxt = k => { if (attDone(k)) return "done"; const s = attCur(k), c = typeof s[3] === "string" ? ` (${S.attN[k] || 0} of ${s[3].slice(1)})` : ""; return `step ${attStep(k) + 1} of ${ATT_CHAINS[k].steps.length}: ${s[1]}${c}`; };
const attWorking = k => S.level >= 60 && !attDone(k) && (!ATT_CHAINS[k].goal || hasGoal("att:" + k));
// gold kept back for the chains' gold steps that are up next (spendable() leaves it alone, like the mount savings)
const attReserve = () => S.level < 60 ? 0 : attKeys().concat(attGoalKeys()).filter(attWorking).reduce((a, k) => { const s = attCur(k); return a + (s[0] === "gold" ? s[2] : 0); }, 0);

function attAdvance(k) {
  const c = ATT_CHAINS[k], s = c.steps[attStep(k)];
  S.att[k] = attStep(k) + 1; delete S.attN[k];
  if (attDone(k)) {
    if (k === "scepter") return scepterDone();
    if (c.cls) return cqChainDone(k);
    if (c.res) return log(`${c.name} complete: ${resNow(k)} ${c.res} resistance for ${c.bosses.join(" and ")}.`, "ach");
    log(`${c.name} is done: attuned to ${c.raid}!`, "ach");
  } else log(`${c.name}: ${s[1].replace(/:.*$/, "")} done${resOf(s) ? ` (${resNow(k)} ${c.res} resistance)` : ""}. Next: ${attCur(k)[1]}.`, "quest");
  dirty = true;
}
// a step done once more: "xN" steps count up, the rest are done
function attCount(k, xn) {
  if (typeof xn !== "string") return attAdvance(k);
  const c = S.attN[k] = (S.attN[k] || 0) + 1, n = +xn.slice(1);
  if (c >= n) attAdvance(k); else log(`${ATT_CHAINS[k].name}: ${attCur(k)[1].replace(/:.*$/, "")}, ${c} of ${n}.`, "quest");
}
// a level 60 dungeon cleared: the steps that wanted it
function attRun(dn) {
  if (S.level < 60) return;
  attKeys().concat(attGoalKeys()).filter(attWorking).forEach(k => {
    const s = attCur(k); if (s[0] !== "run" || !s[2].split("/").includes(dn)) return;
    if (typeof s[3] === "string") return attCount(k, s[3]);
    if (Math.random() < s[3]) attAdvance(k);
    else log(`${ATT_CHAINS[k].name}: no luck in ${dn} this time (${s[1].replace(/:.*$/, "")}).`, "quest");
  });
}
// after every task: raid bosses and gold steps
function attTick() {
  if (S.level < 60) return;
  attKeys().concat(attGoalKeys()).filter(attWorking).forEach(k => {
    const s = attCur(k);
    if (s[0] === "boss" && typeof s[3] === "number") attDrop(k, s);
    else if (s[0] === "boss" && S.bossKills[s[2]] > 0) attAdvance(k);
    else if (s[0] === "gold" && S.money >= s[2]) { spend("gear", s[2]); attAdvance(k); } // a raid key comes before the epic mount
  });
  aqTick();
}
// a boss step that waits for a drop: each new kill of one of its bosses, a roll
function attDrop(k, s) {
  const kills = s[2].split("/").reduce((a, b) => a + (S.bossKills[b] || 0), 0);
  if (S.attN[k] == null) { S.attN[k] = kills; return; }
  if (kills <= S.attN[k]) return;
  S.attN[k] = kills;
  if (Math.random() < s[3]) attAdvance(k);
  else log(`${ATT_CHAINS[k].name}: ${s[1].replace(/:.*$/, "")}, not this time.`, "quest");
}
// a world boss a step is waiting for (wbPick goes for it)
const attWantsBoss = b => attKeys().concat(attGoalKeys()).filter(attWorking).some(k => { const s = attCur(k); return s[0] === "boss" && s[2].split("/").includes(b); });
// the dungeon a step needs (on a free evening): always for a goal's chain or the chain of a raid goal, often otherwise
function attDungeon() {
  const ks = attKeys().concat(attGoalKeys()).filter(k => attWorking(k) && attCur(k)[0] === "run" && attCur(k)[2].split("/").some(n => !RAID_INFO[n]));
  if (!ks.length) return null;
  const rg = goalWith("raid:"), want = ks.find(k => hasGoal("att:" + k) || (rg && rg.id === "raid:" + ATT_CHAINS[k].raid));
  const k = want || (Math.random() < ATT_PREF ? pick(ks) : null);
  return k ? instanceRow(pick(attCur(k)[2].split("/").filter(n => !RAID_INFO[n]))) : null;
}
// trips and talks: one at a time, after the city visit (a goal's chain first)
function attTrip(q) {
  const ks = attKeys().concat(attGoalKeys()).filter(k => attWorking(k) && (attCur(k)[0] === "go" || attCur(k)[0] === "fight"));
  if (!ks.length) return false;
  const k = ks.find(x => hasGoal("att:" + x)) || ks[0], s = attCur(k);
  if (s[0] === "fight") { q.push(cqFight(`${ATT_CHAINS[k].name}: ${s[1]}`, s[2], s[3] || 60, { ch: k, st: attStep(k) })); return true; }
  q.push({ k: "att", d: `${ATT_CHAINS[k].name}: ${s[1]}`, t: sec(s[2]), ch: k, st: attStep(k) });
  return true;
}
const ATT_FINISH = {
  att(t) { if (attStep(t.ch) === t.st) attCount(t.ch, attCur(t.ch)[3]); },
  aqhand(t) { aqHand(t); },
  aqwar(t) { aqWar(t); },
};
const attuned = n => { const k = attChain(n); return !k || attDone(k); };

// ---------- the Gates of Ahn'Qiraj ----------
// the war effort starts when the hero's raids reach Blackwing Lair (the server is there by then), or at the latest
// AQ_LATE days after 60; it takes AQ_EFFORT days (the hero's hand-ins, once a day, shave a little off), then the first one with the Scepter of the
// Shifting Sands bangs the gong: the hero, if it finished the chain in time, or someone from the rival guild once they
// have killed Nefarian (one to six days after the effort).
// Ten hours of war at the Scarab Wall, and the Ruins and the Temple open.
const AQ_EFFORT = 8, AQ_LATE = 30, AQ_WAR = 10 * HOUR;
const AQ_RAIDS = ["Ruins of Ahn'Qiraj", "Temple of Ahn'Qiraj"];
const newAq = () => ({ start: null, end: null, gong: null, by: null, hero: false, open: false, war: 0, hand: 0, rd: 0 });
const aqDay60 = () => { const p = S.ach.L60 && S.ach.L60.p; return p == null ? null : (S.time - p) / DAY; };
const aqOpen = n => !AQ_RAIDS.includes(n) || S.aq.open;
const aqPct = () => S.aq.start == null ? 0 : S.aq.end != null && S.time >= S.aq.end ? 100 : Math.min(99, Math.floor(100 * (S.time - S.aq.start) / (S.aq.end - S.aq.start)));
function aqTick() {
  const a = S.aq; if (a.open) return;
  if (a.start == null) {
    const d = aqDay60();
    if (!(S.lock["Blackwing Lair"] || S.bossKills["Razorgore the Untamed"] > 0 || (d != null && d >= AQ_LATE))) return;
    // the rival guild needs Nefarian dead for its Scepter too: a day or three after that, but never more than six days
    // after the war effort (someone on the server always gets there)
    const nef = S.guild && S.guild.rival.days.Nefarian, at60 = S.time - (d || 0) * DAY;
    a.start = S.time; a.end = S.time + AQ_EFFORT * DAY;
    a.rd = (clamp(nef != null ? at60 + (nef + 1 + Math.random() * 2) * DAY : 0, a.end + DAY, a.end + 6 * DAY) - a.end) / DAY;
    log(`The Ahn'Qiraj War Effort begins! Both factions are asked for supplies: copper bars, herbs, leather, bandages, food. When it's done, the Scarab Gong in Silithus waits for someone with the Scepter of the Shifting Sands.`, "ach");
    return;
  }
  if (a.gong == null) {
    if (S.time < a.end) return;
    if (!a.endLog) { a.endLog = 1; log(`The war effort is complete: the supplies are in. The Scarab Gong waits for the first one with the Scepter of the Shifting Sands.`, "ach"); }
    if (attDone("scepter")) return aqGong(true);
    if (S.time >= a.end + a.rd * DAY) return aqGong(false);
    return;
  }
  if (S.time >= a.gong + AQ_WAR) {
    a.open = true;
    log(`The Ten Hours War is over. The Scarab Wall is open: Ruins of Ahn'Qiraj and the Temple of Ahn'Qiraj can be raided.`, "ach");
  }
}
function aqGong(hero) {
  const a = S.aq, rival = S.guild ? S.guild.rival.name : null;
  a.gong = S.time; a.hero = hero; a.by = hero ? S.name : pugMember("tank", takenNames(), S.faction).name;
  if (hero) { log(`${S.name} bangs the Scarab Gong! The Scarab Wall shakes, the Qiraji pour out, and the Ten Hours War begins.`, "ach"); addMount("Black Qiraji Battle Tank", "Anachronos hands over the Black Qiraji Resonating Crystal, and the title Scarab Lord."); }
  else log(`${a.by}${rival ? ` of <${rival}>` : ""} bangs the Scarab Gong in Silithus! The Scarab Wall shakes and the Ten Hours War begins.`, "ach");
}
// the Scepter done: in time, the gong is the hero's; too late, it's a keepsake
function scepterDone() {
  const a = S.aq;
  log(`The Scepter of the Shifting Sands is whole!`, "ach");
  if (a.gong == null) { if (a.end != null && S.time >= a.end) aqGong(true); else log(`Now the war effort has to finish, and the gong is ${S.name}'s to bang.`, "quest"); }
  else log(`Too late for the gong: ${a.by} rang it first. It goes on the wall as a keepsake.`, "quest");
}
// city visits during the war effort: supplies handed in (a little faster for the server)
function aqCity(q) {
  const a = S.aq; if (S.level < 60 || a.start == null || a.gong != null || S.time >= a.end || Math.floor(S.time / DAY) === a.handDay) return; // once a day
  a.handDay = Math.floor(S.time / DAY);
  const what = pick(["20 Copper Bars", "20 Runecloth Bandages", "20 Heavy Leather", "20 Purple Lotus", "20 Baked Salmon", "20 Thorium Bars", "20 Linen Bandages", "20 Arthas' Tears", "20 Spotted Yellowtail"]);
  q.push({ k: "aqhand", d: `Handing in ${what} for the Ahn'Qiraj War Effort`, t: sec(8), what });
}
function aqHand(t) {
  const a = S.aq; a.hand++;
  if (a.end != null && a.gong == null) a.end -= 2 * HOUR;
  const cost = Math.min(30000, spendable()); if (cost) spend("mats", cost);
  log(`Handed in ${t.what} for the war effort (${aqPct()}%). A Commendation Signet for ${S.name}.`, "quest");
}
// the Ten Hours War: if the hero is about, a few waves at the Scarab Wall (flavour: the gates open on the clock either way)
function aqWarQueue(q) {
  const a = S.aq; if (S.level < 60 || a.gong == null || a.open || a.war) return false;
  a.war = 1;
  q.push({ k: "move", d: `Flying to Silithus for the Ten Hours War`, t: sec(80) });
  [`Holding the line at the Scarab Wall against the Qiraji`, `Fighting Anubisath Defenders outside Cenarion Hold`, `Driving back a wave of silithid from the Gates of Ahn'Qiraj`].forEach((d, i) => q.push({ k: "aqwar", d, t: sec(120), wave: i }));
  return true;
}
function aqWar(t) {
  const lines = [`The whole server is in Silithus. ${pick(["The frame rate drops to two.", "The server lags so hard spells land a minute late.", "Horde and Alliance fight side by side, for once."])}`,
    `${pick(["Colossus of Zora", "Colossus of Regal", "Colossus of Ashi"])} lumbers out of the sand. ${pick(["It takes a hundred players to bring it down.", "Everyone runs."])}`,
    `${S.name} dies, runs back from the graveyard, dies again. ${pick(["Worth it.", "This is the best night of the year."])}`];
  log(lines[t.wave] || lines[0], "boss");
}

// ---------- goals ----------
// a goal per unfinished chain (the Scepter only before the gong)
function attGoals(out) {
  if (S.level < 60) return;
  attKeys().concat(S.aq.gong == null || hasGoal("att:scepter") ? ["scepter"] : [], RES_KEYS, attGoalKeys().filter(k => ATT_CHAINS[k].cls)).filter(k => !attDone(k)).forEach(k => {
    const c = ATT_CHAINS[k], n = c.steps.length;
    if (c.res) return out.push({ id: "att:" + k, name: c.name, what: `Reputation, crafts and raid drops for ${resTarget(k)} ${c.res} resistance, worn for ${c.bosses.join(" and ")} in ${c.vs}: fewer wipes there. ${n} steps, one to three weeks.`,
      need: k === "nature" && !S.aq.open ? "Needs the Gates of Ahn'Qiraj open" : k === "frost" && !attuned("Naxxramas") ? "Needs the Naxxramas attunement (The Dread Citadel)" : null,
      prog: () => [resNow(k), resTarget(k)], txt: () => `${resNow(k)} of ${resTarget(k)} ${c.res} resistance · ${attStepTxt(k)}`, done: () => attDone(k) });
    if (c.cls) return out.push({ id: "att:" + k, name: c.name, what: c.what, need: c.need ? c.need() : null, prog: () => [attStep(k), n], txt: () => attStepTxt(k), done: () => attDone(k) });
    out.push({ id: "att:" + k, name: c.name, what: k === "scepter"
      ? `The long quest line for the Scepter of the Shifting Sands: Anachronos, the red shard from Blackwing Lair, Narain Soothfancy's blue shard, the green from Eranikus. Finish it before the war effort ends and the Scarab Gong is ${S.name}'s: the Black Qiraji Battle Tank. Weeks, and Nefarian has to die.`
      : `The quest line to ${c.raid}: ${n} steps, mostly between raid nights. As a goal, every free evening goes to it.`,
      prog: () => [attStep(k), n], txt: () => attStepTxt(k), done: () => attDone(k) });
  });
}
// the Quests tab: the chains in progress and the war effort
function attRender() {
  if (S.level < 60) return "";
  const ks = attKeys().filter(k => !attDone(k) && !hasGoal("att:" + k)), a = S.aq;
  const rows = ks.map(k => `<li class="goal"><div class="gl"><b>${esc(ATT_CHAINS[k].name)} <span class="ilvl">(${esc(ATT_CHAINS[k].raid || "class quest")})</span></b><small>${esc(attStepTxt(k))}</small></div></li>`);
  if (a.start != null && !a.open) rows.push(`<li class="goal"><div class="gl"><b>The Gates of Ahn'Qiraj</b><small>${a.gong != null ? `${esc(a.by)} has rung the Scarab Gong: the Ten Hours War` : aqPct() >= 100 ? "War effort complete: waiting for the Scepter of the Shifting Sands" : `War effort ${aqPct()}%${a.hand ? `, ${a.hand} hand-in${a.hand > 1 ? "s" : ""} from ${esc(S.name)}` : ""}`}</small><div class="bar"><i style="width:${aqPct()}%"></i></div></div></li>`);
  return rows.length ? `<li class="qhead">Raid quests</li>` + rows.join("") : "";
}
