// builds test pages: node mk.js <save.json> <scenario> <out.html> [progress]
const fs = require("fs");
const [save, scen, out, prog = "0.45"] = process.argv.slice(2);
let html = fs.readFileSync(process.env.SRC || "C:/git/WoWQuest/index.html", "utf8");
const data = fs.readFileSync(save, "utf8");
const pre = `<style>*{transition:none!important}</style><script>window.claude={hot:{data:{S:${data}}}};</script>\n`;
const setups = {
  field3: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}S.curQ=q.id;let t;for(let i=0;i<200;i++){t=killTask(q);if(t.mobs.length===3)break;}S.task=t;`,
  field1: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}S.curQ=q.id;let t;for(let i=0;i<200;i++){t=killTask(q);if(t.mobs.length===1)break;}S.task=t;`,
  stats: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x));if(!q){q={id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};S.quests.push(q);}
    const res={n:0,off:0,low:0,die:0,close:0,dieE:0,nE:0,mobs:[0,0,0,0],noKiller:0,minEnd:9};
    for(let i=0;i<4000;i++){const elite=i%4===0;const qq={...q,type:elite?"elite":"kill"};S.hpF=0.4+Math.random()*0.6;S.cons.hp=5;const t=killTask(qq);const f=soloFight(t),ve=vitalEnd(t)[0],tl=f.tl,last=tl[tl.length-1][1];
      if(Math.abs(last-ve)>1e-6)res.off++; if(t.fate!=="die"&&tl.some(x=>x[1]<0.05-1e-9))res.low++; if(t.fate==="die"&&!t.killer)res.noKiller++;
      if(elite){res.nE++;if(t.fate==="die")res.dieE++;}else{res.n++;res.mobs[t.mobs.length]++;if(t.fate==="die")res.die++;if(t.fate==="close")res.close++;}}
    const g={};S.party=null;const d=DUNGEONS.find(x=>x[0]==="The Deadmines");queueDungeon(d);S.dg.formed=true;const tr=S.queue.find(x=>x.k==="trash");const pf=partyFight(tr);const P=[pf.hero,...pf.m];
    g.target=foeTarget();g.role=heroRole();g.drops=P.map((p,i)=>(i?S.party[i-1].role:heroRole())+":"+p.tl.length);g.aoe=foeEvents(tr).filter(e=>e[2]).length;g.hits=foeEvents(tr).length;
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
  bosslog: `S.queue.length=0;S.task=null;const out=[];for(const [dn,b,w] of [["Molten Core","Ragnaros",false],["Onyxia's Lair","Onyxia",false],["Onyxia's Lair","Onyxia",true],["Naxxramas","Patchwerk",false]]){const d=DUNGEONS.concat(RAIDS).find(x=>x[0]===dn);S.queue.length=0;queueDungeon(d);S.dg.formed=true;const t=S.queue.find(x=>x.k==="boss"&&x.boss===b);t.wipe=w;partyFight(t);const n0=S.log.length?S.log[0].id:0;finish(t);out.push(b+(w?" (wipe)":"")+": "+S.log.filter(l=>l.id>n0).map(l=>l.txt).reverse().join(" / "));}
    document.body.innerHTML="<pre style='color:#fff;font-size:15px;white-space:pre-wrap'>"+out.join(" ## ")+"</pre>";S=null;`,
  aoe: `S.dg=null;S.party=null;S.loc="field";let q=S.quests.find(x=>!questDone(x)&&x.mob)||{id:9999,name:"Test",mob:"Defias Pathstalker",type:"kill",zone:curZone(),prog:0,max:8};if(!S.quests.includes(q))S.quests.push(q);q={...q,type:"kill"};
    const out=[];let t;for(let i=0;i<500;i++){t=killTask(q);if(t.mobs.length===3)break;}const f=foeOf(t);out.push("t="+t.t+" casts="+t.casts.join(","));f.units.forEach(u=>out.push(u.name+" a="+u.a+" b="+u.b+" hp="+u.hp.map(x=>x.toFixed(2)).join(" ")));
    const st={};for(let i=0;i<3000;i++){const t=killTask(q);const n=t.mobs.length;const o=st[n]||(st[n]={n:0,t:0,c:0,aoe:0});o.n++;o.t+=t.t;o.c+=t.casts.length;o.aoe+=t.casts.filter(c=>AOE[c]).length;soloFight(t);}
    for(const k in st){const o=st[k];out.push(k+" mobs: avg t "+Math.round(o.t/o.n)+" casts "+(o.c/o.n).toFixed(1)+" aoe "+(o.aoe/o.n).toFixed(1));}
    const d=DUNGEONS.find(x=>x[0]==="Scarlet Monastery")||DUNGEONS[8];S.queue.length=0;queueDungeon(d);S.dg.formed=true;S.queue.filter(x=>x.k==="trash").slice(0,3).forEach(tr=>{const f=foeOf(tr);out.push("TRASH t="+tr.t+" share="+tr.aoeShare+" n="+tr.mobs.length+" "+tr.casts.join(","));f.units.forEach(u=>out.push(" "+u.name+" b="+u.b+" "+u.hp.map(x=>x.toFixed(2)).join(" ")));});
    document.body.innerHTML="<pre id=o style='color:#fff;font-size:13px;white-space:pre-wrap'>"+out.join(" | ")+"</pre>";S.task={k:"move",d:"x",t:1e9};`,
  econ: `const H=+(window.HOURS||20),m0=S.money,L0=S.level,d0=S.deaths,t0=S.time;const P=S.prof?JSON.stringify(S.prof.sk):"";for(let i=0;i<H*60;i++)advance(60000);
    const wk=(S.time-t0)/(7*86400000);const out={hours:H,level:L0+"->"+S.level,gold:((S.money-m0)/10000).toFixed(0),goldPerWeek:((S.money-m0)/10000/wk).toFixed(0),money:(S.money/10000).toFixed(0),deaths:S.deaths-d0,mount:S.mount,runs:S.runs,prof:S.prof?{p:S.prof.a+"+"+S.prof.b,sk:S.prof.sk,start:P}:null,spend:S.spend||null,gs:gearScore().toFixed(1)};
    document.body.innerHTML="<pre style='color:#fff;font-size:15px;white-space:pre-wrap'>"+JSON.stringify(out)+"</pre>";S=null;`,
  idle: `S.task={k:"move",d:"Heading out",t:20000};`,
  boss: `S.queue.length=0;S.task=null;const d=DUNGEONS.concat(RAIDS).find(x=>x[0]===BOSSDG);queueDungeon(d);S.loc="dungeon";S.dg.formed=true;const i=S.queue.findIndex(x=>x.k==="boss"&&x.boss===BOSSNAME);S.dg.killed=d[6].split(",").indexOf(BOSSNAME);S.task=S.queue[i];S.queue.splice(0,i+1);`,
  trash: `S.queue.length=0;S.task=null;const d=DUNGEONS.concat(RAIDS).find(x=>x[0]===BOSSDG);queueDungeon(d);S.loc="dungeon";S.dg.formed=true;const i=S.queue.findIndex(x=>x.k==="trash");S.task=S.queue[i];S.queue.splice(0,i+1);`,
};
const [kind, dg, boss] = scen.split(":");
const post = `<script>setTimeout(()=>{try{const BOSSDG=${JSON.stringify(dg || "")},BOSSNAME=${JSON.stringify(boss || "")};${process.env.PRE||""};${setups[kind]}S.task.el=S.task.t*${prog};speed=0;dirty=true;}catch(e){document.title="ERR "+e.message;document.body.insertAdjacentHTML("afterbegin","<h1 style=color:red>"+e.stack+"</h1>")}},400);</script>`;
html = html.replace(/<script>\r?\n"use strict";/, m => pre + m).replace("</body>", post + "</body>");
fs.writeFileSync(out, html);
