// The in-game calendar (S.cal): twelve months of ten game days (a year is CAL_YEAR days; each hero starts on a random
// date, S.cal.d0), with the Darkmoon Faire on the first days of every month (Goldshire in Elwynn Forest and Mulgore in
// turn) and the holidays on their months. A holiday or the Faire that's on shows up on a city visit: while levelling a
// reward for the level (holiday gear, Darkmoon Prizes for prize tickets), at 60 one prize per occurrence (the
// holiday's epic, or one of its minipets: never all of them in one go) and the Faire's big rewards: the Amulet or Orb
// of the Darkmoon (1200 tickets, a few Faires) and a Darkmoon Card (the deck bought on the AH: a gold sink). Plus the
// Gurubashi Arena at 60: a free evening now and then fighting for the chest, for the Arena Grand Master trinket.
"use strict";

const CAL_MONTH = 10, CAL_YEAR = 12 * CAL_MONTH;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// the holidays: month (0-11), first and last day (1-10), what the hero does, the epic at 60, the minipets (one per year)
const HOLIDAYS = [
  { key: "lunar", name: "the Lunar Festival", m: 1, from: 1, to: 4, task: () => `Honoring an Elder in ${pick(["Winterspring", "the Barrens", "Stranglethorn Vale", "Tanaris", "Dun Morogh", "Felwood"])} for a Coin of Ancestry`, line: "Fireworks over Moonglade. The Elder blesses you.", epic: { name: "Cloak of the Moonglade Elders", slot: "Back" } },
  { key: "love", name: "Love is in the Air", m: 1, from: 6, to: 9, task: () => `Handing out Gifts of Adoration in ${city()}`, line: "Someone hands you a Gift of Adoration back. The guards are all wearing perfume.", epic: { name: "Peddlefeet's Locket", slot: "Neck" } },
  { key: "noble", name: "Noblegarden", m: 3, from: 3, to: 5, task: () => `Hunting Brightly Colored Eggs outside ${S.faction === "Horde" ? "Razor Hill" : "Goldshire"}`, line: "Mostly chocolate. One egg holds a White Tuxedo Shirt.", epic: { name: "Noblegarden Circlet", slot: "Head" } },
  { key: "child", name: "Children's Week", m: 4, from: 1, to: 5, task: () => `Showing an orphan from the ${S.faction === "Horde" ? "Orgrimmar" : "Stormwind"} orphanage around: ice cream, the zoo, the big city`, line: "The orphan waves goodbye and leaves a present.", pets: ["Whiskers the Rat", "Speedy"] },
  { key: "summer", name: "the Midsummer Fire Festival", m: 5, from: 4, to: 8, task: () => `Honoring the bonfire in ${curZone()}`, line: "The Flame Warden thanks you. The bonfire roars.", epic: { name: "Mantle of the Flame Warden", slot: "Shoulder" } },
  { key: "harvest", name: "the Harvest Festival", m: 8, from: 3, to: 7, task: () => `At the Harvest Festival feast outside ${S.faction === "Horde" ? "Orgrimmar" : "Ironforge"}, honoring the fallen heroes`, line: "A toast to Grom Hellscream and Uther the Lightbringer.", epic: { name: "Band of the Harvest Ancestors", slot: "Finger" } },
  { key: "hallow", name: "Hallow's End", m: 9, from: 4, to: 9, task: () => `Trick or treat at the inn in ${S.faction === "Horde" ? "Razor Hill" : "Goldshire"}`, line: () => `Treat! A Hallowed Wand turns ${S.name} into a ${pick(["pirate", "ninja", "leper gnome", "bat", "skeleton", "ghost"])} for an hour.`, epic: { name: "Hallowed Pumpkin Charm", slot: "Trinket" } },
  { key: "veil", name: "the Feast of Winter Veil", m: 11, from: 3, to: 10, task: () => `Greatfather Winter in ${S.faction === "Horde" ? "Orgrimmar" : "Ironforge"}: a gift under the tree`, line: "Snowball fights in front of the bank. Smokywood Pastures sells out of eggnog.", epic: { name: "Greatfather Winter's Mittens", slot: "Hands" }, pets: ["Winter Reindeer", "Father Winter's Helper", "Winter's Little Helper", "Tiny Snowman"] },
];
const HOLIDAY_EPIC_ILVL = 72; // raid level: Blackwing Lair
// the Darkmoon Faire: the first three days of each month; the cards and the big prizes
const DMF_DAYS = 3, DMF_TICKETS = 1200, DMF_DECK = 4000000; // the deck's eight cards on the AH: 400 gold
const dmfCard = () => heroRole() === "tank" ? "Darkmoon Card: Heroism" : isCaster() || heroRole() === "heal" ? "Darkmoon Card: Blue Dragon" : "Darkmoon Card: Maelstrom";
const dmfDeck = () => ({ "Darkmoon Card: Heroism": "the Beasts Deck", "Darkmoon Card: Blue Dragon": "the Portals Deck", "Darkmoon Card: Maelstrom": "the Elementals Deck" })[dmfCard()];
const dmfPrize = () => isCaster() || heroRole() === "heal" ? { name: "Orb of the Darkmoon", slot: "Off Hand", ilvl: 65, q: 4 } : { name: "Amulet of the Darkmoon", slot: "Neck", ilvl: 65, q: 4 };
const newCal = () => ({ d0: R(CAL_YEAR), seen: {}, got: {}, tickets: 0, card: false, orb: false, arena: { tries: 0, wins: 0 } });

