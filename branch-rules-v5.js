/* Question dependencies. Loads after robust-v4.js and before app.js. */
(function(root){
'use strict';
const E=root.Engine,D=root.GAME_DATA;
if(!E||!D||!root.RobustV4)return;
const canon=root.RobustV4.canon;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const yes=a=>a==='yes'||a==='probably_yes';
const definiteNo=a=>a==='no';
const models=['Matiz','Nissan','Priora','Lada','Volvo','Ford','Skoda','Mitsubishi'];
const rawModels=['matiz','nissan','priora','lada','volvo','ford','skoda','mitsubishi'];
const modelKeys=new Set([...models.map(x=>'car:'+x),...rawModels]);
const carDetails=new Set(['car:foreign','car:lada_family','carColor:black','carColor:blue','carColor:cherry','car:color:black','car:color:blue','car:color:cherry','car:brand','car:model',...modelKeys]);
const childDetails=new Set(['has_son','has_daughter','two_daughters','three_sons','grandson','son_and_daughter']);
const spouseDetails=new Set(['spouse_here','spouse_mgmt','both_mgmt_couple','relation:spouse','relation:boss_spouse','relation:chief_spouse','relation:deputy_spouse','family:andreev','family:tishchenko','family:sayibov']);
const families={gender:['gender:male','gender:female'],primary:['management','assembly','receiving','placement','shipping','defect','marketplace','leroy'].map(x=>'primary:'+x),role:['chief','deputy','deputy2','leroy_boss','marketplace_lead'].map(x=>'role:'+x)};
function response(s,k){
 const a=s.answers||{};let result;
 for(const id of s.asked||[])if(own(a,id)&&canon(id)===canon(k))result=a[id];
 if(result!==undefined)return result;
 for(const id of Object.keys(a))if(canon(id)===canon(k))result=a[id];
 return result;
}
function isCarDetail(k){return carDetails.has(k)||(k.startsWith('car:')&&!['car:owned','car:former'].includes(k))||k.startsWith('carColor:')||modelKeys.has(k);}
function isModel(k){return modelKeys.has(k);}
function isChildDetail(k){return childDetails.has(k);}
function isSpouseDetail(k){return spouseDetails.has(k);}
function carAnswered(s){return response(s,'has_car');}
function answered(s,k){return response(s,k)!==undefined;}
function implied(s,k){
 if(k==='appearance:light')return true;
 const gray=response(s,'hair:gray');
 if(gray!==undefined&&['gray_hair','graying','appearance:gray'].includes(k))return true;
 const loss=response(s,'hair:loss');
 if(loss!==undefined&&['bald','balding','appearance:hair_loss'].includes(k))return true;
 for(const group of Object.values(families)){
  if(group.includes(k)&&group.some(x=>x!==k&&yes(response(s,x))))return true;
 }
 if(yes(response(s,'has_son'))&&k==='has_kids')return true;
 if(yes(response(s,'has_daughter'))&&k==='has_kids')return true;
 if(yes(response(s,'three_sons'))&&['has_kids','has_son'].includes(k))return true;
 if(yes(response(s,'two_daughters'))&&['has_kids','has_daughter'].includes(k))return true;
 if(yes(response(s,'spouse_here'))&&k==='married')return true;
 if(yes(response(s,'has_car'))&&k==='car:owned')return true;
 return false;
}
function eligible(s,q,options){
 const k=canon(q.id),review=!!options?.review;
 if(!review&&answered(s,k))return false;
 if(!review&&implied(s,k))return false;
 if(isCarDetail(k)){
  const parent=carAnswered(s);
  // A negative or unknown parent closes the entire current-car detail branch.
  // The parent itself remains reviewable if later evidence suggests a mistake.
  if(!yes(parent))return false;
  if(!review&&isModel(k)&&options?.allowModel!==true)return false;
  if(!review&&isModel(k)&&(s.asked||[]).some(x=>isModel(canon(x))))return false;
  if(!review&&k.startsWith('carColor:')&&options?.allowModel!==true)return false;
  if(!review&&k==='car:foreign'&&yes(response(s,'car:lada_family')))return false;
  if(!review&&k==='car:lada_family'&&yes(response(s,'car:foreign')))return false;
 }
 if(isChildDetail(k)&&!yes(response(s,'has_kids')))return false;
 if(isSpouseDetail(k)&&(definiteNo(response(s,'married'))||yes(response(s,'unmarried'))||yes(response(s,'divorced'))))return false;
 // These are question-flow rules only; the probabilistic engine keeps all candidates.
 return true;
}
function narrow(list){
 if(!list.length)return false;
 const top=list[0].prob;
 const plausible=list.filter(x=>x.prob>=Math.max(.06,top*.2));
 return plausible.length<=3&&(top>=.55||list.length<=3);
}
function pickReview(s){
 if((s.asked||[]).length<5)return null;
 const list=E.ranked(s);if(!list.length)return null;
 const top=list[0],second=list[1];
 if(top.matched<3||top.score-(second?.score??-100)<2.4)return null;
 if(Object.keys(s.reviewed||{}).length>=4)return null;
 return(E.reviewCandidates?.(s)||[]).find(r=>{
  if(s.reviewed?.[canon(r.key)])return false;
  const q=E.questionById(r.key);return q&&eligible(s,q,{review:true});
 })||null;
}
E.pickReview=pickReview;
E.pickQuestion=function(s){
 if(s.questionCount>=30)return null;
 const list=E.ranked(s);if(!list.length)return null;
 const review=pickReview(s);
 if(review){const q=E.questionById(review.key);s.pendingReview=review.key;return{...q,text:'Уточню предыдущий ответ. '+q.text};}
 s.pendingReview=null;
 const allowModel=narrow(list);
 const usedCarModel=(s.asked||[]).some(k=>isModel(canon(k)));
 let best=null,bestU=0;
 for(const q of D.questions){
  if(!eligible(s,q,{allowModel:allowModel&&!usedCarModel}))continue;
  const u=E.questionUtility(s,q,list);
  // Specific car details are a last-stage discriminator, not a brand checklist.
  const adjusted=isCarDetail(canon(q.id))?u*.55:u;
  if(adjusted>bestU+1e-9){best=q;bestU=adjusted;}
 }
 return bestU>=.003?best:null;
};
E.shouldGuess=function(s){
 const list=E.ranked(s);if(!list.length)return false;
 if(list.length===1)return true;
 const top=list[0],second=list[1];
 if(s.questionCount<5||top.matched<3||top.prob<.93||top.score-second.score<2.4)return false;
 return !pickReview(s);
};
E.branchEligible=eligible;
root.BranchRulesV5={canon,response,eligible,isCarDetail,isModel,pickReview};
})(typeof window!=='undefined'?window:globalThis);
