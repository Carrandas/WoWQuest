// Dungeon and raid groups: who joins, their rotations, and how a group fight plays out.
"use strict";

// ---------- dungeon groups: one tank, one healer, three dps; the hero fills their own slot ----------
const ROLE_SPECS = { Warrior: { 2: "tank" }, Paladin: { 0: "heal", 1: "tank" }, Priest: { 0: "heal", 1: "heal" }, Shaman: { 2: "heal" }, Druid: { 1: "tank", 2: "heal" } };
const ROLE_NAME = { tank: "Tank", heal: "Healer", dps: "DPS" };
const heroRole = () => (ROLE_SPECS[S.cls] || {})[S.spec] || "dps";
const ROLE_CLASSES = {
  tank: ["Warrior", "Warrior", "Warrior", "Druid", "Paladin"],
  heal: ["Priest", "Priest", "Druid", "Paladin", "Shaman"],
  dps: ["Mage", "Rogue", "Hunter", "Warlock", "Warrior", "Mage", "Rogue", "Priest", "Shaman", "Druid"],
};
// the spec a companion plays, so ultimates line up with their role
const ROLE_SPEC = { tank: { Warrior: 2, Druid: 1, Paladin: 1 }, heal: { Priest: 1, Druid: 2, Paladin: 0, Shaman: 2 },
  dps: { Mage: 2, Rogue: 1, Hunter: 1, Warlock: 0, Warrior: 1, Priest: 2, Shaman: 0, Druid: 0, Paladin: 2 } };
const NAME_A = ["Thra", "Gor", "Bel", "Kal", "Mor", "Zul", "Ael", "Dra", "Fen", "Grim", "Hal", "Jor", "Ky", "Lor", "Mal", "Nar", "Or", "Rag", "Syl", "Tor", "Vel", "Xan", "Yri", "Bro", "Shae", "Ula", "Eli", "Kor", "Tha", "Va", "Bru", "Ish", "Dal", "Ner"];
const NAME_B = ["dan", "gar", "rik", "wyn", "thas", "ra", "nok", "dor", "eth", "ia", "mir", "grom", "lyn", "zar", "ius", "ak", "osh", "elle", "ric", "una", "ven", "dil", "rok", "ana", "ix", "orn", "ael", "us"];
const NAME_FUN = ["Healsplz", "Stabbington", "Tankmeister", "Dotsalot", "Bubbleboy", "Frostbyte", "Pewpew", "Moonbeam", "Critz", "Shieldwall", "Mendalot", "Boomkinz", "Totemtom", "Lockjaw", "Arcanix"];
function randName(taken) {
  for (let i = 0; i < 20; i++) {
    const n = Math.random() < 0.15 ? pick(NAME_FUN) : pick(NAME_A) + pick(NAME_B);
    if (!taken.includes(n)) return n;
  }
  return pick(NAME_A) + pick(NAME_B) + R(9);
}
// 5-man: 1/1/3; 20-man: 3 tanks, 5 healers; 40-man: 5 tanks, 12 healers
const RAID_ROLES = { 5: [1, 1], 20: [3, 5], 40: [5, 12] };
// how well geared pickup players are for the content: about level-appropriate in dungeons, about what the
// raid asks for in raids (Molten Core lightly, Naxxramas heavily), give or take 15% per player
// a stranger for a role: a class and race of the faction (paladins Alliance, shamans Horde), a free name
function pugMember(role, taken, faction = S.faction) {
  const c = pick(ROLE_CLASSES[role].filter(k => k !== "Paladin" || faction === "Alliance").filter(k => k !== "Shaman" || faction === "Horde"));
  const race = pick(Object.keys(ALLOWED).filter(r => RACES[r].f === faction && ALLOWED[r].includes(c)));
  const name = randName(taken); taken.push(name);
  return { name, race, cls: c, role, spec: ROLE_SPEC[role][c] };
}
const contentGear = () => { const ri = S.dg && RAID_INFO[S.dg.name]; return (ri ? ri.gs / 60 : 1) * (0.85 + Math.random() * 0.3); };
function makeParty(raid) {
  const size = raid && S.dg && RAID_INFO[S.dg.name] ? RAID_INFO[S.dg.name].size : 5, [nt, nh] = RAID_ROLES[size] || RAID_ROLES[5];
  const roles = [...Array(nt).fill("tank"), ...Array(nh).fill("heal")]; while (roles.length < size) roles.push("dps");
  roles.splice(roles.indexOf(heroRole()), 1);
  const taken = takenNames(), used = [];
  const members = roles.map(role => {
    const known = socialMember(role, raid, used); if (known) return { ...known, gear: known.gear ?? contentGear() }; // friends, then the guild (their own gear)
    return { ...pugMember(role, taken), L: raid ? 60 : clamp(S.level + R(5) - 2, 1, 60), hp: 1, mp: 1, gear: contentGear() };
  });
  // spread tanks, then healers, round-robin over the groups; dps fill the gaps
  const nG = Math.ceil(size / 5), groups = Array.from({ length: nG }, () => []);
  groups[0].push(null);
  let gi = 0;
  const place = m => { for (let k = 0; k < nG; k++, gi++) { const g = groups[gi % nG]; if (g.length < 5) { g.push(m); gi++; return; } } };
  ["tank", "heal", "dps"].forEach(role => members.filter(m => m.role === role).forEach(place));
  return groups.flat().filter(Boolean);
}

