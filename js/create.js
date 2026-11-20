// Character creation.
"use strict";

// ---------- rendering: character creation ----------
let draft = null;
function showCreate() {
  cancelAnimationFrame(rafId);
  draft = draft || { name: randomName(), faction: "Alliance", race: "Human", cls: "Warrior", spec: 0 };
  $("app").innerHTML = `
  <div class="create">
    <header><h1>WoWQuest</h1>
      <p>Level 1 to 60, the way it used to be, except your hero does all the work. Pick a faction, race and class, then watch them quest, loot, train and run dungeons on their own. The full journey takes about five days.</p></header>
    <div class="field"><label class="lbl" for="cName">name</label>
      <div class="namebox"><input id="cName" maxlength="24" autocomplete="off" spellcheck="false"><button type="button" class="die" id="cRandName">Random</button></div></div>
    <div class="field"><span class="lbl">faction</span><div class="factions" id="cFac"></div></div>
    <div class="field"><span class="lbl">race</span><div class="chips" id="cRace"></div></div>
    <div class="field"><span class="lbl">class</span><div class="classes" id="cCls"></div></div>
    <div class="field"><span class="lbl">talent specialization</span><div class="chips" id="cSpec"></div></div>
    <div class="field"><span class="lbl">professions</span><div class="chips" id="cProf"></div></div>
    <button type="button" class="begin" id="cGo">Enter World</button>
    <button type="button" class="ghost loadfile" id="cLoad">Load a save file</button>
    <p class="note">A fan-made tribute. Not affiliated with or endorsed by Blizzard Entertainment.</p>
  </div>`;
  $("cName").value = draft.name;
  $("cName").addEventListener("input", e => draft.name = e.target.value);
  $("cRandName").onclick = () => { draft.name = randomName(); $("cName").value = draft.name; };
  $("cGo").onclick = () => { newHero(draft); draft = null; startGame(); };
  $("cLoad").onclick = pickSaveFile;
  onButton("cFac", b => { draft.faction = b.dataset.f; draft.race = Object.keys(RACES).find(r => RACES[r].f === draft.faction); fixClass(); drawCreate(); });
  onButton("cRace", b => { draft.race = b.dataset.r; fixClass(); drawCreate(); });
  onButton("cCls", b => { draft.cls = b.dataset.c; draft.spec = 0; drawCreate(); });
  onButton("cSpec", b => { draft.spec = +b.dataset.s; drawCreate(); });
  onButton("cProf", b => { draft.prof = b.dataset.p; drawCreate(); });
  drawCreate();
}
function fixClass() { if (!ALLOWED[draft.race].includes(draft.cls)) { draft.cls = ALLOWED[draft.race][0]; draft.spec = 0; } }
function drawCreate() {
  $("cFac").innerHTML = [["Alliance", "Stormwind, Ironforge, Darnassus"], ["Horde", "Orgrimmar, Undercity, Thunder Bluff"]].map(([f, d]) => `<button type="button" class="fbtn ${f}" data-f="${f}" aria-pressed="${f === draft.faction}"><h3>${f}</h3><p>${d}</p></button>`).join("");
  $("cRace").innerHTML = Object.entries(RACES).filter(([, v]) => v.f === draft.faction).map(([r, v]) => `<button type="button" class="chip" data-r="${r}" aria-pressed="${r === draft.race}">${r}<small>${v.note}</small></button>`).join("");
  $("cCls").innerHTML = Object.entries(CLASSES).map(([n, c]) => { const ok = ALLOWED[draft.race].includes(n); return `<button type="button" class="ccard" data-c="${n}" aria-pressed="${n === draft.cls}" ${ok ? "" : "disabled"}><h3 style="color:${c.color}">${n}</h3><p>${ok ? c.blurb : `Not available to the ${draft.race}.`}</p></button>`; }).join("");
  if (!pairsFor(draft.cls).includes(draft.prof)) draft.prof = PAIR_FOR[draft.cls];
  const PROF_NOTE = { smith: "plate armor and weapons", leather: "leather or mail armor", tailor: "cloth armor, bags, enchants", herb: "potions, elixirs, flasks", eng: "goggles and bombs" };
  $("cProf").innerHTML = pairsFor(draft.cls).map(k => `<button type="button" class="chip" data-p="${k}" aria-pressed="${k === draft.prof}">${pairLabel(k)}<small>${PROF_NOTE[k]}</small></button>`).join("");
  $("cSpec").innerHTML = CLASSES[draft.cls].trees.map((t, i) => `<button type="button" class="chip" data-s="${i}" aria-pressed="${i === draft.spec}">${t}</button>`).join("");
}
