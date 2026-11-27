// Friends and the guild: players met on elite quests and in dungeons become friends (a core group of about ten),
// who come along for some questing, fill the regular dungeon groups and later the guild's raids. The guild is
// founded along the way, grows to a raiding roster, and races a rival guild to the server firsts.
// Helpers on quests are company, not power: kill outcomes stay the solo ones (elites were already "with a group").
"use strict";

const CORE_MAX = 10;            // friends the hero plays with regularly
const GUILD_MAX = 50;           // guild roster at 60 (40 raid spots, some sit out)
const FRIEND_DUNGEON = 0.6;     // chance a free friend of the right role fills a dungeon slot
// personalities: a label for the guild tab and lines for the chronicle ({n}: the friend's name)
const PERS = {
  leeroy: ["Leeroy type", ["{n} pulled the extra pack again.", "{n}: \"Alright, time's up, let's do this!\" And off they run.", "{n} charged in before the tank. Again."]],
  late: ["always late", ["{n} is late again. The group waits at the stone.", "{n}: \"omw, 5 min\" (it was twenty)."]],
  pets: ["loves pets", ["{n} shows off a new minipet before the first pull.", "{n} stops to /pet every critter on the way in."]],
  joker: ["the joker", ["{n}: \"Who needs a healer when you have bandages?\"", "{n} /danced on the boss's corpse. Everyone joined in."]],
  afk: ["goes AFK at the worst moment", ["{n} went AFK mid-pull: \"sry, door\".", "{n}: \"brb, pizza\". The pull went fine anyway."]],
  helpful: ["always helps", ["{n} explains every pull to the new guy, patiently.", "{n} marks every pull: skull first, then the moon gets sheeped."]],
  need: ["needs on everything", ["{n} rolled Need on {wrong} again. As a {c}.", "{n}: \"oops, wrong button\" (it wasn't)."]],
  aggro: ["pulls aggro", ["{n} pulled aggro again. The tank sighs.", "{n}: \"why is it hitting me??\"", "{n} opens with the biggest crit before the tank has a single Sunder up."]],
  chatty: ["talks too much", ["{n} tells the story of their first epic again.", "{n} won't stop talking about their alt."]],
};
const GUILD_A = ["Crimson", "Silver", "Eternal", "Shadow", "Last", "Iron", "Wandering", "Dawn", "Ember", "Frost", "Storm", "Ashen", "Hidden", "Broken", "Twilight", "Golden"];
const GUILD_B = ["Vanguard", "Covenant", "Legion", "Brotherhood", "Wardens", "Oath", "Circle", "Remnant", "Company", "Watch", "Accord", "Syndicate", "Order", "Blades", "Tide", "Banner"];
// the server firsts the guild races for, and roughly when a rival guild gets each (days after you reach 60)
const SERVER_FIRSTS = [["Onyxia", 5], ["Ragnaros", 10], ["Nefarian", 33], ["C'Thun", 50], ["Kel'Thuzad", 72]];
const guildName = () => `${pick(GUILD_A)} ${pick(GUILD_B)}`;

