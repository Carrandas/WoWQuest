// The world: races, classes, zones and routes, dungeons and raids, their quests, and the time scale.
"use strict";

// ---------- races & classes ----------
const STATS = ["STR", "AGI", "STA", "INT", "SPI"];
const RACES = {
  Human:      { f: "Alliance", base: [20, 20, 20, 20, 21], start: "Human", city: "Stormwind", mount: "Brown Horse", epic: "Swift Palomino", note: "Perception, Diplomacy" },
  Dwarf:      { f: "Alliance", base: [22, 16, 23, 19, 19], start: "Dwarf", city: "Ironforge", mount: "Gray Ram", epic: "Swift Brown Ram", note: "Stoneform, Gun Specialization" },
  "Night Elf":{ f: "Alliance", base: [17, 25, 19, 20, 20], start: "Night Elf", city: "Darnassus", mount: "Striped Nightsaber", epic: "Swift Frostsaber", note: "Shadowmeld, Quickness" },
  Gnome:      { f: "Alliance", base: [15, 23, 19, 24, 20], start: "Dwarf", city: "Ironforge", mount: "Red Mechanostrider", epic: "Swift Yellow Mechanostrider", note: "Escape Artist, Expansive Mind" },
  Orc:        { f: "Horde", base: [23, 17, 22, 17, 23], start: "Orc", city: "Orgrimmar", mount: "Timber Wolf", epic: "Swift Brown Wolf", note: "Blood Fury, Hardiness" },
  Undead:     { f: "Horde", base: [19, 18, 21, 18, 25], start: "Undead", city: "Undercity", mount: "Red Skeletal Horse", epic: "Purple Skeletal Warhorse", note: "Will of the Forsaken, Cannibalize" },
  Tauren:     { f: "Horde", base: [25, 15, 22, 15, 22], start: "Tauren", city: "Thunder Bluff", mount: "Brown Kodo", epic: "Great White Kodo", note: "War Stomp, Endurance" },
  Troll:      { f: "Horde", base: [21, 22, 21, 16, 21], start: "Orc", city: "Orgrimmar", mount: "Emerald Raptor", epic: "Swift Blue Raptor", note: "Berserking, Regeneration" },
};
const ALLOWED = {
  Human: ["Warrior", "Paladin", "Rogue", "Priest", "Mage", "Warlock"],
  Dwarf: ["Warrior", "Paladin", "Hunter", "Rogue", "Priest"],
  "Night Elf": ["Warrior", "Hunter", "Rogue", "Priest", "Druid"],
  Gnome: ["Warrior", "Rogue", "Mage", "Warlock"],
  Orc: ["Warrior", "Hunter", "Rogue", "Shaman", "Warlock"],
  Undead: ["Warrior", "Rogue", "Priest", "Mage", "Warlock"],
  Tauren: ["Warrior", "Hunter", "Shaman", "Druid"],
  Troll: ["Warrior", "Hunter", "Rogue", "Priest", "Shaman", "Mage"],
};
// spells: "level Name[*=attack] [maxRank]"; {city} is replaced by the hero's capital
const CLASSES = {
  Warrior: { color: "#c79c6e", res: "Rage", armor: ["Mail", "Plate"], prime: "STR", w: [3, 1, 2, 0, 0], hp: 22, mp: 0,
    start: "Worn Shortsword", blurb: "Charges in, shouts, hits things very hard.",
    main: ["Shortsword", "Battle Axe", "Warhammer", "Claymore", "Greataxe"], off: ["Buckler", "Shield", "Kite Shield"], ranged: ["Throwing Axe", "Shortbow", "Blunderbuss"],
    sfx: ["Bear", "Tiger", "Strength", "Gorilla"],
    trees: ["Arms", "Fury", "Protection"], ult: ["Mortal Strike", "Bloodthirst", "Shield Slam"],
    verbs: ["Hacking at", "Slashing at", "Brawling with", "Swinging at"],
    spells: "1 Battle Stance|1 Heroic Strike* 9|1 Battle Shout 7|4 Charge* 3|4 Rend* 7|6 Thunder Clap* 6|8 Hamstring* 3|10 Defensive Stance|10 Sunder Armor* 5|10 Taunt|10 Bloodrage|12 Overpower* 4|12 Shield Bash* 3|14 Demoralizing Shout 5|14 Revenge* 6|16 Shield Block|16 Mocking Blow 5|18 Disarm|20 Cleave* 5|20 Retaliation|22 Intimidating Shout|24 Execute* 5|26 Challenging Shout|28 Shield Wall|30 Berserker Stance|30 Intercept* 3|30 Slam* 4|32 Berserker Rage|36 Whirlwind*|38 Pummel* 2|40 Plate Mail|50 Recklessness" },
  Paladin: { color: "#f58cba", res: "Mana", armor: ["Mail", "Plate"], prime: "STR", w: [3, 0, 2, 2, 1], hp: 20, mp: 14,
    start: "Battleworn Hammer", blurb: "Plate, a hammer, and a blessing for everyone.",
    main: ["Mace", "Warhammer", "Greatsword", "Maul"], off: ["Shield", "Heater Shield", "Kite Shield"], ranged: ["Libram"],
    sfx: ["Bear", "Gorilla", "Strength", "Eagle"],
    trees: ["Holy", "Protection", "Retribution"], ult: ["Holy Shock", "Holy Shield", "Repentance"],
    verbs: ["Hammering", "Swinging at", "Battling", "Crusading against"],
    spells: "1 Holy Light 9|1 Seal of Righteousness* 8|1 Devotion Aura 7|4 Judgement*|4 Blessing of Might 7|6 Divine Protection 2|6 Seal of the Crusader 6|8 Hammer of Justice* 4|8 Purify|10 Lay on Hands 3|10 Blessing of Protection 3|12 Redemption 5|14 Blessing of Wisdom 6|16 Righteous Fury|16 Retribution Aura 5|20 Exorcism* 6|20 Flash of Light 6|20 Sense Undead|22 Concentration Aura|22 Seal of Justice|24 Turn Undead 3|26 Blessing of Salvation|28 Shadow Resistance Aura 3|30 Divine Intervention|30 Seal of Light 4|32 Frost Resistance Aura 3|34 Divine Shield 2|36 Fire Resistance Aura 3|38 Seal of Wisdom 3|40 Plate Mail|40 Summon Warhorse|44 Hammer of Wrath* 3|46 Blessing of Sacrifice 2|50 Holy Wrath* 2|60 Summon Charger" },
  Hunter: { color: "#abd473", res: "Mana", armor: ["Leather", "Mail"], prime: "AGI", w: [0, 3, 2, 1, 1], hp: 18, mp: 10,
    start: "Worn Axe", blurb: "A bow, a pet, and an endless supply of arrows.",
    main: ["Axe", "Polearm", "Sword"], off: ["Hatchet", "Sword"], ranged: ["Shortbow", "Longbow", "Rifle", "Crossbow"],
    sfx: ["Monkey", "Falcon", "Agility", "Tiger"],
    trees: ["Beast Mastery", "Marksmanship", "Survival"], ult: ["Bestial Wrath", "Trueshot Aura", "Wyvern Sting"],
    verbs: ["Shooting at", "Kiting", "Hunting", "Tracking down"],
    spells: "1 Raptor Strike* 8|1 Track Beasts|4 Serpent Sting* 9|4 Aspect of the Monkey|6 Arcane Shot* 8|6 Hunter's Mark 4|8 Concussive Shot*|10 Aspect of the Hawk 7|10 Tame Beast|10 Call Pet|12 Mend Pet 7|12 Wing Clip* 3|12 Distracting Shot 6|14 Scare Beast 3|14 Eyes of the Beast|16 Immolation Trap* 5|16 Mongoose Bite* 4|18 Multi-Shot* 5|20 Aspect of the Cheetah|20 Freezing Trap 3|22 Scorpid Sting* 5|24 Beast Lore|26 Rapid Fire|28 Frost Trap|30 Feign Death|32 Flare|34 Explosive Trap* 3|36 Viper Sting* 3|40 Volley* 3|40 Aspect of the Pack|40 Mail|46 Aspect of the Wild 2|60 Tranquilizing Shot" },
  Rogue: { color: "#fff569", res: "Energy", armor: ["Leather", "Leather"], prime: "AGI", w: [1, 3, 2, 0, 0], hp: 19, mp: 0,
    start: "Worn Dagger", blurb: "Stealth, poison, and a knife in the kidney.",
    main: ["Dagger", "Shortsword", "Stiletto", "Kris"], off: ["Dirk", "Shortsword", "Dagger"], ranged: ["Throwing Knife", "Shortbow", "Crossbow"],
    sfx: ["Monkey", "Tiger", "Agility", "Falcon"],
    trees: ["Assassination", "Combat", "Subtlety"], ult: ["Cold Blood", "Adrenaline Rush", "Preparation"],
    verbs: ["Stabbing", "Shanking", "Sneaking up on", "Gutting"],
    spells: "1 Sinister Strike* 8|1 Eviscerate* 8|1 Stealth 4|4 Backstab* 9|4 Pick Pocket|6 Gouge* 5|8 Evasion|10 Sap 3|10 Slice and Dice 2|10 Sprint 3|12 Kick* 5|14 Garrote* 6|14 Expose Armor 5|16 Feint 4|18 Ambush* 6|20 Rupture* 6|20 Instant Poison 6|22 Distract|22 Vanish 2|24 Detect Traps|26 Cheap Shot*|30 Kidney Shot* 2|30 Deadly Poison 5|34 Blind|40 Safe Fall|50 Crippling Poison 2" },
  Priest: { color: "#ffffff", res: "Mana", armor: ["Cloth", "Cloth"], prime: "INT", w: [0, 0, 1, 3, 3], hp: 15, mp: 18,
    start: "Worn Mace", blurb: "Heals the party, melts faces in Shadowform.",
    main: ["Staff", "Mace", "Scepter"], off: ["Orb", "Tome"], ranged: ["Wand"],
    sfx: ["Owl", "Whale", "Intellect", "Spirit"],
    trees: ["Discipline", "Holy", "Shadow"], ult: ["Power Infusion", "Lightwell", "Shadowform"],
    verbs: ["Battling", "Facing down", "Exorcising", "Taking on"],
    spells: "1 Lesser Heal 3|1 Smite* 8|1 Power Word: Fortitude 6|4 Shadow Word: Pain* 8|6 Power Word: Shield 10|8 Fade 6|8 Renew 10|10 Mind Blast* 9|10 Resurrection 5|12 Inner Fire 6|14 Psychic Scream* 4|16 Heal 4|18 Dispel Magic 2|20 Flash Heal 7|20 Shackle Undead 3|20 Holy Fire* 8|22 Mind Vision 2|24 Mana Burn* 5|28 Mind Flay* 6|30 Mind Control 3|30 Prayer of Healing 4|32 Abolish Disease|40 Greater Heal 5|42 Prayer of Fortitude 2" },
  Shaman: { color: "#2b8ee6", res: "Mana", armor: ["Leather", "Mail"], prime: "INT", w: [2, 1, 2, 2, 1], hp: 19, mp: 15,
    start: "Worn Mace", blurb: "Totems on the ground, lightning in the hands.",
    main: ["Mace", "Axe", "Staff", "Hammer"], off: ["Shield", "Buckler"], ranged: ["Totem"],
    sfx: ["Eagle", "Owl", "Monkey", "Tiger"],
    trees: ["Elemental", "Enhancement", "Restoration"], ult: ["Elemental Mastery", "Stormstrike", "Mana Tide Totem"],
    verbs: ["Smacking", "Battling", "Calling the elements on", "Taking on"],
    spells: "1 Lightning Bolt* 10|1 Rockbiter Weapon 7|1 Healing Wave 10|4 Earth Shock* 7|4 Stoneskin Totem 6|6 Earthbind Totem|8 Lightning Shield 7|10 Searing Totem* 6|10 Stoneclaw Totem 6|10 Flame Shock* 6|10 Flametongue Weapon 6|12 Purge 2|12 Fire Nova Totem* 5|14 Frost Shock* 4|16 Cure Poison|18 Tremor Totem|20 Ghost Wolf|20 Lesser Healing Wave 6|20 Frostbrand Weapon 5|20 Healing Stream Totem 5|22 Water Breathing|26 Mana Spring Totem 4|28 Water Walking|30 Astral Recall|30 Reincarnation|30 Windfury Weapon 4|32 Chain Lightning* 4|40 Chain Heal 3|40 Mail" },
  Mage: { color: "#69ccf0", res: "Mana", armor: ["Cloth", "Cloth"], prime: "INT", w: [0, 0, 1, 4, 2], hp: 15, mp: 18,
    start: "Bent Staff", blurb: "Fireballs, Frost Nova, and a fridge full of water.",
    main: ["Staff", "Dagger", "Spellblade"], off: ["Orb", "Tome", "Focus"], ranged: ["Wand"],
    sfx: ["Owl", "Eagle", "Intellect", "Whale"],
    trees: ["Arcane", "Fire", "Frost"], ult: ["Arcane Power", "Combustion", "Ice Barrier"],
    verbs: ["Blasting", "Zapping", "Kiting", "Battling"],
    spells: "1 Fireball* 12|1 Frost Armor 3|1 Arcane Intellect 5|4 Frostbolt* 11|4 Conjure Water 7|6 Conjure Food 7|6 Fire Blast* 7|8 Polymorph 4|8 Arcane Missiles* 8|10 Frost Nova* 4|12 Dampen Magic 5|14 Arcane Explosion* 6|16 Flamestrike* 6|18 Remove Lesser Curse|20 Blink|20 Evocation|20 Blizzard* 6|20 Mana Shield 6|20 Teleport: {city}|22 Scorch* 7|24 Counterspell|26 Cone of Cold* 5|28 Conjure Mana Agate|30 Ice Armor 4|40 Portal: {city}|56 Arcane Brilliance" },
  Warlock: { color: "#9482c9", res: "Mana", armor: ["Cloth", "Cloth"], prime: "INT", w: [0, 0, 2, 3, 2], hp: 16, mp: 17,
    start: "Worn Dagger", blurb: "DoTs, demons, and borrowed souls.",
    main: ["Staff", "Dagger", "Kris"], off: ["Orb", "Skull", "Tome"], ranged: ["Wand"],
    sfx: ["Owl", "Eagle", "Intellect", "Whale"],
    trees: ["Affliction", "Demonology", "Destruction"], ult: ["Dark Pact", "Soul Link", "Conflagrate"],
    verbs: ["Cursing", "Hexing", "Tormenting", "Withering"],
    spells: "1 Shadow Bolt* 10|1 Demon Skin 2|1 Summon Imp|1 Immolate* 8|4 Corruption* 7|4 Curse of Weakness 6|6 Life Tap 6|8 Curse of Agony* 6|8 Fear 3|10 Summon Voidwalker|10 Create Healthstone 5|10 Drain Soul* 4|12 Health Funnel 7|14 Drain Life* 6|18 Create Soulstone 5|18 Searing Pain* 6|20 Summon Succubus|20 Rain of Fire* 4|20 Demon Armor 5|20 Ritual of Summoning|22 Eye of Kilrogg|24 Drain Mana* 4|26 Curse of Tongues 2|28 Banish 2|30 Summon Felhunter|30 Hellfire* 3|32 Curse of the Elements 3|40 Summon Felsteed|40 Howl of Terror 2|42 Death Coil* 3|48 Soul Fire* 2|50 Inferno|60 Summon Dreadsteed|60 Ritual of Doom" },
  Druid: { color: "#ff7d0a", res: "Mana", armor: ["Leather", "Leather"], prime: "INT", w: [1, 1, 2, 2, 2], hp: 17, mp: 16,
    start: "Bent Staff", blurb: "Bear, cat, tree or boomkin. Sometimes all four.",
    main: ["Staff", "Mace", "Maul"], off: ["Orb", "Tome"], ranged: ["Idol"],
    sfx: ["Monkey", "Eagle", "Owl", "Bear"],
    trees: ["Balance", "Feral Combat", "Restoration"], ult: ["Moonkin Form", "Leader of the Pack", "Swiftmend"],
    verbs: ["Battling", "Clawing at", "Facing down", "Taking on"],
    spells: "1 Wrath* 8|1 Healing Touch 11|1 Mark of the Wild 7|4 Moonfire* 10|4 Rejuvenation 11|6 Thorns 6|8 Entangling Roots* 6|10 Bear Form|10 Growl|10 Demoralizing Roar 5|10 Maul* 7|10 Teleport: Moonglade|12 Regrowth 9|14 Bash* 3|16 Aquatic Form|18 Faerie Fire 4|18 Hibernate 3|20 Cat Form|20 Claw* 5|20 Prowl 3|20 Rebirth 5|20 Rip* 6|22 Shred* 5|24 Rake* 4|24 Remove Curse|26 Dash 3|30 Travel Form|30 Tranquility 4|32 Ferocious Bite* 5|40 Dire Bear Form|40 Hurricane* 3" },
};
for (const c of Object.values(CLASSES)) {
  c.list = c.spells.split("|").map(s => { const m = s.match(/^(\d+) (.+?)(\*)?(?: (\d+))?$/); return { lvl: +m[1], name: m[2], atk: !!m[3], max: +(m[4] || 1) }; });
}
const RANK_SPELL = (sp, L) => sp.max <= 1 ? 1 : clamp(1 + Math.floor((L - sp.lvl) * (sp.max - 1) / Math.max(1, 60 - sp.lvl)), 1, sp.max);

