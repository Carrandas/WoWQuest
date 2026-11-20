# WoWQuest

An idle tribute to levelling in classic (vanilla) World of Warcraft. The hero quests, trains, runs dungeons and raids on their own; the player watches. Level 1 to 60 takes about five days of play time.

## Layout

- `index.html`: the whole game (HTML, CSS and vanilla JS in one file, no build step, no dependencies). GitHub Pages serves it from `main`.
- `TODO.md`: the roadmap, with detailed plans for open items. Tick items off when they ship.
- `tools/harness.js`: builds headless test pages (see Testing).
- `saves/`: save files for testing (gitignored).

Sections inside `index.html` start with `// ---------- name ----------` comments: data (races, classes, zones, dungeons, raids), state, items, buffs & supplies, professions, crafting, gold, enchants, journal, dungeon groups, planning, area of effect, finishing tasks, rendering, the enemy side, enemy damage, damage meter, talent trees, save files, character creation, boot.

## How the game works

- All state lives in `S` (saved to localStorage, key `wowquest-v1`, and to save files). Old saves are upgraded in `migrate()`: every new state field needs a default there.
- `plan()` queues tasks (`S.queue`); `advance(dt)` runs them; `finish(t)` applies the result. A task is `{ k, d, t, el, ... }`; every new `k` needs a `case` in `finish()`. Fights are `kill`, `trash`, `boss` (`FIGHTS`).
- Durations go through `sec()` / `SPAN(level)`, so they stretch as the hero levels.
- Fights: `foeOf(t)` builds the enemies and their health curves from the hero's casts (`castWeight`); `soloFight(t)` plays solo pulls out hit by hit; `simFight(t)` does group fights. Boss wipes are still a roll (`wipeChance`).
- Gear: items are `{ name, ilvl, q, slot }`; `power()` compares items, `gearScore()` (which also counts enchants) drives raid access, wipe chance, damage taken and kill speed.
- Gold: purchases go through `spend(kind, c)` (weekly tracking) and must respect `spendable()` (keeps the mount savings).
- `renderLists()` redraws when `dirty`; `renderBars()` runs every frame.

## Testing

`node tools/harness.js <save.json> <scenario> <out.html> [progress]` injects a save and a scenario into a copy of the game, then open it in headless Chrome and take a screenshot (`--dump-dom` returns nothing here):

```
chrome --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<fresh dir> --window-size=1400,500 --virtual-time-budget=900000 --screenshot=out.png file:///.../out.html
```

- Scenarios: `run` (hours of play: deaths, wipes, levels), `econ` (gold per week, profession skills, spending), `pulls` (health lost per pull type), `aoe`, `field3`, `trash:<dungeon>`, `boss:<dungeon>:<boss>`, `idle` (just render).
- `SRC=<file>` tests another copy (e.g. `git show main:index.html > old.html` to compare old against new); `PRE=<js>` runs code before the scenario (switch professions, set the mount, advance time, open a tab).
- Scenario strings must stay on one line (no literal newlines); join output with `" | "`.
- The red "Cannot read properties of null" at the top of finished long runs is the harness tearing down, not a game error.
- Balance changes: compare old against new with `run` / `econ` / `pulls` from the level-18, level-42 and level-60 saves. Keep levelling speed, solo deaths and wipe rates where they were unless the change is meant to move them.

## Working together

- Build features on a branch so the user can try them; "merge" means: merge to `main` and push.
- Commit messages end with the `Co-Authored-By` / `Claude-Session` lines the session gives.
- Keep the vanilla feel: real names for zones, dungeons, bosses, spells, professions and items from classic WoW.
- Check phone width (≤720px: the tabs switch to icons) and the 1200px breakpoint after UI changes.
