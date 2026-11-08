'use strict';
let stoLastResult=null,stoLastCases=null,stoZoomLevel=null;
const stoFmt=(v,n=2)=>Number.isFinite(v)?v.toLocaleString('ru-RU',{minimumFractionDigits:n,maximumFractionDigits:n}):'не определено';
function stoScenarioControls(){return {figure:Number($('stoFigure').value),profile:$('stoProfile').value,density:Number($('stoDensity').value),bearing:Number($('stoBearing').value),trialSpan:$('stoSpan').value===''?null:Number($('stoSpan').value)/1000};}
function stoTotalMm(){return $('stoTotal').value===''?NaN:Number($('stoTotal').value);}
function stoControls(){const o=stoScenarioControls(),g=DeckNomograms.fromTotalThickness(o.figure,stoTotalMm(),o.profile);return {...o,coverCm:g.coverCm};}
function stoUpdateSlab(){
 const c=DeckNomograms.chart($('stoFigure').value),s=DeckNomograms.series(c.figure,$('stoProfile').value),p=DeckNomograms.profile(s.profile),H=stoTotalMm();
 const min=p.height+s.points[0][0]*10,max=p.height+s.points.at(-1)[0]*10;
 $('stoTotal').min=min;$('stoTotal').max=max;
 $('stoCover').value=Number.isFinite(H)?Number((H-p.height).toPrecision(14)):'';
 $('stoGeometryInfo').textContent=`h профнастила = ${stoFmt(p.height,0)} мм · по номограмме: ${stoFmt((H-p.height)/10,3)} см · диапазон H: ${stoFmt(min,0)}–${stoFmt(max,0)} мм`;
 try{DeckNomograms.fromTotalThickness(c.figure,H,s.profile);$('stoTotal').removeAttribute('aria-invalid');}
 catch(e){$('stoTotal').setAttribute('aria-invalid','true');$('stoError').textContent=e.message;}
}
function stoClear(){stoLastResult=null;stoLastCases=null;$('stoResults').hidden=true;$('stoCases').innerHTML='';$('stoError').textContent='';}
function stoProfiles(){
 const c=DeckNomograms.chart($('stoFigure').value),previous=$('stoProfile').value;
 const options=c.series.map(s=>`<option value="${s.profile}">${esc(s.legendLabel)}${DeckNomograms.profile(s.profile).catalogueKey?'':' · только график'}</option>`).join('');
 const selected=c.series.some(s=>s.profile===previous)?previous:c.profile;
 for(const id of ['stoProfile','stoProfileTop']){$(id).innerHTML=options;$(id).value=selected;}
 $('stoFigureTop').value=c.figure;
}
function stoImage(){
 const c=DeckNomograms.chart($('stoFigure').value),s=DeckNomograms.series(c.figure,$('stoProfile').value),source=$('stoImageTemplates').content.querySelector(`[data-figure="${c.figure}"]`);
 const src=source.getAttribute('src');
 if($('stoImage').getAttribute('src')!==src){$('stoFigureDetails').open=false;stoSetZoom(null);$('stoImage').src=src;}
 $('stoImage').alt=`СТО 0047-2005, рисунок ${c.figure}, страница ${c.printedPage}`;
 $('stoImageLink').href=source.getAttribute('src');$('stoImageLink').download=c.image;
 $('stoFigureInfo').textContent=`Рисунок ${c.figure} · с. ${c.printedPage} (PDF ${c.pdfPage}) · ${c.spans} пролёт(а) · ${c.series.length} серий. Выбрана кривая ${s.legendLabel}.`;
 $('stoSelectedCurve').textContent=`Рисунок ${c.figure} · ${s.legendLabel} · ${c.spans} пролёт(а)`;
 const h=DeckNomograms.profile(s.profile).height;
 $('stoPoints').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Бетон над настилом, см · шкала СТО</th>${s.points.map(p=>`<th>${p[0]}</th>`).join('')}</tr></thead><tbody><tr><th>L графика, м ± ${stoFmt(DeckNomograms.data.readingToleranceM)}</th>${s.points.map(p=>`<td>${stoFmt(p[1])}</td>`).join('')}</tr></tbody><tfoot><tr><th>Общая толщина H, мм · вычислено</th>${s.points.map(p=>`<td>${stoFmt(h+10*p[0],0)}</td>`).join('')}</tr></tfoot></table></div>`;
 stoUpdateSlab();
}
function stoZoomSync(){
 const img=$('stoImage'),width=img.getBoundingClientRect().width,scale=stoZoomLevel??(width&&img.naturalWidth?width/img.naturalWidth:1);
 $('stoZoomValue').value=Math.round(scale*100)+'%';
 $('stoZoom').disabled=!img.naturalWidth||scale>=4;
 $('stoZoomOut').disabled=!img.naturalWidth||scale<=.1;
 $('stoFit').disabled=stoZoomLevel===null;
}
function stoSetZoom(level){
 const img=$('stoImage');stoZoomLevel=level===null?null:Math.max(.1,Math.min(4,level));
 img.classList.toggle('stoFullSize',stoZoomLevel!==null);
 img.style.width=stoZoomLevel===null?'':img.naturalWidth*stoZoomLevel+'px';
 if(stoZoomLevel===null){$('stoImageViewport').scrollLeft=0;$('stoImageViewport').scrollTop=0;}
 stoZoomSync();
}
function stoScaleImage(factor){
 const img=$('stoImage');if(!img.naturalWidth)return;
 const scale=stoZoomLevel??img.getBoundingClientRect().width/img.naturalWidth;
 if(scale>0)stoSetZoom(scale*factor);
}
function stoTable(results,both=false){return `<div class="tablewrap"><table><thead><tr><th>Рис. / профиль / общая толщина H</th><th>Пролёт по номограмме, м</th><th>${both?'Пролёт: прогиб по СП 266, м':'Пролёт по расчёту (сценарий), м'}</th><th>Разница, %</th>${both?'<th>Пролёт: упругая линия, м</th><th>Разница, %</th>':''}</tr></thead><tbody>${results.map(r=>`<tr><td>${r.figure} / ${esc(r.legendLabel)} / H = ${stoFmt(DeckNomograms.profile(r.profile).height+10*r.coverCm)} мм<br>Над настилом: ${stoFmt(r.coverCm*10)} мм</td><td>${stoFmt(r.reading.span)} ± ${stoFmt(r.reading.tolerance)}</td>${r.status==='compared'?`<td>${stoFmt(r.models.sp266.limit.span)}</td><td>${stoFmt(r.models.sp266.relativeSpanDifferencePercent,1)}</td>${both?`<td>${stoFmt(r.models.elastic.limit.span)}</td><td>${stoFmt(r.models.elastic.relativeSpanDifferencePercent,1)}</td>`:''}`:`<td colspan="${both?4:2}" class="warn">Нет данных для сравнения с расчётом</td>`}</tr>`).join('')}</tbody></table></div>`;}
function stoCheckTable(rows,caption){
 const ki=v=>`<span class="${v>1+1e-9?'bad':'good'}">${stoFmt(v,3)}</span>${v>1+1e-9?' <span class="resultpill fail">Не выполнено</span>':''}`;
 return `<div class="tablewrap"><table class="stoCheckTable"><caption>${esc(caption)}</caption><thead><tr>${rows.length>1?'<th>Расчёт прогиба</th>':''}<th>КИ прочности</th><th>Прогиб, мм</th><th>Допустимо, мм</th><th>КИ прогиба</th></tr></thead><tbody>${rows.map(([name,m])=>`<tr>${rows.length>1?`<td>${esc(name)}</td>`:''}<td>${ki(m.strength)}</td><td>${stoFmt(m.deflection)}</td><td>${stoFmt(m.allowedDeflection)}</td><td>${ki(m.stiffness)}</td></tr>`).join('')}</tbody></table></div>`;
}
function stoCalculationDetails(r){
 const a=r.models.sp266,b=r.models.elastic,pond=Math.max(a.deflection,b.deflection)>20;
 return `<details class="stoDisclosure" id="stoCalculationDetails"><summary>Подробности расчёта и два способа определения прогиба${pond?' · требуется проверка добавочного бетона':''}</summary>
 <p>Пролёт по расчёту — граница, на которой максимальный КИ из реализованных проверок прочности и прогиба достигает 1. В основной таблице используется существующий вариант прогиба по СП 266 с коэффициентом k₂.</p>
 <p>k₂ — коэффициент в формуле прогиба СП 266. «Упругая линия» — второй, аналитический расчёт прогиба балки при одновременной равномерной нагрузке на все пролёты. Проверки прочности у этих вариантов одинаковы: если определяет прочность, найденные пролёты совпадают. Для одного пролёта сами формулы прогиба также близки; для нескольких пролётов разница может быть существенной. Упругий вариант сохранён для анализа и не заменяет проверку по СП 266.</p>
 ${stoTable([r],true)}
 <p>Отношение проверяемого L к L номограммы = ${stoFmt(r.nomogramSpanRatio,3)} (не КИ прочности). ${r.reading.interpolated?'Линейная интерполяция между точками графика.':'Узел исходного графика.'}</p>
 <p>hэкв = ${stoFmt(r.loads.heq)} мм; qбет = ${stoFmt(r.loads.qb,3)}, qарм = ${stoFmt(r.loads.qarm,3)}, qнастил = ${stoFmt(r.loads.qg,3)}, qмонтаж = 0,500 кПа. qn = ${stoFmt(r.loads.qn,3)}, qd = ${stoFmt(r.loads.qd,3)} кПа.</p>
 ${stoCheckTable([['По СП 266 (k₂)',a],['Упругая линия',b]],'Оба способа при пролёте '+stoFmt(r.trialSpan*1000,0)+' мм')}
 <p>Граница найдена по максимуму реализованных проверок с условно принятой опорой; это не подтверждённый предел по СТО. Дополнительный бетон от прогиба в сценарий не включён. ${pond?'Прогиб превышает 20 мм: по п. 7.1.1.3 СТО требуется отдельно проверить добавочный вес бетона.':''}</p>
 <h4>Ограничения и предупреждения</h4>${[...new Set([...a.scope,...a.warnings,...b.scope,...b.warnings])].map(x=>`<p>${esc(x)}</p>`).join('')}</details>`;
}
function stoCompare(){
 try{
  stoImage();const r=DeckNomograms.compare(stoControls());stoLastResult=r;$('stoError').textContent='';
  if(r.status!=='compared'){
   $('stoResults').innerHTML=stoTable([r])+`<details class="stoDisclosure"><summary>Каких данных недостаточно</summary><p>${esc(r.message)} Требуются: ${r.missing.map(esc).join('; ')}. Характеристики полного сечения из таблицы 1 приведены ниже как справочные.</p><p>Проверяемый пролёт: ${stoFmt(r.trialSpan*1000,0)} мм; L/L номограммы = ${stoFmt(r.nomogramSpanRatio,3)} (не КИ прочности).</p></details>`;
  }else{
   $('stoResults').innerHTML=stoTable([r])+stoCheckTable([['По СП 266 (k₂)',r.models.sp266]],'Проверки сценария при пролёте '+stoFmt(r.trialSpan*1000,0)+' мм')+stoCalculationDetails(r);
  }
  $('stoResults').hidden=false;
 }catch(e){stoLastResult=null;$('stoResults').hidden=true;$('stoError').textContent=e.message;}
}
function stoCases(){
 try{
  const o=stoScenarioControls(),scope=$('stoCaseScope').value,filter=scope==='figure'?{figure:o.figure}:scope==='profile'?{profile:o.profile}:{};
  stoLastCases=DeckNomograms.cases({...filter,density:o.density,bearing:o.bearing});
  const ready=stoLastCases.filter(r=>r.status==='compared').length;
  $('stoCases').innerHTML=`<p>Всего случаев: ${stoLastCases.length}; сравнено с ядром: ${ready}; только чтение графика: ${stoLastCases.length-ready}. Бетон над настилом: 100, 200 и 300 мм; общая H равна этому слою плюс высота профиля.</p>`+stoTable(stoLastCases)+`<details class="stoDisclosure"><summary>Оба способа расчёта прогиба для набора</summary>${stoTable(stoLastCases,true)}</details>`;
 }catch(e){stoLastCases=null;$('stoCases').innerHTML='';$('stoError').textContent=e.message;}
}
function stoExport(all=false){
 stoCompare();if(!stoLastResult)return;
 if(all){stoCases();if(!stoLastCases)return;}
 const withGeometry=r=>({...r,geometry:DeckInputs.slabGeometry(DeckNomograms.profile(r.profile).height+r.coverCm*10,DeckNomograms.profile(r.profile).height)});
 downloadFile('sto0047_comparison.json',JSON.stringify({format:'profnastil-sto-comparison',version:2,source:DeckNomograms.data.document,sha256:DeckNomograms.data.sha256,assumptions:{density:stoControls().density,bearing:stoControls().bearing,rebarKNm3:1,mountKPa:.5,gammaF:{deck:1.05,concrete:1.2,rebar:1.2,mount:1.3},RyMPa:245,EMPa:206000,limit:'L/200',pond:false},result:withGeometry(stoLastResult),cases:all?stoLastCases.map(withGeometry):undefined,sections:DeckNomograms.sections()},null,2),'application/json;charset=utf-8');
}
function stoSections(){
 $('stoSections').innerHTML=`<div class="tablewrap"><table><thead><tr><th>Профиль таблицы 1</th><th>F, см²</th><th>I СТО, см⁴/м</th><th>W₁ СТО, см³/м</th><th>W₂ СТО, см³/м</th><th>Масса СТО, кг/м²</th><th>I каталога ↑ / ↓, см⁴/м</th><th>ΔI ↑, %</th><th>Масса каталога, кг/м²</th></tr></thead><tbody>${DeckNomograms.sections().map(r=>`<tr><td>${esc(r.name)}</td><td>${stoFmt(r.source.areaCm2)}</td><td>${stoFmt(r.source.Icm4,3)}</td><td>${stoFmt(r.source.W1cm3,3)}</td><td>${stoFmt(r.source.W2cm3,3)}</td><td>${stoFmt(r.source.massKgM2,1)}</td>${r.current?`<td>${stoFmt(r.current.Iup)} / ${stoFmt(r.current.Idown)}</td><td>${stoFmt(r.relativeIupDifferencePercent,1)}</td><td>${stoFmt(r.current.mass,1)}</td>`:'<td colspan="3">Нет строки в текущем каталоге</td>'}</tr>`).join('')}</tbody></table></div>`;
}
function initNomograms(){
 $('stoZoom').addEventListener('click',()=>stoScaleImage(1.25));
 $('stoZoomOut').addEventListener('click',()=>stoScaleImage(1/1.25));
 $('stoFit').addEventListener('click',()=>stoSetZoom(null));
 $('stoImage').addEventListener('load',()=>stoSetZoom(stoZoomLevel));
 $('stoFigureDetails').addEventListener('toggle',stoZoomSync);
 window.addEventListener('resize',stoZoomSync);
 const figures=DeckNomograms.data.charts.map(c=>`<option value="${c.figure}">Рисунок ${c.figure} · ${c.spans} пролёт(а) · ${c.orientation==='up'?'широкая полка вверх · без «п»':'широкая полка вниз · «п»'}</option>`).join('');
 for(const id of ['stoFigure','stoFigureTop']){
  $(id).innerHTML=figures;
  $(id).addEventListener('change',()=>{$('stoFigure').value=$(id).value;$('stoFigureTop').value=$(id).value;stoClear();stoProfiles();stoCompare()});
 }
 for(const id of ['stoProfile','stoProfileTop'])$(id).addEventListener('change',()=>{const value=$(id).value;$('stoProfile').value=value;$('stoProfileTop').value=value;stoClear();stoCompare()});
 $('stoRun').addEventListener('click',stoCompare);$('stoRunCases').addEventListener('click',stoCases);
 $('stoExport').addEventListener('click',()=>stoExport());$('stoExportCases').addEventListener('click',()=>stoExport(true));
 $('stoExportReadings').addEventListener('click',()=>downloadFile('sto0047_readings.json',JSON.stringify(DeckNomograms.data,null,2),'application/json;charset=utf-8'));
 for(const id of ['stoTotal','stoDensity','stoBearing','stoSpan'])$(id).addEventListener('input',()=>{stoClear();if(id==='stoTotal')stoUpdateSlab();});
 $('stoCaseScope').addEventListener('change',()=>{stoLastCases=null;$('stoCases').innerHTML='';});
 stoProfiles();stoSections();stoCompare();
}
