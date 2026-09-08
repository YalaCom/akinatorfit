(function () {
  const WEIGHT = { yes:{match:2.6,miss:-3.6}, no:{match:-3.6,miss:2.6}, unknown:{match:0,miss:0}, probably_yes:{match:1.15,miss:-1.2} };
  const GROUPS = {
    height:["tall","above_avg","avg_height","below_avg","short"],
    body:["athletic","thin","full"],
    hair:["blonde","dark_hair","red_hair","gray_hair","bald"],
    marital:["married","unmarried","divorced"],
    lead:["chief","deputy","deputy2"],
    nick:["nick_psih","nick_volk"],
    couple:["andreev_couple","tishchenko_couple","sayibov_couple"]
  };
  const SKIP_IF_YES = {
    athletic:["thin","full"], thin:["full","athletic"], full:["thin","athletic"],
    tall:["short","below_avg","avg_height"], short:["tall","above_avg","avg_height"],
    above_avg:["short","below_avg"], below_avg:["tall","above_avg"],
    bald:["blonde","dark_hair","red_hair","gray_hair","balding","curly","short_cut"],
    married:["unmarried","divorced"],
    unmarried:["married","divorced","spouse_here","spouse_mgmt","both_mgmt_couple","andreev_couple","tishchenko_couple","sayibov_couple"],
    divorced:["married","unmarried","spouse_here"],
    chief:["deputy","deputy2","assembly","receiving","placement","shipping"],
    deputy:["chief","deputy2"], deputy2:["chief","deputy"],
    management:["placement_only","fast_picker","best_picker"],
    placement_only:["assembly","receiving","shipping","defect","ozon","leroy"],
    nick_psih:["nick_volk"], nick_volk:["nick_psih"]
  };
  const SKIP_IF_NO = {
    has_kids:["has_son","has_daughter","two_daughters","three_sons","son_and_daughter","grandson"],
    has_car:["matiz","nissan","priora","cherry_priora","lada","mitsubishi","skoda","blue_skoda","volvo","black_volvo","ford"],
    married:["spouse_here","spouse_mgmt","both_mgmt_couple","andreev_couple","tishchenko_couple","sayibov_couple"],
    spouse_here:["spouse_mgmt","both_mgmt_couple","andreev_couple","tishchenko_couple","sayibov_couple"],
    management:["chief","deputy","deputy2","both_mgmt_couple"],
    assembly:["best_picker","fast_picker","ozon","leroy","leroy_sometimes","leroy_boss"],
    bets:["bets_football"], priora:["cherry_priora"], volvo:["black_volvo"], skoda:["blue_skoda"], fight:["nick_psih","nick_volk"]
  };
  function val(person,key){ if(!person.f||!(key in person.f)) return null; const v=person.f[key]; return (v===null||v===undefined)?null:v; }
  function createSession(){ return {asked:[],answers:{},excluded:{},questionCount:0,blocked:{}}; }
  function blockFromAnswer(session,qid,answer){
    const positive=answer==="yes"||answer==="probably_yes";
    const negative=answer==="no";
    if(positive){
      (SKIP_IF_YES[qid]||[]).forEach(k=>session.blocked[k]=true);
      Object.values(GROUPS).forEach(group=>{ if(group.includes(qid)) group.forEach(k=>{ if(k!==qid) session.blocked[k]=true; }); });
    }
    if(negative) (SKIP_IF_NO[qid]||[]).forEach(k=>session.blocked[k]=true);
  }
  function scorePerson(session,person){ if(session.excluded[person.id]) return -Infinity; let s=0; for(const [key,ans] of Object.entries(session.answers)){ const v=val(person,key); if(v===null) continue; const w=WEIGHT[ans]||WEIGHT.unknown; s+=v?w.match:w.miss; } return s; }
  function ranked(session){ return GAME_DATA.people.map(p=>({person:p,score:scorePerson(session,p)})).filter(x=>x.score!==-Infinity).sort((a,b)=>b.score-a.score); }
  function remaining(session){ return GAME_DATA.people.filter(p=>!session.excluded[p.id]); }
  function questionUtility(session,qid){ const live=remaining(session); let yes=0,no=0; for(const p of live){ const v=val(p,qid); if(v===true) yes++; else if(v===false) no++; } if(yes===0&&no===0) return -1; if(yes===0||no===0) return 0.01; return Math.min(yes,no)*3+Math.min(yes,no)/live.length; }
  function pickQuestion(session){ const used=new Set(session.asked); let best=null,bestU=-Infinity; for(const q of GAME_DATA.questions){ if(used.has(q.id)||session.blocked[q.id]) continue; const u=questionUtility(session,q.id); if(u>bestU){ bestU=u; best=q; } } return best; }
  function applyAnswer(session,qid,answer){ session.answers[qid]=answer; if(!session.asked.includes(qid)) session.asked.push(qid); session.questionCount+=1; blockFromAnswer(session,qid,answer); }
  function shouldGuess(session){ const list=ranked(session); if(!list.length) return false; if(session.questionCount<7) return false; const top=list[0], second=list[1]; if(!second) return session.questionCount>=5; const gap=top.score-second.score; if(session.questionCount>=12&&gap>=2.4) return true; if(session.questionCount>=9&&gap>=3.6) return true; if(gap>=5.4) return true; return false; }
  function topGuess(session){ const list=ranked(session); return list[0]?list[0].person:null; }
  function rejectGuess(session,personId){ session.excluded[personId]=true; }
  window.Engine={createSession,pickQuestion,applyAnswer,shouldGuess,topGuess,rejectGuess,ranked,remaining};
})();