const SLOTS = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket", "Main Hand", "Off Hand", "Ranged"];
const ARMOR_BASE = {
  Cloth:   { Head: "Cowl", Shoulder: "Mantle", Chest: "Robe", Wrist: "Cuffs", Hands: "Gloves", Waist: "Sash", Legs: "Pants", Feet: "Slippers" },
  Leather: { Head: "Cap", Shoulder: "Shoulders", Chest: "Tunic", Wrist: "Bracers", Hands: "Gloves", Waist: "Belt", Legs: "Leggings", Feet: "Boots" },
  Mail:    { Head: "Coif", Shoulder: "Pauldrons", Chest: "Hauberk", Wrist: "Bracers", Hands: "Gauntlets", Waist: "Girdle", Legs: "Legguards", Feet: "Sabatons" },
  Plate:   { Head: "Helm", Shoulder: "Spaulders", Chest: "Breastplate", Wrist: "Vambraces", Hands: "Gauntlets", Waist: "Waistband", Legs: "Legplates", Feet: "Greaves" },
};
const TIERS = {
  Cloth:   ["Frayed", "Disciple's", "Spellbinder", "Sage's", "Durable", "Conjurer's", "Mystical", "Councillor's", "Master's", "Celestial"],
  Leather: ["Rugged", "Rawhide", "Scouting", "Ranger", "Superior", "Huntsman's", "Nocturnal", "Wanderer's", "Swashbuckler's", "Ghostwalker"],
  Mail:    ["Ragged", "Raider's", "Battleforge", "Banded", "Renegade", "Jade", "Lofty", "Merciless", "Triumphant", "Warmonger's"],
  Plate:   ["Rusted", "Heavy", "Bulky", "Thick", "Hardened", "Crusader's", "Templar", "Engraved", "Bloodforged", "Exalted"],
  Metal:   ["Worn", "Crude", "Bronze", "Iron", "Heavy", "Steel", "Mithril", "Truesilver", "Thorium", "Arcanite"],
  Mystic:  ["Worn", "Faded", "Etched", "Glowing", "Runed", "Gleaming", "Ancient", "Sacred", "Blessed", "Exalted"],
  Gem:     ["Copper", "Silver", "Moss Agate", "Jade", "Citrine", "Aquamarine", "Star Ruby", "Black Pearl", "Azerothian", "Huge Emerald"],
};
const MYSTIC = /Wand|Orb|Tome|Focus|Skull|Libram|Totem|Idol|Staff/;
const JEWEL = { Neck: ["Pendant", "Choker", "Necklace"], Finger: ["Band", "Ring", "Signet"], Trinket: ["Talisman", "Charm", "Medallion"], Back: ["Cloak", "Cape", "Shroud"] };
const QMULT = [0.5, 0.85, 1, 1.18, 1.4, 1.7];
// dungeon set, tier 1 (Molten Core), tier 2 (Blackwing Lair), tier 2.5 (Ahn'Qiraj), tier 3 (Naxxramas)
const SETS = {
  Warrior: ["Valor", "Battlegear of Might", "Battlegear of Wrath", "Conqueror's", "Dreadnaught"], Paladin: ["Lightforge", "Lawbringer", "Judgement", "Avenger's", "Redemption"],
  Hunter: ["Beaststalker", "Giantstalker", "Dragonstalker", "Striker's", "Cryptstalker"], Rogue: ["Shadowcraft", "Nightslayer", "Bloodfang", "Deathdealer's", "Bonescythe"],
  Priest: ["Devout", "Vestments of Prophecy", "Vestments of Transcendence", "Oracle", "Faith"], Shaman: ["The Elements", "The Earthfury", "The Ten Storms", "Stormcaller's", "Earthshatter"],
  Mage: ["Magister's", "Arcanist", "Netherwind", "Enigma", "Frostfire"], Warlock: ["Dreadmist", "Felheart", "Nemesis", "Doomcaller's", "Plagueheart"], Druid: ["Wildheart", "Cenarion", "Stormrage", "Genesis", "Dreamwalker"],
};
const TIER_NAME = ["dungeon set", "Tier 1", "Tier 2", "Tier 2.5", "Tier 3"];
const SETSHORT = { "Battlegear of Might": "Might", "Battlegear of Wrath": "Wrath", "Vestments of Prophecy": "Prophecy", "Vestments of Transcendence": "Transcendence", "The Elements": "Elements", "The Earthfury": "Earthfury", "The Ten Storms": "Ten Storms" };
const FOOD = ["Tough Jerky", "Haunch of Meat", "Mutton Chop", "Wild Hog Shank", "Cured Ham Steak", "Roasted Quail"];
const DRINK = ["Refreshing Spring Water", "Ice Cold Milk", "Melon Juice", "Sweet Nectar", "Moonberry Juice", "Morning Glory Dew"];
const CLOTH = ["Linen Cloth", "Wool Cloth", "Silk Cloth", "Mageweave Cloth", "Runecloth"];
// bags: from level, slots, price in copper
const BAGS = [[10, "Linen Bag", 6, 300], [16, "Woolen Bag", 8, 1200], [24, "Silk Bag", 10, 4000], [34, "Mageweave Bag", 12, 12000], [48, "Runecloth Bag", 14, 40000]]
  .map(([lvl, name, slots, price]) => ({ lvl, name, slots, price }));

