// The Scourge Invasion: the run-up to Naxxramas. Necropolises hang over three zones at a time (out of six), the
// Scourge attacks towns, cultists and shadowy figures turn up in the capitals. At 60, invasion trips between raid nights
// (a free evening, or every one with the goal): a few fights under a necropolis, now and then a Shadow of Doom, for
// Necrotic Runes and Argent Dawn reputation. The runes buy the Argent Dawn's Blessed set (worn for Naxxramas: fewer
// wipes there, like the resistance sets), the reputation makes the Naxxramas attunement cheaper (free at exalted), and
// a trip counts toward its Argent Dawn step. It starts with the Ahn'Qiraj war effort (or SI_LATE days after 60) and
// ends with the hero's first night in Naxxramas: the necropolises pull back to the one over the Eastern Plaguelands.
"use strict";

const SI_ZONES = [["Eastern Plaguelands", "Light's Hope Chapel"], ["Western Plaguelands", "Chillwind Camp"], ["Winterspring", "Everlook"], ["Azshara", "Talrendis Point"], ["Tanaris", "Gadgetzan"], ["Burning Steppes", "Morgan's Vigil"]];
const SI_MOBS = ["Skeletal Shocktrooper", "Ghoul Berserker", "Spectral Soldier", "Skeletal Trooper", "Spectral Spirit"];
const SI_RARES = ["Lumbering Horror", "Spirit of the Damned", "Bone Witch"];
const SI_LATE = 50;          // days after 60 the invasion starts at the latest
const SI_PREF = 0.15, SI_GOAL_PREF = 0.6; // with the goal        // a free evening without the goal goes to the invasion this often
// Argent Dawn reputation: in S.fac with the other factions (factions.js); S.si.rep is the old count, kept for old saves
const adRank = () => facRank("Argent Dawn");
const adName = () => facRankName("Argent Dawn");
// the Blessed sets, one per armor type: [piece, slot, runes, rank needed]
const SI_SET = {
  Plate: ["Blessed Battlegear of Undead Slaying", [["Blessed Breastplate of Undead Slaying", "Chest", 55, 3], ["Blessed Bracers of Undead Slaying", "Wrist", 25, 2], ["Blessed Gauntlets of Undead Slaying", "Hands", 40, 2]]],
  Mail: ["Undead Slayer's Blessed Armor", [["Blessed Hauberk of Undead Slaying", "Chest", 55, 3], ["Blessed Wristguards of Undead Slaying", "Wrist", 25, 2], ["Blessed Gloves of Undead Slaying", "Hands", 40, 2]]],
  Leather: ["Blessed Garb of the Undead Slayer", [["Blessed Tunic of Undead Slaying", "Chest", 55, 3], ["Blessed Bracers of Undead Cleansing", "Wrist", 25, 2], ["Blessed Handwraps of Undead Slaying", "Hands", 40, 2]]],
  Cloth: ["Blessed Regalia of Undead Cleansing", [["Blessed Robe of Undead Cleansing", "Chest", 55, 3], ["Blessed Wristguards of Undead Cleansing", "Wrist", 25, 2], ["Blessed Gloves of Undead Cleansing", "Hands", 40, 2]]],
};
const siSet = () => SI_SET[armorType(60)];
const siPieces = () => siSet()[1].filter(p => S.si.set.includes(p[0])).length;
const newSi = () => ({ start: null, end: null, zones: [], prog: {}, runes: 0, rep: 0, set: [], trips: 0, kills: 0, doom: 0, freed: 0, lastLine: 0 });
const siOn = () => S.si.start != null && S.si.end == null;
// the Blessed set in Naxxramas: each piece takes a little off the wipe chance (group.js)
const siWipe = dn => dn === "Naxxramas" ? 1 - 0.04 * siPieces() : 1;
// the Argent Dawn's price for the Naxxramas attunement (raidq.js)
const naxxFee = () => [600000, 600000, 600000, 300000, 0][adRank()];
const siPick = () => S.level >= 60 && siOn() && Math.random() < (hasGoal("si") ? SI_GOAL_PREF : SI_PREF) ? SI_ROW : null;
const SI_ROW = { name: "The Scourge Invasion", si: true };

