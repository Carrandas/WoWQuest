// Planning: what the hero does next (quests, city visits, dungeons), rotations and area of effect.
"use strict";

// ---------- planning ----------
const needCity = () => S.level < 60 ? S.level >= S.nextCity : S.cycleQ >= 8;
function travelVerb() { return S.mount >= 2 ? "Galloping on your " + rideName() : S.mount ? "Riding your " + rideName() : "Running"; }

function plan() {
  const q = S.queue, z = curZone(), h = hub();
  // 1. arrive in the current zone
  if (S.arrived !== z) {
    const first = S.loc === "start";
    q.push({ k: "arrive", d: first ? `Getting your bearings in ${z}` : S.level >= 10 ? `Taking the flight path to ${h}, ${z}` : `${travelVerb()} to ${h}, ${z}`, t: sec(first ? 6 : S.level >= 10 ? 140 : 60), zone: z });
    return;
  }
  // 2. out in the field
  if (S.loc === "field") return planField(q, h);
  // 3. at the quest hub
  planHub(q, z, h);
}
// out in the field: go back when the bags are full, the quests are done, or it's time to train;
// otherwise buff, rest, walk to the next quest's mobs, or fight
function planField(q, h) {
  const open = S.quests.filter(x => !questDone(x));
  if (S.bags.length >= bagCap() || !open.length || needCity()) {
    q.push({ k: "hub", d: S.bags.length >= bagCap() ? `Bags full. ${travelVerb()} back to ${h}` : `${travelVerb()} back to ${h} to turn in`, t: sec(35 * mountF()) });
    return;
  }
  const pt = petTask();
  if (pt) { q.push(pt); return; }
  const mb = missingBuff();
  if (mb) { q.push({ k: "buff", d: mb.cast, t: sec(2.5), b: mb }); return; }
  if (S.since > 3 + R(6) || (S.hpF ?? 1) < 0.45 || (cls().mp && (S.mpF ?? 1) < 0.3)) {
    const dry = restKinds().find(k => !(S.cons[k] > 0) && canConjure(k));
    if (dry) { q.push(...rationTasks(h).filter(x => x.k === "conjure")); return; }
    S.since = 0; q.push(restTask()); return;
  }
  let quest = S.quests.find(x => x.id === S.curQ && !questDone(x)) || open[0];
  // a new quest: walk to its mobs (an elite needs a group, and an elixir first)
  if (quest.id !== S.curQ) {
    S.curQ = quest.id; duoStart();
    const elite = quest.type === "elite";
    if (elite && elixirName() && S.cons.elix > 0) q.push({ k: "elixir", d: `Drinking ${article(elixirName())} before the fight`, t: sec(3) });
    q.push({ k: "move", d: elite ? `Looking for a group to kill ${quest.mob}` : `Heading out to find ${plural(quest.mob)} for "${quest.name}"`, t: sec((elite ? 40 : 20) * mountF()) });
    return;
  }
  if (wpRoll(q)) return; // world PvP: a player of the other faction instead
  q.push(killTask(quest));
}
// at the quest hub: sell, turn in, then pick up new quests or go train
function planHub(q, z, h) {
  const sells = groupBags();
  sells.forEach(g => q.push({ k: "sell", d: `Selling ${g.name}${g.n > 1 ? " ×" + g.n : ""}`, t: sec(1.5 + g.n * 0.4, 1), name: g.name }));
  S.quests.filter(questDone).forEach(x => q.push({ k: "turnin", d: `Turning in "${x.name}"`, t: sec(5), qid: x.id }));
  q.push(...rationTasks(h));
  if (needCity()) { queueCity(); return; }
  const want = 3 + R(3) - S.quests.filter(x => !questDone(x)).length;
  for (let i = 0; i < want; i++) q.push({ k: "accept", d: `Picking up a new quest in ${h}`, t: sec(4) });
  q.push({ k: "field", d: `Heading out of ${h} into ${z}`, t: sec(15 * mountF()) });
}
function groupBags() {
  const m = new Map(); S.bags.forEach(b => { const g = m.get(b.name) || { name: b.name, n: 0 }; g.n++; m.set(b.name, g); });
  return [...m.values()];
}

