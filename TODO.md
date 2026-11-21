# TODO

- [x] **Professions** (gathering + crafting; a third way to gear up, next to dungeons and PvP)
  - Not done yet: Fishing, recipes as dungeon drops, and the extra Engineering toys (target dummy, your own
    mechanostrider); Engineering only makes goggles and bombs so far
  - Skill tiers like back then: Apprentice 75, Journeyman 150 (level 10), Expert 225 (level 20), Artisan 300 (level 35);
    recipes orange/yellow/green/grey; pacing target roughly skill = level × 5, so 300 at 60
  - Picking (keep it simple, one pair per character, chosen at creation with a sensible default):
    - Anyone: Herbalism + Alchemy, or Mining + Engineering
    - By armor: Tailoring + Enchanting (cloth), Skinning + Leatherworking (leather/mail), Mining + Blacksmithing (plate)
  - Gathering while questing, as short tasks between mobs: "Picking a Peacebloom", "Mining a Copper Vein",
    "Skinning the Ridge Stalker" (after beast kills); nodes follow the zone (Copper → Tin → Iron → Mithril → Thorium,
    Peacebloom → Kingsblood → Sungrass → Dreamfoil), so the skill keeps up with the zones by itself.
    Cloth drops from humanoids (Linen → Wool → Silk → Mageweave → Runecloth); spare materials sell on the AH
  - Crafting in the city, on the normal city visit: train the next tier, then "Crafting at the anvil: 4× Heavy Copper
    Maul (Blacksmithing 87 → 96)"; buy missing materials on the AH to catch up
  - It should always craft something useful: an upgrade for an empty or weak slot, potions you'd otherwise buy,
    bags; skill-up fodder that isn't useful gets sold or disenchanted
    - Blacksmithing / Leatherworking / Tailoring: gear in the normal gear system, a bit below dungeon blues while levelling
    - Tailoring: bags too (more bag space, fewer selling trips)
    - Alchemy: your own potions and elixirs (cheaper supplies), flasks at 300 (cheaper raiding)
    - Enchanting: disenchant greens that aren't upgrades, enchant your own gear (stats on the item)
    - Engineering: bombs / sapper charges as burst cooldowns, target dummy as a shield, your own mechanostrider
  - Recipes as dungeon drops ("Plans: Lionheart Helm") make dungeon loot more exciting
  - Secondary for everyone: First Aid (bandages, shorter rests), Cooking ("Well Fed" buffs), Fishing (a fishing trip now and then)
  - Strongest while levelling and right at 60; it drops off once raiding starts, except for the expensive top end:
    - A few raid-level crafts (Lionheart Helm, Arcanite Reaper, the Flarecore set) needing rare materials
    - The odd bind-on-equip epic on the AH (raid trash and world drops)
    - Expensive and rare on purpose: no decking out in bought gear, but one great craft or one great BoE piece is
      a good use of gold at 60
  - Enchants for everyone, crafter or not: buy them in the city (Crusader on the weapon, stats on chest/bracers/boots);
    the good ones are expensive, so the hero saves up for them
  - Professions tab: skill bars (x / 300 with the tier name), known recipes, materials, recent crafts, gold made on the AH;
    the chronicle notes skill-ups at round numbers and every useful craft
