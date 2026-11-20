// The checks to run after a change (see CLAUDE.md, Testing):
//
//   node tools/check.js same [ref] [--long]
//     For refactors. Runs the seeded scenarios on this copy and on a git ref (default main, checked out in a
//     temporary worktree) and compares the output line for line. "IDENTICAL" means gameplay didn't move.
//     --long adds 40-hour runs. Uses the saves in saves/ that exist, plus brand-new heroes.
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
async function pool(jobs, n = Math.max(2, os.cpus().length - 1)) {
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
  solo: [0, 2],               // solo deaths (killed while questing)
  gold: [60, 400],            // gold at the end
  gearPerLevel: [1.0, 1.35],  // gear score / level at the end
  blues: [0, 5],              // blue crafts made (two slots, new pieces at skill 150 and 200 by then)
  craft: { 20: [55, 105], 30: [110, 160], 40: [160, 215] },
  gather: { 20: [45, 130], 30: [110, 230], 40: [200, 300] },
  second: { 20: [30, 105],   // tailors start lower: First Aid shares their cloth
            30: [105, 160], 40: [150, 215] },
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

const [mode = "same", arg] = process.argv.slice(2);
(mode === "balance" ? balance(+arg || 4) : same(arg && !arg.startsWith("--") ? arg : "main", process.argv.includes("--long")))
  .then(good => process.exit(good ? 0 : 1));
