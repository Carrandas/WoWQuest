// Minipets: companions to collect from level 10 on. Vendor pets on city visits (the other faction's through the
// Gadgetzan Auction House), Narkk's parrots in Booty Bay, rare drops, the OOX escorts and engineering builds.
"use strict";

// name, how you get it (vendor, neutral, drop, quest, craft), faction (A, H or B), and the details:
// vendor: [who, where, price in copper]; drop: [mob pattern, where, 1 in n]; craft: [Engineering skill]
const MINIPETS = [
  ["Bombay Cat", "vendor", "A", ["Donni Anthania", "Elwynn Forest", 4000]],
  ["Cornish Rex Cat", "vendor", "A", ["Donni Anthania", "Elwynn Forest", 4000]],
  ["Orange Tabby Cat", "vendor", "A", ["Donni Anthania", "Elwynn Forest", 4000]],
  ["Silver Tabby Cat", "vendor", "A", ["Donni Anthania", "Elwynn Forest", 4000]],
  ["White Kitten", "vendor", "A", ["Lil Timmy", "Stormwind", 6000]],
  ["Snowshoe Rabbit", "vendor", "A", ["Yarlyn Amberstill", "Dun Morogh", 2000]],
  ["Great Horned Owl", "vendor", "A", ["Shylenai", "Darnassus", 5000]],
  ["Hawk Owl", "vendor", "A", ["Shylenai", "Darnassus", 5000]],
  ["Prairie Dog", "vendor", "H", ["Halpa", "Thunder Bluff", 5000]],
  ["Black Kingsnake", "vendor", "H", ["Xan'tish", "Orgrimmar", 5000]],
  ["Brown Snake", "vendor", "H", ["Xan'tish", "Orgrimmar", 5000]],
  ["Crimson Snake", "vendor", "H", ["Xan'tish", "Orgrimmar", 5000]],
  ["Cockroach", "vendor", "H", ["Jeremiah Payson", "Undercity", 5000]],
  ["Cockatiel", "neutral", "B", ["Narkk", "Booty Bay", 4000]],
  ["Senegal", "neutral", "B", ["Narkk", "Booty Bay", 4000]],
  ["Green Wing Macaw", "drop", "B", [/^Defias Pirate$/, "The Deadmines", 120]],
  ["Hyacinth Macaw", "drop", "B", [/^Bloodsail/, "Stranglethorn Vale", 600]],
  ["Black Tabby Cat", "drop", "B", [/^(Syndicate|Dalaran)/, "Hillsbrad and Silverpine", 500]],
  ["Dark Whelpling", "drop", "B", [/^(Searing Whelp|Scalding Whelp|Black Broodling)$/, "Dustwallow Marsh, the Badlands and the Burning Steppes", 300]],
  ["Crimson Whelpling", "drop", "B", [/^Crimson Whelp$/, "the Wetlands", 300]],
  ["Emerald Whelpling", "drop", "B", [/^Dreaming Whelp$/, "the Swamp of Sorrows", 300]],
  ["Azure Whelpling", "drop", "B", [/^Cobalt Wyrmkin$/, "Winterspring", 300]],
  ["Sprite Darter Hatchling", "drop", "B", [/^Sprite Darter$/, "Feralas", 300]],
  ["Smolderweb Hatchling", "drop", "B", [/^Mother Smolderweb$/, "Lower Blackrock Spire", 12]],
  ["Worg Pup", "drop", "B", [/^Quartermaster Zigris$/, "Lower Blackrock Spire", 12]],
  ["Mechanical Chicken", "quest", "B", ["Oglethorpe Obnoticus", "the three OOX escorts (Tanaris, Feralas, the Hinterlands)"]],
  ["Mechanical Squirrel", "craft", "B", [75]],
  ["Pet Bombling", "craft", "B", [205]],
  ["Lifelike Mechanical Toad", "craft", "B", [265]],
].map(([name, src, side, x]) => ({ name, src, side, x }));
const OOX_ZONES = ["Tanaris", "Feralas", "The Hinterlands"];
const ownFaction = m => m.side === "B" || m.side === S.faction[0];
const hasMinipet = n => !!S.minipets[n];
// where a pet comes from, for the collection tab
function minipetWhere(m) {
  const [a, b, c] = m.x;
  if (m.src === "vendor") return ownFaction(m) ? `Sold by ${a} in ${b} (${moneyTxt(c)})` : `${S.faction === "Alliance" ? "A Horde" : "An Alliance"} pet: the Gadgetzan Auction House now and then (${moneyTxt(c * 20)} or so)`;
  if (m.src === "neutral") return `Sold by ${a} in ${b} (${moneyTxt(c)})`;
  if (m.src === "drop") return `A rare drop in ${b}`;
  if (m.src === "quest") return `A reward from ${a}, for ${b}`;
  return `Built with Engineering (${a})`;
}
// a new pet: it follows the hero from now on (text: how it was found, for the chronicle)
function addMinipet(name, text) {
  if (hasMinipet(name)) return;
  S.minipets[name] = stamp(); S.companion = name;
  log(`${text} A new companion.`, "loot3");
}

