(function(root){
'use strict';
const D=root.GAME_DATA;
const G={
 gender:['male','female'],primary:['management','assembly','receiving','placement','shipping','defect','marketplace','leroy'],
 role:['chief','deputy','deputy2','leroy_boss','marketplace_lead'],height:['tall','above','average','below','short'],body:['athletic','thin','full','average'],
 hairStyle:['short','curly'],car:['Matiz','Nissan','Priora','Lada','Volvo','Ford','Skoda','Mitsubishi'],carColor:['black','blue','cherry'],nickname:['Псих','Волк']
};
const ALIASES={
 'car:owned':'has_car','car:former':'sold_car','car:lada_family':'priora','work:only_placement':'placement_only',
 'work:leroy_regular':'leroy','work:marketplace_regular':'ozon','work:forklift_parttime':'forklift_job','work:former_placement':'placement',
 'work:returned':'returned','story:returned':'returned','work:best_or_fast':'best_picker',
 'work:management':'management','hobby:football':'footballer','hobby:football_bets':'bets','hobby:spartak':'spartak',
 'hobby:video_games':'games','hobby:rap':'rap','hobby:detailing':'detailing','hobby:scooter':'scooter','hobby:moonshine':'moonshine',
 'story:sheremetyevo':'sheremetyevo','story:fight':'fight','story:ambassador':'ambassador',
 'story:psih':'nick_psih','story:volk':'nick_volk','appearance:hair_loss':'balding','appearance:gray':'graying',
 'appearance:dark':'dark_hair','appearance:short_hair':'short_cut','relation:spouse':'spouse_here',
 'relation:boss_spouse':'spouse_mgmt','relation:cousin':'cousin_here'
};
const EPS=1e-12;
const EQUIV={
 'car:owned':'has_car','car:former':'sold_car','work:only_placement':'placement_only','work:returned':'returned','story:returned':'returned',
 'work:forklift_parttime':'forklift_job','hobby:football':'footballer','hobby:football_bets':'bets','hobby:spartak':'spartak','hobby:video_games':'games','hobby:rap':'rap','hobby:detailing':'detailing','hobby:scooter':'scooter','hobby:moonshine':'moonshine','story:sheremetyevo':'sheremetyevo','story:fight':'fight','story:psih':'nick_psih','story:volk':'nick_volk','appearance:dark':'dark_hair','appearance:short_hair':'short_cut','relation:spouse':'spouse_here','relation:boss_spouse':'spouse_mgmt','relation:cousin':'cousin_here'
};
const canonical=k=>EQUIV[k]||k;
function blocked(s,q){
 const a=s.answers,k=q.id;
 if(Object.keys(a).some(x=>canonical(x)===canonical(k)))return true;
 if(a.has_kids==='no'&&['has_son','has_daughter','two_daughters','three_sons','grandson'].includes(k))return true;
 if(a.has_car==='no'&&(k.startsWith('car:')&&!['car:former','car:owned'].includes(k)||G.car.some(c=>c.toLowerCase()===k)))return true;
 if(a.married==='no'&&['spouse_here','spouse_mgmt','both_mgmt_couple','relation:spouse','relation:boss_spouse','relation:chief_spouse','relation:deputy_spouse'].includes(k))return true;
 const parts=k.split(':');if(parts.length===2&&['primary','role','gender'].includes(parts[0])){const prefix=parts[0]+':';if(Object.keys(a).some(x=>x.startsWith(prefix)&&a[x]==='yes'))return true;}
 return false;
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function raw(p,key){return Object.prototype.hasOwnProperty.call(p.f,key)?p.f[key]:null;}
function fact(p,key){
 let v=raw(p,key);if(v!==null&&v!==undefined)return v;
 if(key.startsWith('skills:')){const skill=key.slice(7);return p.f['primary:'+skill]===true?true:null;}
 if(key==='car:foreign'){const car=G.car.find(c=>raw(p,'car:'+c)===true);return car? !['Lada','Priora'].includes(car):null;}
 if(key==='car:lada_family'){const car=G.car.find(c=>raw(p,'car:'+c)===true);return car?['Lada','Priora'].includes(car):null;}
 if(key==='car:owned')return raw(p,'has_car');
 if(key==='car:former')return raw(p,'sold_car');
 if(key==='work:best_or_fast')return raw(p,'best_picker')===true||raw(p,'fast_picker')===true?true:null;
 if(key==='work:management')return raw(p,'management')===true||raw(p,'leroy_boss')===true||raw(p,'marketplace_lead')===true?true:null;
 if(key==='work:former_placement')return p.id===5?true:null;
 if(key==='appearance:hair_loss')return raw(p,'bald')===true||raw(p,'balding')===true?true:null;
 if(key==='appearance:gray')return raw(p,'gray_hair')===true||raw(p,'graying')===true?true:null;
 if(key==='appearance:light')return ['blonde','gray_hair','graying'].some(k=>raw(p,k)===true)?true:null;
 if(key==='appearance:slim')return raw(p,'athletic')===true||raw(p,'thin')===true?true:null;
 if(key==='appearance:average_or_tall')return ['tall','above_avg','avg_height'].some(k=>raw(p,k)===true)?true:null;
 if(key==='appearance:below_or_short')return raw(p,'short')===true||raw(p,'below_avg')===true?true:null;
 if(key==='has_kids'&&raw(p,'has_kids')===null&&['has_son','has_daughter'].some(k=>raw(p,k)===true))return true;
 if(key==='has_son'&&raw(p,'three_sons')===true)return true;
 if(key==='has_daughter'&&raw(p,'two_daughters')===true)return true;
 if(key==='unmarried'&&raw(p,'divorced')===true)return true;
 if(key==='married'&&raw(p,'divorced')===true)return false;
 if(key==='spouse_here'&&raw(p,'unmarried')===true)return false;
 if(key==='has_car'&&raw(p,'sold_car')===true)return false;
 if(key==='work:only_placement'&&raw(p,'placement_only')===true)return true;
 if(key==='work:returned'||key==='story:returned')return raw(p,'returned');
 if(key==='work:forklift_parttime')return p.id===33?true:null;
 if(key==='relation:father')return p.id===21?true:null;
 if(key==='relation:son')return p.id===22?true:null;
 if(key==='relation:mother')return p.id===36?true:null;
 if(key==='relation:chief_spouse')return p.id===32?true:p.id===39?false:null;
 if(key==='relation:deputy_spouse')return p.id===2?true:null;
 if(key==='relation:boss_spouse')return raw(p,'spouse_mgmt')===true||raw(p,'both_mgmt_couple')===true?true:null;
 if(key.startsWith('primary:')&&raw(p,'primary:'+key.slice(8))===null)return null;
 if(ALIASES[key])return raw(p,ALIASES[key]);
 return null;
}
function probability(p,key){const v=fact(p,key);return v===true?.985:v===false?.015:.5;}
function likelihood(value,answer){
 const reliability={yes:.985,no:.985,probably_yes:.76,probably_no:.76,unknown:.5}[answer];
 if(reliability===undefined)return 1;
 if(answer==='unknown')return 1;
 const yes=answer==='yes'||answer==='probably_yes';
 return yes?(value*reliability+(1-value)*(1-reliability)):(value*(1-reliability)+(1-value)*reliability);
}
function createSession(){return{asked:[],answers:{},excluded:{},questionCount:0,guesses:[],revision:0};}
function ranked(s){
 const live=D.people.filter(p=>!s.excluded[p.id]);if(!live.length)return[];
 const scores=live.map(p=>{
  let score=0;
  for(const [key,answer] of Object.entries(s.answers))score+=Math.log(Math.max(EPS,likelihood(probability(p,key),answer)));
  return{person:p,score};
 });
 const max=Math.max(...scores.map(x=>x.score));let sum=0;
 for(const x of scores){x.prob=Math.exp(x.score-max);sum+=x.prob;}
 for(const x of scores)x.prob/=sum;
 return scores.sort((a,b)=>b.prob-a.prob||a.person.id-b.person.id);
}
function remaining(s){return ranked(s).map(x=>x.person);}
function entropy(p){return p<=EPS||p>=1-EPS?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);}
function questionUtility(s,q,list){
 const weights=list.map(x=>x.prob),values=list.map(x=>probability(x.person,q.id));
 const mean=values.reduce((a,v,i)=>a+v*weights[i],0);
 const gain=entropy(mean)-values.reduce((a,v,i)=>a+weights[i]*entropy(v),0);
 const coverage=values.reduce((a,v,i)=>a+weights[i]*(fact(list[i].person,q.id)!==null?1:0),0);
 const top=list[0],second=list[1];
 let discriminator=0;
 if(top&&second){const a=fact(top.person,q.id),b=fact(second.person,q.id);if(a!==null&&b!==null&&a!==b)discriminator=.18;}
 // An unknown-heavy question should not outrank a useful, well-supported distinction.
 return(gain+discriminator)*(.45+.55*coverage)*(q.weight||1);
}
function pickQuestion(s){
 const list=ranked(s);if(!list.length)return null;
 if(s.questionCount>=30)return null;
 const available=D.questions.filter(q=>!blocked(s,q));
 let best=null,bestU=0;
 for(const q of available){const u=questionUtility(s,q,list);if(u>bestU+1e-8){bestU=u;best=q;}}
 if(best&&bestU>=(s.questionCount>=15?.012:.003))return best;
 // If all known facts have been exhausted, ask an exact clarification rather than inventing a feature.
 return null;
}
function applyAnswer(s,qid,answer){
 if(!['yes','no','unknown','probably_yes','probably_no'].includes(answer))throw Error('Unknown answer');
 s.answers[qid]=answer;if(!s.asked.includes(qid))s.asked.push(qid);
 s.questionCount=s.asked.length;s.revision++;
}
function undo(s){const q=s.asked.pop();if(q!==undefined){delete s.answers[q];s.questionCount=s.asked.length;s.revision++;return true;}return false;}
function shouldGuess(s){
 const list=ranked(s);if(!list.length)return false;
 if(list.length===1)return true;
 const top=list[0];if(s.questionCount<5||top.prob<.965)return false;
 // Require multiple independently supported facts; confidence alone is insufficient.
 const positives=Object.entries(s.answers).filter(([k,a])=>a==='yes'&&fact(top.person,k)===true);
 const groups=new Set(positives.map(([k])=>k.split(':')[0]));
 return positives.length>=3&&groups.size>=2;
}
function topGuess(s){return ranked(s)[0]?.person||null;}
function rejectGuess(s,id){s.excluded[id]=true;s.guesses.push(id);s.revision++;}
function conflicts(s){
 const list=ranked(s);const top=list[0];if(!top)return[];
 return Object.entries(s.answers).filter(([k,a])=>['yes','no'].includes(a)&&fact(top.person,k)!==null&&((a==='yes')!==fact(top.person,k))).map(([k])=>k);
}
function diagnostic(s){const list=ranked(s);return{candidates:list.length,confidence:list[0]?.prob||0,conflicts:conflicts(s),exhausted:!pickQuestion(s)};}
function questionById(id){return D.questions.find(q=>q.id===id);}
function clarification(s){
 const list=ranked(s);if(!list.length)return null;
 const candidates=list;
 // Ask a precise, factual identity check only after ordinary discriminating questions are exhausted.
 return candidates.map(x=>({id:x.person.id,name:x.person.name}));
}
root.Engine={createSession,ranked,remaining,pickQuestion,applyAnswer,undo,shouldGuess,topGuess,rejectGuess,conflicts,diagnostic,questionById,clarification,fact,probability,questionUtility};
if(typeof module!=='undefined')module.exports=root.Engine;
})(typeof window!=='undefined'?window:globalThis);
