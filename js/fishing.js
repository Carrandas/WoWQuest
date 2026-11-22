// Fishing, the third secondary skill (S.fish, its own skill and cap, not in S.prof): now and then off a pier on a city
// visit while levelling, fishing trips at 60 on a free evening (or every one with a goal), the skill to 300 (the trainer
// up to 150, Old Man Heming's Expert Fishing book in Booty Bay to 225, Nat Pagle's four fish for Artisan), the legends
// in the capitals (Old Ironjaw in Ironforge, Old Crafty in Orgrimmar), and the Stranglethorn Fishing Extravaganza on
// Sunday afternoons: the first to bring Riggle Bassbait 40 Speckled Tastyfish wins the Arcanite Fishing Pole.
"use strict";

// waters by skill: [skill needed, Alliance zone, Horde zone, the fish]
const FISH_WATERS = [
  [0, "Elwynn Forest", "Durotar", ["Raw Brilliant Smallfish", "Raw Slitherskin Mackerel"]],
  [50, "Loch Modan", "The Barrens", ["Raw Longjaw Mud Snapper", "Raw Bristle Whisker Catfish"]],
  [130, "Stranglethorn Vale", "Stranglethorn Vale", ["Raw Rockscale Cod", "Raw Mithril Head Trout", "Oily Blackmouth"]],
  [205, "Tanaris", "Feralas", ["Raw Spotted Yellowtail", "Raw Glossy Mightfish", "Firefin Snapper", "Large Raw Mightfish"]],
  [255, "Azshara", "Winterspring", ["Raw Nightfin Snapper", "Raw Sunscale Salmon", "Raw Whitescale Salmon", "Stonescale Eel", "Raw Redgill"]],
];
const FISH_PRICE = [30, 100, 300, 600, 900]; // copper per fish sold, by water
// Nat Pagle's quest for Artisan Fishing: the four fish and where they bite
const NAT_FISH = [["Feralas Ahi", "Feralas", "the Verdantis River"], ["Misty Reed Mahi Mahi", "Swamp of Sorrows", "the Misty Reed Strand"], ["Sar'theris Striker", "Desolace", "the Sar'theris Strand"], ["Savage Coast Blue Sailfin", "Stranglethorn Vale", "the Savage Coast"]];
const FISH_LEGEND = () => S.faction === "Horde" ? ["Old Crafty", "Orgrimmar"] : ["Old Ironjaw", "Ironforge"];
const FISH_PREF = 0.08;
const newFish = (L = 1) => ({ sk: L >= 10 ? 1 : 0, book: false, nat: 0, natGot: [], caught: 0, legend: false, fx: { tries: 0, wins: 0, wk: null, best: null }, pole: null });
const fishCap = () => S.level < 5 ? 0 : S.level < 10 ? 75 : !S.fish.book ? 150 : S.fish.nat < 2 ? 225 : 300;
const fishBonus = () => S.fish.pole ? 35 : 0; // the Arcanite Fishing Pole
const fishWater = () => { const sk = S.fish.sk + fishBonus(); return FISH_WATERS.reduce((a, w, i) => sk >= w[0] ? i : a, 0); };
const fishZone = i => FISH_WATERS[i][S.faction === "Horde" ? 2 : 1];
// a skill point per catch: often at first, rarely near the top
const fishUpChance = sk => sk < 75 ? 1 : sk < 150 ? 0.55 : sk < 225 ? 0.3 : 0.18;
function fishUp() {
  const f = S.fish; if (f.sk >= fishCap() || Math.random() >= fishUpChance(f.sk)) return;
  f.sk++;
  if (f.sk % 25 === 0) log(`Fishing skill increased to ${f.sk}.`, "spell");
}

// ---------- while levelling: off a pier on a city visit ----------
function fishCity(q, where) {
  if (S.level < 10 || S.level >= 60 || Math.random() >= 0.1) return;
  q.push({ k: "fish", d: `Fishing off the pier in ${where} while waiting for the boat`, t: sec(12), n: 4, w: Math.min(fishWater(), 1) });
}