// ---------- the date ----------
const calDay = () => Math.floor(S.time / DAY) + S.cal.d0;            // days since the start of year 0
const calYear = () => Math.floor(calDay() / CAL_YEAR);
const calDate = (d = calDay()) => { const y = d % CAL_YEAR; return { m: Math.floor(y / CAL_MONTH), day: y % CAL_MONTH + 1 }; };
const dateTxt = (d = calDay()) => { const x = calDate(d); return `${MONTHS[x.m]} ${x.day}`; };
const holOn = h => { const x = calDate(); return x.m === h.m && x.day >= h.from && x.day <= h.to; };
const dmfOn = () => calDate().day <= DMF_DAYS;
const dmfWhere = () => calDate().m % 2 ? "Mulgore" : "Elwynn Forest";
const occ = key => `${key}:${calYear()}:${key === "dmf" ? calDate().m : ""}`; // one visit per holiday per year, per Faire per month
// days until a holiday starts (0 while it's on)
const holIn = h => { if (holOn(h)) return 0; const y = calDay() % CAL_YEAR, start = h.m * CAL_MONTH + h.from - 1; return (start - y + CAL_YEAR) % CAL_YEAR; };

// ---------- on a city visit ----------
function calCity(q) {
  const c = S.cal;
  HOLIDAYS.filter(h => holOn(h) && !c.seen[occ(h.key)]).forEach(h => q.push({ k: "hol", d: h.task(), t: sec(h.key === "child" ? 40 : 20), ev: h.key }));
  if (dmfOn() && !c.seen[occ("dmf")] && S.level >= 10) q.push({ k: "dmf", d: `The Darkmoon Faire in ${dmfWhere()}: trade goods for prize tickets, Sayge's fortune, the Tonk Controllers`, t: sec(30) });
}
// a holiday done: a reward for the level, or at 60 one prize (the goal's, the epic, then a minipet)
function holDone(t) {
  const h = HOLIDAYS.find(x => x.key === t.ev), c = S.cal; if (!h || c.seen[occ(h.key)]) return;
  c.seen[occ(h.key)] = 1;
  log(`${typeof h.line === "function" ? h.line() : h.line}`, "quest");
  if (S.level < 60) { if (h.key !== "child") gain(makeItem(randomSlot(), S.level + 3, 3), `A gift for ${h.name}:`); }
  const pets = (h.pets || []).filter(p => !hasMinipet(p)), epic = h.epic && !c.got[h.key];
  const wantPet = hasGoal("holpet:" + h.key) || !epic || S.level < 60;
  if (pets.length && wantPet) { addMinipet(pick(pets), `${h.name}: a gift with a pet inside!`); return; }
  if (epic && S.level >= 60) {
    // the prize bag: the epic sometimes (often with the goal), otherwise something for the fun of it
    if (Math.random() >= (hasGoal("hol:" + h.key) ? 0.75 : 0.35)) { log(`The prize: ${pick(["a stack of fireworks", "a costume that lasts an hour", "holiday treats for the whole guild", "a funny hat", "a recipe nobody needs"])}. Maybe next year.`, "quest"); return; }
    c.got[h.key] = 1;
    gain({ name: h.epic.name, slot: h.epic.slot, ilvl: HOLIDAY_EPIC_ILVL, q: 4 }, `${h.name[0].toUpperCase() + h.name.slice(1)}'s prize:`);
  }
}
// the Faire: tickets for the turn-ins, Sayge's fortune, a prize for the tickets, at 60 the card for a full deck
function dmfDone() {
  const c = S.cal; if (c.seen[occ("dmf")]) return;
  c.seen[occ("dmf")] = 1;
  const n = S.level < 60 ? 15 + R(30) : 150 + R(100);
  c.tickets += n; spend("mats", Math.min(spendable(), S.level * 300));
  S.buffs["Sayge's Dark Fortune of Damage"] = S.time + 120 * MIN;
  log(`Silas Darkmoon's Faire: ${n} prize tickets for the trade goods, and Sayge's Dark Fortune of Damage. ${pick(["The Tonk Controllers are all taken.", "Flik's frog gets away again.", "Someone wins a Darkmoon Faire Fortune: \"You will be the first to fall.\""])}`, "quest");
  if (S.level < 60) {
    const [cost, q, nm] = c.tickets >= 40 ? [40, 3, "Greater"] : c.tickets >= 12 ? [12, 2, "Lesser"] : c.tickets >= 5 ? [5, 2, "Minor"] : [0];
    if (cost) { c.tickets -= cost; gain(makeItem(randomSlot(), S.level + (q === 3 ? 3 : 1), q), `A ${nm} Darkmoon Prize:`); }
    return;
  }
  if (!c.orb && c.tickets >= DMF_TICKETS) { c.tickets -= DMF_TICKETS; c.orb = true; gain(dmfPrize(), `Gelvas Grimegate, for ${DMF_TICKETS} tickets:`); }
  if (!c.card && spendable() >= DMF_DECK * (hasGoal("dmfcard") ? 1 : 1.5)) {
    spend("gear", DMF_DECK); c.card = true;
    log(`Bought the last cards of ${dmfDeck()} on the Auction House (${moneyTxt(DMF_DECK)}) and turned the deck in to Professor Thaddeus Paleo.`, "gold");
    gain({ name: dmfCard(), slot: "Trinket", ilvl: 66, q: 4 }, "The deck's reward:");
  }
}

