// Document-derived readings and diagnostic comparisons. Existing engineering kernel is unchanged.
const DeckNomograms=(()=>{
 const data=DeckNomogramData;
 function chart(figure){const c=data.charts.find(c=>c.figure===Number(figure));if(!c)throw Error('Выберите рисунок 2–7');return c;}
 function profile(id){const p=data.profiles.find(p=>p.id===id);if(!p)throw Error('Неизвестная марка профиля СТО: '+id);return p;}
 function series(figure,id=chart(figure).profile){const s=chart(figure).series.find(s=>s.profile===id);if(!s)throw Error('Для выбранного профиля нет кривой на рисунке '+figure);return s;}
 function fromTotalThickness(figure,totalMm,id=chart(figure).profile){
  const ref=profile(series(figure,id).profile),g=DeckInputs.slabGeometry(totalMm,ref.height);
  read(figure,g.coverCm,id);
  return g;
 }
 function read(figure,coverCm,id){
  const s=series(figure,id),x=Number(coverCm),p=s.points;
  if(!Number.isFinite(x)||x<p[0][0]||x>p.at(-1)[0])throw Error('Графики доступны только для слоя бетона над настилом 5–40 см; экстраполяция запрещена.');
  let i=p.findIndex(a=>a[0]>=x);if(p[i][0]===x)return {span:p[i][1],interpolated:false,tolerance:data.readingToleranceM};
  const [x0,y0]=p[i-1],[x1,y1]=p[i];return {span:y0+(y1-y0)*(x-x0)/(x1-x0),interpolated:true,tolerance:data.readingToleranceM};
 }
 function validateScenario(density,bearing){
  for(const [name,v] of Object.entries({density,bearing}))if(!Number.isFinite(v)||v<=0)throw Error('Положительное число: '+name);
  if(bearing>=30000)throw Error('Ширина опоры должна быть меньше 30000 мм.');
 }
 function settings(figure,coverCm,density=2500,bearing=300,deflection='sp266',id=chart(figure).profile){
  const c=chart(figure),ref=profile(series(figure,id).profile),p=DeckEngine.catalogue[ref.catalogueKey];
  validateScenario(density,bearing);
  read(figure,coverCm,id);
  if(!p)throw Error('Для '+ref.name+' в текущем ядре нет подтверждённой геометрии гофра и опорных характеристик. Данные таблицы 1 СТО не подставляются вместо них.');
  const H=Number(coverCm)*10+p.h,top=c.orientation==='up'?p.bw:p.bn,bot=c.orientation==='up'?p.bn:p.bw;
  const heq=H-p.h+(p.p-top+bot)/(2*p.p)*p.h;
  const qb=density*DeckEngine.G/1000*heq/1000,qarm=heq/1000,qg=p.mass*DeckEngine.G/1000,mount=.5;
  // Specified comparison scenario: gamma_f from the current SP load collector.
  // The source does not state all parameters used to construct its diagrams.
  const qn=qb+qarm+qg+mount,qd=1.2*(qb+qarm)+1.05*qg+1.3*mount;
  return {input:{...DeckEngine.defaults,projectName:'Сопоставление с рисунком '+figure+' СТО 0047-2005',profile:ref.catalogueKey,basis:'catalogue',nominalT:p.t,steelT:p.t,thicknessBasis:'steel',thicknessMode:'nominal',precision:'high',accountTolerance:false,n:c.spans,orientation:c.orientation,H,density,bearing,loadMode:'manual',manualD:qd,manualN:qn,concreteMode:'manual',concreteInput:qb,deckMass:p.mass,massMode:'manual',mount,own:true,pond:false,grade:'manual',Ry:245,E:206000,gc:1,gn:1,limitSource:'user',limit:200,defLimitMode:'relative',deflection,supportConfirmed:false},loads:{heq,qb,qarm,qg,mount,qn,qd}};
 }
 const utilization=r=>Math.max(r.strength,r.stiffness);
 function spanLimit(input){
  let lo=Math.max(.1,input.bearing/1000+.001),hi=Math.max(1,lo*2);
  if(lo>=30)throw Error('Ширина опоры не позволяет искать пролёт в диапазоне ядра до 30 м.');
  const at=L=>DeckEngine.calculate({...input,L});
  if(utilization(at(lo))>1)return {span:null,status:'below-range'};
  hi=Math.min(30,hi);
  while(utilization(at(hi))<=1&&hi<30)hi=Math.min(30,hi*2);
  if(utilization(at(hi))<=1)return {span:null,status:'above-range'};
  for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(utilization(at(mid))>1)hi=mid;else lo=mid;}
  const span=(lo+hi)/2,r=at(span);return {span,status:'bracketed',strength:r.strength,stiffness:r.stiffness};
 }
 function compare({figure=2,profile:id=chart(figure).profile,coverCm=20,density=2500,bearing=300,trialSpan=null}={}){
  const c=chart(figure),s=series(figure,id),ref=profile(s.profile),reading=read(figure,coverCm,id),L=trialSpan===null?reading.span:Number(trialSpan);
  validateScenario(density,bearing);
  if(!Number.isFinite(L)||L<=0||L>30)throw Error('Пролёт для проверки: 0–30 м, больше нуля.');
  const base={figure:c.figure,pdfPage:c.pdfPage,printedPage:c.printedPage,profile:id,legendLabel:s.legendLabel,spans:c.spans,orientation:c.orientation,coverCm:Number(coverCm),reading,trialSpan:L,nomogramSpanRatio:L/reading.span,sourceSection:ref.source};
  if(!ref.catalogueKey||!DeckEngine.catalogue[ref.catalogueKey])return {...base,status:'missing-profile-data',message:'Нет подтверждённой геометрии гофра и данных для опорных проверок в текущем ядре. Пролёт прочитан по СТО; численное сравнение с ядром не выполнено.',missing:['Шаг гофра','Размеры широкой и узкой полок','Подтверждённые данные для опорных проверок'],loads:null,models:null};
  const models={};let loads;
  for(const deflection of ['sp266','elastic']){
   const s=settings(figure,coverCm,density,bearing,deflection,id);loads=s.loads;
   const r=DeckEngine.calculate({...s.input,L}),limit=spanLimit(s.input);
   models[deflection]={input:{...s.input,L},qd:r.qd,qn:r.qn,I:r.I,Wplus:r.wp,Wminus:r.wm,positiveM:r.u.pos.v,negativeM:r.u.neg.v,maxV:r.u.Vmax,reactions:r.u.R,deflection:r.fn,allowedDeflection:r.fu,strength:r.strength,stiffness:r.stiffness,scope:r.scope,warnings:r.warnings,limit,relativeSpanDifferencePercent:limit.span===null?null:100*(limit.span/reading.span-1)};
  }
  return {...base,status:'compared',loads,models};
 }
 function cases({figure,profile:id,coverValues=[10,20,30],...options}={}){
  const charts=figure===undefined?data.charts:[chart(figure)];
  if(id!==undefined){profile(id);if(!charts.some(c=>c.series.some(s=>s.profile===id)))throw Error('Нет выбранного профиля на указанных рисунках.');}
  return charts.flatMap(c=>c.series.filter(s=>id===undefined||s.profile===id).flatMap(s=>coverValues.map(coverCm=>compare({...options,figure:c.figure,profile:s.profile,coverCm,trialSpan:null}))));
 }
 function sections(){return data.profiles.map(p=>{
  const c=DeckEngine.catalogue[p.catalogueKey];
  return {profile:p.id,name:p.name,source:p.source,current:c?{Iup:c.Iwide||c.I,Idown:c.I,mass:c.mass}:null,relativeIupDifferencePercent:c?100*((c.Iwide||c.I)/p.source.Icm4-1):null};
 });}
 function reference(r){
  const limits=[
   'Справочно сопоставлены вердикты о допустимости заданного пролёта, а не численное совпадение предельных пролётов или нормативных методик.',
   'Номограммы СТО относятся к стадии бетонирования без временных подпорок, с подачей смеси бетононасосом. Все исходные коэффициенты, плотность и опорные условия их построения не восстановлены.',
   'Точность чтения ±0,05 м — рабочая оценка оцифровки, а не нормативный допуск. Справочный результат не изменяет проверки основного расчёта.'
  ];
  const unavailable=message=>({status:'unavailable',title:'Справочное сравнение не выполнено',message,limits});
  const s=r?.s,p=r?.p;if(!s||!p)return unavailable('Нет результата основного расчёта.');
  const ref=data.profiles.find(x=>x.id===s.profile);
  if(!ref)return unavailable('Для выбранной марки профиля нет оцифрованной номограммы; характеристики другого профиля не подставляются.');
  const c=data.charts.find(x=>x.spans===s.n&&x.orientation===s.orientation);
  if(!c)return unavailable('Рисунки 2–7 содержат только схемы с 1–3 пролётами.');
  const curve=c.series.find(x=>x.profile===s.profile);
  if(!curve)return unavailable('Для выбранного профиля и ориентации кривая в источнике отсутствует.');
  if(p.equal)return unavailable('Для профиля с равными полками соответствие осей ГОСТ и СТО отдельно не подтверждено.');
  if(p.h!==ref.height)return unavailable('Высота профиля основного расчёта не совпадает с обозначением профиля номограммы.');
  let geometry,reading;
  try{geometry=fromTotalThickness(c.figure,s.H,s.profile);reading=read(c.figure,geometry.coverCm,s.profile);}
  catch(e){return unavailable(e.message);}
  if(!Number.isFinite(s.L)||s.L<=0||typeof r.strength!=='number'||typeof r.stiffness!=='number'||Number.isNaN(r.strength)||Number.isNaN(r.stiffness))return unavailable('Недостаточно численных результатов для справочного сравнения.');
  const actualSpanMm=s.L*1000,nomogramSpanMm=reading.span*1000,toleranceMm=reading.tolerance*1000;
  const enginePassed=r.strength<=1+1e-9&&r.stiffness<=1+1e-9;
  // The extra 1e-6 mm only absorbs floating-point round-off at the reading bounds.
  const nomogramPassed=actualSpanMm<nomogramSpanMm-toleranceMm-1e-6?true:actualSpanMm>nomogramSpanMm+toleranceMm+1e-6?false:null;
  const status=nomogramPassed===null?'boundary':enginePassed===nomogramPassed?'consistent':'different';
  const title=status==='boundary'?'Пролёт находится в пределах точности чтения номограммы':status==='consistent'?'Оценки допустимости заданного пролёта согласуются':'Оценки допустимости заданного пролёта расходятся';
  if(s.mount!==.5)limits.push('В основном расчёте монтажная нагрузка '+s.mount+' кПа; графики СТО построены для бетононасоса (0,5 кПа).');
  if(s.loadMode==='manual')limits.push('В основном расчёте заданы готовые нагрузки qd/qn; их соответствие исходным нагрузкам номограммы не установлено.');
  const basisName={catalogue:'сечение по ГОСТ',geometry:'геометрическая модель СП 260',manual:'характеристики сечения вручную'}[s.basis];
  limits.push('Основной расчёт: '+(r.code?.short||(s.designCode==='snip'?'СНиП':'СП'))+'; '+basisName+'; Ry = '+s.Ry+' МПа; E = '+s.E+' МПа. СТО указывает Ry = 235,3596 МПа и E = 205939,65 МПа; характеристики и редукция сечения могут отличаться.');
  return {status,title,figure:c.figure,printedPage:c.printedPage,pdfPage:c.pdfPage,legendLabel:curve.legendLabel,orientation:c.orientation,geometry,reading,actualSpanMm,nomogramSpanMm,toleranceMm,enginePassed,nomogramPassed,limits};
 }
 return {data,chart,profile,series,read,fromTotalThickness,settings,spanLimit,compare,cases,sections,reference};
})();
