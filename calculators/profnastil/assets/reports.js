'use strict';
const DeckReport=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const f=(x,n=2)=>x===Infinity?'не определяется':Number.isFinite(x)?x.toLocaleString('ru-RU',{minimumFractionDigits:n,maximumFractionDigits:n}):'—';
 const css=`
.report-page{box-sizing:border-box;position:relative;width:210mm;height:297mm;padding:25mm 10mm;background:white;color:#111;font:14pt/1.14 "Times New Roman","Liberation Serif",serif;margin:18px auto;box-shadow:0 2px 12px #0002;overflow:hidden}.report-page *{box-sizing:border-box}.report-body{height:247mm;overflow:visible}.report-running{position:absolute;top:12mm;left:10mm;right:10mm;display:flex;justify-content:space-between;gap:12px;border-bottom:.25mm solid #111;padding:0 0 3mm;font:11pt "Times New Roman",serif}.report-running span:first-child{max-width:40%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.report-footer{position:absolute;bottom:13mm;left:10mm;right:10mm;text-align:center;border-top:.25mm solid #111;padding-top:1mm;font:12pt "Times New Roman",serif}.report-page h1{font:700 18pt/1.16 "Times New Roman",serif;margin:0 0 5mm;color:#000}.report-page h2{font:700 16pt/1.16 "Times New Roman",serif;margin:5mm 0 3mm;color:#000}.report-page h3{font:700 14pt/1.16 "Times New Roman",serif;margin:4mm 0 2mm;color:#000}.report-page p{margin:0 0 3mm;overflow-wrap:break-word}.report-page .rformula{font:14pt/1.4 "Cambria Math","Times New Roman",serif;text-align:center;margin:3mm 0 4mm;overflow-wrap:break-word}.report-page sub,.report-page sup{font-size:72%}.report-table{margin:3mm 0 4mm}.report-page table{width:100%;border-collapse:collapse;table-layout:fixed;font:12pt/1.15 "Times New Roman",serif}.report-page th,.report-page td{border:.25mm solid #111;padding:1.8mm 2mm;vertical-align:middle;overflow-wrap:break-word}.report-page th{background:#f1f1f1;color:#111;font-weight:bold;text-align:center}.report-page td.num{text-align:right;font-variant-numeric:tabular-nums}.report-page caption{caption-side:top;text-align:center;padding:0 0 2mm;font:12pt "Times New Roman",serif;color:#111}.report-page .rnote{font:11pt/1.22 "Times New Roman",serif;margin:2mm 0 4mm}.report-page .rfigure{margin:3mm 0 4mm}.report-page .rfigure svg{width:100%;height:auto;display:block}.report-page .rfigure figcaption{text-align:center;font:11pt/1.15 "Times New Roman",serif;margin:2mm 0}.report-page svg text{font:12px Arial,sans-serif;fill:#33485c}.report-page .chart .grid{stroke:#dce2e8;stroke-width:1}.report-page .chart .axis{stroke:#8197ac;stroke-width:1}.report-page .chart .blue{stroke:#185cbd;fill:none;stroke-width:2.4}.report-page .ext-label{paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round;fill:#163f6e;font-weight:700}.report-page .ext-leader{stroke:#47759b;stroke-width:1;fill:none}.report-page .ext-dot{fill:#185cbd;stroke:white;stroke-width:1.5}.report-page .rpass{color:#08653b}.report-page .rfail{color:#b00020}.report-cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;height:100%}.report-cover h1{font-size:25pt;margin:0 0 16mm}.report-cover h2{font-size:18pt;margin:0 0 10mm}.report-cover p{max-width:170mm}.report-cover .cover-meta{margin-top:20mm;font-size:13pt}.report-toc a{display:flex;justify-content:space-between;gap:5mm;text-decoration:none;color:inherit;border-bottom:.2mm dotted #999;padding:1.1mm 0;font:12pt/1.1 "Times New Roman",serif}.report-toc a[data-level="2"]{margin-left:5mm}.report-toc a[data-level="3"]{margin-left:10mm}.report-page .rsources{font-size:12pt;line-height:1.22}.report-page .rsources p{margin-bottom:3mm}.report-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px;background:#14283f;color:white;font:14px Arial,sans-serif}.report-toolbar button{font:600 14px Arial,sans-serif;padding:9px 15px;border:0;border-radius:6px;background:white;color:#14283f;cursor:pointer}.report-toolbar small{font-size:12px}.report-toolbar button:disabled{opacity:.6;cursor:wait}@media(max-width:820px){.report-page{margin:12px 0}.report-toolbar{position:sticky;left:0;width:100vw}}@media print{@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:white!important}.report-toolbar{display:none!important}.report-page{margin:0!important;box-shadow:none!important;break-after:page}.report-page:last-child{break-after:auto}.report-page th{print-color-adjust:exact}}
`;
 function model(r,fig={}){
  const s=r.s,p=r.p,h=r.th,sp=s.designCode==='sp',geom=s.basis==='geometry',blocks=[];
  const put=(html,kind='block',id='')=>blocks.push({html,kind,id});
  const H=(level,text,id)=>put(`<h${level} id="${id}">${text}</h${level}>`,'heading',id);
  const P=(text,small=false)=>put(`<p${small?' class="rnote"':''}>${text}</p>`);
  const F=text=>put(`<div class="rformula">${text}</div>`);
  let tn=0,fn=0;
  const T=(caption,heads,rows)=>put(`<div class="report-table"><table><caption>Таблица ${++tn}. ${caption}</caption><thead><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(rr=>`<tr>${rr.map((x,i)=>`<td${i?' class="num"':''}>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,'table');
  const FIG=(svg,caption)=>svg&&put(`<figure class="rfigure">${svg}<figcaption>Рисунок ${++fn}. ${caption}</figcaption></figure>`);
  const sub=(name,x,u='',n=2)=>`${name} = ${f(x,n)}${u?' '+u:''}`;
  const decision=k=>`<span class="${k>1+1e-9?'rfail':'rpass'}">${k>1+1e-9?'Не выполнено':'Выполнено'}</span>`;
  put(`<div class="report-cover"><h1>Отчёт по расчёту</h1><h2>Профилированный настил</h2><p>${esc(s.projectName)}</p><p><b>${esc(p.name)}</b><br>${p.equal?'Полка у оси 1–1':'Широкая полка'} ${s.orientation==='up'?'вверх':'вниз'}</p><p>${s.n} ${s.n===1?'пролёт':'пролёта'} по ${f(s.L*1000,0)} мм</p><p class="cover-meta">${esc(r.code.name)}<br>Расчётная полоса шириной 1 м<br>Версия ${DeckParameters.VERSION} · ${new Date().toLocaleDateString('ru-RU')}</p></div>`,'cover');
  put('<h1>Содержание</h1><nav class="report-toc"></nav>','toc');
  H(1,'1. Исходные данные','r1');H(2,'1.1. Сечение и материал','r11');
  P(`Профилированный лист: <b>${esc(p.name)}</b>, ${esc(p.standard)}. ${p.equal?'Полка у оси 1–1':'Широкая полка'} ориентирована ${s.orientation==='up'?'вверх':'вниз'}.`);
  P(`Номинальная толщина: ${f(h.nominal,4)} мм; ${s.thicknessBasis==='coated'?'номинал проката с цинковым покрытием':'номинал стальной основы'}. Класс покрытия: ${s.coating?'Z'+s.coating:'без покрытия'}. Точность по толщине: ${esc(({normal:'нормальная',increased:'повышенная',high:'высокая',manual:'по сертификату'})[s.precision])}.`);
  if(s.basis==='catalogue')P(`Толщина выбранной номинальной строки ГОСТ: t = ${f(r.t,4)} мм, ${esc(r.tableProfile?.name||p.name)}. W, I и опорные проверки используют эту строку. Покрытие и минусовой допуск не пересчитывают табличные характеристики. Для проверки уменьшенной толщины требуется отдельный геометрический расчёт либо подтверждённые характеристики.`,true);
  else {
   F(`t<sub>основы</sub> = ${s.thicknessBasis==='coated'?f(h.nominal,4)+' − '+f(h.tmp,4):f(h.nominal,4)} = ${f(h.core,4)} мм`);
   F(s.thicknessMode==='direct'?`t = ${f(r.t,4)} мм (готовая расчётная толщина)` :h.applied?`Δt = ${f(h.delta,3)} мм; Δt% = ${f(h.percent,3)}%<br>t = t<sub>основы</sub>(100 − Δt%)/95 = ${f(h.core,4)} × (100 − ${f(h.percent,3)})/95 = ${f(r.t,4)} мм`:`t = t<sub>основы</sub> = ${f(r.t,4)} мм; уменьшение по допуску ${s.accountTolerance?'не требуется при Δt% ≤ 5':'выключено'}`);
  }
  let dims=[['Высота профиля','h',f(p.h)+' мм'],['Шаг гофров','b',f(p.p)+' мм'],['Широкая полка','bwf',f(p.bw)+' мм'],['Узкая полка','btf',f(p.bn)+' мм']];
  if(geom){let hh=75-p.t,h1=(hh-7)/2+14;dims.push(['Высота по срединным линиям','hₘ',f(hh)+' мм'],['Радиус сопряжений','r',f(5)+' мм'],['Радиус ребра полки','rs',f(4)+' мм'],['Ширина / высота ребра полки','bs / hs','18,00 / 6,10 мм'],['Плоский участок полки','bp','37,00 мм'],['Высоты участков стенки','h₁ / hs₁ / h₃',f(h1)+' / 7,00 / '+f(hh-h1-7)+' мм'],['Угол наклона стенки','φ','78,86°']);}
  T('Основные размеры профиля',['Размер','Обозначение','Значение'],dims);
  FIG(fig.section,'Сечение профилированного листа');
  P(`Марка стали: ${s.grade==='manual'?'задана расчётным сопротивлением':esc(s.grade)}. Расчётное сопротивление R<sub>y</sub> = ${f(s.Ry,3)} МПа; модуль упругости E = ${f(s.E,0)} МПа; коэффициент Пуассона ν = 0,30.`);
  P(`Масса настила: ${f(s.deckMass,3)} кг/м²; источник — ${({manual:'ручной ввод',catalogue:'таблица ГОСТ',blank:'ширина заготовки'})[s.massMode]}. ${s.massMode==='blank'?'Ширина заготовки '+f(s.blankWidth,0)+' мм, полезная ширина '+f(s.coverWidth,0)+' мм.':''}`);
  if(s.massMode==='blank')F(`m = (7,85t<sub>основы</sub> + Z/1000)B<sub>заг</sub>/B<sub>пол</sub> = ${f(s.deckMass,3)} кг/м²`);
  H(2,'1.2. Расчётная схема','r12');
  P(`Схема: ${s.n===1?'однопролётная шарнирно опёртая':s.n+'-пролётная неразрезная'} балка с равными пролётами по ${f(s.L*1000,0)} мм. Жёсткость EI постоянна. Все пролёты загружены равномерно одновременно.`);
  P(`Конструкция опоры и полок: закреплённая на опоре. Локальная нагрузка: ${s.flanges==='two'?'на две полки':'на одну полку'}. Ширина опоры l<sub>b</sub> = ${f(s.bearing)} мм. Условия узла ${s.supportConfirmed?'подтверждены пользователем':'требуют подтверждения по узлу'}.`);
  FIG(fig.beam,'Расчётная схема и полные реакции опор');
  H(2,'1.3. Нагрузки и деформации','r13');
  if(s.loadMode==='construction'){
   P(`Сбор нагрузок выполняется по ${sp?'СП 266.1325800.2016, изменения № 1–4':'СНиП 3.03.01-87, исходная редакция, приложение 11'}. Полная высота перекрытия H = ${f(s.H)} мм. Плотность смеси ρ = ${f(s.density,0)} кг/м³.`);
   let top=s.orientation==='up'?p.bw:p.bn,bot=s.orientation==='up'?p.bn:p.bw;
   F(`h<sub>экв</sub> = H − h + (b − b<sub>верх</sub> + b<sub>низ</sub>)h/(2b)<br>= ${f(s.H)} − ${f(p.h)} + (${f(p.p)} − ${f(top)} + ${f(bot)}) × ${f(p.h)}/(2 × ${f(p.p)}) = ${f(r.heq)} мм`);
   F(`γ<sub>бет</sub> = ρg/1000 = ${f(s.density,0)} × 9,80665/1000 = ${f(r.gamma,4)} кН/м³<br>q<sub>бет</sub> = ${s.concreteMode==='manual'?'задано вручную':`h<sub>экв</sub>γ<sub>бет</sub>/1000`} = ${f(r.qb,4)} кПа`);
   T('Нагрузки на настил',['Нагрузка','qₙ, кПа','γf','В прогиб'],r.loadRows.map(a=>[esc(a.name),f(a.qn,4),f(a.gf),a.sls?'Да':'Нет']));
   F(`q<sub>d</sub> = ${r.loadRows.map(a=>f(a.gf)+' × '+f(a.qn,4)).join(' + ')} = ${f(r.qd,4)} кПа<br>q<sub>n</sub> = ${r.loadRows.filter(a=>a.sls).map(a=>f(a.qn,4)).join(' + ')} = ${f(r.qn,4)} кПа`);
   if(sp){P(`Проверка добавочного веса бетона: f<sub>бет</sub> = ${f(r.fb)} мм; H/10 = ${f(s.H/10)} мм. ${r.pondNeeded?(s.pond?'Добавка учтена.':'Добавка требуется; учёт выключен.'):'По этому критерию добавка не требуется.'}`);F(`Δq<sub>бет</sub> = ${r.pond>0?'0,7γ<sub>бет</sub>f<sub>бет</sub>/1000':'0'} = ${f(r.pond,4)} кПа`);}
  }else {
   P('Нагрузки введены целиком вручную. Собственный вес, технологические воздействия и требуемые добавки должны быть включены в заданные значения.');
   F(`q<sub>d</sub> = ${f(r.qd,4)} кПа; q<sub>n</sub> = ${f(r.qn,4)} кПа`);
  }
  F(`qd = ${f(r.qd,4)} / 9,80665 = ${f(r.qd/9.80665,4)} тс/м²<br>qn = ${f(r.qn,4)} / 9,80665 = ${f(r.qn/9.80665,4)} тс/м²`);
  F(`f<sub>u</sub> = ${s.defLimitMode==='absolute'?'заданный абсолютный предел':`L/${s.limit} = ${f(s.L*1000,0)}/${s.limit}`} = ${f(r.fu)} мм`);
  P(`Предел принят ${s.limitSource==='document'?'по выбранному документу':'пользователем'}. Внутренние усилия по ПС1 определяются от q<sub>d</sub>γ<sub>n</sub>, прогиб — от q<sub>n</sub>. Для полосы 1 м нагрузка 1 кПа численно равна 1 кН/м.`,true);
  H(2,'1.4. Коэффициенты надежности','r14');
  P(`Коэффициент условий работы: γ<sub>c</sub> = ${f(s.gc,3)}.`);P(`Коэффициент надежности по ответственности: γ<sub>n</sub> = ${f(s.gn,3)}.`);
  H(1,'2. Геометрические характеристики сечения','r2');H(2,'2.1. Полное сечение','r21');
  if(geom){const g=r.sec.gross;P('Полное сечение определено по геометрической модели срединных линий с приближённым учётом скруглений. Характеристики приведены на 1 м полезной ширины настила.');T('Полное сечение',['Характеристика','Значение'],[['Центр тяжести от срединной линии широкой полки, yc',f(g.yc)+' мм'],['Момент инерции, Ig',f(g.I)+' см⁴/м'],['Момент сопротивления широкой полки, Wg,wf',f(g.Ww)+' см³/м'],['Момент сопротивления узкой полки, Wg,tf',f(g.Wn)+' см³/м']]);}
  else P('Полное геометрическое сечение отдельно не вычисляется. В расчёте использованы характеристики табличной строки ГОСТ либо подтверждённые характеристики ручного ввода.');
  H(2,'2.2. Эффективное сечение','r22');
  P(geom?'Характеристики определены по СП 260.1325800.2023, исходная редакция. Площадь элемента жёсткости полки и его момент инерции вычислены по соответствующим расчётным полосам.':'Геометрическая редукция в этом режиме не выполняется. Для расчёта приняты следующие W и I.');
  const compSpan=s.orientation==='up'?'wide':'narrow',compSupport=s.orientation==='up'?'narrow':'wide';
  for(let [id,title,comp,mr,w] of [['r221','2.2.1. В пролёте',compSpan,r.MRp,r.wp],['r222','2.2.2. На опоре',compSupport,r.MRm,r.wm]]){
   H(3,title,id);
   if(geom){let z=r.sec[comp];T('Эффективные характеристики · '+(id==='r221'?'пролёт':'опора'),['Характеристика','Значение'],[['Сжата полка',comp==='wide'?'Широкая':'Узкая'],['Центр тяжести от срединной линии широкой полки, yc',f(z.yc)+' мм'],['Момент инерции, Ieff',f(z.I)+' см⁴/м'],['Момент сопротивления широкой полки, Weff,wf',f(z.Ww)+' см³/м'],['Момент сопротивления узкой полки, Weff,tf',f(z.Wn)+' см³/м'],['Принятый минимальный W',f(w)+' см³/м']]);
    if(comp==='wide')F(`A<sub>s</sub> = ${f(z.As,3)} мм²; I<sub>s</sub> = ${f(z.Is,3)} мм⁴; χ<sub>d</sub> = ${f(z.chi,4)}`);
   }else F(`W${id==='r221'?'<sub>+</sub>':'<sub>−</sub>'} = ${f(w)} см³/м; I<sub>расч</sub> = ${f(r.I)} см⁴/м`);
  }
  H(1,'3. Статический расчет','r3');H(2,'3.1. Внутренние усилия','r31');
  P(`Расчётная нагрузка на полосу 1 м: q = q<sub>d</sub>γ<sub>n</sub> = ${f(r.qd,4)} × ${f(s.gn,3)} = ${f(r.qd*s.gn,4)} кН/м.`);
  P('В формулах статического расчёта L и x заданы в мм; M — в Н·мм, V — в Н, q — в Н/мм. Значения усилий в таблицах приведены к кН·м/м и кН/м.',true);
  F('M<sub>i−1</sub> + 4M<sub>i</sub> + M<sub>i+1</sub> = −(q<sub>i−1</sub> + q<sub>i</sub>)L²/4<br>M(x) = M<sub>лев</sub> + V<sub>лев</sub>x − qx²/2; V(x) = V<sub>лев</sub> − qx');
  T('Максимальные усилия',['Величина','Значение','Координата x'],[['Положительный момент, M+',f(r.u.pos.v)+' кН·м/м',f(r.u.pos.x*1000,1)+' мм'],['Отрицательный момент, M−',f(r.u.neg.v)+' кН·м/м',f(r.u.neg.x*1000,1)+' мм'],['Односторонняя поперечная сила, max |V|',f(r.u.Vmax)+' кН/м','У опор'],['Полная реакция, max R',f(Math.max(...r.u.R))+' кН/м',f(r.u.R.indexOf(Math.max(...r.u.R))*s.L*1000,0)+' мм']] );
  P('V — односторонняя поперечная сила в листе; R — суммарная реакция опоры. На промежуточной опоре эти величины различаются. Координата x отсчитывается от левой крайней опоры.',true);
  FIG(fig.M,'Эпюра изгибающих моментов с экстремумами');FIG(fig.V,'Эпюра поперечных сил с односторонними значениями');
  H(2,'3.2. Несущая способность','r32');H(3,'3.2.1. Прочность на изгиб','r321');
  F(`M<sub>R,+</sub> = W<sub>+</sub>R<sub>y</sub>γ<sub>c</sub>/1000<br>= ${f(r.wp)} × ${f(s.Ry,3)} × ${f(s.gc,3)}/1000 = ${f(r.MRp)} кН·м/м`);
  F(`M<sub>R,−</sub> = W<sub>−</sub>R<sub>y</sub>γ<sub>c</sub>/1000<br>= ${f(r.wm)} × ${f(s.Ry,3)} × ${f(s.gc,3)}/1000 = ${f(r.MRm)} кН·м/м`);
  H(3,'3.2.2. Прочность на сдвиг','r322');
  if(sp&&r.lambda){
   P('Срез Н75 проверен консервативно без повышения устойчивости от продольного ребра стенки.');
   F(`λ<sub>w</sub> = 0,346(s<sub>d</sub>/t)√(R<sub>y</sub>/E)<br>= 0,346 × 80,22/${f(r.t,4)} × √(${f(s.Ry,3)}/${f(s.E,0)}) = ${f(r.lambda,4)}`);
   F(`R<sub>s</sub> = ${r.lambda<=.83?'0,58R<sub>y</sub>':r.lambda<1.4?'0,48R<sub>y</sub>/λ<sub>w</sub>':'0,67R<sub>y</sub>/λ<sub>w</sub>²'} = ${f(r.Rs,3)} МПа`);
   F(`V<sub>R</sub> = γ<sub>c</sub>h<sub>w</sub>tR<sub>s</sub> × 2/[b sin(φ)]<br>= ${f(s.gc,3)} × 74,10 × ${f(r.t,4)} × ${f(r.Rs,3)} × 2/[${f(p.p)} sin(78,86°)]<br>= ${f(r.VR)} кН/м`);
  }else if(sp&&r.VR)P(`Предельная поперечная сила задана пользователем с применением γc: V<sub>R</sub> = ${f(r.VR)} кН/м.`);
  else P('В выбранном режиме автоматическая проверка среза не реализована. Требуется отдельное подтверждение несущей способности стенки на сдвиг.');
  H(3,'3.2.3. Устойчивость стенки','r323');
  if(sp&&(r.Rend||r.Rinner)){
   if(r.lambda){let sf=s.orientation==='up'?19.93:48.46,bd=s.orientation==='up'?50:95.74;
    if(s.stiffener){P(`Элемент жёсткости стенки: e<sub>max</sub> = 5,67 мм; e<sub>min</sub> = 2,33 мм; s<sub>pF</sub> = ${f(sf)} мм; b<sub>d</sub> = ${f(bd)} мм.`);F(`k<sub>a,s</sub> = min(1,45 − 0,05e<sub>max</sub>/t; 0,95 + 35000t²e<sub>min</sub>/(s<sub>pF</sub>b<sub>d</sub>²)) = ${f(r.ka,4)}`);}else P('Продольное ребро стенки в местной проверке не учитывается: ka,s = 1.');
    const co=s.flanges==='two'?[[9,.12,.14,.040],[10,.11,.21,.020]]:[[3,.08,.70,.055],[8,.10,.17,.004]];
    T('Коэффициенты местной несущей способности',['Опора','C','Cr','Cb','Ch'],co.map((x,i)=>[i?'Промежуточная':'Крайняя',...x.map((v,j)=>f(v,j===0?0:3))]));
    F('R<sub>R</sub> = γ<sub>c</sub>Ct²R<sub>y</sub>sin(φ)(1 − C<sub>r</sub>√(r/t))<br>× (1 + C<sub>b</sub>√(l<sub>b</sub>/t))(1 − C<sub>h</sub>√(h<sub>flat</sub>/t))k<sub>a,s</sub> × 2/b');
    P(`Принято r = 5,00 мм; h<sub>flat</sub> = 75,52 мм; l<sub>b</sub> = ${f(s.bearing)} мм; φ = 78,86°. Множитель 2/b при b в мм приводит сопротивление к кН/м.`,true);
   }
   T('Предельные местные реакции',['Опора','RR, кН/м'],[['Крайняя',f(r.Rend)],['Промежуточная',f(r.Rinner)]]);
   F('КИ<sub>M+R</sub> = (|M<sub>грани</sub>|/M<sub>R</sub> + R/R<sub>R</sub>)/1,25 ≤ 1');
   T('Реакции и совместное действие с изгибом',['Опора','R, кН/м','|Mграни|, кН·м/м','RR, кН/м','КИ M+R'],r.supportRows.map(a=>[String(a.i+1),f(a.reaction),f(a.edgeM),f(a.cap),f(a.ki,3)]));
  }else if(!sp&&r.snipWalls?.length){
   P('Проверка по п. 25.13 Пособия к СНиП II-23-81*, издание 1989 г. Расчёт выполнен для отсеков стенки над промежуточными опорами.');
   F('z = min(l<sub>b</sub> + 2r; 1,5h); σ<sub>loc</sub> = 2B₀/(tz)<br>h<sub>пред</sub> = 585t/√σ<sub>c</sub> при α ≤ 0,5<br>h<sub>пред</sub> = 3,26t√{(2α−1)E / [σ<sub>c</sub>((2−α)(1+γ) + √(α²(1+γ)²+4β²))]} при α ≥ 1');
   P('Для 0,5 < α < 1 интерполированы предельные высоты при α = 0,5 и α = 1 с пересчётом γ и β в каждой конечной точке.',true);
   for(let w of r.snipWalls){P(`Опора ${w.i+1}: σ<sub>c</sub> = ${f(w.sc,3)} МПа; σ₁ = ${f(w.s1,3)} МПа; σ<sub>t</sub> = ${f(w.st,3)} МПа; B₀ = ${f(w.B0)} Н; z = ${f(w.z)} мм; σ<sub>loc</sub> = ${f(w.sloc,3)} МПа.`);T('Отсеки стенки · опора '+(w.i+1),['Отсек','α','τ, МПа','h, мм','hпред, мм','КИ'],w.panels.map(a=>[a.j,f(a.a,4),f(a.tau,3),f(a.h),f(a.limit),f(a.k,3)]));}
  }else P('Местная несущая способность в этом режиме для выбранного профиля автоматически не определена. См. условия применимости.');
  H(2,'3.3. Прогиб','r33');
  P(`Принят момент инерции I = ${f(r.I)} см⁴/м. ${geom?'Использован минимум эффективных I для двух знаков момента; постоянная жёсткость по длине.':'Источник — '+(s.basis==='manual'?'ручной ввод':'таблица профиля')+'.'}`);
  P('Для вычисления прогиба: L и x — мм; E — Н/мм²; I[мм⁴] = I[см⁴] × 10⁴. Для полосы 1 м q[кПа] численно равно q[Н/мм].',true);
  if(s.deflection==='sp266')F(`f = k₂q<sub>n</sub>L⁴/(EI)<br>= ${f(r.k,4)} × ${f(r.qn,4)} × ${f(s.L*1000,0)}⁴/[${f(s.E,0)} × ${f(r.I)} × 10⁴]<br>= ${f(r.fn)} мм`);
  else {F('EI·y(x) = −M<sub>лев</sub>x²/2 − V<sub>лев</sub>x³/6 + q<sub>n</sub>x⁴/24 + Cx<br>C = M<sub>лев</sub>L/2 + V<sub>лев</sub>L²/6 − q<sub>n</sub>L³/24');F(`f = max |y(x)| = ${f(r.fn)} мм при x = ${f(r.d.Fmax.x*1000,1)} мм`);}
  FIG(fig.f,'Упругая линия от нормативной нагрузки, экстремумы в мм');
  P(`Максимум упругой линии: ${f(Math.abs(r.d.Fmax.v)*1000)} мм. ${s.deflection==='sp266'?'На эпюре показана упругая линия полного равномерного загружения. В проверке по СП 266 использован приведённый выше прогиб по k₂: '+f(r.fn)+' мм.':'Эпюра соответствует выбранной расчётной модели прогиба.'}`,true);
  H(2,'3.4. Проверка по прочности','r34');
  T('Проверки первой группы предельных состояний',['Проверка','Действие','Предел','КИ','Итог'],r.checks.filter(a=>!a.sls).map(a=>[esc(a.name)+'<br><small>'+esc(a.unit)+'</small>',f(a.demand),f(a.capacity),f(a.k,3),decision(a.k)]));
  if(r.checks.some(a=>a.name.startsWith('M + V')))P('Совместное действие M + V проверено по сетке эпюры с понижением сопротивления изгибу в (1 − ρQ), ρQ = (2|V|/VR − 1)². Чистые экстремумы M и V вычислены аналитически.',true);
  F(`КИ<sub>ПС1</sub> = max(КИ реализованных проверок) = ${f(r.strength,3)} ${r.strength>1?'&gt;':'≤'} 1`);
  H(2,'3.5. Проверка по прогибам','r35');
  F(`КИ<sub>ПС2</sub> = f/f<sub>u</sub> = ${f(r.fn)}/${f(r.fu)} = ${f(r.stiffness,3)} ${r.stiffness>1?'&gt;':'≤'} 1`);
  P(`Условие по прогибам: ${decision(r.stiffness)}.`);
  H(1,'4. Результаты расчета','r4');
  T('Результаты расчета',['Величина','Значение'],[['Максимальный положительный момент',f(r.u.pos.v)+' кН·м/м'],['Максимальный отрицательный момент',f(r.u.neg.v)+' кН·м/м'],['Максимальная односторонняя поперечная сила V',f(r.u.Vmax)+' кН/м'],['Максимальная полная реакция опоры R',f(Math.max(...r.u.R))+' кН/м'],['Предельный изгибающий момент M+ / M−',f(r.MRp)+' / '+f(r.MRm)+' кН·м/м'],['Предельная поперечная сила VR',f(r.VR)+' кН/м'],['Предельная местная реакция RR (край / центр)',f(r.Rend)+' / '+f(r.Rinner)+' кН/м'],['Фактический расчётный прогиб',f(r.fn)+' мм'],['Предельный прогиб',f(r.fu)+' мм'],['Коэффициент использования по ПС1',f(r.strength,3)+' · '+decision(r.strength)],['Коэффициент использования по ПС2',f(r.stiffness,3)+' · '+decision(r.stiffness)]]);
  P(`По реализованным численным проверкам: <b>${r.strength>1+1e-9||r.stiffness>1+1e-9?'условия не выполнены':'условия выполнены'}</b>. Полнота вывода ограничена следующими условиями.`);
  for(let msg of [...new Set([...r.warnings,...r.scope])])P('• '+esc(msg),true);
  P('Расчёт выполнен для равных пролётов и одновременного равномерного загружения. Порядок бетонирования, сосредоточенные нагрузки, подпорки, крепления, отрыв и работа затвердевшей плиты требуют отдельных проверок.',true);
  
  H(1,'Список использованных источников','rSources');
  let sources=sp?['СП 260.1325800.2023 «Конструкции стальные тонкостенные из холодногнутых оцинкованных профилей и гофрированных листов». Исходная редакция 2023 г.; разделы 6–8.','СП 266.1325800.2016 «Конструкции сталежелезобетонные. Правила проектирования». Редакция с изменениями № 1–4; раздел 6.']:['Пособие по проектированию стальных конструкций к СНиП II-23-81*. ЦНИИСК им. В. А. Кучеренко, утверждено 15.08.1985 № 243/л; издание ЦИТП 1989 г. Раздел 25, пп. 25.8–25.13, таблица 69.','СНиП 3.03.01-87 «Несущие и ограждающие конструкции». Исходная редакция 1987 г., публикация 1989 г.; приложение 11 (при расчёте опалубки).'];
  sources.push('ГОСТ 24045-2016 «Профили стальные листовые гнутые с трапециевидными гофрами для строительства. Технические условия». Табличный сортамент исходной редакции 2016 г.','ГОСТ 14918-2020. Изменение № 1 (ИУС 8-2025), поправка к изменению (ИУС 1-2026); опубликованные поправки ИУС 1-2021 и 1-2022. Допуски — таблица 2.');
  put('<div class="rsources">'+sources.map((x,i)=>`<p>${i+1}. ${esc(x)}</p>`).join('')+'</div>');
  return blocks;
 }
 function paginate(blocks,r){
  const host=document.createElement('div');host.className='reportMeasuring';host.style.cssText='position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';host.innerHTML='<style>'+css+'</style>';document.body.append(host);
  const pages=[],heads=[];let page,body;
  const fresh=()=>{page=document.createElement('section');page.className='report-page';page.innerHTML=`<div class="report-running"><span>${esc(r.s.projectName)}</span><span>Отчёт по расчёту</span><span>${new Date().toLocaleDateString('ru-RU')}</span></div><div class="report-body"></div><div class="report-footer">${pages.length+1}</div>`;host.append(page);pages.push(page);body=page.querySelector('.report-body');};
  const over=()=>body.scrollHeight>body.clientHeight+1;
  const addTable=el=>{let rows=[...el.querySelectorAll('tbody tr')],shell=el.cloneNode(true);shell.querySelector('tbody').innerHTML='';let target=shell.querySelector('tbody');body.append(shell);for(let row of rows){target.append(row.cloneNode(true));if(over()&&target.children.length>1){target.lastElementChild.remove();fresh();shell=el.cloneNode(true);shell.querySelector('tbody').innerHTML='';target=shell.querySelector('tbody');body.append(shell);target.append(row.cloneNode(true));}}};
  try{
   for(let b of blocks){
    if(b.kind==='cover'||b.kind==='toc'){fresh();body.innerHTML=b.html;continue;}
    if(!page||page===pages[1]||body.querySelector('.report-cover'))fresh();
    const tmp=document.createElement('div');tmp.innerHTML=b.html;const el=tmp.firstElementChild;
    if(b.kind==='heading'&&body.children.length&&body.clientHeight-body.scrollHeight<0)fresh();
    if(b.kind==='heading'&&body.children.length){const used=body.lastElementChild.getBoundingClientRect().bottom-body.getBoundingClientRect().top;if(body.clientHeight-used<105)fresh();}
    body.append(el);
    if(over()){
     el.remove();let carry=null;if(body.lastElementChild&&/^H[123]$/.test(body.lastElementChild.tagName)){carry=body.lastElementChild;carry.remove();}if(body.children.length||carry)fresh();if(carry){body.append(carry);let recorded=heads.find(x=>x.id===carry.id);if(recorded)recorded.page=pages.length;}body.append(el);
     if(over()&&b.kind==='table'){el.remove();addTable(el);}
     else if(over())throw Error('Блок отчёта не помещается на страницу: '+el.textContent.slice(0,60));
    }
    if(b.kind==='heading')heads.push({text:el.textContent,id:b.id,level:Number(el.tagName.slice(1)),page:pages.length});
   }
   const toc=pages[1].querySelector('.report-toc');toc.innerHTML=heads.map(x=>`<a href="#${x.id}" data-level="${x.level}"><span>${esc(x.text)}</span><span>${x.page}</span></a>`).join('');
   if(pages.some(p=>p.querySelector('.report-body').scrollHeight>p.querySelector('.report-body').clientHeight+1))throw Error('Переполнение страницы отчёта.');
   return pages.map(p=>p.outerHTML);
  }finally{host.remove();}
 }
 function makePDF(images){
  const chunks=[],offsets=[0];let size=0;const enc=new TextEncoder();
  const add=data=>{let a=typeof data==='string'?enc.encode(data):data;chunks.push(a);size+=a.length;};
  const obj=(id,head,data)=>{offsets[id]=size;add(id+' 0 obj\n'+head);if(data){add('\nstream\n');add(data);add('\nendstream');}add('\nendobj\n');};
  add('%PDF-1.4\n% generated locally\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Count '+images.length+' /Kids ['+images.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
  images.forEach((im,i)=>{const id=3+i*3;obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.2756 841.8898] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);obj(id+1,`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>`,im.bytes);const stream='q\n595.2756 0 0 841.8898 0 0 cm\n/Im0 Do\nQ\n';obj(id+2,'<< /Length '+enc.encode(stream).length+' >>',enc.encode(stream));});
  const xref=size;add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out=new Uint8Array(size);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}return out;
 }
 async function pdf(pages,progress=()=>{}){
  const images=[],width=794,height=1123,scale=2.25;
  for(let i=0;i<pages.length;i++){
   progress('Создаётся PDF: страница '+(i+1)+' из '+pages.length+'…');
   const html=`<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}.report-page{width:794px;height:1123px;margin:0;box-shadow:none}</style>${pages[i]}</div>`;
   const wrapper=document.createElement('div');wrapper.innerHTML=html;const xhtml=new XMLSerializer().serializeToString(wrapper);
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${xhtml}</foreignObject></svg>`;
   const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await img.decode();
   const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const sample=ctx.getImageData(0,0,canvas.width,canvas.height).data;let ink=0;for(let j=0;j<sample.length;j+=64)if(sample[j]<220||sample[j+1]<220||sample[j+2]<220)ink++;if(ink<10)throw Error('Пустая страница '+(i+1));
   const binary=atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);images.push({width:canvas.width,height:canvas.height,bytes:Uint8Array.from(binary,c=>c.charCodeAt(0))});canvas.width=canvas.height=0;await new Promise(resolve=>setTimeout(resolve,0));
  }
  return makePDF(images);
 }
 function documentHTML(pages,r){
  const embedded=`const css=${JSON.stringify(css)};const makePDF=${makePDF.toString()};const pdf=${pdf.toString()};document.getElementById('standalonePrint').onclick=()=>window.print();document.getElementById('standalonePdf').onclick=async()=>{let b=document.getElementById('standalonePdf'),s=document.getElementById('standaloneStatus');b.disabled=true;try{const bytes=await pdf([...document.querySelectorAll('.report-page')].map(x=>x.outerHTML),v=>s.textContent=v);let u=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=u;a.download='profnastil_report.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(u),60000);s.textContent='PDF создан';}catch(e){s.textContent='Ошибка PDF: '+e.message;}finally{b.disabled=false;}};`;
  return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(r.s.projectName)+' · отчёт</title><style>body{margin:0;background:#e4e7ec}'+css+'</style></head><body><div class="report-toolbar"><button id="standalonePrint">Печать</button><button id="standalonePdf">Скачать PDF</button><small id="standaloneStatus">А4 · значения на 1 м ширины · пролёты и координаты в мм</small></div>'+pages.join('')+'<script>'+embedded.replace(/<\/script/gi,'<\\/script')+'</scr'+'ipt></bo'+'dy></ht'+'ml>';
 }
 return{css,model,paginate,makePDF,pdf,documentHTML};
})();
if(typeof module!=='undefined')module.exports=DeckReport;
