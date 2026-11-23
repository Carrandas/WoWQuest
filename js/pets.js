// Pets: the hunter's tamed beast and the warlock's demons. Taming and summoning, their share of a fight
// (they hold one enemy while soloing and do part of the damage), healing, happiness, rare tames,
// demon specials (Spell Lock, Seduction), the Infernal and the Doomguard.
"use strict";

// ---------- who they are ----------
const hasPetClass = () => S.cls === "Hunter" || S.cls === "Warlock";
// beast families, from the tamed mob's name
const PET_FAMILY = [
  [/Wolf|Worg|Coyote|Prowler|Jackal|Hound|Silvermane|Lupos|Snarler|Timber|Ghostpaw/i, "Wolf"],
  [/Tiger|Panther|Saber|Cougar|Lion|Leopard|Jaguar|Cheetah|Stalker|Pridelord|Rake|Broken Tooth|Bangalash|Rak'shiri|Lynx|Shadowmaw/i, "Cat"],
  [/Boar|Tusk/i, "Boar"], [/Bear|Grizzly|Ursa|Mauler/i, "Bear"], [/Raptor|Scytheclaw|Ravasaur/i, "Raptor"],
  [/Spider|Widow|Tarantula|Webwood|Webspinner|Mother Fang/i, "Spider"], [/Bat\b|Vampire/i, "Bat"], [/Owl/i, "Owl"],
  [/Crab|Clacker|Pincher/i, "Crab"], [/Crocolisk|Snapjaw/i, "Crocolisk"], [/Ape\b|Gorilla|Silverback/i, "Gorilla"], [/Hyena/i, "Hyena"],
  [/Scorpid|Scorpion/i, "Scorpid"], [/Turtle|Tortoise/i, "Turtle"], [/Strider|Tallstrider/i, "Tallstrider"],
  [/Serpent|Wind Rider/i, "Wind Serpent"], [/Buzzard|Vulture|Fleshripper|Carrion|Condor/i, "Carrion Bird"],
];
const petFamily = mob => (PET_FAMILY.find(([re]) => re.test(mob)) || [0, null])[1];
const FAMILY_MOVES = {
  Wolf: ["Bite", "Furious Howl"], Cat: ["Claw", "Prowl", "Dash"], Boar: ["Charge", "Gore"], Bear: ["Claw", "Swipe"], Raptor: ["Bite", "Claw"],
  Spider: ["Bite", "Web"], Bat: ["Bite", "Screech"], Owl: ["Claw", "Screech"], Crab: ["Claw"], Crocolisk: ["Bite"], Gorilla: ["Bite", "Thunderstomp"],
  Hyena: ["Bite", "Dash"], Scorpid: ["Claw", "Scorpid Poison"], Turtle: ["Bite", "Shell Shield"], Tallstrider: ["Bite"],
  "Wind Serpent": ["Bite", "Lightning Breath"], "Carrion Bird": ["Claw", "Screech"],
};
// hunters name their pet once; it keeps the name for good
const PET_NAMES = {
  Wolf: ["Fang", "Sir Barksalot", "Snowball", "Howler", "Lady Fluffington"], Cat: ["Mittens", "Whiskers", "Mr. Snuggles", "Purrcival", "Sir Pounce"],
  Boar: ["Bacon", "Porkchop", "Hamlet", "Sir Oinks", "Truffles"], Bear: ["Teddy", "Boo Boo", "Fuzzy Wuzzy", "Honeypaw", "Grizzle"],
  Raptor: ["Clever Girl", "Chomper", "Rexy", "Spike"], Spider: ["Charlotte", "Itsy Bitsy", "Webster", "Eight"], Bat: ["Batsy", "Sonar", "Count Flapula"],
  Owl: ["Hoots", "Professor", "Night Fury"], Crab: ["Pinchy", "Sebastian", "Snippy"], Crocolisk: ["Tick-Tock", "Snappy", "Handbag"],
  Gorilla: ["Bananas", "Bubbles", "Mr. Knuckles"], Hyena: ["Giggles", "Snickers", "Chuckles"], Scorpid: ["Stinger", "Pokey", "Sir Pinch"],
  Turtle: ["Shelly", "Speedy", "Rocket"], Tallstrider: ["Big Bird", "Legs", "Drumstick"], "Wind Serpent": ["Noodle", "Zappy", "Sparky"],
  "Carrion Bird": ["Buzz", "Pecky", "Lunch"],
};
const PET_NAMES_ANY = ["Fluffy", "Killface", "Snuggles", "Princess", "Biscuit", "Pickles", "Mr. Bigglesworth", "Cuddles", "Doom"];
// famous rare tames: zone, name, family, the level it's at
const RARE_TAMES = [
  ["Dun Morogh", "Timber", "Wolf", 10], ["Elwynn Forest", "Mother Fang", "Spider", 10], ["Mulgore", "The Rake", "Cat", 10],
  ["Darkshore", "Mangy Silvermane", "Wolf", 13], ["The Barrens", "Humar the Pridelord", "Cat", 23], ["Duskwood", "Lupos", "Wolf", 23],
  ["Ashenvale", "Ghostpaw Alpha", "Wolf", 28], ["Badlands", "Broken Tooth", "Cat", 37], ["Feralas", "Snarler", "Wolf", 42],
  ["Stranglethorn Vale", "King Bangalash", "Cat", 43], ["Winterspring", "Rak'shiri", "Cat", 57],
];
// demons: tank (holds an enemy while soloing), health (share of the warlock's), damage, what they do
const DEMONS = {
  Imp: { spell: "Summon Imp", tank: false, hp: 0.35, dmg: 1, moves: ["Firebolt", "Firebolt", "Fire Shield", "Blood Pact"] },
  Voidwalker: { spell: "Summon Voidwalker", tank: true, hp: 0.7, dmg: 1, moves: ["Torment", "Suffering", "Consume Shadows"] },
  Succubus: { spell: "Summon Succubus", tank: true, hp: 0.45, dmg: 1.15, moves: ["Lash of Pain", "Seduction", "Soothing Kiss"] },
  Felhunter: { spell: "Summon Felhunter", tank: true, hp: 0.55, dmg: 1, moves: ["Shadow Bite", "Spell Lock", "Devour Magic"] },
};
// a demon's name is rolled the first time it's summoned and kept from then on
const DEMON_NAMES = {
  Imp: ["Fizzlebang", "Zibbik", "Snarfle", "Kibkrah", "Jinx", "Grizzik", "Pyrozik", "Blixx"],
  Voidwalker: ["Ghrom", "Voidbert", "Rhauk", "Gloomhulk", "Hakkus", "Thrul", "Mr. Shadow"],
  Succubus: ["Lashara", "Shivva", "Jezelle", "Whiplash", "Velvetta", "Sinthia"],
  Felhunter: ["Mana Muncher", "Snarl", "Grollgor", "Sniffles", "Gnasher", "Slobberjaw"],
};
const BEAST_PET = { tank: true, hp: 0.6, dmg: 1 };
const petDef = () => !S.pet ? null : S.pet.kind === "beast" ? { ...BEAST_PET, moves: FAMILY_MOVES[S.pet.family] || ["Bite", "Claw"] } : DEMONS[S.pet.type];
const petOut = () => !!(S.pet && !S.pet.dead);

// ---------- their part in a fight ----------
// share of the damage the pet does: about 30%, more for Beast Mastery and Demonology
const PET_SHARE = { Hunter: [0.4, 0.3, 0.25], Warlock: [0.25, 0.4, 0.25] };
const petShare = () => petOut() ? PET_SHARE[S.cls][S.spec] : 0;
// how hard it hits against a normal pet (1): a happy or rare beast more, an unhappy one less, the Succubus more
function petDmg() {
  if (!petOut()) return 1;
  if (S.pet.kind === "demon") return DEMONS[S.pet.type].dmg;
  return (S.pet.happy >= 66 ? 1.1 : S.pet.happy >= 33 ? 1 : 0.8) * (S.pet.rare ? 1.1 : 1);
}
// kill time: today's tuning already counts a normal pet, so only a stronger or weaker one changes it
const petSpeed = () => { const s = petShare(); return s ? 1 / (1 - s + s * petDmg()) : 1; };
const HAPPY = h => h >= 66 ? "happy" : h >= 33 ? "content" : "unhappy";
// the pet in a solo pull: its health in real numbers, and its timeline for the frame
function petInFight(t, hm) {
  if (!petOut() || S.party || t.k !== "kill") return null;
  const d = petDef(), max = hm * d.hp;
  return { cur: max * S.pet.hp, max, tank: d.tank, tl: [[0, S.pet.hp]], died: false };
}
// an enemy hit in a solo pull: the pet holds the enemy it's tanking (the first one still standing, after that
// enemy's opening action), area hits land on both. Returns true when the pet took it
function petTakes(pet, fo, e) {
  if (pet.cur <= 0) return false;
  const focus = fo.units.find(u => e.k >= (u.spawn || 0) && e.k < u.b);
  if (!e.aoe && !(pet.tank && e.u === focus && e.k > (e.u.spawn || 0))) return false;
  pet.cur = Math.max(0, pet.cur + e.amt); pet.tl.push([e.at, pet.cur / pet.max]);
  if (pet.cur <= 0) pet.died = true;
  return true;
}
// is the pet holding the enemy that's being fought right now (solo pulls only, for the enemy frame)
function petHolding(f, k) {
  const t = S.task; if (!petOut() || S.party || !t || t.k !== "kill" || !petDef().tank) return false;
  const sf = soloFight(t); if (sf.pet && sf.pet.died && hpAt(sf.pet, taskDone(t)) <= 0) return false;
  const focus = f.units.find(u => k >= (u.spawn || 0) && k < u.b);
  return !!focus && k > (focus.spawn || 0);
}
// what the pet does on each of the hero's casts (for its frame)
function petActs(n) {
  const d = petDef(); if (!d) return [];
  const opener = S.pet.kind === "beast" ? "Growl" : d.moves[0];
  return Array.from({ length: n }, (_, i) => i === 0 ? opener : i % 2 ? d.moves[(i >> 1) % d.moves.length] : S.pet.type === "Imp" ? "Firebolt" : "Auto Attack");
}
// demon specials on the enemy side: the Felhunter locks a caster's spells, the Succubus seduces a second enemy
function petControl(t, units) {
  if (!petOut() || S.pet.kind !== "demon") return;
  if (S.pet.type === "Felhunter") units.forEach(u => {
    if (u.kind !== "caster") return;
    let next = (u.spawn || 0) + 1;
    for (let i = next; i < u.acts.length; i++) if (u.acts[i] && u.acts[i] !== "Auto Attack" && SPELLY.test(u.acts[i]) && i >= next) { u.acts[i] = "Spell Locked"; next = i + 8; }
  });
  if (S.pet.type === "Succubus" && !S.party && units.length > 1) {
    const u = units[1], s = u.spawn || 0;
    for (let j = s + 1; j <= s + 3 && j < u.acts.length; j++) if (u.acts[j]) u.acts[j] = "Seduced";
  }
}
// warlocks: an Infernal for tough fights from level 50 (once an hour), a Doomguard from the Ritual of Doom
function petCooldowns(t) {
  if (S.cls !== "Warlock" || !t.cds) return;
  const add = name => { const at = Math.min(t.casts.length - 1, 1 + t.cds.length); t.casts.splice(at, 0, name); t.cds.push({ name, type: "burst", at }); if (t.k === "kill") t.t = Math.round(t.t * 0.88); };
  if (t.doom) { add("Ritual of Doom"); S.petStats.doom++; }
  else if ("Inferno" in S.spells && (S.cd.Inferno || 0) <= S.time) { add("Inferno"); S.cd.Inferno = S.time + 3600 * 1000 * SPAN(S.level); S.petStats.infernal++; }
}

// ---------- looking after it ----------
// the demon for the job: solo a Voidwalker to tank (Demonology: the Succubus, against casters: the Felhunter),
// in a group the Imp (the Felhunter against a caster boss)
function wantedDemon(foe) {
  const has = d => DEMONS[d].spell in S.spells;
  if (S.party) return foe && foeKind(foe) === "caster" && has("Felhunter") ? "Felhunter" : has("Imp") ? "Imp" : null;
  if (S.spec === 1 && has("Succubus")) return "Succubus";
  const q = S.quests.find(x => x.id === S.curQ && !questDone(x)) || S.quests.find(x => !questDone(x));
  if (q && q.mob && foeKind(q.mob) === "caster" && has("Felhunter")) return "Felhunter";
  return has("Voidwalker") ? "Voidwalker" : has("Imp") ? "Imp" : null;
}
const summonTask = type => ({ k: "summon", type, d: `Summoning your ${type}`, t: sec(5) });
// a beast from this zone to tame (or a rare one that's been spotted)
function tameTask() {
  if (S.rareHunt) { const r = RARE_TAMES.find(x => x[1] === S.rareHunt); if (r) return { k: "tame", beast: r[1], family: r[2], rare: true, d: `Tracking down ${r[1]} to tame it`, t: sec(30) }; }
  const beasts = zoneMobs().filter(m => foeKind(m) === "beast" && petFamily(m)), beast = beasts.length ? pick(beasts) : "Young Wolf";
  return { k: "tame", beast, family: petFamily(beast) || "Wolf", d: `Taming ${article(beast)} with Tame Beast`, t: sec(15) };
}
// what the pet needs before the next pull, if anything (out in the field)
function petTask() {
  if (!hasPetClass()) return null;
  const p = S.pet;
  if (S.cls === "Hunter") {
    if ("Tame Beast" in S.spells && (!p || S.rareHunt)) return tameTask();
    if (!p) return null;
    if (p.dead) return { k: "petrez", d: `Casting Revive Pet on ${p.name}`, t: sec(6) };
    if (p.hp < 0.5 && "Mend Pet" in S.spells) return { k: "petheal", d: `Casting Mend Pet on ${p.name}`, t: sec(4) };
    if (p.happy < 40 && S.cons.food > 0) return { k: "feed", d: `Feeding ${p.name} ${article(rationName("food"))}`, t: sec(3) };
    return null;
  }
  const want = wantedDemon();
  if (want && (!p || p.dead || p.type !== want)) return summonTask(want);
  if (p && !p.dead && p.hp < 0.5 && "Health Funnel" in S.spells) return { k: "petheal", d: `Channeling Health Funnel into ${p.name}`, t: sec(4) };
  return null;
}
// a dungeon or raid, queued up front: warlocks bring the Imp (the Felhunter for caster bosses), hunters
// revive a dead pet; returns a function to call before each boss (it may add a swap and the Ritual of Doom)
function petDungeon(q, raid, bosses) {
  if (!hasPetClass()) return () => null;
  if (S.cls === "Hunter") { if (S.pet && S.pet.dead) q.push({ k: "petrez", d: `Casting Revive Pet on ${S.pet.name}`, t: sec(6) }); return () => null; }
  let demon = petOut() ? S.pet.type : null;
  const swap = foe => { const w = wantedDemonFor(foe); if (w && w !== demon) { q.push(summonTask(w)); demon = w; } };
  swap(null);
  return boss => {
    swap(boss);
    if (raid && boss === bosses[bosses.length - 1] && "Ritual of Doom" in S.spells) { q.push({ k: "ritual", d: "Performing the Ritual of Doom with four raid members", t: sec(20) }); return { doom: true }; }
    return null;
  };
}
// the group demon for a boss (or the run), whether or not the group has formed yet
function wantedDemonFor(foe) {
  const has = d => DEMONS[d].spell in S.spells;
  return foe && foeKind(foe) === "caster" && has("Felhunter") ? "Felhunter" : has("Imp") ? "Imp" : null;
}
// a hunter arriving in a zone with a famous rare beast may spot it
function petArrive(zone) {
  if (S.cls !== "Hunter" || !("Tame Beast" in S.spells)) return;
  const r = RARE_TAMES.find(x => x[0] === zone);
  if (!r || S.petStats.rares.includes(r[1]) || S.level < r[3] || (S.pet && S.pet.rare && S.pet.L >= r[3])) return;
  if (Math.random() < 0.35) { S.rareHunt = r[1]; log(`Spotted ${r[1]} prowling ${zone}. A rare beast, and it could be yours.`, "boss"); }
}
// after a solo pull: the pet's health, whether it died, and a little less happiness
function petAfterFight(t, sf) {
  if (!S.pet) return;
  if (sf && sf.pet) {
    S.pet.hp = Math.max(0, sf.pet.end);
    if (sf.pet.died && !S.pet.dead) { S.pet.dead = true; log(`${S.pet.name} fell in the fight.`, "death"); }
  }
  if (S.pet.kind === "beast") S.pet.happy = Math.max(0, S.pet.happy - 2);
}
// every other task: resting heals it fully, walking and the rest heal it a bit (petHpAfter: the frame fills up along the way)
const petHpAfter = t => t.k === "rest" || t.k === "rez" || t.k === "regroup" ? 1 : Math.min(1, S.pet.hp + 0.2);
function petTick(t) {
  if (!S.pet || S.pet.dead || FIGHTS.includes(t.k)) return;
  S.pet.hp = petHpAfter(t);
}
const PET_FINISH = {
  tame(t) {
    const old = S.pet, name = t.rare ? t.beast : Math.random() < 0.6 ? pick(PET_NAMES[t.family] || PET_NAMES_ANY) : pick(PET_NAMES_ANY);
    S.pet = { kind: "beast", family: t.family, name, L: t.rare ? (RARE_TAMES.find(x => x[1] === t.beast) || [0, 0, 0, S.level])[3] : S.level, hp: 1, happy: 100, rare: !!t.rare, dead: false };
    S.petStats.tamed++;
    if (t.rare) { S.petStats.rares.push(t.beast); S.rareHunt = null; log(`Tamed ${t.beast}!${old ? ` ${old.name} goes back to the wild.` : ""} A rare ${t.family.toLowerCase()}, and it hits harder than most.`, "loot4"); }
    else log(`Tamed ${article(t.beast)}. Named it ${name}.`, "spell");
  },
  summon(t) {
    const name = S.demons[t.type] || (S.demons[t.type] = pick(DEMON_NAMES[t.type]));
    S.pet = { kind: "demon", type: t.type, name, hp: 1, dead: false };
    if (!S.petStats.summoned.includes(t.type)) { S.petStats.summoned.push(t.type); log(`Summoned ${article(t.type)} for the first time: ${name}.`, "spell"); }
  },
  petrez() { if (S.pet) { S.pet.dead = false; S.pet.hp = 0.6; } },
  petheal() { if (S.pet) S.pet.hp = 1; },
  feed() { if (S.pet && S.cons.food > 0) { S.cons.food--; S.pet.happy = 100; } },
  ritual() {
    const pool = (S.party || []).filter(m => m.role === "dps"), m = pool.length ? pick(pool) : null;
    log(`Ritual of Doom: ${m ? m.name + " is sacrificed" : "a raid member is sacrificed"} and a Doomguard answers the call.${m ? " A priest brings them back." : ""}`, "boss");
    if (Math.random() < 0.2) log("The Doomguard strains against its bonds, but the enslavement holds.", "boss");
  },
};
// health and mana for the pet tasks (Health Funnel costs the warlock health, Mend Pet costs mana)
function petVitals(t, hp, mp) {
  const lo = x => Math.max(0.04, x), up = x => Math.min(1, x);
  if (t.k === "petheal") return S.cls === "Warlock" ? [lo(hp - 0.15), mp] : [hp, lo(mp - 0.12)];
  if (t.k in PET_FINISH) return [up(hp + 0.05), lo(mp - 0.08)];
  return null;
}

// ---------- on screen: a small frame under the hero ----------
function renderPet() {
  const box = $("petf"); if (!box) return;
  const p = S.pet;
  if (!p) { if (!box.hidden) box.hidden = true; return; }
  if (box.hidden) box.hidden = false;
  const t = S.task, fight = t && FIGHTS.includes(t.k) && !p.dead, raw = t ? taskDone(t) : 0;
  const sf = fight && t.k === "kill" && !S.party ? soloFight(t) : null;
  const hp = p.dead ? 0 : sf && sf.pet ? hpAt(sf.pet, raw) : t && !fight ? p.hp + (petHpAfter(t) - p.hp) * raw : p.hp; // healing up with the hero
  const n = (t && t.casts && t.casts.length) || 0, k = n ? Math.min(n - 1, Math.floor(raw * n)) : 0;
  const act = p.dead ? "dead" : hp <= 0 ? "dead" : fight && n ? petActs(n)[k] : p.kind === "beast" ? HAPPY(p.happy) : "following";
  const what = p.kind === "beast" ? `${p.rare ? "rare " : ""}${p.family.toLowerCase()}` : p.type.toLowerCase();
  setHtml("petf", `<li class="${p.dead || hp <= 0 ? "dead" : ""}"><div class="an"><span>${esc(p.name)} <small class="pk">${what}${p.kind === "beast" ? ` · <i class="h-${HAPPY(p.happy)}">${HAPPY(p.happy)}</i>` : ""}</small></span><small>${esc(act)}</small></div><div class="gbar thin"><i style="width:${(Math.max(0, hp) * 100).toFixed(1)}%;background:${hpCol(hp)}"></i></div></li>`);
}
