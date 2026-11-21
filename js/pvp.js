// PvP: the battlegrounds (Warsong Gulch, Arathi Basin, Alterac Valley), played out like a dungeon run against
// players of the other faction; honor, the weekly rank update and the ranks 1-14 with their rewards (gear, the
// rank 11 war mount, the Alterac Valley mounts); the PvP tab and the scoreboard.
"use strict";

// ---------- the battlegrounds ----------
// size: players a side; heal / tank: the healers and the flag carriers or defenders in a side; win / loss: bonus honor
const BGS = [
  { name: "Warsong Gulch", abbr: "WSG", size: 10, heal: 2, tank: 1, win: 260, loss: 90 },
  { name: "Arathi Basin", abbr: "AB", size: 15, heal: 3, tank: 1, win: 320, loss: 110 },
  { name: "Alterac Valley", abbr: "AV", size: 40, heal: 8, tank: 3, win: 420, loss: 160 },
];
const bgRow = n => BGS.find(b => b.name === n);
const BG_CHANCE = 0.3;       // at 60, once attuned: the chance a non-raid evening goes to battlegrounds instead of a dungeon
const BG_GOAL_CHANCE = 0.85; // the same with a PvP goal
const BG_SESSION = { WSG: 3, AB: 3, AV: 2 }; // games in an evening of battlegrounds (about as long as a dungeon run)
const PREMADE = 0.45;        // with a guild and a few friends: the chance the group queues together (wins more)
const RIVAL_PREMADE = 0.12;  // the chance of running into the rival guild's premade
const HK_HONOR = 10;         // honor per honorable kill
const AV_EXALTED = 42000;    // Frostwolf Clan / Stormpike Guard reputation for the Alterac Valley mount
const foeSide = () => S.faction === "Alliance" ? "Horde" : "Alliance";
const pvpOpen = () => S.level >= 60 && S.runs60 >= Math.max(...Object.values(RAID_INFO).map(i => i.attune ? i.attune[0] : 0));

// ---------- ranks ----------
const RANKS = {
  Alliance: ["Private", "Corporal", "Sergeant", "Master Sergeant", "Sergeant Major", "Knight", "Knight-Lieutenant", "Knight-Captain", "Knight-Champion", "Lieutenant Commander", "Commander", "Marshal", "Field Marshal", "Grand Marshal"],
  Horde: ["Scout", "Grunt", "Sergeant", "Senior Sergeant", "First Sergeant", "Stone Guard", "Blood Guard", "Legionnaire", "Centurion", "Champion", "Lieutenant General", "General", "Warlord", "High Warlord"],
};
// rank points for each rank (rank 1 is any honor at all); every week: points × 0.8 + what the week's honor earned
const RANK_RP = [0, 1, 2000, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000];
const RP_DECAY = 0.8, RP_WEEK = 16000, HONOR_H0 = 9000; // a week's points: RP_WEEK × (1 - e^(-honor / HONOR_H0))
const rankName = (r, f = S.faction) => r > 0 ? RANKS[f][r - 1] : "";
const rankOf = rp => RANK_RP.reduce((r, v, i) => i && rp >= v ? i : r, 0);
const weekRP = h => Math.round(RP_WEEK * (1 - Math.exp(-h / HONOR_H0)));
// rewards per rank: gear (slots, item level, quality), the war mount at 11
const RANK_GEAR = { 3: [["Back"], 63, 3], 7: [["Hands", "Feet"], 66, 3], 8: [["Chest", "Legs"], 68, 3], 10: [["Head", "Shoulder"], 71, 3], 12: [["Hands", "Legs", "Feet"], 72, 4], 13: [["Head", "Chest", "Shoulder"], 72, 4], 14: [["weapon"], 78, 4] };
const PVP_ARMOR = { Warrior: "Plate", Paladin: "Lamellar", Hunter: "Chain", Shaman: "Mail", Rogue: "Leather", Druid: "Dragonhide", Mage: "Silk", Warlock: "Dreadweave", Priest: "Satin" };
const PVP_WEAPON = { Warrior: ["Claymore", "Greatsword"], Paladin: ["Hacker", "Hacker"], Rogue: ["Dirk", "Razor"], Hunter: ["Bullseye", "Crossbow"], Shaman: ["Battle Hammer", "Battle Mace"],
  Mage: ["Stave", "War Staff"], Warlock: ["Stave", "War Staff"], Priest: ["Stave", "War Staff"], Druid: ["Stave", "War Staff"] };
