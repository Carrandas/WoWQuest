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
