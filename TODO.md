# TODO

Open items first, then what has shipped (with what's still missing from each).

## Open

- [ ] **Wipes from the fight itself** (raid and dungeon wipes are still a roll, based on gear)
  - Today: group fights never kill anyone (health floors at 5%); boss deaths only come from a roll at the pull
    (`bossWipes` / `wipeChance`), so cooldowns, talents and healing don't decide the outcome
  - Done, the quick step (`wipePrep` in group.js): the roll happens as the pull starts, with what the group brings
    in: each hero cooldown ready (10% in a five-man, an eighth of that in a raid of 40), the healers' mana (low mana,
    more wipes), the hero's healing talents; the base chances are scaled so the average wipe rate stayed where it was.
    The chronicle names what went wrong ("Wiped on Garr at 23%: the healers ran out of mana", a boss's move from
    `BOSS_ROT`), and the boss frame shows the same percentage
  - The real plan:
    1. Let health reach zero in `simFight`: drop the 5% floor, a member at 0 is dead, stops casting
       (shown as "dead" already) and stops taking hits; enemy hits that would land on them move to the next target
    2. Threat and targets: when the tank dies, the boss turns to the next tank, or to a random member
       (healers and dps take tank-sized hits and die fast); off-tanks pick up adds
    3. Healer mana: healers drain mana per heal (`mpEnd` already exists); out of mana means no more heals,
       which is how long fights turn into wipes
    4. Snowball into a wipe: the fight is lost when all tanks are dead and the boss isn't almost dead,
       or when more than half the group is down; then everyone goes down within a few casts (like now)
    5. Damage done depends on who's alive: the enemy health curve slows down as dps die, so a fight
       with deaths runs longer and has more chance to go wrong (cap the length so a fight can't stall)
    6. Size the damage: boss hit size from the boss level and the raid's gear requirement (like `refHp` for solo),
       healing from healer gear; tune both so the wipe rate comes out near today's (about 6% per dungeon boss,
       10–18% per raid boss for a group geared just right), and much lower when overgeared
    7. Let everything that matters feed in: gear (members' gear levels, your gear), talents (damage taken,
       healing), cooldowns (shields, burst, heal cooldowns), boss scripts (Deep Breath, Ragnaros' adds)
    8. Battle rezzes and soulstones (optional): a druid or warlock can bring one dead member back once per fight
    9. Chronicle: name what went wrong ("Lorrik died to Wrath of Ragnaros", "The healers ran out of mana",
       "Wiped at 12%"), and keep "Wiped at x%" for the boss frame
    10. Calibrate with the long-run harness: wipe rate per raid by gear, deaths per hour, and that
        overgeared raids almost never wipe while undergeared ones wipe often
- [ ] **World chat and guild chat** (a chat panel, or chat lines in the chronicle that can be filtered)
  - General and Trade chat for the zone (Barrens chat, Chuck Norris jokes, "LF healer for Strat", gold sellers,
    "Where is Mankrik's wife?"), Looking for Group, the odd world PvP shout ("Southshore under attack!")
  - Guild chat with the roster's personalities: grats on levels and loot, raid reminders, arguments, the guild leader's
    message of the day, someone asking for a summon
- [ ] **Guild drama** (the guild as people, not a roster)
  - Loot: the druid who rolls on cloth, ninja looters, loot council fights, the raid leader's friends getting
    promoted and geared first, a DKP fight over a legendary
  - People: members late for the raid invite, someone leaving in the middle of a raid, the main tank leaving for the
    rival guild, a guild leader yelling on voice chat after the third wipe, a member quitting the game with a farewell
    post, the guild splitting up (and the hero picking a side)
  - Most of it as chronicle and guild chat lines with small real effects (a raid night called off, a slot to fill, a
    lost upgrade), so it stays fun and doesn't wreck the raid timeline
  - Also from the guild plan: guild achievements, the guild waiting on members who aren't attuned yet
- [ ] **Save to Google** (save the game to a Google account)
- [ ] **Expansion packs** (eventually)

## Done

- [x] **Damage meter numbers**: the hero's part comes from the casts in the pull (`heroPullWeight` in ui.js: burst
  windows and area spells on a pack push it up, casts lost to a stun or a fear pull it down, against the same casts at
  plain strength), so the hero lands anywhere in the top few of a raid instead of always first; raid bosses have more
  health (about 400 dps for a dps in Molten Core) and raid hits and heals are bigger (`RAID_HEAL`: about 280 hps
  for a healer), so the meter shows raid-sized numbers
