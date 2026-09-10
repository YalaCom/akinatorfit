(function(){
'use strict';
const $=id=>document.getElementById(id);const E=window.Engine;
const screens=['start','play','confirm','recovery','final'];
let session=null,currentQuestion=null,pendingGuess=null,recoveryQueue=[];
const image={confused:'assets/confused.webp?v=3',thinking:'assets/thinking.webp?v=3',solved:'assets/solved.webp?v=3'};
const tg=window.Telegram?.WebApp;
try{tg?.ready();tg?.expand();tg?.setHeaderColor('#0b1020');tg?.setBackgroundColor('#0b1020');}catch(_){}
function show(name){for(const s of screens)$('screen-'+s).classList.toggle('hidden',s!==name);document.body.dataset.screen=name;window.scrollTo(0,0);}
function genie(state){$('play-genie').src=image[state];$('play-genie').className=state==='thinking'?'thinking':'';}
function save(){try{sessionStorage.setItem('fit-akinator-session',JSON.stringify(session));}catch(_){}}
async function start(){session=E.createSession();pendingGuess=null;currentQuestion=null;recoveryQueue=[];save();try{await window.AkinatorLearning?.loadModel();}catch(_){}next();}
function guess(person){pendingGuess=person;currentQuestion=null;$('confirm-name').textContent=person.name;$('confirm-genie').src=image.solved;show('confirm');}
function recovery(){
 const list=E.clarification(session)||[];
 if(!list.length){$('recovery-title').textContent='Все кандидаты исключены. Можно изменить ответы или начать заново.';recoveryQueue=[];}
 else{recoveryQueue=list.map(x=>x.id);$('recovery-title').textContent='Не хватает отличительных признаков.';}
 show('recovery');
}
function next(){
 if(!session)return;
 const ranks=E.ranked(session);if(!ranks.length){recovery();return;}
 if(E.shouldGuess(session)){guess(ranks[0].person);return;}
 currentQuestion=E.pickQuestion(session);
 if(!currentQuestion){recovery();return;}
 const conf=ranks[0]?.prob||0;
 genie(session.questionCount===0?'thinking':conf<.16&&session.questionCount>4?'confused':'thinking');
 $('q-count').textContent='Вопрос '+(session.questionCount+1);
 $('phase').textContent=conf>.7?'УТОЧНЯЮ ДЕТАЛИ':session.questionCount>12?'СУЖАЮ ПОИСК':'ИЩУ ПОДСКАЗКИ';
 $('question').textContent=currentQuestion.text;show('play');save();
}
function answer(a){if(!session||!currentQuestion)return;E.applyAnswer(session,currentQuestion.id,a);currentQuestion=null;save();next();}
function undo(){if(!session)return;if(E.undo(session)){pendingGuess=null;recoveryQueue=[];save();next();}else show('start');}
function reject(){if(!pendingGuess)return;E.rejectGuess(session,pendingGuess.id);pendingGuess=null;save();next();}
async function finalize(){
 if(!pendingGuess)return;
 const person=pendingGuess;
 $('final-name').textContent=person.name;
 const status=$('learn-status');if(status)status.textContent='Запоминаю эту игру…';
 show('final');
 try{sessionStorage.removeItem('fit-akinator-session');}catch(_){}
 try{
   const ok=await window.AkinatorLearning?.submitConfirmed(person,session);
   if(status)status.textContent=ok?'Игра сохранена — я стал немного умнее.':'Ответ показан. Обучение сохранится, когда база будет доступна.';
 }catch(_){if(status)status.textContent='Ответ показан.';}
}
function recoverNext(){
 if(!session)return;
 if(!recoveryQueue.length)recoveryQueue=(E.clarification(session)||[]).map(x=>x.id);
 while(recoveryQueue.length&&session.excluded[recoveryQueue[0]])recoveryQueue.shift();
 const id=recoveryQueue.shift();if(id===undefined){recovery();return;}
 const person=window.GAME_DATA.people.find(p=>p.id===id);if(person)guess(person);else recovery();
}
$('btn-start').onclick=start;$('btn-restart-small').onclick=start;$('btn-undo').onclick=undo;$('btn-confirm-undo').onclick=undo;
document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));
$('btn-yes-guess').onclick=finalize;$('btn-no-guess').onclick=reject;
$('btn-recovery-next').onclick=recoverNext;$('btn-recovery-back').onclick=undo;$('btn-recovery-reset').onclick=start;
$('btn-again').onclick=start;
try{tg?.BackButton?.onClick(()=>{if(document.body.dataset.screen==='start')tg.close();else if(document.body.dataset.screen==='final')show('start');else undo();});}catch(_){}
show('start');
})();
