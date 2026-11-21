// World PvP, the 2005 way: ganks and fair fights in the contested zones while levelling (a player of the other faction
// with a class and a level, a corpse run, now and then a camper), raids on the other faction's towns and capital at 60
// (played out like a battleground: guards, defenders, the town's leader), Lord Kazzak dragged into Stormwind, and
// Hakkar's Corrupted Blood loose in a capital. Flavour and fun: no gear, no honor while levelling.
"use strict";

// ---------- while levelling ----------
const WP_CHANCE = 0.004;   // the chance a fight in a contested zone (level 20+) is a world PvP moment instead (less at 60, out farming)
const WP_MIN = 20;
// contested: both factions quest there (and the Barrens, where the Alliance rides through the Crossroads)
const wpContested = z => { const d = ZONES[z]; return !!d && d.min >= 15 && (!!(d.hubA && d.hubH) || z === "The Barrens"); };
const newWpvp = () => ({ won: 0, lost: 0, ganked: 0, camped: 0, seen: 0, raids: {}, towns: 0, capital: 0, kazzak: 0, plague: 0, plagueAt: 0 });
// a player of the other faction around a level
function wpPlayer(L) {
  const role = Math.random() < 0.15 ? "heal" : "dps", p = pugMember(role, takenNames(), foeSide());
  return { name: p.name, race: p.race, cls: p.cls, role, L: clamp(L, 1, 60) };
}
const wpWho = f => `${f.name} (level ${f.L} ${f.race} ${f.cls.toLowerCase()})`;
// the famous spots, for the sightings
function wpSpot(z) {
  const us = S.faction, them = foeSide(), h = us === "Horde";
  if (z === "Hillsbrad Foothills") return pick([`Tarren Mill and Southshore are at it again: a running battle rages in the hills between them.`,
    h ? `A Horde raid rides down on Southshore. The guards don't stand a chance.` : `An Alliance raid rides up the hill to Tarren Mill. The Deathguards don't stand a chance.`,
    `The road between Tarren Mill and Southshore is littered with ${them} and ${us} corpses.`]);
  if (z === "The Barrens") return pick([`An Alliance raid hits the Crossroads! Guards and Horde players hold the gates.`, `A level 60 night elf is camping the Crossroads flight master. Nobody lands there for a while.`, `Barrens chat argues about Mankrik's wife while the Alliance rides past.`]);
  if (z === "Stranglethorn Vale") return pick([`${them} and ${us} players fight over Nesingwary's Expedition.`, `A level 60 ${them} rogue stalks the road to Booty Bay, picking off anyone low on health.`, `Somebody shouts that Grom'gol is under attack.`]);
  if (z === "Ashenvale") return pick([h ? `The Alliance is attacking Splintertree Post. Everyone nearby rides to help.` : `The Horde is attacking Astranaar. Everyone nearby rides to help.`, `${them} and ${us} players fight over the Warsong Lumber Camp.`]);
  if (z === "Arathi Highlands") return `${them} players ride past on their way to the Arathi Basin entrance.`;
  return null;
}
// what comes up instead of a fight: a sighting, a fair fight or a gank (from a much higher level player)
function wpRoll(q) {
  if (S.level < WP_MIN || S.party || !wpContested(curZone()) || Math.random() >= WP_CHANCE * (S.level >= 60 ? 0.4 : 1)) return false;
  const r = Math.random();
  if (r < 0.45) {
    const f = wpPlayer(S.level < 50 && Math.random() < 0.5 ? 60 : S.level + R(5) - 2), them = foeSide(), spot = Math.random() < 0.5 ? wpSpot(curZone()) : null;
    const line = spot || pick([`${wpWho(f)} rides past and leaves you alone.`, `${wpWho(f)} /spits on you and rides on.`, `You and ${wpWho(f)} eye each other, then go back to your quests.`,
      `${wpWho(f)} /waves. You /wave back. Nobody attacks.`, `A ${them} raid thunders past on the road. You hide behind a tree until it's gone.`, `${wpWho(f)} is fighting a mob at low health. You let them be.`]);
    q.push({ k: "wpsee", d: pick([`Keeping an eye on the ${them} players nearby`, `Watching the road`, `Hiding behind a tree`]), t: sec(5), line });
    return true;
  }
  q.push(wpFight(r < 0.85 ? "duel" : "gank"));
  return true;
}
// a fight with one player (sometimes two in a fair fight), the result rolled now
function wpFight(kind) {
  const gank = kind === "gank", L = S.level, foes = [gank ? wpPlayer(Math.max(L + 10, 55 + R(6))) : wpPlayer(L + R(5) - 2)];
  if (!gank && Math.random() < 0.15) foes.push(wpPlayer(L + R(3) - 1));
  if (gank) foes[0].left = +(0.85 + Math.random() * 0.12).toFixed(2); // barely scratched
  const n = foes.length, gear = gearFor();
  const p = gank ? { casts: rotation(false, 3), t: sec(7) } : packTrim(rotation(false, (5 + R(3)) * n, n), n, 0, sec((9 + L * 0.12) * 1.6 * (1 + 0.6 * (n - 1)) * clamp(1.35 - gear * 0.35, 0.8, 1.2)));
  // a fair fight: about even, better with gear and a healer's staying power, worse two against one
  const winP = clamp(0.62 + (gear - 1) * 0.6 + (heroRole() === "heal" ? 0.05 : 0) - (armorType() === "Cloth" ? 0.04 : 0) - (n - 1) * 0.3, 0.2, 0.85);
  const die = gank || Math.random() >= winP, f = foes[0];
  const d = gank ? `${f.name}, a level ${f.L} ${f.cls.toLowerCase()}, jumps you` : Math.random() < 0.5 ? `Fighting ${wpWho(f)}${n > 1 ? " and a friend" : ""}` : `${f.name} (${f.cls.toLowerCase()}) attacks you while you fight`;
  return { k: "kill", wp: true, gank, camp: gank && Math.random() < 0.3, d, t: p.t, mob: f.name, mobs: foes.map(x => x.name), mobL: f.L, foes, casts: p.casts, die, dieAt: +(gank ? 0.5 + Math.random() * 0.3 : 0.6 + Math.random() * 0.35).toFixed(2) };
}
// the hero's health in a world PvP fight follows the rolled result: down to nothing at dieAt, or never quite to zero
function wpOutcome(t, fo, sf) {
  if (t.die) {
    sf.tl = sf.tl.filter(x => x[0] < t.dieAt); sf.tl.push([t.dieAt, 0]); sf.end = 0;
    fo.stop = Math.min(fo.w.length - 1, Math.floor(t.dieAt * fo.w.length));
    const u = fo.units[0]; t.killer = { src: u.name, a: u.acts[fo.stop] || "Auto Attack" };
  } else {
    delete fo.stop; t.killer = null;
    sf.tl = sf.tl.map(([a, v]) => [a, Math.max(v, 0.06)]); sf.end = Math.max(sf.end, 0.06);
  }
}
// a finished world PvP fight (instead of a normal kill): no quest progress, no loot, no repair bill for dying to a player
function wpEnd(t) {
  const sf = soloFight(t), w = S.wpvp, f = t.foes[0];
  if (sf.drank && S.cons.hp > 0) S.cons.hp--;
  petAfterFight(t, sf);
  if (!t.die) {
    w.won++; S.repair += Math.round(S.level * 0.6);
    log(t.foes.length > 1 ? `Beat ${wpWho(f)} and ${t.foes[1].name} two against one!` : pick([`Won the fight against ${wpWho(f)}.`, `${wpWho(f)} goes down. /bow.`, `Beat ${wpWho(f)}. They'll be back.`]), "boss");
    return;
  }
  w.lost++; loseBuffs(); if (S.pet) S.pet.dead = true; S.hpF = 0;
  const ghost = { k: "ghost", d: "Running back to your corpse as a ghost", t: sec(45) }, rez = { k: "rez", d: "Resurrecting and drinking up", t: sec(10) };
  if (t.gank) {
    if (!t.again) w.ganked++;
    log(t.again ? `${f.name} was waiting at your corpse. Ganked again.` : `Ganked by ${wpWho(f)}. ${pick(["Nothing you could do.", "Two hits and it was over.", "Someone in general chat calls for help. Nobody comes."])}`, "death");
    if (t.again) { w.camped++; S.queue.unshift({ k: "ghost", d: `Waiting as a ghost until ${f.name} gets bored`, t: sec(70) }, { k: "wpsee", d: "Resurrecting somewhere quieter", t: sec(10), line: `${f.name} finally rides off. Back to questing.` }); return; }
    if (t.camp) { S.queue.unshift(ghost, rez, { ...wpFight("gank"), foes: t.foes, mob: f.name, mobs: [f.name], mobL: f.L, again: true, camp: false, d: `${f.name} is still there` }); return; }
  } else log(`${wpWho(f)} wins the fight. Releasing spirit…`, "death");
  S.queue.unshift(ghost, rez);
}

