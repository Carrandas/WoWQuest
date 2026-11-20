// runs a harness scenario in Node, without a browser, and prints its output:
//   node tools/sim.js <save.json | new> <scenario> [seed]
// ("new" starts without a save: create a hero in PRE, e.g. PRE='newHero({race:"Orc",cls:"Rogue",spec:0,prof:"herb"})')
// The page is stubbed out (every element is a do-nothing stand-in), so only the game logic runs.
// With a seed (default 1) the output is repeatable, which makes it the quick way to check that a
// refactor changed nothing: SRC=old.html node tools/sim.js ... against node tools/sim.js ...
// PRE=<js> runs before the scenario, as in harness.js.
const fs = require("fs"), vm = require("vm");
const { setups, gamePage, seedCode, DEFAULT_SRC } = require("./harness.js");
const [save, scen, seed = "1"] = process.argv.slice(2);
const [kind, dg, boss] = scen.split(":");
if (!setups[kind]) { console.error("unknown scenario: " + kind); process.exit(1); }

// an element that accepts anything: any property is another stand-in, calling it returns one too
const stub = new Proxy(function () {}, {
  get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : k === Symbol.iterator ? [][Symbol.iterator] : stub,
  set: () => true, apply: () => stub,
});
let out = "";
const body = new Proxy({}, { get: (t, k) => k === "innerHTML" ? out : stub, set: (t, k, v) => { if (k === "innerHTML") out = v; return true; } });
const store = {};
const ctx = {
  console, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  performance: { now: () => Date.now() }, addEventListener: () => {},
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { body, title: "", getElementById: () => stub, querySelector: () => null, querySelectorAll: () => [], createElement: () => stub, addEventListener: () => {} },
};
ctx.window = ctx;
const data = save === "new" ? null : fs.readFileSync(save, "utf8");
ctx.SAVE0 = data;
ctx.claude = { hot: { data: data ? { S: JSON.parse(data) } : {} } };
vm.createContext(ctx);
const html = gamePage(process.env.SRC || DEFAULT_SRC);
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(m[1], ctx);
// every chronicle line goes into a fingerprint, so two runs that differ anywhere print different hashes
vm.runInContext(`var LOGHASH=0,LOGN=0;{const l=log;log=function(t,k){for(const c of String(t))LOGHASH=Math.imul(LOGHASH^c.charCodeAt(0),16777619)>>>0;LOGN++;return l.apply(this,arguments);};}`, ctx);
vm.runInContext(`const BOSSDG=${JSON.stringify(dg || "")},BOSSNAME=${JSON.stringify(boss || "")};${seedCode(seed)}${process.env.PRE || ""};${setups[kind]}`, ctx);
console.log(out.replace(/<[^>]+>/g, "").replace(/\s*"ms": ?\d+,?/, "") + `\nlog: ${ctx.LOGN} lines, fingerprint ${ctx.LOGHASH.toString(16)}`);
