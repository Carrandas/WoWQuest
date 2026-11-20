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
  - The guild grows with you: at some level your character founds a guild with a name
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
    - **Done** (except the PvP mounts): mounts in the Collection tab, ridden by rarity
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
  - Goals for it ("Fire resistance set: 140 of 200"), crafters making their own pieces
  - Rebalance so the endgame timeline holds: missing resistance slows those raids, having it doesn't speed them up
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
- [ ] **World PvP, the 2005 way**
  - Ganks and skirmishes while levelling: the Crossroads in the Barrens (the Alliance riding through), Hillsbrad and
    Tarren Mill against Southshore, Stranglethorn Vale, a level 60 camping the flight path. Mostly chronicle moments,
    sometimes a fight with another player (a player-like unit with a class and gear) and a corpse run
  - At 60: raids on the other faction's towns (Crossroads, Southshore, Astranaar), the big ones on a capital (an
    Alliance raid on Orgrimmar to kill Thrall, a Horde raid on Stormwind for King Varian... Bolvar), with the city
    guards as trash
  - Dragging a raid boss to town: Kazzak or the Emerald Dragons pulled into a city or a quest hub, and the chaos after
  - Later with the guild: guild members join, a world PvP night on the guild calendar
  - Honor and kills count toward the PvP item below once it's in; world PvP gives no gear on its own
- [ ] **PvP: battlegrounds and honor ranks** (at 60, maybe a bracket now and then while levelling)
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
- [ ] **Expansion packs** (eventually)