// ---------- zones: [min, max, Alliance hub, Horde hub, mobs, quests], turned into objects below ----------
const ZONES = {
  "Northshire Valley": [1, 5, "Northshire Abbey", "", "Young Wolf,Kobold Vermin,Kobold Worker,Defias Thug,Kobold Laborer", "A Threat Within;Kobold Camp Cleanup;Wolves Across the Border;Investigate Echo Ridge;Brotherhood of Thieves;Bounty on Garrick Padfoot;Skirmish at Echo Ridge"],
  "Elwynn Forest": [5, 11, "Goldshire", "", "Stonetusk Boar,Murloc Streamfin,Prowler,Riverpaw Gnoll,Defias Bandit,Kobold Miner,Forest Spider", "Kobold Candles;The Fargodeep Mine;Gold Dust Exchange;Princess Must Die!;Bounty on Murlocs;Wanted: \"Hogger\";The Jasperlode Mine;Protect the Frontier;Lost Necklace;Red Linen Goods"],
  "Coldridge Valley": [1, 5, "Anvilmar", "", "Rockjaw Trogg,Burly Rockjaw Trogg,Frostmane Troll Whelp,Ragged Young Wolf,Small Crag Boar", "Dwarven Outfitters;Coldridge Valley Mail Delivery;The Troll Cave;The Stolen Journal;Scalding Mornbrew Delivery;A New Threat;Senir's Observations"],
  "Dun Morogh": [5, 11, "Kharanos", "", "Frostmane Seer,Ice Claw Bear,Leper Gnome,Wendigo,Elder Crag Boar,Snow Leopard,Rockjaw Bonesnapper", "Beer Basted Boar Ribs;The Grizzled Den;Operation Recombobulation;Tools for Steelgrill;Frostmane Hold;Bitter Rivals;The Perfect Stout;Ammo for Rumbleshot;A Favor for Evershine;Wanted: Vagash"],
  "Shadowglen": [1, 5, "Aldrassil", "", "Young Nightsaber,Grellkin,Young Thistle Boar,Webwood Spider,Grell", "The Balance of Nature;Etched Sigil;Webwood Venom;A Good Friend;Seek Redemption!;The Woodland Protector;Lessons Anew"],
  "Teldrassil": [5, 11, "Dolanaar", "", "Gnarlpine Ursa,Timberling,Strigid Owl,Bloodfeather Harpy,Elder Nightsaber,Gnarlpine Mystic,Lunar Moth", "Denalan's Earth;Timberling Seeds;The Glowing Fruit;Zenn's Bidding;The Relics of Wakening;Mist;The Enchanted Glade;Ferocitas the Dream Eater;Twisted Hatred"],
  "Valley of Trials": [1, 5, "", "Den", "Mottled Boar,Scorpid Worker,Vile Familiar,Sarkoth,Burning Blade Cultist", "Your Place In The World;Cutting Teeth;Sarkoth;Vile Familiars;Galgar's Cactus Apple Surprise;Lazy Peons;Burning Blade Medallion"],
  "Durotar": [5, 11, "", "Razor Hill", "Dire Mottled Boar,Bloodtalon Scythemaw,Kul Tiras Sailor,Razormane Quilboar,Durotar Tiger,Voodoo Troll,Burning Blade Neophyte", "Vanquish the Betrayers;Encroachment;Thwarting Kolkar Aggression;Dark Storms;Carry Your Weight;Securing the Lines;Report to Sen'jin Village;Lost But Not Forgotten;Break a Few Eggs"],
  "Camp Narache": [1, 5, "", "Camp Narache", "Plainstrider,Mountain Cougar,Battleboar,Bristleback Shaman,Bristleback Quilboar", "The Hunt Begins;The Hunt Continues;Break Sharptusk!;Rites of the Earthmother;Etched Note"],
  "Mulgore": [5, 11, "", "Bloodhoof Village", "Prairie Wolf,Flatland Cougar,Windfury Harpy,Palemane Tanner,Venture Co. Laborer,Kodo Calf,Adult Plainstrider", "Dangers of the Windfury;Swoop Hunting;Mazzranache;Poison Water;Winterhoof Cleansing;Thunderhorn Totem;Rite of Strength;The Ravaged Caravan;Wildmane Totem"],
  "Deathknell": [1, 5, "", "Deathknell", "Rattlecage Skeleton,Mindless Zombie,Young Night Web Spider,Scarlet Convert,Wretched Zombie", "Rude Awakening;The Mindless Ones;Rattling the Rattlecages;Marla's Last Wish;Night Web's Hollow;The Scarlet Crusade;Scavenging Deathknell"],
  "Tirisfal Glades": [5, 11, "", "Brill", "Scarlet Warrior,Rot Hide Gnoll,Vampiric Duskbat,Darkhound,Rotting Dead,Scarlet Missionary", "Fields of Grief;Graverobbers;Doom Weed;Gordo's Task;A Putrid Task;The Prodigal Lich;Wanted: Maggot Eye;Proof of Demise;Deaths in the Family"],
  "Westfall": [10, 20, "Sentinel Hill", "", "Harvest Watcher,Defias Trapper,Riverpaw Mongrel,Murloc Raider,Fleshripper,Dust Devil,Defias Pathstalker,Goretusk", "The People's Militia;Westfall Stew;Patrolling Westfall;The Defias Brotherhood;Red Leather Bandanas;The Coast Isn't Clear;Poor Old Blanchy;Goretusk Liver Pie;The Forgotten Heirloom;The Killing Fields;Keeper of the Flame"],
  "Loch Modan": [10, 20, "Thelsamar", "", "Stonesplinter Trogg,Mountain Boar,Elder Black Bear,Tunnel Rat Scout,Mo'grosh Ogre,Dark Iron Saboteur,Forest Lurker", "In Defense of the King's Lands;The Trogg Threat;Rat Catching;Bingles' Missing Supplies;Thelsamar Blood Sausages;Stonegear's Search;Mo'grosh Stronghold;Excavation Progress Report;Ironband's Excavation"],
  "Darkshore": [10, 20, "Auberdine", "", "Moonkin Oracle,Greymist Hunter,Blackwood Warrior,Rabid Thistle Bear,Darkshore Thresher,Foreststrider,Encrusted Tide Crawler", "Washed Ashore;Bashal'Aran;The Tower of Althalaxx;Beached Sea Creature;Plagued Lands;Cave Mushrooms;The Absent Minded Prospector;Buzzbox 827;Grove of the Ancients"],
  "Silverpine Forest": [10, 20, "", "The Sepulcher", "Moonrage Whitescalp,Ravenclaw Raider,Mottled Worg,Dalaran Apprentice,Giant Rabid Bear,Moss Stalker,Rot Hide Mongrel", "The Dead Fields;Prove Your Worth;Arugal's Folly;Border Crossings;Lost Deathstalkers;Speak with Renferrel;Ivar the Foul;Pyrewood Ambush;Wand over Fist"],
  "The Barrens": [10, 25, "", "The Crossroads", "Kolkar Drudge,Zhevra Runner,Savannah Huntress,Razormane Thornweaver,Sunscale Scytheclaw,Southsea Brigand,Harpy Matriarch,Bristleback Geomancer", "Plainstrider Menace;Raptor Thieves;Fungal Spores;The Zhevra;Kolkar Leaders;Harpy Raiders;Mankrik's Wife;Wenikee Boltbucket;The Angry Scytheclaws;Samophlange;Disrupt the Attacks;Southsea Freebooters;The Escape;Consumed by Hatred"],
  "Redridge Mountains": [15, 25, "Lakeshire", "", "Redridge Mongrel,Blackrock Grunt,Tarantula,Murloc Flesheater,Great Goretusk,Redridge Brute,Blackrock Outrunner", "Blackrock Menace;Selling Fish;Murloc Poachers;Underbelly Scales;An Unwelcome Guest;Shadow Magic;Messenger to Stormwind;Wanted: Gath'Ilzogg;Tharil'zun;Redridge Goulash;The Everstill Bridge"],
  "Duskwood": [18, 30, "Darkshire", "", "Nightbane Dark Runner,Skeletal Warrior,Venom Web Spider,Rotted One,Defias Night Runner,Black Widow Hatchling,Plague Spreader,Nightbane Shadow Weaver", "The Night Watch;Raven Hill;Worgen in the Woods;The Totem of Infliction;Mor'Ladim;The Legend of Stalvan;Eight-Legged Menaces;The Hermit;Sven's Revenge;The Embalmer's Revenge;Look To The Stars"],
  "Wetlands": [20, 30, "Menethil Harbor", "", "Mottled Raptor,Bluegill Murloc,Dragonmaw Raider,Mosshide Gnoll,Black Ooze,Young Wetlands Crocolisk,Dark Iron Dwarf,Crimson Whelp", "Young Crocolisk Skins;The Third Fleet;Daily Delivery;Digging Through the Ooze;Claws from the Deep;Fall of Dun Modr;Ormer's Revenge;Apprentice's Duties;The Absent Minded Prospector;Defeat Nek'rosh"],
  "Ashenvale": [18, 30, "Astranaar", "Splintertree Post", "Thistlefur Avenger,Foulweald Warrior,Ghostpaw Runner,Dark Strand Cultist,Ashenvale Bear,Wildthorn Stalker", "The Ruins of Stardust;Raene's Cleansing;Bathran's Hair;Fallen Sky Lake;Elune's Tear;The Ashenvale Hunt;Warsong Supplies;Ordanus;Velinde's Effects;Satyr Horns;Torek's Assault"],
  "Stonetalon Mountains": [15, 27, "Stonetalon Peak", "Sun Rock Retreat", "Venture Co. Logger,Venture Co. Operator,Grimtotem Ruffian,Deepmoss Webspinner,Bloodfury Harpy,Pridewing Wyvern,Cliff Stormer", "Gerenzo's Orders;Arachnophobia;Super Reaper 6000;Cycle of Rebirth;Shredding Machines;Jin'Zil's Forest Magic;Blood Feeders;Pridewings;Goblin Invaders;Earthen Arise"],
  "Hillsbrad Foothills": [20, 31, "Southshore", "Tarren Mill", "Hillsbrad Farmer,Syndicate Thief,Gray Bear,Mountain Lion,Torn Fin Tidehunter,Crushridge Ogre,Hillsbrad Footman", "Down the Coast;Bracers of Binding;Soothing Turtle Bisque;Crushridge Bounty;Elixir of Pain;Battle of Hillsbrad;Helcular's Revenge;Costly Menace;Syndicate Assassins;Dalaran Patrols;Hints of a New Plague?"],
  "Thousand Needles": [25, 35, "Mirage Raceway", "Freewind Post", "Galak Scout,Grimtotem Bandit,Scorpid Reaver,Crag Coyote,Saltstone Basilisk,Highperch Wyvern,Steppe Cheetah", "Hypercapacitor Gizmo;Wanted - Arnak Grimtotem;The Swarm Grows;Load Lightening;A New Ore Sample;Rocket Car Parts;Free at Last;Homeward Bound;Sacred Fire"],
  "Arathi Highlands": [30, 40, "Refuge Pointe", "Hammerfall", "Witherbark Troll,Boulderfist Ogre,Syndicate Highwayman,Highland Strider,Mountain Lion,Thundering Exile", "Hints of a New Plague?;Foul Magics;Northfold Manor;Worth Its Weight in Gold;Wand to Bethor;Call to Arms;Hammerfall;Trelane's Defenses;Stromgarde Badges;Guile of the Raptor"],
  "Stranglethorn Vale": [30, 45, "Booty Bay", "Booty Bay", "Kurzen Jungle Fighter,Stranglethorn Tiger,Bloodscalp Headhunter,Bloodsail Swashbuckler,Jungle Stalker,Venture Co. Geologist,Skullsplitter Mystic,Elder Shadowmaw Panther", "Raptor Mastery;Tiger Mastery;Panther Mastery;Bloodscalp Ears;The Green Hills of Stranglethorn;Bloodsail Buccaneers;Hostile Takeover;The Bloodsail Buccaneers;Water Elementals;Tethis;Mok'thardin's Enchantment;Supply and Demand"],
  "Desolace": [30, 40, "Nijel's Point", "Shadowprey Village", "Kolkar Centaur,Magram Scout,Gelkis Earthcaller,Burning Blade Felsworn,Scorpashi Venomlash,Aged Kodo,Hatefury Rogue", "Centaur Bounty;Kodo Roundup;Ghost-o-plasm Round Up;Clam Bait;Sceptre of Light;Bone Collector;Strange Alliance;Vengeance on the Northspring;Book of the Ancients;Hand of Iruxos"],
  "Dustwallow Marsh": [35, 45, "Theramore Isle", "Brackenwall Village", "Darkfang Spider,Mirefin Murloc,Searing Whelp,Mudrock Tortoise,Bloodfen Raptor,Drywallow Crocolisk,Firemane Scout", "Hungry!;Mudrock Soup and Bugs;The Black Shield;Raptor Horns;Theramore Spies;Questioning Reethe;The Lost Report;Deserter Agitators;Tabetha's Task;Overlord Mok'Morokk's Concern"],
  "Badlands": [35, 45, "Ironband's Camp", "Kargath", "Dustbelcher Brute,Shadowforge Surveyor,Scalding Whelp,Crag Coyote,Buzzard,Rock Elemental,Ridge Stalker", "Barbecued Buzzard Wings;Tremors of the Earth;Martek the Exiled;Solution to Doom;Uldaman Reagent Run;Coyote Thieves;Broken Alliances;Badlands Reagent Run;Scrounging;Power Stones"],
  "Swamp of Sorrows": [35, 45, "The Harborage", "Stonard", "Sorrowscale Murloc,Marsh Flesheater,Lost One Fisherman,Deathstrike Tarantula,Sawtooth Crocolisk,Swamp Jaguar,Dreaming Whelp", "Ongeku;Lack of Surplus;Galen's Escape;Encroaching Wildlife;Fresh Meat;Cortello's Riddle;The Lost Ones;Noboru the Cudgel;Look Before You Leap;Neeka Bloodscar"],
  "Tanaris": [40, 50, "Gadgetzan", "Gadgetzan", "Wastewander Bandit,Sandfury Hideskinner,Scorpid Dunestalker,Glasshide Basilisk,Dune Smuggler,Searing Roc,Thistleshrub Rootshaper", "WANTED: Andre Firebeard;Wastewander Justice;Water Pouch Bounty;Thistleshrub Valley;Pirate Hats Ahoy!;Southsea Shakedown;The Thirsty Goblin;Tooga's Quest;Gadgetzan Water Survey;Super Sticky;Screecher Spirits"],
  "Feralas": [40, 50, "Feathermoon Stronghold", "Camp Mojache", "Gordunni Ogre,Grimtotem Raider,Frayfeather Hippogryph,Groddoc Ape,Sprite Darter,Wildpaw Gnoll,Northspring Harpy", "The Mark of Quality;Gordunni Cobalt;The Ogres of Feralas;Wild Hearts;The Ruins of Solarsal;The Giant Guardian;Improved Quality;Zukk'ash Infestation;Fuel for the Zapping;Woodpaw Investigation"],
  "The Hinterlands": [40, 50, "Aerie Peak", "Revantusk Village", "Witherbark Scalper,Highvale Ranger,Vilebranch Raiding Wolf,Silvermane Stalker,Saltwater Snapjaw,Green Sludge,Jade Ooze", "Troll Necklace Bounty;Skulk Rock Clean-up;Whiskey Slim's Lost Grog;Featherbeard's Endorsement;Vilebranch Hooligans;Stalking the Stalkers;Hunt the Savages;Gryphon Master Talonaxe;Cannibalistic Cousins;Snapjaws, Mon!"],
  "Searing Gorge": [43, 50, "Thorium Point", "Thorium Point", "Dark Iron Taskmaster,Heavy War Golem,Magma Elemental,Glassweb Spider,Searing Lava Spider,Greater Lava Spider,Slave Worker", "WANTED: Overseer Maltorius;Divine Retribution;JOB OPPORTUNITY: Culling the Competition;What the Wind Carries;The Flawless Flame;Curse These Fat Fingers;Fiery Menace!;Incendosaurs? Whateverosaur is More Like It;Suntara Stones;Dark Iron Tainted Vengeance"],
  "Un'Goro Crater": [48, 55, "Marshal's Refuge", "Marshal's Refuge", "Ravasaur Runner,Stegodon,Gorilla,Un'Goro Stomper,Tar Beast,Silithid Hive Drone,Bloodpetal Thresher,Frenzied Pterrordax", "Super Sticky;The Fare of Lar'korwi;Larion and Muigin;Bone-Bladed Weapons;Expedition Salvation;Roll the Bones;Lost!;Shizzle's Flyer;It's a Secret to Everybody;Crystals of Power;Making Sense of It"],
  "Azshara": [45, 55, "Talrendis Point", "Valormok", "Haldarr Satyr,Thunderhead Hippogryph,Blood Elf Surveyor,Legashi Rogue,Spitelash Myrmidon,Timbermaw Ancient,Cliff Giant", "Kim'jael Indeed!;Spiritual Domination;Stealing Knowledge;Betrayed;Delivery for Andron Gant;Kim'jael's \"Missing\" Equipment"],
  "Felwood": [48, 55, "Talonbranch Glade", "Bloodvenom Post", "Deadwood Shaman,Jadefire Satyr,Toxic Horror,Irontree Stomper,Warpwood Treant,Angerclaw Grizzly,Entropic Beast", "Cleansing Felwood;Forces of Jaedenar;Verifying the Corruption;Corrupted Sabers;Timbermaw Ally;Deadwood of the North;Speak to Nafien;Further Corruption;Wild Guardians;Mystery Goo"],
  "Blasted Lands": [45, 55, "Nethergarde Keep", "Nethergarde Keep", "Snickerfang Hyena,Ashmane Boar,Redstone Basilisk,Felhound,Shadowsworn Cultist", "A Boar's Vitality;The Basilisk's Bite;Vulture's Vigor;Snickerfang Jowls;The Decisive Striker;Everything Counts In Large Amounts;Kum'isha's Endeavors;Petty Squabbles"],
  "Burning Steppes": [50, 58, "Morgan's Vigil", "Flame Crest", "Blackrock Soldier,Black Dragonspawn,Firegut Ogre,Black Broodling,Thaurissan Agent,Giant Ember Worg", "Extinguish the Firegut;FIFTY! YEP!;Dragonkin Menace;The True Masters;Tablet of the Seven;Broodling Essence;Gor'tesh the Brute Lord;Yuka Screwspigot;Krom'Grul"],
  "Western Plaguelands": [51, 58, "Chillwind Camp", "The Bulwark", "Scarlet Lumberjack,Diseased Wolf,Skeletal Flayer,Rotting Ghoul,Scarlet Medic,Cauldron Lord,Plague Lurker", "A Plague Upon Thee;Mission Accomplished!;All Along the Watchtowers;Skeletal Fragments;Unfinished Business;Andorhal;Better Late Than Never;Defenders of Darrowshire;Return to Chillwind Camp;Scholomance"],
  "Eastern Plaguelands": [53, 60, "Light's Hope Chapel", "Light's Hope Chapel", "Plaguehound Runt,Ghoul Ravener,Cursed Mage,Crypt Horror,Plaguebat,Scourge Warder", "Demon Dogs;Blood Tinged Skies;Carrion Grubbage;Augustus' Receipt Book;Zaeldarr the Outcast;Of Forgotten Memories;Of Lost Honor;Of Love and Family;Defenders of Darrowshire;Sweet Serenity"],
  "Winterspring": [53, 60, "Everlook", "Everlook", "Frostsaber Stalker,Winterfall Ursa,Ice Thistle Yeti,Chillwind Chimaera,Frostmaul Giant,Shardtooth Mauler,Cobalt Wyrmkin", "Are We There, Yeti?;Winterfall Activity;Wildkin of Elune;Enraged Wildkin;Threat of the Winterfall;Ursius of the Shardtooth;Brumeran of the Chillwind;Shy-Rotam;Luck Be With You;Strange Sources"],
  "Silithus": [55, 60, "Cenarion Hold", "Cenarion Hold", "Hive'Ashi Worker,Twilight Geolord,Dune Smasher,Stonelash Scorpid,Sand Skitterer,Desert Rumbler,Twilight Avenger", "Securing the Supply Lines;Deadly Desert Venom;Dearest Natalia;Wanted - Deathclasp, Terror of the Sands;The Twilight Mystery;Noggle's Last Hope;Twilight Geolords;Stepping Up Security"],
};
// each zone becomes { min, max, hubA, hubH, mobs: [...], quests: [...] }
for (const [z, [min, max, hubA, hubH, mobs, quests]] of Object.entries(ZONES)) ZONES[z] = { min, max, hubA, hubH, mobs: mobs.split(","), quests: quests.split(";") };
// the faction's quest hub in a zone (or the other faction's, if it has none)
const ZONE_HUB = (z, f) => { const d = ZONES[z]; return (f === "Alliance" ? d.hubA : d.hubH) || d.hubA || d.hubH; };