- [x] **Area spells on boss adds** (`layoutChunks` in foes.js): a boss's adds (at the pull, or when a phase brings them)
  go down together when the group has area damage (`groupAoe`, or the hero's own), in one stretch and faster than one
  at a time: Garr's Firesworn, Lucifron's Protectors, Ragnaros's Sons of Flame
- [x] **Resistance as a real stat** (resist.js): fire, nature, frost and shadow, from the resistance gear chains, the
  Onyxia Scale Cloak and the raid's buffs (paladin auras, shaman totems, Aspect of the Wild, Shadow Protection, Gift
  of the Wild: whoever is in the group); Ragnaros, Magmadar, Princess Huhuran, Kel'Thuzad and Sapphiron (a wall without
  frost resistance) wipe more the further the raid is below what they ask for, Nefarian's Shadow Flame without the
  cloak; the chains are worked on without a goal once their raid comes up; the hero's resistance in the gear tab
  - Still missing: resistance enchants and potions as their own items, crafters making their own pieces
- [x] **The small things at 60** (fun.js): doing things for fun on city visits (duels outside the capital, the dance
  party on the bank, a lap around the world, the Thunder Bluff elevators, the gnome race to Booty Bay), the Ahn'Qiraj war
  effort's supplies out of the bags when the hero has them, the Tabard of the Argent Dawn (friendly) or the guild's
  tabard on the character sheet. Mr. Pinchy left out (The Burning Crusade)
- [x] **The calendar, the Darkmoon Faire, the holidays, the Gurubashi Arena** (calendar.js): twelve months of ten game
  days (a random start date per hero); the Darkmoon Faire the first three days of every month (Elwynn Forest and Mulgore
  in turn: prize tickets, Sayge's fortune, Darkmoon Prizes while levelling, the Amulet or Orb of the Darkmoon for 1200
  tickets, a Darkmoon Card for a deck bought on the AH: a gold sink); the Lunar Festival, Love is in the Air,
  Noblegarden, Children's Week, Midsummer, the Harvest Festival, Hallow's End and Winter Veil on their months: a gift
  for the level while levelling, at 60 one prize per year (the holiday's raid-level epic, from a prize bag, or one of
  its minipets: Whiskers the Rat and Speedy, the four Winter Veil pets); the Gurubashi Arena chest at 60 (the Arena
  Grand Master); goals for each, a calendar line in the Quests tab, three achievements
  - The Darkmoon Faire reputation (factions.js, from Faire visits and decks; more tickets per rank, a goal)
  - The holiday epics' names are made up (vanilla holidays had no raid-level gear)
  - Still missing: the city visits dressed up for the season, holiday goals with their own steps ("Honor 10 Elders"),
    the Darkmoon Faire's other decks (Warlords: Twisting Nether)
- [x] **Pre-raid best in slot** (prebis.js): the dungeon set piece by piece (the helm from Darkmaster Gandling, the
  shoulders from Overlord Wyrmthalak, the chest from General Drakkisath, the legs from Baron Rivendare, the rest from
  any level 52+ dungeon), the pre-raid set goal (the dungeon of a missing piece), and Dungeon Set 2 as a goal chain
  (Deliana or Mokvar, Bodley's Ghost Revealer, the Braziers, Kormok, Jarien and Sothos, Mor Grayhoof, Isalien, Lord
  Valthalak) for the class's Tier 0.5 set; two achievements
  - Molten Core past the third boss wipes more without the set (a week of dungeons before the first clear), and the
    hero picks the pre-raid goals on their own until then, so Tier 0.5 is worn into the first Molten Core clears
  - Still missing: the other dungeon set pieces' real bosses (gloves, belt, boots, bracers)
- [x] **Farming runs** (farming.js): a route per gathering profession (herbs, Thorium and Dark Iron, devilsaurs, or
  Stratholme and the Plaguelands without one) with rare finds (Black Lotus, Arcane Crystal, Dark Iron Ore for the Thorium
  Brotherhood, Devilsaur Leather, Righteous Orbs, Essence of Undeath): kept for the crafts (flasks without the AH's
  Black Lotus, the top crafts at 300 for a third of the price), the rest sold; the daily Transmute: Arcanite and the
  Mooncloth cooldown on city visits; two achievements
  - Still missing: farming runs as a goal of their own, Righteous Orbs and Essence of Undeath feeding real recipes
- [x] **Reputation grinds** (factions.js): one reputation scale (`S.fac`, friendly to exalted) for Timbermaw Hold, the
  Hydraxian Waterlords (Molten Core only; past honored only Golemagg and Ragnaros; the runes doused with Aqual
  Quintessence; Ocean's Breeze or Tidal Loop at revered), the Zandalar Tribe (Zul'Gurub; the idol enchants at honored,
  the Zandalar Signet for the shoulders at exalted), the Argent Dawn (Stratholme, Scholomance, Naxxramas and the
  Scourge Invasion; the Dawn recipes) and the Thorium Brotherhood (Blackrock Depths, Molten Core cores; the fire
  resistance recipes); grind trips with a goal (exalted in about four weeks), the recipes for the hero's craft, Defender
  of the Timbermaw, a Reputation list in the Quests tab, two achievements
  - Still missing: the recipes only as chronicle lines (nothing crafted from them), the Zandalar class sets, the
    Thorium Brotherhood steps of the fire resistance chain still count on their own
