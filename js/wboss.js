// World raid bosses: Azuregos in Azshara, Lord Kazzak in the Blasted Lands and the Emerald Dragons (Ysondre, Lethon,
// Emeriss, Taerar) at the Great Trees. Each comes up now and then (S.wb.up), someone calls it out, and at 60 the
// guild (or a pug raid) drops everything on a free evening: a race against the rival guild for the tag, often the
// other faction showing up to fight over it, then the fight itself. No lockout and no attunement, as in classic: once
// someone kills it, it's gone for a few days. Plus the moments after big kills: the heads of Onyxia and Nefarian on
// the city gates (Rallying Cry of the Dragonslayer), the Warchief's Blessing, the Spirit of Zandalar.
"use strict";

// the bosses: key, the boss (also its instance row in data.js), where it shows up, the days until it's back
const WB = [
  { key: "az", names: ["Azuregos"], spots: [["Azshara", "the ruins of Eldarath"]], back: [4, 8] },
  { key: "kz", names: ["Lord Kazzak"], spots: [["Blasted Lands", "the Tainted Scar"]], back: [4, 8] },
  { key: "dr", names: ["Ysondre", "Lethon", "Emeriss", "Taerar"], spots: [["Duskwood", "Twilight Grove"], ["Ashenvale", "Bough Shadow"], ["Feralas", "Dream Bough"], ["The Hinterlands", "Seradane"]], back: [5, 10] },
  // summoned, not spawned: Highlord Demitrian calls him down for the hero's Thunderfury (legend.js), and he waits
  { key: "th", names: ["Prince Thunderaan"], spots: [["Silithus", "Highlord Demitrian's camp"]], back: [0, 0], summon: () => thunderaanCalled() },
];
const WB_DRAGONS = WB[2].names;
const WB_TOWN = { Duskwood: "Darkshire", Ashenvale: "Astranaar", Feralas: "Feathermoon Stronghold", "The Hinterlands": "Aerie Peak" };
const WB_MIN = 30;  // world bosses start coming up (the flavour while levelling) from here
const newWb = () => ({ up: {}, next: {}, kills: {}, tagLost: 0, pvpWon: 0, pvpLost: 0, seen: 0, head: null, heads: {} });
const wbRow = n => WB_ROWS.find(r => r.name === n) || null;
const wbOf = n => WB.find(w => w.names.includes(n));
const wbKills = () => Object.values(S.wb.kills).reduce((a, b) => a + b, 0);

