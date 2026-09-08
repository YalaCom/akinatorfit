/* Error-tolerant inference. Loads after semantic-fix.js, before app.js. */
(function(root){
'use strict';
const E=root.Engine,D=root.GAME_DATA;
if(!E||!D)return;
const previousFact=E.fact;
const alias={
 'appearance:gray':'hair:gray',gray_hair:'hair:gray',graying:'hair:gray',
 'appearance:hair_loss':'hair:loss',bald:'hair:loss',balding:'hair:loss',
 'appearance:dark':'dark_hair','appearance:short_hair':'short_cut',
 'car:owned':'has_car','car:former':'sold_car','work:returned':'returned','story:returned':'returned',
 'work:only_placement':'placement_only','work:forklift_parttime':'forklift_job',
 'hobby:football':'footballer','hobby:football_bets':'bets','hobby:spartak':'spartak',
 'hobby:video_games':'games','hobby:rap':'rap','hobby:detailing':'detailing','hobby:scooter':'scooter','hobby:moonshine':'moonshine',
 'story:sheremetyevo':'sheremetyevo','story:fight':'fight','relation:fight':'fight',
 'story:ambassador':'ambassador','story:psih':'nick_psih','story:volk':'nick_volk',
 'relation:spouse':'spouse_here','relation:boss_spouse':'spouse_mgmt','relation:cousin':'cousin_here',
 'work:leroy_regular':'leroy','work:marketplace_regular':'ozon'
};
const canon=k=>alias[k]||k;
const category=k=>{
 k=canon(k);
 if(/^(has_kids|has_son|has_daughter|two_daughters|three_sons|grandson)$/.test(k))return'children';
 if(/^(married|unmarried|divorced|spouse_here|spouse_mgmt|both_mgmt_couple)$/.test(k)||k.startsWith('family:')||k.startsWith('relation:'))return'family';
 if(k.startsWith('hair:')||/^(blonde|dark_hair|red_hair|short_cut|curly|dyed_hair)$/.test(k)||k.startsWith('appearance:'))return'hair';
 if(k==='has_car'||k==='sold_car'||k.startsWith('car:'))return'car';
 if(k.startsWith('primary:')||k.startsWith('skills:')||k.startsWith('work:')||['assembly','receiving','placement','shipping','defect','ozon','leroy'].includes(k))return'work';
 if(k.startsWith('role:')||k==='management')return'role';
 if(k.startsWith('height:')||/^(tall|above_avg|avg_height|below_avg|short)$/.test(k))return'height';
 if(k.startsWith('body:')||/^(athletic|thin|full)$/.test(k))return'body';
 if(k.startsWith('gender:'))return'gender';
 return k.split(':')[0];
};
const answers=['yes','no','probably_yes','probably_no','unknown'];
const strength={yes:1,no:1,probably_yes:.48,probably_no:.48,unknown:0};
const positive=a=>a==='yes'||a==='probably_yes';
const isKnown=v=>v===true||v===false;
function fact(p,k){
 const f=p.f||{};
 if(canon(k)==='hair:gray')return f.gray_hair===true||f.graying===true?true:f.gray_hair===false&&f.graying===false?false:null;
 if(canon(k)==='hair:loss')return f.bald===true||f.balding===true?true:f.bald===false&&f.balding===false?false:null;
 if(k==='appearance:light')return f.blonde===true||f.gray_hair===true||f.graying===true?true:null;
 const v=previousFact(p,k);if(isKnown(v))return v;
 if(canon(k)!==k){const w=previousFact(p,canon(k));if(isKnown(w))return w;}
 return null;
}
E.fact=fact;
function probability(p,k){const v=fact(p,k);return v===true?.965:v===false?.035:.5;}
E.probability=probability;
function evidence(s){
 const map=new Map();
 for(const k of s.asked||[]){if(Object.prototype.hasOwnProperty.call(s.answers,k))map.set(canon(k),{key:k,answer:s.answers[k]});}
 for(const [k,a] of Object.entries(s.answers||{}))if(!map.has(canon(k)))map.set(canon(k),{key:k,answer:a});
 return [...map.values()];
}
function independentScore(p,items){
 const buckets=new Map();
 for(const e of items){
  const a=e.answer;if(!strength[a])continue;
  const v=fact(p,e.key);if(!isKnown(v))continue;
  const contribution=(v===positive(a)?1:-1)*strength[a];
  const group=category(e.key);
  if(!buckets.has(group))buckets.set(group,[]);
  buckets.get(group).push(contribution);
 }
 let score=0,matched=0,conflicted=0;
 for(const values of buckets.values()){
  values.sort((a,b)=>Math.abs(b)-Math.abs(a));
  let total=0;
  for(let i=0;i<values.length;i++)total+=values[i]/(1+i*.9);
  score+=Math.max(-2.1,Math.min(2.1,total));
  if(total>0)matched++;else if(total<0)conflicted++;
 }
 return{score,matched,conflicted};
}
function ranked(s,omit){
 const live=D.people.filter(p=>!s.excluded?.[p.id]);if(!live.length)return[];
 const items=evidence(s).filter(e=>!omit||canon(e.key)!==canon(omit));
 const rows=live.map(person=>{const r=independentScore(person,items);return{person,score:r.score*1.6,matched:r.matched,conflicted:r.conflicted};});
 const max=Math.max(...rows.map(r=>r.score));let sum=0;
 for(const r of rows){r.prob=Math.exp(r.score-max);sum+=r.prob;}
 for(const r of rows)r.prob/=sum;
 return rows.sort((a,b)=>b.prob-a.prob||a.person.id-b.person.id);
}
E.ranked=ranked;E.remaining=s=>ranked(s).map(r=>r.person);E.topGuess=s=>ranked(s)[0]?.person||null;
function conflicts(s){
 const top=ranked(s)[0];if(!top)return[];
 return evidence(s).filter(e=>strength[e.answer]&&isKnown(fact(top.person,e.key))&&fact(top.person,e.key)!==positive(e.answer)).map(e=>e.key);
}
E.conflicts=conflicts;
const entropy=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
function utility(s,q,list){
 const values=list.map(r=>probability(r.person,q.id));
 const mean=values.reduce((a,v,i)=>a+v*list[i].prob,0);
 const gain=entropy(mean)-values.reduce((a,v,i)=>a+list[i].prob*entropy(v),0);
 const coverage=list.reduce((a,r)=>a+r.prob*(isKnown(fact(r.person,q.id))?1:0),0);
 return gain*(.35+.65*coverage)*(q.weight||1);
}
E.questionUtility=utility;
function questionById(k){return D.questions.find(q=>q.id===k||canon(q.id)===canon(k));}
E.questionById=questionById;
function reviewCandidates(s){
 const list=ranked(s);if(!list.length)return[];
 const top=list[0];
 return evidence(s).filter(e=>strength[e.answer]&&isKnown(fact(top.person,e.key))&&fact(top.person,e.key)!==positive(e.answer)).map(e=>{
  const without=ranked(s,e.key),leader=without[0];
  const other=without.find(r=>r.person.id!==top.person.id);
  return{key:e.key,answer:e.answer,text:questionById(e.key)?.text||e.key,
   priority:(leader?.person.id===top.person.id?2:0)+(without.find(r=>r.person.id===top.person.id)?.prob||0)-(other?.prob||0)};
 }).sort((a,b)=>b.priority-a.priority);
}
E.reviewCandidates=reviewCandidates;
function reviewed(s,k){return !!s.reviewed?.[canon(k)];}
function pickReview(s){
 if((s.asked||[]).length<5)return null;
 const list=ranked(s);if(!list.length)return null;
 const top=list[0],second=list[1];
 if(top.matched<3||top.score-(second?.score??-100)<2.4)return null;
 if(Object.keys(s.reviewed||{}).length>=4)return null;
 return reviewCandidates(s).find(e=>!reviewed(s,e.key))||null;
}
E.pickReview=pickReview;
function pickQuestion(s){
 if(s.questionCount>=30)return null;
 const list=ranked(s);if(!list.length)return null;
 const review=pickReview(s);
 if(review){const q=questionById(review.key);if(q){s.pendingReview=review.key;return{...q,text:'Уточню предыдущий ответ. '+q.text};}}
 s.pendingReview=null;
 const used=new Set(evidence(s).map(e=>canon(e.key)));
 const consequences=E.semanticConsequences?.(s);
 const blocked=consequences?new Set([...consequences.yes,...consequences.no]):new Set();
 let best=null,bestU=0;
 for(const q of D.questions){
  const k=canon(q.id);if(used.has(k)||blocked.has(k)||q.id==='appearance:light')continue;
  const u=utility(s,q,list);if(u>bestU+1e-9){best=q;bestU=u;}
 }
 return bestU>=.003?best:null;
}
E.pickQuestion=pickQuestion;
E.shouldGuess=function(s){
 const list=ranked(s);if(!list.length)return false;if(list.length===1)return true;
 const top=list[0],second=list[1];
 if(s.questionCount<5||top.matched<3||top.prob<.93||top.score-second.score<2.4)return false;
 if(pickReview(s))return false;
 if(top.conflicted>1&&pickReview(s))return false;
 return true;
};
const oldCreate=E.createSession;
E.createSession=function(){return{...oldCreate(),reviewed:{},history:[],questionCount:0};};
E.applyAnswer=function(s,k,a){
 if(s.pendingReview&&canon(s.pendingReview)===canon(k)){s.pendingReview=null;return E.reviseAnswer(s,k,a);}
 if(!answers.includes(a))throw Error('Unknown answer');
 s.history=s.history||[];s.reviewed=s.reviewed||{};
 s.history.push({answers:{...s.answers},asked:[...s.asked],reviewed:{...s.reviewed},pendingReview:s.pendingReview||null});
 s.answers[k]=a;if(!s.asked.includes(k))s.asked.push(k);
 s.questionCount=s.asked.length;s.revision=(s.revision||0)+1;
};
E.reviseAnswer=function(s,k,a){
 if(!answers.includes(a))throw Error('Unknown answer');
 s.history=s.history||[];s.reviewed=s.reviewed||{};
 s.history.push({answers:{...s.answers},asked:[...s.asked],reviewed:{...s.reviewed},pendingReview:s.pendingReview||null});
 const keys=Object.keys(s.answers).filter(x=>canon(x)===canon(k));
 for(const x of keys)delete s.answers[x];
 s.answers[k]=a;if(!s.asked.includes(k))s.asked.push(k);
 s.reviewed[canon(k)]=true;s.pendingReview=null;s.questionCount=s.asked.length;s.revision=(s.revision||0)+1;
};
E.undo=function(s){
 const h=s.history?.pop();if(!h)return false;
 s.answers=h.answers;s.asked=h.asked;s.reviewed=h.reviewed||{};s.pendingReview=h.pendingReview||null;
 s.questionCount=s.asked.length;s.revision=(s.revision||0)+1;return true;
};
E.rejectGuess=function(s,id){s.excluded[id]=true;(s.guesses||(s.guesses=[])).push(id);s.revision=(s.revision||0)+1;};
E.diagnostic=s=>({candidates:ranked(s).length,confidence:ranked(s)[0]?.prob||0,conflicts:conflicts(s),exhausted:!pickQuestion(s),review:pickReview(s)});
root.RobustV4={canon,category,independentScore};
})(typeof window!=='undefined'?window:globalThis);