- [x] **Fishing** (fishing.js): the third secondary skill, with its own cap (trainer to 150, Old Man Heming's Expert
  Fishing book to 225, Nat Pagle's four fish for Artisan); off a city pier now and then while levelling, fishing trips at
  60 (waters by skill, the catch sold, Waterlogged Crates), Old Ironjaw in Ironforge and Old Crafty in Orgrimmar, the
  Stranglethorn Fishing Extravaganza on Sunday afternoons (the Arcanite Fishing Pole); three goals and three achievements
  - Still missing: the fish feeding Cooking, Mr. Pinchy, the seasonal fish
- [x] **The Scourge Invasion** (scourge.js): from the Ahn'Qiraj war effort to the first night in Naxxramas; necropolises
  over three of six zones (Plaguelands, Winterspring, Azshara, Tanaris, Burning Steppes) that move on when their shards
  are broken, attacks on towns, cultists and Shadowy Figures in the capitals, low levels dying under a necropolis; at 60
  invasion trips (waves at the Necrotic Shards, Shadows of Doom, the rare Lumbering Horror, Spirit of the Damned and Bone
  Witch) for Necrotic Runes and Argent Dawn reputation; the Blessed set per armor type (fewer wipes in Naxxramas), the
  attunement fee cheaper at revered and free at exalted, trips count toward its Argent Dawn step; a goal and two
  achievements
  - Still missing: the Tabard of the Argent Dawn and the rest of the rune vendor, the invasion in other heroes' chronicles
    while levelling (the hero levels before it starts)
- [x] **Legendaries, done properly** (legend.js): goals for Thunderfury (the Bindings from Garr and Baron Geddon,
  Highlord Demitrian, Elementium Ingots from Blackwing Lair, the Enchanted Elementium Bars, Prince Thunderaan summoned
  as a world boss), Sulfuras (the Eye from Ragnaros, Sulfuron Ingots from Golemagg, the Plans from Lokhtos, the
  Sulfuron Hammer: cheaper for a blacksmith) and Atiesh (forty Splinters, Anachronos, C'Thun and Kel'Thuzad, the demon
  in Stratholme; the mage, warlock, priest and druid versions). Only for the classes that used them, no healers with the
  weapons; the parts only drop with the goal set. Two to four months each
  - Still missing: the guild deciding who gets the parts (today the hero always does, at a chance), Atiesh's aura for the raid
- [x] **Class quests** (classq.js): spells held back until their quest is done, on a city visit with a named fight
  (Bear Form and Moonglade, Aquatic Form, the warlock's Voidwalker, Succubus, Felhunter and Felsteed, the four shaman
  totem quests, Tame Beast, Defensive and Berserker Stance, Instant Poison, Redemption, the Warhorse), the Whirlwind Axe
  and Verigan's Fist; at 60 the Charger and the Dreadsteed as quest chains with an 800 gold materials step (instead of
  the 1000 gold epic mount, landing in the same weeks), Rhok'delar and Lok'delar, Benediction / Anathema (the Splinter of Nordrassil from Eris Havenfire)
  Quel'Serrar (warrior and paladin tanks) and the Ancient Sinew Wrapped Lamina (Azuregos's sinew) as goals; the priest
  racial spells from their quests at 10 and 20 (Desperate Prayer, Feedback, Fear Ward, Starshards, Elune's Grace, Touch
  of Weakness, Devouring Plague, Hex of Weakness, Shadowguard)

- [x] **Professions**: gathering while questing, crafting on city visits, skill tiers to Artisan 300, recipes by
  colour, gear crafts (blue from skill 150), Tailoring bags, Alchemy potions and flasks, Enchanting (disenchanting,
  enchants), Engineering goggles and bombs, First Aid and Cooking, raid-level crafts and bind-on-equip epics on the AH,
  bought enchants for everyone, the professions tab. Still open: Fishing (above), recipes as dungeon drops, the
  Engineering toys (target dummy, a mechanostrider)
- [x] **Clean up the GUI**: character on the left, no backpack at the top, Equipment | Supplies & bags | Talents tabs,
  buffs with the character
- [x] **Proper enemies**: health and resource bars per enemy, rotations by type and for bosses, packs and adds, real
  damage sized by level and armor, stuns, fears, interrupts and heals, floating numbers
