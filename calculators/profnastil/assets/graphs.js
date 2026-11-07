'use strict';
function beamSVG(r){const W=900,H=110,x0=45,x1=865,y=48,N=r.s.n,X=x=>x0+x/r.u.total*(x1-x0);let a=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Неразрезная балка, ${N} пролёта"><line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#274965" stroke-width="3"/><line x1="${x0}" x2="${x1}" y1="16" y2="16" stroke="#678db9"/>`;
 for(let x=x0+8;x<x1;x+=24)a+=`<path d="M${x} 16V42m-3-5 3 5 3-5" stroke="#678db9" fill="none"/>`;
 for(let i=0;i<=N;i++){let x=X(i*r.s.L);a+=`<path d="M${x} ${y}l-8 13h16z" stroke="#274965" fill="#e7eff8"/><text x="${x}" y="81" text-anchor="middle">R${i+1} = ${uf(r.u.R[i])}</text>`;if(i<N)a+=`<text x="${X((i+.5)*r.s.L)}" y="104" text-anchor="middle">${fmt(r.s.L*1000,0)} мм</text>`;}
 a+=`<text x="${W/2}" y="12" text-anchor="middle">qd · γn = ${uf(r.qd*r.s.gn,3)} ${unit().r}</text></svg>`;return a;}
function plotSVG(r,type,report=false){
 const W=900,H=340,l=72,rr=30,t=66,b=54,pts=type==='f'?r.d.points:r.u.points,factor=type==='f'||uiUnits!=='tf'?1:D.G;
 const raw=(type==='f'?r.d:r.u).extrema[type];
 let candidates=raw.filter(p=>Math.abs(p.v)>1e-9).filter((p,i,a)=>!a.slice(0,i).some(z=>Math.abs(z.x-p.x)<1e-7&&Math.abs(z.v-p.v)<1e-7));
 if(type==='M')candidates=candidates.filter(p=>p.v<0||p.local>1e-7&&p.local<r.s.L-1e-7);
 let vals=[...pts.map(p=>p[type]/factor),...candidates.map(p=>p.v/factor)],lo=Math.min(0,...vals),hi=Math.max(0,...vals),range=Math.max(.001,hi-lo);lo-=range*.14;hi+=range*.14;
 const X=x=>l+x/r.u.total*(W-l-rr),Y=v=>t+(v-lo)/(hi-lo)*(H-t-b),z=Y(0),u=type==='M'?unit().m:type==='V'?unit().r:'мм';
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Эпюра ${type}; экстремумы и координаты"><rect width="900" height="340" fill="white"/>`;
 for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4,y=Y(v);svg+=`<line class="grid" x1="${l}" x2="${W-rr}" y1="${y}" y2="${y}"/><text x="${l-8}" y="${y+4}" text-anchor="end">${fmt(v,1)}</text>`;}
 for(let i=0;i<=r.s.n;i++){let x=X(i*r.s.L);svg+=`<line class="grid" x1="${x}" x2="${x}" y1="${t}" y2="${H-b}"/><text x="${x}" y="${H-27}" text-anchor="middle">${fmt(i*r.s.L*1000,0)}</text>`;}
 let path=pts.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(2)},${Y(p[type]/factor).toFixed(2)}`).join(' ');
 svg+=`<path d="${path} L${X(r.u.total)},${z} L${X(0)},${z}Z" fill="#e6effb"/><line class="axis" x1="${l}" x2="${W-rr}" y1="${z}" y2="${z}"/><path class="blue" d="${path}"/>`;
 const occupied=[];
 candidates.sort((a,b)=>a.x-b.x||a.v-b.v).forEach((p,i)=>{
  let x=X(p.x),y=Y(p.v/factor),anchor=p.local<1e-7?'start':p.local>r.s.L-1e-7?'end':'middle',tx=x+(anchor==='start'?5:anchor==='end'?-5:0),ty=y+(p.v>0?22:-23),ww=116;
  tx=Math.max(l+ww/2,Math.min(W-rr-ww/2,tx));anchor='middle';
  let rect={left:tx-ww/2,right:tx+ww/2,top:ty-12,bottom:ty+18};
  for(let j=0;j<8&&occupied.some(q=>rect.left<q.right&&rect.right>q.left&&rect.top<q.bottom&&rect.bottom>q.top);j++){ty+=p.v>0?33:-33;rect.top=ty-12;rect.bottom=ty+18;}
  if(ty<33)ty=33+(i%2)*31;if(ty>H-b)ty=H-b;
  rect.top=ty-12;rect.bottom=ty+18;occupied.push(rect);
  svg+=`<path class="ext-leader" d="M${x},${y} L${tx},${ty+(p.v>0?-10:10)}"/><circle class="ext-dot" cx="${x}" cy="${y}" r="3.5"/><text class="ext-label" x="${tx}" y="${ty}" text-anchor="${anchor}">${type} = ${fmt(p.v/factor)}<tspan x="${tx}" dy="13" style="font-weight:400">x = ${fmt(p.x*1000,1)} мм</tspan></text>`;
 });
 svg+=`<text x="${l}" y="16">${type}, ${u}</text><text x="${W-rr}" y="16" text-anchor="end">Экстремумы · x, мм</text></svg>`;
 if(!report)$('plotNote').textContent=type==='f'?`Упругая линия при полном загружении: max |f| = ${fmt(Math.abs(r.d.Fmax.v)*1000)} мм. ${r.s.deflection==='sp266'?'Расчёт по k₂ даёт '+fmt(r.fn)+' мм; его значение приведено отдельно.':'Это выбранная расчётная модель прогиба.'}`:'Подписаны экстремумы в пролётах и на опорах. Знак M+ соответствует сжатию верхней полки; усилия включают γn. V на опоре показана с каждой стороны.';
 return svg;
}
function sectionSVG(r){let W=460,H=185,p=r.p,y0=140,scale=1.65,xc=230,up=r.s.orientation==='up',ym=y=>up?y0-(p.h-y)*scale:y0-y*scale;let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Поперечное сечение, широкая полка ${up?'вверх':'вниз'}"><line class="grid" x1="30" x2="430" y1="${y0}" y2="${y0}"/><text x="20" y="18">Бетон сверху · ${sectionAt==='span'?'M+':'M−'}</text>`;
 let comp=sectionAt==='span'?(up?'wide':'narrow'):(up?'narrow':'wide');
 if(r.s.profile.startsWith('H75')){let full=D.section75(r.t,r.s.E,r.s.Ry,'gross',true,p.t).parts;for(let q of full){let [x,y,xx,yy]=q;svg+=`<line x1="${xc+x*scale}" y1="${ym(y)}" x2="${xc+xx*scale}" y2="${ym(yy)}" stroke="#bac8d8" stroke-width="4"/>`;}
  let eff=r.s.basis==='geometry'?r.sec[comp].parts:full;for(let q of eff){let[x,y,xx,yy,t]=q;svg+=`<line x1="${xc+x*scale}" y1="${ym(y)}" x2="${xc+xx*scale}" y2="${ym(yy)}" stroke="#185cbd" stroke-width="${r.s.basis==='geometry'?Math.max(1,3*t/r.t):2.5}"/>`;}
 }else{let sc=.95,X=x=>xc+x*sc,Y=y=>up?y0-(p.h-y)*sc:y0-y*sc;let pp=[[-p.p/2,p.h],[-(p.p-p.bn)/2,p.h],[-p.bw/2,0],[p.bw/2,0],[(p.p-p.bn)/2,p.h],[p.p/2,p.h]];svg+=`<polyline points="${pp.map(x=>`${X(x[0])},${Y(x[1])}`).join(' ')}" fill="none" stroke="#185cbd" stroke-width="3"/>`;}
 svg+=`<text x="230" y="178" text-anchor="middle">${r.s.basis==='geometry'?'Серый — полное, синий — эффективное сечение':'Схема профиля; характеристики взяты из таблицы'} · сжата ${p.equal?(comp==='wide'?'полка оси 1–1':'полка оси 2–2'):(comp==='wide'?'широкая полка':'узкая полка')}</text></svg>`;return svg;
}