// ---------- routes: each leg is "Zone:leave at level" ----------
const ROUTES = {
  Human:      "Northshire Valley:6,Elwynn Forest:11,Westfall:15,Redridge Mountains:19,Duskwood:22,Wetlands:24,Duskwood:26,Hillsbrad Foothills:28,Wetlands:30",
  Dwarf:      "Coldridge Valley:6,Dun Morogh:11,Loch Modan:15,Westfall:18,Redridge Mountains:21,Wetlands:24,Duskwood:27,Hillsbrad Foothills:30",
  "Night Elf":"Shadowglen:6,Teldrassil:11,Darkshore:16,Ashenvale:20,Wetlands:23,Ashenvale:26,Stonetalon Mountains:28,Duskwood:30",
  Orc:        "Valley of Trials:6,Durotar:11,The Barrens:15,Stonetalon Mountains:18,The Barrens:21,Ashenvale:23,Hillsbrad Foothills:26,Thousand Needles:30",
  Tauren:     "Camp Narache:6,Mulgore:11,The Barrens:16,Stonetalon Mountains:19,The Barrens:22,Ashenvale:24,Hillsbrad Foothills:27,Thousand Needles:30",
  Undead:     "Deathknell:6,Tirisfal Glades:11,Silverpine Forest:15,The Barrens:18,Stonetalon Mountains:21,Hillsbrad Foothills:24,Ashenvale:27,Thousand Needles:30",
  Alliance:   "Arathi Highlands:32,Stranglethorn Vale:34,Desolace:36,Stranglethorn Vale:38,Dustwallow Marsh:40,Badlands:42,Swamp of Sorrows:44,Tanaris:46,Feralas:48,The Hinterlands:50,Searing Gorge:51,Un'Goro Crater:53,Felwood:54,Blasted Lands:55,Burning Steppes:56,Western Plaguelands:57,Winterspring:58,Eastern Plaguelands:59,Silithus:60",
  Horde:      "Arathi Highlands:32,Stranglethorn Vale:34,Desolace:36,Stranglethorn Vale:38,Dustwallow Marsh:40,Badlands:42,Swamp of Sorrows:44,Tanaris:46,Feralas:48,The Hinterlands:50,Searing Gorge:51,Un'Goro Crater:53,Azshara:54,Felwood:55,Burning Steppes:56,Western Plaguelands:57,Winterspring:58,Eastern Plaguelands:59,Silithus:60",
};
const ENDGAME_ZONES = ["Eastern Plaguelands", "Winterspring", "Silithus", "Burning Steppes", "Western Plaguelands"];
function routeFor(race) {
  const r = RACES[race];
  return (ROUTES[r.start] + "," + ROUTES[r.f]).split(",").map(s => { const [z, l] = s.split(":"); return { z, until: +l }; });
}