const PVP_MOUNT = { Human: "Black War Steed", Dwarf: "Black War Ram", "Night Elf": "Black War Tiger", Gnome: "Black Battlestrider", Orc: "Black War Wolf", Undead: "Red Skeletal Warhorse", Tauren: "Black War Kodo", Troll: "Black War Raptor" };
const AV_MOUNT = { Alliance: "Stormpike Battle Charger", Horde: "Frostwolf Howler" }, AV_FACTION = { Alliance: "Stormpike Guard", Horde: "Frostwolf Clan" };
function rankItem(r) {
  const g = RANK_GEAR[r]; if (!g) return [];
  const title = rankName(r), h = S.faction === "Horde" ? 1 : 0;
  if (r === 3) return [{ name: h ? "Sergeant's Cape" : "Sergeant's Cloak", slot: "Back", ilvl: g[1], q: g[2] }];
  if (r === 14) return [{ name: `${title}'s ${PVP_WEAPON[S.cls][h]}`, slot: S.cls === "Hunter" ? "Ranged" : "Main Hand", ilvl: g[1], q: g[2] }];
  return g[0].map(slot => ({ name: `${title}'s ${PVP_ARMOR[S.cls]} ${ARMOR_BASE[armorType()][slot]}`, slot, ilvl: g[1], q: g[2] }));
}
// the battleground quartermasters: reputation gear for the weakest slot now and then (like a dungeon's blues)
const BG_QM = { WSG: ["Sentinel's", "Outrider's"], AB: ["Highlander's", "Defiler's"], AV: ["Stormpike", "Frostwolf"] };
const QM_JEWEL = { Back: "Cloak", Neck: "Medallion", Finger: "Band", Trinket: "Insignia" };
function bgQuartermaster(b, win) {
  if (Math.random() >= (win ? 0.25 : 0.1)) return;
  const slot = weakestSlot(), it = makeItem(slot, 62 + R(5), Math.random() < 0.3 ? 4 : 3);
  if (power(it) <= power(S.equip[slot])) return; // only worth the reputation as an upgrade
  const pre = BG_QM[b.abbr][S.faction === "Horde" ? 1 : 0], base = (ARMOR_BASE[armorType()] || {})[slot] || QM_JEWEL[slot];
  it.name = base ? `${pre} ${base}` : `${pre} ${it.name.replace(/ of .+$/, "").split(" ").slice(1).join(" ")}`;
  gain(it, `From the ${b.name} quartermaster:`);
}
const newPvp = () => ({ honor: 0, wk: null, rp: 0, rank: 0, best: 0, total: 0, hk: 0, kb: 0, deaths: 0, games: {}, caps: 0, bases: 0, towers: 0, generals: 0, av: 0 });

// ---------- when to go ----------
// on an evening without a raid, after the attunement runs: a battleground now and then (often, with a PvP goal)
function pvpPick() {
  if (!pvpOpen()) return null;
  const goal = goalWith("pvp:"), av = hasGoal("avmount");
  if (Math.random() >= (goal || av ? BG_GOAL_CHANCE : BG_CHANCE)) return null;
  return av && Math.random() < 0.6 ? bgRow("Alterac Valley") : pick(BGS);
}

// ---------- the two sides ----------
const bgGear = () => +(1.18 + Math.random() * 0.25).toFixed(3); // a level 60 in dungeon blues and a few epics
// your side: friends first (the guild's premade takes friends, then the roster), then strangers
function bgParty(b, pre) {
  const roles = [...Array(b.tank).fill("tank"), ...Array(b.heal).fill("heal")]; while (roles.length < b.size) roles.push("dps");
  const hi = roles.indexOf(heroRole()); roles.splice(hi < 0 ? roles.length - 1 : hi, 1);
  const taken = takenNames(), used = [];
  return roles.map(role => {
    const known = socialMember(role, pre, used); if (known) return { ...known, L: 60, gear: known.gear ?? bgGear() };
    return { ...pugMember(role, taken), L: 60, hp: 1, mp: 1, gear: bgGear() };
  });
}
// the other side: players of the other faction, geared about like your side (ref: your side's average)
function bgEnemies(b, rival, ref) {
  const taken = takenNames().concat(S.party.map(m => m.name)), out = [];
  for (let i = 0; i < b.size; i++) {
    const p = pugMember(i < b.heal ? "heal" : "dps", taken, foeSide());
    out.push({ name: p.name, race: p.race, cls: p.cls, role: p.role, gear: +(ref * (0.92 + Math.random() * 0.16) + (rival ? 0.1 : 0)).toFixed(3) });
  }
  return out;
}
// the chance to win: both sides' gear, a premade on either side
const sideGear = () => { const a = [{ gear: clamp(gearScore() / 60, 0.8, 2) }, ...S.party]; return a.reduce((s, m) => s + m.gear, 0) / a.length; };
function bgWinChance(pre, rival, E) {
  const ours = sideGear(), avg = a => a.reduce((s, m) => s + m.gear, 0) / a.length;
  return clamp(0.5 + (ours - avg(E)) * 2 + (pre ? 0.12 : 0) - (rival ? 0.12 : 0), 0.15, 0.85);
}

