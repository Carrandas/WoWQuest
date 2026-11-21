// Goals at 60: the player picks a few (or lets the hero pick), and the time between raid nights goes to whatever
// moves them along: farming for the epic mount, Stratholme for the Baron's horse, Winterspring for the Frostsaber,
// Runecloth for a reputation. A goal reached is a chronicle moment, and the next one takes its place.
"use strict";

const GOAL_SLOTS = 4, GOAL_AUTO = 3; // goals at once; how many the hero keeps when it picks them itself
const GOAL_GOLD = 20000000;          // "A fat purse": 2000g in the bank, after the epic mount
const GOAL_FARM = 0.3;               // gold goals: the chance to farm between dungeons even with 500g in the bank
// every goal this hero could have right now: { id, name, what (what it takes, roughly how long), need (why it
// can't be picked yet, or null), prog() → [now, of] (of null: no bar), txt() (progress in words), done() }
function goalDefs() {
  const out = [], bk = b => S.bossKills[b] || 0, g = c => Math.floor(c / 10000);
  if (S.mount < 2) out.push({ id: "epic", name: "Epic mount", what: `Farm gold between raid nights for epic riding and a ${race().epic}. Two to six weeks.`,
    prog: () => [Math.min(S.money, EPIC_MOUNT_COST), EPIC_MOUNT_COST], txt: () => `${g(S.money)} of ${g(EPIC_MOUNT_COST)}g`, done: () => S.mount >= 2 });
  else out.push({ id: "gold", name: "A fat purse", what: "Keep farming after the epic mount until there's 2000 gold in the bank. A few weeks.",
    prog: () => [Math.min(S.money, GOAL_GOLD), GOAL_GOLD], txt: () => `${g(S.money)} of ${g(GOAL_GOLD)}g`, done: () => S.money >= GOAL_GOLD });
  // the raids: the next tiers whose way in is open (the previous tier cleared once)
  RAIDS.filter(r => !raidClears(r.name) && (!RAID_INFO[r.name].need || raidClears(RAID_INFO[r.name].need))).forEach(r => {
    const i = RAID_INFO[r.name], gs = Math.round(gearScore()), down = () => r.bosses.filter(b => bk(b)).length;
    const why = [gs < i.gs && `gear score ${i.gs} (yours: ${gs})`, i.need && raidClears(i.need) < (i.needClears || 1) && `${i.needClears} clears of ${i.need}`, !attuned(r.name) && `the attunement (${S.runs60} of ${i.attune[0]} dungeon clears)`].filter(Boolean);
    out.push({ id: "raid:" + r.name, name: `Clear ${r.name}`, what: `Raid nights go to ${r.name} first: kill every boss in ${r.name} in one lockout. ${why.length ? "Needs " + why.join(" and ") + " first, then " : ""}${r.bosses.length > 4 ? "weeks" : "a few nights"}.`,
      prog: () => [down(), r.bosses.length], txt: () => `${down()} of ${r.bosses.length} bosses killed`, done: () => raidClears(r.name) > 0 });
  });
  if (!hasMount("Deathcharger's Reins")) out.push({ id: "baron", name: "Deathcharger's Reins", what: "Run Stratholme again and again for Baron Rivendare's horse. One in a hundred: a week, or months.",
    prog: () => [0, null], txt: () => `${bk("Baron Rivendare")} Baron kills`, done: () => hasMount("Deathcharger's Reins") });
  if (!hasMount("Swift Zulian Tiger") && !hasMount("Swift Razzashi Raptor")) out.push({ id: "zg", name: "A Zul'Gurub mount", what: "Raid Zul'Gurub every reset for Thekal's tiger or Mandokir's raptor. One in a hundred each.",
    need: gearScore() < RAID_INFO["Zul'Gurub"].gs ? `Needs gear score ${RAID_INFO["Zul'Gurub"].gs} (yours: ${Math.round(gearScore())})` : null,
    prog: () => [0, null], txt: () => `${bk("High Priest Thekal") + bk("Bloodlord Mandokir")} kills of Thekal and Mandokir`, done: () => hasMount("Swift Zulian Tiger") || hasMount("Swift Razzashi Raptor") });
  if (S.faction === "Alliance" && !hasMount("Winterspring Frostsaber")) out.push({ id: "saber", name: "Winterspring Frostsaber", what: "Quest in Winterspring day after day for the Wintersaber Trainers. About ten days.",
    prog: () => [S.wintersaber || 0, WINTERSABER_EXALTED], txt: () => `${S.wintersaber || 0} of ${WINTERSABER_EXALTED} quests`, done: () => hasMount("Winterspring Frostsaber") });
  otherRaces().forEach(o => { const c = RACE_REP[o], left = RUNECLOTH_EXALTED - (S.rep[c] || 0); if (left <= 0) return;
    out.push({ id: "rep:" + c, name: `Exalted with ${c}`, what: `Farm Runecloth and hand it in for ${c} twice as often, for the ${RACES[o].mount}. About ${Math.max(1, Math.round(left * GOAL_TURNIN / DAY))} days of play.`,
      prog: () => [Math.min(S.rep[c] || 0, RUNECLOTH_EXALTED), RUNECLOTH_EXALTED], txt: () => `${S.rep[c] || 0} of ${RUNECLOTH_EXALTED} turn-ins`, done: () => (S.rep[c] || 0) >= RUNECLOTH_EXALTED }); });
  // PvP (only the player picks these): a rank to reach (the next one with a reward, the war mount at 11, the top), the Alterac Valley mount
  const pneed = pvpOpen() ? null : "Needs the raid attunements first (level 60 dungeon clears)", held = S.goals.filter(g => g.id.startsWith("pvp:")).map(g => +g.id.slice(4));
  const ranks = [...new Set([[3, 7, 8, 10, 12, 13].find(r => r > S.pvp.best), 11, 14, ...held])].filter(r => r && (r > S.pvp.best || held.includes(r))).sort((a, b) => a - b);
  const weeks = r => r >= 14 ? "About two months of battlegrounds" : r >= 11 ? "A month or so" : r >= 8 ? "A few weeks" : "A week or two";
  ranks.forEach(r => out.push({ id: "pvp:" + r, name: `PvP rank ${r}: ${rankName(r)}`, what: `Battlegrounds most evenings without a raid, for ${r === 11 ? "the war mount" : r === 14 ? "the highest rank and its weapon" : "the rank's gear"}. Ranks come with the weekly update. ${weeks(r)}.`, need: pneed,
    prog: () => [Math.min(S.pvp.rp, RANK_RP[r]), RANK_RP[r]], txt: () => `${S.pvp.rp.toLocaleString()} of ${RANK_RP[r].toLocaleString()} rank points`, done: () => S.pvp.best >= r }));
  if (!hasMount(AV_MOUNT[S.faction])) out.push({ id: "avmount", name: AV_MOUNT[S.faction], what: `Alterac Valley again and again, until exalted with the ${AV_FACTION[S.faction]}. Many weeks.`, need: pneed,
    prog: () => [Math.min(S.pvp.av, AV_EXALTED), AV_EXALTED], txt: () => `${S.pvp.av.toLocaleString()} of ${AV_EXALTED.toLocaleString()} reputation`, done: () => hasMount(AV_MOUNT[S.faction]) });
  const pets = Object.keys(S.minipets).length, aim = Math.min(MINIPETS.length, Math.max(10, Math.ceil((pets + 1) / 5) * 5));
  if (pets < MINIPETS.length) out.push({ id: "pets:" + aim, name: `Collect ${aim} minipets`, what: "Buy every pet the vendors have, run Lower Blackrock Spire for the Smolderweb and the Worg Pup, hunt whelps in Winterspring. Luck decides.",
    prog: () => [Math.min(Object.keys(S.minipets).length, aim), aim], txt: () => `${Object.keys(S.minipets).length} of ${aim} minipets`, done: () => Object.keys(S.minipets).length >= aim });
  return out.map(d => ({ need: null, ...d }));
}
const GOAL_TURNIN = 6 * HOUR;  // a Runecloth turn-in every 6 hours of play for a reputation goal (12 without)
const goalById = id => goalDefs().find(d => d.id === id);
const hasGoal = id => S.level >= 60 && S.goals.some(g => g.id === id);
const goalWith = pre => S.level >= 60 ? (S.goals.find(g => g.id.startsWith(pre)) || null) : null; // the first goal of a kind (rep:, raid:)