- [x] **Clean up the GUI**
  - Put the character on the left
  - Remove the backpack at the top (it isn't needed and duplicates the bags)
  - Give equipment three tabs: Equipment | Supplies & bags | Talents
  - Move the buffs to the character
- [ ] **Save to Google** (save the game to a Google account)
- [x] **Proper enemies**
  - Each enemy has its own health bar and a mana, energy or rage bar
  - Each enemy has its own rotation: simple ones by type (fighter, mage, thief) and fancier ones for special bosses
  - Packs in dungeons and raids, boss adds, and the occasional group of two or three mobs out in the world
  - Real damage: enemy hits sized by level, reduced by armor and gear; deaths come from the fight
  - Stuns, fears and interrupts; enemy heals; floating damage and healing numbers
- [x] **Scripted boss moments**: VanCleef, Ragnaros, Onyxia, Nefarian, Kel'Thuzad, Patchwerk, Majordomo
  - [ ] More bosses (Hakkar's Blood Siphon, C'Thun's eye phase, the Four Horsemen, Vaelastrasz)
- [x] **Area of effect for the hero and the group** (from 3 or more enemies at once)
  - Area spells hit every enemy still standing (Cleave, Multi-Shot, Chain Lightning hit two or three); packs die together and sooner
  - With 3+ mobs the hero switches to area spells; pack-only spells (Arcane Explosion, Blizzard, ...) stay out of single-target fights
  - Dungeon packs: the area classes in the party add their share; Frost Nova freezes melee mobs for two actions
  - [ ] Area spells on boss adds (bosses still go down one target at a time)
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
- [x] **Damage meter for dungeons and raids** (damage and healing, this fight or the whole run; collapsible)
  - [ ] Base your own damage on your actual casts instead of a share of the group's
  - [ ] Raid numbers run low (about 125 dps/hps per player); raise raid boss health and heal sizes
- [x] **Talent trees**: real talents per tree, talent spells, effects, cooldowns
- [ ] **Guild system**
  - **Done** (first part): friends from elite quests and dungeons (up to 10, with a personality and a history), a friend
    questing along now and then, friends filling the dungeon groups, the guild founded or joined around level 20-30,
    recruiting to about 50, the guild roster filling the raids, personality lines in the chronicle, friends drifting
    away, the server-first race against a rival guild (Onyxia, Ragnaros, Nefarian, C'Thun, Kel'Thuzad), the Guild
    tab, five achievements. Helpers are company only: kill outcomes are the solo ones.
  - **Done** (second part): each member's own gear level (dungeon upgrades for everyone, raid loot through DKP bids,
    driving their bar on the damage meter), the hero's raid loot bought with DKP, DKP standings and recent loot in the
    Guild tab, the guild bank (dues; a flask when you run out on a raid night), mid-run swaps after a wipe (a guildie
    steps in, or "LF1M tank for MC, on Baron Geddon", and the pug may join the guild), a guildie quitting after five
    wipes in a row, guild premades for the battlegrounds. Still to come: guild achievements
  - Server firsts: the guild races other named guilds on the realm to the first kills (Onyxia, Ragnaros, Nefarian,
    C'Thun, Kel'Thuzad), with a realm progress board and a "Server first!" chronicle moment (or "<Rival guild> got
    there first"). It was competitive
  - Friends before the guild: elite quests and hard pulls while levelling are done with other players who happen to
    be around ("Grimtusk the Orc warrior helps you with Hogger"). Some of them stick: added as friends, they show up
    again, and later become the first guildies
    - On screen: reuse the dungeon party frames (health, mana, casting bar for each helper, and the damage meter),
      which already exist; simplest. Or just the helper as a second unit frame under the hero
  - A core group of about 10: the friends and guildies the hero plays with most. They join for questing and grinding,
    make up the regular dungeon groups (instead of random LFG names), form the heart of the raid, and later queue
    for battlegrounds together. Each has a class, a spec and a personality, so the same names keep turning up in
    the chronicle and on the meter
  - The guild grows with you: at some level your character founds a guild with a name (or the core group joins one)
  - Members join over time, enough for a 5-man dungeon first; dungeon groups are then made from the guild
  - Keep recruiting until there are 40 members at level 60, then raiding starts
  - Guild tab: name, class and spec, level, gear level for each member
  - Each member has their own gear; raid loot goes to members, so the guild visibly gets stronger
    (wiping on Onyxia, dungeons for gear, killing Onyxia, better gear, Molten Core, and so on)
  - Each member's gear drives their damage and healing on the damage meter
  - Keep it simple: guildies roughly follow your own level
  - A small personality per member ("always late", "Leeroy type", "loves pets") that shows up in the chronicle
    ("Stabbyjoe pulled the extra pack again.")
  - Members come and go: someone quits after five wipes, and the guild posts "LFM tank for MC, on Baron Geddon",
    which can bring in a new member; mid-run swaps too ("X has to go, Y joins")
  - A roster of about 50 for 40 raid spots, so some members sit out each week
  - DKP: points earned per raid, building up across raids, spent to buy the items members want
    ("Thrall wins [Perdition's Blade] for 120 DKP")
  - Guild bank: flasks before a raid, spare gear for new members and alts, gold for repairs
  - Guild achievements (low priority, overlaps with the current achievements)
  - Gear without simulating everyone's runs: each time your group finishes a dungeon, every guild member
    has a chance at an upgrade (as if they ran one too), with some randomness in who gets what, so the
    whole guild keeps up with your character. Raid loot goes to members through DKP
  - Start simple: each member's gear is one gear level (what drives their damage and healing).
    Full gear sets per member could come later, if the guild tab should show their items
- [ ] **Life at 60: goals, collections and things to do besides raiding**
  - Goals: the player picks 3-5 from a list (or lets the hero pick), shown on the character tab with progress bars,
    and the time between raid nights fills up with whatever moves them along. Something to do while waiting for the
    raid, and a reason to run Stratholme far too often: "Saving for an epic mount: 412 / 1000g", "Exalted with
    Timbermaw Hold", "Deathcharger's Reins (Stratholme, 1%)", "Pre-raid set: 6 / 8 pieces", "Master Angler",
    "Collect 15 minipets". A finished goal is a chronicle moment, then pick the next one
    - The list shows what each goal involves and roughly how long it takes; goals that need something first say so
      (the Frostsaber needs Winterspring, the Deathcharger needs Stratholme open to your gear)
    - **Done**: up to 4 goals on top of the Quests tab at 60 (the hero picks 3 until the player does): epic mount, a fat
      purse (2000g), clear the next raids, Deathcharger's Reins, a Zul'Gurub mount, the Frostsaber, exalted with each
      other race, collect N minipets. Each one steers the days (farming, Stratholme, Winterspring, Runecloth). Still to
      come once those systems exist: Timbermaw and Argent Dawn reputation, the pre-raid set, Master Angler
  - Collections, and a collections tab with a mount bar and a minipet bar (the empty slots say where each comes from):
    - **Done**: mounts in the Collection tab (the PvP mounts too), ridden by rarity
    - Mounts: Deathcharger's Reins (Baron Rivendare, Stratholme), Swift Razzashi Raptor and Swift Zulian Tiger (Zul'Gurub),
      Winterspring Frostsaber (Wintersaber Trainers, Alliance), the other races' mounts at exalted with their city,
      the AQ40 Qiraji battle tanks, the PvP mounts (Frostwolf Howler, Stormpike Battle Charger) once PvP is in
    - Minipets, a big one, from early on (not only at 60). **Done**: 29 pets (vendor, Gadgetzan AH, Narkk, rare drops,
      OOX, engineering), the companion, the Collection tab and six achievements; still to come: the event pets and Mr. Pinchy
      - Bought from vendors while levelling, cheap and a nice first collectible around level 10: the cats in Elwynn
        Forest (Bombay, Tabby, Siamese, Cornish Rex, Orange Tabby, Silver Tabby, from Donni Anthania), the Snowshoe
        Rabbit in Dun Morogh, owls in Darnassus; for the Horde the Prairie Dog in Thunder Bluff, the snakes (Black,
        Brown and Crimson Kingsnake) and the Cockroach in Undercity, the Hawk Owl and Great Horned Owl
      - The other faction's vendor pets only through the neutral Auction House in Gadgetzan (or Booty Bay, Everlook),
        at a markup: a reason to visit Tanaris
      - Ground out: the Booty Bay parrots (Hyacinth Macaw from the pirates, rare), the whelps (Dark and Crimson
        Whelpling in the Wetlands, Azure in Winterspring, Emerald in the Swamp of Sorrows), Worg Pup and Smolderweb
        Hatchling (Lower Blackrock Spire), Sprite Darter Hatchling (Feralas)
      - From quests and events: the Mechanical Chicken, the Darkmoon Faire turtles and frogs, the holiday ones
        (Tiny Snowman at Winter Veil); Mr. Pinchy's Magical Crawdad as a rare nod (strictly The Burning Crusade)
    - The odd good-looking rare (world drop epics, Tabard of the Argent Dawn), shown with the collections
  - Farming runs as their own activity: herbs (Black Lotus routes in Winterspring and Burning Steppes), Thorium and
    Dark Iron, Runecloth, Righteous Orbs and Essence of Undeath for the top crafts, daily cooldowns (Arcanite
    transmute, Mooncloth); ties into the masterworks and pays for the epic mount
  - Reputation grinds, each with a reward: Argent Dawn (Scourgestones, the Naxxramas attunement), Timbermaw Hold,
    Thorium Brotherhood (Molten Core recipes), Hydraxian Waterlords (dousing the runes in Molten Core), Zandalar Tribe
    (Zul'Gurub enchants), Cenarion Circle, the Wintersaber Trainers, the other faction cities (their mounts)
  - Fishing as the third secondary skill: fishing trips, Nat Pagle's quests, the odd rare catch (Old Ironjaw, Old Crafty)
    - The Stranglethorn Fishing Extravaganza on Sundays: the first to bring 40 Speckled Tastyfish to Booty Bay wins
      (the Arcanite Fishing Pole or the Glimmering Mithril Insignia, and Master Angler); the hero enters when it can
      fish, wins now and then, and the chronicle makes a big deal of it
  - Pre-raid best-in-slot hunting: farming Upper Blackrock Spire, Stratholme and Scholomance for the dungeon set, then
    the long chain that upgrades it (Dungeon Set 2)
  - World events: Darkmoon Faire weeks (cards, tickets, the turtles), the holidays (Hallow's End, Winter Veil, Lunar
    Festival elders), world bosses (Azuregos, Kazzak, the Emerald Dragons) and the Gurubashi Arena chest
  - The Gates of Ahn'Qiraj: the server-wide war effort (both factions hand in supplies for weeks), the Scepter of the
    Shifting Sands quest line (Anachronos, the Green Dragonflight, the Nefarian and Vaelastrasz parts), and the one who
    bangs the gong in Silithus gets the Black Qiraji Resonating Crystal, the black battle tank, the rarest mount of all.
    The Ten Hours War follows, and only then do Ruins and Temple of Ahn'Qiraj open (they'd start locked)
    - It fits the raid lockouts already there: the gates open on the raid timeline (around when AQ40 is due today),
      then Ruins of Ahn'Qiraj resets every three days like Zul'Gurub and the Temple weekly with the other big raids
    - **Done** (`raidq.js`): the war effort starts when the hero's raids reach Blackwing Lair (or 30 days after 60) and
      takes about a week (a hand-in a day from the hero); the Scepter of the Shifting Sands is a goal, and whoever has
      it first after the effort bangs the gong (the rival guild needs Nefarian too): the hero gets the Black Qiraji
      Battle Tank and Scarab Lord. The Ten Hours War, then both raids open. Still open: the war effort as real mats
      out of the bags, the gong-banger's server-wide moment in the chronicle of other heroes
  - Doing things for fun, mostly chronicle flavour: guild chat, duels outside Orgrimmar or Ironforge, world PvP in
    Hillsbrad, a lap around the world, /dance on the Ironforge bank
  - Achievements for the collections (10 / 25 minipets, 5 mounts, Deathcharger, Exalted with 5 factions)
- [ ] **Resistance gear for the raids that ask for it** (fire for Molten Core, nature for AQ40, frost for Naxxramas)
  - Today resistance is only a name: the paladin auras and the Greater Resistance cloak enchant do nothing, and
    Ragnaros or Sapphiron are just bosses with a bigger number
  - A resistance per school (fire, frost, nature, shadow) from gear, enchants, potions and the raid's buffs (paladin
    auras, shaman totems), shown in the gear tab next to item level
  - Bosses that check it: Magmadar and Ragnaros (fire), Princess Huhuran and Viscidus (nature), Sapphiron and
    Kel'Thuzad (frost). Below the target they hit harder and wipe more; far below (Sapphiron), they're a wall
  - Where it comes from, as a grind between raid nights:
    - Fire: Thorium Brotherhood reputation and its crafts (Dark Iron pieces for smiths, the Molten Helm for
      leatherworkers), the odd blue drop, Greater Fire Resistance on the cloak, Greater Fire Protection Potions
    - Nature: Cenarion Circle reputation from Silithus quests, its leather sets (Sandstalker, Spitfire, Bramblewood),
      Greater Nature Protection Potions
    - Frost: the Argent Dawn sets (Glacial for tailors, Polar and Icy Scale for leatherworkers, Icebane for smiths),
      which need Frozen Runes from Naxxramas and Argent Dawn reputation; Frost Protection Potions
  - **Done, as goals** (`raidq.js`): fire, nature and frost resistance sets as quest lines (reputation trips, dungeon
    and raid drops, crafts), picked by the player; the set's resistance cuts the wipe chance on its two bosses by up to
    a fifth. The baseline is unchanged (heroes without the gear raid as before). Still open: resistance as a real
    stat from gear, auras and totems, bosses that are a wall without it, crafters making their own pieces
  - Goals for it ("Fire resistance set: 140 of 200"), crafters making their own pieces; the player can pick a
    resistance set as a goal (fire before Ragnaros, nature before Huhuran, frost before Sapphiron), and the hero
    farms the reputation, the quests and the mats for it between raid nights
  - Gear from quests too: the Cenarion Circle and Argent Dawn quest rewards, the Onyxia Scale Cloak against
    Nefarian's Shadow Flame, so each set is a short quest line and not only a shopping list
  - Rebalance so the endgame timeline holds: the timeline is tuned without resistance, the gear only helps