// ---------- a battleground, queued like a dungeon run ----------
// everything is rolled here: the result, how it gets there (caps, bases, towers), each fight and whether the hero dies in it
// left: games still to play this evening after this one
function queueBG(b, left = BG_SESSION[b.abbr] - 1) {
  const q = S.queue, us = S.faction, them = foeSide();
  const pre = !!(S.guild && b.size < 40 && S.friends.length >= 3 && Math.random() < PREMADE);
  const rival = !!(S.guild && b.size < 40 && Math.random() < RIVAL_PREMADE);
  S.party = bgParty(b, pre);
  const E = bgEnemies(b, rival, sideGear()), win = Math.random() < bgWinChance(pre, rival, E);
  S.dg = { name: b.name, bg: true, raid: false, killed: 0, total: 0, rep0: S.repair, wipes: 0, pre, rival, win, score: [0, 0], hk: 0, ed: 0, od: 0, sb: { kb: [], hk: [], d: [] }, final: "", towers: 0, E };
  S.meter = { dn: b.name, dmg: [], heal: [], secs: 0, last: null };
  q.push({ k: "bgq", d: `In the queue for ${b.name}`, t: sec(60 + R(180)), dn: b.name });
  if (left >= BG_SESSION[b.abbr] - 1) q.push({ k: "dbuff", d: "Buffing up while the gates are still closed", t: sec(8), raid: false });
  q.push({ k: "bgin", d: `Waiting for the gates of ${b.name} to open`, t: sec(50), dn: b.name });
  const st = { us, them, E, b, win };
  const story = b.abbr === "WSG" ? wsgStory(st) : b.abbr === "AB" ? abStory(st) : avStory(st);
  story.forEach(s => q.push(s.fight ? bgFight(s.fight, st) : { k: "bgobj", ...s, t: sec(s.t || 20) }));
  S.dg.final = st.final;
  q.push({ k: "bgend", d: `Leaving ${b.name}`, t: sec(10), dn: b.name, left });
}
// one skirmish: a few enemy players (or the valley's captains and generals), maybe focused on the hero, maybe the hero dies
function bgFight(f, st) {
  const n = f.npc ? 0 : f.n || (st.b.size >= 40 ? 3 + R(3) : 2 + R(2)), pool = st.E.slice(), foes = (f.npc || []).slice();
  for (let i = 0; i < n && pool.length; i++) { const e = pool.splice(R(pool.length), 1)[0]; foes.push({ name: e.name, race: e.race, cls: e.cls, role: e.role }); }
  const big = !!f.npc, share = groupAoe(foes.length), p = packTrim(heroGroupCasts(big ? 110 : 45, big, foes.length), foes.length, share, sec(big ? 110 : 45));
  const focus = f.focus ?? Math.random() < 0.3;
  const dieP = clamp(0.1 + (heroRole() === "heal" ? 0.08 : 0) + (armorType() === "Cloth" ? 0.05 : 0) - (gearScore() / 60 - 1.25) * 0.3 + (focus ? 0.15 : 0) + (big ? 0.1 : 0), 0.04, 0.5);
  const die = Math.random() < dieP;
  return { k: "trash", bg: true, d: f.d, t: p.t, foes, casts: p.casts, aoeShare: share, tgt: focus ? "you" : pick(S.party).name, die, dieAt: +(0.55 + Math.random() * 0.4).toFixed(2) };
}
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const scoreTxt = (sc, st) => `${st.us} ${sc[0]}, ${st.them} ${sc[1]}`;

