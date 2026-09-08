(function(){
'use strict';
const D=window.GAME_DATA;
// Only confirmed people. Historical ID 11 was an erroneous reading, not a person.
const additions={
1:{gender:'male',primary:'management',body:'average',role:'deputy2',spouse:2},
2:{gender:'female',primary:'marketplace',spouse:1},
3:{gender:'male',primary:'assembly',skills:['receiving','placement'],hairStyle:'short'},
4:{gender:'male',primary:'assembly',fast:true},
5:{gender:'male',primary:'assembly',skills:['placement'],car:'Volvo',carColor:'black',nickname:'Волк',fightPartner:10,ambassador:true},
6:{gender:'male',primary:'placement',skills:['placement'],onlyPlacement:true},
7:{gender:'male',primary:'assembly',car:'Matiz'},
8:{gender:'male',primary:'assembly',height:'average',body:'athletic',car:'Nissan',detailing:true},
9:{gender:'male',primary:'assembly',dyedHair:true,fastfood:true},
10:{gender:'male',primary:'assembly',nickname:'Псих',fightPartner:5,ambassador:true,cousin:24},
12:{gender:'female',primary:'assembly'},
13:{gender:'male',primary:'assembly',skills:['receiving','placement'],body:'athletic',tattoos:true,spartak:true,bets:true},
14:{gender:'male',primary:'shipping',skills:['assembly','placement'],body:'full',glasses:true,loud:true},
15:{gender:'female',primary:'marketplace',role:'marketplace_lead'},
16:{gender:'male',primary:'leroy',role:'leroy_boss',car:'Ford',height:'average',body:'athletic'},
17:{gender:'male',primary:'placement',skills:['assembly'],height:'below',returned:true,sheremetyevo:true},
18:{gender:'male',primary:'receiving',skills:['assembly','placement'],height:'short'},
19:{gender:'female',primary:'assembly',skills:['leroy'],threeSons:true,marketplaceFriends:true},
20:{gender:'female',primary:'assembly'},
21:{gender:'male',primary:'receiving',skills:['assembly'],father:22,bets:true},
22:{gender:'male',primary:'assembly',son:21,fast:true,car:'Lada'},
23:{gender:'male',primary:'receiving',sheremetyevo:true,games:true},
24:{gender:'male',primary:'assembly',cousin:10,bets:true,spartak:true},
25:{gender:'male',primary:'assembly',spouse:26,car:'Priora',carColor:'cherry',hoarse:true},
26:{gender:'female',primary:'assembly',spouse:25},
27:{gender:'male',primary:'assembly',rap:true},
28:{gender:'female',primary:'assembly',skills:['marketplace'],hairStyle:'short'},
29:{gender:'male',primary:'placement',car:'Mitsubishi',returned:true},
30:{gender:'male',primary:'leroy',skills:['receiving','placement'],car:'Skoda',carColor:'blue',height:'above',body:'athletic'},
31:{gender:'male',primary:'defect',skills:['assembly'],older:true},
32:{gender:'male',primary:'management',role:'deputy',spouse:39,body:'average'},
33:{gender:'male',primary:'receiving',skills:['assembly','placement'],forkliftJob:true,body:'full'},
34:{gender:'male',primary:'placement',height:'below',body:'full'},
35:{gender:'female',primary:'assembly',son:36},
36:{gender:'male',primary:'assembly',mother:35,footballer:true},
37:{gender:'male',primary:'receiving',skills:['defect'],height:'average'},
38:{gender:'male',primary:'assembly',footballer:true},
39:{gender:'female',primary:'management',role:'chief',spouse:32,body:'average',soldCar:true}
};
const fields={
 gender:{male:'Мужчина?',female:'Женщина?'},
 primary:{management:'Основная работа связана с руководством склада?',assembly:'Основной участок — обычная сборка?',receiving:'Основной участок — приёмка?',placement:'Основной участок — размещение?',shipping:'Основной участок — отгрузка?',defect:'Основной участок — приёмка брака?',marketplace:'Основной участок — Ozon и Wildberries?',leroy:'Основной участок — сборка Леруа?'},
 skills:{receiving:'Может работать на приёмке?',placement:'Может работать на размещении?',assembly:'Может работать на обычной сборке?',defect:'Может работать с браком?',marketplace:'Может работать на участке Ozon и Wildberries?',leroy:'Может работать на сборке Леруа?'},
 role:{chief:'Это начальник склада?',deputy:'Это заместитель начальника склада?',deputy2:'Это заместитель заместителя начальника?',leroy_boss:'Руководит сборкой Леруа?',marketplace_lead:'Старшая на участке маркетплейсов?'},
 height:{tall:'Высокого роста?',above:'Рост выше среднего?',average:'Среднего роста?',below:'Рост чуть ниже среднего?',short:'Низкого роста?'},
 body:{athletic:'Спортивного телосложения?',thin:'Худой?',full:'Полного телосложения?',average:'Среднего телосложения?'},
 hairStyle:{short:'Короткая стрижка?',curly:'Кудрявые волосы?'},
 car:{Matiz:'Ездит на Matiz?',Nissan:'Ездит на Nissan?',Priora:'Ездит на Priora?',Lada:'Ездит на Lada?',Volvo:'Ездит на Volvo?',Ford:'Ездит на Ford?',Skoda:'Ездит на Škoda?',Mitsubishi:'Ездит на Mitsubishi?'},
 carColor:{black:'Машина чёрного цвета?',blue:'Машина синего цвета?',cherry:'Машина вишнёвого цвета?'},
 nickname:{'Псих':'Его кличка — Псих?','Волк':'Его кличка — Волк?'}
};
const names={
assembly:'Работает на сборке?',receiving:'Работает на приёмке?',placement:'Работает на размещении?',shipping:'Работает на отгрузке?',defect:'Работает с браком?',ozon:'Работает на Ozon или Wildberries?',leroy:'Работает со сборкой Леруа?',management:'Относится к руководству склада?',married:'Состоит в браке?',unmarried:'Не состоит в браке?',divorced:'Разведён или разведена?',has_kids:'Есть дети?',has_son:'Есть сын?',has_daughter:'Есть дочь?',two_daughters:'Есть две дочери?',three_sons:'Есть три сына?',grandson:'Есть внук?',spouse_here:'Супруг или супруга тоже работает на складе?',spouse_mgmt:'Супруг или супруга работает в руководстве?',both_mgmt_couple:'Оба супруга работают в руководстве?',father_son_here:'На складе работают отец и сын из этой семьи?',mother_son_here:'На складе работают мать и сын из этой семьи?',cousin_here:'Здесь работает двоюродный брат?',young:'Это молодой сотрудник?',older:'Это сотрудник старшего возраста?',tall:'Высокого роста?',above_avg:'Рост выше среднего?',avg_height:'Среднего роста?',below_avg:'Рост ниже среднего?',short:'Низкого роста?',athletic:'Спортивного телосложения?',thin:'Худой?',full:'Полного телосложения?',blonde:'Светлые волосы?',dark_hair:'Тёмные волосы?',red_hair:'Рыжие волосы?',gray_hair:'Седые волосы?',graying:'Седеет?',bald:'Лысый?',balding:'Лысеет?',short_cut:'Короткая стрижка?',curly:'Кудрявые волосы?',dyed_hair:'Красил волосы?',cap:'Постоянно ходит в кепке?',glasses:'Носит очки?',tattoos:'Есть татуировки?',limp:'Хромает?',has_car:'Есть машина?',sold_car:'Раньше была машина, которую продали?',forklift_can:'Умеет ездить на погрузчике?',forklift_job:'Работает на погрузчике?',best_picker:'Считается одним из лучших сборщиков?',fast_picker:'Быстро собирает заказы?',returned:'Раньше увольнялся с этого склада, а затем вернулся?',sheremetyevo:'Раньше работал в Шереметьево?',footballer:'Играет в футбол?',bets:'Делает ставки на спорт?',spartak:'Болеет за Спартак?',detailing:'Раньше занимался детейлингом?',rap:'Читает рэп?',games:'Любит видеоигры?',scooter:'Ездит на самокате?',moonshine:'Занимается самогоноварением?',loud:'Часто громко разговаривает?',fussy:'Постоянно в суете?',hoarse:'У него хриплый голос?',fight:'Участвовал в шуточном бою с коллегой?',ambassador:'Амбассадор ЛевинБраун?',marketplace_lead:'Старшая на участке маркетплейсов?',leroy_boss:'Руководит сборкой Леруа?',marketplaceFriends:'Особенно дружит с коллективом маркетплейсов?',fastfood:'Любит фастфуд?',onlyPlacement:'Работает исключительно на размещении?',recently_married:'Недавно женился?',spouse_mgmt:'Супруг или супруга из руководства?'};
const questions=[];const seen=new Set();
function add(id,text,group,weight=1){if(seen.has(id))return;seen.add(id);questions.push({id,text,group:group||'general',weight});}
for(const [field,values] of Object.entries(fields))for(const [v,text] of Object.entries(values))add(field+':'+v,text,field,field==='primary'?1.3:1);
for(const [id,text] of Object.entries(names))add(id,text,'general',1);
const extra={
 'family:andreev':'Его супруг или супруга — Андреев Сергей или Андреева Татьяна?',
 'family:tishchenko':'Это один из супругов Тищенко, работающих в руководстве?',
 'family:sayibov':'Это один из супругов Сайибовых?',
 'family:podaplelov':'Это Иван или Павел Подаплелов?',
 'family:chaykovsky':'Это Инна или Денис Чайковские?',
 'family:cousins':'Это Жнивьин Алексей или Савочкин Сергей?',
 'relation:father':'Его отец тоже работает на этом складе?',
 'relation:son':'Его сын тоже работает на этом складе?',
 'relation:mother':'Его мать тоже работает на этом складе?',
 'relation:spouse':'Его супруг или супруга тоже работает здесь?',
 'relation:boss_spouse':'Его супруг или супруга входит в руководство?',
 'relation:chief_spouse':'Его супруг или супруга — начальник склада?',
 'relation:deputy_spouse':'Его супруг или супруга — заместитель начальника?',
 'relation:cousin':'Его двоюродный брат тоже работает здесь?',
 'relation:fight':'Он участвовал в бою Псих против Волка?',
 'work:only_placement':'Работает только на размещении, не переходя на другие участки?',
 'work:leroy_regular':'Часто собирает заказы Леруа?',
 'work:marketplace_regular':'Регулярно работает с заказами Ozon и Wildberries?',
 'work:forklift_parttime':'Работает на погрузчике на полставки?',
 'work:former_placement':'Раньше его основной работой было размещение?',
 'work:returned':'Он увольнялся и потом снова устроился на склад?',
 'work:two_departments':'Может работать как минимум на двух участках?',
 'work:three_departments':'Может работать как минимум на трёх участках?',
 'work:receiving_and_placement':'Может работать и на приёмке, и на размещении?',
 'work:assembly_and_receiving':'Может работать и на сборке, и на приёмке?',
 'work:assembly_and_placement':'Может работать и на сборке, и на размещении?',
 'work:marketplace_and_leroy':'Работает и на маркетплейсах, и на сборке Леруа?',
 'work:best_or_fast':'Его считают быстрым или одним из лучших сборщиков?',
 'work:management':'Руководит сотрудниками?',
 'car:owned':'Есть собственная машина?',
 'car:former':'Машина была, но её продали?',
 'car:foreign':'Ездит на иномарке?',
 'car:lada_family':'Ездит на автомобиле Lada?',
 'appearance:hair_loss':'Лысеет или уже лысый?',
 'appearance:gray':'Седые волосы или заметно седеет?',
 'appearance:light':'Светлые или седые волосы?',
 'appearance:dark':'Тёмные волосы?',
 'appearance:short_hair':'У него короткая стрижка?',
 'appearance:slim':'Худой или спортивного телосложения?',
 'appearance:average_or_tall':'Рост не ниже среднего?',
 'appearance:below_or_short':'Рост ниже среднего?',
 'hobby:football':'Играет в футбол?',
 'hobby:football_bets':'Делает ставки на футбол?',
 'hobby:spartak':'Болеет за Спартак?',
 'hobby:video_games':'Любит видеоигры?',
 'hobby:rap':'Читает рэп?',
 'hobby:detailing':'Раньше занимался детейлингом?',
 'hobby:scooter':'Ездит на самокате?',
 'hobby:moonshine':'Занимается самогоноварением?',
 'story:psih':'Его называют Псих?',
 'story:volk':'Его называют Волк?',
 'story:fight':'Был участником боя Псих против Волка?',
 'story:ambassador':'Связан с проектом ЛевинБраун?',
 'story:sheremetyevo':'Раньше работал в Шереметьево?',
 'story:returned':'Возвращался работать на склад после увольнения?'
};
for(const [id,text] of Object.entries(extra))add(id,text,id.split(':')[0],1.1);
// Preserve known facts without inventing negative values for absent fields.
const rawKeys=Object.keys(names);
function normalize(p){
 const a=additions[p.id]||{};const old=p.f||{};const f={...old};
 // The previous dataset accidentally treated management as assembly and omitted actual secondary skills.
 if(p.id===1)delete f.assembly;
 if(p.id===16)f.leroy=true;
 if(p.id===30)f.leroy=true;
 if(p.id===19)f.leroy=true;
 if(p.id===28)f.ozon=true;
 if(p.id===9||p.id===8||p.id===10||p.id===4||p.id===5)f.assembly=true;
 // Keep sensitive and subjective notes out of the public game database.
 delete f.moldova;
 for(const [key,value] of Object.entries(a)){
  if(['gender','primary','skills','role','height','body','hairStyle','car','carColor','nickname'].includes(key))continue;
  if(typeof value==='boolean'&&rawKeys.includes(key))f[key]=value;
 }
 const primary=a.primary||null;
 if(primary){const k={marketplace:'ozon',leroy:'leroy',management:'management',defect:'defect'}[primary]||primary;f[k]=true;}
 for(const skill of a.skills||[]){const k=skill==='marketplace'?'ozon':skill;f[k]=true;}
 for(const [key,value] of Object.entries(a)){
  if(['gender','primary','role','height','body','hairStyle','car','carColor','nickname'].includes(key))f[key+':'+value]=true;
  if(key==='skills')for(const skill of value)f['skills:'+skill]=true;
 }
 if(a.height)f[{average:'avg_height',above:'above_avg',below:'below_avg',short:'short',tall:'tall'}[a.height]]=true;
 if(a.body&&a.body!=='average')f[a.body]=true;
 if(a.body==='average')f.body_average=true;
 if(a.car){f.has_car=true;f[a.car.toLowerCase()]=true;}
 if(a.carColor)f['carColor:'+a.carColor]=true;
 if(a.role){f[a.role]=true;if(a.role==='chief'||a.role==='deputy'||a.role==='deputy2')f.management=true;}
 if(a.nickname)f['nick_'+(a.nickname==='Псих'?'psih':'volk')]=true;
 if(a.spouse){f.spouse_here=true;f['relation:spouse']=true;}
 if(a.father)f['relation:father']=true;
 if(a.son)f['relation:son']=true;
 if(a.mother)f['relation:mother']=true;
 if(a.cousin)f['relation:cousin']=true;
 if([1,2].includes(p.id))f['family:andreev']=true;
 if([32,39].includes(p.id))f['family:tishchenko']=true;
 if([25,26].includes(p.id))f['family:sayibov']=true;
 if([21,22].includes(p.id))f['family:podaplelov']=true;
 if([35,36].includes(p.id))f['family:chaykovsky']=true;
 if([10,24].includes(p.id))f['family:cousins']=true;
 if([1,2,32,39].includes(p.id))f['relation:boss_spouse']=true;
 if([32,39].includes(p.id))f['relation:chief_spouse']=p.id===32;
 if([1,2].includes(p.id))f['relation:deputy_spouse']=p.id===2;
 if(a.skills){
  const all=new Set([primary,...a.skills].filter(Boolean));
  f['work:two_departments']=all.size>=2;
  f['work:three_departments']=all.size>=3;
  f['work:receiving_and_placement']=all.has('receiving')&&all.has('placement');
  f['work:assembly_and_receiving']=all.has('assembly')&&all.has('receiving');
  f['work:assembly_and_placement']=all.has('assembly')&&all.has('placement');
  f['work:marketplace_and_leroy']=all.has('marketplace')&&all.has('leroy');
 }
 if(a.primary==='placement'&&a.onlyPlacement)f['work:only_placement']=true;
 if(a.primary==='leroy'||p.id===30)f['work:leroy_regular']=true;
 if(a.primary==='marketplace'||p.id===28)f['work:marketplace_regular']=true;
 if(p.id===33)f['work:forklift_parttime']=true;
 if(p.id===5)f['work:former_placement']=true;
 if(a.returned){f['work:returned']=true;f['story:returned']=true;}
 if(f.best_picker||f.fast_picker)f['work:best_or_fast']=true;
 if(f.management||a.role==='leroy_boss'||a.role==='marketplace_lead')f['work:management']=true;
 if(a.car){f['car:owned']=true;f['car:foreign']=!['Lada','Priora'].includes(a.car);f['car:lada_family']=['Lada','Priora'].includes(a.car);}
 if(a.soldCar)f['car:former']=true;
 if(f.bald||f.balding)f['appearance:hair_loss']=true;
 if(f.gray_hair||f.graying)f['appearance:gray']=true;
 if(f.blonde||f.gray_hair||f.graying)f['appearance:light']=true;
 if(f.dark_hair)f['appearance:dark']=true;
 if(f.short_cut||a.hairStyle==='short')f['appearance:short_hair']=true;
 if(f.thin||f.athletic)f['appearance:slim']=true;
 if(f.tall||f.above_avg||f.avg_height)f['appearance:average_or_tall']=true;
 if(f.short||f.below_avg)f['appearance:below_or_short']=true;
 const aliases={footballer:'hobby:football',bets:'hobby:football_bets',spartak:'hobby:spartak',games:'hobby:video_games',rap:'hobby:rap',detailing:'hobby:detailing',scooter:'hobby:scooter',moonshine:'hobby:moonshine',sheremetyevo:'story:sheremetyevo',fight:'story:fight',ambassador:'story:ambassador'};
 for(const [from,to] of Object.entries(aliases))if(f[from]===true)f[to]=true;
 if(a.nickname)f['story:'+(a.nickname==='Псих'?'psih':'volk')]=true;
 if(a.fightPartner)f['relation:fight']=true;
 if(p.id===19)f.marketplaceFriends=true;
 if(p.id===5||p.id===10){f.ambassador=true;f['story:ambassador']=true;}
 if(p.id===10||p.id===6)f.moonshine=true;
 if(p.id===9)f.fastfood=true;
 // Explicit negative facts for exclusive categories; missing information remains unknown.
 const groups={gender:['male','female'],primary:Object.keys(fields.primary),role:Object.keys(fields.role),height:Object.keys(fields.height),car:Object.keys(fields.car),nickname:Object.keys(fields.nickname)};
 for(const [group,values] of Object.entries(groups)){
  if(!a[group])continue;
  for(const v of values)f[group+':'+v]=a[group]===v;
 }
 for(const [group,values] of Object.entries({height:['tall','above_avg','avg_height','below_avg','short']})){
  if(!a[group])continue;
  const chosen=a[group]==='average'?(group==='height'?'avg_height':null):a[group]==='above'?'above_avg':a[group]==='below'?'below_avg':a[group];
  for(const v of values)if(v!==chosen)f[v]=false;
 }
 // Body categories can overlap; do not infer negatives from athletic or average build.
 if(a.gender==='female')f['gender:male']=false;
 if(a.gender==='male')f['gender:female']=false;
 if(f.has_kids===false){for(const k of ['has_son','has_daughter','two_daughters','three_sons','grandson'])f[k]=false;}
 if(f.married===true){f.unmarried=false;f.divorced=false;}
 if(f.unmarried===true){f.married=false;f.divorced=false;}
 if(f.divorced===true){f.married=false;f.unmarried=true;}
 // The source contains no proof that every absent feature is false.
 return {...p,f};
}
D.people=D.people.map(normalize);
// Canonical questions replace incomplete old lists; old compatibility scripts are not loaded.
D.questions=questions;
D.version='2.0';
D.meta={confirmedPeople:D.people.length,privacy:'Only game-safe facts. Unknown values are not negative.'};
})();
