const DeckInputs=(()=>{
const {G,catalogue,grades,zincClasses,toleranceRows,defaults}=DeckParameters;
 function thickness(s){
 const nominal=Number(s.nominalT),coating=Number(s.coating),width=Number(s.blankWidth);
 if(!zincClasses.includes(coating)||nominal<=0||width<=0)throw Error('Проверьте номинальную толщину, класс покрытия и ширину заготовки.');
 let tmp=s.coatMethod==='manual'?Number(s.coatThickness):s.coatMethod==='sp'&&coating===275?.04:coating/7100;
 if(tmp<0||!Number.isFinite(tmp))throw Error('Толщина покрытия должна быть неотрицательной.');
 let total=s.thicknessBasis==='coated'?nominal:nominal+tmp,core=s.thicknessBasis==='coated'?nominal-tmp:nominal,delta;
 if(s.precision==='manual')delta=Number(s.tolerance);else{if(width>1800||total>4.5)throw Error('Для этой ширины или толщины задайте допуск по сертификату.');let row=toleranceRows.find(x=>total<=x[0]+1e-9),c=width<=1200?0:width<=1500?1:2,off={normal:0,increased:3,high:6}[s.precision];if(!row||off===undefined)throw Error('Неизвестная точность');delta=row[1][off+c];}
 if(core<=0||delta<0||delta>=total)throw Error('Некорректный допуск или толщина основы.');
 let percent=100*delta/total,t=s.thicknessMode==='direct'?Number(s.steelT):s.accountTolerance&&percent>5?core*(100-percent)/95:core;
 return{nominal,total,core,coating,tmp,delta,percent,t,applied:s.thicknessMode!=='direct'&&s.accountTolerance&&percent>5};
 }
 function normalizeSettings(raw={}){
  const s={...defaults,...raw};delete s.basisAuto;delete s.massAuto;delete s.tableKey;
  if(s.designCode==='snip')s.accountTolerance=false;
  if(s.designCode==='sp'&&s.basis!=='manual'&&['normal','increased'].includes(s.precision))s.thicknessMode='nominal';
  if(s.basis==='catalogue'&&s.thicknessBasis==='coated')s.thicknessMode='nominal';
  if(s.designCode==='sp'&&s.thicknessMode==='nominal'&&['normal','increased'].includes(s.precision))s.accountTolerance=true;
  return s;
 }
 function prepareProject(raw={}){
 let s={...defaults,...raw};delete s.basisAuto;delete s.massAuto;delete s.tableKey;for(const [k,v] of Object.entries(defaults)){if(typeof v==='number'){s[k]=Number(s[k]);if(!Number.isFinite(s[k]))throw Error('Некорректное число: '+k);}if(typeof v==='boolean'&&typeof s[k]!=='boolean')throw Error('Некорректный флажок: '+k);}
 for(const [k,values] of Object.entries({designCode:['sp','snip'],snipPurpose:['deck','formwork'],limitSource:['document','user'],basis:['catalogue','geometry','manual'],orientation:['up','down'],units:['si','tf'],thicknessMode:['nominal','direct'],thicknessBasis:['steel','coated'],coatMethod:['sp','mass','manual'],precision:['normal','increased','high','manual'],massMode:['manual','catalogue','blank'],loadMode:['manual','construction'],concreteMode:['manual','geometry'],deflection:['sp266','elastic'],defLimitMode:['absolute','relative'],flanges:['one','two']}))if(!values.includes(s[k]))throw Error('Неизвестный параметр: '+k);
 let p=s.profile==='custom'?{name:String(s.customName).slice(0,150),t:s.nominalT,h:s.customH,p:s.customPitch,bw:s.customWide,bn:s.customNarrow,mass:s.deckMass,cover:s.coverWidth,blank:s.blankWidth,standard:s.customStandard}:catalogue[s.profile];if(!p)throw Error('Неизвестный профиль');
 if(s.profile==='custom'&&(Math.min(p.h,p.p,p.bw,p.bn,p.cover)<=0||p.bw+p.bn>=2*p.p||s.basis!=='manual'||s.massMode==='catalogue'))throw Error('Профиль СТО/ТУ: задайте размеры, ручные характеристики и массу по паспорту или заготовке.');
 for(const k of ['Ry','E','gc','gn','Iinput','Wplus','Wminus'])if(s[k]<=0)throw Error('Параметр должен быть положительным: '+k);
 for(const k of ['VR','Rend','Rinner','snipRebarDensity'])if(s[k]<0)throw Error('Отрицательное значение недопустимо: '+k);
 if(s.grade!=='manual'){if(!grades[s.grade])throw Error('Неизвестная марка стали');s.Ry=grades[s.grade];}
 if(s.designCode==='snip'){
   s.deflection='elastic';s.pond=false;if(s.grade!=='manual')throw Error('Для режима СНиП задайте подтверждённое Ry вручную.');
   if(!Object.hasOwn(raw,'limitSource'))s.limitSource='document';
   if(!Object.hasOwn(raw,'loadMode')&&s.snipPurpose==='deck')s.loadMode='manual';
   if(s.basis==='geometry')throw Error('Для СНиП выберите табличные W и I либо подтверждённые характеристики вручную. Геометрическая редукция по СП 260 к этому режиму не относится.');
   if(s.snipPurpose==='deck'&&s.loadMode==='construction')throw Error('Для сверки по Пособию задайте готовые qd и qn. Автосбор опалубки доступен в варианте СНиП 3.03.01-87.');
   if(s.snipPurpose==='formwork'&&s.loadMode==='construction'&&s.mount<2.5-1e-9)throw Error('Для палубы по СНиП 3.03.01-87, прил. 11, п. 1г, нагрузка людей и транспорта должна быть не менее 2,5 кПа.');
   if(s.snipRebarDensity<0)throw Error('Плотность армирования не может быть отрицательной');
  }
  if(s.limitSource==='document'){s.limit=s.designCode==='sp'?200:s.snipPurpose==='formwork'?500:150;s.defLimitMode='relative';if(s.designCode==='sp')s.deflection='sp266';}
  let th=thickness(s),tableProfile=p;
 // Never scale or substitute catalogue properties without an engineering basis.
 if(s.profile!=='custom'&&Math.abs(s.nominalT-p.t)>1e-6)throw Error('Номинальная толщина не соответствует '+p.name+'. Выберите строку профиля нужной толщины.');
 if(s.basis==='catalogue'&&Math.abs(th.t-p.t)>1e-6)throw Error('Расчётная толщина '+th.t.toFixed(6)+' мм не соответствует строке '+p.name+'. Табличные W и I неприменимы к заданной толщине. Выберите явно геометрическую модель Н75 или введите подтверждённые характеристики вручную.');
 if(!(th.t>0)||th.t>th.core+1e-6)throw Error('Расчётная толщина должна быть положительной и не превышать толщину стальной основы.');
 let mass=s.massMode==='catalogue'?p.mass:s.massMode==='blank'?(7.85*th.core+th.coating/1000)*s.blankWidth/s.coverWidth:s.deckMass;
 if(!Number.isFinite(mass)||mass<=0||s.coverWidth<=0)throw Error('Проверьте массу и полезную ширину');s.deckMass=mass;
 if(s.basis!=='catalogue')s.steelT=th.t;
 return{s,p,th,mass,tableProfile};
 }
return {thickness,normalizeSettings,prepareProject};
})();