function killTask(quest) {
  const c = cls(), zr = ZONES[quest.zone], zmin = zr ? zr.min : S.level, zmax = zr ? zr.max : S.level;
  const elite = quest.type === "elite";
  const mobL = elite ? Math.min(S.level + 2, zmax + 2) : clamp(S.level + R(3) - 1, Math.max(1, zmin - 1), zmax + 2);
  const mob = elite ? quest.mob : quest.type === "col" && Math.random() < 0.15 ? pick(zoneMobs(quest.zone)) : quest.mob;
  // now and then a second or third mob joins in (sometimes a local wanderer)
  const roll = Math.random(), n = elite || S.level < 6 ? 1 : roll < 0.03 ? 3 : roll < 0.13 ? 2 : 1;
  const mobs = [mob]; for (let i = 1; i < n; i++) mobs.push(Math.random() < 0.7 ? mob : pick(zoneMobs(quest.zone)));
  const d = elite ? `Fighting ${mob} (elite) with a group` : n > 1 ? `${pick(c.verbs)} ${n === 2 ? "two" : "three"} mobs at once` : `${pick(c.verbs)} ${article(mob)}`;
  const gear = gearFor();
  const p = packTrim(rotation(elite, n > 1 ? (4 + R(2)) * n : undefined, n), n, 0,
    sec((9 + S.level * 0.12) * (elite ? 5 : 1) * (1 + 0.6 * (n - 1)) * clamp(1.35 - gear * 0.35, 0.8, 1.2) * buffSpeed() * petSpeed() / talMod("d")));
  const t = { k: "kill", d, t: p.t, mob, mobs, mobL, qid: quest.id, elite, casts: p.casts };
  killHelpers(t); // company: helpers on elites, a friend questing along
  return t;
}

// ---------- area of effect ----------
// spells that hit more than one enemy: how many (99 = every enemy close by) and how hard on each,
// next to a single-target cast of the same weight
const AOE = { "Arcane Explosion": [99, 0.7], Blizzard: [99, 0.8], Flamestrike: [99, 0.8], "Cone of Cold": [99, 0.6], "Frost Nova": [99, 0.3],
  "Rain of Fire": [99, 0.8], Hellfire: [99, 0.7], Consecration: [99, 0.6], "Holy Nova": [99, 0.5], Hurricane: [99, 0.8], Volley: [99, 0.8],
  "Fire Nova Totem": [99, 0.6], "Rough Copper Bomb": [99, 0.9], "Coarse Dynamite": [99, 0.9], "Iron Grenade": [99, 0.9], "Mithril Frag Bomb": [99, 0.9], "Thorium Grenade": [99, 0.9], Inferno: [99, 0.9], "Thunder Clap": [4, 0.5], Whirlwind: [4, 0.9], Cleave: [2, 0.9], "Multi-Shot": [3, 0.85], "Chain Lightning": [3, 0.8] };
// what each class reaches for with three or more enemies on it
const AOE_PICK = { Mage: ["Arcane Explosion", "Blizzard", "Flamestrike", "Cone of Cold", "Frost Nova"], Warlock: ["Rain of Fire", "Hellfire"], Warrior: ["Whirlwind", "Cleave", "Thunder Clap"],
  Paladin: ["Consecration"], Druid: ["Hurricane"], Hunter: ["Multi-Shot", "Volley"], Priest: ["Holy Nova"], Shaman: ["Chain Lightning", "Fire Nova Totem"] };
// only worth casting on a pack
const AOE_ONLY = /^(Arcane Explosion|Blizzard|Flamestrike|Rain of Fire|Hellfire|Hurricane|Volley|Holy Nova|Fire Nova Totem)$/;
// the area spells the hero knows (talent ones too)
const heroAoe = () => (AOE_PICK[S.cls] || []).filter(n => n in S.spells || talentSpells().some(x => x.name === n));
// a pack fight cast by cast: a single-target cast hits the focus (the first enemy still up), an area cast hits
// every enemy still up (or the first few). share is the group's own area damage, spread over the pack on every cast.
// Each enemy has hp (in cast weights); returns the damage each one took per cast and the cast it died on
function packSim(casts, w, n, hp, share = 0) {
  const left = new Array(n).fill(hp), dw = Array.from({ length: n }, () => new Array(casts.length).fill(0)), die = new Array(n).fill(-1);
  const hit = (j, d, i) => { if (left[j] <= 0 || d <= 0) return; const x = Math.min(left[j], d); left[j] -= x; dw[j][i] += x; if (left[j] <= 1e-9) { left[j] = 0; die[j] = i; } };
  casts.forEach((s, i) => {
    const up = []; for (let j = 0; j < n; j++) if (left[j] > 0) up.push(j);
    if (!up.length) return;
    const a = AOE[s], wi = w[i] ?? 1;
    if (a) up.slice(0, a[0]).forEach(j => hit(j, wi * a[1], i));
    else { hit(up[0], wi * (1 - share), i); if (share) up.forEach(j => hit(j, wi * share * 0.6, i)); }
  });
  return { dw, die, done: left.every(x => x <= 0) };
}
// the toughest pack that still goes down by the last cast: that's the fight the bars show
function packFit(casts, w, n, share) {
  let lo = 0, hi = w.reduce((a, b) => a + b, 0);
  if (!(hi > 0)) return null;
  for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (packSim(casts, w, n, m, share).done) lo = m; else hi = m; }
  const r = packSim(casts, w, n, lo, share);
  return r.done ? r : null;
}
// with area damage a pack dies sooner: the casts it no longer takes are dropped and the pull gets shorter
function packTrim(casts, n, share, t) {
  if (n < 2) return { casts, t };
  const w = casts.map(castWeight), r = packSim(casts, w, n, w.reduce((a, b) => a + b, 0) / n, share), end = Math.max(...r.die);
  if (!r.done || end < 2 || end >= casts.length - 1) return { casts, t };
  return { casts: casts.slice(0, end + 1), t: Math.round(t * Math.max(0.65, (end + 1) / casts.length)) };
}
// how much of a dungeon group's damage is area damage on a pack: the area classes in the party switch to it
function groupAoe(n) {
  if (n < 3 || !S.party) return 0;
  return Math.min(0.45, 0.12 * S.party.filter(m => m.role !== "heal" && m.L >= 20 && (AOE_PICK[m.cls] || []).length).length);
}