// ---------- at 60: the trip ----------
// the Extravaganza first (Sunday, 2 to 4 in the afternoon), then a trip on a free evening
const fishDay = () => Math.floor(S.time / DAY);
const fxNow = () => { const h = (S.time % DAY) / HOUR; return fishDay() % 7 === 6 && h >= 12 && h < 15.5; };
const FISH_ROW = { name: "Fishing", fish: true }, FX_ROW = { name: "Stranglethorn Fishing Extravaganza", fish: true, fx: true };
// the Extravaganza goes before a raid night (pickDungeon asks first)
function fxPick() {
  const f = S.fish, wk = Math.floor(fishDay() / 7);
  if (S.level < 60 || !fxNow() || f.fx.wk === wk || f.sk < 150) return null;
  if (!hasGoal("angler") && Math.random() >= 0.5) { f.fx.wk = wk; return null; } // not this Sunday
  return FX_ROW;
}
function fishPick() {
  if (S.level < 60) return null;
  return Math.random() < (hasGoal("fish") || hasGoal("legend") ? 0.6 : FISH_PREF) ? FISH_ROW : null;
}
function queueFish(row) {
  if (row.fx) return queueFX();
  const q = S.queue, f = S.fish, [legend, cap] = FISH_LEGEND();
  // the books and the quest come first
  if (!f.book && f.sk >= 125) { q.push({ k: "fishstep", d: `Buying Expert Fishing - The Bass and You from Old Man Heming in Booty Bay`, t: sec(60), step: "book" }); return; }
  if (f.book && f.nat === 0 && f.sk >= 225) { q.push({ k: "fishstep", d: `Nat Pagle on his island off Dustwallow Marsh: "Nat Pagle, Angler Extreme"`, t: sec(70), step: "nat" }); return; }
  const left = NAT_FISH.filter(x => !f.natGot.includes(x[0]));
  if (f.nat === 1 && !left.length) { q.push({ k: "fishstep", d: `Back to Nat Pagle with the four fish`, t: sec(70), step: "artisan" }); return; }
  let zone, water = fishWater(), nat = null, where;
  if (f.nat === 1) { nat = pick(left); zone = nat[1]; where = nat[2]; water = Math.min(water, 3); }
  else if (f.sk >= 150 && !f.legend && (hasGoal("legend") || Math.random() < 0.25)) { zone = cap; where = cap === "Ironforge" ? "the pool in the Forlorn Cavern" : "the pond in the Valley of Spirits"; }
  else { zone = fishZone(water); where = pick(["a quiet lake", "the river", "the coast", "a pool of fish"]); }
  q.push({ k: "move", d: `Flying to ${zone} to fish`, t: sec(60) });
  for (let i = 0, n = 5 + R(3); i < n; i++) q.push({ k: "fish", d: `Fishing in ${where}, ${zone}`, t: sec(30), n: 4, w: water, nat: nat && nat[0], legend: zone === cap ? legend : null });
  q.push({ k: "fishend", d: `Selling the catch`, t: sec(8) });
}
// a few casts: the skill, the catch, the rare bites
function fishCast(t) {
  const f = S.fish, fish = FISH_WATERS[t.w][3]; let got = 0;
  for (let i = 0; i < t.n; i++) {
    if (Math.random() < 0.12) continue; // it got away
    got++; f.caught++; fishUp();
    if (S.level >= 60) f.cash = (f.cash || 0) + FISH_PRICE[t.w];
  }
  const catchTxt = got ? `${got} ${pick(fish)}${got > 1 ? " and the like" : ""}` : "nothing but an Old Boot";
  if (t.nat && !f.natGot.includes(t.nat) && Math.random() < 0.3) { f.natGot.push(t.nat); log(`Caught a ${t.nat} for Nat Pagle! (${f.natGot.length} of 4)`, "loot3"); return; }
  if (t.legend && !f.legend && Math.random() < 0.035 * (1 + fishBonus() / 35)) {
    f.legend = true; log(`Something huge takes the bait and nearly pulls ${S.name} in... ${t.legend}! The legend of ${FISH_LEGEND()[1]}, caught at last. It goes on the wall.`, "loot4"); return;
  }
  if (Math.random() < 0.02) { const c = 2000 + R(8000); S.money += c; log(pick([`Fished up a Waterlogged Crate. Inside: ${moneyTxt(c)} and a soggy letter.`, `A Bloated ${pick(fish).replace("Raw ", "")} on the line, with ${moneyTxt(c)} worth of trinkets in its belly.`]), "loot3"); return; }
  if (S.level < 60 && Math.random() < 0.5) log(`Caught ${catchTxt}.`, "loot1");
}
function fishEnd() {
  const f = S.fish, c = f.cash || 0; f.cash = 0;
  if (c) { S.money += c; log(`Sold the catch on the Auction House for ${moneyTxt(c)}. Fishing skill ${f.sk}.`, "gold"); }
}
function fishStep(t) {
  const f = S.fish;
  if (t.step === "book") { f.book = true; spend("gear", Math.min(S.money, 10000)); log(`Read Expert Fishing - The Bass and You: Expert Fishing (up to 225).`, "spell"); }
  if (t.step === "nat") { f.nat = 1; log(`Nat Pagle: "Bring me a Feralas Ahi, a Misty Reed Mahi Mahi, a Sar'theris Striker and a Savage Coast Blue Sailfin, and I'll show you what real fishing is."`, "quest"); }
  if (t.step === "artisan") { f.nat = 2; log(`Nat Pagle, Angler Extreme: Artisan Fishing (up to 300).`, "ach"); }
}