- [ ] **Legendaries and class quest weapons, done properly** (today: shortcuts)
  - Today: two Bindings of the Windseeker (from any Molten Core boss) make Thunderfury on the spot, the Eye of Sulfuras
    becomes Sulfuras on the spot, casters get Atiesh from 40 Splinters in Naxxramas; any class can get any of them
  - Thunderfury: the left and right Bindings from Garr and Baron Geddon only, then Highlord Demitrian in Silithus,
    10 Elementium Bars (Elementium Ore from Blackwing Lair, a smith to smelt it, lots of gold), and Prince Thunderaan
    as a raid fight. Swords, fist weapons and tanks only (no priests with Thunderfury)
  - Sulfuras: the Eye of Sulfuras plus the Sulfuron Hammer, which needs a blacksmith (the hero, or paying one)
  - Atiesh: the Anachronos quest and the four class versions (mage, warlock, priest, druid)
  - Class quest weapons:
    - Benediction / Anathema (priest): the Eye of Divinity from Majordomo Executus, the Splinter of Nordrassil
    - Rhok'delar and Lok'delar (hunter): the Ancient Petrified Leaf from Majordomo, then four demons to kill alone
      in Ashenvale, Azshara, Felwood and the Swamp of Sorrows: a real test for the pet
    - Quel'Serrar (tanks): the Foror's Compendium from Dire Maul, tempered in Onyxia's breath
    - Shaman and druid quests, and the warlock and paladin epic mount quests as proper chains (mounts already in)
  - Goals for each ("Thunderfury: 2 of 2 Bindings, 3 of 10 Elementium"), with the long chain as the grind