// ---------- getting them ----------
// a city visit from level 10: now and then one of the faction's vendor pets, and from 35 the odd pet from the
// other faction on the Gadgetzan Auction House (at a markup)
function minipetShop() {
  if (S.level < 10) return;
  const own = MINIPETS.filter(m => m.src === "vendor" && ownFaction(m) && !hasMinipet(m.name));
  if (own.length && (goalWith("pets:") || Math.random() < 0.5)) {
    const m = pick(own), [who, where, price] = m.x;
    if (spendable() >= price + 1000) { spend("gear", price); addMinipet(m.name, `Bought ${article(m.name)} from ${who} in ${where} for ${moneyTxt(price)}.`); }
  }
  const other = MINIPETS.filter(m => m.src === "vendor" && !ownFaction(m) && !hasMinipet(m.name));
  if (S.level >= 35 && other.length && Math.random() < 0.1) {
    const m = pick(other), price = m.x[2] * (16 + R(9));
    if (spendable() >= price * 3) { spend("gear", price); addMinipet(m.name, `Bought ${article(m.name)} on the Gadgetzan Auction House for ${moneyTxt(price)} (only the other faction's vendors sell it).`); }
  }
}
// arriving in a zone: Narkk's parrots in Booty Bay, and the OOX escorts toward the Mechanical Chicken
function minipetArrive(zone) {
  if (zone === "Stranglethorn Vale") MINIPETS.filter(m => m.src === "neutral" && !hasMinipet(m.name)).forEach(m => {
    if (Math.random() < 0.5 && spendable() >= m.x[2] * 3) { spend("gear", m.x[2]); addMinipet(m.name, `Bought ${article(m.name)} from Narkk in Booty Bay for ${moneyTxt(m.x[2])}.`); }
  });
  if (OOX_ZONES.includes(zone) && S.level >= 42 && !S.oox.includes(zone)) {
    S.oox.push(zone);
    log(`Found a crashed OOX robot in ${zone} and escorted it to safety (${S.oox.length} of 3).`, "quest");
    if (S.oox.length === 3) addMinipet("Mechanical Chicken", "All three OOX robots are home, and Oglethorpe Obnoticus sends a Mechanical Chicken to say thanks.");
  }
}
// enemies killed (by name): the rare drops
function minipetDrops(names) {
  for (const m of MINIPETS) {
    if (m.src !== "drop" || hasMinipet(m.name)) continue;
    const [re, , n] = m.x;
    for (const name of names) if (re.test(name) && Math.random() < 1 / n) { addMinipet(m.name, `The ${name} dropped a pet carrier: ${article(m.name)}!`); break; }
  }
}
// engineers build their own once the skill is there
function minipetCrafts() {
  if (!hasProf("Engineering")) return;
  MINIPETS.filter(m => m.src === "craft" && !hasMinipet(m.name) && profSkill("Engineering") >= m.x[0]).forEach(m => addMinipet(m.name, `Engineering: built ${article(m.name)}.`));
}

// ---------- the collection tab ----------
function renderCollection() {
  const got = MINIPETS.filter(m => hasMinipet(m.name)), order = got.slice().sort((a, b) => (S.minipets[b.name].p ?? 0) - (S.minipets[a.name].p ?? 0)).concat(MINIPETS.filter(m => !hasMinipet(m.name)));
  const row = m => { const e = S.minipets[m.name];
    return `<li class="${e ? "got" : "locked"}"><span class="ico">${e ? "✓" : "·"}</span><div><b>${esc(m.name)}${S.companion === m.name ? ' <small class="comp">companion</small>' : ""}</b><span>${esc(minipetWhere(m))}</span>${e ? `<time>${when(e.at, e.L, e.p)}</time>` : ""}</div></li>`; };
  return renderMounts() + `<li class="jhead">Minipets <small>${got.length} of ${MINIPETS.length}</small></li>` + order.map(row).join("");
}