// a believable fight: opener, filler casts with the odd extra ability, then a finisher
const ROT = {
  Warrior: () => ({ open: ["Charge"], fill: ["Heroic Strike", "Auto Attack"], extra: ["Rend", "Thunder Clap", "Overpower", "Sunder Armor", "Hamstring", "Revenge", "Cleave", "Slam", "Whirlwind", "Bloodrage", "Battle Shout"], end: ["Execute"] }),
  Paladin: () => ({ open: ["Seal of the Crusader", "Seal of Righteousness"], fill: ["Auto Attack"], extra: ["Judgement", "Seal of Righteousness", "Hammer of Justice", "Exorcism", "Holy Light", "Flash of Light"], end: ["Hammer of Wrath"] }),
  Hunter: () => ({ open: ["Hunter's Mark", "Auto Shot"], fill: ["Auto Shot"], extra: ["Serpent Sting", "Arcane Shot", "Concussive Shot", "Multi-Shot", "Scorpid Sting", "Wing Clip", "Raptor Strike", "Mongoose Bite"], end: ["Arcane Shot", "Raptor Strike"] }),
  Rogue: () => ({ open: ["Cheap Shot", "Ambush", "Garrote", "Sinister Strike"], fill: ["Sinister Strike"], extra: ["Slice and Dice", "Gouge", "Backstab", "Kick", "Rupture"], end: ["Eviscerate"] }),
  Priest: () => ({ open: ["Power Word: Shield", "Smite"], fill: S.spec === 2 && "Mind Flay" in S.spells ? ["Mind Flay"] : ["Smite"], extra: ["Shadow Word: Pain", "Mind Blast", "Holy Fire", "Renew", "Shoot"], end: ["Shoot"] }),
  Shaman: () => ({ open: ["Lightning Bolt"], fill: S.spec === 1 ? ["Auto Attack"] : ["Lightning Bolt", "Auto Attack"], extra: ["Earth Shock", "Flame Shock", "Frost Shock", "Searing Totem", "Lightning Shield", "Healing Wave"], end: ["Earth Shock", "Auto Attack"] }),
  Mage: () => ({ open: S.spec === 1 ? ["Fireball"] : ["Frostbolt", "Fireball"], fill: S.spec === 1 ? ["Fireball"] : ["Frostbolt", "Fireball"], extra: ["Frost Nova", "Fire Blast", "Cone of Cold", "Arcane Missiles", "Arcane Explosion", "Scorch"], end: ["Fire Blast", "Shoot"] }),
  Warlock: () => ({ open: ["Corruption", "Immolate", "Shadow Bolt"], fill: ["Shadow Bolt"], extra: ["Immolate", "Curse of Agony", "Life Tap", "Drain Life", "Searing Pain", "Death Coil"], end: ["Drain Soul", "Shoot"] }),
  Druid: () => S.spec === 1 && "Cat Form" in S.spells ? { open: ["Prowl"], fill: ["Claw"], extra: ["Rake", "Shred", "Faerie Fire", "Rip"], end: ["Ferocious Bite", "Rip"] }
    : S.spec === 1 && "Bear Form" in S.spells ? { open: ["Bear Form"], fill: ["Maul", "Auto Attack"], extra: ["Demoralizing Roar", "Bash", "Growl"], end: ["Maul"] }
    : { open: ["Moonfire", "Wrath"], fill: ["Wrath"], extra: ["Moonfire", "Entangling Roots", "Faerie Fire", "Rejuvenation", "Healing Touch"], end: ["Moonfire", "Wrath"] },
};
const ULT_ATK = { Warrior: [0, 1, 2], Paladin: [0], Shaman: [1], Warlock: [2] };
function rotation(elite, count, mobs = 1) {
  const c = cls(), r = ROT[S.cls]();
  const known = n => (FREE_ATK.test(n) && (n !== "Shoot" || S.level >= 8)) || n in S.spells, first = a => a.find(known) || "Auto Attack";
  let extra = r.extra.filter(known);
  if (S.level >= 40 && (ULT_ATK[S.cls] || []).includes(S.spec)) extra.push(c.ult[S.spec], c.ult[S.spec]);
  const tsp = talentSpells();
  tsp.filter(x => x.kind === "a" && x.name !== c.ult[S.spec]).forEach(x => extra.push(x.name));
  if (mobs < 3) extra = extra.filter(s => !AOE_ONLY.test(s));
  const aoe = mobs >= 3 ? heroAoe() : [];
  const out = [first(r.open)], n = count ? count - 2 : (elite ? 6 : 3) + R(3);
  for (let i = 0; i < n; i++) {
    let s = aoe.length && Math.random() < 0.55 ? pick(aoe) : extra.length && Math.random() < 0.4 ? pick(extra) : first(r.fill);
    if (s === out[out.length - 1] && extra.includes(s) && !aoe.includes(s)) s = first(r.fill);
    out.push(s);
  }
  const end = r.end.filter(known);
  if (end.length && Math.random() < 0.7) out.push(end[0]);
  if (elite) potionCasts(out);
  return out;
}