- [x] **World PvP, the 2005 way**
  - **Done**: in the contested zones from level 20 (Hillsbrad, Stranglethorn, Ashenvale, Arathi, the Barrens...), now
    and then a player of the other faction instead of a mob: a sighting, a fair fight (one or two players around your
    level) or a gank by a level 55-60 (sometimes camped at the corpse); no honor or repair bill while levelling. At 60, a
    world PvP night now and then on an evening without a raid (more with a guild): raids on Tarren Mill, the Crossroads,
    Southshore, Astranaar, the capital (Thrall, Bolvar), and Lord Kazzak dragged into Stormwind, played like a
    battleground (guards, defenders, the leader). Corrupted Blood in a capital and Kazzak in Stormwind as city-visit
    events (no auction house that day). The World PvP part of the PvP tab, eight achievements. Still to come: the
    Emerald Dragons pulled into a quest hub, a flight path camper on arrival, guild members joining a fight while levelling
  - Ganks and skirmishes while levelling: the Crossroads in the Barrens (the Alliance riding through), Hillsbrad and
    Tarren Mill against Southshore, Stranglethorn Vale, a level 60 camping the flight path. Mostly chronicle moments,
    sometimes a fight with another player (a player-like unit with a class and gear) and a corpse run
  - At 60: raids on the other faction's towns (Crossroads, Southshore, Astranaar), the big ones on a capital (an
    Alliance raid on Orgrimmar to kill Thrall, a Horde raid on Stormwind for Highlord Bolvar Fordragon, since King Varian was missing in vanilla), with the city
    guards as trash
  - Dragging a boss to town: Lord Kazzak pulled out of the Blasted Lands into Stormwind (the classic), or the
    Emerald Dragons into a quest hub, and the chaos after
  - Hakkar's Corrupted Blood: a raid comes back from Zul'Gurub with the plague (or a hunter's pet carries it), and it
    spreads through Ironforge or Orgrimmar. Low levels drop dead in the streets, everyone else stays out of town for
    a day. A chronicle event, and a reason the hero skips the city visit
  - Later with the guild: guild members join, a world PvP night on the guild calendar
  - Flavour and fun, no gear: world PvP never gave any. Easier to add after the PvP item below (player-like enemies,
    honor kills), so it comes after that one
- [ ] **PvP: battlegrounds and honor ranks** (at 60, maybe a bracket now and then while levelling)
  - **Done**: Warsong Gulch, Arathi Basin and Alterac Valley at 60 after the raid attunements, a few games on an evening
    without a raid (more with a PvP goal); enemy players of the other faction with their own rotations and crowd control,
    the valley's captains and generals; guild premades (and the rival guild's); graveyard deaths; the scoreboard; honor,
    the weekly update with decay, ranks 1-14 with titles, rank gear (3, 7, 8, 10, 12, 13, 14), the rank 11 war mount
    with epic riding, the Alterac Valley mount at exalted; PvP goals picked by the player (rank 14 in about two months),
    both teams in the group frames (yours green, theirs red), the PvP tab, fourteen achievements. Still to come:
    brackets while levelling, Warsong Gulch / Arathi Basin reputation rewards, marks of honor, tabards, a PvP pet
  - Battlegrounds, played out like a dungeon run (queue, "X joined Warsong Gulch", a string of fights, win or loss):
    - Warsong Gulch (10 vs 10): capture the flag, first to 3 caps ("Dalwyn picked up the Horde flag!", "2–1 Alliance")
    - Arathi Basin (15 vs 15): five bases, a resource race to 2000, bases changing hands
    - Alterac Valley (40 vs 40): towers and graveyards down the valley, ending in a boss fight against Vanndar
      Stormpike or Drek'Thar (reuse the boss scripts)
  - Enemy players in the enemy panel: real classes of the other faction with gear for the bracket and their own
    rotations (healers heal, rogues stun, mages sheep); reuse the existing stun/heal machinery
  - Win chance from both teams' gear plus how the hero does; dying respawns at the graveyard (not a real death,
    the chronicle says "Died 3 times in Warsong Gulch")
  - Scoreboard instead of the damage meter: both teams with killing blows, honorable kills, deaths, honor
  - Honor ranks 1–14 (Private/Scout up to Grand Marshal/High Warlord): honor per game, turned into rank progress
    each in-game week, slow decay when you stop; higher ranks need more honor, so rank 14 is a long goal
  - Rewards (the point of doing it):
    - Gear that helps you into raids: rank 7–9 blues (best-dungeon level), rank 10–13 epics (between Molten Core and
      Blackwing Lair), rank 14 weapons (Blackwing Lair level). One gear system: rank items go in the normal pool and
      are worn when they beat the slot, so they fill gaps and help reach a raid's gear score, then raid gear takes over
    - Mounts: the rank 11 epic war mount (an epic mount without saving 1000 gold), the Alterac Valley mounts at
      exalted (Stormpike Battle Charger / Frostwolf Howler)
    - Pets: a small collection could start here (a battleground pet, a rank pet)
    - Potions and bandages from Warsong Gulch / Arathi Basin reputation, rings and trinkets from Alterac Valley
    - Titles next to the name ("Sergeant Ulenrath"), tabards, marks of honor to spend
  - PvP tab: rank with a weekly progress bar (and the decay), wins and losses per battleground, flags captured,
    bases taken, generals killed, killing blows, honorable kills, deaths, highest rank reached
  - The week at 60: raid when the lockout is open, otherwise battlegrounds or dungeons (maybe a PvP-mood setting)
  - Later with the guild: premades from guildmates win more often and show up in the chronicle
  - Order: Warsong Gulch first, then ranks and rewards, the PvP tab, then Arathi Basin and Alterac Valley
