// The checks to run after a change (see CLAUDE.md, Testing):
//
//   node tools/check.js same [ref] [--long]
//     For refactors. Runs the seeded scenarios on this copy and on a git ref (default main, checked out in a
//     temporary worktree) and compares the output line for line. "IDENTICAL" means gameplay didn't move.
//     --long adds 40-hour runs. Uses the saves in saves/ that exist, plus brand-new heroes.
//
//   node tools/check.js specs [seeds]
//     For balance between classes. Every class and spec (27) from level 1 to 60, then a week of endgame
//     (default 2 seeds each): hours to 60, deaths, gold and gear at 60, raids reached, raid wipe rate, rank on
//     the meter. Flags specs that stand out from the median of all specs. Takes a few minutes.
//
//   node tools/check.js endgame [seeds] [days]
//     The raid timeline: one hero per class to 60, then 90 days of play: the day each raid is first fully cleared
//     (against the targets in RAID_TARGET), gear score and gold by day, the day of the epic mount.
//
//   node tools/check.js balance [seeds]
//     For gameplay changes. Plays new heroes of every profession pair for 40 hours (default 4 seeds each) and
//     checks levelling speed, deaths, gold, gear, blue crafts and profession skill pace against the ranges in
//     EXPECT below (measured when they were set; widen them on purpose, not to make a run pass).
//     Exits with 1 if anything is out of range.
const { execFile, execSync } = require("child_process");
const fs = require("fs"), os = require("os"), path = require("path");
const ROOT = path.join(__dirname, ".."), SIM = path.join(__dirname, "sim.js");

// new heroes, one per profession pair: race, class, spec, pair
const HEROES = [["Human", "Warrior", 0, "smith"], ["Undead", "Mage", 2, "tailor"], ["Tauren", "Druid", 1, "leather"], ["Orc", "Rogue", 0, "herb"], ["Gnome", "Warlock", 0, "eng"], ["Orc", "Hunter", 0, "leather"]];
const newHero = ([race, cls, spec, prof]) => `newHero({race:"${race}",cls:"${cls}",spec:${spec},name:"T",prof:"${prof}"})`;
const SAVES = ["WoWQuest-Deadmines.json", "WoWQuest-Mage42.json", "WoWQuest-MoltenCore.json"].map(f => path.join(ROOT, "saves", f)).filter(f => fs.existsSync(f));

// runs sim.js; resolves with its output
function sim(save, scen, seed, env = {}) {
  return new Promise(res => execFile("node", [SIM, save, scen, String(seed)], { env: { ...process.env, ...env }, maxBuffer: 1 << 26 },
    (err, out, errOut) => res(err ? "ERROR " + (errOut || err.message) : out)));
}
// runs jobs a few at a time
async function pool(jobs, n = +process.env.JOBS || Math.max(2, os.cpus().length - 1)) {
  const out = new Array(jobs.length); let next = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (next < jobs.length) { const i = next++; out[i] = await jobs[i](); } }));
  return out;
}

