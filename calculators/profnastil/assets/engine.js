const DeckEngine=(()=>{
const {G,catalogue,grades,zincClasses,codeInfo,defaults}=DeckParameters;
const {thickness,normalizeSettings,prepareProject}=DeckInputs;
 function capacityArea(r,i=1){let p=r.supportRows[Math.max(0,Math.min(r.s.n,i))],MR=p.edgeMR||((p.i>0&&p.i<r.s.n)?r.MRm:r.MRp),RR=p.cap;return{MR,RR,M:p.edgeDemand??p.edgeM,R:Math.max(0,p.reaction),support:p.i+1,points:RR?[{R:0,M:MR},{R:.25*RR,M:MR},{R:RR,M:.25*MR},{R:RR,M:0}]:[]};}

 function snipWeb(s,p,u){
  if(s.n<2)return[];
  if(s.basis!=='catalogue'||!['H75-0.8','H75-0.9','H114-0.8','H114-0.9'].includes(s.profile))return null;
  const dim=p.h===75?{y:23.2,lo:19.6,hi:48.6}:{y:29.2,lo:25.6,hi:81.6},up=s.orientation==='up',t=p.t,h=p.h,r=5,y=up?dim.y:h-dim.y,ha=up?dim.lo:dim.hi,hb=up?dim.hi:dim.lo,z=Math.min(s.bearing+2*r,1.5*h),wc=up?p.wnc:p.wwc,wt=up?p.wnt:p.wwt;
  let out=[];
  for(let i=1;i<s.n;i++){
   const M=Math.abs(u.M[i]),R=Math.max(0,u.R[i]),B0=R*p.p/2,sc=M*1000/wc,st=-M*1000/wt,s1=sc-(sc-st)*y/h,sloc=2*B0/(t*z);
   if(sc<=1e-10){out.push({i,sc,st,s1,sloc,z,B0,panels:[],ki:0});continue;}
   function panel(j,a,hh,tau){
    const gamma=.42*(2*a-1)*sloc/sc,beta=1.4*(2*a-1)*tau/sc;
    const h05=585*t/Math.sqrt(sc);
    function high(aa){const g=.42*(2*aa-1)*sloc/sc,b=1.4*(2*aa-1)*tau/sc,den=sc*((2-aa)*(1+g)+Math.sqrt(aa*aa*(1+g)**2+4*b*b));return den>0?3.26*t*Math.sqrt((2*aa-1)*s.E/den):0;}
    // Endpoint interpolation uses alpha=0.5 and alpha=1, as required by 25.13.
    const h1=high(1),lim=a<=.5?h05:a>=1?high(a):h05+(2*a-1)*(h1-h05);
    return{j,a,h:hh,tau,gamma,beta,h05,h1,limit:lim,k:lim>0?hh/lim:1e9};
   }
   const panels=[panel(1,(sc-s1)/sc,ha,2*B0/(t*ha))];
   if(s1>1e-10)panels.push(panel(2,(s1-st)/s1,hb,B0/(t*hb)));
   out.push({i,sc,st,s1,sloc,z,B0,wc,wt,y,panels,ki:Math.max(0,...panels.map(p=>p.k))});
  }
  return out;
 }
 function worstChecks(checks){const groups=new Map();for(const c of checks){const key=c.name.replace(/(?:,| ·) опора .*$/,'');const prev=groups.get(key);if(!prev||c.k>prev.k)groups.set(key,{...c});}return [...groups.values()];}
 function solve(A,b){A=A.map((r,i)=>[...r,b[i]]);const n=b.length;for(let k=0;k<n;k++){let p=k;for(let j=k+1;j<n;j++)if(Math.abs(A[j][k])>Math.abs(A[p][k]))p=j;[A[k],A[p]]=[A[p],A[k]];if(Math.abs(A[k][k])<1e-14)throw Error('Вырожденная система');let d=A[k][k];for(let j=k;j<=n;j++)A[k][j]/=d;for(let i=0;i<n;i++)if(i!==k){d=A[i][k];for(let j=k;j<=n;j++)A[i][j]-=d*A[k][j];}}return A.map(r=>r[n]);}
 function bisect(f,a,b){let fa=f(a);for(let k=0;k<70;k++){let c=(a+b)/2,fc=f(c);if(fa*fc<=0)b=c;else {a=c;fa=fc;}}return(a+b)/2;}
 function beam(n,L,loads,EI=1){
  let qs=Array.isArray(loads)?loads:Array(n).fill(loads),A=[],b=[];
  for(let i=0;i<n-1;i++){A.push(Array.from({length:n-1},(_,j)=>i===j?4:Math.abs(i-j)===1?1:0));b.push(-(qs[i]+qs[i+1])*L*L/4);}
  let M=[0,...(n>1?solve(A,b):[]),0],R=Array(n+1).fill(0),spans=[],points=[],pos={v:0,x:0},neg={v:0,x:0},Vmax=0,Fmax={v:0,x:0},extrema={M:[],V:[],f:[]};
  for(let i=0;i<n;i++){
   let q=qs[i],rl=q*L/2+(M[i+1]-M[i])/L,rr=q*L-rl,C=M[i]*L/2+rl*L*L/6-q*L**3/24;
   let moment=x=>M[i]+rl*x-q*x*x/2, shear=x=>rl-q*x, deflection=x=>(-M[i]*x*x/2-rl*x**3/6+q*x**4/24+C*x)/EI, slope=x=>(-M[i]*x-rl*x*x/2+q*x**3/6+C)/EI;
   R[i]+=rl;R[i+1]+=rr;Vmax=Math.max(Vmax,Math.abs(rl),Math.abs(rr));
   let xm=[0,L];if(q&&rl/q>0&&rl/q<L)xm.push(rl/q);
   xm.forEach(x=>{let v=moment(x);if(v>pos.v)pos={v,x:i*L+x};if(v<neg.v)neg={v,x:i*L+x};});
   let xf=[0,L];for(let k=0;k<100;k++){let a=k*L/100,b=(k+1)*L/100;if(slope(a)*slope(b)<=0)xf.push(bisect(slope,a,b));}
   xf.forEach(x=>{let v=deflection(x);if(Math.abs(v)>Math.abs(Fmax.v))Fmax={v,x:i*L+x};});
   for(let j=0;j<=100;j++){let x=L*j/100;points.push({x:i*L+x,M:moment(x),V:shear(x),f:deflection(x)*1000});}
   
   const unique=xs=>xs.sort((a,b)=>a-b).filter((x,j,a)=>!j||Math.abs(x-a[j-1])>L*1e-7);
   for(const x of unique(xm))extrema.M.push({x:i*L+x,v:moment(x),span:i+1,local:x});
   for(const x of [0,L])extrema.V.push({x:i*L+x,v:shear(x),span:i+1,local:x});
   for(const x of unique(xf))if(x>L*1e-7&&x<L*(1-1e-7))extrema.f.push({x:i*L+x,v:deflection(x)*1000,span:i+1,local:x});
   spans.push({q,rl,rr,m0:M[i],m1:M[i+1],moment,shear,deflection});
  }return{M,R,spans,points,pos,neg,Vmax,Fmax,extrema,total:n*L};
 }
 function properties(ss){let a=0,sy=0,j0=0;for(let s of ss){let[x,y,xx,yy,t]=s,l=Math.hypot(xx-x,yy-y),aa=l*t;if(l<1e-12)continue;a+=aa;sy+=aa*(y+yy)/2;j0+=aa*((y*y+y*yy+yy*yy)/3+t*t*((xx-x)/l)**2/12);}let yc=sy/a;return{A:a,y:yc,I:j0-a*yc*yc};}
 const chi=l=>l<=.65?1:l<1.38?1.47-.723*l:.66/l;
 function section75(t,E,Ry,comp,correct=true,nominal=.9){
  const h=75-nominal,p=187.5,bw=92,bn=50,wr=18,hr=6.1,hs=7,h1=(h-hs)/2+14,h3=h-h1-hs,phi=78.86*Math.PI/180;
  let dx1=h1/Math.tan(phi),dx3=h3/Math.tan(phi),dxs=(p-bw-bn)/2-dx1-dx3,s1=h1/Math.sin(phi),s3=h3/Math.sin(phi),ss=Math.hypot(hs,dxs),bs=2*Math.hypot(wr/2,hr),perim=bw-wr+bs+bn+2*(s1+ss+s3);
  let delta=.43*(4*5*phi/(Math.PI/2)+4*4*Math.atan2(hr,wr/2)/(Math.PI/2)+4*4*(phi-Math.atan2(hs,dxs))/(Math.PI/2))/perim;
  const rho=b=>{let cr=4*Math.PI**2*E*t*t/(12*(1-.3**2)*b*b),la=Math.sqrt(Ry/cr);return la<=.673?1:Math.min(1,(la-.22)/la**2);};
  let bp=(bw-wr)/2,be=bp*rho(bp)/2,bne=bn*rho(bn),rib=b=>[[-wr/2-b,0,-wr/2,0,t],[-wr/2,0,0,hr,t],[0,hr,wr/2,0,t],[wr/2,0,wr/2+b,0,t]],As=properties(rib(be)).A,Is=properties(rib(correct?Math.min(15*t,bp/2):be)).I;
  let crs=4.2*E/As*Math.sqrt(Is*t**3/(4*bp**2*(2*bp+3*bs))),ch=chi(Math.sqrt(Ry/crs)),parts=[];
  if(comp==='wide'){parts.push([-bw/2,0,-bw/2+be,0,t],[bw/2-be,0,bw/2,0,t]);parts.push(...rib(be).map(s=>[...s.slice(0,4),t*ch]));}
  else {let pts=[[-bw/2,0],[-wr/2,0],[0,hr],[wr/2,0],[bw/2,0]];for(let i=1;i<pts.length;i++)parts.push([...pts[i-1],...pts[i],t]);}
  let pts=[[bw/2,0],[bw/2+dx1,h1],[bw/2+dx1+dxs,h1+hs],[bw/2+(p-bw-bn)/2,h]],wall=[];
  for(let i=1;i<pts.length;i++)wall.push([...pts[i-1],...pts[i],t]);parts.push(...wall,...wall.map(s=>[-s[0],s[1],-s[2],s[3],s[4]]));
  let nb=comp==='narrow'?bne:bn,ex=pts[3][0];parts.push([ex,h,ex+nb/2,h,t],[-ex-nb/2,h,-ex,h,t]);
  let z=properties(parts),I=z.I*(1-2*delta)*1000/p/10000,se0=.76*t*Math.sqrt(E/Ry),hc=comp==='wide'?z.y:h-z.y;
  let webOK=true,webcr=null;
  if(comp==='wide')webOK=(2.5*se0>=hc/Math.sin(phi)&&hc<h1);
  if(comp==='narrow'){
   const a=h3/hc/2,c=(h3+hs)/hc/2,sn=(hc-h3-hs)/Math.sin(phi);
   let e1=se0,e2=(1+a)*se0,e3=(1+c)*se0,en=1.5*se0;
   webOK=hc>h3+hs&&e1+e2>=s3&&e3+en>=sn;
   if(e1+e2>=s3){e1=s3/(2+a);e2=s3*(1+a)/(2+a);}if(e3+en>=sn)e3=sn*(1+c)/(2.5+c);
   // Web stiffener inertia about an axis parallel to the web, not the sheet plane.
   const step=b=>[[-b,0,0,0,t],[0,0,hs*Math.cos(phi)+dxs*Math.sin(phi),dxs*Math.cos(phi)-hs*Math.sin(phi),t],[hs*Math.cos(phi)+dxs*Math.sin(phi),dxs*Math.cos(phi)-hs*Math.sin(phi),hs*Math.cos(phi)+dxs*Math.sin(phi)+b,dxs*Math.cos(phi)-hs*Math.sin(phi),t]];
   let si=Math.min(e1,s3/2,s1/2),Isa=properties(step(si)).I,Asa=t*(e2+ss+e3),sl=.9*(s1+s3+ss),se=sl-s3-ss/2;
   webcr=1.05*E*Math.sqrt(Isa*t**3*sl)/(Asa*se*(sl-se));
   let k=chi(Math.sqrt(Ry/webcr))/Math.sqrt(1-(h3+hs/2)/hc);webOK=webOK&&k>=1-1e-6;
  }
  return{I,Ww:I*10/z.y,Wn:I*10/(h-z.y),yc:z.y,t,delta,parts,crs,chi:ch,Is,As,be,bne,webOK,webcr,mass:properties(parts).A*1000/p*7.85e-3,sd:s1+s3+ss};
 }
 function finiteResults(values){if(values.some(x=>!Number.isFinite(x)))throw Error('Численная ошибка: переполнение или потеря точности. Проверьте размеры, нагрузки и жёсткость.');}
 function calculate(input={}){
  let {s,p,th,mass,tableProfile}=prepareProject(input);
  ['n','L','H','density','mount','deckMass','concreteInput','manualD','manualN','limit','steelT','Ry','E','gc','gn','bearing','Iinput','Wplus','Wminus','VR','Rend','Rinner'].forEach(k=>{s[k]=Number(s[k]);if(!Number.isFinite(s[k]))throw Error('Некорректное число: '+k);});
  if(!Number.isInteger(s.n)||s.n<1||s.n>5)throw Error('Число пролётов: от 1 до 5');
  if(s.L<=0||s.L>30||s.H<p.h||s.density<=0||s.mount<0||s.deckMass<0||s.concreteInput<0||s.manualD<0||s.manualN<0||s.limit<=0||s.E<=0||s.Ry<=0||s.gc<=0||s.gn<=0||s.bearing<=0||s.bearing>s.L*1000)throw Error('Проверьте диапазоны размеров, нагрузок и коэффициентов');
  let warnings=[],scope=[],sec={},code=codeInfo(s);if(s.basis==='catalogue'&&s.Ry>245.001)warnings.push('Ry изменено относительно контрольных примеров. Табличные W не пересчитываются по новому пределу текучести; подтвердите их применимость для выбранной стали.');let wp,wm,I,t=s.basis==='geometry'?s.steelT:tableProfile.t;
  if(s.basis==='geometry'){
   if(!s.profile.startsWith('H75'))throw Error('Геометрическая модель реализована для Н75-750-0,9. Для других марок выберите каталог или ручной ввод.');
   if(t<.55||t>1.2)throw Error('Толщина в геометрической модели: 0,55…1,20 мм');
   sec.wide=section75(t,s.E,s.Ry,'wide',true,p.t);sec.narrow=section75(t,s.E,s.Ry,'narrow',true,p.t);sec.gross=section75(t,s.E,s.Ry,'gross',true,p.t);
   let mw=Math.min(sec.wide.Ww,sec.wide.Wn),mn=Math.min(sec.narrow.Ww,sec.narrow.Wn);
   wp=s.orientation==='up'?mw:mn;wm=s.orientation==='up'?mn:mw;
   I=Math.min(sec.wide.I,sec.narrow.I);
   if(!sec.wide.webOK||!sec.narrow.webOK)scope.push('Требуется дополнительная редукция стенки: выбранные t, Ry, E выходят за проверенную область геометрической модели.');
   if(s.deflection==='sp266')warnings.push('Для формулы СП 266 принято консервативное Ieff геометрической модели. Прямой вариант п. 6.1.1.5 с I по НД доступен в режиме «ГОСТ».');
  } else if(s.basis==='manual'){wp=s.Wplus;wm=s.Wminus;I=s.Iinput;t=s.steelT;if(Math.min(wp,wm,I,t)<=0)throw Error('Ручные характеристики сечения должны быть положительными');scope.push('Характеристики ручного ввода требуют подтверждённого расчёта или документа изготовителя.');}
  else {let a=tableProfile;wp=s.orientation==='up'?Math.min(a.wwc,a.wwt):Math.min(a.wnc,a.wnt);wm=s.orientation==='up'?Math.min(a.wnc,a.wnt):Math.min(a.wwc,a.wwt);I=s.n===1?(s.orientation==='up'?(a.Iwide||a.I):a.I):Math.min(a.I,a.Iwide||a.I);}
  let MRp=wp*s.Ry*s.gc/1000,MRm=wm*s.Ry*s.gc/1000,EI=s.E*I*1e-5;
  finiteResults([MRp,MRm,EI]);if(Math.min(MRp,MRm,EI)<=0)throw Error('Численная ошибка: сопротивление или жёсткость обнулились.');
  let top=s.orientation==='up'?p.bw:p.bn,bot=s.orientation==='up'?p.bn:p.bw;
  let heq=s.H-p.h+(p.p-top+bot)/(2*p.p)*p.h;
  let gamma=s.density*G/1000,qb=s.concreteMode==='manual'?s.concreteInput:gamma*heq/1000,qg=s.own?s.deckMass*G/1000:0;
  let k=s.n===1?.013:s.n===2?.0091:.0088;
  let fb=s.deflection==='sp266'?k*qb*s.L**4/EI*1000:Math.abs(beam(s.n,s.L,qb,EI).Fmax.v)*1000;
  let pondNeeded=s.designCode==='sp'&&s.loadMode==='construction'&&fb>s.H/10,pond=pondNeeded&&s.pond?.7*gamma*fb/1000:0;
  let isOldForm=s.designCode==='snip'&&s.snipPurpose==='formwork',qarm=isOldForm?s.snipRebarDensity*G/1000*heq/1000:0;
  let loadRows=isOldForm?[{name:'Настил',qn:qg,gf:1.1,sls:true},{name:'Бетон',qn:qb,gf:1.2,sls:true},{name:'Арматура',qn:qarm,gf:1.2,sls:true},{name:'Люди и транспорт',qn:s.mount,gf:1.3,sls:false}]:[{name:'Настил',qn:qg,gf:1.05,sls:true},{name:'Бетон',qn:qb,gf:1.2,sls:true},{name:'Добавка бетона',qn:pond,gf:1.2,sls:true},{name:'Монтажная',qn:s.mount,gf:1.3,sls:true}];
  let qd=s.loadMode==='manual'?s.manualD:loadRows.reduce((v,r)=>v+r.qn*r.gf,0);
  let qn=s.loadMode==='manual'?s.manualN:loadRows.filter(r=>r.sls).reduce((v,r)=>v+r.qn,0);
  finiteResults([qb,qg,pond,qd,qn,qd*s.gn,fb]);
  let u=beam(s.n,s.L,qd*s.gn,EI),d=beam(s.n,s.L,qn,EI),fn=s.deflection==='sp266'?k*qn*s.L**4/EI*1000:Math.abs(d.Fmax.v)*1000,fu=s.defLimitMode==='absolute'?s.absoluteLimit:s.L*1000/s.limit;if(!(fu>0))throw Error('Предельный прогиб должен быть положительным');
  finiteResults([fn,fu,...u.R,...d.R,...u.points.flatMap(p=>[p.M,p.V,p.f]),...d.points.flatMap(p=>[p.M,p.V,p.f])]);
  if(s.designCode==='sp'&&s.deflection!=='sp266')warnings.push('Точный упругий прогиб относится к одновременному равномерному загружению всех пролётов; он не заменяет проверку по коэффициентам СП 266.');
  if(s.defLimitMode!=='absolute'&&s.limit!==code.limit)warnings.push('Предел L/'+s.limit+' задан пользователем; по выбранному документу принят L/'+code.limit+'.');
  if(s.defLimitMode==='absolute'&&fu>s.L*1000/code.limit+1e-6)warnings.push('Абсолютный предел превышает L/'+code.limit+' выбранного документа.');
  if(s.designCode==='sp'&&s.thicknessMode==='nominal'&&!s.accountTolerance&&['normal','increased'].includes(s.precision))warnings.push('СП 260, п. 6.2: для нормальной и повышенной точности необходимо учитывать минусовой допуск.');
  if(s.thicknessMode==='direct'&&s.basis!=='catalogue')warnings.push('Введена готовая расчётная t: подтвердите, что покрытие и необходимый допуск уже исключены.');
  if(s.designCode==='sp'&&(th.core<.6||th.core>4))scope.push('Основа вне диапазона 0,6–4 мм СП 260, п. 7.1.6; требуется обоснование испытаниями.');
  if(s.designCode==='sp'&&s.coating<275)warnings.push('Покрытие ниже Z275: проверьте применимость по п. 6.2 и разделу 13 СП 260.');
  if(s.massMode==='catalogue')warnings.push('Принята табличная масса ГОСТ с цинком 414 г/м²; выбранный класс покрытия её не изменяет.');
  if(p.equal)warnings.push('Полки равной ширины: переключатель задаёт положение полки у оси 1–1 рисунка ГОСТ.');
  if(!s.own&&s.loadMode==='construction')warnings.push('Собственный вес настила исключён.');
  if(pondNeeded&&!s.pond)warnings.push('f от бетона > H/10: дополнительный вес бетона выключен.');
  if(s.loadMode==='manual')warnings.push('При ручных qd/qn собственный вес и запруживание не добавляются; они должны быть включены в заданные нагрузки.');
  if(s.concreteMode==='manual'&&s.loadMode==='construction')warnings.push('Вес бетона введён вручную; геометрическая толщина показана только для сравнения.');
  let VR=null,Rend=null,Rinner=null,lambda=null,Rs=null,ka=1;
  if(s.designCode==='snip'){
   scope.push('Крайние опоры, сосредоточенные нагрузки, крепления и срез требуют отдельной проверки по СНиП; ниже выведены реализованные проверки изгиба, прогиба и стенки над промежуточными опорами.');
   if(s.snipPurpose==='deck')warnings.push('Пособие, раздел 25, относится к настилам покрытий. Этот режим предназначен для архивной сверки; выбор L/150 сам по себе не обосновывает несъёмную опалубку.');
   if(s.snipPurpose==='formwork'&&s.snipRebarDensity===0)warnings.push('Вес арматуры принят нулевым: подтвердите, что он уже включён в вес смеси или заданные нагрузки.');
   if(s.gc!==1)warnings.push('В режиме Пособия γc применён к сопротивлению изгибу; проверка стенки 25.13 использует фактические расчётные напряжения.');
  }else if(s.basis==='manual') {VR=s.VR>0?s.VR*s.gc:null;Rend=s.Rend>0?s.Rend*s.gc:null;Rinner=s.Rinner>0?s.Rinner*s.gc:null;}
  else if(s.profile.startsWith('H75')){
   // Conservative shear check: ignore the benefit of longitudinal web stiffening.
   let phi=78.86*Math.PI/180,sd=80.22,hw=74.1,hh=75.52;
   lambda=.346*sd/t*Math.sqrt(s.Ry/s.E);
   Rs=lambda<=.83?.58*s.Ry:lambda<1.4?.48*s.Ry/lambda:.67*s.Ry/(lambda*lambda);
   VR=s.gc*hw*t*Rs/Math.sin(phi)*2/p.p;
   if(s.stiffener){let em=5.67,en=2.33,sp=s.orientation==='up'?19.93:48.46,bd=s.orientation==='up'?50:95.74;ka=Math.min(1.45-.05*em/t,.95+35000*t*t*en/(sp*bd*bd));if(!(em/t>2&&em/t<12))scope.push('Условие 2 < emax/t < 12 для местной нагрузки не выполнено.');}
   const cap=(inner)=>{let C,Cr,Cb,Ch,rt;if(s.flanges==='one')[C,Cr,Cb,Ch,rt]=inner?[8,.10,.17,.004,10]:[3,.08,.70,.055,7];else[C,Cr,Cb,Ch,rt]=inner?[10,.11,.21,.020,10]:[9,.12,.14,.040,10];if(5/t>rt||hh/t>200)scope.push('Ограничения формулы местной несущей способности требуют отдельной проверки.');return s.gc*C*t*t*s.Ry*Math.sin(phi)*(1-Cr*Math.sqrt(5/t))*(1+Cb*Math.sqrt(s.bearing/t))*(1-Ch*Math.sqrt(hh/t))*ka*2/p.p;};
   Rend=cap(false);Rinner=cap(true);
  }
  if(s.designCode==='sp'&&(!VR||!Rend||(s.n>1&&!Rinner)))scope.push('Срез и/или местная несущая способность опор не определены. Для этой марки введите подтверждённые предельные силы в ручном режиме.');
  if(!s.supportConfirmed)scope.push('Тип местного нагружения и закрепление настила на опоре приняты условно; подтвердите их по узлу.');
  let checks=[{name:'Изгиб в пролёте',demand:u.pos.v,capacity:MRp,k:u.pos.v/MRp,unit:'кН·м/м'},{name:'Изгиб над опорой',demand:Math.abs(u.neg.v),capacity:MRm,k:Math.abs(u.neg.v)/MRm,unit:'кН·м/м'}];
  let snipWalls=s.designCode==='snip'?snipWeb(s,tableProfile,u):[];
  if(snipWalls===null)scope.push('Автоматическая проверка стенки по п. 25.13 Пособия реализована для Н75-750 и Н114-600 толщиной 0,8 / 0,9 с табличными характеристиками. Для этой марки требуется отдельная проверка.');
  if(snipWalls)for(let w of snipWalls)for(let a of w.panels)checks.push({name:'Стенка по 25.13 · опора '+(w.i+1)+', отсек '+a.j,demand:a.h,capacity:a.limit,k:a.k,unit:'мм'});
  if(VR)checks.push({name:'Поперечная сила V',demand:u.Vmax,capacity:VR,k:u.Vmax/VR,unit:'кН/м'});
  let supportRows=[];
  for(let i=0;i<=s.n;i++){
   let cap=i===0||i===s.n?Rend:Rinner,reaction=u.R[i],edgeM=0,edgeratio=0,edgeMR=MRm,edgeDemand=0;
   if(i>0){let v=u.spans[i-1].moment(Math.max(0,s.L-s.bearing/2000));edgeM=Math.max(edgeM,Math.abs(v));if(Math.abs(v)/(v>=0?MRp:MRm)>=edgeratio){edgeratio=Math.abs(v)/(v>=0?MRp:MRm);edgeMR=v>=0?MRp:MRm;edgeDemand=Math.abs(v);}}
   if(i<s.n){let v=u.spans[i].moment(Math.min(s.L,s.bearing/2000));edgeM=Math.max(edgeM,Math.abs(v));if(Math.abs(v)/(v>=0?MRp:MRm)>=edgeratio){edgeratio=Math.abs(v)/(v>=0?MRp:MRm);edgeMR=v>=0?MRp:MRm;edgeDemand=Math.abs(v);}}
   let ki=cap?(edgeratio+Math.max(0,reaction)/cap)/1.25:null;supportRows.push({i,reaction,cap,edgeM,ki,edgeMR,edgeDemand});
   if(cap){checks.push({name:'Местная нагрузка, опора '+(i+1),demand:Math.max(0,reaction),capacity:cap,k:Math.max(0,reaction)/cap,unit:'кН/м'});checks.push({name:'M + R, опора '+(i+1),demand:edgeratio+Math.max(0,reaction)/cap,capacity:1.25,k:ki,unit:'—'});}
  }
  if(VR&&u.Vmax>=VR){
   const message='M + V: проверка не выполнена — V ≥ VR, сниженное сопротивление изгибу не определяется. См. проверку поперечной силы.';
   checks.push({name:message,demand:null,capacity:null,k:Infinity,unit:'—'});warnings.push(message);
  }else if(VR&&u.Vmax>VR*.5){let kmv=0;u.points.forEach(p=>{let reduction=Math.max(0,1-Math.max(0,2*Math.abs(p.V)/VR-1)**2),mr=p.M>=0?MRp:MRm;kmv=Math.max(kmv,reduction>0?Math.abs(p.M)/mr/reduction:Infinity);});checks.push({name:'M + V (СП 260, 8.8)',demand:kmv,capacity:1,k:kmv,unit:'—'});}
  checks.push({name:'Прогиб',demand:fn,capacity:fu,k:fn/fu,unit:'мм',sls:true});
  for(const c of checks){finiteResults([c.demand,c.capacity].filter(x=>x!==null));if(!(c.k===Infinity&&c.demand===null&&c.capacity===null))finiteResults([c.k]);}
  const strength=Math.max(...checks.filter(x=>!x.sls).map(x=>x.k));
  if(u.R.some(x=>x<-.0001))scope.push('Возникает отрыв от опоры; требуется проверка креплений.');
  return{s,p,th,mass,tableProfile,code,snipWalls,qarm,loadRows,t,sec,wp,wm,I,MRp,MRm,EI,heq,gamma,qb,qg,pond,pondNeeded,fb,qd,qn,k,fn,fu,u,d,VR,Rend,Rinner,lambda,Rs,ka,checks,supportRows,strength,stiffness:fn/fu,warnings,scope:[...new Set(scope)]};
 }
 return{G,catalogue,grades,zincClasses,thickness,normalizeSettings,worstChecks,prepareProject,capacityArea,snipWeb,codeInfo,defaults,beam,section75,calculate};
})();
if(typeof module!=='undefined')module.exports=DeckEngine;