// ---------- coming up and going away ----------
// after every task: a boss comes up when its timer runs out, and goes away when someone else gets it
function wbTick() {
  if (S.level < WB_MIN) return;
  const w = S.wb;
  WB.forEach(b => {
    const up = w.up[b.key];
    if (b.summon) {
      if (!up && S.level >= 60 && b.summon()) {
        w.up[b.key] = { who: b.names[0], zone: b.spots[0][0], spot: b.spots[0][1], at: S.time, until: S.time + 5 * DAY };
        log(`Highlord Demitrian takes the Enchanted Elementium Bars, and the sky over Silithus splits: Prince Thunderaan, the Windseeker, is free. "Who dares summon me?" ${S.guild ? `[Guild] Thunderaan is up for ${S.name}'s Thunderfury! Everyone to Silithus.` : "A raid has to be found."}`, "ach");
      } else if (up && S.time >= up.until) delete w.up[b.key];
      return;
    }
    if (!up) {
      if (w.next[b.key] == null) { w.next[b.key] = S.time + (1 + Math.random() * b.back[1]) * DAY; return; }
      if (S.time < w.next[b.key]) return;
      const [zone, spot] = pick(b.spots), who = pick(b.names);
      w.up[b.key] = { who, zone, spot, at: S.time, until: S.time + (3 + Math.random() * 9) * HOUR };
      wbSpawnLine(w.up[b.key]);
    } else if (S.time >= up.until) wbGone(b, up, null);
  });
}
// gone: killed by the hero's raid, or by someone else
function wbGone(b, up, by) {
  const w = S.wb; delete w.up[b.key];
  if (b.summon) return;
  w.next[b.key] = S.time + (b.back[0] + Math.random() * (b.back[1] - b.back[0])) * DAY;
  if (by || S.level < 60 || Math.random() < 0.5) return;
  const rival = S.guild && Math.random() < 0.5 ? `<${S.guild.rival.name}>` : pick([`A ${foeSide()} raid`, `Some ${S.faction} guild`, "A pug raid"]);
  log(`[General] ${rival} killed ${up.who} in ${up.zone}.`, "chat");
}
function wbSpawnLine(up) {
  const z = curZone(), dragon = WB_DRAGONS.includes(up.who);
  if (S.level >= 60) { S.wb.seen++; log(S.guild ? `[Guild] ${up.who} is up in ${up.zone}! ${pick(["Who's online?", "Mount up!", "Drop what you're doing.", "Summons at the stone."])}` : `[General] ${up.who} is up in ${up.zone}, at ${up.spot}!`, "chat"); return; }
  if (z !== up.zone) return;
  // while levelling: the boss next door
  if (dragon && WB_TOWN[z] && Math.random() < 0.5) {
    S.queue.unshift({ k: "wbsee", d: `Asleep in ${WB_TOWN[z]}`, t: sec(10), line: `Somebody pulled ${up.who} out of ${up.spot} and into ${WB_TOWN[z]}. Noxious Breath puts the whole town to sleep, you included. You wake up to corpses everywhere.` });
    return;
  }
  log(up.who === "Azuregos" ? "Azuregos flies over Azshara with a level 60 raid running after it." : up.who === "Lord Kazzak" ? "Lord Kazzak stomps out of the Tainted Scar. You give him a very wide berth."
    : `Green mist pours out of ${up.spot}: ${up.who} has come out of the Emerald Dream. You keep your distance.`, "spell");
}

// ---------- at 60: going for it ----------
// on a free evening: a boss that's up and a raid that can take it (gear for it; a guild goes more often than a pug)
function wbPick() {
  if (S.level < 60) return null;
  const ups = Object.values(S.wb.up).filter(u => { const ri = RAID_INFO[u.who]; return ri && gearScore() >= ri.gs; });
  if (!ups.length) return null;
  const want = ups.find(u => attWantsBoss(u.who)); if (want) return wbRow(want.who); // a quest step waits for it
  if (Math.random() >= (S.guild ? 0.6 : 0.3)) return null;
  const u = pick(ups); return wbRow(u.who);
}
function queueWB(row) {
  const q = S.queue, up = Object.values(S.wb.up).find(u => u.who === row.name), us = S.faction, them = foeSide(), g = S.guild;
  S.dg = { name: row.name, killed: 0, total: 1, raid: true, rep0: S.repair, wipes: 0, wb: true, zone: up.zone };
  S.party = makeParty(true);
  S.meter = { dn: row.name, dmg: [], heal: [], secs: 0, last: null };
  q.push({ k: "wbgo", d: g ? `Waiting for <${g.name}> to gather for ${row.name}` : `Joining a pug raid: "LFM ${row.name}, ${up.zone}, need everyone"`, t: sec(90 + R(60)), dn: row.name });
  q.push({ k: "wbobj", d: `Flying to ${up.zone}`, t: sec(150), lines: [`The raid gets to ${up.spot} in ${up.zone}.`] });
  // the race for the tag: the rival guild (or whoever is closer) may get there first (not for a boss summoned for the hero)
  if (!wbOf(row.name).summon && Math.random() < (g ? 0.25 : 0.4)) {
    const who = g ? `<${g.rival.name}>` : `A ${pick([us, them])} guild`;
    q.push({ k: "wbobj", d: `Watching ${who.replace(/[<>]/g, "")} fight ${row.name}`, t: sec(60), lose: "tag", lines: [`${who} got there first and tagged ${row.name}. Nothing to do but watch them kill it. ${pick(["/spit", "Next time.", "Somebody in raid chat swears a lot.", "The raid leader blames the summoners."])}`] });
  } else {
    // the other faction shows up for it: a fight over the boss first
    if (Math.random() < 0.35) {
      const st = { us, them, E: null, win: Math.random() < clamp(0.6 + (g ? 0.1 : 0) + (sideGear() - 1.3) * 0.5, 0.2, 0.9) };
      st.E = bgEnemies({ size: 15, heal: 3 }, false, sideGear());
      q.push({ k: "wbobj", d: `${them} players coming over the hill`, t: sec(12), lines: [`A ${them} raid shows up for ${row.name} too. Nobody pulls: first, the fight over who gets it.`] });
      for (let i = 0, n = 1 + R(2); i < n; i++) q.push({ ...bgFight({ d: `Fighting the ${them} raid at ${up.spot}` }, st), wb: true });
      if (!st.win) {
        q.push({ k: "wbobj", d: `Running back from the graveyard`, t: sec(40), lose: "pvp", lines: [`The ${them} raid wins the fight and tags ${row.name} while your raid runs back from the graveyard.`] });
        q.push({ k: "dend", d: `Flying home from ${up.zone}`, t: sec(14, 1), dn: row.name });
        return;
      }
      q.push({ k: "wbobj", d: `The ${them} raid falls back`, t: sec(10), win: "pvp", lines: [`The ${them} raid breaks and runs. ${row.name} is yours.`] });
    }
    q.push({ k: "dbuff", d: "Buffing up and drinking a flask before the pull", t: sec(8), raid: true });
    const adds = BOSS_ADDS[row.name] || [];
    q.push({ k: "boss", d: `Fighting ${row.name}`, t: sec(240), boss: row.name, dn: row.name, adds, casts: heroGroupCasts(240, true) });
    q.push(regroupTask(true));
  }
  q.push({ k: "dend", d: `Flying home from ${up.zone}`, t: sec(14, 1), dn: row.name });
}
// a fight with the other faction over a boss: honor for the players killed, wear on the gear, the graveyard on a death
function wbPvpEnd(t) {
  const players = t.foes.filter(f => f.cls).length, p = S.pvp;
  p.hk += players; p.honor += players * HK_HONOR; p.total += players * HK_HONOR;
  if (t.pot) log(`Drank ${article(t.pot)} in the middle of the fight.`, "gold");
  S.repair += Math.round(S.level * S.level * (t.die ? PVP_DEATH_WEAR : PVP_WEAR));
  if (t.die) { p.deaths++; log(`Killed by ${pick(t.foes).name}. Running back from the graveyard.`, "death"); S.queue.unshift({ k: "ghost", d: "Running back from the graveyard as a ghost", t: sec(30) }); }
  else log(`${players} ${foeSide()} player${players > 1 ? "s" : ""} down. +${players * HK_HONOR} honor.`, "boss");
}
// the end of the evening (dend for a world boss): it's gone either way
function wbEnd(t) {
  const d = S.dg, b = wbOf(t.dn), up = b && S.wb.up[b.key], w = S.wb;
  if (d && d.killed > 0) {
    w.kills[t.dn] = (w.kills[t.dn] || 0) + 1;
    log(w.kills[t.dn] === 1 ? `${t.dn} is dead! ${t.dn === "Lord Kazzak" ? "The Blasted Lands are quiet for once." : t.dn === "Azuregos" ? "The blue dragon's hoard is ours." : t.dn === "Prince Thunderaan" ? "The Windseeker is beaten, and the Dormant Wind Kissed Blade lies in the sand." : "The Emerald Dream loses one of its guardians, for a while."} ${S.guild ? `<${S.guild.name}> poses for a screenshot on the corpse.` : ""}` : `${t.dn} down again.`, "ach");
  } else if (d && d.lose === "tag") w.tagLost++;
  else if (d && d.lose === "pvp") w.pvpLost++;
  if (up) wbGone(b, up, "us");
  const bill = d ? S.repair - (d.rep0 || 0) : 0;
  if (bill > 0) log(`Repair bill after ${t.dn}: ${moneyTxt(bill)}.`, "gold");
  socialDungeonEnd();
  S.dg = null; S.party = null; S.loc = "city";
}

// ---------- the moments after big kills ----------
// a head to turn in on the next city visit (the first time, the hero hands it in and gets the quest reward)
const WB_HEADS = {
  Onyxia: { item: "Head of Onyxia", buff: "Rallying Cry of the Dragonslayer", reward: [["Dragonslayer's Signet", "Finger"], ["Onyxia Tooth Pendant", "Neck"], ["Onyxia Blood Talisman", "Trinket"]], ilvl: 74 },
  Nefarian: { item: "Head of Nefarian", buff: "Rallying Cry of the Dragonslayer", reward: [["Master Dragonslayer's Ring", "Finger"], ["Master Dragonslayer's Medallion", "Neck"], ["Master Dragonslayer's Orb", "Off Hand"]], ilvl: 83 },
  Hakkar: { item: "Heart of Hakkar", buff: "Spirit of Zandalar" },
};
// a boss down (from the boss finish): remember the head
function wbBossKill(boss) { if (WB_HEADS[boss] && S.level >= 60) S.wb.head = boss; }
// on a city visit: the head turned in, or someone else's (any level: a level 30 in town gets the buff too)
function wbCity(q, where) {
  const w = S.wb, h = w.head, horde = S.faction === "Horde";
  if (h) { q.push({ k: "wbhead", d: h === "Hakkar" ? "Taking the Heart of Hakkar to Yojamba Isle" : `Turning in the ${WB_HEADS[h].item} in ${where}`, t: sec(8), boss: h }); w.head = null; return; }
  if (S.level >= 20 && Math.random() < 0.025) {
    const b = pick(horde ? ["Onyxia", "Nefarian", "Rend"] : ["Onyxia", "Nefarian"]);
    q.push({ k: "wbhead", d: b === "Rend" ? "Standing in the crowd in front of Thrall" : `Watching the ${WB_HEADS[b].item} go up on the gates`, t: sec(6), boss: b, other: true });
  }
}
const WB_HEAD_LINE = {
  Onyxia: () => S.faction === "Horde" ? `Overlord Runthak: "People of the Horde, citizens of Orgrimmar, come, gather round and celebrate a hero of the Horde! The dread lady Onyxia has been slain!"` : `Major Mattingly: "Citizens and allies of Stormwind, on this day, history has been made. The dread lady, Onyxia, hangs from the arches!"`,
  Nefarian: () => S.faction === "Horde" ? `High Overlord Saurfang: "NEFARIAN IS SLAIN! People of Orgrimmar, bow down before the might of the Horde!"` : `Field Marshal Afrasiabi: "Citizens of the Alliance, the Lord of Blackrock is slain! Nefarian has been subdued by the combined might of the Alliance!"`,
  Rend: () => `Thrall: "Be bathed in my power! Drink in my might! Battle for the glory of the Horde!"`,
  Hakkar: () => `Molthor: "Begin the ritual, my servants. We must banish the heart of Hakkar back into the void!"`,
};
function wbHead(t) {
  const b = t.boss, h = WB_HEADS[b], w = S.wb, buff = b === "Rend" ? "Warchief's Blessing" : h.buff;
  log(WB_HEAD_LINE[b](), "boss");
  if (!t.other && h && h.reward && !w.heads[b]) {
    w.heads[b] = 1;
    const [name, slot] = isCaster() ? h.reward[0] : heroRole() === "heal" ? h.reward[2] : h.reward[1];
    gain({ name, slot, ilvl: h.ilvl, q: 4 }, "Quest reward:");
  }
  S.buffs[buff] = S.time + 120 * MIN;
  log(`${buff}: everyone ${b === "Hakkar" ? "on the island" : "in town"} is buffed${t.other ? ", you too" : ""}.`, "spell");
}
// the Warchief's Blessing for the Horde hero who brings Rend's head (the "For The Horde!" quest)
function wbRend() { if (S.faction === "Horde") wbHead({ boss: "Rend" }); }

const WB_FINISH = {
  wbsee(t) { log(t.line, "spell"); },
  wbgo(t) { S.loc = "dungeon"; if (S.dg) S.dg.formed = true; log(S.guild ? `[Guild] Everyone to ${S.dg.zone}! ${t.dn} won't wait.` : `[Raid] ${t.dn} raid forming, everyone to ${S.dg.zone}.`, "chat"); },
  wbobj(t) {
    (t.lines || []).forEach(l => log(l, "dung"));
    if (S.dg && t.lose) S.dg.lose = t.lose;
    if (t.win === "pvp") S.wb.pvpWon++;
  },
  wbhead(t) { wbHead(t); },
};

// the Quests tab at 60: which world bosses are up right now, and the kills so far
function wbRender() {
  if (S.level < 60) return "";
  const w = S.wb, rows = Object.values(w.up).map(u => { const ri = RAID_INFO[u.who], ok = ri && gearScore() >= ri.gs;
    return `<li class="goal"><div class="gl"><b>${esc(u.who)} is up <span class="ilvl">(${esc(u.zone)})</span></b><small>${ok ? `At ${esc(u.spot)}. The raid goes on the next free evening, if nobody beats it there.` : `At ${esc(u.spot)}. Needs gear score ${ri.gs} (yours: ${Math.round(gearScore())})`}</small></div></li>`; });
  const n = wbKills();
  if (n || w.tagLost || w.pvpWon) rows.push(`<li class="goal"><div class="gl"><b>${n} world boss${n === 1 ? "" : "es"} killed</b><small>${Object.keys(w.kills).map(k => `${esc(k)} ×${w.kills[k]}`).join(", ") || "none yet"}${w.tagLost ? ` · ${w.tagLost} lost to another guild's tag` : ""}${w.pvpWon + w.pvpLost ? ` · fights with the ${foeSide()} over one: ${w.pvpWon} won, ${w.pvpLost} lost` : ""}</small></div></li>`);
  return rows.length ? `<li class="qhead">World bosses</li>` + rows.join("") : "";
}
