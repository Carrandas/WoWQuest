// Talent trees: the builds, what they change, and the talents tab.
"use strict";

// ---------- talent trees ----------
// a curated slice of each tree, in the order the build fills it: "Name/max ranks/effect/% per rank/tier".
// Effects: d more damage, t less damage taken, m cheaper spells, h more health, l stronger heals,
// a an attack spell, c a cooldown spell, u the 31-point talent (always last, after exactly 30 points)
const TALENTS = {
  Warrior: [
    "Improved Heroic Strike/3/d/1/1;Deflection/5/t/1/1;Improved Rend/3/d/1/2;Improved Charge/2/d/0.5/2;Anger Management/1/d/1/3;Deep Wounds/3/d/1/3;Two-Handed Weapon Specialization/5/d/1/4;Impale/2/d/1/4;Axe Specialization/5/d/1/5;Sweeping Strikes/1/a/0/5;Mortal Strike/1/u/0/7",
    "Cruelty/5/d/1/1;Unbridled Wrath/5/d/0.6/2;Improved Battle Shout/5/d/0.6/3;Enrage/5/d/1/3;Death Wish/1/c/0/4;Dual Wield Specialization/5/d/1/4;Flurry/4/d/1/6;Bloodthirst/1/u/0/7",
    "Shield Specialization/5/t/0.8/1;Anticipation/5/t/1/2;Toughness/5/t/1/3;Improved Shield Block/3/t/0.6/3;Last Stand/1/c/0/3;Defiance/5/d/0.5/4;Improved Sunder Armor/3/d/0.5/4;One-Handed Weapon Specialization/3/d/1/6;Shield Slam/1/u/0/7"],
  Paladin: [
    "Divine Intellect/5/m/1.5/1;Spiritual Focus/5/l/1/1;Healing Light/3/l/4/2;Unyielding Faith/3/t/0.5/2;Improved Blessing of Wisdom/2/m/1/2;Consecration/1/a/0/3;Illumination/5/m/2/3;Divine Favor/1/c/0/4;Holy Power/5/l/2/5;Holy Shock/1/u/0/7",
    "Improved Devotion Aura/5/t/1/1;Redoubt/5/t/1/1;Toughness/5/t/1/2;Anticipation/3/t/1/2;Blessing of Kings/1/c/0/3;Improved Righteous Fury/3/d/0.5/3;Shield Specialization/3/t/0.6/4;Reckoning/5/d/0.5/4;Holy Shield/1/u/0/7",
    "Improved Blessing of Might/5/d/0.8/1;Benediction/5/m/2/1;Improved Judgement/2/d/0.5/2;Improved Seal of the Crusader/3/d/0.5/2;Deflection/5/t/1/2;Conviction/5/d/1/3;Seal of Command/1/a/0/3;Two-Handed Weapon Specialization/3/d/1.5/5;Vengeance/1/d/2/5;Repentance/1/u/0/7"],
  Hunter: [
    "Improved Aspect of the Hawk/5/d/1/1;Endurance Training/5/h/1/1;Improved Mend Pet/2/t/0.5/2;Thick Hide/3/t/1/2;Unleashed Fury/5/d/0.8/3;Ferocity/5/d/0.8/3;Intimidation/1/a/0/4;Bestial Discipline/2/d/0.5/4;Frenzy/2/d/1/5;Bestial Wrath/1/u/0/7",
    "Improved Concussive Shot/5/t/0.4/1;Efficiency/5/m/2/1;Improved Hunter's Mark/5/d/0.5/2;Lethal Shots/5/d/1/2;Aimed Shot/1/a/0/3;Improved Arcane Shot/5/d/0.5/3;Mortal Shots/3/d/1.5/4;Barrage/1/d/1/5;Trueshot Aura/1/u/0/7",
    "Monster Slaying/3/d/0.5/1;Humanoid Slaying/3/d/0.5/1;Deflection/5/t/1/1;Improved Wing Clip/3/t/0.5/2;Savage Strikes/2/d/1/2;Survivalist/5/h/2/3;Deterrence/1/c/0/3;Surefooted/3/t/0.5/4;Killer Instinct/3/d/1/5;Counterattack/1/a/0/5;Lightning Reflexes/1/d/1/6;Wyvern Sting/1/u/0/7"],
  Rogue: [
    "Improved Eviscerate/3/d/0.8/1;Malice/5/d/1/1;Ruthlessness/3/d/0.5/2;Murder/2/d/1/2;Improved Slice and Dice/3/d/0.5/3;Relentless Strikes/1/d/1/3;Lethality/5/d/1/3;Improved Poisons/5/d/0.6/4;Vile Poisons/3/d/0.6/5;Cold Blood/1/u/0/7",
    "Improved Gouge/3/t/0.4/1;Improved Sinister Strike/2/d/0.5/1;Lightning Reflexes/5/t/0.8/1;Deflection/5/t/0.8/2;Precision/5/d/1/2;Riposte/1/a/0/3;Dual Wield Specialization/5/d/1/3;Blade Flurry/1/c/0/4;Sword Specialization/3/d/1/4;Adrenaline Rush/1/u/0/7",
    "Master of Deception/5/t/0.4/1;Opportunity/5/d/1/1;Camouflage/5/t/0.4/2;Initiative/3/d/0.5/2;Ghostly Strike/1/a/0/3;Improved Ambush/3/d/0.8/3;Elusiveness/2/t/0.5/4;Serrated Blades/3/d/0.8/4;Setup/3/d/0.5/5;Preparation/1/u/0/7"],
  Priest: [
    "Unbreakable Will/5/t/0.6/1;Wand Specialization/5/d/0.5/1;Improved Power Word: Fortitude/2/h/1.5/2;Improved Power Word: Shield/3/l/1/2;Martyrdom/2/t/0.5/2;Inner Focus/1/c/0/3;Meditation/3/m/2/3;Mental Agility/5/m/1/4;Mental Strength/3/m/1/5;Divine Spirit/1/c/0/5;Power Infusion/1/u/0/7",
    "Healing Focus/2/l/0.5/1;Improved Renew/3/l/1.5/1;Holy Specialization/5/d/0.5/1;Divine Fury/5/l/1/2;Holy Nova/1/a/0/3;Inspiration/3/t/0.8/3;Improved Healing/3/m/1.5/4;Searing Light/2/d/1/4;Spiritual Healing/5/l/2/5;Spiritual Guidance/1/l/1/5;Lightwell/1/u/0/7",
    "Spirit Tap/5/m/1/1;Blackout/3/d/0.4/1;Shadow Affinity/3/t/0.4/2;Improved Shadow Word: Pain/2/d/1/2;Shadow Focus/5/d/0.5/2;Mind Flay/1/a/0/3;Improved Mind Blast/5/d/0.6/3;Vampiric Embrace/1/l/2/4;Darkness/5/d/1/6;Shadowform/1/u/0/7"],
  Shaman: [
    "Convection/5/m/2/1;Concussion/5/d/1/1;Earth's Grasp/2/t/0.4/2;Call of Flame/3/d/0.5/2;Elemental Focus/1/m/2/3;Reverberation/5/d/0.4/3;Call of Thunder/5/d/1/3;Eye of the Storm/3/t/0.4/4;Elemental Fury/1/d/2/5;Elemental Mastery/1/u/0/7",
    "Ancestral Knowledge/5/m/1/1;Shield Specialization/5/t/0.8/1;Thundering Strikes/5/d/1/2;Improved Lightning Shield/3/t/0.4/2;Two-Handed Axes and Maces/1/d/1/3;Anticipation/5/t/1/3;Flurry/5/d/1/4;Toughness/1/t/0.5/4;Stormstrike/1/u/0/7",
    "Improved Healing Wave/5/l/1/1;Tidal Focus/5/m/1/1;Totemic Focus/5/m/1/2;Healing Focus/3/l/0.5/2;Nature's Swiftness/1/c/0/3;Healing Way/3/l/2/3;Tidal Mastery/5/l/1/4;Healing Grace/2/m/1/4;Purification/1/l/2/5;Mana Tide Totem/1/u/0/7"],
  Mage: [
    "Arcane Subtlety/2/t/0.4/1;Arcane Focus/5/m/1/1;Improved Arcane Missiles/5/d/0.4/1;Arcane Concentration/5/m/2/2;Magic Absorption/3/t/0.6/2;Arcane Meditation/3/m/1/3;Presence of Mind/1/c/0/4;Arcane Mind/5/h/1/4;Arcane Instability/1/d/3/5;Arcane Power/1/u/0/7",
    "Improved Fireball/5/d/1/1;Impact/5/d/0.4/1;Ignite/5/d/1.2/2;Flame Throwing/2/d/0.3/2;Improved Fire Blast/3/d/0.4/2;Pyroblast/1/a/0/3;Burning Soul/2/t/0.3/3;Improved Scorch/3/d/0.5/4;Master of Elements/3/m/2/4;Blast Wave/1/a/0/5;Combustion/1/u/0/7",
    "Frost Warding/2/t/1/1;Improved Frostbolt/5/d/1/1;Elemental Precision/3/m/1/1;Ice Shards/5/d/1/2;Frostbite/3/t/0.6/2;Permafrost/3/t/0.4/3;Piercing Ice/3/d/1/3;Cold Snap/1/c/0/4;Arctic Reach/2/d/0.3/4;Frost Channeling/3/m/2/4;Ice Barrier/1/u/0/7"],
  Warlock: [
    "Suppression/5/m/1/1;Improved Corruption/5/d/0.8/1;Improved Life Tap/2/m/1/2;Improved Drain Life/5/l/1/2;Amplify Curse/1/c/0/3;Nightfall/2/d/0.8/3;Grim Reach/2/d/0.3/3;Siphon Life/1/a/0/4;Improved Curse of Agony/2/d/0.5/4;Shadow Mastery/5/d/1/5;Dark Pact/1/u/0/7",
    "Improved Healthstone/2/l/1/1;Demonic Embrace/5/h/1.5/1;Improved Voidwalker/3/t/0.6/1;Fel Intellect/5/m/1/2;Fel Domination/1/c/0/2;Fel Stamina/5/h/0.6/2;Master Summoner/2/m/0.5/3;Unholy Power/5/d/0.6/3;Demonic Sacrifice/1/c/0/4;Master Demonologist/1/t/1/5;Soul Link/1/u/0/7",
    "Improved Shadow Bolt/5/d/1/1;Cataclysm/5/m/1/1;Bane/5/d/1/2;Aftermath/2/t/0.3/2;Devastation/5/d/1/3;Shadowburn/1/a/0/3;Intensity/2/t/0.3/3;Destructive Reach/2/d/0.3/4;Improved Searing Pain/2/d/0.5/4;Ruin/1/d/3/5;Conflagrate/1/u/0/7"],
  Druid: [
    "Improved Wrath/5/d/0.8/1;Nature's Grasp/1/c/0/1;Improved Moonfire/5/d/0.6/2;Natural Weapons/5/d/0.6/2;Natural Shapeshifter/3/m/1/2;Moonglow/3/m/2/3;Nature's Grace/1/d/1/3;Moonfury/5/d/1/4;Vengeance/2/d/1/4;Moonkin Form/1/u/0/7",
    "Ferocity/5/d/1/1;Feral Aggression/5/d/0.5/1;Feral Instinct/5/t/0.6/2;Thick Hide/5/t/1/2;Feline Swiftness/2/t/0.4/3;Sharpened Claws/3/d/1/3;Feral Charge/1/a/0/3;Predatory Strikes/3/d/1/4;Savage Fury/1/d/1/5;Leader of the Pack/1/u/0/7",
    "Improved Mark of the Wild/5/h/0.6/1;Furor/5/m/1/1;Improved Healing Touch/5/l/1/2;Nature's Focus/5/l/0.5/2;Intensity/3/m/1/3;Subtlety/2/m/0.5/3;Insect Swarm/1/a/0/3;Tranquil Spirit/2/m/1/4;Gift of Nature/2/l/2/5;Swiftmend/1/u/0/7"],
};
const TAL_FX = { d: "damage", t: "damage taken", m: "mana cost", h: "health", l: "healing" };
// the listed values are scaled up so talents are felt (real Improved Frostbolt is worth well over 5%)
const TAL_SCALE = 2;
const talTree = (c, i) => (talTree.cache[c + i] ||= TALENTS[c][i].split(";").map(x => { const [name, max, fx, per, tier] = x.split("/"); return { name, max: +max, fx, per: +per * TAL_SCALE, tier: +tier }; }));
talTree.cache = {};
// points per tree at a level (the main spec first to 31, then the next tree up to 20)
function talentSplit(L, spec) {
  const pts = Math.max(0, L - 9), t = [0, 0, 0], second = (spec + 1) % 3;
  t[spec] = Math.min(pts, 31); t[second] = Math.min(pts - t[spec], 20); t[spec] += pts - t[spec] - t[second];
  return t;
}
// ranks in every talent of a tree for a number of points, filled in build order
const talentRanks = (c, i, pts) => talTree(c, i).map(tl => { const r = Math.max(0, Math.min(tl.max, pts)); pts -= r; return r; });
// the total effect of a build on each lever (fractions)
const TAL_FXC = {};
function talentFx(c, L, spec) {
  const key = c + L + "|" + spec; if (TAL_FXC[key]) return TAL_FXC[key];
  const fx = { d: 0, t: 0, m: 0, h: 0, l: 0 }, split = talentSplit(L, spec);
  for (let i = 0; i < 3; i++) talentRanks(c, i, split[i]).forEach((r, k) => { const tl = talTree(c, i)[k]; if (r && tl.fx in fx) fx[tl.fx] += r * tl.per / 100; });
  return (TAL_FXC[key] = fx);
}
// the average build at a level: what the game was tuned for, so talents shift how a spec plays, not how hard it is
const TAL_BASE = {};
function talentBase(L) {
  if (TAL_BASE[L]) return TAL_BASE[L];
  // mana is averaged over mana users only, healing over the classes that heal
  const sum = { d: 0, t: 0, m: 0, h: 0, l: 0 }, n = { d: 0, t: 0, m: 0, h: 0, l: 0 }, heals = /Paladin|Priest|Shaman|Druid/;
  for (const c in TALENTS) for (let s = 0; s < 3; s++) {
    const fx = talentFx(c, L, s);
    for (const k in sum) { if ((k === "m" && !CLASSES[c].mp) || (k === "l" && !heals.test(c))) continue; sum[k] += fx[k]; n[k]++; }
  }
  for (const k in sum) sum[k] /= n[k] || 1;
  return (TAL_BASE[L] = sum);
}
// the hero's multiplier on a lever, against the average build (1 = average)
function talMod(k) {
  const fx = talentFx(S.cls, S.level, S.spec), b = talentBase(S.level);
  return k === "t" || k === "m" ? (1 - fx[k]) / (1 - b[k]) : (1 + fx[k]) / (1 + b[k]);
}
// the hero's talent spells: [{name, kind}] for every active talent with a point in it
function talentSpells() {
  const split = talentSplit(S.level, S.spec), out = [];
  for (let i = 0; i < 3; i++) talentRanks(S.cls, i, split[i]).forEach((r, k) => { const tl = talTree(S.cls, i)[k]; if (r && /[acu]/.test(tl.fx)) out.push({ name: tl.name, kind: tl.fx === "u" ? ((ULT_ATK[S.cls] || []).includes(i) ? "a" : "c") : tl.fx, tree: i }); });
  return out;
}
// talent points gained between two levels, for the chronicle
function talentGains(L0, L1) {
  const a = talentSplit(L0, S.spec), b = talentSplit(L1, S.spec), out = [];
  for (let i = 0; i < 3; i++) {
    const r0 = talentRanks(S.cls, i, a[i]), r1 = talentRanks(S.cls, i, b[i]);
    r1.forEach((r, k) => { if (r > r0[k]) { const tl = talTree(S.cls, i)[k]; out.push(`${tl.name} ${r}/${tl.max}`); } });
  }
  return out;
}
function talentLine(tl, r) {
  if (/[acu]/.test(tl.fx)) return tl.fx === "u" ? "31-point talent spell" : "talent spell";
  const v = +(r * tl.per).toFixed(1), sign = tl.fx === "t" || tl.fx === "m" ? "−" : "+", per = +tl.per.toFixed(1);
  return r && tl.max > 1 ? `${sign}${per}% ${TAL_FX[tl.fx]} per rank · ${sign}${v}% total` : r ? `${sign}${v}% ${TAL_FX[tl.fx]}` : `${sign}${per}% ${TAL_FX[tl.fx]} per rank`;
}
let talTab = -1;
function renderTalents() {
  const c = cls(), split = talentSplit(S.level, S.spec), cur = talTab < 0 ? S.spec : talTab;
  $("talPts").textContent = S.level >= 10 ? `${split.join(" / ")} · ${Math.max(0, S.level - 9)} points` : "from level 10";
  const tabs = c.trees.map((t, i) => `<button type="button" data-tt="${i}" aria-pressed="${i === cur}">${esc(t)} <b>${split[i]}</b></button>`).join("");
  const ranks = talentRanks(S.cls, cur, split[cur]), tree = talTree(S.cls, cur);
  let lastTier = 0, rows = "";
  tree.forEach((tl, k) => {
    if (tl.tier !== lastTier) { lastTier = tl.tier; rows += `<li class="tier">Tier ${tl.tier}${tl.tier > 1 ? ` · ${(tl.tier - 1) * 5} points` : ""}</li>`; }
    const r = ranks[k], st = r >= tl.max ? "max" : r ? "some" : "none";
    rows += `<li class="t-${st}${/[acu]/.test(tl.fx) ? " spell" : ""}"><span class="tn">${esc(tl.name)}</span><span class="tr">${r}/${tl.max}</span><span class="tx">${talentLine(tl, r)}</span></li>`;
  });
  setHtml("talTabs", tabs); setHtml("tal", rows);
  const fx = talentFx(S.cls, S.level, S.spec), heals = /Paladin|Priest|Shaman|Druid/.test(S.cls);
  const keys = ["d", "t", "m", "h", "l"].filter(k => (k !== "m" || c.mp) && (k !== "l" || heals));
  const pct = v => Math.round(v * 100), neg = k => k === "t" || k === "m";
  const mine = keys.filter(k => fx[k] > 0).map(k => `${neg(k) ? "−" : "+"}${pct(fx[k])}% ${TAL_FX[k]}`);
  const say = (k, p) => k === "t" ? `${Math.abs(p)}% ${p > 0 ? "less" : "more"} damage taken` : k === "m" ? `spells ${Math.abs(p)}% ${p > 0 ? "cheaper" : "dearer"}` : `${p > 0 ? "+" : "−"}${Math.abs(p)}% ${TAL_FX[k]}`;
  const vs = keys.map(k => { const m = talMod(k), p = Math.round((neg(k) ? 1 - m : m - 1) * 100); return p ? `<span class="${p > 0 ? "up" : "dn"}">${say(k, p)}</span>` : ""; }).filter(Boolean);
  setHtml("talSum", S.level >= 10 ? `<div><b>Your build:</b> ${mine.join(" · ") || "nothing yet"}</div><div><b>Against an average build:</b> ${vs.join(" · ") || "about the same"}</div>` : "");
}