// ---------- at 60: raids on the other faction's towns and capital ----------
// played like a battleground (S.dg.bg, S.dg.wp): the town's guards, its defenders (players of the other side), its leader
const WP_RAIDS = [
  { name: "Raid on Tarren Mill", abbr: "TM", att: "Alliance", town: "Tarren Mill", size: 15, heal: 3, tank: 2, win: 180, loss: 60, guards: ["Tarren Mill Deathguard"], leader: "High Executor Darthalia", lk: "caster", winP: 0.8 },
  { name: "Raid on the Crossroads", abbr: "XR", att: "Alliance", town: "the Crossroads", size: 15, heal: 3, tank: 2, win: 180, loss: 60, guards: ["Crossroads Guard"], leader: "Thork", lk: "fighter", winP: 0.8 },
  { name: "Raid on Orgrimmar", abbr: "ORG", att: "Alliance", town: "Orgrimmar", size: 40, heal: 8, tank: 4, win: 500, loss: 120, guards: ["Orgrimmar Grunt", "Kor'kron Elite"], leader: "Thrall", lk: "caster", cap: true, winP: 0.4 },
  { name: "Raid on Southshore", abbr: "SS", att: "Horde", town: "Southshore", size: 15, heal: 3, tank: 2, win: 180, loss: 60, guards: ["Southshore Guard"], leader: "Magistrate Henry Maleb", lk: "caster", winP: 0.8 },
  { name: "Raid on Astranaar", abbr: "AST", att: "Horde", town: "Astranaar", size: 15, heal: 3, tank: 2, win: 180, loss: 60, guards: ["Astranaar Sentinel"], leader: "Raene Wolfrunner", lk: "fighter", winP: 0.8 },
  { name: "Raid on Stormwind", abbr: "SW", att: "Horde", town: "Stormwind", size: 40, heal: 8, tank: 4, win: 500, loss: 120, guards: ["Stormwind City Guard", "Stormwind Royal Guard"], leader: "Highlord Bolvar Fordragon", lk: "fighter", cap: true, winP: 0.4 },
  { name: "Lord Kazzak in Stormwind", abbr: "KZ", att: "Horde", town: "Stormwind", size: 20, heal: 4, tank: 2, win: 150, loss: 60, guards: ["Stormwind City Guard"], kazzak: true, winP: 0.65 },
];
const wpRow = n => WP_RAIDS.find(w => w.name === n);
const WP_RAID_CHANCE = 0.035; // the chance an evening without a raid goes to world PvP (more with a guild)
// on an evening without a raid: now and then a raid on the other side's towns (the guild calls a world PvP night)
function wpPick() {
  if (S.level < 60 || Math.random() >= WP_RAID_CHANCE * (S.guild ? 1.6 : 1)) return null;
  const ok = WP_RAIDS.filter(w => w.att === S.faction && (!w.cap || S.guild || Math.random() < 0.3) && (!w.kazzak || !S.wpvp.kazzak || Math.random() < 0.15));
  return ok.length ? pick(ok) : null;
}
function queueWP(w) {
  const q = S.queue, us = S.faction, them = foeSide(), pre = !!(S.guild && S.friends.length >= 3);
  S.party = bgParty(w, pre);
  const E = bgEnemies(w, false, sideGear()), win = Math.random() < clamp(w.winP + (pre ? 0.12 : 0) + (sideGear() - 1.3) * 0.5, 0.1, 0.95);
  S.dg = { name: w.name, bg: true, wp: true, raid: false, killed: 0, total: 0, rep0: S.repair, wipes: 0, pre, rival: false, win, score: [0, 0], hk: 0, ed: 0, od: 0, sb: { kb: [], hk: [], d: [] }, final: "", E };
  S.meter = { dn: w.name, dmg: [], heal: [], secs: 0, last: null };
  const dut = w.kazzak ? ["Pulling Kazzak along", "Keeping Kazzak's attention", "Running ahead", "Fighting the guards", "Fighting the guards"] : ["Fighting the guards", "Fighting the guards", "Hunting defenders", "Guarding the healers", "Holding the gate", `Going for ${w.leader}`];
  S.dg.duty = S.party.map(() => pick(dut));
  E.forEach(e => e.duty = pick(w.kazzak ? ["Defending the Trade District", "Running from Kazzak", "Fighting the Horde", "Calling for help"] : ["Defending the town", "Rezzing at the graveyard", `Guarding ${w.leader}`, "Calling for help", "Riding in from the flight path"]));
  q.push({ k: "wpgo", d: S.guild ? `Waiting for <${S.guild.name}> to gather for the ${w.name.toLowerCase()}` : `Joining a raid group: "${w.name}, LFM, all welcome"`, t: sec(90 + R(90)), dn: w.name });
  q.push({ k: "dbuff", d: "Buffing up before the raid", t: sec(8), raid: true });
  const st = { us, them, E, b: w, win };
  (w.kazzak ? kazzakStory(st) : wpRaidStory(st)).forEach(s => q.push(s.fight ? bgFight(s.fight, st) : { k: "bgobj", ...s, t: sec(s.t || 20) }));
  S.dg.final = st.final;
  q.push({ k: "wpend", d: `Hearthing home after the ${w.name.toLowerCase()}`, t: sec(14, 1), dn: w.name });
}
const wpGuards = (w, n, L) => Array.from({ length: n }, () => ({ name: pick(w.guards), L, rank: "elite", kind: "fighter" }));
function wpRaidStory(st) {
  const w = st.b, { us, them, win } = st, out = [], gL = w.cap ? 60 : 55;
  out.push({ d: `Riding to ${w.town}`, lines: [`The ${us} raid sets out for ${w.town}.`], t: 50 });
  out.push({ fight: { d: `Fighting the guards at the edge of ${w.town}`, npc: wpGuards(w, 3, gL) } });
  out.push({ d: `Pushing into ${w.town}`, lines: [w.cap ? `The raid breaks through the gates of ${w.town}. ${them} players pour in from everywhere to defend it.` : `The raid storms into ${w.town}. The flight master is the first to go.`] });
  out.push({ fight: { d: `Fighting ${them} defenders in ${w.town}` } });
  for (let i = 0; i < (w.cap ? 2 : 1); i++) out.push({ fight: { d: w.cap ? `Fighting through the ${plural(w.guards[1])}` : `Fighting the guards in ${w.town}`, npc: wpGuards(w, 3 + R(2), w.cap ? 62 : gL) } });
  if (win) {
    out.push({ fight: { d: `Fighting ${w.leader}`, npc: [...wpGuards(w, 2, w.cap ? 62 : gL), { name: w.leader, L: w.cap ? 63 : 60, rank: w.cap ? "raid boss" : "boss", kind: w.lk }] } });
    out.push({ d: `${w.leader} falls`, lines: [`${w.leader} is dead! ${w.cap ? `The ${us} has killed the leader of the ${them} in their own city.` : `${w.town} is ours, for now.`}`], stat: w.cap ? { capital: 1 } : { towns: 1 }, t: 12 });
    st.final = `${w.leader} slain`;
  } else {
    out.push({ fight: { d: `Holding off the ${them} counterattack`, n: 3 } });
    out.push({ d: `The raid breaks`, lines: [`The ${them} rallies and the raid falls apart at the ${w.cap ? "throne room" : "inn"}. Everyone hearths out.`], t: 12 });
    st.final = "pushed back";
  }
  return out;
}
// the classic: Lord Kazzak pulled out of the Blasted Lands, all the way to the Trade District
function kazzakStory(st) {
  const { win } = st, w = st.b, out = [], K = [{ name: "Lord Kazzak", L: 63, rank: "raid boss", kind: "caster" }];
  out.push({ d: "Pulling Lord Kazzak", lines: ["Someone tags Lord Kazzak in the Blasted Lands and the whole raid runs. Kazzak follows."], t: 40 });
  out.push({ d: "Dragging Kazzak through the Swamp of Sorrows and Duskwood", lines: ["Kazzak flattens Darkshire on the way. Nobody minds much."], t: 60 });
  out.push({ fight: { d: "Keeping Kazzak's attention through Elwynn Forest", npc: K } });
  if (win) {
    out.push({ d: "Kazzak walks into Stormwind", lines: ["Lord Kazzak walks through the gates of Stormwind. The guards line up to die.", "[Trade]: KAZZAK IS IN THE TRADE DISTRICT!!!"], stat: { kazzak: 1 }, t: 20 });
    out.push({ fight: { d: "Fighting the guards while Kazzak eats the Trade District", npc: wpGuards(w, 4, 55) } });
    out.push({ fight: { d: "Fighting the Alliance players who come to stop it" } });
    out.push({ d: "Stormwind in ruins", lines: ["For hours nobody can use the bank or the auction house. Kazzak heals on every player he kills."], t: 20 });
    st.final = "Kazzak reached the Trade District";
  } else {
    out.push({ d: "Kazzak resets", lines: ["Kazzak loses interest at the Goldshire inn and walks all the way home."], t: 15 });
    out.push({ fight: { d: "Fighting the Alliance players who came out to meet you" } });
    st.final = "Kazzak went home";
  }
  return out;
}
// the quest meter on a world PvP raid
function wpMeter(d) { return { name: `${d.name}: ${d.ed} enemies down`, val: `${d.hk} HK`, p: Math.min(1, d.ed / 30) }; }

