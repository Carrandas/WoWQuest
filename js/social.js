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
  helpful: ["always helps", ["{n} hands out water to everyone before the run.", "{n} explains every pull to the new guy, patiently."]],
  need: ["needs on everything", ["{n} rolled Need on cloth again. As a warrior.", "{n}: \"oops, wrong button\" (it wasn't)."]],
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
// a new player of a role (any role if none given): class allowed for the faction, a race that can play it
function newPlayer(role) {
  role = role || pick(["tank", "heal", "dps", "dps", "dps"]);
  const c = pick(ROLE_CLASSES[role].filter(k => k !== "Paladin" || S.faction === "Alliance").filter(k => k !== "Shaman" || S.faction === "Horde"));
  const race = pick(Object.keys(ALLOWED).filter(r => RACES[r].f === S.faction && ALLOWED[r].includes(c)));
  return { name: randName(takenNames()), race, cls: c, role, spec: ROLE_SPEC[role][c], off: R(5) - 2, pers: pick(Object.keys(PERS)), runs: 0 };
}
const friendL = (f, raid) => raid || S.level >= 60 ? 60 : clamp(S.level + (f.off || 0), 1, 60);
const isFriend = n => S.friends.some(f => f.name === n);
// someone from a group adds the hero as a friend (quiet: when seeding old saves)
function addFriend(p, where, quiet) {
  if (S.friends.length >= CORE_MAX || isFriend(p.name)) return;
  const f = { name: p.name, race: p.race, cls: p.cls, role: p.role, spec: p.spec, off: p.off ?? R(5) - 2, pers: p.pers || pick(Object.keys(PERS)), runs: 1, met: where ? { z: where, ...stamp() } : null };
  S.friends.push(f);
  if (S.guild) S.guild.roster = S.guild.roster.filter(m => m.name !== f.name);
  if (!quiet) log(`${f.name} (${f.race} ${f.cls.toLowerCase()}) adds you as a friend: "Good group! Let's do this again."`, "chat");
}
// a group member as the frames want it: { name, race, cls, role, spec, L, hp, mp }
const asMember = (p, raid) => ({ name: p.name, race: p.race, cls: p.cls, role: p.role, spec: p.spec, L: friendL(p, raid), hp: 1, mp: 1, friend: isFriend(p.name) });

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
// one chronicle line per run from a friend in the group, now and then
function friendChatter() {
  if (!S.dg || S.dg.chat || !S.party || Math.random() > 0.06) return;
  const fr = S.party.filter(m => isFriend(m.name)); if (!fr.length) return;
  S.dg.chat = true;
  const m = pick(fr), f = S.friends.find(x => x.name === m.name), lines = PERS[f.pers] ? PERS[f.pers][1] : PERS.joker[1];
  log(pick(lines).replace("{n}", m.name), "chat");
}
// a dungeon done: friends along count a run, and a stranger who played well may add you
function socialDungeonEnd() {
  if (!S.party) return;
  S.party.forEach(m => { const f = S.friends.find(x => x.name === m.name); if (f) f.runs++; });
  if (S.party.length <= 4 && Math.random() < 0.4) { const s = S.party.filter(m => !isFriend(m.name)); if (s.length) addFriend(pick(s), S.dg ? S.dg.name : curZone()); }
}