// ---------- the Gurubashi Arena ----------
const ARENA_ROW = { name: "Gurubashi Arena", arena: true };
const arenaPick = () => S.level >= 60 && !S.cal.arena.wins && Math.random() < (hasGoal("arena") ? 0.4 : 0.04) ? ARENA_ROW : null;
function queueArena() {
  const q = S.queue, win = Math.random() < 0.2, them = foeSide();
  q.push({ k: "move", d: `Riding to the Gurubashi Arena in Stranglethorn Vale: Short John Mithril drops the chest every three hours`, t: sec(60) });
  for (let i = 0, n = 2 + R(2); i < n; i++) q.push(cqFight(`Free for all in the Gurubashi Arena`, `${them} ${pick(["Rogue", "Warrior", "Mage", "Hunter", "Priest", "Warlock", "Druid", S.faction === "Horde" ? "Paladin" : "Shaman"])}`, 60, { arena: true, die: !win && i === n - 1 }));
  q.push({ k: "arenaend", d: win ? "Grabbing the Arena Master's chest" : "Watching someone else run off with the chest", t: sec(8), win });
}
function arenaEnd(t) {
  const a = S.cal.arena; a.tries++;
  if (!t.win) return log(`${pick(PLAYERS)} grabs the chest while ${S.name} is still fighting. ${pick(["Next time.", "Gurubashi rules.", "Short John Mithril laughs."])}`, "quest");
  a.wins++;
  log(`${S.name} opens the Arena Master's chest! Short John Mithril hands over the Arena Grand Master.`, "ach");
  gain({ name: "Arena Grand Master", slot: "Trinket", ilvl: 63, q: 3 }, "The arena's prize:");
}
const CAL_FINISH = { hol(t) { holDone(t); }, dmf() { dmfDone(); }, arenaend(t) { arenaEnd(t); } };