function queueCity() {
  const q = S.queue, c = cls(), local = S.level < 10, where = local ? hub() : city();
  if (!local) q.push({ k: "travel", d: `Hearthing to ${where}`, t: sec(14, 1), to: "city" });
  q.push({ k: "train", d: `Training with your ${S.cls.toLowerCase()} trainer in ${where}`, t: sec(10) });
  const p = S.prof;
  if (p && trainCap()) { const c = crafts()[0]; q.push({ k: "craft", d: `Crafting ${CRAFT_AT[c]} (${c} ${Math.max(1, p.sk[c])})`, t: sec(12) }); }
  if (S.repair > 0) q.push({ k: "repair", d: `Repairing gear at the blacksmith`, t: sec(5) });
  const ev = !local && wpCityEvent(q); // Corrupted Blood, Kazzak: train and get out
  if (!local) aqCity(q); // the Ahn'Qiraj war effort: supplies handed in
  if (!local && !ev) q.push({ k: "shop", d: `Browsing the Auction House in ${where}`, t: sec(18) });
  if (S.level >= 40 && S.mount < 1) q.push({ k: "mount", d: `Visiting the riding trainer`, t: sec(8) });
  if (S.level >= 60 && S.mount < 2) q.push({ k: "mount", d: `Counting gold for an epic mount`, t: sec(6) });
  q.push({ k: "choose", d: `Studying the map for the next adventure`, t: sec(6) });
}