// ---------- picking and finishing ----------
function addGoal(id, byHero) {
  const d = goalById(id); if (!d || hasGoal(id) || S.goals.length >= GOAL_SLOTS) return;
  S.goals.push({ id, at: S.time });
  log(byHero ? `${S.name} sets a new goal: ${d.name}.` : `New goal: ${d.name}.`, "quest");
}
// the hero's own picks: the next raid, then whatever takes its fancy. Never PvP (that's the player's call) or the gold goals: left alone, the hero
// saves for the epic mount at the usual pace (weeks); a player who picks it gets there a few days sooner
function autoGoals() {
  const all = goalDefs().filter(d => !d.need && !hasGoal(d.id) && !S.goalsDone[d.id] && d.id !== "epic" && d.id !== "gold" && !d.id.startsWith("pvp:") && d.id !== "avmount");
  while (S.goals.length < GOAL_AUTO) {
    const left = all.filter(d => !hasGoal(d.id)); if (!left.length) break;
    const fun = left.filter(x => !x.id.startsWith("raid:"));
    const d = (!goalWith("raid:") && left.find(x => x.id.startsWith("raid:"))) || (fun.length ? pick(fun) : left[0]);
    addGoal(d.id, true);
  }
}
// after every task: goals reached, and the hero filling its own slots
function goalCheck() {
  if (S.level < 60) return;
  const defs = goalDefs();
  S.goals = S.goals.filter(g => {
    const d = defs.find(x => x.id === g.id);
    if (d && !d.done()) return true;
    S.goalsDone[g.id] = stamp();
    log(`Goal reached: ${d ? d.name : goalName(g.id)}! (${fmtTime(S.time - g.at)} after setting it)`, "ach");
    return false;
  });
  if (S.goalAuto) autoGoals();
}
// a goal's name even when it's no longer on offer (reached, or the mount bought another way)
const goalName = id => { const d = goalById(id); return d ? d.name : id.replace(/^raid:/, "Clear ").replace(/^rep:/, "Exalted with ").replace(/^pets:(\d+)/, "Collect $1 minipets")
  .replace(/^epic$/, "Epic mount").replace(/^gold$/, "A fat purse").replace(/^baron$/, "Deathcharger's Reins").replace(/^zg$/, "A Zul'Gurub mount").replace(/^saber$/, "Winterspring Frostsaber").replace(/^pvp:(\d+)/, "PvP rank $1").replace(/^avmount$/, "Alterac Valley mount"); };

