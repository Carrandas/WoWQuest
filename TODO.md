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
- [ ] **Area of effect for the hero and the group** (from 3 or more enemies at once)
  - Classes that can AoE switch to it on 3+ mobs: mages (Arcane Explosion, Flamestrike, Blizzard, Frost Nova + Cone of Cold),
    warlocks (Rain of Fire, Hellfire), paladins (Consecration), warriors (Whirlwind, Cleave, Thunder Clap),
    druids (Hurricane, Swipe), hunters (Multi-Shot, Volley), priests (Holy Nova)
  - AoE damages the whole pack at once, so packs die faster and closer together instead of one by one
  - Applies to 3-mob pulls while questing and to dungeon/raid packs; in groups the AoE classes also switch
- [ ] **Wipes from the fight itself** (raid wipes are still a roll, now based on gear)
- [x] **Damage meter for dungeons and raids** (damage and healing, this fight or the whole run; collapsible)
  - [ ] Base your own damage on your actual casts instead of a share of the group's
  - [ ] Raid numbers run low (about 125 dps/hps per player); raise raid boss health and heal sizes
- [ ] **Expand the talent tree** (it only shows 0 / 0 / 25 right now)
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
