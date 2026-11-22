// The boss fight that decides the outcome: played once, tick by tick, as the pull starts (bossWipes in group.js), and
// stored on the task (who died when, and why; wiped or not, and at how much of the boss's health). The bars on screen
// only act it out. Tanks soak the boss and hand it on when they die; raid-wide hits and spikes land on everyone else;
// healers heal the most hurt while their mana lasts; a druid's Rebirth and a warlock's soulstone bring one back; dps
// (and who's still alive) bring the boss down. Lost when every tank is dead with the boss not nearly done, when half
// the group is down, or when the fight runs far too long. One knob, the pressure: how hard the boss hits (fitted to
// the wipe chance the gear, the boss and the raid's preparation give: FIGHT_PRESSURE in group.js).
"use strict";

const FS_T = 30;            // ticks to bring the boss down with everyone alive
const FS_MANA = 0.03;       // a healer's mana per tick of healing flat out
const FS_REGEN = 0.008;     // and back per tick (spirit, the five-second rule)
// M: members [{ name, role, hp, mp, gear (1 = the group's average), cls, hero, cds: { shield, heal, burst }, healTal }]
// o: { pressure, aoe (chance of a raid-wide hit per tick), moves: { tank, aoe, spike } (names), rng }
function fightCore(M, o) {
  const r = o.rng || Math.random, rnd = (a, b) => a + r() * (b - a);
  // a good night or a bad one: the same boss hits harder or softer from pull to pull
  const P = o.pressure * Math.exp((r() + r() + r() - 1.5) * (o.luck ?? 0.35));
  const U = M.map(m => ({ ...m, hp: Math.max(0.2, m.hp ?? 1), mp: m.mp ?? 1, dead: false, cause: null }));
  const dead = [], tanks = U.filter(u => u.role === "tank");
  const out = u => u.role === "dps" ? u.gear : u.role === "tank" ? 0.35 * u.gear : 0.05;
  const base = U.reduce((a, u) => a + out(u), 0) || 1;
  const pickMove = k => { const l = (o.moves && o.moves[k]) || []; return l.length ? l[Math.floor(r() * l.length)] : null; };
  let innervate = U.some(u => u.cls === "Druid");
  let boss = 1, tick = 0, oomAt = null, rebirth = U.some(u => u.cls === "Druid"), stone = U.some(u => u.cls === "Warlock") ? (U.find(u => u.role === "heal") || null) : null;
  const pend = [];
  const hit = (u, d, cause) => { if (u.dead || d <= 0) return; u.hp -= d; if (u.hp <= 0) u.cause = cause; };
  while (true) {
    tick++;
    const alive = U.filter(u => !u.dead);
    // the boss's target: the first tank still standing, or anyone
    const tank = tanks.find(u => !u.dead), tgt = tank || alive[Math.floor(r() * alive.length)];
    let td = P * 0.3 * rnd(0.7, 1.3) / (tank ? tank.gear : 0.6);
    if (tgt.hero && tgt.cds && tgt.cds.shield && tick <= 4) td *= 0.4; // a shield cooldown at the pull
    hit(tgt, td, pickMove("tank"));
    if (r() < o.aoe) { const mv = pickMove("aoe"); alive.forEach(u => hit(u, P * 0.1 * rnd(0.5, 1.5), mv)); }
    if (r() < 0.25) { const pool = alive.filter(u => u !== tgt); if (pool.length) hit(pool[Math.floor(r() * pool.length)], P * 0.22 * rnd(0.6, 1.4), pickMove("spike")); }
    // healers heal the most hurt (tanks first on a near tie) while their mana lasts
    const healers = alive.filter(u => u.role === "heal" && u.hp > 0);
    let cap = 0;
    const casting = healers.filter(h => h.mp > 0);
    casting.forEach(h => { cap += 0.3 * h.gear * (h.healTal || 1) + (h.hero && h.cds && h.cds.heal && tick <= 2 ? 0.4 : 0); });
    const cap0 = cap;
    while (cap > 0.01) {
      const hurt = U.filter(u => !u.dead && u.hp > 0 && u.hp < 1).sort((a, b) => (a.hp - (a.role === "tank" ? 0.15 : 0)) - (b.hp - (b.role === "tank" ? 0.15 : 0)))[0];
      if (!hurt) break;
      const g = Math.min(0.15, cap, 1 - hurt.hp); hurt.hp += g; cap -= g;
    }
    // mana for the healing actually done, some back every tick
    const use = cap0 ? (cap0 - cap) / cap0 : 0;
    healers.forEach(h => {
      h.mp = Math.min(1, h.mp - (h.mp > 0 ? FS_MANA * use : 0) + FS_REGEN);
      if (h.mp < 0.1 && !h.pot) { h.pot = true; h.mp += 0.2; }                       // a Major Mana Potion
      else if (h.mp < 0.1 && innervate) { innervate = false; h.mp += 0.25; }         // a druid's Innervate
    });
    if (healers.length && healers.every(h => h.mp <= 0) && oomAt == null) oomAt = tick;
    // deaths, the soulstone, Rebirth a little later
    U.forEach(u => {
      if (u.dead || u.hp > 0) return;
      if (stone && u === stone) { stone = null; u.hp = 0.4; return; }
      u.dead = true; dead.push({ name: u.name, tick, cause: u.cause, role: u.role });
      if (rebirth && (u.role === "tank" || u.role === "heal")) { rebirth = false; pend.push([tick + 2, u]); }
    });
    pend.splice(0).forEach(([at, u]) => { if (tick >= at && u.dead) { u.dead = false; u.hp = 0.4; const i = dead.findIndex(d => d.name === u.name); if (i >= 0) dead.splice(i, 1); } else pend.push([at, u]); });
    // the boss
    const dps = U.filter(u => !u.dead).reduce((a, u) => a + out(u) * (u.hero && u.cds && u.cds.burst && tick <= 4 ? 1.5 : 1), 0);
    boss -= dps / (FS_T * base);
    const down = U.filter(u => u.dead).length;
    if (boss <= 0) return { wipe: false, left: 0, dead, ticks: tick, oomAt };
    const noTanks = tanks.length && tanks.every(u => u.dead);
    if ((noTanks && boss > 0.1) || down > U.length / 2 || tick > FS_T * 1.6) {
      const why = tick > FS_T * 1.6 ? "enrage" : oomAt != null && oomAt < tick ? "oom" : noTanks ? "tanks" : "half";
      return { wipe: true, left: Math.max(0.02, boss), dead, ticks: tick, oomAt, why };
    }
  }
}