// ---------- what goals change ----------
// the next endgame zone: Winterspring for the Frostsaber
const goalZone = () => hasGoal("saber") ? "Winterspring" : null;
// farming between dungeons: gold for the mount or the purse, Runecloth for a reputation; null: farm as usual
function goalFarm(z) {
  if (goalWith("rep:") && S.prof && (S.prof.mats[MATS.Cloth[4]] || 0) < 20) return { d: `Farming Runecloth in ${z}`, cloth: true }; // only when short of a stack
  if ((hasGoal("epic") || hasGoal("gold")) && Math.random() < GOAL_FARM) return { d: null };
  return null;
}
// on a raid night, the raid to run of the open ones (null: pick as usual): the goal's raid
function goalRaid(open) {
  const rg = goalWith("raid:"), want = rg && open.find(r => "raid:" + r.name === rg.id);
  return want || (hasGoal("zg") && open.find(r => r.name === "Zul'Gurub")) || null;
}
// the dungeon to run when it's not a raid night (null: any level 60 dungeon)
function goalDungeon() {
  if (hasGoal("baron") && Math.random() < 0.6) return instanceRow("Stratholme");
  if (goalWith("pets:") && Math.random() < 0.4) return instanceRow("Lower Blackrock Spire");
  return null;
}

// ---------- the quests tab ----------
// at 60 the goals sit on top of the quests tab (the quests are drying up by then): a heading, a row per goal, the picker
function renderGoals() {
  if (S.level < 60) return "";
  const n = Object.keys(S.goalsDone).length;
  return `<li class="qhead">Goals <small>${S.goals.length} of ${GOAL_SLOTS}${n ? ` · ${n} reached` : ""}</small></li>` + S.goals.map(g => {
    const d = goalById(g.id); if (!d) return "";
    const [a, b] = d.prog();
    return `<li class="goal"><div class="gl"><b>${esc(d.name)}</b><small>${esc(d.txt())}</small>${b ? `<div class="bar"><i style="width:${Math.round(100 * a / b)}%"></i></div>` : ""}</div><button type="button" class="gx" data-gx="${esc(g.id)}" title="Drop this goal" aria-label="Drop ${esc(d.name)}">×</button></li>`;
  }).join("") + (S.goals.length < GOAL_SLOTS ? `<li class="gaddrow"><button type="button" class="ghost" data-gadd="1">+ pick a goal</button>${S.goalAuto ? `<small>${esc(S.name)} picks their own until you do</small>` : ""}</li>` : "")
    + `<li class="qhead">Quests</li>`;
}
function goalClick(b) { // clicks in the quests tab: drop a goal, open the picker
  if (b.dataset.gx) { S.goals = S.goals.filter(g => g.id !== b.dataset.gx); S.goalAuto = false; dirty = true; return; }
  if (b.dataset.gadd) goalPicker();
}
// the list to pick from: what each goal takes, the ones that need something first greyed out
function goalPicker() {
  const list = goalDefs().filter(d => !hasGoal(d.id) && !S.goalsDone[d.id]);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="box gpick" role="dialog" aria-modal="true" aria-labelledby="mt"><h3 id="mt">Pick a goal</h3>`
    + `<p>${S.goals.length} of ${GOAL_SLOTS} picked. Between raid nights, ${esc(S.name)} works toward them.</p><ul class="gopts">`
    + list.map(d => `<li><button type="button" data-g="${esc(d.id)}" ${d.need ? "disabled" : ""}><b>${esc(d.name)}</b><span>${esc(d.what)}</span>${d.need ? `<small>${esc(d.need)}</small>` : ""}</button></li>`).join("")
    + `</ul><div class="acts"><button type="button" class="ghost" id="gAuto">Let ${esc(S.name)} choose</button><button type="button" class="ghost" id="mNo">Close</button></div></div>`;
  document.body.appendChild(m);
  const close = () => m.remove();
  $("mNo").onclick = close;
  m.addEventListener("click", e => { if (e.target === m) close(); });
  $("gAuto").onclick = () => { S.goalAuto = true; autoGoals(); dirty = true; close(); };
  m.querySelector(".gopts").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.disabled) return; S.goalAuto = false; addGoal(b.dataset.g); dirty = true; close(); });
}