// ---------- the timeline ----------
// after every task: start, the necropolises moving on, the attacks, the end
function siTick() {
  const s = S.si; if (S.level < 60) return;
  if (s.start == null) {
    const d = aqDay60();
    if (!(S.aq.start != null || (d != null && d >= SI_LATE))) return;
    s.start = S.time; s.zones = siShuffle().slice(0, 3); s.zones.forEach(z => s.prog[z] = 0);
    log(`The Scourge Invasion begins! Necropolises appear over ${s.zones.join(", ")}. The Argent Dawn calls everyone to arms: Necrotic Runes for every Scourge champion slain.`, "ach");
    return;
  }
  if (s.end != null) return;
  if (S.lock.Naxxramas || S.dungeons.includes("Naxxramas")) {
    s.end = S.time;
    if (hasGoal("si")) { S.goals = S.goals.filter(g => g.id !== "si"); log(`Goal dropped: the invasion is over.`, "quest"); }
    log(`The necropolises pull back from the world and gather over the Eastern Plaguelands: Naxxramas. The invasion is over; Kel'Thuzad waits inside.`, "ach");
    return;
  }
  if (S.time - s.lastLine > (8 + Math.random() * 16) * HOUR) { s.lastLine = S.time; siLine(); }
}
const siShuffle = () => SI_ZONES.map(z => z[0]).sort(() => Math.random() - 0.5);
// a line from the world: an attack on a town, a low level caught under a necropolis, the capitals
function siLine() {
  const s = S.si, z = pick(s.zones), town = (SI_ZONES.find(x => x[0] === z) || [z, z])[1], cap = S.faction === "Horde" ? "Orgrimmar" : "Stormwind";
  log(pick([
    `[General] Scourge attacking ${town}! ${pick(["Need everyone!", "Shadows of Doom at the gate.", "Ghouls everywhere."])}`,
    `[General] lvl ${18 + R(10)} here, why is there a giant floating thing over ${z} and why do I keep dying`,
    `[Trade] WTS Necrotic Runes, ${4 + R(6)}g each. ${pick(["PST.", "Cheaper than farming them.", "No lowballers."])}`,
    `Skeletal Shocktroopers pour into ${cap}. The guards hold the gates.`,
    `A Cultist of the Damned whispers to the crowd in ${cap} until the guards drag him off.`,
    `A Shadowy Figure walks among the townsfolk of ${cap}. Nobody notices until the plague hits.`,
  ]), "chat");
}