// ---------- players ----------
// every name in use: the hero, friends, the guild roster
const takenNames = () => [S.name, ...S.friends.map(f => f.name), ...(S.guild ? S.guild.roster.map(m => m.name) : [])];
// a new player's gear level: about the hero's while levelling, dungeon blues at 60
const newGear = () => +((S.level >= 60 ? 1.22 : 1.08) + Math.random() * 0.1).toFixed(3);
// a new player of a role (any role if none given): class allowed for the faction, a race that can play it
function newPlayer(role) {
  role = role || pick(["tank", "heal", "dps", "dps", "dps"]);
  const c = pick(ROLE_CLASSES[role].filter(k => k !== "Paladin" || S.faction === "Alliance").filter(k => k !== "Shaman" || S.faction === "Horde"));
  const race = pick(Object.keys(ALLOWED).filter(r => RACES[r].f === S.faction && ALLOWED[r].includes(c)));
  return { name: randName(takenNames()), race, cls: c, role, spec: ROLE_SPEC[role][c], off: R(5) - 2, pers: pick(Object.keys(PERS)), runs: 0, gear: newGear(), dkp: 0 };
}
const friendL = (f, raid) => raid || S.level >= 60 ? 60 : clamp(S.level + (f.off || 0), 1, 60);
const isFriend = n => S.friends.some(f => f.name === n);
// someone from a group adds the hero as a friend (quiet: when seeding old saves)
function addFriend(p, where, quiet) {
  if (S.friends.length >= CORE_MAX || isFriend(p.name)) return;
  const old = guildMember(p.name);
  const f = { name: p.name, race: p.race, cls: p.cls, role: p.role, spec: p.spec, off: p.off ?? R(5) - 2, pers: p.pers || pick(Object.keys(PERS)), runs: 1, met: where ? { z: where, ...stamp() } : null,
    gear: (old && old.gear) || p.gear || newGear(), dkp: (old && old.dkp) || 0 };
  S.friends.push(f);
  if (S.guild) S.guild.roster = S.guild.roster.filter(m => m.name !== f.name);
  if (!quiet) log(`${f.name} (${f.race} ${f.cls.toLowerCase()}) adds you as a friend: "Good group! Let's do this again."`, "chat");
}
// a group member as the frames want it: { name, race, cls, role, spec, L, hp, mp }
const asMember = (p, raid) => ({ name: p.name, race: p.race, cls: p.cls, role: p.role, spec: p.spec, L: friendL(p, raid), hp: 1, mp: 1, friend: isFriend(p.name), gear: p.gear });

// ---------- questing together ----------
// an elite quest: one or two players help (a friend if one is around, otherwise whoever is in the zone)
function questHelpers(t) {
  const n = 1 + (Math.random() < 0.5 ? 1 : 0), out = [], used = [];
  for (let i = 0; i < n; i++) {
    const fr = S.friends.filter(f => !used.includes(f.name));
    const p = fr.length && Math.random() < 0.4 ? pick(fr) : newPlayer(i ? "heal" : pick(["tank", "dps"]));
    used.push(p.name); out.push({ ...asMember(p), pers: p.pers, off: p.off });
  }
  return helperCasts(out, t);
}
// a friend questing with the hero for a while: on every kill
function duoHelpers(t) {
  const f = S.duo && S.friends.find(x => x.name === S.duo.name);
  return f ? helperCasts([asMember(f)], t) : null;
}
// the helpers' side of the fight, rolled with the task (so a page and a Node run see the same thing)
function helperCasts(hs, t) {
  const base = (9 + S.level * 0.12) * (t.elite ? 5 : 1); // a fight's length before scaling, as castCount wants it
  return hs.map(h => {
    const [dh, dm] = fightDrop(h.role, t.elite ? "boss" : "trash");
    return { ...h, casts: rollRot(GROUP_ROT[h.role][h.cls], knowsAt(h.cls, h.L, h.spec), castCount(base, h.L)), hpEnd: Math.max(0.1, 1 - dh), mpEnd: Math.max(0.05, 1 - dm) };
  });
}
// a kill task: who comes along (none most of the time)
function killHelpers(t) {
  const h = t.elite ? questHelpers(t) : duoHelpers(t);
  if (h) t.helpers = h;
}
// after a kill with helpers: the duo winds down, and a helper may become a friend
function helpersAfter(t) {
  if (!t.helpers) return;
  t.helpers.forEach(h => { const f = S.friends.find(x => x.name === h.name); if (f) f.runs++; });
  if (t.elite) {
    const stranger = t.helpers.find(h => !isFriend(h.name));
    if (stranger && Math.random() < 0.5) addFriend(stranger, t.zone || curZone());
  } else if (S.duo && --S.duo.left <= 0) {
    log(`${S.duo.name} has to log off: "gtg, thanks for the help!"`, "chat"); S.duo = null;
  }
}
// heading out to a new quest: now and then a friend asks to come along
function duoStart() {
  if (S.duo || !S.friends.length || Math.random() > 0.04) return;
  const f = pick(S.friends);
  S.duo = { name: f.name, left: 25 + R(30) };
  log(`${f.name} whispers: "Need a hand? I'm on the same quests." They join you for a while.`, "chat");
  chatEvent("whisper", { name: f.name, cls: f.cls, txt: "Need a hand? I'm on the same quests." });
}