// Warsong Gulch: first to three flag captures
function wsgStory(st) {
  const { us, them, E, win } = st, sc = [0, 0], out = [], W = win ? 0 : 1;
  const seq = shuffle([W, W, ...Array(R(3)).fill(1 - W)]); seq.push(W);
  // our flag carrier: the hero if a tank (or a druid, often), otherwise one of ours
  const role = heroRole(), me = Math.random() < (role === "tank" ? 0.7 : S.cls === "Druid" ? 0.5 : 0.1);
  const fcs = S.party.filter(m => m.role === "tank" || m.cls === "Druid"), fc = me ? S.name : (pick(fcs.length ? fcs : S.party)).name;
  const efc = (E.find(e => e.cls === "Druid" || e.cls === "Warrior") || E[E.length - 1]).name;
  out.push({ fight: { d: "Fighting in the middle of the gulch" } });
  seq.forEach(s => {
    sc[s]++;
    if (s === 0) {
      out.push({ fight: { d: me ? `Grabbing the ${them} flag` : `Fighting in the ${them} flag room`, focus: me } });
      if (Math.random() < 0.6) out.push({ fight: { d: me ? `Running the ${them} flag home` : `Escorting ${fc} home with the flag`, focus: me } });
      out.push({ d: me ? `Capturing the ${them} flag` : `${fc} brings the ${them} flag home`, lines: [`${me ? "You capture" : fc + " captures"} the ${them} flag! ${scoreTxt(sc, st)}.`], score: [...sc], stat: me ? { caps: 1 } : null });
    } else {
      out.push({ fight: { d: Math.random() < 0.5 ? `Defending the ${us} flag room` : `Chasing ${efc} and the ${us} flag` } });
      out.push({ d: `Hunting ${efc} with the ${us} flag`, lines: [`${efc} captures the ${us} flag. ${scoreTxt(sc, st)}.`], score: [...sc] });
    }
  });
  st.final = `${sc[0]}–${sc[1]}`;
  if (win && !sc[1]) out[out.length - 1].stat = { ...(out[out.length - 1].stat || {}), flawless: 1 }; // 3–0
  return out;
}
// Arathi Basin: five bases, resources to 2000
const AB_BASES = ["Stables", "Gold Mine", "Blacksmith", "Lumber Mill", "Farm"];
function abStory(st) {
  const { us, them, win } = st, W = win ? 0 : 1, side = s => s ? them : us, out = [], hold = {}, res = [0, 0];
  const home = us === "Alliance" ? ["Stables", "Farm"] : ["Farm", "Stables"];
  hold[home[0]] = 0; hold[home[1]] = 1;
  const held = s => AB_BASES.filter(x => hold[x] === s).length, tick = () => { res[0] += held(0) ** 1.5; res[1] += held(1) ** 1.5; };
  out.push({ d: `Taking the ${home[0]}`, lines: [`The ${us} takes the ${home[0]}. The ${them} takes the ${home[1]}.`], score: [1, 1] });
  const rounds = 5 + R(3);
  for (let i = 0; i < rounds; i++) {
    // the side that's going to win takes most of the fights, and always the last ones
    const s = i >= rounds - 2 ? W : Math.random() < 0.65 ? W : 1 - W;
    const targets = AB_BASES.filter(x => hold[x] !== s), base = targets.includes("Blacksmith") && Math.random() < 0.4 ? "Blacksmith" : pick(targets.length ? targets : AB_BASES);
    if (hold[base] === s) continue;
    out.push({ fight: { d: s ? `Defending the ${base}` : `Fighting for the ${base}` } });
    hold[base] = s; tick();
    out.push({ d: s ? `Losing the ${base}` : `Holding the flag at the ${base}`, lines: [`The ${side(s)} has taken the ${base}! Bases: ${us} ${held(0)}, ${them} ${held(1)}.`], score: [held(0), held(1)], stat: s ? null : { bases: 1 } });
  }
  tick();
  const lose = Math.round(clamp(2000 * res[1 - W] / Math.max(1, res[W]), 300, 1950) / 10) * 10, fin = W ? [lose, 2000] : [2000, lose];
  st.final = `${fin[0]}–${fin[1]}`;
  return out;
}
// Alterac Valley: down the valley, towers and a captain on the way, the enemy general at the end
const AV = {
  Alliance: { general: "Vanndar Stormpike", guards: ["Dun Baldar North Marshal", "Dun Baldar South Marshal"], captain: "Captain Balinda Stonehearth", ckind: "caster", gy: "Stonehearth Graveyard", towers: ["Stonehearth Bunker", "Icewing Bunker", "Dun Baldar South Bunker", "Dun Baldar North Bunker"] },
  Horde: { general: "Drek'Thar", guards: ["East Frostwolf Warmaster", "West Frostwolf Warmaster"], captain: "Captain Galvangar", gy: "Iceblood Graveyard", towers: ["Iceblood Tower", "Tower Point", "East Frostwolf Tower", "West Frostwolf Tower"] },
};
function avStory(st) {
  const { us, them, win } = st, T = AV[them], O = AV[us], out = [];
  out.push({ fight: { d: "Fighting in the Field of Strife", n: 5 } });
  out.push({ d: "Taking Snowfall Graveyard", lines: [`The ${us} takes Snowfall Graveyard!`] });
  out.push({ fight: { d: `Fighting at ${T.gy}` } });
  out.push({ d: `Taking ${T.gy}`, lines: [`The ${us} takes ${T.gy}!`] });
  if (win || Math.random() < 0.5) {
    out.push({ fight: { d: `Fighting ${T.captain}`, npc: [{ name: T.captain, L: 61, rank: "boss", kind: T.ckind }] } });
    out.push({ d: `${T.captain} goes down`, lines: [`${T.captain} is dead!`], t: 10 });
  }
  const burn = win ? 4 : 1 + R(2);
  for (let i = 0; i < burn; i++) {
    out.push({ fight: { d: `Fighting the defenders of ${T.towers[i]}` } });
    out.push({ d: `Burning down ${T.towers[i]}`, lines: [`${T.towers[i]} is destroyed!`], stat: { towers: 1 }, t: 25 });
    // meanwhile the other side pushes too: they burn ours the faster when they're winning
    if (!win || Math.random() < 0.3) { out.push({ fight: { d: `Defending ${O.towers[i]}` } }); if (!win) out.push({ d: `Losing ${O.towers[i]}`, lines: [`${O.towers[i]} is destroyed. The ${them} pushes on.`], t: 15 }); }
  }
  if (win) {
    out.push({ fight: { d: `Fighting ${T.general}`, npc: [...T.guards.map(name => ({ name, L: 61, rank: "elite" })), { name: T.general, L: 62, rank: "raid boss" }] } });
    out.push({ d: `${T.general} falls`, lines: [`${T.general} is dead! The ${us} wins Alterac Valley.`], stat: { generals: 1 }, t: 10 });
    st.final = `${T.general} slain, ${100 + R(250)} reinforcements left`;
  } else {
    out.push({ fight: { d: `Defending ${O.general} in ${us === "Alliance" ? "Dun Baldar" : "Frostwolf Keep"}`, n: 5 } });
    out.push({ d: `${O.general} falls`, lines: [`The ${them} kills ${O.general}. Alterac Valley is lost.`], t: 10 });
    st.final = `${O.general} slain`;
  }
  return out;
}