// role rotations for the group fights (dps companions use these too)
const GROUP_ROT = {
  tank: {
    Warrior: { open: ["Charge"], fill: ["Sunder Armor", "Heroic Strike"], extra: ["Revenge", "Shield Block", "Thunder Clap", "Demoralizing Shout", "Taunt", "Shield Bash", "Cleave", "Shield Slam", "Heroic Strike"], end: ["Shield Wall", "Sunder Armor"] },
    Druid: { open: ["Bear Form"], fill: ["Maul", "Auto Attack"], extra: ["Growl", "Demoralizing Roar", "Bash", "Faerie Fire", "Maul"], end: ["Maul"] },
    Paladin: { open: ["Righteous Fury", "Seal of Righteousness"], fill: ["Auto Attack"], extra: ["Judgement", "Seal of Righteousness", "Holy Shield", "Hammer of Justice", "Blessing of Sanctuary"], end: ["Lay on Hands", "Judgement"] },
  },
  heal: {
    Priest: { open: ["Power Word: Shield"], fill: ["Heal", "Lesser Heal"], extra: ["Renew", "Flash Heal", "Power Word: Shield", "Greater Heal", "Prayer of Healing", "Dispel Magic"], end: ["Renew"] },
    Druid: { open: ["Rejuvenation"], fill: ["Healing Touch"], extra: ["Regrowth", "Rejuvenation", "Swiftmend", "Tranquility", "Remove Curse"], end: ["Rejuvenation"] },
    Paladin: { open: ["Blessing of Wisdom", "Blessing of Might"], fill: ["Holy Light"], extra: ["Flash of Light", "Holy Light", "Purify", "Holy Shock"], end: ["Flash of Light", "Holy Light"] },
    Shaman: { open: ["Healing Stream Totem", "Stoneskin Totem"], fill: ["Healing Wave"], extra: ["Lesser Healing Wave", "Chain Heal", "Mana Spring Totem", "Healing Wave", "Mana Tide Totem"], end: ["Lesser Healing Wave", "Healing Wave"] },
  },
  dps: {
    Warrior: { open: ["Charge"], fill: ["Heroic Strike", "Auto Attack"], extra: ["Whirlwind", "Bloodthirst", "Cleave", "Hamstring", "Battle Shout", "Overpower", "Slam"], end: ["Execute"] },
    Rogue: { open: ["Sinister Strike"], fill: ["Sinister Strike"], extra: ["Slice and Dice", "Backstab", "Kick", "Rupture", "Adrenaline Rush", "Expose Armor"], end: ["Eviscerate"] },
    Hunter: { open: ["Hunter's Mark", "Auto Shot"], fill: ["Auto Shot"], extra: ["Serpent Sting", "Arcane Shot", "Multi-Shot", "Rapid Fire", "Trueshot Aura"], end: ["Arcane Shot", "Auto Shot"] },
    Mage: { open: ["Frostbolt", "Fireball"], fill: ["Frostbolt", "Fireball"], extra: ["Arcane Missiles", "Fire Blast", "Cone of Cold", "Arcane Explosion", "Blizzard", "Frost Nova", "Scorch"], end: ["Fire Blast", "Shoot"] },
    Warlock: { open: ["Corruption", "Immolate"], fill: ["Shadow Bolt"], extra: ["Curse of Agony", "Immolate", "Life Tap", "Searing Pain", "Rain of Fire", "Drain Life"], end: ["Drain Soul", "Shoot"] },
    Priest: { open: ["Shadow Word: Pain"], fill: ["Mind Flay", "Smite"], extra: ["Mind Blast", "Shadow Word: Pain", "Holy Fire", "Shadowform"], end: ["Shoot"] },
    Shaman: { open: ["Flame Shock", "Lightning Bolt"], fill: ["Lightning Bolt"], extra: ["Chain Lightning", "Earth Shock", "Searing Totem", "Elemental Mastery", "Frost Shock"], end: ["Earth Shock"] },
    Druid: { open: ["Moonfire"], fill: ["Wrath"], extra: ["Moonfire", "Insect Swarm", "Hurricane", "Faerie Fire", "Moonkin Form"], end: ["Moonfire", "Wrath"] },
    Paladin: { open: ["Seal of the Crusader", "Seal of Righteousness"], fill: ["Auto Attack"], extra: ["Judgement", "Seal of Righteousness", "Exorcism", "Hammer of Justice"], end: ["Hammer of Wrath", "Judgement"] },
  },
};
const FREE_ATK = /^(Auto Attack|Auto Shot|Shoot)$/;
const HEALS = /^(?!.*(Totem|Prayer)).*(Heal|Light$|Wave|Renew|Rejuvenation|Regrowth|Swiftmend|Holy Shock|Power Word: Shield|Lay on Hands)/;
function knowsAt(c, L, spec) {
  const C = CLASSES[c];
  return n => (FREE_ATK.test(n) && (n !== "Shoot" || L >= 8)) || C.list.some(sp => sp.name === n && sp.lvl <= L) || (L >= 40 && C.ult[spec] === n);
}
// as many casts as a normal fight of the same length would have
const castCount = (base, L = S.level) => Math.max(4, Math.round(base / ((9 + 0.12 * L) / 5.5) * (0.85 + Math.random() * 0.3)));
function rollRot(r, known, n, aoe = []) {
  const first = a => a.find(known) || "Auto Attack", extra = r.extra.filter(known);
  const out = [first(r.open)];
  for (let i = 0; i < n - 2; i++) {
    let s = aoe.length && Math.random() < 0.45 ? pick(aoe) : extra.length && Math.random() < 0.4 ? pick(extra) : first(r.fill);
    if (s === out[out.length - 1] && extra.includes(s)) s = first(r.fill);
    out.push(s);
  }
  const end = r.end.filter(known); out.push(end.length ? end[0] : first(r.fill));
  return out;
}
// the hero's own casts in a group fight: role rotation if tank/healer, the normal one for dps
function heroGroupCasts(base, boss, mobs = 1) {
  const n = castCount(base), role = heroRole();
  if (role === "dps") return rotation(boss, n, mobs);
  const out = rollRot(GROUP_ROT[role][S.cls], knowsAt(S.cls, S.level, S.spec), n, role === "tank" && mobs >= 3 ? heroAoe() : []);
  if (boss) potionCasts(out);
  return out;
}

