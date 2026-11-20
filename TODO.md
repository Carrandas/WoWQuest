# TODO

- [ ] **Professions**
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
- [ ] **Expansion packs** (eventually)
