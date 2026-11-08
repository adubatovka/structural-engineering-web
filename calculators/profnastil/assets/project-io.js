'use strict';
function downloadFile(name,content,type){let u=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}
function projectData(){return{format:'profnastil-independent',version:DeckParameters.VERSION,length_unit:'mm',date:new Date().toISOString(),regime_states:{length_unit:'m',states:regimeStates},inputs:{...state(),L:state().L*1000},results:current?{strength:Number.isFinite(current.strength)?current.strength:null,strength_status:current.strength===Infinity?'failed_no_ratio':current.strength>1?'failed':'passed',stiffness:current.stiffness,deflection_mm:current.fn,load_d_kpa:current.qd}:null};}
function saveJSON(){downloadFile('profnastil_inputs.json',JSON.stringify(projectData(),null,2),'application/json;charset=utf-8');toast('Настройки сохранены в JSON.');}
function validateInputs(inputs,allowIncomplete=false){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs))throw Error('Ожидается объект исходных данных');
 const s={};for(const [k,def] of Object.entries(D.defaults)){
  if(!Object.hasOwn(inputs,k))throw Error('Отсутствует обязательный параметр: '+k);
  const v=inputs[k];if(typeof v!==typeof def||typeof v==='number'&&!Number.isFinite(v))throw Error('Некорректный тип или число: '+k);s[k]=v;
 }
 for(const k of ['Ry','E','gc','gn','Iinput','Wplus','Wminus'])if(s[k]<=0)throw Error('Параметр должен быть положительным: '+k);
 for(const k of ['VR','Rend','Rinner','mount','manualD','manualN','snipRebarDensity'])if(s[k]<0)throw Error('Отрицательное значение недопустимо: '+k);
 for(const k of ['steelT','nominalT','L'])if(s[k]<0||!allowIncomplete&&s[k]===0)throw Error('Недопустимый размер: '+k);
 if(!['sp','snip'].includes(s.designCode)||!['deck','formwork'].includes(s.snipPurpose))throw Error('Неизвестный расчётный режим');
 DeckInputs.validateOptions(s,allowIncomplete);
 return s;
}
function parseProject(j){let s={};if(!j||typeof j!=='object'||Array.isArray(j))throw Error('Ожидается объект JSON');
if(j.format==='profnastil-independent'){
 if(!['1.7','1.8',DeckParameters.VERSION].includes(j.version))throw Error('Неподдерживаемая версия JSON');
 if(!['mm','m'].includes(j.length_unit))throw Error('Укажите единицы пролёта: mm или m');
 s=validateInputs(j.inputs);if(j.length_unit==='mm')s.L/=1000;
 if(j.regime_states!==undefined){
  const a=j.regime_states;if(!a||a.length_unit!=='m'||!a.states||typeof a.states!=='object'||Array.isArray(a.states))throw Error('Некорректные данные режимов');
  for(const [key,value] of Object.entries(a.states)){if(!['sp','snip:deck','snip:formwork'].includes(key)||regimeKey(validateInputs(value,true))!==key)throw Error('Некорректный режим: '+key);}
 }
}
else if(j.Utility&&j.Section&&j['Calculation Scheme']){let a=j.Section||{},b=j['Calculation Scheme']||{},c=j.Reliability||{},o=j.Support||{},t=Number(a.t_nom),key='H75-'+t.toFixed(1),pr={'Нормальная':'normal','Повышенная':'increased','Высокая':'high'}[a.gap_class],grade=String(a.grade),coat=Number(a.coat_class),us=j['Unit Factors and Precision']?.unit_system;
for(const [obj,keys] of [[a,['t_nom','coat_class','gap_class','grade','orient']],[b,['number_spans','span','h_slab','def_n']],[c,['gamma_c','gamma_n']],[o,['l_a']]])for(const k of keys)if(!Object.hasOwn(obj,k)||obj[k]===null||obj[k]==='')throw Error('Отсутствует параметр внешнего JSON: '+k);
if(typeof a.gap_check!=='boolean'||!us)throw Error('Укажите флажок допуска и систему единиц внешнего JSON');
if(a.standard!=='ГОСТ 24045-2016'||a.deck!=='Н75-750'||!D.catalogue[key])throw Error('Импорт внешнего JSON поддерживает Н75-750-0,7 / 0,8 / 0,9. Другие профили задайте по паспорту.');if(us&&us!=='м, мм, смⁿ, кПа, кН, кН·м, МПа')throw Error('Сохраните внешний JSON в единицах кПа, кН, МПа.');if(!pr||!D.grades[grade]||!D.zincClasses.includes(coat))throw Error('Неизвестная сталь, точность или покрытие.');
if(b.def_method!=='Относительный'||b.load_method!=='Несъемная опалубка'||o.q_parameter_1!=='Закреплённая на опоре')throw Error('Этот режим расчёта не поддерживается импортом.');if(!['Вверх','Вниз'].includes(a.orient)||!['Бетоноводами','Из бадей'].includes(b.concreting_method)||!['На одну полку','На две полки'].includes(o.q_parameter_2))throw Error('Неизвестная схема нагружения.');
s={projectName:j.Utility.project_name+' · '+j.Utility.calc_name,profile:key,basis:'geometry',thicknessMode:'nominal',nominalT:t,thicknessBasis:'coated',coating:coat,coatMethod:coat===275?'manual':'mass',coatThickness:.0385,precision:pr,accountTolerance:!!a.gap_check,grade,orientation:a.orient==='Вверх'?'up':'down',n:Number(b.number_spans),L:Number(b.span),H:Number(b.h_slab),mount:b.concreting_method==='Бетоноводами'?.5:2.5,own:false,pond:false,deflection:'elastic',limit:Number(b.def_n),gc:Number(c.gamma_c??1),gn:Number(c.gamma_n??1),bearing:Number(o.l_a),flanges:o.q_parameter_2==='На одну полку'?'one':'two'};
}else throw Error('Формат не распознан. Поддерживаются JSON этого калькулятора и проверенная внешняя схема для Н75.');s=D.normalizeSettings(s);D.calculate(s);return s;}
function restoreProject(j){const s=parseProject(j);thicknessBeforeCatalogue=null;regimeStates=j.regime_states?structuredClone(j.regime_states.states):{};activeRegime=null;setState(s,{autoName:s.projectName===profileTitle(s)});$('preset').value='';$('presetNote').textContent='Загружены пользовательские исходные данные; стартовый шаблон не применяется.';}
async function importJSON(file){try{if(file.size>2e6)throw Error('Файл больше 2 МБ');restoreProject(JSON.parse(await file.text()));$('presetNote').textContent='Загружены исходные данные JSON; результаты пересчитаны собственным ядром.';toast('JSON загружен.');}catch(e){toast('Не удалось открыть: '+e.message);}finally{$('importFile').value='';}}
const storageKey='profnastil.projects.v12';let deletedProject=null;
function readProjects(){let a=JSON.parse(localStorage.getItem(storageKey)||'[]');if(!Array.isArray(a))throw Error('Некорректное хранилище');return a;}
function refreshProjects(id=''){try{let a=readProjects();$('localList').innerHTML='<option value="">'+(a.length?'Выберите расчёт':'Нет сохранённых расчётов')+'</option>'+a.map(p=>`<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.time)}</option>`).join('');$('localList').value=id;$('localOpen').disabled=!a.length;$('localDelete').disabled=!a.length;}catch(e){$('localHint').textContent='Хранение браузера недоступно. Используйте JSON.';}}
function saveLocal(){try{if(!current)throw Error('Исправьте исходные данные');let a=readProjects(),id=$('localList').value||Date.now().toString(36),item={id,name:state().projectName||'Расчёт',time:new Date().toLocaleString('ru-RU'),data:projectData()},i=a.findIndex(p=>p.id===id);if(i>=0)a[i]=item;else a.push(item);localStorage.setItem(storageKey,JSON.stringify(a));refreshProjects(id);toast('Проект сохранён в этом браузере.');}catch(e){toast(e.message);}}
function openLocal(){try{let p=readProjects().find(x=>x.id===$('localList').value);if(!p)throw Error('Выберите расчёт');restoreProject(p.data);$('presetNote').textContent='Открыт сохранённый проект.';toast('Проект открыт.');}catch(e){toast(e.message);}}
function deleteLocal(){try{let a=readProjects(),i=a.findIndex(x=>x.id===$('localList').value);if(i<0)throw Error('Выберите расчёт');deletedProject=a.splice(i,1)[0];localStorage.setItem(storageKey,JSON.stringify(a));refreshProjects();$('localUndo').classList.remove('hide');toast('Запись удалена. Удаление можно отменить.');}catch(e){toast(e.message);}}
function undoLocal(){try{if(!deletedProject)return;let a=readProjects();a.push(deletedProject);localStorage.setItem(storageKey,JSON.stringify(a));refreshProjects(deletedProject.id);deletedProject=null;$('localUndo').classList.add('hide');toast('Запись восстановлена.');}catch(e){toast(e.message);}}
