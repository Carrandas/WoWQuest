// The enemy side: who the hero fights, their health curves and actions, and how hard they hit.
"use strict";

// ---------- the enemy side: whoever the hero is fighting, with health, a resource and a rotation ----------
// archetype from the name: casters use mana, thieves energy, fighters and beasts rage
const FOE_KINDS = [
  ["caster", /seer|mystic|shaman|cultist|oracle|apprentice|weaver|missionary|medic|geomancer|earthcaller|thornweaver|mage|priest|geolord|neophyte|felsworn|surveyor|familiar|necro|witch|sorcer|conjur|hexxer|prophet|technician|brainwasher|rootshaper|tidehunter|warder|elemental|ooze|sludge|firelord|lava surger|son of flame|kel'thuzad|faerlina|jeklik|venoxis|mar'li|arlokk|jin'do|skeram|shazzrah|lucifron|gehennas|sulfuron|nefarian|noth|heigan|gothik|moam|ossirian|vaelastrasz|executus|baron geddon|ragnaros/i],
  ["beast", /wolf|boar|bear|spider|tiger|cougar|leopard|saber|raptor|scythemaw|crocolisk|panther|jaguar|cheetah|lion|hyena|worg|hound|bat\b|owl|moth|strider|kodo|zhevra|coyote|basilisk|wyvern|buzzard|roc\b|hippogryph|ape\b|gorilla|stegodon|pterrordax|ravasaur|scorpid|tarantula|widow|thresher|snapjaw|tortoise|whelp|broodling|chimaera|mauler|grizzly|ursa|skitterer|silithid|serpent|crawler|webspinner|prowler|magmadar|onyxia|maexxna|chromaggus|firemaw|ebonroc|flamegor|ouro|razorgore|broodlord|gluth|hakkar|kurinnaxx|buru|ayamiss|huhuran|fankriss|anub'rekhan|sapphiron|flesh hunter|vekniss|hive'zara/i],
  ["thief", /thief|bandit|rogue|trapper|pathstalker|runner|scout|smuggler|highwayman|assassin|brigand|swashbuckler|saboteur|agent|headhunter|scalper|freebooter|hideskinner|pirate|vancleef|greenskin|arlokk|axe thrower/i],
];
const foeKind = n => (FOE_KINDS.find(([, re]) => re.test(n)) || ["fighter"])[0];
const FOE_RES = { caster: "Mana", thief: "Energy", beast: "Rage", fighter: "Rage" };
function casterNuke(n) {
  if (/frost|ice|snow|winter|chill|sapphiron|kel'thuzad/i.test(n)) return "Frostbolt";
  if (/fire|flame|lava|searing|scalding|magma|ember|burning|incinerat|geddon|ragnaros|sulfuron|executus|shazzrah/i.test(n)) return "Fireball";
  if (/shaman|earthcaller|geomancer|tide|geolord|seer|elemental|rootshaper/i.test(n)) return "Lightning Bolt";
  if (/priest|missionary|medic|oracle|venoxis|jeklik/i.test(n)) return "Holy Smite";
  return "Shadow Bolt";
}
// a few bosses fight in their own way: an opener, a pool of moves and a closer
const BOSS_ROT = {
  "Hogger": ["Auto Attack", "Auto Attack,Bite,Thrash,Rend", "Enrage"],
  "Edwin VanCleef": ["Sinister Strike", "Auto Attack,Sinister Strike,Thrash,Kick,Gouge", "Call Blackguards"],
  "Cookie": ["Cookie's Cooking", "Auto Attack,Acid Splash,Cookie's Cooking", "Enrage"],
  "Lucifron": ["Impending Doom", "Shadow Shock,Lucifron's Curse,Dominate Mind,Shadow Shock", "Impending Doom"],
  "Magmadar": ["Panic", "Auto Attack,Lava Bomb,Lava Breath,Auto Attack", "Frenzy"],
  "Garr": ["Antimagic Pulse", "Auto Attack,Magma Shackles,Antimagic Pulse", "Massive Eruption"],
  "Baron Geddon": ["Inferno", "Living Bomb,Ignite Mana,Inferno,Auto Attack", "Armageddon"],
  "Majordomo Executus": ["Magic Reflection", "Teleport,Auto Attack,Damage Shield,Magic Reflection", "Submit"],
  "Ragnaros": ["Wrath of Ragnaros", "Lava Burst,Elemental Fire,Magma Blast,Wrath of Ragnaros,Auto Attack", "Summon Sons of Flame"],
  "Onyxia": ["Flame Breath", "Wing Buffet,Tail Sweep,Cleave,Flame Breath,Fireball", "Deep Breath"],
  "Vaelastrasz the Corrupt": ["Essence of the Red", "Flame Breath,Burning Adrenaline,Cleave,Fire Nova", "Burning Adrenaline"],
  "Chromaggus": ["Time Lapse", "Frost Burn,Incinerate,Corrosive Acid,Ignite Flesh,Auto Attack", "Frenzy"],
  "Nefarian": ["Shadow Flame", "Bellowing Roar,Veil of Shadow,Class Call,Cleave", "Raise Undead Drakonids"],
  "Hakkar": ["Blood Siphon", "Corrupted Blood,Cause Insanity,Will of Hakkar,Auto Attack", "Blood Siphon"],
  "Bloodlord Mandokir": ["Charge", "Whirlwind,Threatening Gaze,Cleave,Auto Attack", "Level Up"],
  "C'Thun": ["Eye Beam", "Eye Beam,Dark Glare,Eye Tentacles,Digestive Acid", "Dark Glare"],
  "Patchwerk": ["Hateful Strike", "Auto Attack,Hateful Strike,Auto Attack", "Enrage"],
  "The Four Horsemen": ["Mark of Korth'azz", "Meteor,Void Zone,Righteous Fire,Holy Wrath,Mark of Blaumeux,Mark of Mograine,Mark of Zeliek", "Shield Wall"],
  "Azuregos": ["Frost Breath", "Mark of Frost,Arcane Vacuum,Manastorm,Cleave,Frost Breath,Chill,Auto Attack", "Reflection"],
  "Prince Thunderaan": ["Tendrils of Air", "Tendrils of Air,Tears of the Wind Seeker,Auto Attack,Tendrils of Air", "Tears of the Wind Seeker"],
  "Lord Kazzak": ["Shadow Bolt Volley", "Mark of Kazzak,Twisted Reflection,Cleave,Thunderclap,Capture Soul,Shadow Bolt Volley", "Shadow Bolt Volley"],
  "Ysondre": ["Noxious Breath", "Lightning Wave,Tail Sweep,Mark of Nature,Noxious Breath,Auto Attack", "Lightning Wave"],
  "Lethon": ["Noxious Breath", "Shadow Bolt Whirl,Tail Sweep,Mark of Nature,Noxious Breath,Auto Attack", "Draw Spirit"],
  "Emeriss": ["Noxious Breath", "Volatile Infection,Tail Sweep,Mark of Nature,Noxious Breath,Auto Attack", "Corruption of the Earth"],
  "Taerar": ["Noxious Breath", "Arcane Blast,Bellowing Roar,Tail Sweep,Mark of Nature,Noxious Breath", "Bellowing Roar"],
  "Kel'Thuzad": ["Frostbolt", "Frost Blast,Shadow Fissure,Detonate Mana,Frostbolt", "Chains of Kel'Thuzad"],
  "Captain Galvangar": ["Mortal Strike", "Auto Attack,Whirlwind,Cleave,Frighten,Mortal Strike", "Enrage"],
  "Captain Balinda Stonehearth": ["Fireball", "Arcane Explosion,Cone of Cold,Fireball,Summon Water Elemental", "Arcane Explosion"],
  "Drek'Thar": ["Whirlwind", "Auto Attack,Knockdown,Cleave,Whirlwind,Frenzy", "Enrage"],
  "Vanndar Stormpike": ["Avatar", "Auto Attack,Storm Bolt,Thunderclap,Avatar", "Thunderclap"],
};
// adds that fight next to a boss (they go down first)
const BOSS_ADDS = {
  "Edwin VanCleef": ["Defias Blackguard", "Defias Blackguard"],
  "Captain Greenskin": ["Defias Pirate", "Defias Pirate"],
  "Lucifron": ["Flamewaker Protector", "Flamewaker Protector"],
  "Gehennas": ["Flamewaker", "Flamewaker"],
  "Garr": ["Firesworn", "Firesworn", "Firesworn", "Firesworn"],
  "Golemagg the Incinerator": ["Core Rager", "Core Rager"],
  "Sulfuron Harbinger": ["Flamewaker Priest", "Flamewaker Priest", "Flamewaker Priest", "Flamewaker Priest"],
  "Majordomo Executus": ["Flamewaker Elite", "Flamewaker Elite", "Flamewaker Healer", "Flamewaker Healer"],
  "Ragnaros": ["Son of Flame", "Son of Flame", "Son of Flame", "Son of Flame"],
  "Onyxia": ["Onyxian Whelp", "Onyxian Whelp", "Onyxian Whelp"],
  "Razorgore the Untamed": ["Blackwing Legionnaire", "Death Talon Dragonspawn"],
  "Nefarian": ["Red Drakonid", "Blue Drakonid", "Bronze Drakonid"],
  "High Priestess Mar'li": ["Spawn of Mar'li", "Spawn of Mar'li"],
  "High Priest Thekal": ["Zealot Lor'Khan", "Zealot Zath"],
  "General Rajaxx": ["Captain Qeez", "Captain Tuubid"],
  "Kel'Thuzad": ["Soldier of the Frozen Wastes", "Unstoppable Abomination", "Soul Weaver"],
};
// scripted boss moments, triggered when the boss reaches a share of its health:
// adds: its adds arrive here instead of at the pull; spawn: extra enemies join; hide: the boss can't be hit
// until those adds are dead (after: the label once it's back); pool: its moves from here on
const BOSS_SCRIPT = {
  "Edwin VanCleef": [{ at: 0.5, adds: true, label: "Blackguards called", say: "Half dead, VanCleef whistles for his Blackguards." }],
  "Ragnaros": [{ at: 0.5, adds: true, hide: true, label: "Submerged", after: "Emerged", say: "Ragnaros sinks into the lava and the Sons of Flame rise in his place.", back: "Ragnaros bursts out of the lava again." }],
  "Onyxia": [
    { at: 0.65, adds: true, label: "Phase 2: in the air", pool: ["Fireball", "Fireball", "Deep Breath", "Fireball"], say: "Onyxia takes to the air and whelps pour out of the eggs." },
    { at: 0.4, label: "Phase 3: landed", pool: ["Bellowing Roar", "Flame Breath", "Cleave", "Tail Sweep", "Wing Buffet", "Auto Attack"], say: "Onyxia lands with a roar that sends the raid running in fear." }],
  "Nefarian": [{ at: 0.2, spawn: ["Bone Construct", "Bone Construct", "Bone Construct"], label: "Phase 3: the dead rise", say: "The slain drakonids rise again as bone constructs." }],
  "Kel'Thuzad": [{ at: 0.45, spawn: ["Guardian of Icecrown", "Guardian of Icecrown"], label: "Phase 3: Guardians", say: "Kel'Thuzad calls the Guardians of Icecrown to his side." }],
  "Patchwerk": [{ at: 0.05, label: "Enraged", pool: ["Hateful Strike", "Hateful Strike", "Auto Attack"], say: "Patchwerk goes berserk as he nears death." }],
  "Majordomo Executus": [{ at: 0.5, spawn: ["Flamewaker Elite", "Flamewaker Healer"], label: "Reinforcements", say: "Majordomo calls more Flamewakers into the fight." }],
  "Hakkar": [
    { at: 0.66, spawn: ["Son of Hakkar", "Son of Hakkar"], label: "Blood Siphon", say: "Hakkar drinks the blood of the raid with Blood Siphon. Whoever didn't kill a Son of Hakkar for its poisoned blood heals him." },
    { at: 0.33, spawn: ["Son of Hakkar", "Son of Hakkar"], label: "Blood Siphon", say: "Another Blood Siphon. The raid leader screams for someone to get poisoned." }],
  "C'Thun": [
    { at: 0.85, label: "Dark Glare", pool: ["Dark Glare", "Eye Beam", "Eye Tentacles"], say: "The Eye of C'Thun turns red and its Dark Glare sweeps across the room. Anyone in its path is gone." },
    { at: 0.5, spawn: ["Giant Claw Tentacle", "Giant Eye Tentacle"], label: "Phase 2: C'Thun", pool: ["Digestive Acid", "Eye Beam", "Giant Eye Tentacles", "Auto Attack"], say: "The Eye falls and the Old God himself rises from the floor. Raiders vanish into C'Thun's stomach: \"You are already dead.\"" }],
  "The Four Horsemen": [
    { at: 0.7, label: "Tanks rotating", say: "Thane Korth'azz, Lady Blaumeux, Highlord Mograine and Sir Zeliek each mark the raid. The tanks rotate between corners as the marks stack." },
    { at: 0.25, label: "The last horseman", pool: ["Holy Wrath", "Righteous Fire", "Auto Attack"], say: "Three of the Horsemen are down. Sir Zeliek's Holy Wrath chains through whoever stands too close." }],
  "Vaelastrasz the Corrupt": [
    { at: 0.95, label: "Essence of the Red", say: "Vaelastrasz, free for a moment: \"Too late, friends! Nefarius' corruption has taken hold. I cannot... control myself.\" His Essence of the Red gives the raid endless mana and rage." },
    { at: 0.5, label: "Burning Adrenaline", pool: ["Burning Adrenaline", "Flame Breath", "Cleave", "Fire Nova"], say: "Burning Adrenaline: a raider runs from the group and explodes. Then the main tank gets it." }],
  "Azuregos": [
    { at: 0.6, label: "Arcane Vacuum", say: "Azuregos pulls the whole raid to him with Arcane Vacuum and wipes his threat list. The tanks scramble." },
    { at: 0.3, label: "Manastorm", pool: ["Manastorm", "Frost Breath", "Cleave", "Chill"], say: "A Manastorm crackles over the casters. Anyone who died is held by the Mark of Frost: no running back in." }],
  "Lord Kazzak": [
    { at: 0.5, label: "Capture Soul", say: "Lord Kazzak: \"Your soul is mine!\" Every raider who dies heals him with Capture Soul." },
    { at: 0.15, label: "Supreme mode", pool: ["Shadow Bolt Volley", "Shadow Bolt Volley", "Cleave"], say: "Lord Kazzak: \"The Legion will conquer all!\" He fires a Shadow Bolt Volley every second: kill him now or never." }],
  "Ysondre": [{ at: 0.75, spawn: ["Demented Druid Spirit", "Demented Druid Spirit"], label: "Druid spirits", say: "Ysondre calls the Demented Druid Spirits out of the Dream." },
    { at: 0.4, spawn: ["Demented Druid Spirit", "Demented Druid Spirit"], label: "Druid spirits", say: "More spirits. Noxious Breath leaves half the raid asleep in the grass." }],
  "Lethon": [{ at: 0.75, spawn: ["Spirit Shade", "Spirit Shade"], label: "Draw Spirit", say: "Lethon draws a Spirit Shade out of every raider. The shades drift towards him to heal him." },
    { at: 0.4, spawn: ["Spirit Shade", "Spirit Shade"], label: "Draw Spirit", say: "Draw Spirit again: the shades have to die before they reach him." }],
  "Emeriss": [{ at: 0.75, label: "Corruption of the Earth", say: "Emeriss: \"Taste your world's corruption!\" Corruption of the Earth eats away at everyone, and mushrooms sprout from the dead." },
    { at: 0.4, label: "Corruption of the Earth", pool: ["Volatile Infection", "Noxious Breath", "Tail Sweep"], say: "Another Corruption of the Earth. The healers are out of mana." }],
  "Taerar": [{ at: 0.75, spawn: ["Shade of Taerar", "Shade of Taerar", "Shade of Taerar"], label: "Shades of Taerar", say: "Taerar vanishes and three Shades of Taerar take his place." },
    { at: 0.4, spawn: ["Shade of Taerar", "Shade of Taerar", "Shade of Taerar"], label: "Shades of Taerar", say: "The shades again, and Bellowing Roar sends the raid running." }],
};
function foePool(name, kind, rank, who) {
  if (who && who.cls) return pvpPool(who.cls, who.role); // a player in a battleground
  const b = BOSS_ROT[name]; if (b) return { open: [b[0]], fill: ["Auto Attack"], extra: b[1].split(","), end: b[2] };
  const big = rank === "boss" || rank === "raid boss", nuke = casterNuke(name);
  if (kind === "caster") return { open: [nuke], fill: [nuke], extra: ["Frost Nova", "Curse of Weakness", "Shadow Word: Pain", "Mana Shield", "Renew"].concat(big ? ["Shadow Bolt Volley", "Fear"] : []), end: big ? "Arcane Explosion" : "Heal" };
  if (kind === "thief") return { open: [pick(["Cheap Shot", "Ambush", "Garrote"])], fill: ["Auto Attack", "Sinister Strike"], extra: ["Backstab", "Gouge", "Kick", "Crippling Poison"].concat(big ? ["Blade Flurry"] : []), end: "Evasion" };
  if (kind === "beast") {
    const venom = /spider|widow|tarantula|webspinner|scorpid|serpent|silithid|maexxna|huhuran/i.test(name), drake = /whelp|broodling|onyxia|firemaw|ebonroc|flamegor|chromaggus|razorgore|broodlord|sapphiron/i.test(name);
    return { open: [venom ? "Web" : drake ? "Fire Breath" : pick(["Pounce", "Charge", "Bite"])], fill: ["Auto Attack", venom ? "Bite" : "Claw"],
      extra: venom ? ["Poison", "Web", "Rake"] : drake ? ["Fire Breath", "Wing Buffet", "Claw", "Tail Sweep"] : ["Rake", "Bite", "Furious Howl", "Tendon Rip"], end: big ? "Enrage" : "Frenzy" };
  }
  return { open: [pick(["Charge", "Auto Attack", "Battle Shout"])], fill: ["Auto Attack", "Strike"], extra: ["Rend", "Shield Bash", "Hamstring", "Cleave", "Sunder Armor", "Demoralizing Shout", "Thrash"].concat(big ? ["Knockback", "War Stomp"] : []), end: "Enrage" };
}
// one action per hero cast while it lives; the closer comes when it's nearly dead
function foeActions(u, n) {
  const base = foePool(u.name, u.kind, u.rank, u), out = new Array(n).fill(null), start = Math.min(n, u.spawn || 0), life = Math.min(n, u.left ? n : Math.max(start + 1, u.b));
  for (let i = start; i < life; i++) {
    if (foeHidden(u, i)) { out[i] = "Submerged"; continue; }
    const ph = foePhase(u, i), p = ph && ph.pool ? { fill: ph.pool, extra: ph.pool, end: base.end } : base;
    let s = i === start ? base.open[0] : i === life - 1 && life > 2 && !u.left && Math.random() < 0.6 ? p.end : Math.random() < (/boss/.test(u.rank) ? 0.7 : 0.35) ? pick(p.extra) : pick(p.fill);
    if (s === out[i - 1] && s !== "Auto Attack") s = pick(p.fill);
    out[i] = s;
  }
  return out;
}
const foeHidden = (u, k) => !!(u.hide && u.hide.some(([a, b]) => k >= a && k < b));
const foePhase = (u, k) => (u.phases || []).filter(p => p.k <= k).pop() || null;
const foeHp = (L, rank) => Math.round((L < 10 ? 40 + L * 18 : L * L * 1.1 + L * 20) * ({ elite: 3, boss: 7, "raid elite": 25, "raid boss": 230 }[rank] || 1));
// enemy control: the hero loses the cast it was working on
const CTRL = { Polymorph: "Polymorphed", "Kidney Shot": "Stunned", "Hammer of Justice": "Stunned", Intercept: "Stunned", Blind: "Stunned", "Scatter Shot": "Stunned",
  "Psychic Scream": "Feared", "Howl of Terror": "Feared", "Intimidating Shout": "Feared", "Death Coil": "Feared", Counterspell: "Interrupted", Pummel: "Interrupted", Silence: "Interrupted", "Earth Shock": "Interrupted",
  Gouge: "Stunned", "Cheap Shot": "Stunned", Bash: "Stunned", "War Stomp": "Stunned", Kick: "Interrupted", "Shield Bash": "Interrupted", "Antimagic Pulse": "Interrupted",
  Fear: "Feared", Panic: "Feared", "Bellowing Roar": "Feared" };
const LOST = /^(Stunned|Interrupted|Feared|Polymorphed)$/;
const MELEE = /^(Auto Attack|Auto Shot|Shoot)$|Strike|Shot$|Sting|Bite|Claw|Shred|Rake|Maul|Slam|Execute|Eviscerate|Backstab|Rend|Overpower|Sunder|Revenge|Cleave|Whirlwind|Hamstring|Charge|Ambush|Garrote|Gouge|Kick/;
function controlHero(t, units, N) {
  const c = t.casts || [], onMe = !S.party || foeTarget(t) === "you";
  units.forEach(u => {
    const life = Math.min(u.left ? N : u.b, u.acts.length);
    for (let i = Math.max(1, u.spawn || 0); i < life && i < c.length - 1; i++) {
      const eff = CTRL[u.acts[i]];
      if (!eff || (eff !== "Feared" && !onMe) || LOST.test(c[i]) || /Potion|Heal|Light|Wave|Renew/.test(c[i]) || talentSpells().some(x => x.name === c[i])) continue;
      if (eff === "Interrupted" && MELEE.test(c[i])) continue; // nothing to interrupt
      c[i] = eff;
    }
  });
}
// an enemy's health after each hero cast: the hero's hits bring it down (it dies on its last one),
// its own heals bring it back up a little, which the hero then has to burn through
const FOE_HEAL = { Heal: 0.15, Renew: 0.07, "Flash Heal": 0.1, "Greater Heal": 0.2, "Holy Light": 0.15, "Flash of Light": 0.1, "Healing Wave": 0.15, "Lesser Healing Wave": 0.1, "Chain Heal": 0.1,
  "Healing Touch": 0.15, Regrowth: 0.1, Rejuvenation: 0.06, Swiftmend: 0.12 };
function foeCurve(u, w, N) {
  const hp = new Array(N + 1).fill(undefined), heal = i => FOE_HEAL[u.acts[i]] || 0;
  if (u.dw) w = u.dw;
  hp[0] = 1;
  for (const g of u.segs || []) {
    let s = 0, H = 0; for (let j = g.a; j < g.b; j++) { s += w[j] ?? 1; if (j < g.b - 1) H += heal(j); }
    let cur = g.from;
    for (let i = g.a; i < g.b; i++) {
      cur = i === g.b - 1 ? g.to : Math.max(0.02, Math.min(1, cur - (s ? (w[i] ?? 1) / s : 1 / (g.b - g.a)) * (g.from - g.to + H) + heal(i)));
      hp[i + 1] = cur;
    }
  }
  for (let k = 1; k <= N; k++) if (hp[k] === undefined) hp[k] = hp[k - 1]; // holds between its chunks
  return hp;
}
// talent cooldowns: what each does. shield absorbs the next hits, burst makes the next casts hit harder
// (the fight ends sooner), heal is one big heal. They come back every 3 minutes (about 5 at the 31-point one)
const CD_TYPE = {
  "Ice Barrier": "shield", "Cold Snap": "shield", "Last Stand": "shield", "Blessing of Kings": "shield", "Holy Shield": "shield", "Repentance": "shield",
  "Deterrence": "shield", "Wyvern Sting": "shield", "Nature's Grasp": "shield", "Soul Link": "shield", "Fel Domination": "shield",
  "Death Wish": "burst", "Presence of Mind": "burst", "Arcane Power": "burst", "Combustion": "burst", "Blade Flurry": "burst", "Cold Blood": "burst",
  "Adrenaline Rush": "burst", "Preparation": "burst", "Bestial Wrath": "burst", "Trueshot Aura": "burst", "Elemental Mastery": "burst", "Moonkin Form": "burst",
  "Leader of the Pack": "burst", "Amplify Curse": "burst", "Demonic Sacrifice": "burst", "Power Infusion": "burst", "Dark Pact": "burst",
  "Divine Favor": "heal", "Nature's Swiftness": "heal", "Inner Focus": "heal", "Divine Spirit": "heal", "Lightwell": "heal", "Mana Tide Totem": "heal", "Swiftmend": "heal",
};
const cdType = n => CD_TYPE[n] || "burst";
// a fight worth a cooldown: bosses, elites, and three or more mobs at once
const toughFight = t => t.k === "boss" || (t.k === "kill" && (t.elite || (t.mobs || []).length >= 3));
function useCooldowns(t) {
  if (!S || !t || !FIGHTS.includes(t.k) || t.cds || !toughFight(t) || !(t.casts || []).length) return;
  const ready = talentSpells().filter(x => x.kind === "c" && (S.cd[x.name] || 0) <= S.time);
  t.cds = [];
  ready.slice(0, 2).forEach((x, j) => {
    const at = Math.min(t.casts.length - 1, 1 + j);
    t.casts.splice(at, 0, x.name); t.cds.push({ name: x.name, type: cdType(x.name), at });
    S.cd[x.name] = S.time + (x.tree === S.spec && x.name === cls().ult[S.spec] ? 300 : 180) * 1000 * SPAN(S.level);
    if (cdType(x.name) === "burst" && t.k === "kill") t.t = Math.round(t.t * 0.88); // the pull goes down faster
  });
  petCooldowns(t);
  // an engineer opens with a bomb
  if (S.cons.bomb > 0 && t.casts.length > 2) { S.cons.bomb--; bump("bombs"); t.casts.splice(Math.min(t.casts.length - 1, 1 + t.cds.length), 0, profItem(BOMBS, "Engineering")); }
}
// how hard a hero cast hits the target (buffs and heals barely count)
const castWeight = s => LOST.test(s) ? 0 : /Bomb|Grenade|Dynamite/.test(s) ? 1.6 : CD_TYPE[s] ? 0.15 : FREE_ATK.test(s) ? 0.5
  : /Potion|Elixir|Stone|Shield|Form|Seal|Mark|Prowl|Bloodrage|Battle Shout|Heal|Renew|Rejuv|Regrowth|Holy Light|Flash of Light|Life Tap|Lightning Shield|Totem|Prayer|Tranquility|Swiftmend|Lay on Hands|Evocation|Ice Block|Barrier|Armor/.test(s) ? 0.15 : 1;
function dungeonRow() { return S.dg ? instanceRow(S.dg.name) : null; }

// how hard each hero cast hits; the casts right after a burst cooldown hit harder
function heroWeights(t, casts, N) {
  const w = casts.map(castWeight);
  (t.cds || []).filter(c => c.type === "burst").forEach(c => { for (let i = c.at + 1; i <= c.at + 3 && i < N; i++) w[i] *= 1.8; });
  return w;
}
// one enemy: name, level, rank ("", elite, boss, raid elite, raid boss) and kind (from the name)
const foeUnit = (name, L, rank) => ({ name, L, rank, kind: foeKind(name) });
// who the hero fights in a task: the pulled mobs, a dungeon pack, or a boss with its adds (boss last)
function foeUnits(t, raid) {
  if (t.foes) return bgUnits(t); // a battleground fight
  const d = dungeonRow(), top = d ? d.max : S.level, units = [];
  if (t.k === "kill") (t.mobs || [t.mob]).forEach(n => units.push(foeUnit(n, t.mobL || S.level, t.elite ? "elite" : "")));
  else if (t.k === "trash") {
    // tasks from old saves only have the description: "Clearing a pack of Defias Miners"
    const names = t.mobs || (() => { const m = /pack of (.+)$/.exec(t.d || ""), n = m ? m[1].replace(/ies$/, "y").replace(/ves$/, "f").replace(/s$/, "") : "Enemy"; return [n, n, n]; })();
    names.forEach(n => units.push(foeUnit(n, raid ? 61 + R(2) : top - 1 + R(2), raid ? "raid elite" : "elite")));
  } else {
    (t.adds || BOSS_ADDS[t.boss] || []).forEach(n => units.push(foeUnit(n, raid ? 62 : top, raid ? "raid elite" : "elite")));
    units.push(foeUnit(t.boss, raid ? 63 : top + 1, raid ? "raid boss" : "boss"));
  }
  return units;
}
// everyone the hero is fighting in this task, built once and kept on the task
function foeOf(t) {
  if (!t || !FIGHTS.includes(t.k)) return null;
  if (t.foe) return t.foe;
  const casts = t.casts || [], N = Math.max(1, casts.length), raid = !!(S.dg && S.dg.raid), units = foeUnits(t, raid);
  const boss = t.k === "boss" ? units[units.length - 1] : null;
  if (boss && bossWipes(t)) boss.left = t.left || 0.3; // how much health the boss has left when the group wipes (rolled with the wipe)
  const w0 = heroWeights(t, casts, N);
  // a pack (no boss): played out cast by cast, so area spells hurt every enemy still standing;
  // everything else goes down enemy by enemy
  const pack = !boss && units.length > 1 ? packFit(casts, w0, units.length, t.aoeShare || 0) : null;
  if (pack) layoutPack(units, pack, N); else layoutChunks(t, units, boss, raid, N);
  units.forEach(u => { u.max = foeHp(u.L, u.rank); u.res = FOE_RES[u.kind]; u.acts = foeActions(u, N); });
  frostNova(casts, units);
  petControl(t, units);
  controlHero(t, units, N);
  const w = heroWeights(t, casts, N);
  // a cast lost to a stun or a fear does no damage to anyone in the pack either
  units.forEach(u => { if (u.dw) u.dw = u.dw.map((x, i) => w0[i] ? x * w[i] / w0[i] : 0); });
  units.forEach(u => u.hp = foeCurve(u, w, N));
  return (t.foe = { units, w });
}
// a pack: each enemy takes the damage packSim gave it, from its first hit until it dies (the last one at the end)
function layoutPack(units, pack, N) {
  const last = pack.die.indexOf(Math.max(...pack.die));
  units.forEach((u, j) => {
    const a = Math.max(0, pack.dw[j].findIndex(x => x > 0));
    u.dw = pack.dw[j]; u.a = a; u.b = j === last ? N : pack.die[j] + 1; u.spawn = 0;
    u.segs = [{ a, b: u.b, from: 1, to: 0 }];
  });
}
// the fight as a run of chunks, each one bringing one enemy from one health level to another, in order, and
// spread over the hero's N casts by weight. Single enemies and adds go down one by one; a scripted boss pauses
// at its thresholds while its adds are dealt with (and maybe hides meanwhile)
function layoutChunks(t, units, boss, raid, N) {
  const addW = raid ? 0.07 : 0.14, sc = boss ? BOSS_SCRIPT[t.boss] || [] : [], chunks = [], marks = [];
  if (!boss) units.forEach(u => chunks.push({ u, from: 1, to: 0, wt: 1 }));
  else {
    const startAdds = units.slice(0, -1), late = sc.some(p => p.adds), end = boss.left || 0;
    if (!late) startAdds.forEach(u => chunks.push({ u, from: 1, to: 0, wt: addW }));
    let hp = 1;
    sc.forEach(p => {
      if (p.at <= end) return;
      chunks.push({ u: boss, from: hp, to: p.at, wt: hp - p.at }); hp = p.at;
      const m = { p, at: chunks.length, adds: [] };
      (p.adds ? startAdds : []).concat((p.spawn || []).map(n => { const a = foeUnit(n, boss.L - 1, raid ? "raid elite" : "elite"); units.splice(units.length - 1, 0, a); return a; }))
        .forEach(a => { m.adds.push(a); chunks.push({ u: a, from: 1, to: 0, wt: addW }); });
      m.end = chunks.length; marks.push(m);
    });
    chunks.push({ u: boss, from: hp, to: end, wt: Math.max(0.05, hp - end) });
  }
  const W = chunks.reduce((a, c) => a + c.wt, 0);
  let acc = 0, prev = 0;
  chunks.forEach((c, i) => { acc += c.wt; c.a = prev; c.b = i === chunks.length - 1 ? N : Math.min(N, Math.max(prev + (N > chunks.length ? 1 : 0), Math.round(acc / W * N))); prev = c.b; });
  units.forEach(u => {
    const mine = chunks.filter(c => c.u === u);
    u.segs = mine.map(c => ({ a: c.a, b: c.b, from: c.from, to: c.to }));
    const last = mine[mine.length - 1];
    u.spawn = 0; u.a = mine.length ? mine[0].a : N + 1; u.b = !mine.length ? N + 1 : last.to > 0 ? N : last.b;
  });
  // phase marks: when they start (in hero casts), who shows up, and whether the boss hides meanwhile
  marks.forEach(m => {
    const k = chunks[m.at - 1].b, kEnd = m.end > m.at ? chunks[m.end - 1].b : k;
    m.adds.forEach(a => a.spawn = k);
    (boss.phases = boss.phases || []).push({ k, label: m.p.label, pool: m.p.pool, say: m.p.say });
    if (m.p.hide) { (boss.hide = boss.hide || []).push([k, kEnd]); boss.phases.push({ k: kEnd, label: m.p.after, say: m.p.back }); }
  });
  units.forEach(u => { if (!chunks.some(c => c.u === u)) u.spawn = N + 1; });
}
// Frost Nova roots everything close by: melee enemies (not bosses) lose their next two actions
function frostNova(casts, units) {
  casts.forEach((c, i) => { if (c === "Frost Nova") units.forEach(u => { if (u.kind !== "caster" && !/boss/.test(u.rank)) for (let j = i + 1; j <= i + 2 && j < u.acts.length; j++) if (u.acts[j]) u.acts[j] = "Frozen"; }); });
}
// state of one enemy after k finished hero casts
function foeAt(f, u, k) {
  if (f.stop != null) k = Math.min(k, f.stop);
  const left = u.left || 0, present = k >= (u.spawn || 0), alive = present && (k < u.b || left > 0);
  let hp = 1;
  if (u.hp) hp = u.hp[Math.min(k, u.hp.length - 1)];
  else if (k >= u.b) hp = left;
  else if (k > u.a) { let s = 0, part = 0; for (let i = u.a; i < u.b; i++) { const w = f.w[i] ?? 1; s += w; if (i < k) part += w; } hp = s ? 1 - part / s : 0; hp = left + (1 - left) * hp; }
  const life = Math.max(1, u.b), lp = Math.min(1, k / life);
  const res = u.res === "Mana" ? Math.round(100 - 70 * lp) : pool2(u.res, alive, u.res === "Energy" ? (lp + 0.17) % 1 : lp);
  return { hp, alive, present, res, hidden: foeHidden(u, k), phase: foePhase(u, k), act: alive ? u.acts[Math.min(k, u.acts.length - 1)] : null, ci: Math.min(k, u.acts.length - 1) };
}
// who the enemy is hitting
function foeTarget(t = S.task) {
  if (t && t.tgt) return t.tgt; // battlegrounds: whoever they went for
  if (!S.dg || !S.party) return "you";
  if (heroRole() === "tank") return "you";
  const tank = S.party.find(m => m.role === "tank"); return tank ? tank.name : "you";
}
// ---------- enemy damage: the enemy's actions decide when the damage lands and how big each hit is ----------
// what an ability does: m = hit size (a normal swing is 1), aoe hits the whole group, dot ticks over the next few actions
// battleground players: things that do no damage
const PVP_NOHIT = /^(Polymorph|Blink|Vanish|Ice Block|Divine Shield|Feign Death|Power Word: Shield|Blessing of (Freedom|Kings)|Cleanse|Dispel Magic|Grounding Totem|Seal of Command|Psychic Scream|Howl of Terror|Intimidating Shout|Blind|Scatter Shot|Entangling Roots|Vampiric Embrace|Silence|Counterspell|Flash Heal|Greater Heal|Holy Light|Flash of Light|Healing Wave|Lesser Healing Wave|Chain Heal|Healing Touch|Regrowth|Rejuvenation|Swiftmend)$/;
function foeHit(a) {
  if (PVP_NOHIT.test(a)) return { m: 0 };
  if (a === "Deep Breath") return { m: 3.5, aoe: true };
  if (!a || a === "Submerged" || /^(Summon|Call|Raise)/.test(a) || /^(Heal|Renew|Mana Shield|Evasion|Enrage|Frenzy|Battle Shout|Demoralizing Shout|Furious Howl|Level Up|Essence of the Red|Magic Reflection|Damage Shield|Submit|Teleport|Time Lapse|Burning Adrenaline|Blade Flurry|Bellowing Roar|Class Call|Charge|Pounce|Web|Dominate Mind|Cause Insanity|Will of Hakkar|Threatening Gaze|Frozen|Seduced|Spell Locked)$/.test(a)) return { m: 0 };
  if (/Rend|Poison|Pain|Curse|Corruption|Ignite|Living Bomb|Corrupted Blood|Impending Doom|Garrote|Acid|Shadow Fissure|Frost Burn|Corrosive|Rake|Tendon Rip|Immolate/.test(a)) return { m: 1.2, dot: 3 };
  if (/Explosion|Nova|Volley|Thunder|Stomp|Deep Breath|Inferno|Whirlwind|Tail Sweep|Wing Buffet|Armageddon|Dark Glare|Elemental Fire|Eruption|Antimagic|Frost Blast|Panic|Fear|Lava Bomb|Detonate|Cookie|Wrath of Ragnaros|Knockback|Shadow Flame|Breath|Blood Siphon|Eye Tentacles|Magma Shackles|Cleave|Veil of Shadow/.test(a)) return { m: 1.3, aoe: true };
  if (/^(Kick|Gouge|Cheap Shot|Hamstring|Sunder Armor|Shield Bash|Curse of Weakness|Crippling Poison)$/.test(a)) return { m: 0.6 };
  if (a === "Auto Attack") return { m: 1 };
  if (/bolt|Fireball|Smite|Lightning|Shock|Burst|Blast|Eye Beam|Hateful|Incinerate|Chains/i.test(a)) return { m: 2 };
  return { m: 1.5 };
}
// every hit the enemies land in a fight, in time order: { at (0..1 through the fight), size (a swing is 1), aoe,
// who (the enemy's name), act (the ability), k (the action's index), u (the enemy) }
// action i is on screen while the hero works on cast i, and lands just past the middle of it
function foeEvents(t) {
  const f = foeOf(t); if (!f) return [];
  const N = f.w.length, out = [], stop = f.stop ?? N;
  f.units.forEach(u => {
    const last = Math.min(u.left ? N : u.b, u.acts.length, stop + 1);
    for (let i = u.spawn || 0; i < last; i++) {
      const a = u.acts[i], h = foeHit(a);
      if (!h.m) continue;
      if (h.dot) for (let j = 0; j < h.dot && i + j < last; j++) out.push({ at: (i + j + 0.6) / N, size: h.m / h.dot, aoe: false, who: u.name, act: a, k: i + j, u });
      else out.push({ at: (i + 0.6) / N, size: h.m, aoe: !!h.aoe, who: u.name, act: a, k: i, u });
    }
  });
  return out.sort((a, b) => a.at - b.at);
}
// ---------- how hard enemies hit, and how well the hero takes it ----------
// a typical hero's health at a level: enemy hits are sized against this, so stamina and gear make a real difference
const refHp = L => 38 * L + 200;
const ARMOR_TAKEN = { Cloth: 1.1, Leather: 1, Mail: 0.9, Plate: 0.8 };
const SPELLY = /bolt|Fire|Flame|Frost|Shadow|Lightning|Shock|Breath|Lava|Magma|Arcane|Holy|Smite|Nova|Blast|Curse|Pain|Doom|Inferno|Volley|Wrath|Corrupt|Immolate|Blood|Insanity|Eye|Glare|Ignite|Living Bomb/i;
// how much of a hit gets through: armor type (physical hits only), gear for the level, and the level gap
function heroTaken(spell, mobL) {
  const gear = gearFor();
  return (spell ? 1 : ARMOR_TAKEN[armorType()] || 1) * (1.35 - 0.35 * gear) * clamp(1 + 0.1 * (mobL - S.level), 0.5, 1.8) * talMod("t");
}
// the hero's health through a solo pull, played out hit by hit in real numbers:
// every living mob hits on its actions, the hero's heals land, a potion goes down when it gets dangerous,
// and if health runs out the hero dies to that exact hit. Worked out once and kept on the task
function soloFight(t) {
  if (t.sf) return t.sf;
  const fo = foeOf(t), N = fo.w.length, casts = t.casts || [], hm = hpMax(), pet = petInFight(t, hm);
  let cur = Math.max(1, (S.hpF ?? 1) * hm), low = cur, drank = false, killer = null;
  const potion = S.cons.hp > 0 && !casts.some(c => /Healing Potion/.test(c));
  // some pulls just go badly: a mob that keeps critting, a parry streak, a resist at the wrong moment
  const luck = 0.85 + 0.45 * Math.random() ** 4;
  // what happens to the hero's health, in time order: { at, amt (negative for a hit), who, act, k }, or a shield
  const ev = foeEvents(t).map(e => {
    const u = e.u, spell = (u.kind === "caster" && e.act !== "Auto Attack") || SPELLY.test(e.act), crit = Math.random() < 0.08;
    const base = refHp(u.L) * (u.rank === "elite" ? 0.046 : 0.016);
    return { at: e.at, amt: -Math.max(1, Math.round(base * luck * e.size * heroTaken(spell, u.L) * (0.8 + Math.random() * 0.4) * (crit ? 1.5 : 1))), who: e.who, act: e.act, k: e.k, u: e.u, aoe: e.aoe };
  });
  casts.forEach((s, k) => {
    const cd = (t.cds || []).find(c => c.name === s), at = (k + 1) / N, heal = amt => ev.push({ at, amt, who: null, act: s, k });
    if (cd && cd.type === "shield") { ev.push({ at, amt: 0, shield: true, act: s, k }); return; }
    if (cd && cd.type === "heal") { heal(Math.round(hm * 0.4 * talMod("l"))); return; }
    if (/Healing Potion/.test(s)) heal(Math.round(hm * 0.35));
    else if (isHeal(s)) heal(Math.round(hm * healAmt(s) * 0.6 * talMod("l")));
  });
  ev.sort((a, b) => a.at - b.at);
  const tl = [[0, cur / hm]];
  let shield = 0;
  for (const e of ev) {
    if (e.shield) { shield += Math.round(hm * 0.3); continue; }
    if (pet && e.amt < 0 && petTakes(pet, fo, e) && !e.aoe) continue; // the pet took it (an area hit lands on both)
    if (e.amt < 0 && shield > 0) { const soak = Math.min(shield, -e.amt); shield -= soak; e.amt += soak; if (!e.amt) continue; }
    cur = Math.min(hm, cur + e.amt);
    if (cur <= 0) { cur = 0; killer = e; tl.push([e.at, 0]); break; }
    tl.push([e.at, cur / hm]); low = Math.min(low, cur);
    if (potion && !drank && cur < hm * 0.25) { drank = true; cur = Math.min(hm, cur + Math.round(hm * 0.4)); tl.push([e.at, cur / hm]); }
  }
  if (killer) { fo.stop = killer.k; t.killer = { src: killer.who, a: killer.act }; }
  const sf = { tl, end: cur / hm, drank, low: low / hm, ...(pet ? { pet: { tl: pet.tl, end: pet.cur / pet.max, died: pet.died } } : {}) };
  if (t.wp || t.cq) wpOutcome(t, fo, sf); // world PvP and class quest fights: the result was rolled at the start
  return (t.sf = sf);
}
// what's next when nothing is being fought
function foeIdle() {
  if (S.dg && S.dg.bg) return bgMeter().name;
  if (S.dg) { const d = dungeonRow(), next = d ? d.bosses[S.dg.killed] : null; return next ? `Next boss: ${next}` : "Nothing left to fight"; }
  const q = S.quests.find(x => x.id === S.curQ && !questDone(x));
  return q && q.mob ? `Next: ${q.mob}` : "";
}
