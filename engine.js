(function () {
  const WEIGHT = { yes:{match:2.4,miss:-3.4}, probably_yes:{match:1.2,miss:-1.4}, unknown:{match:0,miss:0}, probably_no:{match:-1.4,miss:1.2}, no:{match:-3.4,miss:2.4} };
  function val(person,key){ if(!person.f||!(key in person.f)) return null; const v=person.f[key]; return (v===null||v===undefined)?null:v; }
  function createSession(){ return {asked:[],answers:{},excluded:{},questionCount:0,lastQuestion:null,confirmedWrong:[]}; }
  function scorePerson(session,person){ if(session.excluded[person.id]) return -Infinity; let s=0; for(const [key,ans] of Object.entries(session.answers)){ const v=val(person,key); if(v===null) continue; const w=WEIGHT[ans]||WEIGHT.unknown; s+=v?w.match:w.miss; } return s; }
  function ranked(session){ return GAME_DATA.people.map(p=>({person:p,score:scorePerson(session,p)})).filter(x=>x.score!==-Infinity).sort((a,b)=>b.score-a.score); }
  function remaining(session){ return GAME_DATA.people.filter(p=>!session.excluded[p.id]); }
  function questionUtility(session,qid){ const live=remaining(session); let yes=0,no=0,unk=0; for(const p of live){ const v=val(p,qid); if(v===true) yes++; else if(v===false) no++; else unk++; } const n=live.length||1; if(yes===0&&no===0) return -1; const py=yes/n,pn=no/n,pu=unk/n; const ent=p=>p<=0?0:-p*Math.log2(p); return Math.min(yes,no)*2+(ent(py)+ent(pn)+ent(pu)*0.15); }
  function pickQuestion(session){ const used=new Set(session.asked); let best=null,bestU=-Infinity; for(const q of GAME_DATA.questions){ if(used.has(q.id)) continue; const u=questionUtility(session,q.id); if(u>bestU){ bestU=u; best=q; } } return best; }
  function applyAnswer(session,qid,answer){ session.answers[qid]=answer; if(!session.asked.includes(qid)) session.asked.push(qid); session.questionCount+=1; session.lastQuestion=qid; }
  function shouldGuess(session){ const list=ranked(session); if(!list.length) return false; if(session.questionCount<8) return false; const top=list[0], second=list[1]; if(!second) return session.questionCount>=6; const gap=top.score-second.score; if(session.questionCount>=14 && gap>=2.2) return true; if(session.questionCount>=10 && gap>=3.4) return true; if(gap>=5.2 && session.questionCount>=8) return true; return false; }
  function topGuess(session){ const list=ranked(session); return list[0]?list[0].person:null; }
  function rejectGuess(session,personId){ session.excluded[personId]=true; session.confirmedWrong.push(personId); }
  window.Engine={createSession,pickQuestion,applyAnswer,shouldGuess,topGuess,rejectGuess,ranked,remaining};
})();
