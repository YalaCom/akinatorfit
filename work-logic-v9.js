/* Strict work-branch logic. Loads after branch-rules-v5.js and before app.js. */
(function(root){
'use strict';
const E=root.Engine,D=root.GAME_DATA,B=root.BranchRulesV5;
if(!E||!D||!B)return;
const canon=B.canon,response=B.response;
const yes=a=>a==='yes'||a==='probably_yes';
const no=a=>a==='no'||a==='probably_no';

// Correct/strengthen Ruslan Serov's confirmed work profile.
const ruslan=D.people.find(p=>p.id===29||p.name==='Серов Руслан');
if(ruslan){
  ruslan.f=ruslan.f||{};
  ruslan.f.placement=true;
  ruslan.f.placement_only=true;
  ruslan.f.onlyPlacement=true;
  ruslan.f['work:only_placement']=true;
  ruslan.f['work:two_departments']=false;
  ruslan.f['work:three_departments']=false;
  ruslan.f['work:receiving_and_placement']=false;
  ruslan.f['work:assembly_and_receiving']=false;
  ruslan.f['work:assembly_and_placement']=false;
  ruslan.f['work:marketplace_and_leroy']=false;
}

const incompatibleWithOnlyPlacement=new Set([
  'work:two_departments','work:three_departments',
  'work:receiving_and_placement','work:assembly_and_receiving',
  'work:assembly_and_placement','work:marketplace_and_leroy',
  'skills:receiving','skills:assembly','skills:defect','skills:marketplace','skills:leroy',
  'primary:receiving','primary:assembly','primary:shipping','primary:defect','primary:marketplace','primary:leroy',
  'receiving','assembly','shipping','defect','ozon','leroy'
]);
const onlyPlacementKeys=['work:only_placement','placement_only','onlyPlacement'];
function onlyPlacementAnswer(s){
  for(const k of onlyPlacementKeys){const a=response(s,k);if(a!==undefined)return a;}
  return undefined;
}
function placementConfirmed(s){
  return yes(response(s,'primary:placement'))||yes(response(s,'placement'))||yes(response(s,'skills:placement'));
}

const oldEligible=E.branchEligible||B.eligible;
function eligible(s,q,options){
  if(!oldEligible(s,q,options))return false;
  const k=canon(q.id);
  const only=onlyPlacementAnswer(s);
  if(yes(only)){
    if(incompatibleWithOnlyPlacement.has(k))return false;
    // Once "only placement" is confirmed, do not waste questions proving placement again.
    if(['primary:placement','skills:placement','placement'].includes(k))return false;
  }
  // If user already explicitly denied only-placement, don't ask its aliases again.
  if(no(only)&&onlyPlacementKeys.some(x=>canon(x)===k))return false;
  return true;
}
E.branchEligible=eligible;

const oldPick=E.pickQuestion;
E.pickQuestion=function(s){
  if(s.questionCount>=30)return null;
  const list=E.ranked(s);if(!list.length)return null;
  const review=E.pickReview?.(s);
  if(review){const q=E.questionById(review.key);if(q&&eligible(s,q,{review:true})){s.pendingReview=review.key;return{...q,text:'Уточню предыдущий ответ. '+q.text};}}
  s.pendingReview=null;
  const top=list[0]?.prob||0;
  const plausible=list.filter(x=>x.prob>=Math.max(.06,top*.2));
  const narrow=plausible.length<=3&&(top>=.55||list.length<=3);
  let best=null,bestU=0;
  for(const q of D.questions){
    if(!eligible(s,q,{allowModel:narrow}))continue;
    let u=E.questionUtility(s,q,list);
    const k=canon(q.id);
    // Prefer personal discriminators once a strict work branch is known.
    if(yes(onlyPlacementAnswer(s))){
      if(k.startsWith('work:')||k.startsWith('primary:')||k.startsWith('skills:'))u*=.08;
      else u*=1.18;
    }
    if(u>bestU+1e-9){best=q;bestU=u;}
  }
  return bestU>=.003?best:null;
};

// A strict work answer is high-value evidence; permit an earlier guess when it clearly isolates a person.
const oldShouldGuess=E.shouldGuess;
E.shouldGuess=function(s){
  const list=E.ranked(s);if(!list.length)return false;
  if(list.length===1)return true;
  const top=list[0],second=list[1];
  if(yes(onlyPlacementAnswer(s))&&placementConfirmed(s)&&s.questionCount>=4&&top.prob>=.84&&(top.score-(second?.score??-100))>=1.7)return true;
  return oldShouldGuess(s);
};

root.WorkLogicV9={eligible,onlyPlacementAnswer};
})(typeof window!=='undefined'?window:globalThis);
