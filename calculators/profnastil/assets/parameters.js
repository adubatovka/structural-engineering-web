const DeckParameters=(()=>{
 const VERSION='1.8';
 const G=9.80665, E0=206000;
 const catalogue={
  'H75-0.7':{name:'Н75-750-0,7',t:.7,h:75,p:187.5,bw:92,bn:50,I:104.5,wnc:22.5,wnt:29.1,wwc:25.6,wwt:28.1,mass:9.8},
  'H75-0.8':{name:'Н75-750-0,8',t:.8,h:75,p:187.5,bw:92,bn:50,I:114.9,wnc:25.8,wnt:32.2,wwc:28.5,wwt:33.1,mass:11.2},
  'H75-0.9':{name:'Н75-750-0,9',t:.9,h:75,p:187.5,bw:92,bn:50,I:129.6,wnc:30.2,wnt:37.6,wwc:31.6,wwt:38.0,mass:12.5},
  'H114-1.0':{name:'Н114-600-1,0',t:1,h:114,p:200,bw:104,bn:60,I:405.4,wnc:67.6,wnt:75,wwc:67.6,wwt:75,mass:17.2}
 };

 Object.assign(catalogue,{
 'H114-0.8':{name:'Н114-600-0,8',t:.8,h:114,p:200,bw:104,bn:60,I:320.9,wnc:53.3,wnt:59.7,wwc:52.4,wwt:55.8,mass:14},
 'H114-0.9':{name:'Н114-600-0,9',t:.9,h:114,p:200,bw:104,bn:60,I:361,wnc:60,wnt:67.2,wwc:59.6,wwt:65.9,mass:15.6},
 'HC35-0.6':{name:'НС35-1000-0,6',t:.6,h:35,p:200,bw:70,bn:70,I:14.92,Iwide:15.41,wnc:8.56,wnt:8.27,wwc:9.25,wwt:8.4,mass:6.4,equal:true},
 'HC35-0.7':{name:'НС35-1000-0,7',t:.7,h:35,p:200,bw:70,bn:70,I:17.36,Iwide:17.87,wnc:9.95,wnt:9.58,wwc:10.73,wwt:9.74,mass:7.4,equal:true},
 'HC35-0.8':{name:'НС35-1000-0,8',t:.8,h:35,p:200,bw:70,bn:70,I:19.89,Iwide:20.25,wnc:11.44,wnt:10.92,wwc:12.16,wwt:11.04,mass:8.4,equal:true},
 'HC44-0.7':{name:'НС44-1000-0,7',t:.7,h:44,p:200,bw:108,bn:66,I:32.9,wnc:13.4,wnt:16.8,wwc:13,wwt:13.6,mass:8.3},
 'HC44-0.8':{name:'НС44-1000-0,8',t:.8,h:44,p:200,bw:108,bn:66,I:37.66,wnc:15.41,wnt:19.25,wwc:15.07,wwt:16.76,mass:9.4},
 'C21-0.6':{name:'С21-1000-0,6 · без рёбер',t:.6,h:21,p:100,bw:35,bn:35,I:5.49,Iwide:5.46,wnc:4.83,wnt:4.96,wwc:5.24,wwt:4.51,mass:6.4,smooth:true,equal:true},
 'C21-0.7':{name:'С21-1000-0,7 · без рёбер',t:.7,h:21,p:100,bw:35,bn:35,I:6.32,Iwide:6.28,wnc:6.07,wnt:5.81,wwc:6.14,wwt:5.66,mass:7.4,smooth:true,equal:true},
 'C44-0.7':{name:'С44-1000-0,7 · без рёбер',t:.7,h:44,p:200,bw:100,bn:35,I:25.4,Iwide:20.7,wnc:9.3,wnt:15.2,wwc:8.3,wwt:8.5,mass:7.4,smooth:true}
 });
 for(const [k,p] of Object.entries(catalogue)){p.cover=k.startsWith('H75')?750:k.startsWith('H114')?600:1000;p.blank=k.startsWith('HC44')?1400:1250;p.standard='ГОСТ 24045-2016';}
 const grades={220:215,250:245,280:270,320:310,350:330,390:370,420:400,450:425};
 const zincClasses=[0,60,80,100,120,140,150,180,200,225,275,350,450,500,600,700,800];
 const toleranceRows=[
 [.4,[.06,.07,.08,.06,.07,.08,.04,.05,.06]], [.6,[.07,.08,.10,.07,.08,.09,.05,.06,.07]],
 [.8,[.09,.10,.11,.08,.09,.11,.06,.07,.07]], [1,[.10,.11,.12,.09,.11,.12,.07,.08,.08]],
 [1.2,[.11,.12,.14,.11,.12,.13,.08,.09,.09]], [1.6,[.13,.14,.16,.13,.14,.14,.09,.11,.11]],
 [2,[.18,.20,.22,.15,.17,.17,.11,.12,.12]], [2.5,[.19,.22,.24,.18,.19,.19,.13,.14,.14]],
 [3,[.21,.23,.25,.20,.21,.21,.14,.15,.15]], [4,[.23,.25,.27,.21,.22,.23,.16,.17,.17]], [4.5,[.25,.27,.29,.23,.24,.25,.18,.19,.19]]];
 function codeInfo(s){return s.designCode==='sp'?{name:'СП 260.1325800.2023 + СП 266.1325800.2016 (изм. 1–4)',short:'СП 260 / СП 266',limit:200}:s.snipPurpose==='formwork'?{name:'СНиП 3.03.01-87, прил. 11 + Пособие к СНиП II-23-81*, изд. 1989 г.',short:'СНиП · опалубка',limit:500}:{name:'Пособие к СНиП II-23-81*, изд. 1989 г., пп. 25.9, 25.10, 25.13',short:'СНиП · Пособие 1989',limit:150};}
 const defaults={designCode:'sp',snipPurpose:'deck',limitSource:'user',snipRebarDensity:100,projectName:'Расчёт профнастила',units:'si',digits:2,grade:'manual',thicknessMode:'direct',nominalT:.9,thicknessBasis:'steel',coating:275,coatMethod:'sp',coatThickness:.04,precision:'high',accountTolerance:false,tolerance:.11,blankWidth:1250,coverWidth:750,massMode:'manual',defLimitMode:'relative',absoluteLimit:18.1,customName:'Пользовательский профиль',customStandard:'СТО 57398459-18-2025',customH:75,customPitch:187.5,customWide:92,customNarrow:50,profile:'H75-0.9',basis:'catalogue',orientation:'down',n:2,L:3.62,H:200,density:2500,mount:.5,deckMass:12.5,own:true,concreteMode:'geometry',concreteInput:4.19,loadMode:'construction',manualD:5.68,manualN:4.69,pond:true,deflection:'sp266',limit:200,steelT:.9,Ry:245,E:E0,gc:1,gn:1,bearing:300,flanges:'two',stiffener:true,supportConfirmed:false,Iinput:129.6,Wplus:30.2,Wminus:31.6,VR:0,Rend:0,Rinner:0};
return {VERSION,G,E0,catalogue,grades,zincClasses,toleranceRows,codeInfo,defaults};
})();
