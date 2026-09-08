(function(){
  const texts={
    spouse_here:"Супруг или супруга тоже работает на этом складе?",
    spouse_mgmt:"Супруг или супруга из руководства?",
    both_mgmt_couple:"И этот человек, и супруг/супруга — руководство?",
    andreev_couple:"Это Андреев или Андреева?",
    tishchenko_couple:"Это Тищенко Стас или Тищенко Мария?",
    sayibov_couple:"Это Сайибов или Сайибова?",
    father_son_here:"На складе работают отец и сын из этой семьи?",
    mother_son_here:"На складе работают мама и сын из этой семьи?",
    cousin_here:"На складе работает двоюродный брат?",
    assembly:"Этот человек работает на сборке?",
    management:"Это руководство склада?",
    athletic:"Спортивного телосложения?",
    thin:"Худой?",
    full:"Полного телосложения?",
    married:"Женат или замужем?",
    unmarried:"Не состоит в браке?",
    sold_car:"Машина раньше была, потом её продали?"
  };
  if(!window.GAME_DATA||!GAME_DATA.questions) return;
  GAME_DATA.questions.forEach(q=>{ if(texts[q.id]) q.text=texts[q.id]; });
})();
