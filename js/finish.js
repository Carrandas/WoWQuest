// Finishing tasks: what each finished task does to the hero, plus the clock (advance, catchUp).
"use strict";

// ---------- loot ----------
const GREYS = ["Broken Fang", "Ruined Pelt", "Torn Wing", "Cracked Bone", "Chipped Claw", "Tattered Cloth", "Bent Spoon", "Rusty Gear", "Slimy Scale", "Shiny Pebble", "Moldy Cheese", "Severed Ear"];
const PLAYERS = ["Leeroyz", "Tankenstein", "Healbot", "Shadowmeldz", "Gnomercy", "Moonfiyah", "Stabbyjoe", "Frostiez", "Bubblehearth", "Lokdar", "Totemz", "Arrowyn"];
// junk sold on the way is added up and logged once
function flushTrip() { if (S.trip > 0) { log(`Sold junk for ${moneyTxt(S.trip)}.`, "gold"); S.trip = 0; } }
function findQuest(id) { return S.quests.find(x => x.id === id); }
// the last ten quests finished
function noteDone(name) { S.done.unshift(name); if (S.done.length > 10) S.done.length = 10; }
// a quest reward slot: the weakest of three random picks
function randomSlot() { let best = null; for (let i = 0; i < 3; i++) { const s = pick(SLOTS); if (!best || power(S.equip[s]) < power(S.equip[best])) best = s; } return best; }