// ---------- dungeons: [name, min, max, faction(A/H/B), abbr, trash, bosses, loot], turned into objects below ----------
// loot tag: |c caster, |m melee/physical, no tag = anyone
const DUNGEONS = [
  ["Ragefire Chasm", 13, 18, "H", "RFC", "Ragefire Trogg,Searing Blade Cultist,Molten Elemental", "Oggleflint,Taragaman the Hungerer,Jergosh the Invoker,Bazzalan", "Cursed Felblade|m,Subterranean Cape,Robe of Evocation|c,Bloodfire Talons|m,Ghostly Mantle|c"],
  ["The Deadmines", 17, 26, "A", "DM", "Defias Miner,Goblin Engineer,Defias Pirate,Defias Taskmaster", "Rhahk'Zor,Sneed's Shredder,Gilnid,Mr. Smite,Captain Greenskin,Edwin VanCleef,Cookie", "Rhahk'Zor's Hammer|m,Buzzer Blade|m,Smite's Mighty Hammer|m,Cruel Barb|m,Cape of the Brotherhood,Blackened Defias Belt|m,Blackened Defias Leggings|m,Corsair's Overshirt|c,Emberstone Staff|c,Cookie's Tenderizer|m,Thief's Blade|m,Gold-flecked Gloves|c"],
  ["Wailing Caverns", 17, 24, "B", "WC", "Druid of the Fang,Deviate Ravager,Deviate Venomwing,Evolving Ectoplasm", "Lady Anacondra,Lord Cobrahn,Kresh,Lord Pythas,Skum,Lord Serpentis,Verdan the Everliving,Mutanus the Devourer", "Armor of the Fang|m,Boots of the Fang|m,Crescent Staff|c,Living Root|c,Venomstrike|m,Sporid Cape,Glowing Lizardscale Cloak,Serpent's Shoulders|c,Footpads of the Fang|m"],
  ["Shadowfang Keep", 22, 30, "B", "SFK", "Shadowfang Moonwalker,Haunted Servitor,Wailing Guardsman,Fel Steed", "Rethilgore,Razorclaw the Butcher,Baron Silverlaine,Commander Springvale,Odo the Blindwatcher,Fenrus the Devourer,Wolf Master Nandos,Archmage Arugal", "Butcher's Cleaver|m,Shadowfang|m,Robes of Arugal|c,Meteor Shard|m,Belt of Arugal|c,Wolfmaster Cape,Hand of Righteousness|c,Seal of Silverlaine"],
  ["The Stockade", 24, 32, "A", "Stocks", "Defias Inmate,Defias Convict,Defias Captive", "Targorr the Dread,Kam Deepfury,Hamhock,Bazil Thredd,Dextren Ward", "Iron Knuckles|m,Kam's Walking Stick|c,Headbasher|m"],
  ["Blackfathom Deeps", 24, 32, "B", "BFD", "Blackfathom Myrmidon,Twilight Acolyte,Aku'mai Fisher,Murkshallow Snapclaw", "Ghamoo-ra,Lady Sarevess,Gelihast,Lorgus Jett,Baron Aquanis,Twilight Lord Kelris,Old Serra'kis,Aku'mai", "Tortoise Armor|m,Naga Battle Gloves|m,Strike of the Hydra|m,Gravestone Scepter|c,Rod of the Sleepwalker|c,Ancient Moonstone Seal,Embrace of the Lycan|m,Sparkleshell Mantle|m"],
  ["Gnomeregan", 29, 38, "B", "Gnomer", "Leprous Technician,Mechano-Tank,Irradiated Pillager,Caverndeep Burrower", "Grubbis,Viscous Fallout,Electrocutioner 6000,Crowd Pummeler 9-60,Mekgineer Thermaplugg", "Electrocutioner Leg|m,Electrocutioner Lagnut,Manual Crowd Pummeler|m,Hydrocane|c,Oscillating Power Hammer|m,Triprunner Dungarees|m,Toxic Revenger|m,Thermaplugg's Left Arm|m"],
  ["Razorfen Kraul", 29, 38, "B", "RFK", "Razorfen Quilguard,Death's Head Acolyte,Razorfen Beastmaster,Kraul Bat", "Roogug,Aggem Thorncurse,Death Speaker Jargba,Overlord Ramtusk,Agathelos the Raging,Charlga Razorflank", "Corpsemaker|m,Pugilist Bracers|m,Swine Fists|m,Heart of Agamaggan,Mutant Scale Breastplate|m,Glowing Magical Bracelets|c"],
  ["Scarlet Monastery: Graveyard", 30, 38, "B", "SM GY", "Haunting Phantasm,Scarlet Torturer,Unfettered Spirit", "Interrogator Vishas,Bloodmage Thalnos,Ironspine,Azshir the Sleepless", "Bloodmage Mantle|c,Ghostshroud|m,Dusty Mail Boots|m"],
  ["Scarlet Monastery: Library", 33, 40, "B", "SM Lib", "Scarlet Adept,Scarlet Monk,Scarlet Gallant,Scarlet Diviner", "Houndmaster Loksey,Arcanist Doan", "Dog Training Gloves|m,Robe of Doan|c,Mantle of Doan|c,Hypnotic Blade|c,Illusionary Rod|c"],
  ["Scarlet Monastery: Armory", 36, 42, "B", "SM Arm", "Scarlet Myrmidon,Scarlet Defender,Scarlet Sorcerer", "Herod", "Ravager|m,Herod's Shoulder|m,Raging Berserker's Helm|m,Scarlet Leggings|m"],
  ["Scarlet Monastery: Cathedral", 38, 45, "B", "SM Cath", "Scarlet Champion,Scarlet Abbot,Scarlet Wizard,Scarlet Chaplain", "High Inquisitor Fairbanks,Scarlet Commander Mograine,High Inquisitor Whitemane", "Mograine's Might|m,Whitemane's Chapeau|c,Triune Amulet,Aegis of the Scarlet Commander|m,Gauntlets of Divinity|c"],
  ["Razorfen Downs", 37, 46, "B", "RFD", "Skeletal Summoner,Death's Head Necromancer,Splinterbone Centurion", "Tuten'kash,Mordresh Fire Eye,Glutton,Ragglesnout,Amnennar the Coldbringer", "Coldrage Dagger|m,Deathmage Sash|c,Glutton's Cleaver|m,Icemetal Barbute|m,Necklace of Fanged Skulls,Robe of the Moccasin|c"],
  ["Uldaman", 41, 51, "B", "Ulda", "Stonevault Brawler,Shadowforge Ambusher,Earthen Guardian,Venomlash Scorpid", "Revelosh,The Lost Dwarves,Ironaya,Ancient Stone Keeper,Galgann Firehammer,Grimlok,Archaedas", "Ironaya's Bracers|m,Grimlok's Charge|m,Galgann's Firehammer|m,Baelog's Shortbow|m,Stoneslayer|m,The Rockpounder|m,Archaedic Shard|c,Revelosh's Gloves|c"],
  ["Zul'Farrak", 44, 54, "B", "ZF", "Sandfury Shadowcaster,Sandfury Blood Drinker,Zul'Farrak Zombie,Sul'lithuz Abomination", "Antu'sul,Theka the Martyr,Witch Doctor Zum'rah,Sandfury Executioner,Hydromancer Velratha,Gahz'rilla,Chief Ukorz Sandscalp,Nekrum Gutchewer", "Jang'thraze the Protector|m,Sang'thraze the Deflector|m,Executioner's Cleaver|m,Big Bad Pauldrons|m,Ripsaw|m,Zum'rah's Vexing Cane|c,Gahz'rilla Fang|m,Carrot on a Stick,Sandstalker Ankleguards|m,Jinxed Hoodoo Skin|c"],
  ["Maraudon", 46, 55, "B", "Mara", "Constrictor Vine,Theradrim Shardling,Putridus Shadowstalker,Celebrian Dryad", "Noxxion,Razorlash,Lord Vyletongue,Celebras the Cursed,Landslide,Tinkerer Gizlock,Rotgrip,Princess Theradras", "Princess Theradras' Scepter|c,Eye of Theradras|c,Blackstone Ring|m,Noxxion's Shackles|m,Bracers of the Stone Princess|m,Landslide Buckler|m,Rotgrip Mantle|c"],
  ["Sunken Temple", 50, 60, "B", "ST", "Atal'ai Witch Doctor,Nightmare Wyrmkin,Hukku's Voidwalker,Saturated Ooze", "Atal'alarion,Dreamscythe,Weaver,Jammal'an the Prophet,Ogom the Wretched,Morphaz,Hazzas,Shade of Eranikus", "Atal'ai Breastplate|m,Darkwater Talwar|m,Dragon's Eye,Jammal'an's Cane|c,Rod of Corrosion|c,Gloves of the Atal'ai Prophet|c,Ancient Cornerstone Grimoire|c"],
  ["Blackrock Depths", 52, 60, "B", "BRD", "Anvilrage Guardsman,Doomforge Craftsman,Fireguard Destroyer,Shadowforge Senator", "Lord Roccor,High Interrogator Gerstahn,Houndmaster Grebmar,Bael'Gar,Lord Incendius,Fineous Darkvire,General Angerforge,Golem Lord Argelmach,Ambassador Flamelash,Magmus,Emperor Dagran Thaurissan", "Ironfoe|m,Hand of Justice|m,Savage Gladiator Chain|m,Fiery Chain Girdle|m,Angerforge's Battle Axe|m,Thaurissan's Royal Scepter|c,Lord General's Sword|m,Robes of the Royal Crown|c"],
  ["Lower Blackrock Spire", 55, 60, "B", "LBRS", "Spirestone Ogre,Smolderthorn Mystic,Bloodaxe Veteran,Scarshield Raider", "Highlord Omokk,Shadow Hunter Vosh'gajin,War Master Voone,Mother Smolderweb,Quartermaster Zigris,Gizrul the Slavener,Halycon,Overlord Wyrmthalak", "Painweaver Band|m,Briarwood Reed|c,Blackhand's Breadth|m,Wyrmthalak's Shackles|c,Voone's Twitchbow|m,Truestrike Shoulders|m,Mark of Fordring|m"],
  ["Upper Blackrock Spire", 57, 60, "B", "UBRS", "Blackhand Dragon Handler,Rage Talon Fire Tongue,Chromatic Whelp,Blackhand Elite", "Pyroguard Emberseer,Solakar Flamewreath,Warchief Rend Blackhand,The Beast,General Drakkisath", "Dal'Rend's Sacred Charge|m,Dal'Rend's Tribal Guardian|m,Draconian Deflector|m,Rune Band of Wizardry|c"],
  ["Dire Maul", 56, 60, "B", "DM:N", "Gordok Brute,Wildspawn Imp,Highborne Summoner,Warpwood Crusher", "Alzzin the Wildshaper,Immol'thar,Prince Tortheldrin,King Gordok,Captain Kromcrush", "Royal Seal of Eldre'Thalas,Mindtap Talisman|c,Barbarous Blade|m,Tarnished Elven Ring|m,Ogre Forged Hauberk|m,Insightful Hood|c"],
  ["Scholomance", 58, 60, "B", "Scholo", "Scholomance Necromancer,Risen Guard,Spectral Researcher,Reanimated Corpse", "Kirtonos the Herald,Jandice Barov,Rattlegore,Ras Frostwhisper,Instructor Malicia,Doctor Theolen Krastinov,Lord Alexei Barov,Darkmaster Gandling", "Headmaster's Charge|c,Bone Ring Helm|c,Witchblade|c,Ghoul Skin Tunic|m,Barov Peasant Caller,Necropile Robe|c,Cadaverous Armor|m"],
  ["Stratholme", 58, 60, "B", "Strat", "Crimson Defender,Thuzadin Necromancer,Skeletal Berserker,Bile Spewer", "The Unforgiven,Timmy the Cruel,Malor the Zealous,Balnazzar,Baroness Anastari,Nerub'enkan,Maleki the Pallid,Magistrate Barthilas,Ramstein the Gorger,Baron Rivendare", "Runeblade of Baron Rivendare|m,Deathcharger's Reins,Hammer of the Grand Crusader|m,Timmy's Galoshes|m,Crimson Hammersmith's Apron|m,Skull of Burning Shadows|c"],
];
const RAIDS = [
  ["Molten Core", 60, 60, "B", "MC", "Molten Giant,Firelord,Core Hound,Lava Surger,Flamewaker Elite", "Lucifron,Magmadar,Gehennas,Garr,Shazzrah,Baron Geddon,Golemagg the Incinerator,Sulfuron Harbinger,Majordomo Executus,Ragnaros", "Bindings of the Windseeker|m,Eye of Sulfuras|m,Band of Accuria|m,Perdition's Blade|m,Choker of the Fire Lord|c,Striker's Mark|m,Talisman of Ephemeral Power|c,Onslaught Girdle|m,Crimson Shocker|c,Azuresong Mageblade|c,Medallion of Steadfast Might|m"],
  ["Onyxia's Lair", 60, 60, "B", "Ony", "Onyxian Warder,Onyxian Whelp", "Onyxia", "Deathbringer|m,Vis'kag the Bloodletter|m,Ring of Binding,Onyxia Hide Backpack,Sapphiron Drape|c"],
  ["Blackwing Lair", 60, 60, "B", "BWL", "Blackwing Legionnaire,Death Talon Wyrmguard,Blackwing Technician,Death Talon Overseer,Blackwing Mage", "Razorgore the Untamed,Vaelastrasz the Corrupt,Broodlord Lashlayer,Firemaw,Ebonroc,Flamegor,Chromaggus,Nefarian", "Ashkandi|m,Chromatically Tempered Sword|m,Crul'shorukh|m,Maladath|m,Staff of the Shadow Flame|c,Lok'amir il Romathis|c,Neltharion's Tear|c,Rejuvenating Gem|c,Drake Fang Talisman|m,Elementium Threaded Cloak,Shroud of Pure Thought|c,Taut Dragonhide Belt|m,Black Brood Pauldrons|m,Helm of Endless Rage|m"],
  ["Zul'Gurub", 60, 60, "B", "ZG", "Gurubashi Berserker,Hakkari Priest,Zulian Tiger,Razzashi Serpent,Gurubashi Axe Thrower", "High Priestess Jeklik,High Priest Venoxis,High Priestess Mar'li,Bloodlord Mandokir,High Priest Thekal,High Priestess Arlokk,Jin'do the Hexxer,Hakkar", "Zin'rokh|m,Warblade of the Hakkari|m,Fang of the Faceless|m,Jin'do's Judgement|c,Animist's Leggings|c,Blooddrenched Mask|m,Zandalarian Hero Charm|c,Zandalarian Hero Medallion|m,Bloodsoaked Pauldrons|m,Mar'li's Touch|c"],
  ["Ruins of Ahn'Qiraj", 60, 60, "B", "AQ20", "Anubisath Guardian,Qiraji Swarmguard,Hive'Zara Soldier,Flesh Hunter", "Kurinnaxx,General Rajaxx,Moam,Buru the Gorger,Ayamiss the Hunter,Ossirian the Unscarred", "Qiraji Sacrificial Dagger|m,Toughened Silithid Hide Gloves|m,Manslayer of the Qiraji|m,Eye of Moam|c,Stinger of Ayamiss|m,Crossbow of Imminent Doom|m,Sand Polished Hammer|m,Staff of the Ruins|c,Mantle of Maz'Nadir|c,Vestments of the Shifting Sands|c"],
  ["Temple of Ahn'Qiraj", 60, 60, "B", "AQ40", "Anubisath Defender,Qiraji Champion,Obsidian Eradicator,Vekniss Warrior,Qiraji Brainwasher", "The Prophet Skeram,Bug Trio,Battleguard Sartura,Fankriss the Unyielding,Viscidus,Princess Huhuran,Emperor Vek'lor and Emperor Vek'nilash,Ouro,C'Thun", "Hammer of Ji'zhi|c,Ancient Qiraji Ripper|m,Gloves of Enforcement|m,Wand of Qiraji Nobility|c,Ring of Emperor Vek'lor|c,Vek'nilash's Circlet|m,Burrower Bracers|c,Death's Sting|m,Dark Edge of Insanity|m,Cloak of the Devoured|c"],
  ["Naxxramas", 60, 60, "B", "Naxx", "Deathknight Captain,Necro Knight,Plagued Gargoyle,Living Monstrosity,Stoneskin Gargoyle", "Anub'Rekhan,Grand Widow Faerlina,Maexxna,Noth the Plaguebringer,Heigan the Unclean,Loatheb,Instructor Razuvious,Gothik the Harvester,The Four Horsemen,Patchwerk,Grobbulus,Gluth,Thaddius,Sapphiron,Kel'Thuzad", "Wraith Blade|c,Widow's Remorse|m,Hatchet of Sundered Bone|m,Might of Menethil|m,Kingsfall|m,Soulseeker|c,Hammer of the Twisting Nether|c,Cloak of the Necropolis|c,Shroud of Dominion|m,The Hungering Cold|m"],
];
// size, gear score needed, wipe chance per boss, tier dropped, item levels, final boss (the attunement quest chains are in raidq.js).
// needClears: full clears of the previous tier first (weeks of Molten Core before anyone is ready for Blackwing Lair)
const RAID_INFO = {
  "Molten Core": { size: 40, gs: 74, lock: 7, need: null, wipe: 0.16, set: 1, ilvl: [66, 72], last: "Ragnaros" },
  "Onyxia's Lair": { size: 40, gs: 74, lock: 5, need: null, wipe: 0.12, set: 2, ilvl: [70, 75], last: "Onyxia" },
  "Blackwing Lair": { size: 40, gs: 90, lock: 7, need: "Molten Core", needClears: 3, wipe: 0.2, set: 2, ilvl: [71, 77], last: "Nefarian" },
  "Zul'Gurub": { size: 20, gs: 73, lock: 3, need: null, wipe: 0.1, set: null, ilvl: [65, 71], last: "Hakkar" },
  "Ruins of Ahn'Qiraj": { size: 20, gs: 82, lock: 3, need: "Zul'Gurub", needClears: 2, wipe: 0.1, set: null, ilvl: [67, 72], last: "Ossirian the Unscarred" },
  "Temple of Ahn'Qiraj": { size: 40, gs: 96, lock: 7, need: "Blackwing Lair", needClears: 2, wipe: 0.22, set: 3, ilvl: [75, 81], last: "C'Thun" },
  "Naxxramas": { size: 40, gs: 100, lock: 7, need: "Temple of Ahn'Qiraj", needClears: 2, wipe: 0.21, set: 4, ilvl: [80, 90], last: "Kel'Thuzad" },
};
const SET_ILVL = [60, 66, 76, 78, 86];
const SET_SLOTS = [["Head", "Shoulder", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet"], null, null, ["Head", "Shoulder", "Chest", "Legs", "Feet"], null];
const LEGENDARY = {
  "Bindings of the Windseeker": { name: "Thunderfury, Blessed Blade of the Windseeker", parts: 2 },
  "Eye of Sulfuras": { name: "Sulfuras, Hand of Ragnaros", parts: 1 },
};
// each dungeon and raid becomes { name, min, max, side (A, H or B for both), abbr, trash: [...], bosses: [...], loot: [{ name, tag }] }
for (const list of [DUNGEONS, RAIDS]) list.forEach(([name, min, max, side, abbr, trash, bosses, loot], i) =>
  list[i] = { name, min, max, side, abbr, trash: trash.split(","), bosses: bosses.split(","), loot: loot.split(",").map(x => { const [n, tag] = x.split("|"); return { name: n, tag }; }) });
// ---------- dungeon quests, picked up before the first run: name|boss that completes it|objective|faction ----------
const DQUESTS = {
  "Ragefire Chasm": ["Slaying the Beast|Taragaman the Hungerer|Taragaman's Heart", "Hidden Enemies|Jergosh the Invoker|Jergosh's Head", "Searching for the Lost Satchel|Oggleflint|Maur Grimtotem's Satchel"],
  "The Deadmines": ["Red Silk Bandanas|Rhahk'Zor|Red Silk Bandanas", "Underground Assault|Sneed's Shredder|Gnoam Sprecklesprocket", "The Defias Brotherhood|Edwin VanCleef|Edwin VanCleef's Head"],
  "Wailing Caverns": ["Serpentbloom|Lady Anacondra|Serpentbloom", "Deviate Eradication|Kresh|Deviate Ravagers", "Leaders of the Fang|Lord Serpentis|Gems of the four Fang lords", "The Glowing Shard|Mutanus the Devourer|Glowing Shard"],
  "Shadowfang Keep": ["Deathstalkers in Shadowfang|Rethilgore|Deathstalker Adamant freed|H", "The Book of Ur|Wolf Master Nandos|The Book of Ur", "Arugal Must Die|Archmage Arugal|Head of Arugal|A", "The Arugal Must Die|Archmage Arugal|Head of Arugal|H"],
  "The Stockade": ["Targorr the Dread|Targorr the Dread|Head of Targorr", "The Fury Runs Deep|Kam Deepfury|Head of Deepfury", "The Stockade Riots|Bazil Thredd|Head of Bazil Thredd", "Crime and Punishment|Dextren Ward|Hand of Dextren Ward"],
  "Blackfathom Deeps": ["Knowledge in the Deeps|Ghamoo-ra|Lorgalis Manuscript|A", "Baron Aquanis|Baron Aquanis|Strange Water Globe|H", "In Search of Thaelrid|Gelihast|Thaelrid found|A", "Blackfathom Villainy|Twilight Lord Kelris|Head of Kelris"],
  "Gnomeregan": ["Gnogaine|Viscous Fallout|Irradiated Pillager residue", "Data Rescue|Electrocutioner 6000|Prismatic Punch Card|A", "Grime-Encrusted Ring|Crowd Pummeler 9-60|Grime-Encrusted Ring", "The Grand Betrayal|Mekgineer Thermaplugg|Mekgineer Thermaplugg slain"],
  "Razorfen Kraul": ["Blueleaf Tubers|Roogug|Blueleaf Tubers", "Going, Going, Guano!|Agathelos the Raging|Kraul Guano", "A Vengeful Fate|Charlga Razorflank|Razorflank's Heart|H", "The Crone of the Kraul|Charlga Razorflank|Razorflank's Medallion|A"],
  "Scarlet Monastery: Graveyard": ["Vorrel's Revenge|Interrogator Vishas|Vorrel's Wedding Ring|H", "Hearts of Zeal|Azshir the Sleepless|Hearts of Zeal"],
  "Scarlet Monastery: Library": ["Hearts of Zeal|Houndmaster Loksey|Hearts of Zeal", "Mythology of the Titans|Arcanist Doan|Mythology of the Titans|A", "Compendium of the Fallen|Arcanist Doan|Compendium of the Fallen|H"],
  "Scarlet Monastery: Armory": ["Into The Scarlet Monastery|Herod|Head of Herod|H", "The Scarlet Armory|Herod|Scarlet Champion's Pauldrons|A"],
  "Scarlet Monastery: Cathedral": ["In the Name of the Light|High Inquisitor Whitemane|Whitemane and Mograine slain|A", "Into The Scarlet Monastery|High Inquisitor Whitemane|Head of Whitemane|H"],
  "Razorfen Downs": ["Extinguishing the Idol|Tuten'kash|Idol's flame put out", "Scourge of the Downs|Glutton|Glutton's gut", "Bring the Light|Amnennar the Coldbringer|Amnennar slain|A", "Bring the End|Amnennar the Coldbringer|Skull of the Coldbringer|H"],
  "Uldaman": ["The Lost Dwarves|The Lost Dwarves|Baelog's Journal|A", "Power Stones|Ancient Stone Keeper|Dentrium and An'Alleum Power Stones", "Reclaimed Treasures|Galgann Firehammer|Garrett Family Treasure|H", "The Platinum Discs|Ironaya|Discs of Norgannon", "The Obsidian Power Source|Archaedas|Obsidian Power Source"],
  "Zul'Farrak": ["The Prophecy of Mosh'aru|Theka the Martyr|First Mosh'aru Tablet", "Tiara of the Deep|Hydromancer Velratha|Tiara of the Deep", "Gahz'rilla|Gahz'rilla|Gahz'rilla's Electrified Scale", "Divino-matic Rod|Chief Ukorz Sandscalp|Divino-matic Rod"],
  "Maraudon": ["Shadowshard Fragments|Landslide|Shadowshard Fragments", "Vyletongue Corruption|Lord Vyletongue|Coated Cerulean Vial", "Legends of Maraudon|Celebras the Cursed|Scepter of Celebras", "Corruption of Earth and Seed|Princess Theradras|Princess Theradras slain"],
  "Sunken Temple": ["Into the Temple of Atal'Hakkar|Atal'alarion|Atal'ai Tablets", "Jammal'an the Prophet|Jammal'an the Prophet|Head of Jammal'an|A", "The God Hakkar|Morphaz|Egg of Hakkar charged|H", "The Essence of Eranikus|Shade of Eranikus|Essence of Eranikus"],
  "Blackrock Depths": ["Attunement to the Core|Lord Incendius|Core Fragment", "The Rise of the Machines|Golem Lord Argelmach|Head of Argelmach|H", "Dark Iron Legacy|Fineous Darkvire|Ironfel", "The Heart of the Mountain|Magmus|Heart of the Mountain", "The Royal Rescue|Emperor Dagran Thaurissan|Princess Moira freed|A"],
  "Lower Blackrock Spire": ["Seal of Ascension|War Master Voone|Gemstone of Spirestone", "Mother's Milk|Mother Smolderweb|Mother's Milk", "Bijou's Belongings|Quartermaster Zigris|Bijou's Belongings", "Warlord's Command|Overlord Wyrmthalak|Highlord Omokk, Voone and Wyrmthalak slain|H"],
  "Upper Blackrock Spire": ["For The Horde!|Warchief Rend Blackhand|Head of Rend Blackhand|H", "Blood of the Black Dragon Champion|General Drakkisath|Blood of the Black Dragon Champion", "General Drakkisath's Demise|General Drakkisath|General Drakkisath slain|A"],
  "Dire Maul": ["Lethtendris's Web|Alzzin the Wildshaper|Lethtendris's Web", "The Madness Within|Immol'thar|Immol'thar slain", "Elven Legends|Prince Tortheldrin|Kariel Winthalus found", "Unfinished Gordok Business|King Gordok|Gordok's Gauntlet"],
  "Scholomance": ["Kirtonos the Herald|Kirtonos the Herald|Kirtonos slain", "The Lich, Ras Frostwhisper|Ras Frostwhisper|Human Head of Ras Frostwhisper", "Doctor Theolen Krastinov, the Butcher|Doctor Theolen Krastinov|Krastinov slain", "Barov Family Fortune|Lord Alexei Barov|Barov family deeds"],
  "Stratholme": ["Of Love and Family|Timmy the Cruel|Of Love and Family", "Houses of the Holy|Malor the Zealous|Holy Water", "The Truth Comes Crashing Down|Balnazzar|Head of Balnazzar", "Dead Man's Plea|Baron Rivendare|Ysida Harmon freed"],
  "Molten Core": ["Hands of the Enemy|Sulfuron Harbinger|Hands of Lucifron, Sulfuron, Gehennas and Shazzrah", "The Molten Core|Baron Geddon|Garr and Baron Geddon slain", "Thunderaan the Windseeker|Ragnaros|Essence of the Firelord"],
  "Onyxia's Lair": ["Victory for the Alliance|Onyxia|Head of Onyxia|A", "Victory for the Horde|Onyxia|Head of Onyxia|H"],
  "Blackwing Lair": ["Nefarius's Corruption|Vaelastrasz the Corrupt|Vaelastrasz freed", "The Lord of Blackrock|Nefarian|Head of Nefarian"],
  "Zul'Gurub": ["Paragons of Power|High Priest Thekal|Primal Hakkari Idol", "The Heart of Hakkar|Hakkar|Heart of Hakkar"],
  "Ruins of Ahn'Qiraj": ["The Fall of Ossirian|Ossirian the Unscarred|Head of Ossirian the Unscarred"],
  "Temple of Ahn'Qiraj": ["The Secrets of the Qiraji|Battleguard Sartura|Ancient Qiraji Artifact", "C'Thun's Legacy|C'Thun|Eye of C'Thun"],
  "Naxxramas": ["The Dread Citadel|Patchwerk|Patchwerk slain", "The Fall of Kel'Thuzad|Kel'Thuzad|Phylactery of Kel'Thuzad"],
};

// ---------- tuning ----------
const XP_TABLE = [0, 400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600, 8800, 10100, 11400, 12900, 14400, 16000, 17700, 19400, 21300, 23200, 25200, 27300, 29400, 31700, 34000, 36400, 38900, 41400, 44300, 47400,
  50800, 54500, 58600, 62800, 67100, 71600, 76100, 80800, 85700, 90700, 95800, 101000, 106300, 111800, 117500, 123200, 129100, 135100, 141200, 147500, 153900, 160400, 167100, 173900, 180800, 187900, 195000, 202300, 209800];
let TF = 1;                        // global time factor, tuned by simulation
const SPAN = L => TF * (0.45 + L / 22); // durations stretch as you level: the first levels fly by, the 50s crawl
const sec = (s, L = S.level) => Math.round(s * 1000 * SPAN(L) * (0.8 + Math.random() * 0.4));
const mountF = () => S.mount >= 2 ? 0.5 : S.mount ? 0.65 : 1;
