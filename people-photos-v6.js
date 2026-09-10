(function(){
'use strict';
const D=window.GAME_DATA;if(!D)return;
const z=D.people.find(p=>p.id===10);if(z)z.name='Жнивин Алексей';
const photos={
 'Андреев Сергей':'assets/people/andreev-sergey.webp?v=7',
 'Воронцов Сергей':'assets/people/vorontsov-sergey.webp?v=7',
 'Жнивин Алексей':'assets/people/zhnivin-aleksey.webp?v=7',
 'Ляшенко Саша':'assets/people/lyashenko-aleksandr.webp?v=7',
 'Ляшенко Александр':'assets/people/lyashenko-aleksandr.webp?v=7',
 'Мартынюк Василий':'assets/people/martynyuk-vasiliy.webp?v=7'
};
window.PEOPLE_PHOTOS=photos;
function srcFor(name){return photos[(name||'').trim()]||null;}
function ensureFinalPhoto(final,finalName,src){
 let wrap=final.querySelector('.final-person-photo');
 if(!src){if(wrap)wrap.hidden=true;return;}
 if(!wrap){
   wrap=document.createElement('div');wrap.className='final-person-photo';
   const img=document.createElement('img');img.alt='';
   wrap.appendChild(img);final.insertBefore(wrap,finalName);
 }
 const img=wrap.querySelector('img');
 img.onload=()=>{wrap.classList.add('loaded');wrap.classList.remove('broken');};
 img.onerror=()=>{wrap.classList.add('broken');wrap.classList.remove('loaded');};
 img.src=src;wrap.hidden=false;
}
function sync(){
 const confirm=document.getElementById('screen-confirm');
 const final=document.getElementById('screen-final');
 const confirmGenie=document.getElementById('confirm-genie');
 const finalName=document.getElementById('final-name');
 if(confirm&&!confirm.classList.contains('hidden')){
   const old=confirm.querySelector('.employee-photo');if(old)old.remove();
   if(confirmGenie){confirmGenie.hidden=false;confirmGenie.src='assets/solved.webp?v=3';}
 }
 if(final&&!final.classList.contains('hidden')) ensureFinalPhoto(final,finalName,srcFor(finalName?.textContent));
}
new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',()=>setTimeout(sync,0));
sync();
})();