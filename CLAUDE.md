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
- Fights: `foeOf(t)` builds the enemies and their health curves from the hero's casts (`castWeight`); `soloFight(t)` plays solo pulls out hit by hit; `simFight(t)` does group fights. Boss wipes are still a roll (`wipeChance`).
- Gear: items are `{ name, ilvl, q, slot }`; `power()` compares items, `gearScore()` (which also counts enchants) drives raid access, wipe chance, damage taken and kill speed (`gearFor()` is gear for the level).
- Gold: purchases go through `spend(kind, c)` (weekly tracking) and must respect `spendable()` (keeps the mount savings).
- Achievements: entries in `ACH` (`journal.js`) with `test()`, optional `show()` and `cat` (profession ones have `cat: "prof"` and their own heading). Achievements that old saves may already meet are granted quietly once in `migrate()` (`checkAch(true, cat)` behind a flag like `S.achProf`), so they don't all pop at once. Profession totals live in `S.prof.count` (`bump(key)`, `profCount(key)`).
- `renderLists()` redraws when `dirty` (one `render…` call per part of the page); `renderBars()` runs every frame. Page markup that repeats goes through the small template helpers at the top of `ui.js` (`unitFrame`, `poolBar`, `progMeter`, `foldBtn`).

## Testing

Two checks to run after every change (both in Node, no browser, under 20 seconds):

```
node tools/check.js same [ref] [--long]   # refactors: seeded output must match main (or ref) exactly
node tools/check.js balance [seeds]       # gameplay changes: new heroes of every profession pair, 40 hours each
```

- `same` runs the scenarios below on the saves in `saves/` and on new level 1 heroes, on this copy and on `main` (in a temporary worktree), and prints IDENTICAL or the first differing line. `--long` adds 40-hour runs.
- `balance` checks levelling speed (about level 43 after 40 hours), deaths, solo deaths, gold, gear score per level, blue crafts and profession skill pace at levels 20/30/40 against the ranges in `EXPECT` at the top of `tools/check.js`, and prints OK / LOW / HIGH per profession pair. When a change is meant to move one of these, update its range in the same commit and say so.

Single scenarios run in Node too:

```
node tools/sim.js <save.json> <scenario> [seed]
```

It prints the scenario's result plus a fingerprint of every chronicle line. With the same seed the output is the same every time.

For screenshots, `node tools/harness.js <save.json> <scenario> <out.html> [progress]` builds a self-contained page (stylesheet and scripts inlined) and runs the scenario in it; open it in headless Chrome (`--dump-dom` returns nothing here). From PowerShell, `Start-Process ... -Wait` makes sure the screenshot exists before you read it:

```
chrome --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<fresh dir> --window-size=1400,900 --virtual-time-budget=5000 --screenshot=out.png file:///.../out.html
```

- Scenarios: `run` (hours of play: deaths, wipes, levels), `econ` (gold per week, profession skills, spending), `pulls` (health lost per pull type), `aoe`, `stats`, `elite`, `killlog`, `bosslog`, `field3`, `trash:<dungeon>`, `boss:<dungeon>:<boss>`, `idle` (just render).
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