// ---------- same: seeded output must match another version exactly ----------
async function same(ref, long) {
  const dir = path.join(os.tmpdir(), "wowquest-check-" + process.pid);
  execSync(`git worktree add -q --detach "${dir}" ${ref}`, { cwd: ROOT, stdio: "inherit" });
  try {
    const cases = [];
    for (const save of SAVES) for (const sc of ["run", "econ", "pulls", "aoe", "stats", "elite", "killlog", "bosslog"])
      cases.push([`${path.basename(save, ".json")} ${sc}`, save, sc, 11, "window.HOURS=6"]);
    for (const h of HEROES) for (const seed of [1, 2]) for (const sc of ["run", "econ"])
      cases.push([`new ${h[1]} ${h[3]} ${sc} seed ${seed}`, "new", sc, seed, `${newHero(h)};window.HOURS=12`]);
    if (long) for (const save of SAVES) for (const seed of [1, 2, 3]) for (const sc of ["run", "econ"])
      cases.push([`${path.basename(save, ".json")} ${sc} 40h seed ${seed}`, save, sc, seed, "window.HOURS=40"]);
    const run = src => pool(cases.map(([, save, sc, seed, pre]) => () => sim(save, sc, seed, { SRC: src, PRE: pre })));
    console.log(`Running ${cases.length} scenarios on this copy and on ${ref}…`);
    const [mine, theirs] = [await run(path.join(ROOT, "index.html")), await run(path.join(dir, "index.html"))];
    const diff = cases.filter((c, i) => mine[i] !== theirs[i]);
    const errors = cases.filter((c, i) => /ERROR|Error/.test(mine[i]));
    for (const c of errors) console.log("error in " + c[0] + ": " + mine[cases.indexOf(c)].slice(0, 300));
    if (!diff.length) { console.log(`IDENTICAL (${cases.length} scenarios)`); return !errors.length; }
    console.log(`DIFFERENT in ${diff.length} of ${cases.length}:`);
    for (const c of diff.slice(0, 10)) {
      const i = cases.indexOf(c), a = mine[i].split("\n"), b = theirs[i].split("\n"), k = a.findIndex((l, j) => l !== b[j]);
      console.log(`  ${c[0]}\n    this: ${(a[k] || "").slice(0, 200)}\n    ${ref}: ${(b[k] || "").slice(0, 200)}`);
    }
    return false;
  } finally { execSync(`git worktree remove --force "${dir}"`, { cwd: ROOT }); }
}

// ---------- balance: new heroes over 40 hours, against expected ranges ----------
// per profession pair averages over the seeds. Skills: "craft" is a crafting skill (and Tailoring), "gather" Mining,
// Herbalism or Skinning, "second" First Aid and Cooking; at the level the hero reached it (40 hours reaches about 43)
const EXPECT = {
  level: [41.8, 44.5],        // level after 40 hours from level 1
  deaths: [2, 11],            // deaths in 40 hours (mostly dungeon wipes)
  solo: [0, 4],               // solo deaths (killed while questing; cloth casters die most, accepted for now)
  gold: [10, 150],            // gold at the end (the riding mount, 90g, is bought around level 40)
  gearPerLevel: [1.0, 1.35],  // gear score / level at the end
  blues: [0, 5],              // blue crafts made (two slots, new pieces at skill 150 and 200 by then)
  craft: { 20: [55, 105], 30: [110, 160], 40: [150, 215] },
  gather: { 20: [45, 130], 30: [110, 230], 40: [200, 300] },
  second: { 20: [30, 105],   // tailors start lower: First Aid shares their cloth
            30: [100, 160], 40: [145, 215] }, // mages conjure their food and cook least (they sat right on 105 / 150)
};
const GATHER = ["Mining", "Herbalism", "Skinning"];
async function balance(seeds) {
  const jobs = [];
  for (const h of HEROES) for (let s = 1; s <= seeds; s++) jobs.push({ h, run: () => sim("new", "bal", s, { PRE: `${newHero(h)};window.HOURS=40` }) });
  console.log(`Playing ${jobs.length} new heroes for 40 hours…`);
  const outs = await pool(jobs.map(j => j.run));
  let ok = true;
  const mark = (v, [lo, hi]) => { const good = v >= lo && v <= hi; if (!good) ok = false; return `${v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0).padStart(6)} ${good ? "ok  " : v < lo ? "LOW " : "HIGH"}`; };
  const avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  console.log("hero             level        deaths       solo         gold         gear/lvl     blues        skills at 20 / 30 / 40 (a, b, first aid, cooking)");
  for (const h of HEROES) {
    const rs = outs.filter((o, i) => jobs[i].h === h).map(o => { try { return JSON.parse(o.split("\n")[0]); } catch (e) { console.log("bad output: " + o.slice(0, 300)); ok = false; return null; } }).filter(Boolean);
    if (!rs.length) continue;
    const m = k => avg(rs.map(r => r[k]));
    let line = `${(h[1] + " " + h[3]).padEnd(16)} ${mark(m("level"), EXPECT.level)} ${mark(m("deaths"), EXPECT.deaths)} ${mark(m("solo"), EXPECT.solo)} ${mark(m("gold"), EXPECT.gold)} ${mark(avg(rs.map(r => r.gs / r.level)), EXPECT.gearPerLevel)} ${mark(m("blues"), EXPECT.blues)}`;
    const skills = [];
    for (const T of [20, 30, 40]) {
      const at = rs.map(r => r.marks[T]).filter(Boolean); if (at.length < rs.length) continue;
      const kind = n => GATHER.includes(n) ? "gather" : "craft";
      const one = (k, n, range) => { const v = avg(at.map(x => x[k])), good = v >= range[0] && v <= range[1]; if (!good) ok = false; return `${Math.round(v)}${good ? "" : v < range[0] ? "(LOW)" : "(HIGH)"}`; };
      skills.push(`${T}: ${one("a", rs[0].a, EXPECT[kind(rs[0].a)][T])} ${one("b", rs[0].b, EXPECT[kind(rs[0].b)][T])} ${one("fa", "", EXPECT.second[T])} ${one("ck", "", EXPECT.second[T])}`);
    }
    console.log(line + "  " + skills.join("  "));
  }
  console.log(ok ? "BALANCE OK" : "OUT OF RANGE (see LOW / HIGH)");
  return ok;
}