- [x] **Scripted boss moments**: VanCleef, Ragnaros, Onyxia, Nefarian, Kel'Thuzad, Patchwerk, Majordomo, Hakkar's Blood
  Siphon, C'Thun's Dark Glare and second phase, the Four Horsemen, Vaelastrasz, and the world bosses
- [x] **Area of effect for the hero and the group** (from 3 enemies): area spells on packs, Frost Nova, the party's
  area classes. Still open: area spells on boss adds (above)
- [x] **Damage meter for dungeons and raids** (damage and healing, this fight or the whole run; collapsible). Still
  open: the numbers (above)
- [x] **Talent trees**: real talents per tree, talent spells, effects, cooldowns
- [x] **Guild system**: friends from elite quests and dungeons, a friend questing along, the guild founded or joined
  around 20-30 and recruiting to about 50, the roster filling raids, personalities, the server-first race against a
  rival guild (with the guild going wild in chat), each member's gear level, DKP and raid loot, the guild bank,
  mid-run swaps and quits after wipes, guild premades, the Guild tab. Still open: guild achievements, a fixed core
  group of about ten, guild drama (above)
- [x] **Life at 60**: up to 4 goals (or 3 picked by the hero) that steer the days, mounts and minipets in the Collection
  tab, exalted with the other races, the Gates of Ahn'Qiraj (see Raid quests). The rest moved to "More to do at 60"
- [x] **Resistance sets, as goals** (`raidq.js`): fire, nature and frost sets as quest lines (reputation trips,
  dungeon and raid drops, crafts); a set cuts the wipe chance on its two bosses by up to a fifth, without it the
  raids play as before. The real stat is above
- [x] **World PvP, the 2005 way** (`wpvp.js`): sightings, fair fights and ganks in the contested zones from 20, honor
  for a win at any level (rank rewards wait for 60), a repair bill for a death; at 60, raids on enemy towns and
  capitals and Kazzak dragged into Stormwind, played like a battleground; Corrupted Blood in a capital. Still open:
  a flight path camper on arrival, guild members joining a fight while levelling
- [x] **PvP: battlegrounds and honor ranks** (`pvp.js`): Warsong Gulch, Arathi Basin and Alterac Valley at 60 after
  the attunements, enemy players with their own rotations, premades, the scoreboard, honor and the weekly update,
  ranks 1-14 with gear and the rank 11 war mount, the Alterac Valley mount, PvP goals, gear wear and death repairs,
  PvP potions, the PvP tab. Still open: brackets while levelling, Warsong Gulch / Arathi Basin reputation rewards,
  marks of honor, tabards, a PvP pet
- [x] **Endgame pacing and economy**: raid progression over about two months (attunements, raid nights, lockouts that
  remember kills, harder first kills), gold about 90g at 40 and 100-500g at 60, the epic mount after weeks
- [x] **Hunter pets and warlock demons**: tamed beasts with families, rare tames, happiness and feeding, demons by job,
  Infernal and Doomguard; pets hold one enemy while soloing
- [x] **Profession achievements**: skill tiers, firsts and totals, AH gold, Crusader
- [x] **Gold sinks while raiding**: enchants on every upgrade, bought flasks and consumables, bigger raid repair bills
  shown after the run, skipping luxuries when gold runs low, the weekly money line
- [x] **Raid attunement quest chains** (`raidq.js`): Attunement to the Core, the Drakefire Amulet and the Blood of the
  Black Dragon Champion, Blackhand's Command, The Dread Citadel (its 60 gold saved for like the mount), the Gates of
  Ahn'Qiraj with the Scepter of the Shifting Sands and Scarab Lord; the Raid quests list in the Quests tab
- [x] **World raid bosses** (`wboss.js`): Azuregos, Lord Kazzak and the four Emerald Dragons at the Great Trees come
  up now and then, called out in guild chat; on a free evening the raid goes for it: a race against the rival guild
  for the tag, often a fight with the other faction first (honor), then the fight with its own script (Arcane Vacuum
  and Mark of Frost, Capture Soul and Kazzak's supreme mode, the druid spirits, Draw Spirit, Corruption of the Earth,
  the Shades of Taerar) and loot; gone for a few days once anyone kills it. While levelling: a dragon pulled into
  Darkshire puts the town to sleep. Seven achievements, the World bosses list in the Quests tab
- [x] **Special moments around boss kills**: the heads of Onyxia and Nefarian on the city gates (Rallying Cry of the
  Dragonslayer for everyone in town, the quest reward the first time; someone else's head buffs a levelling hero
  too), the Warchief's Blessing after Rend, the Spirit of Zandalar after Hakkar, the guild chat going wild on a
  server first