// ---------- the fights ----------
// enemy units in a battleground fight: players with a class (and their own rotation), or the valley's captains and generals
const PVP_KIND = { Warrior: "fighter", Paladin: "fighter", Hunter: "fighter", Rogue: "thief", Priest: "caster", Shaman: "caster", Mage: "caster", Warlock: "caster", Druid: "caster" };
const bgUnits = t => t.foes.map(f => ({ name: f.name, L: f.L || 60, rank: f.rank || "player", kind: f.cls ? PVP_KIND[f.cls] : f.kind || foeKind(f.name), cls: f.cls, race: f.race, role: f.role }));
// what each class does to the hero (healers heal): stuns, sheep, fears and kicks come off the usual control list
const PVP_ROT = {
  Warrior: ["Charge", "Mortal Strike,Auto Attack", "Hamstring,Overpower,Intercept,Pummel,Whirlwind,Intimidating Shout", "Execute"],
  Paladin: ["Seal of Command", "Auto Attack,Judgement", "Hammer of Justice,Holy Light,Flash of Light,Blessing of Freedom,Cleanse", "Divine Shield"],
  "Paladin:heal": ["Blessing of Kings", "Holy Light,Flash of Light", "Hammer of Justice,Holy Shock,Blessing of Freedom,Cleanse", "Divine Shield"],
  Hunter: ["Aimed Shot", "Auto Shot,Multi-Shot", "Concussive Shot,Scatter Shot,Viper Sting,Serpent Sting,Arcane Shot,Wing Clip", "Feign Death"],
  Rogue: ["Cheap Shot", "Sinister Strike,Auto Attack", "Kidney Shot,Gouge,Blind,Kick,Backstab,Hemorrhage", "Vanish"],
  Priest: ["Shadow Word: Pain", "Mind Flay,Mind Blast", "Psychic Scream,Silence,Vampiric Embrace,Power Word: Shield,Mana Burn", "Psychic Scream"],
  "Priest:heal": ["Power Word: Shield", "Flash Heal,Greater Heal", "Psychic Scream,Renew,Dispel Magic,Mana Burn", "Heal"],
  Shaman: ["Earth Shock", "Lightning Bolt", "Frost Shock,Earth Shock,Grounding Totem,Chain Lightning,Lesser Healing Wave", "Lesser Healing Wave"],
  "Shaman:heal": ["Healing Wave", "Healing Wave,Lesser Healing Wave", "Earth Shock,Chain Heal,Grounding Totem,Frost Shock", "Chain Heal"],
  Mage: ["Frostbolt", "Frostbolt,Fireball", "Polymorph,Frost Nova,Counterspell,Cone of Cold,Blink,Fire Blast", "Ice Block"],
  Warlock: ["Corruption", "Shadow Bolt", "Fear,Death Coil,Curse of Agony,Immolate,Howl of Terror,Drain Life", "Fear"],
  Druid: ["Moonfire", "Wrath,Starfire", "Entangling Roots,Bash,Moonfire,Insect Swarm,Healing Touch", "Regrowth"],
  "Druid:heal": ["Rejuvenation", "Healing Touch,Rejuvenation", "Regrowth,Entangling Roots,Bash,Swiftmend", "Healing Touch"],
};
function pvpPool(c, role) {
  const r = PVP_ROT[c + ":" + role] || PVP_ROT[c];
  return { open: [r[0]], fill: r[1].split(","), extra: r[2].split(","), end: r[3] };
}
// a finished skirmish: killing blows and honorable kills for the scoreboard, and the hero's death (no repair bill)
function bgFightEnd(t) {
  const d = S.dg; if (!d || !d.bg) return;
  const players = t.foes.filter(f => f.cls).length, all = [{ role: heroRole(), gear: gearScore() / 60 }, ...S.party], n = all.length, sb = d.sb;
  const W = { dps: 1, tank: 0.5, heal: 0.15 }, wsum = all.reduce((a, m) => a + W[m.role] * (m.gear || 1), 0);
  t.foes.forEach(() => { let r = Math.random() * wsum, i = 0; for (; i < n - 1; i++) { r -= W[all[i].role] * (all[i].gear || 1); if (r <= 0) break; } sb.kb[i] = (sb.kb[i] || 0) + 1; if (!i) S.pvp.kb++; });
  for (let i = 0; i < n; i++) sb.hk[i] = (sb.hk[i] || 0) + players;
  d.hk += players; d.ed += t.foes.length; S.pvp.hk += players;
  const ours = R(3); for (let j = 0; j < ours; j++) { const i = 1 + R(n - 1); sb.d[i] = (sb.d[i] || 0) + 1; } d.od += ours;
  if (t.die) {
    sb.d[0] = (sb.d[0] || 0) + 1; d.od++; S.pvp.deaths++;
    const k = pick(t.foes);
    log(`Killed by ${k.name}${k.cls ? ` (${k.cls.toLowerCase()})` : ""}. Back to the graveyard.`, "death");
    S.queue.unshift({ k: "bgrez", d: "Waiting at the graveyard for the spirit healer", t: sec(30) });
  }
}
// the hero's health in a fight it dies in: down to nothing at the moment it was rolled for
function bgDeath(t, hero) {
  if (!t.bg || !t.die) return;
  hero.tl = hero.tl.filter(x => x[0] < t.dieAt); hero.tl.push([t.dieAt, 0]); hero.cur = 0;
}