// ---------- specs: every class and spec from level 1 to 60, then raiding ----------
// race, class, profession pair and the three specs; the role comes from the spec (as in the game's ROLE_SPECS)
const SPEC_HEROES = [["Human", "Warrior", "smith", ["Arms", "Fury", "Protection"]], ["Dwarf", "Paladin", "smith", ["Holy", "Protection", "Retribution"]],
  ["Night Elf", "Hunter", "leather", ["Beast Mastery", "Marksmanship", "Survival"]], ["Undead", "Rogue", "herb", ["Assassination", "Combat", "Subtlety"]],
  ["Troll", "Priest", "tailor", ["Discipline", "Holy", "Shadow"]], ["Orc", "Shaman", "leather", ["Elemental", "Enhancement", "Restoration"]],
  ["Gnome", "Mage", "tailor", ["Arcane", "Fire", "Frost"]], ["Undead", "Warlock", "eng", ["Affliction", "Demonology", "Destruction"]],
  ["Tauren", "Druid", "herb", ["Balance", "Feral", "Restoration"]]];
const ROLE_OF = { Warrior: { 2: "tank" }, Paladin: { 0: "heal", 1: "tank" }, Priest: { 0: "heal", 1: "heal" }, Shaman: { 2: "heal" }, Druid: { 1: "tank", 2: "heal" } };
async function specs(seeds) {
  const jobs = [];
  for (const [race, cls, prof, trees] of SPEC_HEROES) for (let spec = 0; spec < 3; spec++) for (let s = 1; s <= seeds; s++)
    jobs.push({ key: `${cls} ${trees[spec]}`, role: (ROLE_OF[cls] || {})[spec] || "dps", run: () => sim("new", "spec60", s, { PRE: `${newHero([race, cls, spec, prof])};window.ENDH=168` }) });
  console.log(`Playing ${jobs.length} heroes (${SPEC_HEROES.length * 3} specs x ${seeds}) from level 1 to 60, then a week of raiding…`);
  const outs = await pool(jobs.map(j => j.run));
  const avg = a => { a = a.filter(x => x != null); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
  const rows = [];
  for (const key of [...new Set(jobs.map(j => j.key))]) {
    const rs = outs.filter((o, i) => jobs[i].key === key).map(o => { try { return JSON.parse(o.split("\n")[0]); } catch (e) { console.log(key + ": bad output " + o.slice(0, 200)); return null; } }).filter(Boolean);
    if (!rs.length) continue;
    const role = jobs.find(j => j.key === key).role, raids = avg(rs.map(r => Object.keys(r.end.runs).length)), bosses = avg(rs.map(r => r.end.kills + r.end.wipes));
    rows.push({ key, role, reached: rs.filter(r => r.L.level >= 60).length / rs.length, hours: avg(rs.map(r => r.L.hours)), deaths: avg(rs.map(r => r.L.deaths)), solo: avg(rs.map(r => r.L.solo)),
      gold: avg(rs.map(r => r.L.gold)), gs: avg(rs.map(r => r.L.gs)), raids, wipe: bosses ? avg(rs.map(r => r.end.wipes)) / bosses : null, gsEnd: avg(rs.map(r => r.end.gs)),
      endDeaths: avg(rs.map(r => r.end.deaths)), rank: avg(rs.map(r => role === "heal" ? r.end.healRank : r.end.dmgRank)) });
  }
  // flags: against the median of all specs (and the median of the same role for the meter rank)
  const med = (a) => { a = a.filter(x => x != null).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
  const M = k => med(rows.map(r => r[k])), mh = M("hours"), md = M("deaths"), ms = M("solo"), mw = M("wipe"), mr = M("raids");
  const rankMed = role => med(rows.filter(r => r.role === role).map(r => r.rank));
  let ok = true;
  const f = (v, d = 0) => v == null ? "   -" : v.toFixed(d);
  console.log("spec                      role  hours to 60  deaths  solo  gold@60  gs@60 | raids  wipe%  gs end  deaths  meter rank  flags");
  for (const r of rows) {
    const flags = [];
    if (r.reached < 1) flags.push("DIDN'T REACH 60");
    if (r.hours > mh * 1.12) flags.push("SLOW"); if (r.hours < mh * 0.88) flags.push("FAST");
    if (r.solo > Math.max(3, ms * 2.5)) flags.push("SOLO DEATHS");
    if (r.deaths > Math.max(md * 1.6, md + 6)) flags.push("DEATHS");
    if (!r.raids) flags.push("NO RAIDS"); else if (r.raids < mr - 2) flags.push("FEW RAIDS");
    if (r.wipe != null && mw != null && r.wipe > mw + 0.08) flags.push("WIPES");
    const rm = rankMed(r.role); if (r.rank != null && rm != null && r.rank > rm * 1.5 + 1) flags.push("LOW ON METER");
    if (flags.length) ok = false;
    console.log(`${r.key.padEnd(26)}${r.role.padEnd(6)}${f(r.hours).padStart(11)}  ${f(r.deaths, 1).padStart(6)}  ${f(r.solo, 1).padStart(4)}  ${f(r.gold).padStart(7)}  ${f(r.gs, 1).padStart(5)} | ${f(r.raids, 1).padStart(5)}  ${f(r.wipe == null ? null : r.wipe * 100).padStart(5)}  ${f(r.gsEnd, 1).padStart(6)}  ${f(r.endDeaths, 1).padStart(6)}  ${f(r.rank, 1).padStart(10)}  ${flags.join(", ")}`);
  }
  console.log(`median: ${f(mh)} hours to 60 (${f(mh / 24, 1)} days), ${f(md, 1)} deaths, ${f(mw == null ? null : mw * 100)}% raid wipes, ${f(mr, 1)} raids in the first week at 60`);
  console.log(ok ? "SPECS OK" : "SOME SPECS STAND OUT (see flags)");
  return ok;
}

// ---------- endgame: the raid timeline after level 60 ----------
// one hero per class (a spec each), played to 60 and then DAYS days (default 60)
const END_HEROES = [["Human", "Warrior", 1, "smith"], ["Dwarf", "Paladin", 0, "smith"], ["Night Elf", "Hunter", 0, "leather"], ["Undead", "Rogue", 1, "herb"],
  ["Troll", "Priest", 1, "tailor"], ["Orc", "Shaman", 0, "leather"], ["Gnome", "Mage", 2, "tailor"], ["Undead", "Warlock", 0, "eng"], ["Tauren", "Druid", 2, "herb"]];
const RAID_ORDER = ["Zul'Gurub", "Onyxia's Lair", "Molten Core", "Ruins of Ahn'Qiraj", "Blackwing Lair", "Temple of Ahn'Qiraj", "Naxxramas"];
const RAID_SHORT = ["ZG", "Ony", "MC", "AQ20", "BWL", "AQ40", "Naxx"];
// target day (after reaching 60) for the first full clear, and how far off the median may be
// (weeks of Molten Core before Blackwing Lair, then a couple of clears of each tier before the next)
const RAID_TARGET = { "Onyxia's Lair": [3, 7], "Molten Core": [7, 13], "Blackwing Lair": [26, 40], "Temple of Ahn'Qiraj": [40, 58], "Naxxramas": [55, 85] };
async function endgame(seeds, days) {
  const jobs = [];
  for (const h of END_HEROES) for (let s = 1; s <= seeds; s++) jobs.push({ h, run: () => sim("new", "end60", s, { PRE: `${newHero(h)};window.DAYS=${days}` }) });
  console.log(`Playing ${jobs.length} heroes to 60, then ${days} days of endgame…`);
  const outs = (await pool(jobs.map(j => j.run))).map(o => { try { return JSON.parse(o.split("\n")[0]); } catch (e) { console.log("bad output: " + o.slice(0, 200)); return null; } });
  const f = v => v == null ? "   -" : String(v).padStart(4);
  console.log(`hero              ${RAID_SHORT.map(s => s.padStart(5)).join("")}  | gs d2  d7 d14 d30 d60 d90 | gold d7 d30 d60 | epic mount | pvp: games won, best rank (rank 11 day)`);
  outs.forEach((r, i) => {
    if (!r) return;
    const h = jobs[i].h, g = k => r.snap[k] || {};
    console.log(`${(h[1] + " " + h[3]).padEnd(17)} ${RAID_ORDER.map(n => f(r.clears[n] == null ? null : Math.round(r.clears[n])).padStart(5)).join("")}  | ${[2, 7, 14, 30, 60, 90].map(k => f(g(k).gs == null ? null : Math.round(g(k).gs))).join("")} | ${[7, 30, 60].map(k => f(g(k).gold)).join("")} | ${(r.epic == null ? "-" : "day " + Math.round(r.epic)).padEnd(7)} | ${r.pvp ? `${r.pvp.games} games, ${r.pvp.wins} won, rank ${r.pvp.best}${r.pvp.r11 != null ? ` (day ${Math.round(r.pvp.r11)})` : ""}` : "-"}`);
  });
  const med = a => { a = a.filter(x => x != null).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
  let ok = true;
  console.log("median first clear (day after 60):");
  for (const n of RAID_ORDER) {
    // a hero that never cleared it counts as later than everyone else
    const vals = outs.filter(Boolean).map(r => r.clears[n]), never = vals.filter(v => v == null).length, sorted = vals.map(v => v == null ? Infinity : v).sort((x, y) => x - y), mm = sorted[sorted.length >> 1], m = mm === Infinity ? null : mm, t = RAID_TARGET[n];
    const good = !t || (m != null && m >= t[0] && m <= t[1]); if (!good) ok = false;
    console.log(`  ${n.padEnd(22)} ${m == null ? "not cleared" : "day " + m.toFixed(1)}${never ? ` (${never} of ${vals.length} never)` : ""}${t ? `   target ${t[0]}-${t[1]} ${good ? "ok" : m == null || m > t[1] ? "LATE" : "EARLY"}` : ""}`);
  }
  // the epic mount: bought, or the paladin's and warlock's quest line
  const ep = outs.filter(r => r).map(r => r.epic == null ? Infinity : r.epic).sort((x, y) => x - y), em = ep[ep.length >> 1];
  console.log(`  epic mount            ${em === Infinity ? "not bought by half of them" : "day " + em.toFixed(1)} (bought by ${ep.filter(v => v !== Infinity).length} of ${ep.length})   target 20-45 ${em >= 20 && em <= 45 ? "ok" : em < 20 ? "EARLY" : "LATE"}`);
  if (!(em >= 20 && em <= 45)) ok = false;
  console.log(ok ? "ENDGAME OK" : "ENDGAME OFF TARGET");
  return ok;
}

const [mode = "same", arg] = process.argv.slice(2);
(mode === "balance" ? balance(+arg || 4) : mode === "specs" ? specs(+arg || 2) : mode === "endgame" ? endgame(+arg || 1, +process.argv[4] || 90) : same(arg && !arg.startsWith("--") ? arg : "main", process.argv.includes("--long")))
  .then(good => process.exit(good ? 0 : 1));