function lootDrop(dn, boss) {
  const d = instanceRow(dn); if (!d) return;
  const raid = RAIDS.includes(d), caster = isCaster();
  const fits = d.loot.filter(x => !x.tag || (x.tag === "c") === caster);
  // named items ("Smite's Mighty Hammer") only drop from the boss they are named after
  const keys = b => b.replace(/'s?\b/g, "").split(/[ ,.]+/).filter(w => w.length > 3 && !/^(the|Lord|Lady|Baron|Captain|High|King|Prince|Commander|General|Master|Emperor|Doctor|Instructor|Chief|Witch|Overlord|Houndmaster|Interrogator|Inquisitor)$/.test(w));
  const owner = x => d.bosses.find(b => keys(b).some(w => x.name.replace(/'s?\b/g, "").includes(w)));
  const mine = fits.filter(x => owner(x) === boss), free = fits.filter(x => !owner(x));
  const pool = mine.length && Math.random() < 0.7 ? mine : free.length ? free : mine;
  const ri = RAID_INFO[dn], r = Math.random();
  const dropIlvl = () => ri ? ri.ilvl[0] + R(ri.ilvl[1] - ri.ilvl[0] + 1) : Math.round((d.min + d.max) / 2) + 3;
  let it;
  if (ri && ri.set != null && r < 0.55) {
    const pin = boss === "Onyxia" ? "Head" : boss === "Ragnaros" ? "Legs" : null, tier = pin ? 2 : ri.set;
    it = setPiece(tier, SET_ILVL[tier], pin);
  } else if (!raid && d.min >= 52 && S.level >= 58 && r < 0.3) it = setPiece(0, SET_ILVL[0]);
  // a generic piece for the weakest slot, so every slot can reach blue (dungeons) or purple (raids)
  else if (r > 0.8) it = makeItem(weakestSlot(), dropIlvl(), ri ? 4 : 3);
  else if (pool.length) {
    let name = pick(pool).name;
    const alt = pool.filter(x => !LEGENDARY[x.name]);
    if (LEGENDARY[name] && alt.length && Math.random() < 0.5) name = pick(alt).name;
    if (LEGENDARY[name]) return legendaryPart(name, boss);
    const q = ri && ri.size === 20 ? (Math.random() < 0.5 ? 3 : 4) : ri ? 4 : 3;
    it = { name, slot: namedSlot(name), ilvl: dropIlvl(), q };
  }
  if (!it) return;
  const bid = heroBid(); // guild raids: bought with DKP
  log(bid != null ? `${boss} dropped ${it.name}. You win it for ${bid} DKP.` : `${boss} dropped ${it.name}. Rolled Need: ${60 + R(41)}.`, "loot" + it.q);
  const de = dungeonEntry(dn); if (!de.loot.some(x => x.n === it.name)) de.loot.unshift({ n: it.name, q: it.q }); if (de.loot.length > 6) de.loot.length = 6;
  gain(it, "Won");
}

// legendary pieces: two Bindings make Thunderfury, the Eye of Sulfuras becomes Sulfuras
function legendaryPart(part, boss) {
  const L = LEGENDARY[part];
  log(`${boss} dropped ${part}! The raid hands it to you.`, "loot5");
  S.parts[part] = (S.parts[part] || 0) + 1;
  if (S.parts[part] < L.parts) { log(`That's ${S.parts[part]} of ${L.parts}. One more and something legendary can be made.`, "loot4"); return; }
  if (S.legendaries.includes(L.name)) return;
  S.parts[part] = 0; S.legendaries.push(L.name);
  gain({ name: L.name, slot: "Main Hand", ilvl: 80, q: 5 }, "LEGENDARY! Forged");
}
// casters may find Atiesh in Naxxramas
const ATIESH = "Atiesh, Greatstaff of the Guardian";
function atiesh() {
  if (!isCaster() || S.legendaries.includes(ATIESH)) return;
  S.parts.splinter = (S.parts.splinter || 0) + 2 + R(4);
  if (S.parts.splinter < 40) { log(`Collected Splinters of Atiesh: ${S.parts.splinter} of 40.`, "loot4"); return; }
  S.legendaries.push(ATIESH);
  gain({ name: ATIESH, slot: "Main Hand", ilvl: 90, q: 5 }, "LEGENDARY! Assembled");
}

// ---------- finishing tasks ----------
// what each kind of task does when it's done: every task kind (t.k) that plan() queues needs an entry
const FINISH = {
  arrive(t) {
    S.arrived = t.zone; S.loc = "hub"; S.curQ = 0;
    const before = S.quests.length; S.quests = S.quests.filter(x => x.zone === t.zone);
    if (before > S.quests.length) log(`Abandoned ${before - S.quests.length} unfinished quest${before - S.quests.length > 1 ? "s" : ""} from the last zone.`);
    const z = ZONES[t.zone]; zoneEntry(t.zone);
    log(`Entered ${t.zone} (levels ${z.min}–${z.max}).`, "zone");
    petArrive(t.zone); minipetArrive(t.zone);
  },
  field() { flushTrip(); S.loc = "field"; },
  hub() { S.loc = "hub"; },
  kill(t) {
    S.since = (S.since || 0) + 1;
    if (t.wp) return wpEnd(t); // world PvP: a player, not a mob
    const sf = soloFight(t), who = n => t.elite ? n : article(n), by = t.killer ? `${who(t.killer.src)}'s ${t.killer.a}` : who(t.mob);
    if (sf.drank && S.cons.hp > 0) S.cons.hp--;
    petAfterFight(t, sf);
    if (sf.end <= 0) {
      S.deaths++; loseBuffs(); S.repair += S.level * S.level * 4 + 20; if (S.pet) S.pet.dead = true;
      log(`Killed by ${by}. Releasing spirit…`, "death"); S.hpF = 0;
      S.queue.unshift({ k: "ghost", d: "Running back to your corpse as a ghost", t: sec(45) }, { k: "rez", d: "Resurrecting and drinking up", t: sec(10) });
      return;
    }
    if (sf.drank) {
      if (!S.feats.includes("close call")) S.feats.push("close call");
      log(`Close call! Nearly died to ${who(t.mob)}, but ${article(hpPot())} saved the day.`, "death");
    }
    S.kills += (t.mobs || [1]).length; S.repair += Math.round(S.level * 0.6);
    gainXp(mobXp(t.mobL) * (t.elite ? 6 : 1));
    const q = findQuest(t.qid);
    if (q && !questDone(q) && (q.type !== "col" ? t.mob === q.mob : Math.random() < 0.65)) {
      q.prog++;
      if (questDone(q)) log(`Objective complete: ${questText(q)}.`, "quest");
    }
    if (t.elite) { log(`${t.mob} has been slain.`, "boss"); if (!S.elites.includes(t.mob)) S.elites.push(t.mob); }
    helpersAfter(t);
    if (S.arrived) { const ze = zoneEntry(S.arrived); ze.k++; ze.L1 = S.level; ze.t1 = realNow(); }
    const L = S.level, junk = () => Math.round((L * L * 0.35 + 3) * (0.5 + Math.random()) * (L >= 60 ? 0.35 : 1));
    if (S.prof) { profLoot(t); if (Math.random() < 0.4) addBag({ name: pick(GREYS), val: junk(), q: 0 }); }
    else if (Math.random() < 0.55) addBag({ name: Math.random() < 0.4 ? CLOTH[clamp(Math.floor(L / 12), 0, 4)] : pick(GREYS), val: junk(), q: 0 });
    S.queue.unshift(...gatherTasks(t));
    minipetDrops(t.mobs || [t.mob]);
    const r = Math.random();
    if (r < 0.003) gain(makeItem(pick(SLOTS), t.mobL + 2, 3), `The ${t.mob} dropped`);
    else if (r < 0.025 || t.elite) gain(makeItem(pick(SLOTS), t.mobL, 2), `The ${t.mob} dropped`);
  },
  sell(t) {
    let sum = 0; const de = isEnchanter();
    S.bags = S.bags.filter(b => {
      if (b.name !== t.name) return true;
      // enchanters disenchant their greens and blues instead of selling them
      if (de && b.q >= 2) { addMat("Dust", clamp(Math.floor((S.level - 5) / 11), 0, 4), b.q >= 3 ? 3 : 1 + R(2)); bump("de"); return false; }
      sum += b.val; return false;
    });
    S.money += sum; S.trip += sum;
  },
  turnin(t) {
    flushTrip();
    const q = findQuest(t.qid); if (!q) return;
    S.quests = S.quests.filter(x => x !== q);
    S.money += q.money; S.qdone++; S.cycleQ++;
    mountQuest(q);
    if (q.name === "Mankrik's Wife" && !S.feats.includes(q.name)) S.feats.push(q.name);
    if (S.zones.find(x => x.z === q.zone)) zoneEntry(q.zone).q++;
    noteDone(q.name);
    log(`Quest complete: "${q.name}". ${S.level < 60 ? "+" + q.xp.toLocaleString() + " XP, " : ""}${moneyTxt(q.money)}.`, "quest");
    gainXp(q.xp);
    if (Math.random() < 0.5) { const qq = S.level < 6 ? 1 : Math.random() < 0.05 ? 3 : 2; gain(makeItem(randomSlot(), S.level + 1, qq), "Quest reward:"); }
  },
  accept() { flushTrip(); const q = newQuest(); log(`Accepted "${q.name}".`, "quest"); },
  travel() { S.loc = "city"; log(`Arrived in ${city()}.`, "zone"); },
  train() {
    flushTrip(); trainSpells();
    const p = S.prof, cap = trainCap();
    if (p && cap > p.cap) {
      p.cap = cap; [p.a, p.b, ...SECONDARY].forEach(n => { if (!p.sk[n]) p.sk[n] = 1; });
      log(`Trained ${tierName(cap)} ${p.a} and ${p.b} (up to ${cap}), plus First Aid and Cooking.`, "spell");
    }
  },
  repair() { const c = Math.min(S.repair, S.money); spend("rep", c); S.repair = 0; if (c) log(`Repaired everything for ${moneyTxt(c)}.`, "gold"); },
  shop() {
    const L = S.level;
    socialCity(); // the guild: founded, recruiting
    minipetShop(); // a cheap vendor pet comes before the rest of the shopping
    buySupplies(spendable() * 0.5); // potions and the like come first: half of the spare gold may go to supplies
    const bag = BAGS.filter(b => b.lvl <= L).pop();
    // tailors sew their own bags
    if (bag && !(hasProf("Tailoring") && S.prof.cap) && S.money >= bag.price && bagUpgrade(bag)) { spend("gear", bag.price); giveBag(bag, S.bagSlots.length < 4 ? "Bought" : "Swapped a small bag for"); }
    for (let n = 0; n < 2; n++) {
      const slot = weakestSlot(), it = makeItem(slot, L - 1, 2), price = it.ilvl * it.ilvl * 8 + 100;
      if (power(it) > power(S.equip[slot]) && spendable() >= price) { spend("gear", price); gain(it, `Bought on the Auction House for ${moneyTxt(price)}:`); }
    }
    // at 60, now and then a bind-on-equip epic shows up: expensive, and only worth it as a real upgrade
    if (L >= 60 && Math.random() < 0.25) {
      const slot = weakestSlot(), it = makeItem(slot, 66 + R(6), 4), price = 3000000 + it.ilvl * 50000;
      if (power(it) > power(S.equip[slot]) * 1.05 && spendable() >= price * 1.5) { spend("gear", price); gain(it, `Bought a bind-on-equip epic on the Auction House for ${moneyTxt(price)}:`); }
    }
    if (!isEnchanter()) enchantGear(false);
  },
  mount() {
    if (S.level >= 60 && S.mount < 2) {
      if (S.money >= EPIC_MOUNT_COST) { S.money -= EPIC_MOUNT_COST; S.mount = 2; mountOwn(); log(`Paid 1000 gold for epic riding and a ${race().epic}! The grind was worth it.`, "loot4"); }
      else log(`Epic mount fund: ${moneyTxt(S.money)} of 1000g.`, "gold");
    } else if (S.mount < 1) {
      if (S.money >= MOUNT_COST) { S.money -= MOUNT_COST; S.mount = 1; mountOwn(); log(`Learned Apprentice Riding and bought a ${race().mount}! (90g)`, "loot3"); }
      else log(`Saving up for a mount: ${moneyTxt(S.money)} of 90g.`, "gold");
    }
  },
  // the next zone on the route (or a random endgame zone at 60), then maybe a dungeon or raid
  choose() {
    const r = route(), old = curZone();
    while (S.leg < r.length && S.level >= r[S.leg].until) S.leg++;
    if (S.level >= 60) { S.cycleQ = 0; const pool = ENDGAME_ZONES.filter(z => z !== S.endZone); S.endZone = goalZone() || pick(pool); }
    S.nextCity = S.level + 2;
    if (S.level >= 10 || curZone() !== old) S.arrived = null; else S.loc = "hub";
    const gf = S.level >= 60 ? goalFarm(pick(["Winterspring", "Eastern Plaguelands", "Silithus", "Burning Steppes"])) : null;
    if (gf && gf.cloth) S.queue.push({ k: "farm", d: gf.d, t: sec(240), cloth: true });
    else if (S.level >= 60 && (S.money < 500000 || gf)) {
      const g = ["Mining", "Herbalism", "Skinning"].find(hasProf), z = pick(["Winterspring", "Eastern Plaguelands", "Silithus", "Burning Steppes"]);
      const d = g === "Mining" ? `Farming Thorium in ${z}` : g === "Herbalism" ? `Farming Dreamfoil in ${z}` : g ? `Farming Rugged Leather in ${z}` : pick(["Running Stratholme for gold", `Farming Runecloth in ${z}`]);
      S.queue.push({ k: "farm", d, t: sec(240) });
    }
    if (S.level >= 60) aqWarQueue(S.queue) || attTrip(S.queue); // the Ten Hours War, or an attunement step that is a trip
    const d = pickDungeon(); if (d) (BGS.includes(d) ? queueBG : WP_RAIDS.includes(d) ? queueWP : queueDungeon)(d);
  },
  lfg(t) {
    log(`[${pick(PLAYERS)}]: ${t.chat}`, "chat");
    if (!S.party) return;
    if (S.dg) S.dg.formed = true;
    if (S.party.length > 4) {
      const all = [{ name: S.name, role: heroRole() }, ...S.party], tanks = all.filter(m => m.role === "tank").map(m => m.name);
      log(`Raid assembled: ${all.length} players, ${tanks.length} tanks and ${all.filter(m => m.role === "heal").length} healers. Main tank: ${tanks[0]}.`, "chat");
    } else log(`Group formed: ${S.party.map(m => `${m.name} (${m.cls.toLowerCase()} ${ROLE_NAME[m.role].toLowerCase()}${m.friend ? ", friend" : ""})`).join(", ")}.`, "chat");
  },
  dqpick(t) { S.dq = t.dq; log(`Picked up ${t.dq.length} quest${t.dq.length > 1 ? "s" : ""} for ${t.dn}: ${t.dq.map(x => `"${x.name}"`).join(", ")}.`, "quest"); },
  dqturn(t) {
    const raid = !!RAID_INFO[t.dn];
    (S.dq || []).filter(x => x.done).forEach(x => {
      const xp = S.level < 60 ? Math.round(mobXp(S.level + 2) * (14 + R(6))) : 0, coin = Math.round((S.level * S.level * 4 + 150) * (0.8 + Math.random() * 0.5) * (raid ? 4 : 1));
      S.money += coin; S.qdone++;
      noteDone(x.name);
      log(`Quest complete: "${x.name}". ${xp ? "+" + xp.toLocaleString() + " XP, " : ""}${moneyTxt(coin)}.`, "quest");
      if (xp) gainXp(xp);
      if (Math.random() < (raid ? 0.5 : 0.7)) gain(makeItem(randomSlot(), S.level + (raid ? 12 : 3), raid ? 4 : 3), "Quest reward:");
    });
    S.dq = null;
  },
  dtravel(t) { S.loc = "dungeon"; log(`Entering ${t.dn}.`, "dung"); },
  trash(t) { if (t.bg) { bgFightEnd(t); petAfterFight(t, null); friendChatter(); return; } if (!S.dg || !S.dg.raid) gainXp(mobXp(S.level + 1) * 2.4); petAfterFight(t, null); minipetDrops(t.mobs || []); friendChatter(); },
  boss(t) {
    if (t.foe) t.foe.units.forEach(u => (u.phases || []).forEach(p => { if (p.say) log(p.say, "boss"); }));
    const raid = !!(S.dg && S.dg.raid);
    if (bossWipes(t)) {
      S.deaths++; S.repair += S.level * S.level * (raid ? 25 : 5); loseBuffs(); if (S.pet) S.pet.dead = true;
      log(`Wiped on ${t.boss}. Corpse run…`, "death"); S.hpF = 0; (S.party || []).forEach(m => m.hp = 0);
      partySwap(t); if (raid) guildWipe(t.boss);
      const ghost = { k: "ghost", d: "Running back through the instance as a ghost", t: sec(60) };
      // three wipes in a raid and it's over for tonight: on to the exit
      if (raid && S.dg && ++S.dg.wipes >= RAID_TRIES) {
        log(`${S.dg.wipes} wipes on ${t.boss}. The raid calls it a night.`, "death");
        const end = S.queue.findIndex(x => x.k === "dend");
        if (end > 0) S.queue.splice(0, end);
        S.queue.unshift(ghost);
        return;
      }
      const again = { ...t, el: 0 }; delete again.ve; delete again.foe; delete again.wipe;
      S.queue.unshift(ghost, regroupTask(raid), again);
      return;
    }
    if (S.dg) { S.dg.killed++; if (raid) S.repair += S.level * S.level * 2; }
    if (raid) {
      const first = !(S.bossKills[t.boss] > 0), l = raidLock(t.dn) || (S.lock[t.dn] = { at: S.time, killed: 0, last: 0 });
      l.killed = S.dg.killed; S.bossKills[t.boss] = (S.bossKills[t.boss] || 0) + 1;
      if (first) { log(`First kill: ${t.boss}!`, "ach"); serverFirst(t.boss); }
      if (S.guild) S.guild.wipes = 0;
      guildLoot(t.dn, t.boss);
    }
    log(`${t.boss} has been defeated.`, "boss");
    if (raid) resLine(t.boss); // resistance gear for the bosses that check it
    (S.dq || []).filter(x => !x.done && x.boss === t.boss).forEach(x => { x.done = true; log(`Objective complete: ${x.obj} ("${x.name}").`, "quest"); });
    gainXp(mobXp(S.level + 2) * 5); petAfterFight(t, null); minipetDrops([t.boss]); mountDrops(t.boss, t.dn);
    // a boss drops a few items for the whole group: in a raid the hero only now and then gets one
    if (Math.random() < (raid ? RAID_INFO[t.dn].size === 20 ? 0.2 : 0.12 : 0.4)) lootDrop(t.dn, t.boss);
    if (t.dn === "Naxxramas" && Math.random() < 0.1) atiesh();
  },
  buff(t) { applyBuff(t.b); },
  gather(t) { finishGather(t); },
  craft() { mountTurnins(); finishCraft(); minipetCrafts(); }, // Runecloth turn-ins before the spare cloth is sold
  farm(t) {
    const c = Math.round(t.t / HOUR * (t.cloth ? 20000 : 150000)), g = ["Mining", "Herbalism", "Skinning"].find(hasProf); // Runecloth runs (a reputation goal) are for the cloth
    S.money += c;
    if (t.cloth && S.prof) { addMat("Cloth", 4, 20 + R(15)); log(`Farmed Runecloth: ${moneyTxt(c)} and a stack of Runecloth for the turn-ins.`, "gold"); return; }
    if (g) { const n = 6 + R(8); addMat(g, 4, n); bump(g, n); bump("top:" + g, n); }
    log(`${t.d.replace(/^\w+ing/, m => m === "Running" ? "Ran" : "Farmed")}: ${moneyTxt(c)}${g ? ` and some ${MATS[g][4]}` : ""}.`, "gold");
  },
  conjure(t) { S.cons[t.kind] = Math.max(S.cons[t.kind] || 0, 20); },
  ration(t) {
    const n = Math.max(0, 20 - (S.cons[t.kind] || 0)), p = rationPrice(), can = Math.min(n, Math.floor(S.money / p));
    if (can > 0) { S.cons[t.kind] = (S.cons[t.kind] || 0) + can; spend("sup", can * p); }
  },
  elixir() { drinkElixir(false); },
  dbuff(t) {
    const got = []; wantedBuffs().forEach(b => { if (!b.item || S.cons[b.item] > 0) { applyBuff(b); got.push(b.name); } });
    if (t.raid) guildFlask();
    const ex = drinkElixir(t.raid); if (ex) got.push(ex);
    if (got.length) log(`Buffed up: ${got.join(", ")}.`, "spell");
  },
  dend(t) {
    // a raid only counts as cleared once the last boss is down (that can take several nights)
    const ri = RAID_INFO[t.dn], full = !ri || !S.dg || S.dg.killed >= S.dg.total;
    if (ri) (S.lock[t.dn] = raidLock(t.dn) || { at: S.time, killed: 0, last: 0 }).last = S.time;
    if (full) { const de = dungeonEntry(t.dn); de.runs++; if (!de.at) { de.at = realNow(); de.L = S.level; de.p = S.time; } }
    if (full && !S.dungeons.includes(t.dn)) S.dungeons.push(t.dn);
    // level 60 dungeon clears: the attunement steps that need them
    if (full && !ri && S.level >= 60) { S.runs60++; attRun(t.dn); }
    if (ri && S.dg && S.dg.killed > 0) attRun(t.dn); // raid nights with a kill: resistance steps that want the raid's drops
    S.runs++;
    log(full ? `${t.dn} cleared!` : `Leaving ${t.dn} with ${S.dg.killed} of ${S.dg.total} bosses down. Same time tomorrow.`, "dung");
    const bill = S.dg && S.dg.raid ? S.repair - (S.dg.rep0 || 0) : 0;
    if (bill > 0) log(`Repair bill after ${t.dn}: ${moneyTxt(bill)}.`, "gold");
    socialDungeonEnd();
    S.dg = null; S.party = null; S.loc = "city";
  },
  // nothing to do when these end: the hero just moves on (health and mana are set in finish)
  move() {}, rest() {}, ghost() {}, rez() {}, regroup() {},
  ...PET_FINISH, // tame, summon, petrez, petheal, feed, ritual
  ...PVP_FINISH, // bgq, bgin, bgobj, bgrez, bgend
  ...WP_FINISH, // wpsee, wpgo, wpend, wpcity
  ...ATT_FINISH, // att, aqhand, aqwar
};
function finish(t) {
  const ve = vitalEnd(t); S.hpF = ve[0]; S.mpF = ve[1]; partyFinish(t);
  if (FINISH[t.k]) FINISH[t.k](t);
  petTick(t);
  pvpWeek();
  attTick();
  goalCheck();
  checkAch();
  dirty = true;
}

// ---------- the clock ----------
function advance(dt) {
  S.time += dt;
  let guard = 0;
  while (dt > 0 && guard++ < 400) {
    if (!S.task) { if (!S.queue.length) plan(); S.task = S.queue.shift() || { k: "rest", d: "Taking a breather", t: 3000 }; S.task.el = 0; useCooldowns(S.task); dirty = true; }
    const rem = S.task.t - S.task.el;
    if (dt >= rem) { dt -= rem; const t = S.task; S.task = null; finish(t); }
    else { S.task.el += dt; dt = 0; }
  }
}
// progress made while the tab was closed (at 1x, capped at 12 hours)
function catchUp(ms) {
  ms = Math.min(ms, 12 * HOUR);
  if (ms < 60000) return;
  const L0 = S.level, q0 = S.qdone;
  simClock = Date.now() - ms;
  for (let left = ms; left > 0; left -= 30000) { advance(Math.min(30000, left)); simClock += Math.min(30000, left); }
  simClock = null;
  log(`While you were away (${fmtTime(ms)}): ${S.level > L0 ? `gained ${S.level - L0} level${S.level - L0 > 1 ? "s" : ""}, ` : ""}finished ${S.qdone - q0} quests.`, "lvl");
}
