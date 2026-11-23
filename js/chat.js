// World and guild chat, in its own panel under the chronicle: General for the zone (people looking for help, dumb
// jokes, Barrens chat), Trade in the capitals (spammed without end: WTS, WTB, enchanters, gold sellers, guild
// recruiting), LookingForGroup (dungeons for the hero's level), Guild (the roster's personalities: grats, raid
// invites and raid talk, dungeon and PvP talk, DKP, jokes, real life) and whispers (friends asking to group up, gold
// sellers, beggars). Lines come on a timer per channel and from the game's events (chatEvent: a ding, an epic, a first
// kill, a wipe, the raid forming, a friend asking to come along). Saved with the hero (S.chatLog: the last CHAT_MAX lines,
// none older than a game day),
// with its own random numbers so it never changes a gameplay roll.
"use strict";

const CHAT_MAX = 100, CHAT_AGE = DAY;
const chatLog = () => S.chatLog || (S.chatLog = []);
let chatDirty = true, chatTab = "all";
// its own random numbers (gameplay rolls stay exactly as they were)
let chatSeed = 0x2545f491;
const cr = () => { chatSeed = (chatSeed + 0x6D2B79F5) | 0; let t = Math.imul(chatSeed ^ (chatSeed >>> 15), 1 | chatSeed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const cpick = a => a[Math.floor(cr() * a.length)];
const cR = n => Math.floor(cr() * n);
const CH = { general: "General", trade: "Trade", lfg: "LookingForGroup", guild: "Guild", whisper: "Whisper" };

function chatSay(ch, who, txt, cls) {
  const L = chatLog();
  L.push({ ch, who, txt, cls: cls || null, t: S.time });
  let cut = Math.max(0, L.length - CHAT_MAX); while (cut < L.length && S.time - L[cut].t > CHAT_AGE) cut++; // old chat clears itself
  if (cut) L.splice(0, cut);
  chatDirty = true;
}

// ---------- who talks ----------
const CHAT_NAMES = ["Leeroyz", "Healbot", "Gnomercy", "Moonfiyah", "Stabbyjoe", "Frostiez", "Bubblehearth", "Lokdar", "Totemz", "Arrowyn", "Pwnstar", "Darkbladez", "Elunea", "Grimtusk", "Shamwow", "Holycow", "Legolaz", "Arthaz", "Illidank", "Thrallz", "Druidude", "Lockjaww", "Facerollz", "Huntardo", "Mageeyes", "Tankenstein", "Rogueone", "Priestly", "Kaelthaz", "Muradinn"];
// the classes of the hero's faction (no Alliance shamans, no Horde paladins)
const facClasses = () => Object.keys(CLASSES).filter(c => !(c === "Paladin" && S.faction === "Horde") && !(c === "Shaman" && S.faction === "Alliance"));
const stranger = cls => ({ name: cpick(CHAT_NAMES), cls: cls || cpick(facClasses()) });
// lines only some classes say (or never say): portals are a mage's, lockpicking is asked by anyone but a rogue
function fitWho(txt, who) {
  if (/portals/.test(txt)) return { ...who, cls: "Mage" };
  if (/lockpicking/.test(txt) && who.cls === "Rogue") return { ...who, cls: cpick(facClasses().filter(c => c !== "Rogue")) };
  if (/summon me/.test(txt) && who.cls === "Warlock") return { ...who, cls: cpick(facClasses().filter(c => c !== "Warlock")) };
  return who;
}
const capitalOf = () => S.faction === "Horde" ? "Orgrimmar" : "Ironforge";
const guildies = () => S.guild ? S.guild.roster.concat(S.friends) : [];
const guildie = () => { const g = guildies(); return g.length ? g[cR(g.length)] : null; };
const zoneNow = () => { const z = curZone(); return ZONES[z] ? z : null; };
const levelDungeons = () => { const L = S.level, ok = d => d.side === "B" || d.side === S.faction[0]; return DUNGEONS.filter(d => ok(d) && L >= d.min - 3 && L <= d.max + 2); };
const anyItem = () => { const d = cpick(DUNGEONS.concat(RAIDS)); return d.loot.length ? cpick(d.loot).name : "Runecloth"; };
const priceTxt = c => c >= 10000 ? `${Math.max(1, Math.round(c / 10000))}g` : `${Math.max(1, Math.round(c / 100))}s`;

// ---------- the channels ----------
const BARRENS = ["Where is Mankrik's wife?", "Anyone know where Mankrik's wife is?", "Chuck Norris doesn't need a mount. Azeroth moves for him.", "Chuck Norris can solo Onyxia. With a fishing pole.", "LF Mankrik's wife group", "Chuck Norris doesn't level up. The levels come to him.", "how do i get out of the barrens", "WTB a mute button for Barrens chat", "Mankrik's wife is in the Crossroads inn, with Chuck Norris", "where is the Wailing Caverns???"];
function genGeneral() {
  const z = zoneNow(); if (!z) return null;
  const zr = ZONES[z], who = stranger();
  if (z === "The Barrens" && cr() < 0.5) return [who, cpick(BARRENS)];
  const mob = cpick(zr.mobs), q = zr.quests.length ? cpick(zr.quests) : null, plural = c => c.toLowerCase() + "s";
  return [who, cpick([
    `anyone know where ${mob} spawns?`, q ? `where do i turn in "${q}"?` : `where is the flight master?`, q ? `LF group for "${q}", pst` : `LF group, anything`,
    `can someone help me kill ${mob}? keeps killing me`, `where is the ${who.cls.toLowerCase()} trainer?`, `how do i get to ${cpick(Object.keys(ZONES))}?`,
    `is there a mailbox in ${zr.hubA || zr.hubH || "town"}?`, `anyone else lagging?`, `lol`, `first!`, `what's the best class?`, `nerf ${plural(cpick(facClasses().filter(c => c !== who.cls)))}`,
    `my cat walked on my keyboard asdfjkl`, `LEEEEROY JENKINS!`, `is it worth leveling ${cpick(["skinning", "fishing", "cooking", "engineering"])}?`, `/2 is for trade, noob`, `how do i get a mount`,
    `ninja looted again in ${zr.hubA || "town"}, watch out for ${cpick(CHAT_NAMES)}`, `anyone want to duel?`, `what level is ${cpick(Object.keys(ZONES))}?`, `brb`, `wts nothing, just wanted to talk`,
  ])];
}
const GOLD_SPAM = ["W W W . G 0 L D 4 U . C 0 M ~ 100g only $9.99 ~ fast delivery!!!", "cheap gold ~ powerleveling ~ www.g0ldsh0p.c0m ~ best price", "<<< 1000g 59.99$ >>> visit W W W.WOWG0LD.C0M, code AZEROTH for 10% off"];
function genTrade() {
  if (S.loc !== "city") return null;
  const who = stranger(), mat = cpick(Object.values(MATS).flat()), item = anyItem();
  if (cr() < 0.06) return [{ name: cpick(["Ggoldseller", "Xzqwlk", "Mmoggold", "Klpxzy"]), cls: "Rogue" }, cpick(GOLD_SPAM)];
  const txt = cpick([
    `WTS [${item}] ${priceTxt(20000 + cR(400) * 1000)}, pst`, `WTB [${mat}] x20, pst with price`, `WTS [${mat}] x20, ${priceTxt(500 + cR(40) * 500)} each`, `LF enchanter for [Enchant Weapon - Crusader], my mats, tips`,
    `LF blacksmith to make [Lionheart Helm], have mats`, `WTS portals ${S.faction === "Horde" ? "to Undercity, Thunder Bluff, Orgrimmar" : "to Ironforge, Darnassus, Stormwind"}, 1g`, `LF lockpicking, have lockbox`,
    `<${S.guild ? S.guild.rival.name : "Eternal Vanguard"}> is recruiting all classes for MC and BWL! pst for info`, `WTS [Black Lotus] ${priceTxt(600000 + cR(40) * 10000)}`, `WTB [Arcanite Bar], pst`,
    `WTS [${item}] ${priceTxt(50000 + cR(200) * 1000)} or best offer`, `anyone selling [Major Healing Potion]?`, `LF alchemist with Flask of the Titans, have mats`, `WTS [${item}] BoE, cheaper than AH`,
  ]);
  return [fitWho(txt, who), txt];
}
function genLfg() {
  const ds = levelDungeons(), who = stranger(), c = who.cls.toLowerCase();
  if (S.level >= 60 && cr() < 0.4) return [who, cpick([`LFM ZG pug, need healers`, `LF more for Onyxia pug, 30/40`, `LFM UBRS, need 3 more`, `LF1M tank for Strat UD then GO`, `LF healer for Scholo`, `LFG AQ20, ${c}`])];
  if (!ds.length) return null;
  const d = cpick(ds);
  return [who, cpick([`LF1M healer ${d.abbr}`, `LFG ${d.abbr}, ${c} lvl ${clamp(S.level + cR(5) - 2, d.min, 60)}`, `LF tank for ${d.abbr} then GO`, `LF2M ${d.abbr}, need heals`, `${d.abbr} run, LF3M, pst`, `LFM ${d.abbr}, have summon`])];
}
const GUILD_LINES = {
  any: ["anyone up for {dn}?", "LF 2 more for a guild {dn} run", "morning all", "night all, gtg", "lol", "brb", "afk dinner", "back", "anyone have a spare {mat}?", "grats on the mount!", "who's online?", "anyone want to quest together?", "my internet died, sorry", "on my alt for a bit", "sry late, traffic"],
  sixty: ["{raid} tonight, invites at 7 server time", "remember your fire res for Rag", "who has the Aqual Quintessence?", "DKP standings are up on the forum", "loot council decided, deal with it", "who still needs [{epic}]?", "{n} is in DKP minus again lol", "pls bring flasks and pots tonight", "Vael is going to be a pain", "we need more healers for {raid}", "can someone summon me to Blackrock Mountain?", "anyone farming Black Lotus?", "AV anyone?", "WSG premade in 10, need 2", "made rank 10 finally", "honor grind is killing me", "{foe} are raiding Southshore again", "who's coming to {raid}?", "Ony reset tomorrow, don't forget"],
  joke: ["how many {cls}s does it take to change a lightbulb? none, they just need a buff", "Leeroy would've pulled it already", "if at first you don't succeed, blame the healer", "i'm not lagging, i'm strategically delayed", "/roll for who explains the fight to the new guy"],
};
const HELPFUL = { Mage: ["anyone need water? i have 40", "need a portal? free for guildies"], Warlock: ["need a summon? i'm at the stone", "anyone want a healthstone?"], Priest: ["need Fortitude? whisper me"], Druid: ["anyone want Mark of the Wild?"], Paladin: ["need a blessing?"], Shaman: ["need a Windfury totem in your group?"] };
const PERS_CHAT = { leeroy: ["lets just pull it", "how hard can it be"], late: ["omw, 5 min", "sry late"], pets: ["look at my new pet!", "anyone selling a Bombay Cat?"], joker: ["knock knock", "who needs a healer when you have bandages"], afk: ["brb door", "sry was afk"], helpful: ["need help with anything?"], need: ["can i roll on that? it's an upgrade", "oops, wrong button"], chatty: ["so my alt got a new sword today, let me tell you about it", "did i ever tell you about my first epic?"] };
function genGuild() {
  const g = guildie(); if (!g) return null;
  const sub = s => s.replace("{dn}", (cpick(levelDungeons()) || { abbr: "Strat" }).abbr).replace("{mat}", cpick(Object.values(MATS).flat())).replace("{raid}", cpick(["MC", "BWL", "Ony", "ZG", "AQ40", "Naxx"]).toString())
    .replace("{epic}", anyItem()).replace("{n}", (guildie() || g).name).replace("{cls}", cpick(facClasses()).toLowerCase()).replace("{foe}", foeSide());
  const r = cr();
  if (r < 0.15 && g.pers === "helpful" && HELPFUL[g.cls] && cr() < 0.6) return [g, cpick(HELPFUL[g.cls])];
  if (r < 0.15 && PERS_CHAT[g.pers]) return [g, cpick(PERS_CHAT[g.pers])];
  if (r < 0.25) return [g, sub(cpick(GUILD_LINES.joke))];
  let line = sub(cpick(S.level >= 60 && cr() < 0.65 ? GUILD_LINES.sixty : GUILD_LINES.any));
  for (let k = 0; k < 4 && /summon me/.test(line) && g.cls === "Warlock"; k++) line = sub(cpick(GUILD_LINES.any));
  return [g, line];
}
function genWhisper() {
  const r = cr();
  if (r < 0.4 && S.friends.length) { const f = cpick(S.friends), d = cpick(levelDungeons()); return [f, cpick([`hey! long time no see`, d ? `wanna run ${d.abbr} later?` : `wanna do some quests?`, `got a minute? need help with a quest`, `grats on the level!`])]; }
  if (r < 0.7) return [{ name: cpick(["Ggoldseller", "Xzqwlk", "Mmoggold"]), cls: "Rogue" }, cpick(["Hello friend! Cheap gold at W W W . G 0 L D 4 U . C 0 M", "Congratulations! You have won a free epic mount! Visit www.blizzard-giveaway.c0m to claim"])];
  return [stranger(), cpick(["can u spare some silver? :(", "can i have your old gear?", `how do i get to ${capitalOf()}`, "wanna join my guild? we're new but we have a tabard", "u selling anything?"])];
}

// ---------- replies: some lines get an answer or two, a few seconds later ----------
// [what was said, the chance of an answer, the answers ({c}: a class named in the line, {cs}: its plural, {cap}: the capital,
// {hub}: the zone's hub, {who}: the one who said it)]
const REPLIES = [
  [/trainer\?/, 0.8, ["in {cap}, ask a guard", "ask any guard, they mark it on your map", "/w me, i'll show you", "{cap}, follow the road past the bank", "you have one in your starting zone too"]],
  [/^nerf (\w+)/, 0.9, ["yeah, {cs} are so op", "l2p", "roll a {c} yourself then", "{cs} are fine, you just suck", "it's always the {cs}", "nerf {other}s first"]],
  [/spawns\?/, 0.6, ["east of {hub}", "camped by a rogue, good luck", "all over the place up north", "follow the road, can't miss them", "they respawn fast near the cave"]],
  [/turn in/, 0.6, ["back at {hub}", "check your quest log", "the guy with the yellow ?", "{hub}, next to the inn"]],
  [/^LF group for/, 0.5, ["inv", "i'm on that too, inv?", "/w me"]],
  [/help me kill/, 0.6, ["omw", "what level are you?", "sorry, too low myself", "where are you?"]],
  [/get a mount|mount$/, 0.6, ["level 40 and 90 gold", "farm, a lot", "riding trainer at 40", "save up, it's worth it"]],
  [/Wailing Caverns/, 0.8, ["southwest of the Crossroads, in the big oasis", "follow the green mist", "lol every day", "it's on your map, it's the cave"]],
  [/^how do i get to/, 0.6, ["flight path", "look at your map", "there's a boat", "follow the road and don't die"]],
  [/Mankrik's wife/, 0.8, ["south of the Crossroads, by the Grimtotem camp", "she's dead, sorry", "lol", "Chuck Norris has her", "nobody knows", "ask Mankrik"]],
  [/Chuck Norris/, 0.6, ["lol", "old", "haha", "Chuck Norris can divide by zero", "/facepalm"]],
  [/best class/, 0.8, ["hunter", "{rnd}", "the one you like", "warrior, ask me again in 2 years", "whatever's fun"]],
  [/^first!$/, 0.7, ["no", "/ignore", "lol", "second"]],
  [/lagging\?/, 0.7, ["yes", "no", "it's your internet", "server is dying", "everyone is in {cap}"]],
  [/duel\?/, 0.6, ["sure, where?", "no thanks", "outside {cap}, 5 min"]],
  [/LEEEEROY/, 0.6, ["at least i have chicken", "omg", "lol", "time's up, let's do this"]],
  [/G 0 L D|g0ld|WOWG0LD|blizzard-giveaway/i, 0.7, ["reported", "/ignore", "go away", "reported, again"]],
  [/Black Lotus\] \d+g/, 0.5, ["lol no", "AH has it cheaper", "pst", "{who} that's a rip off"]],
  [/LF enchanter/, 0.6, ["pst", "what enchant?", "/w me, 5g tip"]],
  [/is recruiting/, 0.5, ["lol, no", "/w me", "no thanks, my guild is better"]],
  [/^anyone up for|^LF 2 more|anyone want to quest/, 0.7, ["sure", "me!", "in 10", "can't, gotta go soon", "inv"]],
  [/who's online/, 0.7, ["me", "o/", "here"]],
  [/^morning all/, 0.8, ["morning", "o/", "hi", "morning!"]],
  [/^night all/, 0.8, ["night", "gn", "night!", "o/"]],
  [/tonight, invites/, 0.8, ["+1", "will be there", "can't tonight, sorry", "late, 15 min"]],
  [/how many .* lightbulb|blame the healer|strategically delayed|Leeroy would/, 0.7, ["lol", "haha", "/groan", "rofl"]],
  [/look at my new pet/, 0.6, ["cute", "where did you get it?", "nice"]],
  [/my alt/, 0.5, ["nobody cares about your alt", "lol", "what class?"]],
];
const chatPending = [];
function chatReplies(ch, who, txt) {
  if (ch === "lfg" || ch === "whisper") return;
  const r = REPLIES.find(x => x[0].test(txt)); if (!r || cr() >= r[1]) return;
  const m = txt.match(r[0]), named = m && m[1] ? m[1].replace(/s$/, "") : null, cls = facClasses().find(c => named && c.toLowerCase() === named.toLowerCase());
  const z = zoneNow(), zr = z && ZONES[z], hub = zr ? (S.faction === "Horde" ? zr.hubH || zr.hubA : zr.hubA || zr.hubH) || "town" : "town";
  const fill = s => s.replace(/\{cs\}/g, cls ? cls.toLowerCase() + "s" : "they").replace(/\{c\}/g, cls ? cls.toLowerCase() : "one").replace(/\{other\}/g, cpick(facClasses().filter(c => c !== cls)).toLowerCase())
    .replace(/\{cap\}/g, capitalOf()).replace(/\{hub\}/g, hub).replace(/\{who\}/g, who).replace(/\{rnd\}/g, cpick(facClasses()).toLowerCase());
  const used = [];
  for (let i = 0, n = cr() < 0.35 ? 2 : 1; i < n; i++) {
    let s = cpick(r[2]); for (let k = 0; k < 4 && used.includes(s); k++) s = cpick(r[2]); used.push(s);
    const by = ch === "guild" ? (guildie() || stranger()) : stranger();
    if (by.name === who) continue;
    chatPending.push({ at: S.time + (4 + cr() * 14 + i * 8) * 1000, ch, who: by.name, cls: by.cls, txt: fill(s) });
  }
}

// ---------- the timer: a line now and then per channel, more in town ----------
const CHAT_GAP = { general: [40, 130], trade: [12, 40], lfg: [100, 260], guild: [45, 150], whisper: [1200, 3600] };
const chatNext = {};
function chatTick() {
  if (!S || !S.time) return;
  const now = S.time, where = S.loc, inRaid = !!(S.dg && S.dg.raid);
  // the replies that are due (dropped if the hero has gone somewhere they can't be heard)
  for (let i = 0; i < chatPending.length;) { const p = chatPending[i]; if (p.at > now) { i++; continue; } chatPending.splice(i, 1); if (now - p.at < 5 * MIN) chatSay(p.ch, p.who, p.txt, p.cls); }
  for (const ch of Object.keys(CHAT_GAP)) {
    if (chatNext[ch] == null || chatNext[ch] - now > 4 * HOUR) { chatNext[ch] = now + (CHAT_GAP[ch][0] + cr() * (CHAT_GAP[ch][1] - CHAT_GAP[ch][0])) * 1000; continue; }
    if (now < chatNext[ch]) continue;
    // how busy each channel is where the hero is (raids: only the guild talks, and less)
    let gap = CHAT_GAP[ch], mute = false;
    if (inRaid && ch !== "guild" && ch !== "whisper") mute = true;
    if (where === "dungeon" && (ch === "general" || ch === "trade")) mute = true;
    if (ch === "guild" && S.level >= 60) gap = [gap[0] * 0.7, gap[1] * 0.7];
    chatNext[ch] = now + (gap[0] + cr() * (gap[1] - gap[0])) * 1000 * (where === "city" || ch === "guild" ? 1 : 1.6);
    if (mute) continue;
    const line = ch === "general" ? genGeneral() : ch === "trade" ? genTrade() : ch === "lfg" ? genLfg() : ch === "guild" ? genGuild() : genWhisper();
    if (line) { chatSay(ch, line[0].name, line[1], line[0].cls); chatReplies(ch, line[0].name, line[1]); }
    if (ch === "trade" && line && cr() < 0.3) chatNext[ch] = now + 3000; // the spam comes in bursts
  }
}

// ---------- the game's events ----------
function chatEvent(kind, x) {
  if (!S) return;
  const g = () => guildie(), grats = () => cpick(["grats!", "gz", "grats :)", "GZ!!", "nice, grats", "grats mate"]);
  const several = (n, f) => { const said = []; for (let i = 0; i < n; i++) { const m = g(); if (!m) continue; let s = f(); for (let k = 0; k < 4 && said.includes(s); k++) s = f(); said.push(s); chatSay("guild", m.name, s, m.cls); } };
  if (kind === "level" && S.guild) several(x === 60 ? 4 : cR(3), () => x === 60 ? cpick(["GRATS ON 60!!", "welcome to 60!", "grats! now the real game starts", "gz, see you in MC"]) : grats());
  if (kind === "epic" && S.guild) several(2 + cR(2), grats);
  if (kind === "firstkill" && S.guild) several(4, () => cpick(["GG!!!", "finally!", "grats all!", "WOOOO", `${x} down!`, "gg, screenshot!"]));
  if (kind === "wipe" && S.guild && S.dg && S.dg.raid) several(2 + cR(2), () => cpick(["rez pls", "who pulled?", "release and run back", "healers oom?", "again, we got this", "wipe it", "nice threat, tank"]));
  if (kind === "raidinv" && S.guild) { const o = g(); if (o) chatSay("guild", o.name, `Invites going out for ${x}, be at the stone in 10`, o.cls); several(2, () => cpick(["inv pls", "+1 inv", "omw", "can i get a summon?"])); }
  if (kind === "lfg") chatSay("lfg", S.name, x, S.cls);
  if (kind === "whisper") chatSay("whisper", x.name, x.txt, x.cls);
}

// ---------- the panel ----------
const CHAT_TABS = [["all", "All"], ["guild", "Guild"], ["general", "General"], ["trade", "Trade"], ["lfg", "LFG"], ["whisper", "Whispers"]];
const chatPanel = () => `<div class="chatbox sec" data-fold-box="chat"><div class="chh"><span class="lbl">Chat</span><div class="seg" id="chTabs">${CHAT_TABS.map(([k, n]) => `<button type="button" data-ch="${k}" aria-pressed="${k === chatTab}">${n}</button>`).join("")}</div>${foldBtn("chat", "chat")}</div><ul class="chat" id="chat"></ul></div>`;
let chatShown = null; // the log on screen (another save loaded: redraw)
function renderChat() {
  if (!chatDirty && chatShown === chatLog()) return;
  chatShown = chatLog();
  const el = $("chat"); if (!el) return;
  chatDirty = false;
  const rows = chatLog().filter(l => chatTab === "all" || l.ch === chatTab).slice(-60);
  const nameCol = l => l.cls && CLASSES[l.cls] ? ` style="color:${CLASSES[l.cls].color}"` : "";
  el.innerHTML = rows.map(l => l.ch === "whisper"
    ? `<li class="c-whisper"><b${nameCol(l)}>[${esc(l.who)}]</b> whispers: ${esc(l.txt)}</li>`
    : `<li class="c-${l.ch}">[${l.ch === "general" || l.ch === "trade" ? `${l.ch === "general" ? "1" : "2"}. ${CH[l.ch]}${l.ch === "general" && zoneNow() ? " - " + esc(zoneNow()) : l.ch === "trade" ? " - City" : ""}` : l.ch === "lfg" ? "4. LookingForGroup" : CH[l.ch]}] <b${nameCol(l)}>[${esc(l.who)}]</b>: ${esc(l.txt)}</li>`).join("") || `<li class="cempty">Nobody's talking.</li>`;
  el.scrollTop = el.scrollHeight;
}
function chatSetup() {
  onButton("chTabs", b => { chatTab = b.dataset.ch; document.querySelectorAll("#chTabs button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); chatDirty = true; renderChat(); });
}
