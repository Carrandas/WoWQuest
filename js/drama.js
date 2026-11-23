// Guild drama: the guild as people. Now and then on a city visit something happens (S.drama): a member quits the game
// with a farewell post, a DKP fight, the raid leader's friend promoted, a druid rolling on cloth, the main tank leaving
// for the rival guild (a few harder raid nights), once at 60 the guild splitting up (the hero goes with their friends).
// And on raid nights: invites going out late, a night called off for lack of people, the guild leader yelling on voice
// chat after the third wipe, the loot council handing the hero's upgrade to someone else. Lines in the chronicle and in
// guild chat (chat.js); the effects stay small so the raid timeline holds.
"use strict";

const newDrama = () => ({ last: 0, mtGone: 0, split: false, n: 0 });
const DRAMA_GAP = () => (S.level >= 60 ? 1 + Math.random() * 1.5 : 3 + Math.random() * 3) * DAY;
const gsay = (m, txt) => { if (m && typeof chatSay === "function") chatSay("guild", m.name, txt, m.cls); };
const rosterPick = f => { const g = S.guild; const l = g ? g.roster.filter(f || (() => true)) : []; return l.length ? pick(l) : null; };

// ---------- now and then, on a city visit ----------
function dramaTick() {
  const g = S.guild, d = S.drama; if (!g || g.roster.length < 6 || S.level < 20) return;
  if (!d.last) { d.last = S.time; return; }
  if (S.time - d.last < DRAMA_GAP()) return;
  d.last = S.time; d.n++;
  const at60 = S.level >= 60, day60 = aqDay60() || 0;
  const events = [["quit", 3], ["dkp", at60 ? 3 : 1], ["promote", at60 ? 2 : 1], ["cloth", at60 ? 2 : 1], ["ninja", 2], ["alt", 2]];
  if (at60 && d.mtGone < S.time - 25 * DAY && g.roster.some(m => m.role === "tank")) events.push(["mt", 1.5]);
  if (at60 && !d.split && day60 > 20 && g.roster.length >= 30) events.push(["split", 0.7]);
  const tot = events.reduce((a, e) => a + e[1], 0); let r = Math.random() * tot, k = events[0][0];
  for (const [e, w] of events) { r -= w; if (r <= 0) { k = e; break; } }
  DRAMA[k]();
}
const DRAMA = {
  quit() {
    const m = rosterPick(); if (!m) return;
    S.guild.roster = S.guild.roster.filter(x => x !== m); S.drama.quits = (S.drama.quits || 0) + 1;
    log(`${m.name} quits the game. The farewell post on the guild forum: "It's been an honor, ${S.guild.name}. Selling my gear, PST."`, "chat");
    gsay(m, pick(["it's been fun guys. take care", "real life calls, gtg for good. love you all", "giving my gold to the guild bank. bye"]));
    ["o7", "noooo", "/salute", "can i have your mount?"].slice(0, 2 + R(2)).forEach(t => gsay(rosterPick(), t));
  },
  dkp() {
    const a = rosterPick(), b = rosterPick(x => x !== a); if (!a || !b) return;
    const item = (pick(RAIDS).loot[0] || { name: "Bindings of the Windseeker" }).name;
    log(`A DKP fight in guild chat: ${a.name} and ${b.name} argue for an hour over who should have had the ${item}.`, "chat");
    gsay(a, `i had more DKP for [${item}], this is a joke`); gsay(b, "check the forum, i bid first"); gsay(a, "whatever, loot council is rigged");
    if (Math.random() < 0.3) { S.guild.roster = S.guild.roster.filter(x => x !== a); log(`${a.name} has left the guild.`, "chat"); }
  },
  promote() {
    const m = rosterPick(); if (!m) return;
    log(`${m.name}, the raid leader's best friend, is promoted to officer. Some of the guild rolls their eyes.`, "chat");
    gsay(m, "thanks guys, won't let you down"); gsay(rosterPick(x => x !== m), "of course they did");
  },
  cloth() {
    const m = rosterPick(x => x.cls === "Druid") || rosterPick(); if (!m) return;
    log(`${m.name} rolled Need on a cloth robe in the last raid. "It has spirit!" The officers take it back.`, "chat");
    gsay(m, "it had healing on it ok"); gsay(rosterPick(x => x !== m), "it's CLOTH");
  },
  ninja() {
    const ninja = pick(CHAT_NAMES);
    log(`${ninja} ninja-looted a blue in a pug and left the group. ${S.name} adds them to the ignore list, and so does the whole guild.`, "chat");
    gsay(rosterPick(), `everyone /ignore ${ninja}, ninja looter`);
  },
  alt() {
    const m = rosterPick(); if (!m) return;
    gsay(m, pick(["leveling my alt, ping me if you need me", "anyone want to help my alt through Deadmines?", "my alt is more fun than my main tbh"]));
  },
  mt() {
    const g = S.guild, m = rosterPick(x => x.role === "tank"); if (!m) return;
    g.roster = g.roster.filter(x => x !== m);
    S.drama.mtGone = S.time + 5 * DAY;
    log(`${m.name}, the main tank, leaves for <${g.rival.name}>. "They're further in progression." The guild has to gear a new tank: a few harder raid nights.`, "death");
    gsay(rosterPick(), "did m.name just gquit??".replace("m.name", m.name)); gsay(rosterPick(), `traitor. enjoy ${g.rival.name}`); gsay(rosterPick(), "who's tanking tonight then?");
  },
  split() {
    const g = S.guild, d = S.drama; d.split = true;
    const half = g.roster.filter(() => Math.random() < 0.35), leader = half[0];
    if (!leader) return;
    const fr = S.friends.filter(f => Math.random() < 0.5).length, goWith = fr >= S.friends.length / 2 && S.friends.length > 0 && Math.random() < 0.5;
    const newName = guildName();
    if (goWith) {
      log(`The guild splits: ${leader.name} and ${half.length} others leave to found <${newName}>, and ${S.name} goes with them and their friends.`, "death");
      g.name = newName; g.roster = half; g.dkp = Math.round((g.dkp || 0) / 2);
    } else {
      g.roster = g.roster.filter(x => !half.includes(x));
      log(`The guild splits: ${leader.name} and ${half.length} others leave to found <${newName}>. ${S.name} stays with <${g.name}>. The raids fill up with pugs for a while.`, "death");
    }
    gsay(rosterPick(), "well that was a fun night on the forums"); gsay(rosterPick(), "we'll recruit, we'll be fine");
  },
};

