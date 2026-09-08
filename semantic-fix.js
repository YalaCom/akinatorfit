(function(root){
'use strict';
const D=root.GAME_DATA,E=root.Engine,originalFact=E.fact;
const equivalents={
 'appearance:gray':'hair:gray','gray_hair':'hair:gray','graying':'hair:gray',
 'appearance:hair_loss':'hair:loss','bald':'hair:loss','balding':'hair:loss',
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
const canon=k=>equivalents[k]||k;
D.questions=D.questions.filter(q=>q.id!=='appearance:light'&&!/^Светлые или седые волосы\??$/i.test(q.text));
D.questions.sort((a,b)=>(a.id==='appearance:gray'||a.id==='appearance:hair_loss'?-1:0)-(b.id==='appearance:gray'||b.id==='appearance:hair_loss'?-1:0));
const seen=new Set();
D.questions=D.questions.filter(q=>{const c=canon(q.id);if(seen.has(c))return false;seen.add(c);return true;});
function fact(p,k){
 const f=p.f||{},v=originalFact(p,k);
 if(k==='hair:gray'||canon(k)==='hair:gray')return f.gray_hair===true||f.graying===true?true:f.gray_hair===false&&f.graying===false?false:null;
 if(k==='hair:loss'||canon(k)==='hair:loss')return f.bald===true||f.balding===true?true:f.bald===false&&f.balding===false?false:null;
 if(k==='appearance:light')return f.blonde===true||f.gray_hair===true||f.graying===true?true:null;
 if(k==='relation:father')return p.id===21?true:null;
 if(k==='relation:son')return p.id===22?true:null;
 if(k==='relation:mother')return p.id===36?true:null;
 if(k==='relation:chief_spouse')return p.id===32?true:p.id===39?false:null;
 if(k==='relation:deputy_spouse')return p.id===2?true:null;
 if(k==='car:lada_family')return f.lada===true||f.priora===true?true:f['car:foreign']===true?false:null;
 if(v!==null&&v!==undefined)return v;
 if(k.startsWith('primary:')&&f[k]!==undefined)return f[k];
 if(k.startsWith('skills:'))return f['primary:'+k.slice(7)]===true?true:f[k]===true?true:null;
 if(canon(k)!==k){const w=originalFact(p,canon(k));if(w!==null&&w!==undefined)return w;}
 return null;
}
E.fact=fact;
const probability=(p,k)=>{const v=fact(p,k);return v===true?.985:v===false?.015:.5;};
E.probability=probability;
const reliability={yes:.985,no:.985,probably_yes:.76,probably_no:.76,unknown:.5};
function likelihood(p,a){if(a==='unknown')return 1;const r=reliability[a],positive=a==='yes'||a==='probably_yes';return positive?p*r+(1-p)*(1-r):p*(1-r)+(1-p)*r;}
function evidence(s){const map=new Map();for(const [k,a] of Object.entries(s.answers))map.set(canon(k),a);return map;}
function ranked(s){const live=D.people.filter(p=>!s.excluded[p.id]);if(!live.length)return[];const a=evidence(s);const rows=live.map(person=>{let score=0;for(const [k,v] of a)score+=Math.log(Math.max(1e-12,likelihood(probability(person,k),v)));return{person,score};});const m=Math.max(...rows.map(x=>x.score));let sum=0;for(const x of rows){x.prob=Math.exp(x.score-m);sum+=x.prob;}for(const x of rows)x.prob/=sum;return rows.sort((a,b)=>b.prob-a.prob||a.person.id-b.person.id);}
E.ranked=ranked;E.remaining=s=>ranked(s).map(x=>x.person);E.topGuess=s=>ranked(s)[0]?.person||null;
const groups={gender:['gender:male','gender:female'],primary:['management','assembly','receiving','placement','shipping','defect','marketplace','leroy'].map(x=>'primary:'+x),role:['chief','deputy','deputy2','leroy_boss','marketplace_lead'].map(x=>'role:'+x),height:['tall','above','average','below','short'].map(x=>'height:'+x),car:['Matiz','Nissan','Priora','Lada','Volvo','Ford','Skoda','Mitsubishi'].map(x=>'car:'+x)};
const implications={
 'hair:gray':['appearance:light'],
 'primary:assembly':['assembly','skills:assembly'], 'primary:receiving':['receiving','skills:receiving'],
 'primary:placement':['placement','skills:placement'],'primary:shipping':['shipping'],
 'primary:defect':['defect','skills:defect'],'primary:marketplace':['ozon','skills:marketplace'],
 'primary:leroy':['leroy','skills:leroy'], 'primary:management':['management'],
 'has_son':['has_kids'],'has_daughter':['has_kids'],'two_daughters':['has_daughter','has_kids'],
 'three_sons':['has_son','has_kids'],'grandson':['has_kids'],
 'car:Volvo':['has_car','car:foreign'],'car:Nissan':['has_car','car:foreign'],
 'car:Ford':['has_car','car:foreign'],'car:Skoda':['has_car','car:foreign'],
 'car:Mitsubishi':['has_car','car:foreign'],'car:Matiz':['has_car','car:foreign'],
 'car:Lada':['has_car','car:lada_family'],'car:Priora':['has_car','car:lada_family'],
 'spouse_here':['married'],
 'work:only_placement':['placement','primary:placement','skills:placement'],
 'role:chief':['management'],'role:deputy':['management'],'role:deputy2':['management'],
 'family:andreev':['spouse_here'],'family:tishchenko':['spouse_here','management'],
 'family:sayibov':['spouse_here'],'hobby:football_bets':['bets']
};
function consequences(s){const yes=new Set(),no=new Set();for(const [k,a] of evidence(s)){if(a==='yes')yes.add(k);if(a==='no')no.add(k);}let changed=true;while(changed){changed=false;for(const k of [...yes])for(const v of implications[k]||[]){const c=canon(v);if(!yes.has(c)){yes.add(c);changed=true;}}for(const group of Object.values(groups)){const hit=group.find(k=>yes.has(k));if(hit)for(const k of group)if(k!==hit)no.add(k);}if(no.has('has_kids'))for(const k of ['has_son','has_daughter','two_daughters','three_sons','grandson'])no.add(k);if(no.has('has_car'))for(const k of groups.car)no.add(k);if(no.has('married'))no.add('spouse_here');}
 if(yes.has('hair:gray'))yes.add('appearance:light');if(no.has('appearance:light'))no.add('hair:gray');return{yes,no};}
const entropy=p=>p<=1e-12||p>=1-1e-12?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
function utility(s,q,list){const values=list.map(x=>probability(x.person,q.id)),mean=values.reduce((a,v,i)=>a+v*list[i].prob,0);const gain=entropy(mean)-values.reduce((a,v,i)=>a+list[i].prob*entropy(v),0);const coverage=list.reduce((a,x)=>a+x.prob*(fact(x.person,q.id)!==null?1:0),0);const top=list[0],second=list[1];const distinct=top&&second&&fact(top.person,q.id)!==null&&fact(second.person,q.id)!==null&&fact(top.person,q.id)!==fact(second.person,q.id)?.18:0;return(gain+distinct)*(.45+.55*coverage)*(q.weight||1);}
E.questionUtility=utility;
E.pickQuestion=function(s){if(s.questionCount>=30)return null;const list=ranked(s);if(!list.length)return null;const used=new Set([...evidence(s).keys()]);const {yes,no}=consequences(s);let best=null,bestU=0;for(const q of D.questions){const k=canon(q.id);if(used.has(k)||yes.has(k)||no.has(k))continue;const u=utility(s,q,list);if(u>bestU+1e-8){bestU=u;best=q;}}return bestU>=(s.questionCount>=15?.012:.003)?best:null;};
E.shouldGuess=function(s){const list=ranked(s);if(!list.length)return false;if(list.length===1)return true;if(s.questionCount<5||list[0].prob<.965)return false;const positives=[...evidence(s)].filter(([k,a])=>a==='yes'&&fact(list[0].person,k)===true);const groups=new Set(positives.map(([k])=>k.split(':')[0]));return positives.length>=3&&groups.size>=2;};
const oldCreate=E.createSession;E.createSession=function(){return{...oldCreate(),history:[]};};
E.applyAnswer=function(s,k,a){if(!(a in reliability))throw Error('Unknown answer');s.history=s.history||[];s.history.push({key:k,old:s.answers[k],asked:s.asked.slice()});s.answers[k]=a;if(!s.asked.includes(k))s.asked.push(k);s.questionCount=s.asked.length;s.revision++;};
E.undo=function(s){const h=s.history?.pop();if(h){s.asked=h.asked;if(h.old===undefined)delete s.answers[h.key];else s.answers[h.key]=h.old;s.questionCount=s.asked.length;s.revision++;return true;}const k=s.asked.pop();if(k===undefined)return false;delete s.answers[k];s.questionCount=s.asked.length;s.revision++;return true;};
E.conflicts=s=>{const top=ranked(s)[0];if(!top)return[];return [...evidence(s)].filter(([k,a])=>['yes','no'].includes(a)&&fact(top.person,k)!==null&&((a==='yes')!==fact(top.person,k))).map(([k])=>k);};
E.diagnostic=s=>({candidates:ranked(s).length,confidence:ranked(s)[0]?.prob||0,conflicts:E.conflicts(s),exhausted:!E.pickQuestion(s)});
})(typeof window!=='undefined'?window:globalThis);