// ---------- goals, the Quests tab ----------
function calGoals(out) {
  if (S.level < 60) return;
  const c = S.cal, inTxt = h => holIn(h) ? `${holIn(h)} days until ${h.name}` : `${h.name} is on now`;
  HOLIDAYS.filter(h => h.epic && !c.got[h.key]).forEach(h => out.push({ id: "hol:" + h.key, name: h.epic.name, what: `${h.name[0].toUpperCase() + h.name.slice(1)}'s prize at 60: an epic for the ${h.epic.slot.toLowerCase()}, raid level (one prize each year, and the epic is not always in the bag: the goal makes it likely). ${h.name[0].toUpperCase() + h.name.slice(1)} is in ${MONTHS[h.m]}.`,
    prog: () => [0, null], txt: () => inTxt(h), done: () => !!S.cal.got[h.key] }));
  // a holiday's pet: the goal until the first one (the rest come one a year without it)
  HOLIDAYS.filter(h => h.pets && !h.pets.some(hasMinipet)).forEach(h => out.push({ id: "holpet:" + h.key, name: `A pet from ${h.name}`, what: `${h.pets.join(", ")}: one each year, at random. ${h.name[0].toUpperCase() + h.name.slice(1)} is in ${MONTHS[h.m]}.`,
    prog: () => [0, null], txt: () => inTxt(h), done: () => h.pets.some(hasMinipet) }));
  if (!c.card) out.push({ id: "dmfcard", name: dmfCard(), what: `The last cards of ${dmfDeck()} from the Auction House (${moneyTxt(DMF_DECK)}), turned in at the next Darkmoon Faire: an epic trinket. A gold sink.`, prog: () => [Math.min(spendable(), DMF_DECK), DMF_DECK], txt: () => `${moneyTxt(Math.min(spendable(), DMF_DECK))} of ${moneyTxt(DMF_DECK)} · the Faire ${dmfOn() ? "is on now" : "comes on the 1st"}`, done: () => S.cal.card });
  if (!c.orb) out.push({ id: "dmforb", name: dmfPrize().name, what: `${DMF_TICKETS} Darkmoon Faire Prize Tickets for Gelvas Grimegate: trade goods turned in at a few Faires.`, prog: () => [Math.min(S.cal.tickets, DMF_TICKETS), DMF_TICKETS], txt: () => `${S.cal.tickets} of ${DMF_TICKETS} tickets`, done: () => S.cal.orb });
  if (!c.arena.wins) out.push({ id: "arena", name: "Gurubashi Arena", what: "Win the Arena Master's chest in the Gurubashi Arena: free for all, every three hours, both factions. The Arena Grand Master trinket.", prog: () => [0, null], txt: () => `${S.cal.arena.tries} tries`, done: () => S.cal.arena.wins > 0 });
}
function calRender() {
  if (!S.cal) return "";
  const on = HOLIDAYS.filter(holOn).map(h => h.name).concat(dmfOn() ? [`the Darkmoon Faire (${dmfWhere()})`] : []);
  const next = HOLIDAYS.filter(h => !holOn(h)).sort((a, b) => holIn(a) - holIn(b))[0];
  return `<li class="qhead">Calendar</li><li class="goal"><div class="gl"><b>${esc(dateTxt())}</b><small>${on.length ? `On now: ${esc(on.join(", "))}. ` : ""}Next: ${esc(next.name)} in ${holIn(next)} day${holIn(next) === 1 ? "" : "s"}${dmfOn() ? "" : `, the Darkmoon Faire in ${CAL_MONTH - calDate().day + 1} days`}.${S.cal.tickets ? ` ${S.cal.tickets} prize tickets.` : ""}</small></div></li>`;
}
