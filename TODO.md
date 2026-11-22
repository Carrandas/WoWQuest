# TODO

Open items first, then what has shipped (with what's still missing from each).

## Open

- [ ] **Wipes from the fight itself** (raid and dungeon wipes are still a roll, based on gear)
  - Today: group fights never kill anyone (health floors at 5%); boss deaths only come from a roll at the pull
    (`bossWipes` / `wipeChance`), so cooldowns, talents and healing don't decide the outcome
  - Quick step first: each cooldown ready at the start of a boss pull lowers the wipe chance (say 10% per shield
    or burst, 15% per heal cooldown for healers), so being prepared counts while the rest stays as it is
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
- [ ] **Damage meter numbers**
  - Base your own damage on your actual casts instead of a share of the group's
  - Raid numbers run low (about 125 dps/hps per player); raise raid boss health and heal sizes
- [ ] **Area spells on boss adds** (bosses still go down one target at a time)
- [ ] **More to do at 60** (what's left of "Life at 60" below)
  - Farming runs as their own activity: Black Lotus routes, Thorium and Dark Iron, Righteous Orbs and Essence of
    Undeath for the top crafts, daily cooldowns (Arcanite transmute, Mooncloth)
  - Pre-raid best-in-slot hunting: the dungeon set from Upper Blackrock Spire, Stratholme and Scholomance, then the
    long chain that upgrades it (Dungeon Set 2); a pre-raid set goal
  - World events: Darkmoon Faire weeks (cards, tickets, the turtles), the Gurubashi Arena chest
  - The event minipets and Mr. Pinchy; the Tabard of the Argent Dawn and other rare good-lookers with the collections
  - The Ahn'Qiraj war effort as real materials out of the bags, and the gong-banger's moment in other heroes' chronicles
  - Doing things for fun, as chronicle flavour: duels outside Orgrimmar or Ironforge, a lap around the world, /dance
    on the Ironforge bank
- [ ] **Resistance as a real stat** (resistance sets are goals today, see below)
  - A resistance per school (fire, frost, nature, shadow) from gear, enchants, potions and the raid's buffs (paladin
    auras, shaman totems: today only names), shown in the gear tab next to item level
  - Bosses that are a wall without it (Sapphiron far below the target); crafters making their own pieces (Dark Iron,
    the Cenarion leather sets, Glacial, Icebane); the Onyxia Scale Cloak against Nefarian's Shadow Flame
  - Rebalance so the endgame timeline holds: the timeline is tuned without resistance, the gear only helps
- [ ] **Seasonal holidays, on the in-game calendar** (extra goals while one is on)
  - Hallow's End (the Headless Horseman's pumpkin, costume wands, candy buckets), Winter Veil (Greatfather Winter, a
    present on the 25th, snowball fights in Ironforge or Orgrimmar), the Lunar Festival (the Elders around the world,
    fireworks in Moonglade), Love is in the Air, Children's Week (an orphan following the hero around), Midsummer
    (the bonfires), Harvest Festival, and the Darkmoon Faire weeks
  - While one is on, its own goals show up next to the player's (with a time limit): "Honor 10 Elders", "Collect
    the Hallow's End treats", a holiday minipet or item at the end; a calendar line in the Quests tab
  - Holiday achievements, and the city visits dressed up for the season
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