// how much a pull costs each role (health, mana) as a fraction of the pool
function fightDrop(role, k, r = rnd) {
  const boss = k === "boss";
  if (role === "tank") return boss ? [r(0.3, 0.55), r(0.1, 0.25)] : [r(0.1, 0.22), r(0.04, 0.12)];
  if (role === "heal") return boss ? [r(0.02, 0.15), r(0.25, 0.42)] : [r(0, 0.05), r(0.08, 0.18)];
  return boss ? [r(0.05, 0.3), r(0.2, 0.38)] : [r(0, 0.1), r(0.07, 0.17)];
}
const GROUP_HEALS = /^(Prayer of Healing|Tranquility)$/;
const isHeal = s => HEALS.test(s) || GROUP_HEALS.test(s);
// how much of the target's health a heal restores
function healAmt(s) {
  const r = rnd;
  if (/Lay on Hands/.test(s)) return 1;
  if (/Renew|Rejuvenation|Power Word: Shield/.test(s)) return r(0.05, 0.09);
  if (/Flash|Lesser|Regrowth|Holy Shock|Swiftmend/.test(s)) return r(0.08, 0.14);
  return r(0.12, 0.22);
}
// whether this boss pull ends in a wipe: rolled once, so the bars can show it coming
// undergeared raids and underleveled dungeon groups wipe more, well-geared ones less
// in raids, later bosses are harder (the last one about 1.8 times the first) and a boss nobody has killed yet much harder
const FIRST_KILL = 3.5;
function wipeChance(t) {
  const ri = RAID_INFO[t.dn];
  if (ri) {
    const b = instanceRow(t.dn).bosses, i = Math.max(0, b.indexOf(t.boss)), first = !(S.bossKills[t.boss] > 0);
    return Math.min(0.85, ri.wipe * clamp(1 + (ri.gs - gearScore()) / 25, 0.5, 2) * (1 + 0.8 * i / Math.max(1, b.length - 1)) * (first ? FIRST_KILL : 1) * resWipe(t.boss) * siWipe(t.dn) * dsetWipe(t.dn, i) * dramaWipe());
  }
  const d = instanceRow(t.dn); return 0.06 * (d ? clamp(1 + (d.max - 2 - S.level) * 0.12, 0.4, 2) : 1);
}
// the boss fight that decides the pull (fightsim.js): the wipe chance the gear, the boss and the raid's preparation give
// (wipeChance) sets how hard the boss hits (the pressure: a reference group wipes about that often), then the fight
// itself decides, with this group: its healers and their mana, its tanks, the hero's cooldowns and healing talents,
// a druid's Rebirth, a warlock's soulstone. Played once as the pull starts and stored on the task: t.wipe, t.left,
// t.why, t.dead ([{ name, at, cause }], at = how far through the pull)
const PREP_BASE = [0.8, 1.1];
// in a five-man the hero is a fifth of the group: a hero healer carries more of it than a hero dps, so the pressure
// evens that out on average (the fight still decides each pull)
const FIVE_ROLE = { dps: 0.92, heal: 1.045, tank: 1 }; // the chance going in, scaled (dungeons, raids) so the average pull wipes about as often as before
// the wipe rate against the pressure, fitted offline on snapshots of real groups from the game: [wipe rate, pressure]
const FIGHT_PRESSURE = {
  five: [[0,0.4], [0.001,0.45], [0.004,0.5], [0.02,0.55], [0.044,0.6], [0.104,0.65], [0.179,0.7], [0.277,0.75], [0.375,0.8], [0.48,0.85], [0.582,0.9], [0.66,0.95], [0.75,1], [0.814,1.05], [0.861,1.1], [0.906,1.15], [0.936,1.2], [0.953,1.25], [0.974,1.3], [0.982,1.35], [0.988,1.4], [0.993,1.45], [0.996,1.5]],
  raid: [[0.002,1], [0.009,1.1], [0.022,1.2], [0.044,1.3], [0.083,1.4], [0.144,1.5], [0.205,1.6], [0.278,1.7], [0.383,1.8], [0.41,1.9], [0.519,2], [0.595,2.1], [0.683,2.2], [0.741,2.3], [0.773,2.4], [0.818,2.5], [0.874,2.6], [0.899,2.7], [0.911,2.8], [0.948,2.9], [0.96,3], [0.967,3.1], [0.986,3.2]],
};
function pressureFor(p, raid) {
  const T = FIGHT_PRESSURE[raid ? "raid" : "five"];
  if (p <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (p <= T[i][0]) { const [p0, P0] = T[i - 1], [p1, P1] = T[i]; return P0 + (P1 - P0) * (p - p0) / Math.max(1e-6, p1 - p0); }
  return T[T.length - 1][1];
}
// the group as the fight sees it: everyone's gear against the group's average, health, mana, the hero's cooldowns
function fightMembers(t) {
  const cds = t.cds || [], role = heroRole();
  const M = [{ name: S.name, role, cls: S.cls, hp: S.hpF ?? 1, mp: S.mpF ?? 1, gear: gearFor(), hero: true, healTal: talMod("l"),
    cds: { shield: cds.some(c => c.type === "shield"), heal: cds.some(c => c.type === "heal"), burst: cds.some(c => c.type === "burst") } },
    ...(S.party || []).map(m => ({ name: m.name, role: m.role, cls: m.cls, hp: m.hp ?? 1, mp: m.mp ?? 1, gear: m.gear ?? 1 }))];
  const avg = M.reduce((a, m) => a + m.gear, 0) / M.length || 1;
  M.forEach(m => m.gear = clamp(1 + 0.5 * (m.gear / avg - 1), 0.8, 1.25)); // half the difference: gear counts, luck and mana count too
  return M;
}
// the boss's moves for the chronicle: what kills the tank, what hits everyone, what picks someone out
const AOE_MOVE = /Breath|Volley|Nova|Eruption|Inferno|Rain|Wave|Blast|Pulse|Explosion|Bomb|Shock|Flame|Fire|Fear|Roar|Quake|Storm|Cloud|Poison|Plague|Frost|Ice/;
function fightMoves(t) {
  const rot = BOSS_ROT[t.boss], all = rot ? [rot[0], rot[2], ...rot[1].split(",")].filter(m => m && m !== "Auto Attack") : [];
  const aoe = all.filter(m => AOE_MOVE.test(m)), single = all.filter(m => !AOE_MOVE.test(m));
  return { tank: single.length ? single : ["a crushing blow", "a cleave", "a mortal strike", "a knockdown and a beating"], aoe: aoe.length ? aoe : ["a blast that hit everyone", "a stomp", "a whirlwind", "a wave of fire"], spike: all.length ? all : ["a hit out of nowhere", "a charge", "a curse", "a stray add"] };
}
function bossWipes(t) {
  if (t.k !== "boss") return false;
  if (t.wipe != null) return t.wipe;
  const raid = !!(S.dg && S.dg.raid), p = Math.min(0.95, wipeChance(t) * PREP_BASE[raid ? 1 : 0]);
  const r = fightCore(fightMembers(t), { pressure: pressureFor(p, raid) * (raid ? 1 : FIVE_ROLE[heroRole()] || 1), aoe: 0.3, moves: fightMoves(t) });
  t.wipe = r.wipe;
  t.dead = r.dead.map(d => ({ name: d.name, at: +(0.05 + 0.9 * d.tick / r.ticks).toFixed(3), cause: d.cause || "the boss" }));
  if (r.wipe) { t.left = +r.left.toFixed(2); t.why = fightWhy(t, r, raid); }
  return t.wipe;
}
// what went wrong, from the fight itself
function fightWhy(t, r, raid) {
  if (r.why === "enrage") return `the fight ran too long and ${t.boss} enraged`;
  if (r.why === "oom") return "the healers ran out of mana";
  const tank = r.dead.find(d => d.role === "tank");
  if (r.why === "tanks" && tank) { const c = tank.cause || "a crushing blow", g = raid ? "raid" : "group";
    return pick([`${tank.name} died to ${c} and ${t.boss} ran through the ${g}`, `${tank.name} went down to ${c}, and without a tank it was over`, `lost ${tank.name} to ${c} at the worst moment`]); }
  const n = {}; r.dead.forEach(d => { if (d.cause) n[d.cause] = (n[d.cause] || 0) + 1; });
  const top = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
  return `half the ${raid ? "raid" : "group"} died${top ? ` to ${top}` : ""}`;
}
// play a pull out as a timeline: everyone takes a hit on each of their own casts, and every
// finished heal lands on whoever is hurt most right then (a tank, if it's close)
function simFight(t) {
  foeOf(t);
  const P = pullMembers(t);
  pullCosts(P, t);
  const ev = pullEvents(P, t); aggroPull(P, t, ev);
  playPull(P, t, ev);
  // the deaths the fight decided (bossWipes): each one at its moment; on a wipe the rest go down after the last of them
  if (t.dead) {
    const die = (p, at) => { p.tl = p.tl.filter(x => x[0] < at); p.tl.push([at, 0]); p.cur = 0; };
    t.dead.forEach(d => { const p = P.find(q => q.name === d.name); if (p) die(p, d.at); });
    if (t.wipe) {
      const w0 = Math.max(0.6, ...t.dead.map(d => d.at)), rest = P.filter(p => !t.dead.some(d => d.name === p.name)).sort((a, b) => "thd".indexOf(a.role[0]) - "thd".indexOf(b.role[0]));
      rest.forEach((p, j) => die(p, Math.min(0.99, w0 + (0.99 - w0) * (j + 0.5) / rest.length)));
    }
  } else if (bossWipes(t)) { // a pull from before the fight was simulated
    const order = P.slice().sort((a, b) => "thd".indexOf(a.role[0]) - "thd".indexOf(b.role[0]));
    order.forEach((p, j) => { const at = 0.7 + 0.28 * (j + Math.random() * 0.8) / order.length; p.tl = p.tl.filter(x => x[0] < at); p.tl.push([at, 0]); p.cur = 0; });
  }
  bgDeath(t, P[0]); // killed in a battleground skirmish
  P.forEach(p => p.end = p.cur);
  return P;
}
// the damage dealer who keeps pulling aggro: a friend or guildie with the trait, or about one stranger in six
function aggroProne(m) {
  if (m.role !== "dps") return false;
  const f = S.friends.find(x => x.name === m.name) || (S.guild && S.guild.roster.find(x => x.name === m.name));
  return f ? f.pers === "aggro" : nameHash(m.name) % 6 === 0;
}
const TAUNT = { Warrior: n => `${n} hits Taunt and Mocking Blow`, Druid: n => `${n} Growls it back`, Paladin: n => `${n} has no taunt (it's a paladin) and just keeps hitting it with Holy Shield up` };
// now and then on a trash pull they rip it off the tank and take a beating until the tank gets it back
function aggroPull(P, t, ev) {
  if (t.k !== "trash" || !S.dg || S.dg.bg || S.dg.raid) return;
  const ai = P.findIndex((p, i) => i && aggroProne(S.party[p.pi])); if (ai < 0 || Math.random() > 0.3) return;
  const a = 0.2 + Math.random() * 0.35, tot = 0.45 + Math.random() * 0.3;
  [0, 0.04, 0.08].forEach(d => ev.push({ at: a + d, i: ai, dmg: tot / 3 }));
  ev.sort((x, y) => x.at - y.at);
  const dg = S.dg; dg.aggro = (dg.aggro || 0) + 1; if (dg.aggro > 2) return; // a line for the first couple of times a run
  const n = P[ai].name, tk = P.find(p => p.role === "tank"), tn = tk ? tk.name : null;
  const tcls = !tk ? null : tk === P[0] ? S.cls : S.party[tk.pi].cls;
  const back = !tk ? "Nobody can taunt it back" : tk === P[0] ? `${S.name} taunts it back` : (TAUNT[tcls] || (x => `${x} gets it back`))(tn);
  log(pick([`${n} pulls aggro off ${tn || "the tank"} and gets their ass kicked. ${back}.`, `${n} goes all in before the tank has threat. The mob turns around. ${back}.`, `Aggro on ${n}! ${back}, just in time.`]), "chat");
}
// everyone in the pull: the hero (casts already rolled) and the companions (their casts rolled here)
function pullMembers(t) {
  const raid = S.dg && S.dg.raid, base = t.k === "boss" ? (raid ? 260 : 110) : (raid ? 70 : 40);
  return [{ name: S.name, role: heroRole(), hp: S.hpF ?? 1, mp: S.mpF ?? 1, mx: hpMax(), healEv: [], casts: (t.casts || []).map(s => s.replace(/ on .+$/, "")) },
    ...S.party.map((m, pi) => ({ pi, m })).filter(x => !t.allies || t.allies.includes(x.pi)).map(({ pi, m }) => ({ pi, name: m.name, role: m.role, hp: m.hp, mp: m.mp, mx: memberMax(m.cls, m.L), healEv: [], casts: rollRot(GROUP_ROT[m.role][m.cls], knowsAt(m.cls, m.L, m.spec), castCount(base, m.L)) }))];
}
// each member's mana at the end, and the damage they take per cast of their own
function pullCosts(P, t) {
  const lo = x => Math.max(0.05, x);
  // the damage each role soaks is the pull's usual cost plus its share of the healing on offer
  let supply = 0;
  const big = S.dg && S.dg.raid && !S.dg.bg ? RAID_HEAL : 1; // raids: bigger hits, bigger heals (the meter shows raid-sized numbers)
  P.forEach(p => { if (p.role === "heal") p.casts.forEach(s => { if (isHeal(s)) supply += 0.15 * big; }); });
  const W = { tank: 3, dps: 0.6, heal: 0.3 }, wsum = P.reduce((a, p) => a + W[p.role], 0);
  const tough = heroTaken(false, (dungeonRow() || { max: S.level }).max);
  P.forEach((p, i) => { const d = fightDrop(p.role, t.k); if (!i) { d[0] *= tough; d[1] *= talMod("m"); } p.mpEnd = lo(p.mp - d[1]); p.hit = (d[0] + supply * HEAL_EFF * W[p.role] / wsum) / (p.casts.length || 1); p.cur = p.hp; p.tl = [[0, p.hp]]; });
}
// what happens in the pull, in time order: member i's cast k ({ at, i, k }) and the enemy's hits on them ({ at, i, dmg })
function pullEvents(P, t) {
  const ev = []; P.forEach((p, i) => p.casts.forEach((s, k) => ev.push({ at: (k + 1) / p.casts.length, i, k })));
  // the enemy's hits: single-target ones on whoever it is attacking, aoe on everyone. Members it never
  // hits this pull (no aoe) keep taking their usual splash damage on their own casts
  const fe = foeEvents(t), tn = foeTarget(t), ti = tn === "you" ? 0 : Math.max(0, P.findIndex(p => p.name === tn));
  // the one it's attacking takes all of its share from the enemy's hits; everyone else gets a slice from
  // area hits (more area hits, bigger slice) and the rest as the usual splash on their own casts
  const nAoe = fe.filter(e => e.aoe).length;
  // hits are sized by the time since the last one (so damage flows evenly through the pull, even when
  // a pack of adds is up at the start) and by how strong the ability is
  P.forEach((p, i) => {
    const hs = fe.filter(e => e.aoe || i === ti), budget = p.hit * (p.casts.length || 1);
    const share = !hs.length ? 0 : i === ti ? 1 : Math.min(0.5, 0.1 * nAoe);
    p.splash = 1 - share; if (!share) return;
    let last = 0; const wt = hs.map(e => { const dt = Math.max(0.01, e.at - last); last = e.at; return dt * (0.5 + 0.5 * e.size); }), W = wt.reduce((a, b) => a + b, 0);
    hs.forEach((e, j) => ev.push({ at: e.at, i, dmg: budget * share * wt[j] / W }));
  });
  ev.sort((a, b) => a.at - b.at);
  return ev;
}
// the pull, event by event: hits land (a shield soaks the hero's), cooldowns fire, healers heal whoever is hurt most
function playPull(P, t, ev) {
  const put = (p, at, v) => { p.cur = Math.min(1, Math.max(0.05, v)); p.tl.push([at, p.cur]); };
  const heal = (h, q, at, v) => { const was = q.cur; put(q, at, v); if (q.cur > was) h.healEv.push({ at, amt: Math.round((q.cur - was) * q.mx) }); };
  let shield = 0;
  const big = S.dg && S.dg.raid && !S.dg.bg ? RAID_HEAL : 1; // raid heals are bigger (and so are the hits: pullCosts)
  for (const { at, i, k, dmg } of ev) {
    const p = P[i];
    if (k == null) { let a = dmg; if (!i && shield > 0) { const soak = Math.min(shield, a); shield -= soak; a -= soak; } if (a > 0) put(p, at, p.cur - a); continue; }
    const s = p.casts[k], cd = !i && (t.cds || []).find(c => c.name === s.replace(/ on .+$/, ""));
    if (cd && cd.type === "shield") { shield += 0.3; continue; }
    if (cd && cd.type === "heal") { const q = P.reduce((a, b) => (1 - b.cur > 1 - a.cur ? b : a)); heal(p, q, at, q.cur + 0.4 * talMod("l")); continue; }
    if (p.splash > 0) put(p, at, p.cur - p.hit * p.splash * (0.6 + Math.random() * 0.8));
    if (p.role !== "heal" || !isHeal(s)) continue;
    const hurt = P.map((q, j) => [1 - q.cur + (q.role === "tank" ? 0.08 : 0), j]).sort((a, b) => b[0] - a[0]);
    const hm = (i ? 1 : talMod("l")) * big; // the hero's healing talents, raid-sized heals
    if (GROUP_HEALS.test(s)) { hurt.slice(0, 5).forEach(([, x]) => heal(p, P[x], at, P[x].cur + 0.07 * hm)); continue; }
    const q = P[Math.random() < 0.85 ? hurt[0][1] : hurt[R(Math.min(4, hurt.length))][1]];
    heal(p, q, at, q.cur + healAmt(s) * hm);
    if (/Chain Heal/.test(s)) hurt.filter(([, x]) => P[x] !== q).slice(0, 2).forEach(([, x], n) => heal(p, P[x], at, P[x].cur + (n ? 0.04 : 0.07) * big));
    p.casts[k] = `${s} on ${q.name}`;
  }
}
let HEAL_EFF = 1.05;
const RAID_HEAL = 2.5;
// the group's side of a task, worked out once when it starts (kept in memory, not in the save)
const PF = new WeakMap();
function partyFight(t) {
  if (!S.party || !t) return null;
  let f = PF.get(t); if (f) return f;
  if (t.k === "trash" || t.k === "boss") {
    const P = simFight(t);
    if (P[0].role === "heal") t.casts = P[0].casts;
    // battlegrounds: whoever isn't in the fight is off doing their job (and gets a breather)
    f = { hero: P[0], m: S.party.map((m, i) => P.find(p => p.pi === i) || { idle: true, casts: [], tl: null, hp: m.hp, mp: m.mp, end: Math.min(1, m.hp + 0.2), mpEnd: Math.min(1, m.mp + 0.15) }) };
  } else {
    const up = x => Math.min(1, x);
    f = { hero: null, m: S.party.map(m => {
      const e = t.k === "ghost" ? [0, 0] : t.k === "regroup" || t.k === "dbuff" ? [1, 1] : [up(m.hp + 0.3), up(m.mp + 0.3)];
      return { casts: [], tl: null, hp: m.hp, mp: m.mp, end: e[0], mpEnd: e[1] };
    }) };
  }
  PF.set(t, f); return f;
}
// health at a point of the timeline: the last change at or before it
function hpAt(p, raw) {
  const tl = p.tl; let lo = 0, hi = tl.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tl[mid][0] <= raw + 1e-9) lo = mid; else hi = mid - 1; }
  return tl[lo][1];
}
function memberNow(i) {
  const m = S.party[i], t = S.task, f = partyFight(t), g = f && f.m[i];
  if (!g) return { hp: m.hp, mp: m.mp, p: 0, fight: false, ci: -1, casts: [] };
  const raw = taskDone(t), cs = g.casts, n = cs.length, p = n ? Math.floor(raw * n) / n : raw;
  return { hp: g.tl ? hpAt(g, raw) : g.hp + (g.end - g.hp) * p, mp: g.mp + (g.mpEnd - g.mp) * p, p, fight: n > 0, ci: n ? Math.min(n - 1, Math.floor(raw * n)) : -1, casts: cs };
}
function partyFinish(t) {
  const f = partyFight(t); if (!f) return;
  if (t.k === "trash" || t.k === "boss") meterFinish(t);
  S.party.forEach((m, i) => { const g = f.m[i]; if (g) { m.hp = g.end; m.mp = g.mpEnd; } });
}
// rage builds through a pull, energy dips and ticks back
const pool2 = (res, fight, p) => res === "Rage" ? (fight ? Math.round(15 + 70 * p) : 0) : (fight ? Math.round(100 - 65 * Math.abs(Math.sin(p * Math.PI * 3))) : 100);
// a won pull with deaths: who fell (rezzed after the kill); the hero's own death costs a repair bill, not a death count
function fightDeaths(t) {
  const d = (t.dead || []).filter(x => x.name); if (!d.length) return "";
  const me = d.find(x => x.name === S.name);
  if (me) { S.hpF = 0.3; S.repair += S.level * S.level * 3; }
  (S.party || []).forEach(m => { if (d.some(x => x.name === m.name)) m.hp = 0.3; });
  const raid = !!(S.dg && S.dg.raid);
  if (me) return ` ${S.name} died to ${me.cause} before the end and gets a rez after the kill.${d.length > 1 ? ` ${d.length - 1} more died along the way.` : ""}`;
  return raid && d.length > 2 ? ` ${d.length} died along the way.` : ` ${d.map(x => `${x.name} died to ${x.cause}`).join(", ")}, rezzed after the kill.`;
}