// ---------- finishing the battleground's tasks ----------
const PVP_FINISH = {
  bgq(t) {
    S.loc = "dungeon"; if (S.dg) S.dg.formed = true;
    log(`Entering ${t.dn}.`, "dung");
    const fr = S.party.filter(m => isFriend(m.name)).map(m => m.name);
    if (S.dg && S.dg.pre) log(`[Guild] Premade for ${t.dn}: ${fr.length ? fr.slice(0, 3).join(", ") + " and the rest of " : ""}<${S.guild.name}> queue together.`, "chat");
    else if (fr.length) log(`${fr.length > 3 ? fr.slice(0, 2).join(", ") + ` and ${fr.length - 2} more friends` : fr.join(" and ")} ${fr.length > 1 ? "are" : "is"} in the same ${t.dn} game.`, "chat");
  },
  bgin(t) {
    log(`The battle for ${t.dn} has begun!`, "dung");
    if (S.dg && S.dg.rival && S.guild) log(`The other side is a premade from <${S.guild.rival.name}>. This will hurt.`, "chat");
  },
  bgobj(t) {
    (t.lines || []).forEach(l => log(l, "dung"));
    if (S.dg && t.score) S.dg.score = t.score;
    if (t.stat) for (const k in t.stat) { S.pvp[k] = (S.pvp[k] || 0) + t.stat[k]; if (S.dg) S.dg[k] = (S.dg[k] || 0) + t.stat[k]; }
  },
  bgrez() {},
  bgend(t) {
    const d = S.dg, b = bgRow(t.dn), p = S.pvp; if (!d || !b) { S.dg = null; S.party = null; S.loc = "city"; return; }
    const g = p.games[b.abbr] || (p.games[b.abbr] = { w: 0, l: 0 }); if (d.win) g.w++; else g.l++;
    const honor = Math.round(d.hk * HK_HONOR + (d.win ? b.win : b.loss));
    p.honor += honor; p.total += honor;
    log(`${d.win ? "Victory" : "Defeat"} in ${b.name} (${d.final}). +${honor.toLocaleString()} honor, ${d.hk} honorable kills, ${d.sb.kb[0] || 0} killing blow${d.sb.kb[0] === 1 ? "" : "s"}${d.sb.d[0] ? `, died ${d.sb.d[0]} time${d.sb.d[0] > 1 ? "s" : ""}` : ""}.`, d.win ? "ach" : "death");
    if (b.abbr === "AV") {
      const rep = (d.win ? 450 : 200) + 60 * (d.towers || 0) + R(150), was = p.av; p.av += rep;
      if (was < AV_EXALTED && p.av >= AV_EXALTED) { log(`Exalted with the ${AV_FACTION[S.faction]}!`, "ach"); addMount(AV_MOUNT[S.faction], `The ${AV_FACTION[S.faction]} quartermaster sells you a ${AV_MOUNT[S.faction]}.`); }
    }
    bgQuartermaster(b, d.win);
    S.party.forEach(m => { const f = S.friends.find(x => x.name === m.name); if (f) f.runs++; });
    if (!d.pre && Math.random() < 0.08) { const s = S.party.filter(m => !isFriend(m.name)); if (s.length) addFriend(pick(s), b.name); }
    S.dg = null; S.party = null; S.loc = "city";
    if (t.left > 0) queueBG(b, t.left - 1); // queue up again
  },
};

