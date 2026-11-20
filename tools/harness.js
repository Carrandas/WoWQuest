// builds a self-contained test page: node tools/harness.js <save.json> <scenario> <out.html> [progress]
// The game's stylesheet and scripts are inlined, so the page works from anywhere, and SRC can point at
// another copy (an older single-file index.html works too). SEED=<n> makes a run repeatable: Math.random
// is seeded and the save is loaded fresh right before the scenario, so the same code gives the same output.
// tools/sim.js runs the same scenarios in Node, without a browser.
const fs = require("fs"), path = require("path");
const setups = {
  field3: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}S.curQ=q.id;let t;for(let i=0;i<200;i++){t=killTask(q);if(t.mobs.length===3)break;}S.task=t;`,
  field1: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}S.curQ=q.id;let t;for(let i=0;i<200;i++){t=killTask(q);if(t.mobs.length===1)break;}S.task=t;`,
  stats: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}
    const res={n:0,off:0,low:0,die:0,close:0,dieE:0,nE:0,mobs:[0,0,0,0],noKiller:0,minEnd:9};
    for(let i=0;i<4000;i++){const elite=i%4===0;const qq={...q,type:elite?"elite":"kill"};S.hpF=0.4+Math.random()*0.6;S.cons.hp=5;const t=killTask(qq);const f=soloFight(t),ve=vitalEnd(t)[0],tl=f.tl,last=tl[tl.length-1][1];
      if(Math.abs(last-ve)>1e-6)res.off++; if(t.fate!=="die"&&tl.some(x=>x[1]<0.05-1e-9))res.low++; if(t.fate==="die"&&!t.killer)res.noKiller++;
      if(elite){res.nE++;if(t.fate==="die")res.dieE++;}else{res.n++;res.mobs[t.mobs.length]++;if(t.fate==="die")res.die++;if(t.fate==="close")res.close++;}}
    const g={};S.party=null;const d=instanceRow("The Deadmines");queueDungeon(d);S.dg.formed=true;const tr=S.queue.find(x=>x.k==="trash");const pf=partyFight(tr);const P=[pf.hero,...pf.m];
    g.target=foeTarget();g.role=heroRole();g.drops=P.map((p,i)=>(i?S.party[i-1].role:heroRole())+":"+p.tl.length);g.aoe=foeEvents(tr).filter(e=>e.aoe??e[2]).length;g.hits=foeEvents(tr).length;
    document.title=JSON.stringify([res,g]);document.body.innerHTML="<pre style='color:#fff;font-size:18px;white-space:pre-wrap'>"+document.title+"</pre>";S.task={k:"move",d:"x",t:1e9};`,
  killlog: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}const out=[];
    for(const fate of ["die","close",""]){const t=killTask(q);t.fate=fate;soloFight(t);finish(t);out.push(S.log[0].txt+" | hpF="+S.hpF);}
    document.body.innerHTML="<pre style='color:#fff;font-size:18px;white-space:pre-wrap'>"+out.join(" ## ")+"</pre>";S.task={k:"move",d:"x",t:1e9};`,
  run: `const H=+(window.HOURS||20),d0=S.deaths,L0=S.level,x0=S.xp,k0=S.kills;let close=0,killed=0,wipes=0,logs=[];const seen=new Set();const t0=performance.now();
    for(let i=0;i<H*60;i++){advance(60000);for(const l of S.log.slice(0,30)){if(seen.has(l.id))continue;seen.add(l.id);if(/^Close call/.test(l.txt))close++;if(/^(Killed by|Died to)/.test(l.txt)){killed++;logs.push("L"+S.level+" "+l.txt.slice(0,70))}if(/^Wiped/.test(l.txt))wipes++;}}
    const out={hours:H,deaths:S.deaths-d0,soloDeaths:killed,close,wipes,level:L0+"->"+S.level+" ("+Math.round(S.xp/xpNeed(S.level)*100)+"%)",kills:S.kills-k0,ms:Math.round(performance.now()-t0),sample:logs.slice(0,6)};
    document.body.innerHTML="<pre style='color:#fff;font-size:16px;white-space:pre-wrap'>"+JSON.stringify(out,null,1)+"</pre>";S=null;`,
  pulls: `const H=40;const st={};const orig=soloFight;window.soloFight=null;
    soloFight=function(t){const had=!!t.sf,start=S.hpF??1,r=orig(t);if(!had){const key=t.elite?"elite":"n"+(t.mobs||[1]).length;const o=st[key]||(st[key]={pulls:0,loss:0,startSum:0,under20:0,drank:0,died:0,stun:0});o.pulls++;o.loss+=start-r.end;o.startSum+=start;if(r.low<0.2)o.under20++;if(r.drank)o.drank++;if(r.end<=0)o.died++;o.stun+=(t.casts||[]).filter(c=>LOST.test(c)).length;}return r;};
    const L0=S.level;for(let i=0;i<H*60;i++)advance(60000);
    for(const k in st){const o=st[k];o.loss=(o.loss/o.pulls).toFixed(3);o.startAvg=(o.startSum/o.pulls).toFixed(2);delete o.startSum;}
    document.body.innerHTML="<pre style='color:#fff;font-size:15px;white-space:pre-wrap'>"+JSON.stringify({level:L0+"->"+S.level,deaths:S.deaths,st})+"</pre>";S=null;`,
  elite: `S.dg=null;S.party=null;S.loc="field";const zq=S.quests[0]||{id:9999,name:"Test",mob:"Defias Pathstalker",zone:curZone(),prog:0,max:1};const r={pulls:0,died:0,drank:0,loss:0,noPot:0,diedNoPot:0};
    for(let i=0;i<3000;i++){const q={...zq,type:"elite"};S.hpF=1;const pots=i%3===0?0:5;S.cons.hp=pots;const t=killTask(q);const f=soloFight(t);r.pulls++;r.loss+=1-f.end;if(f.end<=0){r.died++;if(!pots)r.diedNoPot++;}if(f.drank)r.drank++;if(!pots)r.noPot++;}
    r.loss=(r.loss/r.pulls).toFixed(3);document.body.innerHTML="<pre style='color:#fff;font-size:16px'>"+JSON.stringify(r)+"</pre>";S=null;`,
  bosslog: `S.queue.length=0;S.task=null;const out=[];for(const [dn,b,w] of [["Molten Core","Ragnaros",false],["Onyxia's Lair","Onyxia",false],["Onyxia's Lair","Onyxia",true],["Naxxramas","Patchwerk",false]]){const d=instanceRow(dn);S.queue.length=0;queueDungeon(d);S.dg.formed=true;const t=S.queue.find(x=>x.k==="boss"&&x.boss===b);t.wipe=w;partyFight(t);const n0=S.log.length?S.log[0].id:0;finish(t);out.push(b+(w?" (wipe)":"")+": "+S.log.filter(l=>l.id>n0).map(l=>l.txt).reverse().join(" / "));}
    document.body.innerHTML="<pre style='color:#fff;font-size:15px;white-space:pre-wrap'>"+out.join(" ## ")+"</pre>";S=null;`,
  aoe: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x)&&x.mob)||{id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};if(!S.quests.includes(q))S.quests.push(q);q={...q,type:"kill"};
    const out=[];let t;for(let i=0;i<500;i++){t=killTask(q);if(t.mobs.length===3)break;}const f=foeOf(t);out.push("t="+t.t+" casts="+t.casts.join(","));f.units.forEach(u=>out.push(u.name+" a="+u.a+" b="+u.b+" hp="+u.hp.map(x=>x.toFixed(2)).join(" ")));
    const st={};for(let i=0;i<3000;i++){const t=killTask(q);const n=t.mobs.length;const o=st[n]||(st[n]={n:0,t:0,c:0,aoe:0});o.n++;o.t+=t.t;o.c+=t.casts.length;o.aoe+=t.casts.filter(c=>AOE[c]).length;soloFight(t);}
    for(const k in st){const o=st[k];out.push(k+" mobs: avg t "+Math.round(o.t/o.n)+" casts "+(o.c/o.n).toFixed(1)+" aoe "+(o.aoe/o.n).toFixed(1));}
    const d=instanceRow("Scarlet Monastery")||DUNGEONS[8];S.queue.length=0;queueDungeon(d);S.dg.formed=true;S.queue.filter(x=>x.k==="trash").slice(0,3).forEach(tr=>{const f=foeOf(tr);out.push("TRASH t="+tr.t+" share="+tr.aoeShare+" n="+tr.mobs.length+" "+tr.casts.join(","));f.units.forEach(u=>out.push(" "+u.name+" b="+u.b+" "+u.hp.map(x=>x.toFixed(2)).join(" ")));});
    document.body.innerHTML="<pre id=o style='color:#fff;font-size:13px;white-space:pre-wrap'>"+out.join(" | ")+"</pre>";S.task={k:"move",d:"x",t:1e9};`,
  econ: `const H=+(window.HOURS||20),m0=S.money,L0=S.level,d0=S.deaths,t0=S.time;const P=S.prof?JSON.stringify(S.prof.sk):"";for(let i=0;i<H*60;i++)advance(60000);
    const wk=(S.time-t0)/(7*86400000);const out={hours:H,level:L0+"->"+S.level,gold:((S.money-m0)/10000).toFixed(0),goldPerWeek:((S.money-m0)/10000/wk).toFixed(0),money:(S.money/10000).toFixed(0),deaths:S.deaths-d0,mount:S.mount,runs:S.runs,prof:S.prof?{p:S.prof.a+"+"+S.prof.b,sk:S.prof.sk,start:P}:null,spend:S.spend||null,gs:gearScore().toFixed(1)};
    document.body.innerHTML="<pre style='color:#fff;font-size:15px;white-space:pre-wrap'>"+JSON.stringify(out)+"</pre>";S=null;`,
  idle: `S.task={k:"move",d:"Heading out",t:20000};`,
  // a hero played for HOURS (default 40): level, deaths, gold, gear, blue crafts and profession skills at levels 20/30/40/50 (used by check.js balance)
  bal: `const H=+(window.HOURS||40),d0=S.deaths,marks={},seen=new Set();let solo=0;for(let i=0;i<H*60;i++){advance(60000);for(const T of [20,30,40,50])if(!marks[T]&&S.level>=T){const p=S.prof;marks[T]={a:p.sk[p.a],b:p.sk[p.b],fa:p.sk["First Aid"],ck:p.sk.Cooking};}for(const l of S.log.slice(0,20)){if(seen.has(l.id))continue;seen.add(l.id);if(/^Killed by/.test(l.txt))solo++;}}const p=S.prof;document.body.innerHTML=JSON.stringify({level:S.level+S.xp/xpNeed(S.level),deaths:S.deaths-d0,solo,gold:S.money/1e4,gs:gearScore(),blues:(p.count&&p.count.q3)||0,made:p.made,a:p.a,b:p.b,marks,mount:S.mount});S=null;`,
  // a new hero played to level 60 (at most HOURS, default 250), then ENDH hours of endgame (default 40):
  // levelling time, deaths, gold and gear at 60; raid runs, boss kills and wipes, and the hero's rank on the meter (used by check.js specs)
  spec60: `const H=+(window.HOURS||250),E=+(window.ENDH||40),seen=new Set();let solo=0;const chk=()=>{for(const l of S.log.slice(0,20)){if(seen.has(l.id))continue;seen.add(l.id);if(/^Killed by/.test(l.txt))solo++;}};for(let i=0;i<H*60&&S.level<60;i++){advance(60000);chk();}const L={hours:S.time/36e5,level:S.level,deaths:S.deaths,solo,gold:S.money/1e4,gs:gearScore(),mount:S.mount};const RD={runs:{},kills:0,wipes:0,dmg:[],heal:[]},d0=S.deaths,m0=S.money,s0=solo;const ob=FINISH.boss;FINISH.boss=function(t){const raid=!!RAID_INFO[t.dn],w=raid&&bossWipes(t);ob(t);if(!raid)return;if(w){RD.wipes++;return;}RD.kills++;const M=S.meter&&S.meter.last,n=S.party?S.party.length+1:1;if(M){const rk=a=>{const me=a[0]+(a.length>n?a[n]:0),o=a.slice(1,n);return 1+o.filter(v=>v>me).length;};RD.dmg.push(rk(M.dmg));RD.heal.push(rk(M.heal));}};const od=FINISH.dend;FINISH.dend=function(t){if(RAID_INFO[t.dn])RD.runs[t.dn]=(RD.runs[t.dn]||0)+1;od(t);};if(S.level>=60)for(let i=0;i<E*60;i++){advance(60000);chk();}const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;document.body.innerHTML=JSON.stringify({L,end:{deaths:S.deaths-d0,solo:solo-s0,gold:(S.money-m0)/1e4,gs:gearScore(),mount:S.mount,runs:RD.runs,kills:RD.kills,wipes:RD.wipes,dmgRank:avg(RD.dmg),healRank:avg(RD.heal)}});S=null;`,
  // the endgame timeline: a new hero played to 60, then DAYS days of play (default 60): the day each raid is first
  // fully cleared, gear score and gold at days 2/7/14/30/60, the day of the epic mount (used by check.js endgame)
  end60: `const D=+(window.DAYS||60);for(let i=0;i<250*60&&S.level<60;i++)advance(60000);const t0=S.time,day=()=>(S.time-t0)/864e5,clears={},snap={};let epic=null;const marks=[2,7,14,30,45,60];for(let h=0;h<D*24;h++){for(let m=0;m<60;m++)advance(60000);RAIDS.forEach(r=>{if(clears[r.name]==null&&S.dungeons.includes(r.name))clears[r.name]=+day().toFixed(1);});if(epic==null&&S.mount>=2)epic=+day().toFixed(1);for(const k of marks)if(snap[k]==null&&day()>=k)snap[k]={gs:+gearScore().toFixed(1),gold:Math.round(S.money/1e4)};}document.body.innerHTML=JSON.stringify({h60:Math.round(t0/36e5),gold60:null,clears,snap,epic});S=null;`,
  boss: `S.queue.length=0;S.task=null;const d=instanceRow(BOSSDG);queueDungeon(d);S.loc="dungeon";S.dg.formed=true;const i=S.queue.findIndex(x=>x.k==="boss"&&x.boss===BOSSNAME);S.dg.killed=(d.bosses||d[6].split(",")).indexOf(BOSSNAME);S.task=S.queue[i];S.queue.splice(0,i+1);`,
  trash: `S.queue.length=0;S.task=null;const d=instanceRow(BOSSDG);queueDungeon(d);S.loc="dungeon";S.dg.formed=true;const i=S.queue.findIndex(x=>x.k==="trash");S.task=S.queue[i];S.queue.splice(0,i+1);`,
};

// the game's page with the stylesheet and scripts inlined
function gamePage(src) {
  const dir = path.dirname(src), read = f => fs.readFileSync(path.join(dir, f), "utf8");
  return fs.readFileSync(src, "utf8")
    .replace(/<link rel="stylesheet" href="([^":]+\.css)">/g, (m, f) => `<style>\n${read(f)}</style>`)
    .replace(/<script src="([^":]+\.js)"><\/script>/g, (m, f) => `<script>\n${read(f)}</script>`);
}
// runs before the scenario: a seeded Math.random and a fresh copy of the save (SAVE0)
const seedCode = seed => seed ? `Math.random=(s=>()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296})(${+seed});if(SAVE0){S=JSON.parse(SAVE0);migrate();}` : "";
const DEFAULT_SRC = path.join(__dirname, "..", "index.html");
module.exports = { setups, gamePage, seedCode, DEFAULT_SRC };

if (require.main === module) {
  const [save, scen, out, prog = "0.45"] = process.argv.slice(2);
  let html = gamePage(process.env.SRC || DEFAULT_SRC);
  const data = fs.readFileSync(save, "utf8");
  // errors while the page loads are written on the page, so a screenshot shows them
  const pre = `<style>*{transition:none!important}</style><script>window.onerror=(m,f,l)=>{document.title="ERR "+m;addEventListener("load",()=>document.body.insertAdjacentHTML("afterbegin","<h1 style=color:red>"+m+" (line "+l+")</h1>"))};window.SAVE0=${JSON.stringify(data)};window.claude={hot:{data:{S:JSON.parse(SAVE0)}}};</script>\n`;
  const [kind, dg, boss] = scen.split(":");
  const post = `<script>setTimeout(()=>{try{const BOSSDG=${JSON.stringify(dg || "")},BOSSNAME=${JSON.stringify(boss || "")};${seedCode(process.env.SEED)}${process.env.PRE || ""};${setups[kind]}S.task.el=S.task.t*${prog};speed=0;dirty=true;}catch(e){document.title="ERR "+e.message;document.body.insertAdjacentHTML("afterbegin","<h1 style=color:red>"+e.stack+"</h1>")}},400);</script>`;
  html = html.replace("<script", () => pre + "<script").replace("</body>", () => post + "</body>");
  fs.writeFileSync(out, html);
}