// ---------- dungeons and raids ----------
// filling a group's slots: friends first (some of them, for dungeons), the guild in raids, strangers for the rest
function socialMember(role, raid, used) {
  const free = p => p.role === role && !used.includes(p.name);
  if (!raid) {
    const fr = S.friends.filter(free);
    if (fr.length && Math.random() < FRIEND_DUNGEON) { const f = pick(fr); used.push(f.name); return asMember(f); }
    return null;
  }
  const pool = S.friends.filter(free).concat(S.guild ? S.guild.roster.filter(free) : []);
  if (!pool.length) return null;
  const p = pool[0]; used.push(p.name); return asMember(p, true);
}
// what the other classes in a dungeon group hand out at the entrance (the hero's own buffs are in wantedBuffs)
const GROUP_GIFTS = {
  Mage: [[1, "Arcane Intellect"], [4, "conjured water"]], Priest: [[1, "Power Word: Fortitude"]], Druid: [[1, "Mark of the Wild"]],
  Paladin: [[4, "a Blessing"]], Warlock: [[10, "Healthstones"], [18, "a Soulstone on the healer"]], Shaman: [[10, "totems"]],
};
function groupBuffs() {
  if (!S.party || !S.dg || S.dg.raid || S.dg.bg || S.dg.wb) return [];
  const out = [];
  S.party.forEach(m => (GROUP_GIFTS[m.cls] || []).forEach(([L, g]) => { if (m.L >= L && !out.includes(g) && !(m.cls === S.cls && g !== "conjured water" && g !== "Healthstones" && g !== "a Soulstone on the healer")) out.push(g); }));
  return out.map(g => g === "a Soulstone on the healer" && heroRole() === "heal" ? "a Soulstone on you" : g);
}
// the helpful friend helps the way their class can
const HELPFUL_CLS = {
  Mage: ["{n} conjures a stack of water for everyone before the run.", "{n} hands out water and opens a portal home after the last boss."],
  Warlock: ["{n} hands out Healthstones and puts a Soulstone on the healer.", "{n} summons the two who are late. Click the portal, people."],
  Priest: ["{n} buffs Fortitude on everyone, and again on the one who died.", "{n} keeps Fear Ward on the tank for the whole run."],
  Druid: ["{n} buffs Mark of the Wild and Thorns on the tank.", "{n} battle rezzes the healer. Wipe averted."],
  Paladin: ["{n} gives everyone the right Blessing: Wisdom for the casters, Might for the rest.", "{n} bubbles and resurrects the group after the wipe."],
  Shaman: ["{n} drops Windfury next to the warrior and Mana Spring by the healer.", "{n} reincarnates after the wipe and rezzes everyone."],
  Rogue: ["{n} opens every lockbox in the group for free.", "{n} saps the patrol before it joins the pull."],
  Hunter: ["{n} pulls with the pet and Feign Deaths the extra pack away.", "{n} cooks a stack of food from the boar meat in everyone's bags."],
  Warrior: ["{n} tanks the adds that get loose. Nobody dies.", "{n} hands out bandages and keeps the threat steady."],
};
// one chronicle line per run from a friend in the group, now and then
function friendChatter() {
  if (!S.dg || S.dg.chat || !S.party || Math.random() > 0.06) return;
  const fr = S.party.filter(m => isFriend(m.name)); if (!fr.length) return;
  S.dg.chat = true;
  const m = pick(fr), f = S.friends.find(x => x.name === m.name), lines = PERS[f.pers] ? PERS[f.pers][1] : PERS.joker[1];
  const c = m.cls.toLowerCase(), wrong = ["Mage", "Priest", "Warlock"].includes(m.cls) ? "plate" : "cloth"; // armor they can't use
  const all = f.pers === "helpful" && HELPFUL_CLS[m.cls] ? lines.concat(HELPFUL_CLS[m.cls]) : lines;
  log(pick(all).replace("{n}", m.name).replace("{wrong}", wrong).replace("{c}", c), "chat");
}
// a dungeon done: friends along count a run, and a stranger who played well may add you
function socialDungeonEnd() {
  if (!S.party) return;
  S.party.forEach(m => { const f = S.friends.find(x => x.name === m.name); if (f) f.runs++; });
  if (!S.dg || !S.dg.raid) guildDungeonGear();
  if (S.party.length <= 4 && Math.random() < 0.4) { const s = S.party.filter(m => !isFriend(m.name)); if (s.length) addFriend(pick(s), S.dg ? S.dg.name : curZone()); }
}