// ---------- the guild ----------
// a city visit: found or join a guild (level 20 with three friends, or 30), grow the roster, and friends drift away now and then
function socialCity() {
  if (!S.guild && ((S.level >= 20 && S.friends.length >= 3) || S.level >= 30)) foundGuild(false);
  if (S.guild) growGuild(3);
  if (S.friends.length > 3 && Math.random() < 0.015) {
    const f = pick(S.friends); S.friends = S.friends.filter(x => x !== f);
    if (S.duo && S.duo.name === f.name) S.duo = null;
    log(`${f.name} hasn't logged in for weeks. Last seen: level ${friendL(f)}, ${pick(["Ironforge", "Orgrimmar", "Booty Bay", "Stranglethorn Vale", "the Barrens"])}.`, "chat");
  }
}
function foundGuild(quiet) {
  const name = guildName(), fr = S.friends.slice(0, 3).map(f => f.name);
  S.guild = { name, at: stamp(), founder: Math.random() < 0.5 || !fr.length, roster: [], firsts: {}, rival: { name: guildName(), days: {} } };
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
  if (day <= rd) { g.firsts[boss] = { us: true, ...stamp() }; log(`SERVER FIRST! <${g.name}> is the first guild on the realm to kill ${boss}! Screenshots everywhere.`, "ach"); }
  else { g.firsts[boss] = { us: false, ...stamp() }; log(`<${g.rival.name}> got ${boss} first, ${Math.max(1, Math.round(day - rd))} day${Math.round(day - rd) > 1 ? "s" : ""} ago. Next time.`, "chat"); }
}
// old saves: a few friends and the guild they'd have by now, quietly
function seedSocial() {
  if (S.level >= 12) for (let i = 0, n = Math.min(CORE_MAX, 2 + Math.floor(S.level / 8)); i < n; i++) { addFriend(newPlayer(i === 0 ? "tank" : i === 1 ? "heal" : null), null, true); S.friends[S.friends.length - 1].runs = 5 + R(40); }
  if (!S.guild && S.level >= 20) foundGuild(true);
}

// ---------- the guild tab ----------
function renderSocial() {
  const g = S.guild, fr = S.friends.slice().sort((a, b) => b.runs - a.runs);
  const row = f => `<li class="got"><span class="ico" style="color:${CLASSES[f.cls].color}">●</span><div><b style="color:${CLASSES[f.cls].color}">${esc(f.name)}${S.duo && S.duo.name === f.name ? ' <small class="comp">questing with you</small>' : ""}</b><span>Level ${friendL(f)} ${esc(f.race)} ${f.cls} · ${ROLE_NAME[f.role].toLowerCase()} · ${esc((PERS[f.pers] || PERS.joker)[0])}</span><time>${f.met ? `met in ${esc(f.met.z)} at level ${f.met.L} · ` : ""}${f.runs} ${f.runs === 1 ? "fight" : "fights"} together</time></div></li>`;
  let h = `<li class="jhead">Friends <small>${fr.length} of ${CORE_MAX}</small></li>` + (fr.map(row).join("") || `<li class="locked"><span class="ico">·</span><div><b>No friends yet</b><span>Elite quests and dungeons are where you meet people.</span></div></li>`);
  if (!g) return h + `<li class="jhead">Guild</li><li class="locked"><span class="ico">·</span><div><b>No guild yet</b><span>A guild comes along around level 20, once you have a few friends.</span></div></li>`;
  const roles = r => g.roster.filter(m => m.role === r).length + S.friends.filter(f => f.role === r).length;
  h += `<li class="jhead">&lt;${esc(g.name)}&gt; <small>${g.roster.length + S.friends.length + 1} members</small></li>`
    + `<li class="got"><span class="ico">✓</span><div><b>${g.founder ? "Founded" : "Joined"}</b><span>${roles("tank")} tanks, ${roles("heal")} healers, ${roles("dps")} damage dealers</span><time>${g.at.at ? when(g.at.at, g.at.L, g.at.p) : "before the guild tab existed"}</time></div></li>`;
  h += `<li class="jhead">Server firsts <small>racing &lt;${esc(g.rival.name)}&gt;</small></li>` + SERVER_FIRSTS.map(([b]) => { const x = g.firsts[b];
    return `<li class="${x && x.us ? "got" : "locked"}"><span class="ico">${x ? (x.us ? "✓" : "✗") : "·"}</span><div><b>${esc(b)}</b><span>${x ? (x.us ? "Server first!" : `&lt;${esc(g.rival.name)}&gt; got there first`) : "Not killed yet"}</span>${x ? `<time>${when(x.at, x.L, x.p)}</time>` : ""}</div></li>`; }).join("");
  return h;
}