- [x] **Endgame pacing and economy**: raid progression over about two months (attunements, raid nights, lockouts that
  remember kills, harder first kills), gold about 90g at 40 and 100-500g at 60, the epic mount after weeks;
  the damage meter shows a pet's damage on its owner's bar
- [x] **Hunter pets and warlock demons**: tamed beasts with names and families, rare tames (Broken Tooth, Lupos…),
  happiness and feeding, Mend Pet / Health Funnel; demons by job (Voidwalker solo, Succubus for Demonology, Felhunter
  against casters, Imp in groups), Infernal from 50, Ritual of Doom in raids; pets hold one enemy while soloing
- [x] **Profession achievements**: skill tiers, firsts and totals for gathering and crafting, AH gold, Crusader;
  blue crafts from skill 150 (two signature slots per craft); totals on the professions tab
- [x] **Gold sinks while raiding** (gold piles up at 60 today; raiding should cost money like it did)
  - Enchants: every new item wants an enchant, so each upgrade costs gold; shown on the item ("Enchanted: Crusader",
    or "not enchanted" in grey) and the enchant adds its stats. The hero enchants new gear on the next city visit when
    the gold is there, best slots first (weapon, chest), the expensive ones (Crusader) when it can afford them
  - Flasks cost money: today the flask at the raid portal is free; buy them on the AH (or make them with Alchemy),
    plus raid consumables (elixirs, potions, food), so each raid night has a supply bill
  - Wipe bills: wipes already cost repairs; make raid repairs noticeably bigger than dungeon ones and show the bill
    after the run ("Repairs after Molten Core: 38g")
  - When gold runs low: skip the luxury (no flask, cheaper enchant), or go farming for a while ("Farming Thorium in
    Winterspring", "Running Stratholme for gold"), so the gold actually matters
  - A small money line on the character tab: gold spent this week on enchants, consumables and repairs
- [x] **Raid attunement quest chains, as goals** (an attunement used to be a count of level 60 dungeon clears)
  - **Done** (`raidq.js`): Attunement to the Core, the Drakefire Amulet (Alliance) and the Blood of the Black Dragon
    Champion (Horde), Blackhand's Command, The Dread Citadel: trips, dungeon steps that can come up empty, the Argent
    Dawn grind and 60 gold. The hero works on them on its own, faster as a goal; the Raid quests list in the Quests tab.
    Still open: the guild waiting on members who aren't attuned yet
  - Each raid behind its real chain: Attunement to the Core (Lothos Riftwaker, a Core Fragment from Blackrock Depths)
    for Molten Core; the Drakefire Amulet for Onyxia (Alliance: Marshal Windsor, the Blackrock Spire escape, Unfired
    Plate Gauntlets and the Blood of the Black Dragon Champion; Horde: Rexxar, the Warlord's Command, Emberstrife);
    Blackhand's Command (the Scarshield Quartermaster's note in Blackrock Spire) for Blackwing Lair; the Argent Dawn
    reputation and the gold or mats for Naxxramas; Ahn'Qiraj opening for everyone with the gates
  - Steps that send the hero to real places (dungeons, Burning Steppes, Dustwallow Marsh), shown as a chain in the
    Quests tab with the current step
  - The player can pick a chain as a goal ("Drakefire Amulet: step 6 of 14"), otherwise the hero works on them on its
    own as today; the guild waits on members who aren't attuned yet (a slot to fill, the chronicle grumbling)
  - World raid bosses, Zul'Gurub and Ruins of Ahn'Qiraj need no attunement, as in classic
  - Keep the timeline: the chains take about as long as the dungeon clears they replace
- [ ] **World raid bosses** (the outdoor bosses as real raid fights, not just a name in the world events line above)
  - Azuregos in Azshara, Lord Kazzak in the Blasted Lands, the four Emerald Dragons (Ysondre, Lethon, Emeriss,
    Taerar) at the Great Trees in Duskwood, Ashenvale, Feralas and the Hinterlands
  - Called out in guild chat when someone spots one ("Azuregos is up!"), a race against the rival guild to tag it first,
    the other faction showing up to fight over it (a world PvP fight first), then the boss fight with the guild roster
  - Their own scripts and loot (Azuregos's Mark of Frost and teleport, Kazzak healing on kills, the dragons' sleep and
    Mark of Nature), and a few achievements
  - The fun ones as chronicle moments: a dragon pulled into a quest hub, everyone asleep in Darkshire
- [ ] **The Scourge Invasion** (the run-up to Naxxramas)
  - Necropolises hang over a few zones (Eastern and Western Plaguelands, Winterspring, Azshara, Tanaris, Burning
    Steppes); Scourge attacks on towns and quest hubs, cultists and shadowy figures in the capitals
  - At 60: fighting the invasion between raid nights for Argent Dawn reputation and Necrotic Runes, traded for the
    Argent Dawn gear; the odd level 20 killed questing too close to a necropolis
  - Ends when Naxxramas opens, so it goes with the raid timeline
- [ ] **Special moments around boss kills** (more of what Scripted boss moments started)
  - Onyxia's head on the city gates and the Rallying Cry of the Dragonslayer for everyone in town (the hero too, when
    its guild killed her); the same for Nefarian's head; the Warchief's Blessing after Rend in Upper Blackrock Spire
  - A big chronicle moment for each server first and first kill (screenshots of the guild on the corpse, the guild
    chat going wild), and more scripted fights for the bosses that had famous moments
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
- [ ] **Expansion packs** (eventually)
