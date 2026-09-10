/* Adaptive learning layer. Loads after branch-rules-v5.js and before app.js. */
(function(root){
'use strict';
const E=root.Engine,D=root.GAME_DATA,R=root.RobustV4;
if(!E||!D||!R)return;
const API='https://akinator.tomsa-tomsa.workers.dev';
const learned=new Map();
let ready=false,lastLoad=0;
const sign={yes:1,probably_yes:.55,unknown:0,probably_no:-.55,no:-1};
const strength={yes:1,probably_yes:.65,unknown:0,probably_no:.65,no:1};
const canon=R.canon,category=R.category;
const baseRanked=E.ranked;
const baseProbability=E.probability;
function key(personId,trait){return personId+'|'+canon(trait);}
function rowFor(personId,trait){return learned.get(key(personId,trait))||null;}
function learnedP(person,trait){
 const base=baseProbability(person,trait);
 const row=rowFor(person.id,trait);if(!row||row.samples<2)return base;
 const trust=Math.min(.72,(row.samples/(row.samples+7))*.82);
 return Math.max(.02,Math.min(.98,base*(1-trust)+row.probability*trust));
}
E.probability=learnedP;
function evidence(s){
 const out=[],seen=new Set();
 for(const k of s.asked||[]){if(!Object.prototype.hasOwnProperty.call(s.answers||{},k))continue;const c=canon(k);if(seen.has(c))continue;seen.add(c);out.push({key:k,answer:s.answers[k]});}
 for(const [k,a] of Object.entries(s.answers||{})){const c=canon(k);if(seen.has(c))continue;seen.add(c);out.push({key:k,answer:a});}
 return out;
}
function adaptiveBonus(person,s,omit){
 const buckets=new Map();
 for(const e of evidence(s)){
  if(omit&&canon(e.key)===canon(omit))continue;
  const a=e.answer,sg=sign[a]||0;if(!sg)continue;
  const row=rowFor(person.id,e.key);if(!row||row.samples<2)continue;
  const conf=Math.min(1,row.samples/(row.samples+8));
  const contribution=sg*(2*row.probability-1)*conf*1.7*strength[a];
  const g=category(e.key);if(!buckets.has(g))buckets.set(g,[]);buckets.get(g).push(contribution);
 }
 let total=0;
 for(const vals of buckets.values()){
  vals.sort((a,b)=>Math.abs(b)-Math.abs(a));
  let group=0;for(let i=0;i<vals.length;i++)group+=vals[i]/(1+i*.9);
  total+=Math.max(-1.6,Math.min(1.6,group));
 }
 return total;
}
E.ranked=function(s,omit){
 const rows=baseRanked(s,omit).map(r=>({...r}));if(!rows.length)return rows;
 for(const r of rows)r.score+=adaptiveBonus(r.person,s,omit);
 const max=Math.max(...rows.map(r=>r.score));let sum=0;
 for(const r of rows){r.prob=Math.exp(r.score-max);sum+=r.prob;}
 for(const r of rows)r.prob/=sum;
 return rows.sort((a,b)=>b.prob-a.prob||a.person.id-b.person.id);
};
const entropy=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
E.questionUtility=function(s,q,list){
 list=list||E.ranked(s);if(!list.length)return 0;
 const probs=list.map(r=>learnedP(r.person,q.id));
 const mean=probs.reduce((a,p,i)=>a+p*list[i].prob,0);
 const gain=entropy(mean)-probs.reduce((a,p,i)=>a+list[i].prob*entropy(p),0);
 const known=list.reduce((a,r)=>a+r.prob*(E.fact(r.person,q.id)===null?.35:1),0);
 const top=list.slice(0,4);let separation=0;
 if(top.length>1){const tp=top.map(r=>learnedP(r.person,q.id));separation=Math.max(...tp)-Math.min(...tp);}
 return (gain*.82+separation*.18)*(.35+.65*known)*(q.weight||1);
};
async function loadModel(force=false){
 if(!force&&Date.now()-lastLoad<60000)return ready;
 lastLoad=Date.now();
 try{
  const r=await fetch(API+'/api/model',{cache:'no-store'});if(!r.ok)throw Error('model_'+r.status);
  const data=await r.json();learned.clear();
  for(const x of data.rows||[]){if(!Number.isFinite(+x.person_id)||!x.trait_id)continue;learned.set(key(+x.person_id,x.trait_id),{probability:Math.max(0,Math.min(1,+x.probability||0)),samples:+x.samples||0});}
  ready=true;root.dispatchEvent(new CustomEvent('akinator-learning-ready',{detail:{rows:learned.size}}));
 }catch(e){console.warn('Learning model unavailable',e);ready=false;}
 return ready;
}
function serializeAnswers(s){
 const arr=[];for(const [trait_id,answer] of Object.entries(s?.answers||{})){if(sign[answer]===undefined)continue;arr.push({trait_id,answer});}return arr;
}
async function submitConfirmed(person,s){
 if(!person||!s)return false;
 const gameId=s.cloud_game_id||(s.cloud_game_id=crypto.randomUUID());
 const payload={game_id:gameId,person_id:person.id,person_name:person.name,guessed_correctly:true,answers:serializeAnswers(s),rejected_guesses:(s.guesses||[]).slice(0,20)};
 if(!payload.answers.length)return false;
 try{
  const r=await fetch(API+'/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true});
  if(!r.ok)throw Error('learn_'+r.status);await r.json();await loadModel(true);return true;
 }catch(e){console.warn('Learning save failed',e);return false;}
}
root.AkinatorLearning={API,loadModel,submitConfirmed,isReady:()=>ready,modelSize:()=>learned.size};
loadModel();
})(typeof window!=='undefined'?window:globalThis);
