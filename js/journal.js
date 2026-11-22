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
const factionDungeons = () => DUNGEONS.filter(d => d.side === "B" || d.side === S.faction[0]);
const ACH = [
  ...[10, 20, 30, 40, 50].map(n => ({ id: "L" + n, name: `Level ${n}`, desc: `Reach level ${n}.`, test: () => S.level >= n })),
  { id: "L60", name: "Level 60", desc: "Reach the level cap.", test: () => S.level >= 60 },
  { id: "goal1", name: "Something to Aim For", desc: "Reach a goal at level 60.", test: () => Object.keys(S.goalsDone || {}).length >= 1 },
  { id: "goal10", name: "Goal Getter", desc: "Reach 10 goals at level 60.", test: () => Object.keys(S.goalsDone || {}).length >= 10 },
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
  { id: "d10", name: "Seasoned Adventurer", desc: "Clear 10 different dungeons.", test: () => S.dungeons.filter(n => !RAIDS.some(r => r.name === n)).length >= 10 },
  { id: "dall", name: "Dungeon Master", desc: "Clear every dungeon open to your faction.", test: () => factionDungeons().every(d => S.dungeons.includes(d.name)) },
  ...RAIDS.map(r => ({ id: "raid-" + r.abbr, name: r.name, desc: `Defeat ${RAID_INFO[r.name].last} (${RAID_INFO[r.name].size}-man raid).`, test: () => S.dungeons.includes(r.name) })),
  { id: "raidall", name: "Raider", desc: "Clear every raid, from Molten Core to Naxxramas.", test: () => RAIDS.every(r => S.dungeons.includes(r.name)) },
];
// ---------- profession achievements: under their own heading, and only for the hero's own professions ----------
const PROF_NOUN = { Mining: "Miner", Herbalism: "Herbalist", Skinning: "Skinner", Blacksmithing: "Blacksmith", Leatherworking: "Leatherworker", Tailoring: "Tailor", Alchemy: "Alchemist", Enchanting: "Enchanter", Engineering: "Engineer" };
const GATHER_ACH = {
  Mining: ["First Ore", "Thorium Strike", "Thorium Ore", "Rock Collector", "Deep Miner"],
  Herbalism: ["Flower Picker", "Dreamfoil", "Dreamfoil", "Flower Power", "Master Herbalist"],
  Skinning: ["First Skin", "Rugged Hide", "Rugged Leather", "Hide and Seek", "Master Skinner"],
};
const madeCount = () => (S.prof && S.prof.made) || 0;
const makesGear = () => crafts().some(c => c !== "Alchemy" && c !== "Enchanting");
const PROF_ACH = [
  ...Object.entries(PROF_NOUN).flatMap(([n, who]) => [[150, "Journeyman"], [225, "Expert"], [300, "Artisan"]].map(([v, tier]) =>
    ({ id: `p-${n}-${v}`, name: `${tier} ${who}`, desc: `Reach ${v} in ${n}.`, show: () => hasProf(n), test: () => profSkill(n) >= v }))),
  { id: "p-fa300", name: "Field Medic", desc: "Reach 300 in First Aid.", test: () => profSkill("First Aid") >= 300 },
  { id: "p-cook300", name: "Artisan Cook", desc: "Reach 300 in Cooking.", test: () => profSkill("Cooking") >= 300 },
  ...Object.entries(GATHER_ACH).flatMap(([n, [first, top, topMat, c100, c1k]]) => [
    { id: `p-${n}-1`, name: first, desc: `Gather with ${n} for the first time.`, show: () => hasProf(n), test: () => profCount(n) >= 1 },
    { id: `p-${n}-top`, name: top, desc: `Gather your first ${topMat}.`, show: () => hasProf(n), test: () => profCount("top:" + n) >= 1 },
    { id: `p-${n}-100`, name: c100, desc: `Gather 100 materials with ${n}.`, show: () => hasProf(n), test: () => profCount(n) >= 100 },
    { id: `p-${n}-1k`, name: c1k, desc: `Gather 1,000 materials with ${n}.`, show: () => hasProf(n), test: () => profCount(n) >= 1000 },
  ]),
  { id: "p-made1", name: "Handmade", desc: "Craft your first item.", test: () => madeCount() >= 1 },
  { id: "p-made100", name: "Busy Hands", desc: "Craft 100 items.", test: () => madeCount() >= 100 },
  { id: "p-made1k", name: "Master Crafter", desc: "Craft 1,000 items.", test: () => madeCount() >= 1000 },
  { id: "p-wear", name: "Made to Measure", desc: "Wear a piece of gear you crafted yourself.", show: makesGear, test: () => eq(it => it.made) },
  { id: "p-green", name: "Fine Craftsmanship", desc: "Craft a green piece of gear.", show: makesGear, test: () => profCount("q2") >= 1 },
  { id: "p-blue", name: "A Cut Above", desc: "Craft a blue piece of gear (from skill 150).", show: makesGear, test: () => profCount("q3") >= 1 },
  { id: "p-epic", name: "Masterwork", desc: "Craft an epic at skill 300.", show: () => crafts().some(c => MASTER[c]), test: () => profCount("q4") >= 1 },
  { id: "p-bag1", name: "Sewn Together", desc: "Sew your first bag.", show: () => hasProf("Tailoring"), test: () => profCount("bags") >= 1 },
  { id: "p-bag4", name: "All Homemade", desc: "Sew four bags.", show: () => hasProf("Tailoring"), test: () => profCount("bags") >= 4 },
  { id: "p-pots", name: "Brewmaster", desc: "Brew 100 potions and elixirs.", show: () => hasProf("Alchemy"), test: () => profCount("pots") >= 100 },
  { id: "p-flask", name: "Flask in Hand", desc: "Make your first flask.", show: () => hasProf("Alchemy"), test: () => profCount("flask") >= 1 },
  { id: "p-ench", name: "Self-Enchanted", desc: "Enchant your own gear.", show: () => hasProf("Enchanting"), test: () => profCount("selfEnch") >= 1 },
  { id: "p-de", name: "Dust to Dust", desc: "Disenchant 50 items.", show: () => hasProf("Enchanting"), test: () => profCount("de") >= 50 },
  { id: "p-bomb", name: "Fire in the Hole", desc: "Throw your first bomb in a fight.", show: () => hasProf("Engineering"), test: () => profCount("bombs") >= 1 },
  { id: "p-band", name: "Patched Up", desc: "Use 100 bandages.", test: () => profCount("band") >= 100 },
  { id: "p-meals", name: "Hearty Appetite", desc: "Eat 100 meals for the Well Fed buff.", test: () => profCount("meals") >= 100 },
  { id: "p-ah100", name: "Auction House Regular", desc: "Earn 100 gold selling materials on the Auction House.", test: () => ((S.prof && S.prof.ah) || 0) >= 1000000 },
  { id: "p-ah1k", name: "Tycoon", desc: "Earn 1,000 gold selling materials on the Auction House.", test: () => ((S.prof && S.prof.ah) || 0) >= 10000000 },
  { id: "p-crusader", name: "Crusader", desc: "Get Crusader on your weapon, bought or enchanted yourself.", test: () => eq(it => it.ench && it.ench.name === "Crusader") },
];
ACH.push(...PROF_ACH.map(a => ({ ...a, cat: "prof" })));
// friends and the guild
ACH.push(...[
  { id: "fr1", name: "A Friend Indeed", desc: "Make your first friend.", test: () => (S.friends || []).length >= 1 },
  { id: "fr10", name: "Full Friends List", desc: "Have ten friends at once.", test: () => (S.friends || []).length >= 10 },
  { id: "guild", name: "Guilded", desc: "Found or join a guild.", test: () => !!S.guild },
  { id: "guild40", name: "Raiding Guild", desc: "Have 40 members in your guild.", test: () => !!S.guild && S.guild.roster.length + S.friends.length + 1 >= 40 },
  { id: "sfirst", name: "Server First!", desc: "Beat the rival guild to a server first.", test: () => !!S.guild && Object.values(S.guild.firsts).some(x => x.us) },
].map(a => ({ ...a, cat: "social" })));
// PvP
ACH.push(...[
  { id: "bgwin", name: "Victory!", desc: "Win a battleground.", test: () => Object.values(S.pvp.games).some(g => g.w > 0) },
  { id: "bgall", name: "Battlemaster", desc: "Win Warsong Gulch, Arathi Basin and Alterac Valley.", test: () => BGS.every(b => (S.pvp.games[b.abbr] || {}).w > 0) },
  { id: "flag", name: "Flag Runner", desc: "Capture the enemy flag in Warsong Gulch yourself.", test: () => S.pvp.caps > 0 },
  { id: "general", name: "Down Goes the General", desc: "Kill the enemy general in Alterac Valley.", test: () => S.pvp.generals > 0 },
  { id: "flawless", name: "Three to Nothing", desc: "Win Warsong Gulch 3–0.", test: () => S.pvp.flawless > 0 },
  { id: "wins100", name: "Battle-Hardened", desc: "Win 100 battlegrounds.", test: () => Object.values(S.pvp.games).reduce((a, g) => a + g.w, 0) >= 100 },
  { id: "kb100", name: "Killing Blow", desc: "Land 100 killing blows.", test: () => S.pvp.kb >= 100 },
  { id: "avex", name: "Exalted in the Valley", desc: "Exalted with the Stormpike Guard or the Frostwolf Clan (the Alterac Valley mount).", test: () => S.pvp.av >= AV_EXALTED },
  { id: "hk100", name: "Honorable Kills", desc: "100 honorable kills.", test: () => S.pvp.hk >= 100 },
  { id: "hk1000", name: "A Thousand Honorable Kills", desc: "1000 honorable kills.", test: () => S.pvp.hk >= 1000 },
  { id: "rank6", name: "Officer", desc: "Reach PvP rank 6 (Knight or Stone Guard).", test: () => S.pvp.best >= 6 },
  { id: "rank11", name: "War Mount", desc: "Reach PvP rank 11 (Commander or Lieutenant General).", test: () => S.pvp.best >= 11 },
  { id: "rank10", name: "Officer of the Line", desc: "Reach PvP rank 10 (Lieutenant Commander or Champion).", test: () => S.pvp.best >= 10 },
  { id: "rank14", name: "The Highest Rank", desc: "Reach PvP rank 14 (Grand Marshal or High Warlord).", test: () => S.pvp.best >= 14 },
  { id: "wpgank", name: "Watch Your Back", desc: "Get ganked by a much higher level player of the other faction.", test: () => S.wpvp.ganked > 0 },
  { id: "wpcamp", name: "Corpse Camped", desc: "Get killed at your own corpse by the same ganker.", test: () => S.wpvp.camped > 0 },
  { id: "wpwin", name: "Fair Fight", desc: "Win a world PvP fight in a contested zone.", test: () => S.wpvp.won > 0 },
  { id: "wpwin25", name: "Terror of the Countryside", desc: "Win 25 world PvP fights.", test: () => S.wpvp.won >= 25 },
  { id: "wptown", name: "Town Raid", desc: "Kill the leader of an enemy town (Tarren Mill, the Crossroads, Southshore or Astranaar).", test: () => S.wpvp.towns > 0 },
  { id: "wpcap", name: "Storming the Capital", desc: "Kill Thrall in Orgrimmar or Highlord Bolvar Fordragon in Stormwind.", test: () => S.wpvp.capital > 0 },
  { id: "wpkazzak", name: "Kazzak in Stormwind", desc: "Be there when Lord Kazzak walks into Stormwind.", test: () => S.wpvp.kazzak > 0 },
  { id: "wpplague", name: "Corrupted Blood", desc: "Be in a capital when Hakkar's plague breaks out.", test: () => S.wpvp.plague > 0 },
].map(a => ({ ...a, cat: "pvp" })));
// raid quests: the attunement chains, the Gates of Ahn'Qiraj
const attOk = n => S.att && attuned(n);
ACH.push(...[
  { id: "attmc", name: "Attunement to the Core", desc: "Bring Lothos Riftwaker a Core Fragment: attuned to Molten Core.", test: () => attOk("Molten Core") },
  { id: "attony", name: "Onyxia's Key", desc: "Finish the Onyxia attunement: the Drakefire Amulet (Alliance) or the Blood of the Black Dragon Champion (Horde).", test: () => attOk("Onyxia's Lair") },
  { id: "attbwl", name: "Blackhand's Command", desc: "Touch the orb in Upper Blackrock Spire: attuned to Blackwing Lair.", test: () => attOk("Blackwing Lair") },
  { id: "attnaxx", name: "The Dread Citadel", desc: "Honored with the Argent Dawn and attuned to Naxxramas.", test: () => attOk("Naxxramas") },
  { id: "aqhand", name: "Commendation Signet", desc: "Hand in supplies for the Ahn'Qiraj War Effort five times.", test: () => !!S.aq && S.aq.hand >= 5 },
  { id: "aqwar", name: "The Ten Hours War", desc: "Fight at the Scarab Wall when the gates of Ahn'Qiraj open.", test: () => !!S.aq && S.aq.war > 0 },
  { id: "scepter", name: "The Scepter of the Shifting Sands", desc: "Put the three shards of the Scepter of the Shifting Sands together.", test: () => !!S.att && attDone("scepter") },
  { id: "scarab", name: "Scarab Lord", desc: "Bang the Scarab Gong yourself and open the gates of Ahn'Qiraj.", test: () => !!S.aq && S.aq.hero },
].map(a => ({ ...a, cat: "raidq" })));
// world bosses
const wbK = n => !!S.wb && (S.wb.kills[n] || 0) > 0;
ACH.push(...[
  { id: "wbaz", name: "Azuregos", desc: "Kill Azuregos in Azshara.", test: () => wbK("Azuregos") },
  { id: "wbkz", name: "Lord Kazzak", desc: "Kill Lord Kazzak in the Blasted Lands.", test: () => wbK("Lord Kazzak") },
  { id: "wbdr", name: "Dragons of Nightmare", desc: "Kill one of the Emerald Dragons at the Great Trees.", test: () => WB_DRAGONS.some(wbK) },
  { id: "facex", name: "Exalted", desc: "Reach exalted with Timbermaw Hold, the Hydraxian Waterlords, the Zandalar Tribe, the Argent Dawn, the Thorium Brotherhood or the Darkmoon Faire.", test: () => !!S.fac && Object.keys(FACTIONS).some(f => facRank(f) >= 4) },
  { id: "facex3", name: "Ambassador of the Old World", desc: "Reach exalted with three of the six reputation factions at 60.", test: () => !!S.fac && Object.keys(FACTIONS).filter(f => facRank(f) >= 4).length >= 3 },
  { id: "dmfcard", name: "Darkmoon Card", desc: "Turn in a full deck at the Darkmoon Faire.", test: () => !!S.cal && S.cal.card },
  { id: "arena", name: "Arena Master", desc: "Win the chest in the Gurubashi Arena.", test: () => !!S.cal && S.cal.arena.wins > 0 },
  { id: "holepic", name: "Holiday Spirit", desc: "Win a holiday's epic prize at 60.", test: () => !!S.cal && Object.keys(S.cal.got).length > 0 },
  { id: "dset8", name: "Pre-Raid Ready", desc: "Collect all eight pieces of your dungeon set.", test: () => !!S.preb && dsetHave() >= 8 },
  { id: "dset2", name: "Dungeon Set 2", desc: "Finish the upgrade quests for your Tier 0.5 set.", test: () => !!S.att && attDone("dset2") },
  { id: "lotus", name: "Black Lotus", desc: "Find a Black Lotus on a farming run.", cat: "prof", test: () => profCount("lotus") > 0 },
  { id: "transmute", name: "The Daily Transmute", desc: "Transmute 30 Arcanite Bars.", cat: "prof", test: () => profCount("transmute") >= 30 },
  { id: "fish300", name: "Artisan Fisherman", desc: "Reach 300 fishing.", test: () => !!S.fish && S.fish.sk >= 300 },
  { id: "fishleg", name: "The Legend of the City", desc: "Catch Old Ironjaw in Ironforge, or Old Crafty in Orgrimmar.", test: () => !!S.fish && S.fish.legend },
  { id: "angler", name: "Master Angler", desc: "Win the Stranglethorn Fishing Extravaganza.", test: () => !!S.fish && S.fish.fx.wins > 0 },
  { id: "siset", name: "Undead Slayer", desc: "Complete the Argent Dawn's Blessed set during the Scourge Invasion.", test: () => !!S.si && siPieces() >= 3 },
  { id: "sidoom", name: "Shadow of a Doubt", desc: "Kill 10 Shadows of Doom during the Scourge Invasion.", test: () => !!S.si && S.si.doom >= 10 },
  { id: "wbdr4", name: "The Emerald Nightmare", desc: "Kill all four Emerald Dragons: Ysondre, Lethon, Emeriss and Taerar.", test: () => WB_DRAGONS.every(wbK) },
  { id: "wbpvp", name: "Mine, Not Yours", desc: "Drive the other faction off a world boss and kill it.", test: () => !!S.wb && S.wb.pvpWon > 0 },
  { id: "wb10", name: "World Boss Hunter", desc: "Kill 10 world bosses.", test: () => !!S.wb && wbKills() >= 10 },
  { id: "wbhead", name: "Hang It From the Gates", desc: "Turn in the Head of Onyxia or the Head of Nefarian.", test: () => !!S.wb && Object.keys(S.wb.heads).length > 0 },
].map(a => ({ ...a, cat: "wboss" })));
// minipets
const mp = () => S.minipets || {}, mpHas = names => names.every(n => mp()[n]);
ACH.push(...[
  { id: "mp1", name: "A Friend for the Road", desc: "Get your first minipet.", test: () => Object.keys(mp()).length >= 1 },
  { id: "mp10", name: "Plenty of Pets", desc: "Collect 10 minipets.", test: () => Object.keys(mp()).length >= 10 },
  { id: "mp20", name: "Menagerie", desc: "Collect 20 minipets.", test: () => Object.keys(mp()).length >= 20 },
  { id: "mpcats", name: "Crazy Cat Person", desc: "Collect all six cats: Bombay, Cornish Rex, Orange Tabby, Silver Tabby, White Kitten and Black Tabby.", test: () => mpHas(["Bombay Cat", "Cornish Rex Cat", "Orange Tabby Cat", "Silver Tabby Cat", "White Kitten", "Black Tabby Cat"]) },
  { id: "mpparrots", name: "Polly Want a Cracker", desc: "Collect all four parrots: Cockatiel, Senegal, Green Wing Macaw and Hyacinth Macaw.", test: () => mpHas(["Cockatiel", "Senegal", "Green Wing Macaw", "Hyacinth Macaw"]) },
  { id: "mpwhelps", name: "Whelp Wrangler", desc: "Collect all four whelplings: Dark, Crimson, Emerald and Azure.", test: () => mpHas(["Dark Whelpling", "Crimson Whelpling", "Emerald Whelpling", "Azure Whelpling"]) },
  { id: "mt5", name: "Stable Master", desc: "Collect 5 mounts.", test: () => Object.keys(S.mounts || {}).length >= 5 },
  { id: "mtbaron", name: "The Baron's Steed", desc: "Get Deathcharger's Reins from Baron Rivendare in Stratholme.", test: () => !!(S.mounts || {})["Deathcharger's Reins"] },
  { id: "mtzg", name: "Pride of Zul'Gurub", desc: "Get the Swift Razzashi Raptor or the Swift Zulian Tiger.", test: () => !!((S.mounts || {})["Swift Razzashi Raptor"] || (S.mounts || {})["Swift Zulian Tiger"]) },
  { id: "mtqiraji", name: "Bug Rider", desc: "Get a Qiraji Battle Tank in the Temple of Ahn'Qiraj.", test: () => Object.keys(S.mounts || {}).some(n => /Qiraji/.test(n)) },
  { id: "mtamb", name: "Ambassador", desc: "Reach exalted with the other races of your faction.", test: () => S.rep && Object.keys(RACES).filter(r => RACES[r].f === S.faction && r !== S.race).every(r => (S.rep[RACE_REP[r]] || 0) >= RUNECLOTH_EXALTED) },
  { id: "mtsaber", name: "Wintersaber", desc: "Earn the Winterspring Frostsaber from the Wintersaber Trainers.", show: () => S.faction === "Alliance", test: () => !!(S.mounts || {})["Winterspring Frostsaber"] },
].map(a => ({ ...a, cat: "coll" })));
// pets
const ps = () => S.petStats || { tamed: 0, rares: [], summoned: [], infernal: 0, doom: 0 };
ACH.push(
  { id: "pet-tame", name: "Beast Friend", desc: "Tame your first pet.", show: () => S.cls === "Hunter", test: () => ps().tamed >= 1 },
  { id: "pet-rare", name: "Rare Tamer", desc: "Tame a famous rare beast, like Humar the Pridelord or Broken Tooth.", show: () => S.cls === "Hunter", test: () => ps().rares.length >= 1 },
  { id: "pet-demons", name: "Demonologist", desc: "Summon an Imp, a Voidwalker, a Succubus and a Felhunter.", show: () => S.cls === "Warlock", test: () => ps().summoned.length >= 4 },
  { id: "pet-infernal", name: "Inferno", desc: "Call down an Infernal.", show: () => S.cls === "Warlock", test: () => ps().infernal >= 1 },
  { id: "pet-doom", name: "Ritual of Doom", desc: "Summon a Doomguard in a raid.", show: () => S.cls === "Warlock", test: () => ps().doom >= 1 },
);
// quiet: mark what's already earned without announcing it (pre: what came later, for the journal text);
// cat: only that category
function checkAch(quiet, cat) {
  for (const a of ACH) {
    if (S.ach[a.id] || (cat && a.cat !== cat) || !a.test()) continue;
    S.ach[a.id] = quiet ? { at: null, p: null, L: null, ...(cat ? { pre: cat } : {}) } : stamp();
    if (!quiet) log(`Achievement earned: [${a.name}]`, "ach");
  }
}
function zoneEntry(z) {
  let e = S.zones.find(x => x.z === z);
  if (!e) { e = { z, L0: S.level, L1: S.level, q: 0, k: 0, t0: realNow(), p0: S.time }; S.zones.push(e); }
  return e;
}
function dungeonEntry(n) { return S.dstat[n] || (S.dstat[n] = { runs: 0, at: null, L: null, loot: [] }); }