const WP_FINISH = {
  wpsee(t) { S.wpvp.seen++; log(t.line, "chat"); },
  wpgo(t) {
    S.loc = "dungeon"; if (S.dg) S.dg.formed = true;
    log(S.guild ? `[Guild] World PvP night! <${S.guild.name}> is going: ${t.dn.toLowerCase()}. Bring friends.` : `[General] ${t.dn}, LFM! Everyone welcome, meet at the flight master.`, "chat");
  },
  wpend(t) {
    const d = S.dg, w = wpRow(t.dn), p = S.pvp, wp = S.wpvp;
    if (d && w) {
      wp.raids[w.abbr] = (wp.raids[w.abbr] || 0) + 1;
      // honor at 60 only: the players killed, and the leader
      const honor = Math.round(d.hk * HK_HONOR + (d.win ? w.win : w.loss));
      p.honor += honor; p.total += honor;
      log(`${d.win ? "Success" : "Failure"}: ${w.name} (${d.final}). +${honor.toLocaleString()} honor, ${d.hk} honorable kills${d.sb.d[0] ? `, died ${d.sb.d[0]} time${d.sb.d[0] > 1 ? "s" : ""}` : ""}.`, d.win ? "ach" : "death");
      S.party.forEach(m => { const f = S.friends.find(x => x.name === m.name); if (f) f.runs++; });
    }
    S.dg = null; S.party = null; S.loc = "city";
  },
  wpcity(t) {
    const w = S.wpvp;
    if (t.ev === "plague") {
      w.plague = 1; w.plagueAt = S.time;
      log(`Corrupted Blood in ${city()}! A raid brought Hakkar's plague back from Zul'Gurub and it's spreading from player to player.`, "death");
      log(pick(["Low level players drop dead all over the streets. Skeletons everywhere.", "Healers run around trying to keep everyone alive. It doesn't help.", "[General]: DON'T COME TO TOWN"]), "chat");
    } else if (t.ev === "plagued") log(`${city()} is still full of Corrupted Blood. In and out, no auction house today.`, "chat");
    else if (t.ev === "kazzak") {
      w.kazzak = (w.kazzak || 0) + 1;
      log("Lord Kazzak is loose in Stormwind! The Horde dragged him all the way from the Blasted Lands.", "death");
      log(pick(["Guards and players line up to die in the Trade District.", "Kazzak heals on every kill. There's no stopping him."]), "chat");
    }
    if (t.die) {
      log(t.ev === "kazzak" ? "Kazzak's Shadow Bolt Volley catches you outside the bank." : "You catch Corrupted Blood and it ticks you to death.", "death");
      loseBuffs(); S.hpF = 0; if (S.pet) S.pet.dead = true;
      S.queue.unshift({ k: "ghost", d: "Running back from the graveyard as a ghost", t: sec(40) }, { k: "rez", d: "Resurrecting and getting out of town", t: sec(10) });
    } else if (t.ev !== "plagued") log(t.ev === "kazzak" ? "You get your training done and get out." : "A priest dispels you just in time. You train and get out fast.", "chat");
  },
};
// the World PvP part of the PvP tab
function wpTab(row) {
  const w = S.wpvp, raids = WP_RAIDS.filter(x => x.att === S.faction);
  let h = `<li class="jhead">World PvP <small>${w.won} won, ${w.lost} lost</small></li>`;
  h += row(w.won + w.lost > 0, "⚔", "Contested zones", S.level < WP_MIN && !(w.won + w.lost) ? `From level ${WP_MIN}, in the zones both factions quest in (Hillsbrad, Stranglethorn, Ashenvale...).` : `${w.won} fights won, ${w.lost} lost · ganked ${w.ganked} time${w.ganked === 1 ? "" : "s"}, camped ${w.camped} · ${w.seen} close encounters`);
  h += raids.map(x => { const n = w.raids[x.abbr] || 0; return row(n > 0, n ? "✓" : "·", esc(x.name), n ? `${n} time${n === 1 ? "" : "s"}` : S.level < 60 ? "At level 60, on a world PvP night" : "Not yet"); }).join("");
  if (w.plague || w.kazzak) h += row(true, "☠", "World events", [w.plague ? "Corrupted Blood" : "", w.kazzak ? "Lord Kazzak in Stormwind" : ""].filter(Boolean).join(" · "));
  return h;
}
// a city visit: the odd world event in the capital. Returns true when the hero skips the auction house
function wpCityEvent(q) {
  const w = S.wpvp, where = city();
  if (w.plagueAt && S.time - w.plagueAt < DAY) { q.push({ k: "wpcity", ev: "plagued", d: `Dodging plagued players in ${where}`, t: sec(6) }); return true; }
  if (!w.plague && S.level >= 30 && Math.random() < 0.03) { q.push({ k: "wpcity", ev: "plague", d: `Dodging Corrupted Blood in ${where}`, t: sec(10), die: S.level < 60 && Math.random() < 0.5 }); return true; }
  if (!w.kazzak && S.faction === "Alliance" && where === "Stormwind" && S.level >= 30 && Math.random() < 0.02) { q.push({ k: "wpcity", ev: "kazzak", d: "Staying out of Lord Kazzak's way", t: sec(10), die: Math.random() < 0.5 }); return true; }
  return false;
}