// ---------- the weekly update ----------
// once a week the honor turns into rank points: the old points lose a fifth, the week's honor adds (with less for each
// extra bit), and the rank follows. A new rank's rewards come right away
function pvpWeek() {
  const p = S.pvp, wk = Math.floor(S.time / WEEK);
  if (p.wk == null) { p.wk = wk; return; }
  while (p.wk < wk) {
    p.wk++;
    const h = p.honor; p.honor = 0;
    if (!h && !p.rp) continue;
    const add = weekRP(h), was = p.rank;
    p.rp = Math.round(p.rp * RP_DECAY + add); p.rank = rankOf(p.rp);
    if (h || p.rank !== was) log(`Weekly honor update: ${h.toLocaleString()} honor, ${add ? "+" + add.toLocaleString() : "no"} rank points. ${p.rank > was ? `Promoted to ${rankName(p.rank)} (rank ${p.rank})!` : p.rank < was ? `Down to ${rankName(p.rank) || "no rank"}.` : p.rank ? `Still ${rankName(p.rank)}.` : ""}`, p.rank > was ? "ach" : "");
    for (let r = p.best + 1; r <= p.rank; r++) rankRewards(r);
    p.best = Math.max(p.best, p.rank);
  }
}
// the officers' quartermaster: rank gear, and the war mount at 11 (epic riding comes with it)
function rankRewards(r) {
  rankItem(r).forEach(it => gain(it, `${rankName(r)} reward:`));
  if (r === 11) {
    addMount(PVP_MOUNT[S.race], `Rank 11! The quartermaster hands over the reins of a ${PVP_MOUNT[S.race]}.`);
    if (S.mount < 2) { S.mount = 2; log("The war mount comes with epic riding: no 1000 gold needed.", "loot4"); }
  }
}

