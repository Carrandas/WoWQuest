// Life at 60, the small things: doing things for fun on a city visit (duels outside the capital, /dance on the bank, a
// lap around the world: chronicle lines, a few minutes each), the Ahn'Qiraj war effort's supplies taken out of the bags
// when the hero has them (raidq.js asks `aqSupply`), and the tabard the hero wears (S.tabard: the Tabard of the Argent
// Dawn from friendly, otherwise the guild's).
"use strict";

// ---------- for fun ----------
const FUN = [
  () => { const win = Math.random() < 0.55, cls = pick(Object.keys(CLASSES).filter(c => c !== S.cls)); return [`Dueling outside ${capitalName()}`, win ? `A ${cls.toLowerCase()} challenges ${S.name} to a duel outside ${capitalName()}. ${S.name} wins. A small crowd claps.` : `A ${cls.toLowerCase()} challenges ${S.name} to a duel outside ${capitalName()} and wins. "gg"`]; },
  () => [`Dancing on the bank in ${capitalName()}`, `${S.name} joins the dance party on the bank in ${capitalName()}. Thirty people, no music, one naked gnome.`],
  () => [`A lap around the world`, `${S.name} takes every flight path just to see the world again: ${pick(["Booty Bay at sunset", "the Thousand Needles from above", "the Ironforge airport", "the Undercity elevators", "Moonglade at night"])}.`],
  () => [`Jumping off the Thunder Bluff elevators`, `${S.name} jumps off the Thunder Bluff elevator with a Light Feather. Somebody without one doesn't make it.`],
  () => [`Fishing off the docks of Menethil Harbor`, `${S.name} fishes off the docks of Menethil Harbor while the boat is late again. Nobody catches anything.`],
  () => [`A race to Booty Bay`, `A level 1 gnome race to Booty Bay starts in front of the bank. ${S.name} rides along as an escort. ${pick(["Two of them make it.", "None of them make it.", "One makes it, naked."])}`],
  () => [`Sitting in the inn`, `${S.name} sits in the inn in ${capitalName()} and listens to the guild argue about loot. /sleep`],
];
const capitalName = () => S.faction === "Horde" ? "Orgrimmar" : "Ironforge";
function funCity(q) {
  if (S.level < 60 || Math.random() >= 0.04) return;
  const [d, line] = pick(FUN)();
  q.push({ k: "fun", d, t: sec(12), line });
}

// ---------- the Ahn'Qiraj war effort: from the bags first ----------
// the materials the war effort takes, as they're called in the bags (S.prof.mats): [bag name, hand-in name]
const AQ_SUPPLY = [["Copper Ore", "Copper Bars"], ["Thorium Ore", "Thorium Bars"], ["Light Leather", "Light Leather"], ["Medium Leather", "Medium Leather"], ["Heavy Leather", "Heavy Leather"], ["Thick Leather", "Thick Leather"], ["Rugged Leather", "Rugged Leather"], ["Peacebloom", "Peacebloom"], ["Linen Cloth", "Linen Bandages"], ["Runecloth", "Runecloth Bandages"]];
// the hand-in for today: something from the bags (free), or null (bought, as before)
function aqSupply() {
  const m = S.prof && S.prof.mats; if (!m) return null;
  const have = AQ_SUPPLY.filter(([k]) => (m[k] || 0) >= 20);
  return have.length ? pick(have) : null;
}
function aqTake(bag) { const m = S.prof.mats; m[bag] -= 20; if (m[bag] <= 0) delete m[bag]; }

// ---------- the tabard ----------
function tabardGet(name) {
  if (S.tabard === name) return;
  S.tabard = name;
  log(`${S.name} puts on the ${name}.`, "loot3");
}
const tabardNow = () => S.tabard || (S.guild ? `<${S.guild.name}> guild tabard` : null);
const FUN_FINISH = { fun(t) { log(t.line, "quest"); } };