// ---------- at 60: the trip ----------
function queueSI() {
  const q = S.queue, s = S.si, z = pick(s.zones), spot = (SI_ZONES.find(x => x[0] === z) || [z, z])[1];
  q.push({ k: "move", d: `Flying to ${z}: a necropolis hangs over ${spot}`, t: sec(70) });
  for (let i = 0, n = 6 + R(3); i < n; i++) {
    if (i && i % 2 === 0) q.push({ k: "move", d: pick([`Waiting at the Necrotic Shard for the next wave`, `Looking for a group at the shard: "LFM shard, need healer"`, `Running to the next Necrotic Shard`]), t: sec(40) });
    q.push(cqFight(`Fighting the Scourge at a Necrotic Shard in ${z}`, pick(SI_MOBS), 60 + R(2), { si: z, die: Math.random() < 0.02 }));
  }
  if (Math.random() < 0.35) q.push(cqFight(`A Shadow of Doom rises from the corpses: killing it before it kills the camp`, "Shadow of Doom", 62, { si: z, doom: true, die: Math.random() < 0.08 }));
  else if (Math.random() < 0.2) q.push(cqFight(`${pick(SI_RARES)} lumbers out of the necropolis's shadow`, pick(SI_RARES), 61, { si: z, doom: true, die: Math.random() < 0.05 }));
  q.push({ k: "siend", d: `Handing in Necrotic Runes at the Argent Dawn tent in ${z}`, t: sec(10), zone: z });
}
// a fight under the necropolis won (from cqFightEnd)
function siKill(t) {
  const s = S.si; s.kills++;
  const runes = t.doom ? 3 + R(3) : Math.random() < 0.45 ? 1 : 0;
  s.runes += runes; s.prog[t.si] = (s.prog[t.si] || 0) + (t.doom ? 12 : 5);
  facGain("Argent Dawn", t.doom ? 200 : 40);
  if (t.mob === "Shadow of Doom") s.doom++;
  if (runes) log(`${runes} Necrotic Rune${runes > 1 ? "s" : ""}.`, "loot3");
}
// the trip's end: reputation for the runes, the necropolis maybe destroyed, the attunement step, the set
function siEnd(t) {
  const s = S.si; s.trips++;
  facGain("Argent Dawn", 150 + R(100));
  const z = t.zone;
  if ((s.prog[z] || 0) >= 100 && s.zones.includes(z)) {
    s.freed++; delete s.prog[z];
    const next = siShuffle().find(x => !s.zones.includes(x));
    s.zones = s.zones.filter(x => x !== z).concat(next); s.prog[next] = 0;
    log(`The Necrotic Shards around ${z} are broken and the necropolis falls silent. A new one appears over ${next}.`, "ach");
  } else log(`The Argent Dawn counts ${S.name}'s runes (${s.runes} in the bags). The necropolis over ${z}: ${Math.min(99, s.prog[z] || 0)}% of its shards broken.`, "quest");
  // the Naxxramas attunement's Argent Dawn step
  const k = attChain("Naxxramas");
  if (k && attWorking(k) && attCur(k)[0] === "run" && /Argent Dawn/.test(attCur(k)[1])) attCount(k, attCur(k)[3]);
  siBuy();
}
// the quartermaster: the next piece of the Blessed set the runes and the reputation allow
function siBuy() {
  const s = S.si, [setName, pieces] = siSet();
  pieces.forEach(([name, slot, runes, rank]) => {
    if (s.set.includes(name) || s.runes < runes || adRank() < rank) return;
    s.runes -= runes; s.set.push(name);
    const n = siPieces();
    log(`Bought ${name} from the Argent Quartermaster for ${runes} Necrotic Runes${n === pieces.length ? `: the ${setName} is complete` : ` (${n} of ${pieces.length} of the ${setName})`}. Kept in the bags for Naxxramas.`, "loot4");
  });
  // spare runes, once the set is done: the Argent Dawn's oils and stones for Naxxramas
  if (siPieces() >= pieces.length && s.runes >= 20) { s.runes -= 20; log(`Traded 20 Necrotic Runes for ${isCaster() || heroRole() === "heal" ? "Blessed Wizard Oil" : "Consecrated Sharpening Stones"}, for Naxxramas.`, "gold"); }
}
const SI_FINISH = { siend(t) { siEnd(t); } };

// ---------- goal and the Quests tab ----------
function siGoals(out) {
  if (S.level < 60 || !siOn()) return;
  const n = siSet()[1].length;
  out.push({ id: "si", name: "The Scourge Invasion", what: `Fight the invasion every free evening: Necrotic Runes and Argent Dawn reputation for the ${siSet()[0]} (worn in Naxxramas: fewer wipes), and a cheaper Naxxramas attunement (free at exalted). Ends when Naxxramas opens.`,
    prog: () => [siPieces(), n], txt: () => `${siPieces()} of ${n} pieces · ${S.si.runes} runes · ${adName()} with the Argent Dawn`, done: () => siPieces() >= n });
}
function siRender() {
  const s = S.si; if (S.level < 60 || !siOn()) return "";
  return `<li class="qhead">The Scourge Invasion</li><li class="goal"><div class="gl"><b>Necropolises over ${esc(s.zones.join(", "))}</b><small>${s.trips} trip${s.trips === 1 ? "" : "s"}, ${s.kills} Scourge slain, ${s.freed} necropolis${s.freed === 1 ? "" : "es"} silenced · ${s.runes} Necrotic Runes · ${adName()} with the Argent Dawn (${facPts("Argent Dawn").toLocaleString()}) · ${siPieces()} of 3 Blessed pieces</small></div></li>`;
}