// ---------- on screen ----------
// the quest meter in a battleground: flags, bases or towers
function bgMeter() {
  const d = S.dg, b = bgRow(d.name), [a, c] = d.score;
  if (b.abbr === "WSG") return { name: `Flags: ${S.faction} ${a}, ${foeSide()} ${c}`, val: `${a} / 3`, p: a / 3 };
  if (b.abbr === "AB") return { name: `Bases: ${S.faction} ${a}, ${foeSide()} ${c}`, val: `${a} / 5`, p: a / 5 };
  return { name: `Alterac Valley: ${d.ed} enemies down`, val: `${d.hk} HK`, p: Math.min(1, d.ed / 60) };
}
// the other side's frames: whoever is in the current fight shows its health and what it's doing, the rest stand ready
function enemyNow(e, f, k) {
  const u = f && f.units.find(x => x.name === e.name);
  if (!u) return { hp: 1, res: 100, cast: "&nbsp;" };
  const s = foeAt(f, u, k);
  return { hp: s.present ? s.hp : 1, res: s.res, cast: !s.present ? "&nbsp;" : s.alive ? `<span class="cur">${esc(s.act || "")}</span>` : '<span class="dead">dead</span>' };
}
// the scoreboard (instead of the damage meter): killing blows, honorable kills and deaths for each of your side
function renderScore() {
  const d = S.dg, all = [{ name: S.name, cls: S.cls, me: true }, ...S.party], sb = d.sb;
  const rows = all.map((m, i) => ({ ...m, kb: sb.kb[i] || 0, hk: sb.hk[i] || 0, dd: sb.d[i] || 0 })).sort((a, b) => b.kb - a.kb || b.hk - a.hk);
  rows.forEach((r, i) => r.rank = i + 1);
  const top = rows[0].kb || 1, shown = rows.slice(0, 10), me = rows.find(r => r.me); if (me.rank > 10) shown.push(me);
  setHtml("dmNote", `${esc(d.name)} · ${d.ed} of theirs down, ${d.od} of ours`);
  setHtml("dmRows", shown.map(r => { const c = CLASSES[r.cls].color;
    return `<li class="${r.me ? "me" : ""}"><i style="width:${(r.kb / top * 100).toFixed(1)}%;background:${c}"></i><span class="dmn"><b>${r.rank}</b> <span style="color:${c}">${esc(r.name)}</span></span><span class="dmv">${r.kb} KB · ${r.hk} HK · ${r.dd} ${r.dd === 1 ? "death" : "deaths"}</span></li>`; }).join(""));
}
// the PvP tab: rank and the week, the battlegrounds, totals, the rewards
function renderPvp() {
  const p = S.pvp, nx = Math.min(14, p.rank + 1), lo = RANK_RP[p.rank] || 0, hi = RANK_RP[nx], pr = p.rank >= 14 ? 1 : clamp((p.rp - lo) / Math.max(1, hi - lo), 0, 1);
  const proj = Math.round(p.rp * RP_DECAY + weekRP(p.honor)), row = (got, ico, b, s, tm) => `<li class="${got ? "got" : "locked"}"><span class="ico">${ico}</span><div><b>${b}</b><span>${s}</span>${tm ? `<time>${tm}</time>` : ""}</div></li>`;
  let h = `<li class="jhead">Rank <small>${p.best ? `best: ${esc(rankName(p.best))}` : "no rank yet"}</small></li>`;
  if (!pvpOpen()) h += row(false, "·", "Battlegrounds", S.level < 60 ? "Battlegrounds open at level 60, after the dungeon runs that attune you to the raids." : `After the raid attunements (${S.runs60} of ${Math.max(...Object.values(RAID_INFO).map(i => i.attune ? i.attune[0] : 0))} level 60 dungeon clears).`);
  h += `<li class="${p.rank ? "got" : "locked"}"><span class="ico">${p.rank || "·"}</span><div><b>${p.rank ? `Rank ${p.rank}: ${esc(rankName(p.rank))}` : "No rank"}</b><span>${p.rp.toLocaleString()} rank points${p.rank < 14 ? ` · ${esc(rankName(nx))} at ${hi.toLocaleString()}` : ""}</span><div class="bar pbar"><i style="width:${Math.round(pr * 100)}%"></i></div></div></li>`
    + row(p.honor > 0, "⌛", "This week", `${p.honor.toLocaleString()} honor so far. At the weekly update: ${proj.toLocaleString()} rank points (${esc(rankName(rankOf(proj)) || "no rank")}). Points lose a fifth every week.`);
  h += `<li class="jhead">Battlegrounds</li>` + BGS.map(b => { const g = p.games[b.abbr] || { w: 0, l: 0 };
    const extra = b.abbr === "WSG" ? `${p.caps} flags captured by you` : b.abbr === "AB" ? `${p.bases} bases taken` : `${p.towers} towers burned, ${p.generals} generals killed · ${p.av.toLocaleString()} of ${AV_EXALTED.toLocaleString()} ${AV_FACTION[S.faction]} reputation`;
    return row(g.w + g.l > 0, g.w ? "✓" : "·", esc(b.name), `${g.w} won, ${g.l} lost · ${extra}`); }).join("");
  h += `<li class="jhead">Totals</li>` + row(p.hk > 0, "⚔", `${p.hk.toLocaleString()} honorable kills`, `${p.kb.toLocaleString()} killing blow${p.kb === 1 ? "" : "s"}, ${p.deaths} death${p.deaths === 1 ? "" : "s"}, ${p.total.toLocaleString()} honor in all`);
  h += `<li class="jhead">Rewards</li>` + Object.keys(RANK_GEAR).map(Number).concat(11).sort((a, b) => a - b).map(r => {
    const got = p.best >= r, what = r === 11 ? `${PVP_MOUNT[S.race]} and epic riding` : rankItem(r).map(x => x.name).join(", ");
    return row(got, got ? "✓" : r, `Rank ${r}: ${esc(rankName(r))}`, esc(what));
  }).join("") + row(hasMount(AV_MOUNT[S.faction]), hasMount(AV_MOUNT[S.faction]) ? "✓" : "·", `Exalted with the ${AV_FACTION[S.faction]}`, `${AV_MOUNT[S.faction]} (Alterac Valley)`);
  return h;
}
