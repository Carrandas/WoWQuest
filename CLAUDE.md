# WoWQuest

An idle tribute to levelling in classic (vanilla) World of Warcraft. The hero quests, trains, runs dungeons and raids on their own; the player watches. Level 1 to 60 takes about five days of play time.

## Layout

Plain HTML, CSS and vanilla JS: no build step, no dependencies, no modules. GitHub Pages serves `main` as is, and opening `index.html` from disk works too.

- `index.html`: the page shell. It loads `style.css` and the scripts in `js/`, in order.
- `style.css`: all styles.
- `js/`, in load order:
  - `util.js`: small helpers (`R`, `pick`, `rnd`, `clamp`, `esc`, `money`, `$`, `onButton`), time constants (`MIN`, `HOUR`, `DAY`, `WEEK`)
  - `data.js`: races, classes, zones, routes, dungeons, raids, dungeon quests, the time scale (`SPAN`, `sec`). Zones, dungeons and raids are written as compact rows and turned into objects at load: a zone is `{ min, max, hubA, hubH, mobs, quests }`, a dungeon or raid `{ name, min, max, side, abbr, trash, bosses, loot }` (find one with `instanceRow(name)`)
  - `hero.js`: the state `S` and browser saves, items and gear, spells and levels, quests, buffs and supplies, `newHero`
  - `professions.js`: gathering, crafting, gold (`spend`, `spendable`), enchants
  - `journal.js`: achievements, the zone and dungeon journal
  - `group.js`: dungeon and raid groups, their rotations, group fights (`simFight`, `partyFight`), wipe chance
  - `social.js`: friends and the guild (`S.friends`, `S.duo`, `S.guild`): helpers on elite quests and a friend questing along (`t.helpers` on kill tasks, company only: kill outcomes stay solo), friends filling dungeon slots and the guild roster filling raids (`socialMember` in `makeParty`), personality lines, founding and recruiting, the server-first race against a rival guild, each member's gear level (`gear`, gear score / level: drives their meter bar), DKP and raid loot (`guildLoot`, `heroBid`), the guild bank, mid-run swaps and quits after wipes; the Guild tab
  - `pvp.js`: PvP at 60, after the raid attunements (`pvpOpen`): battlegrounds (`BGS`: Warsong Gulch, Arathi Basin, Alterac Valley) queued like a dungeon run on evenings without a raid (`pvpPick` in `pickDungeon`, `queueBG`, a few games in a row), with the result and the story (caps, bases, towers, the hero's deaths) rolled at queue time; fights are `trash` tasks with `t.bg`, `t.foes` (one to three enemy players with a class and their own rotation, `PVP_ROT`; the valley's captains and generals bring a crowd) and `t.allies` (the up to two of yours in the fight: `partyFight` marks the rest `idle`, and the frames show their job, `S.dg.duty` / `E[j].duty`), battleground deaths are kept in `S.pvp` (not in `S.deaths`); PvP costs gold: gear wear per fight and a bigger repair bill per death (`PVP_WEAR`, `PVP_DEATH_WEAR`), and PvP potions (`S.cons.pvp`, `pvpSupplies` on city visits, bought even while saving for the epic mount) that the hero drinks when focused; honor, the weekly rank update (`pvpWeek`: rank points lose a fifth, the week's honor adds), ranks 1-14 and their rewards (gear, the rank 11 war mount with epic riding, the Alterac Valley mount at exalted); PvP goals (a rank to reach, the Alterac Valley mount: only the player picks them, so raid progress stays put; rank 14 takes about two months with the goal); both sides in the group frames (yours in green, theirs in red, `S.dg.E`); the PvP tab and the scoreboard (the meter's Score button)
  - `wpvp.js`: world PvP: in contested zones from level 20, `wpRoll` (in `planField`) now and then swaps a fight for a sighting (`wpsee`), a fair fight or a gank by a much higher level player; those are `kill` tasks with `t.wp` and `t.foes` (one or two players), the result rolled up front (`t.die`, `t.dieAt`; `wpOutcome` bends `soloFight`'s health to it) and finished by `wpEnd` (no quest progress, no loot, a repair bill for a death, a win is honor for the rankings at any level: `HK_HONOR` per player beaten; rank rewards wait for 60 in `pvpWeek`; not in `S.deaths`). At 60, `wpPick` (in `pickDungeon`) now and then queues a raid on an enemy town or capital or the Kazzak drag (`WP_RAIDS`, `queueWP`): run like a battleground (`S.dg.bg` and `S.dg.wp`, `bgFight`), ending in `wpend`. City-visit events (`wpCityEvent`: Corrupted Blood, Kazzak in Stormwind) skip the auction house. Counts in `S.wpvp`
  - `minipets.js`: minipets to collect (`MINIPETS`, `S.minipets`, `S.companion`): vendor pets on city visits, the other faction's through the Gadgetzan AH, rare drops, the OOX escorts, engineering builds; the Collection tab
  - `mounts.js`: mounts to collect (`mountList`, `S.mounts`, `rideName`): own and class mounts, the other races' at exalted (Runecloth turn-ins, `S.rep`), the Winterspring Frostsaber, the rare drops (Deathcharger, Zul'Gurub, Qiraji tanks); the Mounts part of the Collection tab
  - `goals.js`: goals at 60 (`goalDefs`, `S.goals`, `hasGoal`, `goalWith`): the player picks up to 4 (or the hero picks 3, `S.goalAuto`), each steers what the hero does between raid nights (`goalZone`, `goalFarm`, `goalRaid`, `goalDungeon`); the Goals list on top of the Quests tab and the picker
  - `raidq.js`: raid quests at 60 (`ATT_CHAINS`, steps `go` / `run` / `boss` / `gold`, `S.att` step per chain, `S.attN` counts): the attunement chains (`attuned(raid)`: Molten Core, Onyxia's Lair per faction, Blackwing Lair, Naxxramas; worked on without a goal too: `attDungeon` in `pickDungeon`, `attTrip` after the city visit, `attRun` on dungeon clears and raid nights), the goal-only chains (the Scepter of the Shifting Sands, the fire / nature / frost resistance sets: `resWipe` in `wipeChance`), the Gates of Ahn'Qiraj (`S.aq`, `aqTick`: the war effort, the gong, the Ten Hours War; `aqOpen` gates Ruins and Temple of Ahn'Qiraj); the Raid quests list in the Quests tab
  - `resist.js`: resistance as a stat (fire, nature, frost, shadow: `resGear` from the gear chains and the Onyxia Scale Cloak, `resBuffs` from the classes in the group, `resTotal`): `RES_BOSS` and `resWipe` in `wipeChance` (Sapphiron a wall without frost resistance, Nefarian without the cloak), `resLine` in the chronicle, the cloak on a city visit (`resCity`); the gear chains (`fire`, `nature`, `frost` in `ATT_CHAINS`) run without a goal once their raid comes up (`auto`)
  - `classq.js`: class quests (`CLASS_QUESTS`, `S.cq` step per quest): while levelling, spells held back until their quest is done (`cqHeld` in `trainSpells`; Bear Form, the demons, the totems, Tame Beast, stances, poisons, Redemption, the class mounts at 40; the priest racial spells, given by the quest: `race`, `grant`), queued on a city visit after training (`cqQueue`): trips (`cq` tasks) and a named fight (`cqFight`: a `kill` task with `t.cq`, the result rolled up front like world PvP, `cqFightEnd`; a death means a corpse run and another go, not in `S.deaths`); some give an item. At 60 the class chains are `ATT_CHAINS` entries with `cls` (raidq.js runs them, `fight` steps too): the Charger and the Dreadsteed (worked on without a goal; their gold step for the materials replaces the 1000 gold epic mount: `classMount`, `classMountReserve` in `mountReserve`), Rhok'delar and Lok'delar, the Lamina quiver, Benediction, Quel'Serrar (goals; `cls` may list several classes, `tank` only for tanks, `need` greys out the goal; `boss` steps with a drop chance count new kills only, `attDrop`; `wbPick` goes for a world boss a step waits on)
  - `legend.js`: the legendaries as goal chains (`ATT_CHAINS` entries with `cls` and `legend`): Thunderfury, Sulfuras, Atiesh (`boss` steps that collect drops: a fifth `"xN"` and a sixth `[lo, hi]`, counted in `S.attGot`; `gold` steps may take a function, `SMITH_FEE`: cheaper for a blacksmith; `noHeal` keeps healers out); the legendary parts never drop as plain loot (`LEGENDARY` in data.js); Prince Thunderaan is a summoned world boss (`summon` in `WB`, `thunderaanCalled`); `legendMigrate` for old saves
  - `prebis.js`: pre-raid best in slot (`S.preb.slots`: the dungeon set pieces found): `dsetDrop` in `lootDrop` (the four big pieces from their bosses, `DSET_SRC`, the rest anywhere), the `preraid` goal (`dsetDungeon` in `goalDungeon`), Dungeon Set 2 as an `ATT_CHAINS` goal chain (`dset2`, the Tier 0.5 set: `SET05`, items with `set: 0.5`; the hero picks both goals on their own before the first Molten Core clear); Molten Core past the third boss wipes more for every missing piece (`dsetWipe` in `wipeChance`, `dsetReady`: worn set pieces)
  - `calendar.js`: the in-game calendar (`S.cal`, `CAL_MONTH` days a month, `calDate`, `dateTxt`; `S.cal.d0` a random start): the Darkmoon Faire (`dmfOn`, `dmf` tasks: tickets, Darkmoon Prizes while levelling, the Amulet or Orb at 1200 tickets, the Darkmoon Card as a gold sink), the holidays (`HOLIDAYS`, `hol` tasks on a city visit via `calCity`: level gear, at 60 one prize per year: the epic from a prize bag or a minipet), the Gurubashi Arena (`arenaPick` in `pickDungeon`, `queueArena`); goals `hol:`, `holpet:`, `dmfcard`, `dmforb`, `arena` (only `arena` for the hero's own picks); the Calendar line in the Quests tab (`calRender`)
  - `fun.js`: the small things at 60: `fun` tasks on a city visit (`funCity`: duels, dancing on the bank, a lap around the world), the Ahn'Qiraj war effort's supplies from the bags (`aqSupply`, `aqTake`, set aside when the hand-in is queued), the tabard (`S.tabard`, `tabardGet`, `tabardNow`: the Argent Dawn's from friendly, else the guild's)
  - `wboss.js`: world raid bosses (`WB`: Azuregos, Lord Kazzak, the Emerald Dragons; rows in `WB_ROWS` and `RAID_INFO` in data.js, not in `RAIDS`): `wbTick` brings one up now and then (`S.wb.up`) and takes it away when someone else kills it; at 60, `wbPick` (in `pickDungeon`, on a free evening) and `queueWB` send the raid: the race for the tag, often a fight with the other faction first (`bgFight` tasks with `t.wb`, `wbPvpEnd`), the boss (a normal raid `boss` task), ended by `dend` → `wbEnd` (no lockout, no clear); while levelling, the boss next door as flavour (`wbsee`). The moments after big kills: the heads of Onyxia and Nefarian turned in on the next city visit (`wbCity`, `wbHead`: Rallying Cry of the Dragonslayer, the quest reward the first time), the Warchief's Blessing ("For The Horde!"), the Spirit of Zandalar; the World bosses list in the Quests tab
  - `farming.js`: farming runs at 60 (`farmTask` for the `farm` task in `choose`, `FARM_ROUTES` per gathering profession, `farmEnd`): rare finds kept in `S.farm.mats` for the crafts (`FARM_KEEP`; `farmLotus` for flasks, `farmCan` / `farmMat` in `masterwork`) and the rest sold; the daily cooldowns on a city visit (`farmCity`, `farmcd`: Transmute: Arcanite, Mooncloth)
  - `factions.js`: reputation at 60 (`S.fac`: points per faction, `FAC_RANKS`, `facGain`, `facRank`): `FACTIONS` (Timbermaw Hold, Hydraxian Waterlords, Zandalar Tribe, Argent Dawn, Thorium Brotherhood, the Darkmoon Faire: only from Faire visits, `goal` text instead of trips) with their trips and rewards per rank (an item, a recipe for the hero's craft, enchants that stay on their slot: `facEnchants` after `enchantGear`); points on their own from raid bosses (`facBoss`) and level 60 dungeon clears (`facRun`); grind trips for a `fac:` goal (`facPick` in `pickDungeon`, `queueFac`: `cqFight` kill tasks with `t.fac`, ended by `facturn`; only the player picks them); the Reputation list in the Quests tab (`facRender`)
  - `scourge.js`: the Scourge Invasion (`S.si`, `siTick`): from the Ahn'Qiraj war effort to the first night in Naxxramas; necropolises over three zones (`SI_ZONES`), world lines (`siLine`), at 60 invasion trips on a free evening (`siPick` in `pickDungeon`, `queueSI`: `cqFight` kill tasks with `t.si`, `siKill`, ended by `siend`), Necrotic Runes and Argent Dawn reputation (in `S.fac`, `adRank`), the Blessed set per armor type (`SI_SET`, kept in the bags: `siWipe` in `wipeChance` for Naxxramas), the Naxxramas attunement fee by reputation (`naxxFee`), the `si` goal and the Quests tab section (`siRender`)
  - `fishing.js`: fishing (`S.fish`: its own skill and cap, `fishCap`, not in `S.prof`): `fish` tasks off a city pier while levelling (`fishCity`), trips at 60 (`fishPick` in `pickDungeon`, `queueFish`: waters by skill, `FISH_WATERS`), Old Man Heming's book and Nat Pagle's quest (`fishstep`), the city's legend (Old Ironjaw, Old Crafty), the Stranglethorn Fishing Extravaganza on Sunday afternoons (`fxPick`, asked before the raids; `queueFX`, the result rolled up front); goals `fish`, `legend`, `angler`; the Fishing row in the professions tab (`fishRow`)
  - `pets.js`: hunter pets and warlock demons (`S.pet`): taming and summoning, tanking and damage share in fights, happiness, rare tames, demon specials, Infernal and Doomguard, the pet frame
  - `plan.js`: what the hero does next (`plan`, `killTask`, `queueCity`, `queueDungeon`), rotations, area of effect
  - `finish.js`: loot, `FINISH` (what each finished task does), the clock (`advance`, `catchUp`)
  - `foes.js`: the enemy side: units, health curves, actions, cooldowns, enemy damage, `soloFight`
  - `talents.js`: talent trees, their effects (`talMod`), the talents tab
  - `ui.js`: everything drawn on the game screen, the damage meter, the journal tabs, the frame loop
  - `saves.js`: save files, `migrate()` for old saves, confirmation dialogs
  - `create.js`: character creation
  - `main.js`: boot (loaded last)
- `TODO.md`: the roadmap, with detailed plans for open items. Tick items off when they ship.
- `tools/harness.js`: builds a self-contained test page; `tools/sim.js` runs the same scenarios in Node (see Testing).
- `saves/`: save files for testing (gitignored).

### Rules for the scripts

- Every file starts with `"use strict";` and stays a classic script (no `type="module"`, no `async`/`defer`): modules don't load from `file://`.
- All files share one global scope. Functions can call into any file, but top-level code (constants built from other constants, like `MATS` using `CLOTH`) runs at load, so it may only use files loaded before it.
- New file: add a `<script src="js/name.js">` tag in `index.html` at the right place in the order. Use relative paths (the site lives under `/WoWQuest/`) and match the file name's case exactly (Pages is case-sensitive, Windows isn't). No names starting with `_` (Pages drops them).
- Keep function declarations as declarations (`function soloFight`): test scenarios swap some of them out.

## How the game works

- All state lives in `S` (saved to localStorage, key `wowquest-v1`, and to save files). New characters come from `newHero()`; old saves are upgraded in `migrate()`. Every new state field needs a default in both. Never rename existing `S` fields or the storage keys: saves must keep loading.
- `plan()` queues tasks (`S.queue`); `advance(dt)` runs them; `finish(t)` applies the result. A task is `{ k, d, t, el, ... }`; every new `k` needs an entry in `FINISH`. Fights are `kill`, `trash`, `boss` (`FIGHTS`).
- Durations go through `sec()` / `SPAN(level)`, so they stretch as the hero levels.
- Fights: `foeOf(t)` builds the enemies and their health curves from the hero's casts (`castWeight`); `soloFight(t)` plays solo pulls out hit by hit; `simFight(t)` does group fights. Boss wipes are still a roll (`wipeChance` times `wipePrep`: the hero's cooldowns ready, the healers' mana, healing talents), rolled once as the pull starts (`bossWipes` in `advance`, with `t.left` and `t.why` for the chronicle and the boss frame).
- Gear: items are `{ name, ilvl, q, slot }`; `power()` compares items, `gearScore()` (which also counts enchants) drives raid access, wipe chance, damage taken and kill speed (`gearFor()` is gear for the level).
- Raids take weeks: entry needs gear (`RAID_INFO.gs`), full clears of the previous tier (`need`, `needClears`: three Molten Cores before Blackwing Lair) an attunement quest chain (Molten Core, Onyxia, Blackwing Lair, Naxxramas: `attuned`, `raidq.js`) and for the Ahn'Qiraj raids the gates open (`aqOpen`). One raid night per raid per day; three wipes and the raid calls it a night. Lockouts (`S.lock[raid] = { at, killed, last }`) remember the bosses killed, so the next night carries on. Bosses never killed before wipe much more (`FIRST_KILL`), later bosses more than early ones. Economy targets: about 90g around level 40 for the riding mount, 100-500g at 60, the epic mount after weeks of raiding (quest and vendor gold is cut at 60; repairs, flasks and enchants drain it).
- Gold: purchases go through `spend(kind, c)` (weekly tracking) and must respect `spendable()` (keeps the mount savings and the gold for an attunement fee that is up next, `attReserve`).
- Achievements: entries in `ACH` (`journal.js`) with `test()`, optional `show()` and `cat` (profession ones have `cat: "prof"` and their own heading). Achievements that old saves may already meet are granted quietly once in `migrate()` (`checkAch(true, cat)` behind a flag like `S.achProf`), so they don't all pop at once. Profession totals live in `S.prof.count` (`bump(key)`, `profCount(key)`).
- Group frames show whatever `groupView()` returns: the dungeon or raid party (`S.party`, only inside an instance), an elite quest's helpers, or a friend questing along. Never put quest company in `S.party`: solo fights, pets and enemy targeting all check it.
- `renderLists()` redraws when `dirty` (one `render…` call per part of the page); `renderBars()` runs every frame. Page markup that repeats goes through the small template helpers at the top of `ui.js` (`unitFrame`, `poolBar`, `progMeter`, `foldBtn`).

## Testing

Two checks to run after every change (both in Node, no browser, under 20 seconds):

```
node tools/check.js same [ref] [--long]   # refactors: seeded output must match main (or ref) exactly
node tools/check.js balance [seeds]       # gameplay changes: new heroes of every profession pair, 40 hours each
node tools/check.js specs [seeds]         # class balance: all 27 specs from level 1 to 60, then a week of raiding (~1 min)
node tools/check.js endgame [seeds] [days] # the raid timeline after 60: first clears, gear, gold, epic mount (~1-2 min)
```

- `same` runs the scenarios below on the saves in `saves/` and on new level 1 heroes, on this copy and on `main` (in a temporary worktree), and prints IDENTICAL or the first differing line. `--long` adds 40-hour runs.
- `balance` checks levelling speed (about level 43 after 40 hours), deaths, solo deaths, gold, gear score per level, blue crafts and profession skill pace at levels 20/30/40 against the ranges in `EXPECT` at the top of `tools/check.js`, and prints OK / LOW / HIGH per profession pair. When a change is meant to move one of these, update its range in the same commit and say so.
- `endgame` plays one hero per class to 60 and then 90 days, and checks the median day of the first full clear of each raid (Onyxia ~3-7, Molten Core ~8-16 (the pre-raid set first), Blackwing Lair ~26-40, AQ40 ~40-58, Naxxramas ~55-85) and of the epic mount (~20-45) against `RAID_TARGET`.
- `specs` plays every class and spec from level 1 to 60 and then 40 hours at 60, and prints hours to 60, deaths, solo deaths, gold and gear at 60, raids reached, raid wipe rate, gear at the end and the hero's rank on the raid meter (damage, or healing for healers; pets count toward their owner). It flags specs that stand out from the median of all specs (SLOW, SOLO DEATHS, WIPES, LOW ON METER…). Run it after changes to classes, talents, fights or the economy.

Single scenarios run in Node too:

```
node tools/sim.js <save.json> <scenario> [seed]
```

It prints the scenario's result plus a fingerprint of every chronicle line. With the same seed the output is the same every time.

For screenshots, `node tools/harness.js <save.json> <scenario> <out.html> [progress]` builds a self-contained page (stylesheet and scripts inlined) and runs the scenario in it; open it in headless Chrome (`--dump-dom` returns nothing here). From PowerShell, `Start-Process ... -Wait` makes sure the screenshot exists before you read it:

```
chrome --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<fresh dir> --window-size=1400,900 --virtual-time-budget=5000 --screenshot=out.png file:///.../out.html
```

- Scenarios: `keep` (leave whatever `PRE` set up, e.g. a battleground fight in progress), `run` (hours of play: deaths, wipes, levels), `econ` (gold per week, profession skills, spending), `pulls` (health lost per pull type), `aoe`, `stats`, `elite`, `killlog`, `bosslog`, `field3`, `trash:<dungeon>`, `boss:<dungeon>:<boss>`, `idle` (just render).
- `PRE=<js>` runs code before the scenario (`window.HOURS=40`, switch professions, set the mount, open a tab, `confirmRetire()`). `SEED=<n>` makes harness pages repeatable too.
- `SRC=<path to index.html>` tests another copy, e.g. `main` checked out with `git worktree add ../wq-main main`.
- Scenario strings must stay on one line (no literal newlines); join output with `" | "`. Dungeon names with a ":" break the scenario parser.
- Load errors show in red at the top of harness pages. The red "Cannot read properties of null" at the top of finished long runs is the harness tearing down, not a game error.
- Refactors: `check.js same` must say IDENTICAL. If it doesn't, the change moved gameplay or the order of random rolls.
- Balance changes: `check.js balance` must stay OK (or its ranges move on purpose), and compare old against new with `run` / `econ` / `pulls` over several seeds for whatever the change touches. Keep levelling speed, solo deaths and wipe rates where they were unless the change is meant to move them.
- `sim.js new <scenario>` starts without a save: create the hero in `PRE` (`newHero({race:"Orc",cls:"Rogue",spec:0,prof:"herb"})`).

## Working together

- Build features on a branch so the user can try them; "merge" means: merge to `main` and push.
- Commit messages end with the `Co-Authored-By` / `Claude-Session` lines the session gives.
- Keep the vanilla feel: real names for zones, dungeons, bosses, spells, professions and items from classic WoW.
- Check phone width (≤720px: the tabs switch to icons) and the 1200px breakpoint after UI changes. Headless Chrome cuts off pages narrower than about 500px, so use 560px for phone screenshots.