// ---------- the Stranglethorn Fishing Extravaganza ----------
// the result is rolled up front: a top fisherman with the pole has a real chance, most Sundays someone else wins
function queueFX() {
  const q = S.queue, f = S.fish, wk = Math.floor(fishDay() / 7);
  f.fx.wk = wk; f.fx.tries++;
  const sk = f.sk + fishBonus(), win = Math.random() < clamp((sk - 240) / 100 * 0.25, 0, 0.2), place = win ? 1 : 2 + R(sk >= 250 ? 8 : 40);
  q.push({ k: "move", d: `Flying to Booty Bay for the Stranglethorn Fishing Extravaganza`, t: sec(60) });
  q.push({ k: "fxstart", d: `Waiting on the docks of Booty Bay for Riggle Bassbait's signal`, t: sec(20) });
  for (let i = 1; i <= 5; i++) q.push({ k: "fish", d: `Fishing the Schools of Tastyfish off the Savage Coast (${Math.min(40, i * (win ? 8 : 6 + R(3)))} of 40 Speckled Tastyfish)`, t: sec(30), n: 4, w: 2 });
  q.push({ k: "fxend", d: `Running the Tastyfish to Riggle Bassbait`, t: sec(10), win, place });
}
function fxEnd(t) {
  const f = S.fish, rival = S.guild && Math.random() < 0.3 ? `${pugMember("dps", takenNames(), S.faction).name} of <${S.guild.rival.name}>` : pick(PLAYERS);
  if (t.win) {
    f.fx.wins++; f.fx.best = 1;
    log(`Riggle Bassbait: "We have a winner! ${S.name} is the Master Angler!"`, "ach");
    if (!f.pole) { f.pole = "Arcanite Fishing Pole"; log(`${S.name} picks the Arcanite Fishing Pole over the Glimmering Mithril Insignia. +35 fishing.`, "loot4"); }
    else log(`This time the Glimmering Mithril Insignia goes in the bank. A second win, for the story.`, "loot3");
    return;
  }
  f.fx.best = f.fx.best ? Math.min(f.fx.best, t.place) : t.place;
  log(`Riggle Bassbait: "We have a winner! ${rival} is the Master Angler!" ${S.name} comes in ${ordinal(t.place)}. ${pick(["The Tastyfish go to Jang for a few silver.", "Next Sunday.", "The pools kept moving."])}`, "quest");
  S.money += 1500;
}
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const FISH_FINISH = {
  fish(t) { fishCast(t); },
  fishend() { fishEnd(); },
  fishstep(t) { fishStep(t); },
  fxstart() { log(`Riggle Bassbait: "Let the Fishing Tournament BEGIN!"`, "chat"); },
  fxend(t) { fxEnd(t); },
};

// ---------- goals and the professions tab ----------
function fishGoals(out) {
  if (S.level < 60) return;
  const f = S.fish, [legend, cap] = FISH_LEGEND();
  if (f.sk < 300) out.push({ id: "fish", name: "Artisan Fisherman", what: "Fishing trips every free evening, Old Man Heming's book and Nat Pagle's four fish, until fishing reaches 300. One to three weeks.",
    prog: () => [S.fish.sk, 300], txt: () => `Fishing ${S.fish.sk} of 300${S.fish.nat === 1 ? ` · Nat Pagle's fish: ${S.fish.natGot.length} of 4` : ""}`, done: () => S.fish.sk >= 300 });
  if (!f.legend) out.push({ id: "legend", name: legend, what: `Fish ${cap} until ${legend} bites: the legend of the city. Needs fishing 150. Days, or weeks.`,
    need: f.sk < 150 ? `Needs fishing 150 (yours: ${f.sk})` : null, prog: () => [0, null], txt: () => `${S.fish.caught.toLocaleString()} fish caught`, done: () => S.fish.legend });
  if (!f.fx.wins) out.push({ id: "angler", name: "Master Angler", what: "Win the Stranglethorn Fishing Extravaganza: every Sunday afternoon in Booty Bay, the first to bring Riggle Bassbait 40 Speckled Tastyfish. Needs a high skill (and luck). Weeks.",
    need: f.sk < 150 ? `Needs fishing 150 (yours: ${f.sk})` : null, prog: () => [0, null], txt: () => `${S.fish.fx.tries} Sunday${S.fish.fx.tries === 1 ? "" : "s"} in Booty Bay${S.fish.fx.best ? `, best: ${ordinal(S.fish.fx.best)}` : ""}`, done: () => S.fish.fx.wins > 0 });
}
const fishRow = () => { const f = S.fish, cap = fishCap(); return `<li class="prow sec2"><span class="l">Fishing</span><span class="rank">${cap ? tierName(cap) : "untrained"}</span><span class="v">${f.sk} / ${cap}</span><div class="gbar thin"><i style="width:${(f.sk / 300 * 100).toFixed(1)}%"></i><b style="left:${(cap / 300 * 100).toFixed(1)}%"></b></div></li>`; };
