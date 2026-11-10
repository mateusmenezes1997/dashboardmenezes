/* Shared, date-only performance calculations. No sales or opening balances are mutated. */
(function(root){
'use strict';
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const iso=d=>d.toISOString().slice(0,10);
const day=s=>new Date(s+'T12:00:00Z');
const shift=(s,k)=>{const d=day(s);d.setUTCDate(d.getUTCDate()+k);return iso(d)};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const days=m=>new Date(Number(m.slice(0,4)),Number(m.slice(5,7)),0).getDate();
function previousMonth(m){const d=day(m+'-01');d.setUTCMonth(d.getUTCMonth()-1);return iso(d).slice(0,7)}
function week(m,now=today()){
 const endMonth=m+'-'+days(m),anchor=m===now.slice(0,7)?now:m<now.slice(0,7)?endMonth:m+'-01';
 const offset=(day(anchor).getUTCDay()+6)%7,start=shift(anchor,-offset),end=shift(start,6);
 return {start:start<m+'-01'?m+'-01':start,end:end>endMonth?endMonth:end,anchor};
}
function opening(c,m){return c.monthOpenings?.[m]?n(c.monthOpenings[m].total):m==='2026-10'?n(c.opening):0}
function total(s,m,id){return (s.consultants||[]).filter(c=>!id||c.id===id).reduce((a,c)=>a+opening(c,m),0)+dated(s,m+'-01',m+'-'+days(m),id)}
function dated(s,start,end,id){const ids=new Set((s.consultants||[]).map(c=>c.id));return (s.sales||[]).filter(x=>ids.has(x.consultantId)&&(!id||id===x.consultantId)&&x.date>=start&&x.date<=end).reduce((a,x)=>a+n(x.amount),0)}
function months(s){const found=new Set();(s.consultants||[]).forEach(c=>{Object.keys(c.monthOpenings||{}).forEach(m=>found.add(m));if(n(c.opening)>0)found.add('2026-10')});(s.sales||[]).forEach(x=>{if(/^\d{4}-\d{2}-\d{2}$/.test(x.date))found.add(x.date.slice(0,7))});return [...found].sort()}
function history(s,m,id){return months(s).filter(x=>x<=m).slice(-6).map(month=>({month,total:total(s,month,id)}))}
function pace(s,m,goal,id,now=today()){
 const value=total(s,m,id),gap=Math.max(0,goal-value),current=now.slice(0,7),left=m===current?days(m)-Number(now.slice(8))+1:m>current?days(m):0,w=week(m,now);
 const length=Math.round((day(w.end)-day(w.start))/86400000)+1;
 return {value,gap,left,daily:left?gap/left:null,week:w,weekly:dated(s,w.start,w.end,id),weeklyGoal:goal/days(m)*length,closed:m<current};
}
function comparison(s,m,now=today()){
 const prev=previousMonth(m),cut=m===now.slice(0,7)?Number(now.slice(8)):m<now.slice(0,7)?days(m):0;
 const current=cut?dated(s,m+'-01',m+'-'+String(Math.min(cut,days(m))).padStart(2,'0')):0;
 const before=cut?dated(s,prev+'-01',prev+'-'+String(Math.min(cut,days(prev))).padStart(2,'0')):0;
 return {current,before,delta:current-before,percent:before?(current-before)/before*100:null,available:months(s).includes(prev),cut};
}
function people(s,m){return (s.consultants||[]).filter(c=>c.role!=='gestor').map(c=>({...c,total:total(s,m,c.id)})).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'pt-BR'))}
function weekly(s,m,now=today()){
 const w=week(m,now),priorEnd=shift(w.start,-1),priorStart=shift(priorEnd,-6);
 return people(s,m).map(c=>({...c,weekly:dated(s,w.start,w.end,c.id),previous:dated(s,priorStart,priorEnd,c.id)})).sort((a,b)=>b.weekly-a.weekly||a.name.localeCompare(b.name));
}
function records(s,m){const prior=months(s).filter(x=>x<m);return people(s,m).map(c=>{const best=Math.max(0,...prior.map(x=>total(s,x,c.id)));return {...c,best,hasHistory:prior.some(x=>total(s,x,c.id)>0),record:best>0&&c.total>best,gap:Math.max(0,best-c.total)}})}
function closePairs(s,m){const p=people(s,m).filter(c=>c.total>0);return p.slice(1).map((c,i)=>({a:p[i],b:c,gap:p[i].total-c.total,position:i+2})).sort((a,b)=>a.gap-b.gap)}
function firstSales(s,m){return people(s,m).map(c=>{const sales=(s.sales||[]).filter(x=>x.consultantId===c.id&&x.date.slice(0,7)===m).sort((a,b)=>a.date.localeCompare(b.date));return {...c,first:sales[0],imported:opening(c,m)>0}}).filter(c=>c.first&&!c.imported).sort((a,b)=>b.first.date.localeCompare(a.first.date))}
function consistency(s,m,id,now=today()){
 let end=week(m,now).end,count=0;
 for(let i=0;i<8;i++){const start=shift(end,-6);if(dated(s,start,end,id)<=0)break;count++;end=shift(start,-1)}return count;
}
function descendants(s,id){const seen=new Set([id]),out=[];function visit(parent){(s.consultants||[]).filter(c=>c.leaderId===parent).forEach(c=>{if(seen.has(c.id))return;seen.add(c.id);out.push(c);visit(c.id)})}visit(id);return out}
function leadership(s,m,now=today()){
 const w=week(m,now),priorEnd=shift(w.start,-1),priorStart=shift(priorEnd,-6);
 return (s.consultants||[]).filter(c=>c.role==='trainee').map(leader=>{
  const team=descendants(s,leader.id),own=total(s,m,leader.id),teamTotal=team.reduce((a,c)=>a+total(s,m,c.id),0),members=[leader,...team];
  const currentWeek=members.reduce((a,c)=>a+dated(s,w.start,w.end,c.id),0),previousWeek=members.reduce((a,c)=>a+dated(s,priorStart,priorEnd,c.id),0);
  return {leader,team,own,teamTotal,structure:own+teamTotal,active:team.filter(c=>total(s,m,c.id)>0).length,average:team.length?teamTotal/team.length:0,share:own+teamTotal?own/(own+teamTotal)*100:0,currentWeek,previousWeek};
 }).sort((a,b)=>b.structure-a.structure);
}
function lastSale(s,id,until=today()){return (s.sales||[]).filter(x=>x.consultantId===id&&x.date<=until).map(x=>x.date).sort().at(-1)||null}
function commission(credit,condition){
 const netRate=.02*(1-.1973),count=['lar100','lar85'].includes(condition)?11:13;
 const rates=condition==='lar50'?[...Array(10).fill(.001288),.002374,.002374,.002372]:Array(count).fill(.02/count);
 const gross=n(credit)*.02,net=gross*(1-.1973);
 // Round installments in cents; reconcile final installment with rounded total.
 const cents=Math.round(net*100);let used=0;
 const payments=rates.map((rate,i)=>{const value=i===rates.length-1?cents-used:Math.round(n(credit)*rate*(1-.1973)*100);used+=value;return value/100});
 return {gross,net:Math.round(net*100)/100,netRate,payments};
}
root.MenezesMetrics={n,today,days,shift,week,previousMonth,opening,total,dated,months,history,pace,comparison,people,weekly,records,closePairs,firstSales,consistency,descendants,leadership,lastSale,commission};
})(globalThis);