// ---------- raid nights ----------
// the invites: sometimes late (people missing), and now and then nobody shows: the night is called off
function dramaRaidStart(q, dn) {
  if (!S.guild) return;
  // a new raid: the guild waits on the members who haven't finished the attunement yet
  if (dn && ATT_CHAINS[attChain(dn) || ""] && !raidClears(dn) && Math.random() < 0.5) {
    const n = 2 + R(5);
    q.push({ k: "move", d: `Waiting while ${n} guildmates finish the ${dn} attunement`, t: sec(90) });
    log(`<${S.guild.name}> waits on ${n} members who still aren't attuned to ${dn}. "Hurry up, we're all at the door."`, "chat");
    gsay(rosterPick(), pick(["almost done with the attunement, 5 min", "anyone have a spare Blackhand's Command?", "i'm at the last step, i swear"]));
    return;
  }
  if (Math.random() < 0.12) {
    const n = 2 + R(4);
    q.push({ k: "move", d: `Waiting at the stone: ${n} people are late for the invite`, t: sec(60) });
    gsay(rosterPick(), pick(["where is everyone?", `still missing ${n}, inv in 10`, "can someone summon the late ones"]));
  }
}
const dramaCalloff = () => !!S.guild && raidClears("Molten Core") > 0 && Math.random() < 0.03 && (log(`Raid called off: only 31 online. "Same time tomorrow, and this time show up." Pugs and farming instead.`, "chat"), gsay(rosterPick(), "raid's off, not enough people"), true);
// the third wipe: the guild leader on voice chat
function dramaYell(boss) {
  const d = S.drama; if (!S.guild || Math.random() < 0.4 || S.time - (d.yell || 0) < 3 * DAY) return;
  d.yell = S.time; d.yells = (d.yells || 0) + 1;
  log(`The guild leader on Ventrilo after the third wipe on ${boss}: ${pick(["\"ARE YOU GUYS EVEN LISTENING? DOTS! DOTS! STOP STANDING IN THE FIRE!\"", S.faction === "Horde" ? "\"Who is that shaman with the Flametongue totem? FIRE RESISTANCE TOTEM, PEOPLE.\"" : "\"Paladins, Fire Resistance Aura. FIRE. RESISTANCE. AURA.\"", "\"I have been raid leading for six hours. SIX HOURS.\" A long silence.", "\"Tanks, where are you? Healers, why is everyone dead?\" Somebody unmutes to laugh."])}`, "chat");
  gsay(rosterPick(), "someone's mad"); gsay(rosterPick(), "it was the healers");
}
// the hero's loot: now and then the loot council hands it to someone else
function dramaLoot(it) {
  if (!S.guild || !S.dg || !S.dg.raid || Math.random() >= 0.05) return false;
  const m = rosterPick(); if (!m) return false;
  S.drama.lc = (S.drama.lc || 0) + 1;
  log(`${it.name} drops, and the loot council gives it to ${m.name}, the raid leader's friend. ${S.name} had the most DKP for it.`, "death");
  gsay(m, "ty!"); gsay(rosterPick(x => x !== m), "loot council strikes again");
  return true;
}
// while the main tank is gone: a little harder (raidq wipeChance)
const dramaWipe = () => S.drama && S.time < S.drama.mtGone ? 1.12 : 1;