// ---------- the guild ----------
// a city visit: found or join a guild (level 20 with three friends, or 30), grow the roster, and friends drift away now and then
function socialCity() {
  if (!S.guild && ((S.level >= 20 && S.friends.length >= 3) || S.level >= 30)) foundGuild(false);
  if (S.guild) { growGuild(3); guildBank(); }
  if (S.friends.length > 3 && Math.random() < 0.015) {
    const f = pick(S.friends); S.friends = S.friends.filter(x => x !== f);
    if (S.duo && S.duo.name === f.name) S.duo = null;
    log(`${f.name} hasn't logged in for weeks. Last seen: level ${friendL(f)}, ${pick(["Ironforge", "Orgrimmar", "Booty Bay", "Stranglethorn Vale", "the Barrens"])}.`, "chat");
  }
}
function foundGuild(quiet) {
  const name = guildName(), fr = S.friends.slice(0, 3).map(f => f.name);
  S.guild = { name, at: stamp(), founder: Math.random() < 0.5 || !fr.length, roster: [], firsts: {}, rival: { name: guildName(), days: {} }, dkp: 0, loot: [], wipes: 0, bank: { gold: 0, day: null } };
  if (S.guild.rival.name === name) S.guild.rival.name = "Hidden Banner";
  SERVER_FIRSTS.forEach(([b, d]) => S.guild.rival.days[b] = +(d * (0.7 + Math.random() * 0.65)).toFixed(1));
  growGuild(quiet ? 99 : 6); // a new guild starts with a handful (the charter), old saves get the roster they'd have by now
  if (quiet) return;
  log(S.guild.founder ? `You buy a guild charter, ${fr.length ? fr.join(", ") + " sign it" : "nine strangers sign it"}, and <${name}> is founded!` : `${fr[0]} invites you to <${name}>. You accept. "Welcome! Say hi in guild chat."`, "ach");
}
// the roster grows with the hero's level: a handful at 20, a raiding guild of about 50 at 60
function growGuild(max) {
  const g = S.guild, want = Math.min(GUILD_MAX, Math.max(4, Math.floor(4 + (S.level - 18) * 1.15))) - S.friends.length;
  let n = 0; const before = g.roster.length + S.friends.length + 1;
  // raiders by role, so a 40-man raid has tanks and healers: about 1 tank and 3 healers per 8 members
  while (g.roster.length < want && n < max) { n++; const k = g.roster.length % 8; g.roster.push(newPlayer(k === 0 ? "tank" : k < 4 ? "heal" : "dps")); }
  const now = g.roster.length + S.friends.length + 1; // a chronicle line every ten members
  if (max <= 3 && n && Math.floor(now / 10) > Math.floor(before / 10)) log(`<${g.name}> keeps growing: ${g.roster.slice(-n).map(m => m.name).join(", ")} join${n > 1 ? "" : "s"}, ${now} members now.${now >= 40 ? " Enough for a 40-man raid!" : ""}`, "chat");
}
// a raid boss killed for the first time: was it the server first?
function serverFirst(boss) {
  const g = S.guild; if (!g || !(boss in g.rival.days) || g.firsts[boss]) return;
  const at60 = (S.ach.L60 && S.ach.L60.p) ?? g.at.p ?? 0; // saves from before the guild: count from when it was seeded
  const day = (S.time - at60) / DAY, rd = g.rival.days[boss];
  if (day <= rd) {
    g.firsts[boss] = { us: true, ...stamp() }; log(`SERVER FIRST! <${g.name}> is the first guild on the realm to kill ${boss}! Screenshots everywhere.`, "ach");
    const m = g.roster.length ? pick(g.roster).name : null;
    log(`[Guild] ${pick(["OMG OMG OMG", "SERVER FIRST!!!", "WE DID IT", "/cheer /cheer /cheer"])}${m ? ` (${m}: "${pick(["Everyone on the corpse for the screenshot!", "Somebody post it on the realm forums.", `Take that, <${g.rival.name}>.`, "I'm framing this one."])}")` : ""}`, "chat");
  }
  else { g.firsts[boss] = { us: false, ...stamp() }; log(`<${g.rival.name}> got ${boss} first, ${Math.max(1, Math.round(day - rd))} day${Math.round(day - rd) > 1 ? "s" : ""} ago. Next time.`, "chat"); }
}
// old saves: a few friends and the guild they'd have by now, quietly
function seedSocial() {
  if (S.level >= 12) for (let i = 0, n = Math.min(CORE_MAX, 2 + Math.floor(S.level / 8)); i < n; i++) { addFriend(newPlayer(i === 0 ? "tank" : i === 1 ? "heal" : null), null, true); S.friends[S.friends.length - 1].runs = 5 + R(40); }
  if (!S.guild && S.level >= 20) foundGuild(true);
}
// saves from before guild gear and DKP
function migrateSocial() {
  S.friends.concat(S.guild ? S.guild.roster : []).forEach(m => { if (m.gear == null) m.gear = newGear(); if (m.dkp == null) m.dkp = 0; });
  const g = S.guild; if (!g) return;
  if (g.dkp == null) g.dkp = 0;
  g.loot = g.loot || []; g.wipes = g.wipes || 0; g.bank = g.bank || { gold: 0, day: null };
}

// ---------- the guild's own gear, DKP, the bank ----------
// every member has a gear level (gear score / level, like the hero's) that drives their part of the damage meter.
// Dungeons give everyone an upgrade now and then (as if they ran one too); raid loot goes to members through DKP
const guildMember = n => S.friends.find(f => f.name === n) || (S.guild && S.guild.roster.find(m => m.name === n)) || null;
const memberGear = m => m.gear ?? 1.1;
const gearUp = (m, amt, cap) => { m.gear = Math.max(memberGear(m), Math.min(cap, memberGear(m) + amt)); };
const DKP_BOSS = 10;  // DKP for everyone in the raid per boss killed
// a dungeon finished: friends and guildies have their own runs too (dungeon blues top out at about gear 1.35)
function guildDungeonGear() {
  const all = S.friends.concat(S.guild ? S.guild.roster : []), ch = S.level >= 60 ? 0.25 : 0.08;
  all.forEach(m => { if (Math.random() < ch) gearUp(m, 0.02, S.level >= 60 ? 1.35 : 1.3); });
}
// a raid boss down: DKP for everyone there, and the loot the hero didn't get goes to the highest bidder who needs it
function guildLoot(dn, boss) {
  const g = S.guild, ri = RAID_INFO[dn], d = instanceRow(dn); if (!g || !ri || !S.party) return;
  const here = S.party.map(m => guildMember(m.name)).filter(Boolean);
  here.forEach(m => m.dkp = (m.dkp || 0) + DKP_BOSS); g.dkp = (g.dkp || 0) + DKP_BOSS;
  const cap = ri.gs / 60 + 0.3; // a raid's loot lifts its raiders a bit past what it asks for
  for (let i = 0, n = ri.size === 40 ? 3 : 2; i < n; i++) {
    const want = here.filter(m => memberGear(m) < cap); if (!want.length) break;
    const bids = Array.from({ length: Math.min(5, want.length) }, () => pick(want)), w = bids.reduce((a, b) => ((b.dkp || 0) > (a.dkp || 0) ? b : a));
    const bid = Math.min(w.dkp || 0, Math.max(10, Math.round((w.dkp || 0) * (0.3 + Math.random() * 0.4))));
    w.dkp = (w.dkp || 0) - bid; gearUp(w, 0.04, cap);
    if (i || (!isFriend(w.name) && Math.random() > 0.4)) continue; // one line per boss at most: always for a friend
    const items = d.loot.filter(x => !LEGENDARY[x.name]); if (!items.length) continue;
    const item = pick(items).name;
    log(bid ? `[Loot] ${w.name} wins ${item} for ${bid} DKP.` : `[Loot] ${w.name} gets ${item}: nobody else needed it.`, "loot4");
    g.loot.unshift({ who: w.name, item, bid, boss }); if (g.loot.length > 6) g.loot.length = 6;
  }
}
// the hero's own raid loot is bought with DKP too (null outside a guild raid: then it's a Need roll)
function heroBid() {
  if (!S.guild || !S.dg || !S.dg.raid) return null;
  const bid = Math.min(S.guild.dkp || 0, 20 + R(40)); S.guild.dkp = (S.guild.dkp || 0) - bid; return bid;
}
// the guild bank: dues from every member, and a flask for the hero on a raid night when the bags are out of them
function guildBank() {
  const g = S.guild, day = Math.floor(S.time / DAY), days = Math.max(0, day - (g.bank.day ?? day));
  g.bank.day = day; g.bank.gold += days * (g.roster.length + S.friends.length) * 500; // 5 silver a member a day
}
function guildFlask() {
  const g = S.guild; if (!g || (S.cons.flask || 0) > 0 || g.bank.gold < FLASK_PRICE) return;
  g.bank.gold -= FLASK_PRICE; S.cons.flask = 1;
  log(`Out of flasks: the guild bank hands you a ${flaskName()} for tonight.`, "gold");
}

// ---------- people coming and going ----------
const LEAVE = ["has to go (wife aggro)", "has to work early tomorrow", "disconnected and can't get back in", "rage-quits after that wipe", "has to put the kids to bed", "is falling asleep at the keyboard"];
// after a wipe someone may leave: a guildie takes the spot in a raid, otherwise it's "LF1M" in chat
function partySwap(t) {
  if (!S.party || !S.dg || Math.random() > 0.15) return;
  const raid = S.dg.raid, out = S.party.map((m, i) => [m, i]).filter(([m]) => !isFriend(m.name)); if (!out.length) return;
  const [m, i] = pick(out), used = [S.name, ...S.party.map(x => x.name)];
  const gm = raid && S.guild ? S.guild.roster.find(x => x.role === m.role && !used.includes(x.name)) : null;
  let nm;
  if (gm) { nm = asMember(gm, true); log(`${m.name} ${pick(LEAVE)}. ${nm.name} from the guild takes the spot.`, "chat"); }
  else {
    const p = newPlayer(m.role); nm = { ...asMember(p, raid), gear: contentGear() };
    log(`${m.name} ${pick(LEAVE)}. "LF1M ${ROLE_NAME[m.role].toLowerCase()} for ${S.dg.name}, on ${t.boss}!" ${nm.name} joins.`, "chat");
    if (raid && S.guild && Math.random() < 0.4) { S.guild.roster.push({ ...p, gear: contentGear() }); log(`${nm.name} liked the raid and joins <${S.guild.name}>.`, "chat"); }
  }
  nm.hp = 1; nm.mp = 1; S.party[i] = nm;
  if (S.meter) { S.meter.dmg[i + 1] = 0; S.meter.heal[i + 1] = 0; }
}
// a raid that keeps wiping loses people: five wipes without a kill and a guildie quits
function guildWipe(boss) {
  const g = S.guild; if (!g || ++g.wipes < 5 || !g.roster.length) return;
  g.wipes = 0;
  const q = pick(g.roster); g.roster = g.roster.filter(x => x !== q);
  log(`${q.name} has left the guild after another wipe on ${boss}: "This guild will never kill ${boss}."`, "chat");
}

// ---------- the guild tab ----------
function renderSocial() {
  const g = S.guild, fr = S.friends.slice().sort((a, b) => b.runs - a.runs);
  const row = f => `<li class="got"><span class="ico" style="color:${CLASSES[f.cls].color}">●</span><div><b style="color:${CLASSES[f.cls].color}">${esc(f.name)}${S.duo && S.duo.name === f.name ? ' <small class="comp">questing with you</small>' : ""}</b><span>Level ${friendL(f)} ${esc(f.race)} ${f.cls} · ${ROLE_NAME[f.role].toLowerCase()} · ${esc((PERS[f.pers] || PERS.joker)[0])}</span><time>${f.met ? `met in ${esc(f.met.z)} at level ${f.met.L} · ` : ""}${f.runs} ${f.runs === 1 ? "fight" : "fights"} together · gear ${Math.round(memberGear(f) * friendL(f))}${S.guild ? ` · ${f.dkp || 0} DKP` : ""}</time></div></li>`;
  let h = `<li class="jhead">Friends <small>${fr.length} of ${CORE_MAX}</small></li>` + (fr.map(row).join("") || `<li class="locked"><span class="ico">·</span><div><b>No friends yet</b><span>Elite quests and dungeons are where you meet people.</span></div></li>`);
  if (!g) return h + `<li class="jhead">Guild</li><li class="locked"><span class="ico">·</span><div><b>No guild yet</b><span>A guild comes along around level 20, once you have a few friends.</span></div></li>`;
  const roles = r => g.roster.filter(m => m.role === r).length + S.friends.filter(f => f.role === r).length;
  h += `<li class="jhead">&lt;${esc(g.name)}&gt; <small>${g.roster.length + S.friends.length + 1} members</small></li>`
    + `<li class="got"><span class="ico">✓</span><div><b>${g.founder ? "Founded" : "Joined"}</b><span>${roles("tank")} tanks, ${roles("heal")} healers, ${roles("dps")} damage dealers</span><time>${g.at.at ? when(g.at.at, g.at.L, g.at.p) : "before the guild tab existed"}</time></div></li>`;
  const all = S.friends.concat(g.roster), avg = all.reduce((a, m) => a + memberGear(m), 0) / Math.max(1, all.length);
  const dkp = all.map(m => ({ n: m.name, v: m.dkp || 0 })).concat({ n: S.name, v: g.dkp || 0, me: true }).sort((a, b) => b.v - a.v), mine = dkp.findIndex(x => x.me) + 1;
  h += `<li class="got"><span class="ico">⚔</span><div><b>Gear</b><span>The guild averages gear ${Math.round(avg * Math.min(60, S.level))} (you: ${Math.round(gearScore())})</span></div></li>`
    + `<li class="got"><span class="ico">$</span><div><b>Guild bank</b><span>${moneyTxt(g.bank.gold)} from dues. It pays for a flask when you run out on a raid night.</span></div></li>`;
  if (S.level >= 60) h += `<li class="jhead">DKP <small>you: ${g.dkp || 0}, rank ${mine} of ${dkp.length}</small></li>`
    + dkp.slice(0, 5).map((x, i) => `<li class="${x.me ? "got" : "locked"}"><span class="ico">${i + 1}</span><div><b>${esc(x.n)}</b><span>${x.v} DKP</span></div></li>`).join("")
    + (g.loot.length ? `<li class="jhead">Recent loot</li>` + g.loot.map(l => `<li class="got"><span class="ico">✓</span><div><b class="q4">${esc(l.item)}</b><span>${esc(l.who)}, ${l.bid ? l.bid + " DKP" : "free"} · ${esc(l.boss)}</span></div></li>`).join("") : "");
  h += `<li class="jhead">Server firsts <small>racing &lt;${esc(g.rival.name)}&gt;</small></li>` + SERVER_FIRSTS.map(([b]) => { const x = g.firsts[b];
    return `<li class="${x && x.us ? "got" : "locked"}"><span class="ico">${x ? (x.us ? "✓" : "✗") : "·"}</span><div><b>${esc(b)}</b><span>${x ? (x.us ? "Server first!" : `&lt;${esc(g.rival.name)}&gt; got there first`) : "Not killed yet"}</span>${x ? `<time>${when(x.at, x.L, x.p)}</time>` : ""}</div></li>`; }).join("");
  return h;
}