// a dungeon or raid by name
const instanceRow = n => DUNGEONS.concat(RAIDS).find(d => d.name === n);
// a raid is open when the previous tier is cleared, your gear is ready and you are not saved to it
// raid lockouts: { at (when it started), killed (bosses down this lockout, in order), last (the last raid night) }.
// A raid takes several nights: the next one carries on from the first boss still standing, until the reset
const RAID_TRIES = 3;                       // wipes before the raid calls it a night
const raidLock = n => { const l = S.lock[n]; return l && S.time - l.at < RAID_INFO[n].lock * DAY ? l : null; };
const raidKilled = n => (raidLock(n) || { killed: 0 }).killed;
const raidLocked = n => raidKilled(n) >= instanceRow(n).bosses.length;   // fully cleared this lockout
const raidRested = n => !S.lock[n] || !S.lock[n].last || S.time - S.lock[n].last >= DAY; // one raid night a day
// full clears of a raid so far (each lockout can clear it once)
const raidClears = n => (S.dstat[n] && S.dstat[n].runs) || 0;
const raidOpen = r => { const i = RAID_INFO[r.name]; return gearScore() >= i.gs && (!i.need || raidClears(i.need) >= (i.needClears || 1)) && attuned(r.name) && aqOpen(r.name) && !raidLocked(r.name) && raidRested(r.name); };
function pickDungeon() {
  const ok = d => d.side === "B" || d.side === S.faction[0];
  if (S.level >= 60) {
    const open = RAIDS.filter(raidOpen);
    if (open.length && Math.random() < 0.7) return goalRaid(open) || (Math.random() < 0.7 ? open[open.length - 1] : pick(open));
    return wpPick() || pvpPick() || goalDungeon() || attDungeon() || pick(DUNGEONS.filter(d => d.min >= 52 && ok(d)));
  }
  return DUNGEONS.find(d => ok(d) && !S.dungeons.includes(d.name) && S.level >= d.min && S.level <= d.min + 6);
}
const regroupTask = raid => ({ k: "regroup", d: pick(["Waiting for the healer to drink", "Drinking up before the next pull", "Regrouping and drinking", "Looting and drinking up"]), t: sec(raid ? 12 : 8) });
function queueDungeon(d) {
  const q = S.queue, raid = RAIDS.includes(d), { name: dn, abbr, bosses, trash } = d;
  const chat = pick([`LFM ${abbr}, need heals`, `LF1M ${abbr}, have summon`, `LFG ${abbr}, ${S.cls.toLowerCase()} lvl ${S.level}`, `LF tank for ${abbr} then GO`, `${abbr} run, LF2M, PST`]);
  const start = raid ? raidKilled(dn) : 0; // bosses already down this lockout
  S.dg = { name: dn, killed: start, total: bosses.length, raid, rep0: S.repair, wipes: 0 };
  S.party = makeParty(raid);
  S.meter = { dn, dmg: [], heal: [], secs: 0, last: null };
  const dq = S.dungeons.includes(dn) ? [] : (DQUESTS[dn] || []).map(x => { const [name, boss, obj, side] = x.split("|"); return { name, boss, obj, side }; }).filter(x => !x.side || x.side === S.faction[0]);
  if (dq.length) q.push({ k: "dqpick", d: `Picking up quests for ${dn}`, t: sec(6 + 3 * dq.length), dn, dq: dq.map(x => ({ name: x.name, boss: x.boss, obj: x.obj, raid, done: false })) });
  q.push({ k: "lfg", d: raid ? `Waiting on the raid invite for ${dn}` : `Looking for group: "${chat}"`, t: sec(raid ? 120 : 60 + R(120)), chat: raid ? `[${S.guild ? "Guild" : "Raid"}] ${abbr} invites going out, ${RAID_INFO[dn].size} man, be on time!` : chat, dn });
  q.push({ k: "dtravel", d: `Traveling to ${dn} with the group`, t: sec(raid ? 180 : 120), dn });
  const petBoss = petDungeon(q, raid, bosses);
  q.push({ k: "dbuff", d: raid ? "Buffing up and drinking a flask at the instance portal" : "Buffing up at the instance entrance", t: sec(8), raid });
  bosses.forEach((b, bi) => {
    if (bi < start) return;
    const n = raid ? 2 + R(2) : 1 + R(3);
    for (let i = 0; i < n; i++) {
      const main = pick(trash), mobs = Array.from({ length: raid ? 3 + R(3) : 2 + R(3) }, (_, j) => j && Math.random() < 0.3 ? pick(trash) : main);
      const share = groupAoe(mobs.length), p = packTrim(heroGroupCasts(raid ? 70 : 40, false, mobs.length), mobs.length, share, sec(raid ? 70 : 40));
      q.push({ k: "trash", d: `Clearing a pack of ${plural(main)}`, t: p.t, mobs, casts: p.casts, aoeShare: share });
    }
    const adds = BOSS_ADDS[b] || [], late = (BOSS_SCRIPT[b] || []).some(p => p.adds), pb = petBoss(b);
    q.push({ k: "boss", d: adds.length && !late ? `Fighting ${b} and ${adds.length === 1 ? "an add" : adds.length + " adds"}` : `Fighting ${b}`, t: sec(raid ? 260 : 110), boss: b, dn, adds, casts: heroGroupCasts(raid ? 260 : 110, true), ...(pb || {}) });
    q.push(regroupTask(raid));
  });
  q.push({ k: "dend", d: `Leaving ${dn}`, t: sec(10), dn });
  if (dq.length) q.push({ k: "dqturn", d: `Turning in the ${dn} quests`, t: sec(8 + 4 * dq.length), dn });
}
