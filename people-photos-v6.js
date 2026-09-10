(function(){
'use strict';
const D=window.GAME_DATA;if(!D)return;
const z=D.people.find(p=>p.id===10);if(z)z.name='Жнивин Алексей';
const photos={
 'Андреев Сергей':'assets/people/andreev-sergey.webp?v=6',
 'Воронцов Сергей':'assets/people/vorontsov-sergey.webp?v=6',
 'Жнивин Алексей':'assets/people/zhnivin-aleksey.webp?v=6',
 'Ляшенко Саша':'assets/people/lyashenko-aleksandr.webp?v=6',
 'Ляшенко Александр':'assets/people/lyashenko-aleksandr.webp?v=6',
 'Мартынюк Василий':'assets/people/martynyuk-vasiliy.webp?v=6'
};
window.PEOPLE_PHOTOS=photos;
function srcFor(name){return photos[(name||'').trim()]||null;}
function sync(){
 const confirm=document.getElementById('screen-confirm');
 const final=document.getElementById('screen-final');
 const confirmName=document.getElementById('confirm-name');
 const finalName=document.getElementById('final-name');
 if(confirm&&!confirm.classList.contains('hidden')){
   const src=srcFor(confirmName?.textContent);const art=confirm.querySelector('.art');const genie=document.getElementById('confirm-genie');
   let img=art?.querySelector('.employee-photo');
   if(src&&art){if(!img){img=document.createElement('img');img.className='employee-photo';img.alt='Фото сотрудника';art.appendChild(img);}img.src=src;img.hidden=false;if(genie)genie.hidden=true;}
   else{if(img)img.hidden=true;if(genie)genie.hidden=false;}
 }
 if(final&&!final.classList.contains('hidden')){
   const src=srcFor(finalName?.textContent);let wrap=final.querySelector('.final-person-photo');
   if(src){if(!wrap){wrap=document.createElement('div');wrap.className='final-person-photo';const img=document.createElement('img');img.alt='Фото сотрудника';wrap.appendChild(img);final.insertBefore(wrap,finalName);}wrap.querySelector('img').src=src;wrap.hidden=false;}
   else if(wrap)wrap.hidden=true;
 }
}
new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
document.addEventListener('click',()=>setTimeout(sync,0));
sync();
})();