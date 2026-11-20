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
const contentGear = () => { const ri = S.dg && RAID_INFO[S.dg.name]; return (ri ? ri.gs / 60 : 1) * (0.85 + Math.random() * 0.3); };
function makeParty(raid) {
  const size = raid && S.dg && RAID_INFO[S.dg.name] ? RAID_INFO[S.dg.name].size : 5, [nt, nh] = RAID_ROLES[size] || RAID_ROLES[5];
  const roles = [...Array(nt).fill("tank"), ...Array(nh).fill("heal")]; while (roles.length < size) roles.push("dps");
  roles.splice(roles.indexOf(heroRole()), 1);
  const taken = [S.name];
  const members = roles.map(role => {
    const c = pick(ROLE_CLASSES[role].filter(k => k !== "Paladin" || S.faction === "Alliance").filter(k => k !== "Shaman" || S.faction === "Horde"));
    const race = pick(Object.keys(ALLOWED).filter(r => RACES[r].f === S.faction && ALLOWED[r].includes(c)));
    const name = randName(taken); taken.push(name);
    return { name, race, cls: c, role, spec: ROLE_SPEC[role][c], L: raid ? 60 : clamp(S.level + R(5) - 2, 1, 60), hp: 1, mp: 1, gear: contentGear() };
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
function fightDrop(role, k, r = (a, b) => a + Math.random() * (b - a)) {
  const boss = k === "boss";
  if (role === "tank") return boss ? [r(0.3, 0.55), r(0.1, 0.25)] : [r(0.1, 0.22), r(0.04, 0.12)];
  if (role === "heal") return boss ? [r(0.02, 0.15), r(0.25, 0.42)] : [r(0, 0.05), r(0.08, 0.18)];
  return boss ? [r(0.05, 0.3), r(0.2, 0.38)] : [r(0, 0.1), r(0.07, 0.17)];
}
const GROUP_HEALS = /^(Prayer of Healing|Tranquility)$/;
const isHeal = s => HEALS.test(s) || GROUP_HEALS.test(s);
// how much of the target's health a heal restores
function healAmt(s) {
  const r = (a, b) => a + Math.random() * (b - a);
  if (/Lay on Hands/.test(s)) return 1;
  if (/Renew|Rejuvenation|Power Word: Shield/.test(s)) return r(0.05, 0.09);
  if (/Flash|Lesser|Regrowth|Holy Shock|Swiftmend/.test(s)) return r(0.08, 0.14);
  return r(0.12, 0.22);
}
// play a pull out as a timeline: everyone takes a hit on each of their own casts, and every
// finished heal lands on whoever is hurt most right then (a tank, if it's close)
// whether this boss pull ends in a wipe: rolled once, so the bars can show it coming
// undergeared raids and underleveled dungeon groups wipe more, well-geared ones less
function wipeChance(t) {
  const ri = RAID_INFO[t.dn]; if (ri) return ri.wipe * clamp(1 + (ri.gs - gearScore()) / 25, 0.5, 2);
  const d = DUNGEONS.find(x => x[0] === t.dn); return 0.06 * (d ? clamp(1 + (d[2] - 2 - S.level) * 0.12, 0.4, 2) : 1);
}
const bossWipes = t => t.k === "boss" && (t.wipe ?? (t.wipe = Math.random() < wipeChance(t)));
function simFight(t) {
  foeOf(t);
  const raid = S.dg && S.dg.raid, base = t.k === "boss" ? (raid ? 260 : 110) : (raid ? 70 : 40), lo = x => Math.max(0.05, x);
  const P = [{ name: S.name, role: heroRole(), hp: S.hpF ?? 1, mp: S.mpF ?? 1, mx: hpMax(), healEv: [], casts: (t.casts || []).map(s => s.replace(/ on .+$/, "")) },
    ...S.party.map(m => ({ name: m.name, role: m.role, hp: m.hp, mp: m.mp, mx: memberMax(m.cls, m.L), healEv: [], casts: rollRot(GROUP_ROT[m.role][m.cls], knowsAt(m.cls, m.L, m.spec), castCount(base, m.L)) }))];
  // the damage each role soaks is the pull's usual cost plus its share of the healing on offer
  let supply = 0;
  P.forEach(p => { if (p.role === "heal") p.casts.forEach(s => { if (isHeal(s)) supply += 0.15; }); });
  const W = { tank: 3, dps: 0.6, heal: 0.3 }, wsum = P.reduce((a, p) => a + W[p.role], 0);
  const tough = heroTaken(false, (dungeonRow() || [0, 0, S.level])[2]);
  P.forEach((p, i) => { const d = fightDrop(p.role, t.k); if (!i) { d[0] *= tough; d[1] *= talMod("m"); } p.mpEnd = lo(p.mp - d[1]); p.hit = (d[0] + supply * HEAL_EFF * W[p.role] / wsum) / (p.casts.length || 1); p.cur = p.hp; p.tl = [[0, p.hp]]; });
  const ev = []; P.forEach((p, i) => p.casts.forEach((s, k) => ev.push([(k + 1) / p.casts.length, i, k])));
  // the enemy's hits: single-target ones on whoever it is attacking, aoe on everyone. Members it never
  // hits this pull (no aoe) keep taking their usual splash damage on their own casts
  const fe = foeEvents(t), tn = foeTarget(), ti = tn === "you" ? 0 : Math.max(0, P.findIndex(p => p.name === tn));
  // the one it's attacking takes all of its share from the enemy's hits; everyone else gets a slice from
  // area hits (more area hits, bigger slice) and the rest as the usual splash on their own casts
  const nAoe = fe.filter(e => e[2]).length;
  // hits are sized by the time since the last one (so damage flows evenly through the pull, even when
  // a pack of adds is up at the start) and by how strong the ability is
  P.forEach((p, i) => {
    const hs = fe.filter(e => e[2] || i === ti), budget = p.hit * (p.casts.length || 1);
    const share = !hs.length ? 0 : i === ti ? 1 : Math.min(0.5, 0.1 * nAoe);
    p.splash = 1 - share; if (!share) return;
    let last = 0; const wt = hs.map(e => { const dt = Math.max(0.01, e[0] - last); last = e[0]; return dt * (0.5 + 0.5 * e[1]); }), W = wt.reduce((a, b) => a + b, 0);
    hs.forEach((e, j) => ev.push([e[0], i, -1, budget * share * wt[j] / W]));
  });
  ev.sort((a, b) => a[0] - b[0]);
  const put = (p, at, v) => { p.cur = Math.min(1, Math.max(0.05, v)); p.tl.push([at, p.cur]); };
  const heal = (h, q, at, v) => { const was = q.cur; put(q, at, v); if (q.cur > was) h.healEv.push([at, Math.round((q.cur - was) * q.mx)]); };
  let shield = 0;
  for (const [at, i, k, amt] of ev) {
    const p = P[i];
    if (k < 0) { let a = amt; if (!i && shield > 0) { const soak = Math.min(shield, a); shield -= soak; a -= soak; } if (a > 0) put(p, at, p.cur - a); continue; }
    const s = p.casts[k], cd = !i && (t.cds || []).find(c => c.name === s.replace(/ on .+$/, ""));
    if (cd && cd.type === "shield") { shield += 0.3; continue; }
    if (cd && cd.type === "heal") { const q = P.reduce((a, b) => (1 - b.cur > 1 - a.cur ? b : a)); heal(p, q, at, q.cur + 0.4 * talMod("l")); continue; }
    if (p.splash > 0) put(p, at, p.cur - p.hit * p.splash * (0.6 + Math.random() * 0.8));
    if (p.role !== "heal" || !isHeal(s)) continue;
    const hurt = P.map((q, j) => [1 - q.cur + (q.role === "tank" ? 0.08 : 0), j]).sort((a, b) => b[0] - a[0]);
    const hm = i ? 1 : talMod("l"); // the hero's healing talents
    if (GROUP_HEALS.test(s)) { hurt.slice(0, 5).forEach(([, x]) => heal(p, P[x], at, P[x].cur + 0.07 * hm)); continue; }
    const q = P[Math.random() < 0.85 ? hurt[0][1] : hurt[R(Math.min(4, hurt.length))][1]];
    heal(p, q, at, q.cur + healAmt(s) * hm);
    if (/Chain Heal/.test(s)) hurt.filter(([, x]) => P[x] !== q).slice(0, 2).forEach(([, x], n) => heal(p, P[x], at, P[x].cur + (n ? 0.04 : 0.07)));
    p.casts[k] = `${s} on ${q.name}`;
  }
  // a wipe: late in the fight the group goes down, tank first, then the healers, then everyone else
  if (bossWipes(t)) {
    const order = P.slice().sort((a, b) => "thd".indexOf(a.role[0]) - "thd".indexOf(b.role[0]));
    order.forEach((p, j) => { const at = 0.7 + 0.28 * (j + Math.random() * 0.8) / order.length; p.tl = p.tl.filter(x => x[0] < at); p.tl.push([at, 0]); p.cur = 0; });
  }
  P.forEach(p => p.end = p.cur);
  return P;
}
let HEAL_EFF = 1.05;
// the group's side of a task, worked out once when it starts (kept in memory, not in the save)
const PF = new WeakMap();
function partyFight(t) {
  if (!S.party || !t) return null;
  let f = PF.get(t); if (f) return f;
  if (t.k === "trash" || t.k === "boss") {
    const P = simFight(t);
    if (P[0].role === "heal") t.casts = P[0].casts;
    f = { hero: P[0], m: P.slice(1) };
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
  const raw = Math.min(1, t.el / t.t), cs = g.casts, n = cs.length, p = n ? Math.floor(raw * n) / n : raw;
  return { hp: g.tl ? hpAt(g, raw) : g.hp + (g.end - g.hp) * p, mp: g.mp + (g.mpEnd - g.mp) * p, p, fight: n > 0, ci: n ? Math.min(n - 1, Math.floor(raw * n)) : -1, casts: cs };
}
function partyFinish(t) {
  const f = partyFight(t); if (!f) return;
  if (t.k === "trash" || t.k === "boss") meterFinish(t);
  S.party.forEach((m, i) => { const g = f.m[i]; if (g) { m.hp = g.end; m.mp = g.mpEnd; } });
}
// rage builds through a pull, energy dips and ticks back
const pool2 = (res, fight, p) => res === "Rage" ? (fight ? Math.round(15 + 70 * p) : 0) : (fight ? Math.round(100 - 65 * Math.abs(Math.sin(p * Math.PI * 3))) : 100);
