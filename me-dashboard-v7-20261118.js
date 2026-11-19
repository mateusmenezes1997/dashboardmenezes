
(function(){
'use strict';
if(window.__gmMeDashboardV7)return;
window.__gmMeDashboardV7=true;

var app=null,data={sales:[],clients:[],settings:{monthlySalesTarget:5000000,monthlyCommissionTarget:0}},revision=0,period='',active='overview',saving=false,salesQuery='',salesProduct='',salesStatus='',profile={name:'Mateus Menezes',role:'Gestor Comercial',photo:''};
var brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0});
var brl2=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
var fmtDate=new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'});
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){var n=Number(v);return Number.isFinite(n)?n:0}
function id(){return 'me-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function monthOf(d){return String(d||'').slice(0,7)}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})}
function currentMonth(){return today().slice(0,7)}
function monthLabel(m){if(!m)return 'Todos os períodos';var p=m.split('-'),d=new Date(Date.UTC(Number(p[0]),Number(p[1])-1,1));return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'})}
function dateLabel(d){if(!d)return '—';var p=String(d).split('-');if(p.length!==3)return d;return p[2]+'/'+p[1]+'/'+p[0]}
var MANAGER_COMMISSION_RATE=.022,COMMISSION_TAX_RATE=.1973,STANDARD_COMMISSION_RATE=.02;
function defaultCondition(product){return String(product||'').toLowerCase().includes('motor')?'motors13':'lar50'}
function conditionConfig(condition){
 var scale=MANAGER_COMMISSION_RATE/STANDARD_COMMISSION_RATE;
 var configs={
  motors13:{product:'Motors',count:13,label:'MOTORS · 13x linear',mode:'13 parcelas lineares',rows:[['Parcelas 01 a 13',MANAGER_COMMISSION_RATE/13,13]]},
  lar100:{product:'Lar',count:11,label:'LAR · 100%',mode:'11 parcelas lineares',rows:[['Parcelas 01 a 11',MANAGER_COMMISSION_RATE/11,11]]},
  lar85:{product:'Lar',count:11,label:'LAR · 85%',mode:'11 parcelas lineares',rows:[['Parcelas 01 a 11',MANAGER_COMMISSION_RATE/11,11]]},
  lar70:{product:'Lar',count:13,label:'LAR · 70%',mode:'13 parcelas lineares',rows:[['Parcelas 01 a 13',MANAGER_COMMISSION_RATE/13,13]]},
  lar50:{product:'Lar',count:13,label:'LAR · 50%',mode:'10x + 2x + 1x',rows:[['Parcelas 01 a 10',.001288*scale,10],['Parcelas 11 e 12',.002374*scale,2],['Parcela 13',.002372*scale,1]]}
 };
 return configs[condition]||configs.lar50;
}
function conditionLabel(condition){return conditionConfig(condition).label}
function commissionExpectedFor(s){return Math.max(0,num(s&&s.credit))*MANAGER_COMMISSION_RATE}
function commissionNetFor(s){return commissionExpectedFor(s)*(1-COMMISSION_TAX_RATE)}
function commissionSchedule(s){
 var cfg=conditionConfig((s&&s.condition)||defaultCondition(s&&s.product)),credit=Math.max(0,num(s&&s.credit));
 return {cfg:cfg,rows:cfg.rows.map(function(r){return {label:r[0],rate:r[1],count:r[2],each:credit*r[1],total:credit*r[1]*r[2]}})};
}
function commissionRateLabel(rate){return (rate*100).toFixed(4).replace('.',',').replace(/0+$/,'').replace(/,$/,'')+'%'}
function moneyRound(v){return Math.round((num(v)+Number.EPSILON)*100)/100}
function addMonthsKey(monthKey,amount){
 var p=String(monthKey||'').split('-'),y=Number(p[0]),m=Number(p[1]);
 if(!y||!m)return '';
 var d=new Date(Date.UTC(y,m-1+Number(amount||0),1));
 return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
}
function commissionInstallments(s){
 var sc=commissionSchedule(s),expected=moneyRound(commissionExpectedFor(s)),out=[],offset=0;
 sc.rows.forEach(function(r){
  for(var i=0;i<r.count;i++){out.push({index:offset+1,monthOffset:offset,rate:r.rate,amount:moneyRound(r.each)});offset++}
 });
 if(out.length){
  var total=moneyRound(out.reduce(function(a,x){return a+x.amount},0));
  out[out.length-1].amount=moneyRound(out[out.length-1].amount+(expected-total));
 }
 return out;
}
function monthlyCommissionProjection(){
 var rows={};
 data.sales.forEach(function(s,saleIndex){
  var start=monthOf(s.date);if(!start)return;
  commissionInstallments(s).forEach(function(inst){
   var k=addMonthsKey(start,inst.monthOffset);if(!k)return;
   if(!rows[k])rows[k]={gross:0,net:0,installments:0,salesMap:{},newSales:0};
   rows[k].gross=moneyRound(rows[k].gross+inst.amount);
   rows[k].net=moneyRound(rows[k].net+inst.amount*(1-COMMISSION_TAX_RATE));
   rows[k].installments+=1;
   rows[k].salesMap[String(s.id||saleIndex)]=true;
   if(inst.monthOffset===0)rows[k].newSales+=1;
  });
 });
 Object.keys(rows).forEach(function(k){rows[k].sales=Object.keys(rows[k].salesMap).length});
 return rows;
}
function scheduleText(s){
 var sc=commissionSchedule(s);
 return sc.rows.map(function(r){return r.label+': '+commissionRateLabel(r.rate)+' · '+brl2.format(r.each)+(r.count>1?' cada':'')}).join(' | ');
}
function renderSaleCommissionPreview(form){
 if(!form||form.dataset.type!=='sale')return;
 var credit=Math.max(0,num(form.elements.credit&&form.elements.credit.value));
 var condition=(form.elements.condition&&form.elements.condition.value)||defaultCondition(form.elements.product&&form.elements.product.value);
 var cfg=conditionConfig(condition),gross=credit*MANAGER_COMMISSION_RATE,net=gross*(1-COMMISSION_TAX_RATE);
 var grossEl=form.querySelector('[data-auto-commission]'),netEl=form.querySelector('[data-auto-net]'),rowsEl=form.querySelector('[data-auto-parcels]');
 if(grossEl)grossEl.textContent=brl2.format(gross);
 if(netEl)netEl.textContent=brl2.format(net);
 if(rowsEl)rowsEl.innerHTML=cfg.rows.map(function(r){
   var each=credit*r[1];
   return '<div class="gm-me-auto-row"><span>'+esc(r[0])+'</span><b>'+esc(commissionRateLabel(r[1]))+' · '+esc(brl2.format(each))+(r[2]>1?' cada':'')+'</b></div>';
 }).join('');
}
function saleStatusClass(s){s=String(s||'').toLowerCase();if(s.includes('cancel')||s.includes('inad'))return 'bad';if(s.includes('contempl')||s.includes('receb'))return 'ok';return 'warn'}
function clientStatusClass(s){s=String(s||'').toLowerCase();if(s.includes('cancel')||s.includes('perd'))return 'bad';if(s.includes('contempl')||s.includes('ativo')||s.includes('cliente'))return 'ok';return 'warn'}
function toast(msg,isError){var e=document.getElementById('gmMeToast');if(!e)return;e.textContent=msg;e.classList.toggle('error',!!isError);e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show')},3200)}
function setLoading(v){if(app)app.classList.toggle('gm-me-loading',!!v)}
function api(url,opt){opt=opt||{};opt.credentials='same-origin';opt.cache='no-store';opt.headers=Object.assign({'content-type':'application/json'},opt.headers||{});return fetch(url,opt).then(async function(r){var b={};try{b=await r.json()}catch(e){}if(!r.ok)throw new Error(b.error||'Não foi possível concluir a operação.');return b})}
function normalize(){
 if(!Array.isArray(data.sales))data.sales=[];
 if(!Array.isArray(data.clients))data.clients=[];
 data.sales.forEach(function(s){
   s.condition=s.condition||defaultCondition(s.product);
   var cfg=conditionConfig(s.condition);
   if(!s.product||s.product==='Outro')s.product=cfg.product;
   s.commissionExpected=commissionExpectedFor(s);
 });
 if(!data.settings||typeof data.settings!=='object')data.settings={};
 if(!Number.isFinite(Number(data.settings.monthlySalesTarget)))data.settings.monthlySalesTarget=5000000;
 if(!Number.isFinite(Number(data.settings.monthlyCommissionTarget)))data.settings.monthlyCommissionTarget=0;
}
function filteredSales(){return data.sales.filter(function(s){return !period||monthOf(s.date)===period}).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))})}
function filteredClients(){return data.clients.slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'pt-BR')})}
function save(){
 if(saving)return Promise.resolve(false);
 saving=true;setLoading(true);
 return api('/api/me',{method:'POST',body:JSON.stringify({action:'replace',revision:revision,data:data})}).then(function(r){revision=r.revision;data=r.data||data;normalize();render();return true}).catch(function(e){toast(e.message,true);return false}).finally(function(){saving=false;setLoading(false)})
}
function metrics(){
 var sales=filteredSales(),sold=sales.reduce(function(a,s){return a+num(s.credit)},0),expected=sales.reduce(function(a,s){return a+commissionExpectedFor(s)},0),received=sales.reduce(function(a,s){return a+num(s.commissionReceived)},0),qty=sales.reduce(function(a,s){return a+Math.max(1,num(s.qty)||1)},0);
 return {sales:sales,sold:sold,expected:expected,received:received,qty:qty,ticket:sales.length?sold/sales.length:0,clients:data.clients.length};
}
function monthSeries(){
 var now=new Date(),out=[];
 for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');out.push({m:m,total:data.sales.filter(function(s){return monthOf(s.date)===m}).reduce(function(a,s){return a+num(s.credit)},0)})}
 return out;
}
function salesInMonth(m){return data.sales.filter(function(s){return monthOf(s.date)===m})}
function salesTotalForMonth(m){return salesInMonth(m).reduce(function(a,s){return a+num(s.credit)},0)}
function yearSales(year){return data.sales.filter(function(s){return String(s.date||'').slice(0,4)===String(year)}).reduce(function(a,s){return a+num(s.credit)},0)}
function yearSalesRows(year){return data.sales.filter(function(s){return String(s.date||'').slice(0,4)===String(year)})}
function previousMonthKey(m){return addMonthsKey(m,-1)}
function currentPerformance(){
 var cm=currentMonth(),pm=previousMonthKey(cm),now=new Date(),parts=cm.split('-'),year=Number(parts[0]),month=Number(parts[1]),days=new Date(year,month,0).getDate(),day=Math.min(days,now.getDate());
 var sold=salesTotalForMonth(cm),prev=salesTotalForMonth(pm),target=Math.max(0,num(data.settings.monthlySalesTarget)),remaining=Math.max(0,target-sold),daysLeft=Math.max(0,days-day);
 var pace=daysLeft?remaining/daysLeft:remaining,projection=day?sold/day*days:sold,delta=prev?((sold-prev)/prev)*100:(sold?100:0);
 var yrRows=yearSalesRows(year),yr=yrRows.reduce(function(a,s){return a+num(s.credit)},0),ticket=yrRows.length?yr/yrRows.length:0;
 var monthly={};
 yrRows.forEach(function(s){var m=monthOf(s.date);monthly[m]=(monthly[m]||0)+num(s.credit)});
 var bestKey='',best=0;Object.keys(monthly).forEach(function(k){if(monthly[k]>best){best=monthly[k];bestKey=k}});
 return {cm:cm,pm:pm,sold:sold,prev:prev,target:target,remaining:remaining,days:days,day:day,daysLeft:daysLeft,pace:pace,projection:projection,delta:delta,year:year,yearTotal:yr,yearTicket:ticket,bestKey:bestKey,best:best};
}
function annualPerformance(year){
 var rows=yearSalesRows(year),months=[],monthly={},commission=0,received=0,uniqueClients={};
 for(var m=1;m<=12;m++){var k=year+'-'+String(m).padStart(2,'0');monthly[k]=0}
 rows.forEach(function(s){
   var k=monthOf(s.date);if(monthly[k]!==undefined)monthly[k]+=num(s.credit);
   commission+=commissionExpectedFor(s);
   received+=num(s.commissionReceived);
   var client=String(s.clientName||'').trim().toLocaleLowerCase('pt-BR');
   if(client)uniqueClients[client]=true;
 });
 Object.keys(monthly).forEach(function(k){months.push({m:k,total:monthly[k]})});
 var active=months.filter(function(x){return x.total>0});
 var best=active.length?active.reduce(function(a,x){return x.total>a.total?x:a},{m:'',total:-1}):{m:'',total:0};
 var worst=active.length?active.reduce(function(a,x){return x.total<a.total?x:a},{m:'',total:Infinity}):{m:'',total:0};
 var now=new Date(),currentYear=Number(currentMonth().slice(0,4)),elapsedMonths=year===currentYear?Number(currentMonth().slice(5,7)):12;
 var total=rows.reduce(function(a,s){return a+num(s.credit)},0),avg=elapsedMonths?total/elapsedMonths:0;
 var start=new Date(year,0,1),end=new Date(year+1,0,1),nowDate=year===currentYear?now:end;
 var elapsedDays=Math.max(1,Math.min(Math.ceil((nowDate-start)/86400000)+1,Math.round((end-start)/86400000)));
 var daysInYear=Math.round((end-start)/86400000),annualProjection=year===currentYear?total/elapsedDays*daysInYear:total;
 return {year:year,rows:rows,months:months,total:total,commission:commission,received:received,avg:avg,activeMonths:active.length,best:best,worst:worst,clients:Object.keys(uniqueClients).length,sales:rows.length,projection:annualProjection,elapsedMonths:elapsedMonths};
}
function commissionCashflow(){
 var projection=monthlyCommissionProjection(),cm=currentMonth(),next=addMonthsKey(cm,1),thisGross=num(projection[cm]&&projection[cm].gross),thisNet=num(projection[cm]&&projection[cm].net),nextGross=num(projection[next]&&projection[next].gross);
 var d90=0,d90net=0,y12=0,y12net=0,future=0,futurenet=0;
 for(var i=0;i<12;i++){var k=addMonthsKey(cm,i),x=projection[k]||{};y12+=num(x.gross);y12net+=num(x.net);if(i<3){d90+=num(x.gross);d90net+=num(x.net)}}
 Object.keys(projection).forEach(function(k){if(k>=cm){future+=num(projection[k].gross);futurenet+=num(projection[k].net)}});
 return {projection:projection,cm:cm,next:next,thisGross:thisGross,thisNet:thisNet,nextGross:nextGross,d90:d90,d90net:d90net,y12:y12,y12net:y12net,future:future,futurenet:futurenet};
}
function clientActions(){
 var t=today(),td=new Date(t+'T00:00:00'),week=new Date(td);week.setDate(week.getDate()+7);var weekKey=week.toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
 var overdue=0,todayCount=0,next7=0,noDate=0;
 data.clients.forEach(function(x){var d=String(x.nextContact||'');if(!d){noDate++;return}if(d<t)overdue++;else if(d===t)todayCount++;else if(d<=weekKey)next7++});
 return {overdue:overdue,today:todayCount,next7:next7,noDate:noDate,total:data.clients.length};
}
function visibleSales(){
 var q=String(salesQuery||'').trim().toLocaleLowerCase('pt-BR');
 return filteredSales().filter(function(s){
   if(salesProduct&&String(s.product||'')!==salesProduct)return false;
   if(salesStatus&&String(s.status||'')!==salesStatus)return false;
   if(q){var hay=[s.clientName,s.product,s.status,s.note,num(s.credit)].join(' ').toLocaleLowerCase('pt-BR');if(!hay.includes(q))return false}
   return true;
 });
}
function renderProfileHero(){
 var root=document.getElementById('gmMeProfileHero');if(!root)return;
 var p=currentPerformance(),cash=commissionCashflow(),pct=p.target?Math.min(100,p.sold/p.target*100):0;
 var img=document.getElementById('gmMeProfilePhoto'),fallback=document.getElementById('gmMeProfileFallback');
 if(img){
   if(profile.photo){img.src=profile.photo;img.hidden=false;if(fallback)fallback.hidden=true}
   else{img.removeAttribute('src');img.hidden=true;if(fallback)fallback.hidden=false}
 }
 var n=document.getElementById('gmMeProfileName');if(n)n.textContent=profile.name||'Mateus Menezes';
 var r=document.getElementById('gmMeProfileRole');if(r)r.textContent=profile.role||'Gestor Comercial';
 var sold=document.getElementById('gmMeHeroSold');if(sold)sold.textContent=brl.format(p.sold);
 var commission=document.getElementById('gmMeHeroCommission');if(commission)commission.textContent=brl2.format(cash.thisGross);
 var pctEl=document.getElementById('gmMeHeroPct');if(pctEl)pctEl.textContent=pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
 var bar=document.getElementById('gmMeHeroBar');if(bar)bar.style.width=pct+'%';
 var periodEl=document.getElementById('gmMeHeroPeriod');if(periodEl)periodEl.textContent='Meta de '+monthLabel(p.cm);
}
function loadProfile(){
 return api('/api/state').then(function(r){
   var s=r&&r.state;
   if(!s||!Array.isArray(s.consultants))return;
   var me=s.consultants.find(function(c){
     return String(c.id||'').toLocaleLowerCase('pt-BR')==='mateus' ||
       String(c.name||'').toLocaleLowerCase('pt-BR').includes('mateus menezes');
   });
   if(!me)return;
   profile.name=String(me.name||'Mateus Menezes');
   profile.role='Gestor Comercial';
   profile.photo=String(me.photo||me.avatar||me.image||'');
   renderProfileHero();
 }).catch(function(){});
}
function renderOverview(){
 renderProfileHero();
 var p=currentPerformance(),cash=commissionCashflow(),actions=clientActions(),m=metrics(),ctarget=num(data.settings.monthlyCommissionTarget);
 var deltaText=p.prev?(p.delta>=0?'↑ ':'↓ ')+Math.abs(p.delta).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% vs. mês anterior':(p.sold?'primeiro mês com produção':'sem produção no mês');
 document.getElementById('gmMeKpis').innerHTML=[
  ['VENDIDO NO ANO',brl.format(p.yearTotal),String(p.year)],
  ['COMISSÃO ESTE MÊS',brl2.format(cash.thisGross),brl2.format(cash.thisNet)+' líquido estimado'],
  ['PRÓXIMO MÊS',brl2.format(cash.nextGross),monthLabel(cash.next)],
  ['PRÓXIMOS 90 DIAS',brl2.format(cash.d90),'fluxo bruto projetado'],
  ['CARTEIRA FUTURA',brl2.format(cash.future),'comissões ainda projetadas'],
  ['TICKET MÉDIO ANO',brl.format(p.yearTicket),deltaText]
 ].map(function(x,i){return '<article class="gm-me-kpi '+(i===1?'focus':'')+'"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></article>'}).join('');

 var salePct=p.target?Math.min(100,p.sold/p.target*100):0,comPct=ctarget?Math.min(100,cash.thisGross/ctarget*100):0;
 document.getElementById('gmMeGoals').innerHTML=
  '<div class="gm-me-goal-intel"><div><small>VENDIDO NO MÊS</small><b>'+esc(brl.format(p.sold))+'</b><span>'+esc(deltaText)+'</span></div><div><small>PROJEÇÃO DE FECHAMENTO</small><b>'+esc(brl.format(p.projection))+'</b><span>mantendo o ritmo atual</span></div><div><small>FALTA PARA META</small><b>'+esc(brl.format(p.remaining))+'</b><span>'+(p.daysLeft?esc(brl.format(p.pace))+' por dia nos '+p.daysLeft+' dias restantes':'mês em fechamento')+'</span></div></div>'+
  '<div class="gm-me-progress-item"><div class="gm-me-progress-label"><span>Meta de vendas</span><b>'+(p.target?brl.format(p.sold)+' / '+brl.format(p.target):'Defina sua meta')+'</b></div><div class="gm-me-track"><i style="width:'+salePct+'%"></i></div></div>'+
  (ctarget?'<div class="gm-me-progress-item"><div class="gm-me-progress-label"><span>Meta de comissão</span><b>'+brl2.format(cash.thisGross)+' / '+brl2.format(ctarget)+'</b></div><div class="gm-me-track"><i style="width:'+comPct+'%"></i></div></div>':'');

 var series=monthSeries(),max=Math.max(1,...series.map(function(x){return x.total}));
 document.getElementById('gmMeChart').innerHTML=series.map(function(x){
   var h=Math.max(3,x.total/max*155),pp=x.m.split('-');
   return '<div class="gm-me-bar-wrap" title="'+esc(monthLabel(x.m))+' • '+esc(brl.format(x.total))+'"><span class="gm-me-bar-value">'+(x.total?esc((x.total/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'M'):'0')+'</span><i class="gm-me-bar" style="height:'+h+'px"></i><span class="gm-me-bar-label">'+pp[1]+'/'+pp[0].slice(2)+'</span></div>';
 }).join('');

 var cf=document.getElementById('gmMeCashflowChart');
 if(cf){
   var months=[];for(var i=0;i<8;i++){var k=addMonthsKey(cash.cm,i),x=cash.projection[k]||{};months.push({m:k,total:num(x.gross)})}
   var maxC=Math.max(1,...months.map(function(x){return x.total}));
   cf.innerHTML=months.map(function(x,i){var h=Math.max(3,x.total/maxC*155),pp=x.m.split('-');return '<div class="gm-me-bar-wrap '+(i===0?'current':'')+'" title="'+esc(monthLabel(x.m))+' • '+esc(brl2.format(x.total))+'"><span class="gm-me-bar-value">'+esc(brl2.format(x.total))+'</span><i class="gm-me-bar gm-me-cash-bar" style="height:'+h+'px"></i><span class="gm-me-bar-label">'+pp[1]+'/'+pp[0].slice(2)+'</span></div>'}).join('');
 }
 var cashStats=document.getElementById('gmMeCashflowStats');
 if(cashStats)cashStats.innerHTML='<span><b>'+esc(brl2.format(cash.thisGross))+'</b> este mês</span><span><b>'+esc(brl2.format(cash.nextGross))+'</b> próximo mês</span><span><b>'+esc(brl2.format(cash.y12))+'</b> 12 meses</span>';

 var next=document.getElementById('gmMeNextActions');
 if(next)next.innerHTML=[
   ['Atrasados',actions.overdue,'follow-ups'],
   ['Hoje',actions.today,'contatos'],
   ['Próximos 7 dias',actions.next7,'agendados'],
   ['Sem próxima data',actions.noDate,'clientes']
 ].map(function(x,i){return '<button type="button" class="gm-me-action-row '+(i===0&&x[1]?'urgent':'')+'" data-open-tab="clients"><span>'+esc(x[0])+'<small>'+esc(x[2])+'</small></span><b>'+x[1]+'</b></button>'}).join('');

 var recent=filteredSales().slice(0,6);
 document.getElementById('gmMeRecent').innerHTML=recent.length?recent.map(function(s){return '<div class="gm-me-list-row"><div><strong>'+esc(s.clientName||'Venda própria')+'</strong><small>'+esc(dateLabel(s.date))+' · '+esc(s.product||'Produto')+'</small></div><b>'+esc(brl.format(num(s.credit)))+'</b></div>'}).join(''):'<div class="gm-me-empty">Nenhuma venda registrada neste período.</div>';
 var record=document.getElementById('gmMeRecord');
 if(record)record.innerHTML='<div class="gm-me-record-main"><small>MELHOR MÊS DO ANO</small><b>'+esc(p.best?brl.format(p.best):'—')+'</b><span>'+esc(p.bestKey?monthLabel(p.bestKey):'Ainda sem recorde')+'</span></div><div class="gm-me-record-side"><small>PRODUÇÃO ATUAL</small><b>'+esc(brl.format(p.sold))+'</b><span>'+(p.best&&p.sold>=p.best?'Novo recorde em andamento':'Referência para superar: '+esc(brl.format(p.best)))+'</span></div>';

 var annual=annualPerformance(p.year),annualCards=document.getElementById('gmMeAnnualCards');
 if(annualCards)annualCards.innerHTML=[
   ['VENDIDO EM '+annual.year,brl.format(annual.total),annual.sales+' venda'+(annual.sales===1?'':'s')],
   ['COMISSÃO GERADA',brl2.format(annual.commission),'2,2% das vendas do ano'],
   ['MÉDIA MENSAL',brl.format(annual.avg),'média em '+annual.elapsedMonths+' mês'+(annual.elapsedMonths===1?'':'es')],
   ['CLIENTES NO ANO',String(annual.clients),'clientes únicos nas vendas'],
   ['MELHOR MÊS',annual.best.total?brl.format(annual.best.total):'—',annual.best.m?monthLabel(annual.best.m):'sem produção'],
   ['PROJEÇÃO DO ANO',brl.format(annual.projection),'mantendo o ritmo acumulado']
 ].map(function(x,i){return '<article class="gm-me-year-kpi '+(i===0||i===5?'focus':'')+'"><small>'+esc(x[0])+'</small><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></article>'}).join('');

 var annualChart=document.getElementById('gmMeAnnualChart');
 if(annualChart){
   var maxY=Math.max(1,...annual.months.map(function(x){return x.total}));
   annualChart.innerHTML=annual.months.map(function(x){
     var h=Math.max(3,x.total/maxY*175),pp=x.m.split('-');
     return '<div class="gm-me-year-bar-wrap" title="'+esc(monthLabel(x.m))+' • '+esc(brl.format(x.total))+'"><span class="gm-me-year-bar-value">'+(x.total?esc((x.total/1000000).toLocaleString('pt-BR',{maximumFractionDigits:2})+'M'):'0')+'</span><i class="gm-me-year-bar" style="height:'+h+'px"></i><span class="gm-me-year-bar-label">'+pp[1]+'</span></div>';
   }).join('');
 }
 var annualDetails=document.getElementById('gmMeAnnualDetails');
 if(annualDetails)annualDetails.innerHTML=
   '<div><small>MENOR MÊS COM PRODUÇÃO</small><b>'+esc(annual.worst.total?brl.format(annual.worst.total):'—')+'</b><span>'+esc(annual.worst.m?monthLabel(annual.worst.m):'sem produção')+'</span></div>'+
   '<div><small>MESES COM PRODUÇÃO</small><b>'+annual.activeMonths+'</b><span>de 12 meses</span></div>'+
   '<div><small>COMISSÃO INFORMADA COMO RECEBIDA</small><b>'+esc(brl2.format(annual.received))+'</b><span>registros do ano</span></div>';
}
function renderSales(){
 var rows=visibleSales(),total=rows.reduce(function(a,s){return a+num(s.credit)},0),commission=rows.reduce(function(a,s){return a+commissionExpectedFor(s)},0);
 var summary=document.getElementById('gmMeSalesSummary');
 if(summary)summary.innerHTML='<span><small>RESULTADOS FILTRADOS</small><b>'+rows.length+'</b></span><span><small>CRÉDITO</small><b>'+esc(brl.format(total))+'</b></span><span><small>COMISSÃO 2,2%</small><b>'+esc(brl2.format(commission))+'</b></span>';
 document.getElementById('gmMeSalesBody').innerHTML=rows.length?rows.map(function(s){
  return '<tr>'+
   '<td>'+esc(dateLabel(s.date))+'</td>'+
   '<td><strong>'+esc(s.clientName||'Cliente não informado')+'</strong>'+(s.sourceId?'<div class="muted">Sincronizada</div>':'')+'</td>'+
   '<td>'+esc(s.product||'—')+'<div class="muted">'+esc(conditionLabel(s.condition||defaultCondition(s.product)))+'</div></td>'+
   '<td class="money">'+esc(brl2.format(num(s.credit)))+'</td>'+
   '<td>'+esc(String(s.qty||1))+'</td>'+
   '<td class="money">'+esc(brl2.format(commissionExpectedFor(s)))+'<div class="muted">2,2% automático</div></td>'+
   '<td class="money">'+esc(brl2.format(num(s.commissionReceived)))+'</td>'+
   '<td><span class="gm-me-chip '+saleStatusClass(s.status)+'">'+esc(s.status||'Ativa')+'</span></td>'+
   '<td><div class="gm-me-actions"><button class="gm-me-icon-btn" data-edit-sale="'+esc(s.id)+'">Editar</button><button class="gm-me-icon-btn" data-del-sale="'+esc(s.id)+'">Excluir</button></div></td>'+
  '</tr>';
 }).join(''):'<tr><td colspan="9"><div class="gm-me-empty">Nenhuma venda encontrada com esses filtros.</div></td></tr>';
}
function renderClients(){
 var rows=filteredClients(),actions=clientActions(),potential=rows.reduce(function(a,x){return a+num(x.credit)},0);
 var summary=document.getElementById('gmMeClientsSummary');
 if(summary)summary.innerHTML='<span><small>CLIENTES</small><b>'+rows.length+'</b></span><span><small>POTENCIAL</small><b>'+esc(brl.format(potential))+'</b></span><span class="'+(actions.overdue?'urgent':'')+'"><small>FOLLOW-UPS ATRASADOS</small><b>'+actions.overdue+'</b></span><span><small>PRÓXIMOS 7 DIAS</small><b>'+actions.next7+'</b></span>';
 document.getElementById('gmMeClientsBody').innerHTML=rows.length?rows.map(function(c){
  var phone=String(c.phone||'').replace(/\D/g,'');
  return '<tr>'+
   '<td><strong>'+esc(c.name||'Cliente')+'</strong></td>'+
   '<td>'+esc(c.phone||'—')+'</td>'+
   '<td>'+esc(c.product||'—')+'</td>'+
   '<td class="money">'+esc(brl2.format(num(c.credit)))+'</td>'+
   '<td><span class="gm-me-chip '+clientStatusClass(c.status)+'">'+esc(c.status||'Em acompanhamento')+'</span></td>'+
   '<td>'+esc(dateLabel(c.nextContact))+'</td>'+
   '<td class="muted">'+esc(c.note||'—')+'</td>'+
   '<td><div class="gm-me-actions">'+(phone?'<button class="gm-me-icon-btn" data-whatsapp="'+esc(phone)+'">WhatsApp</button>':'')+'<button class="gm-me-icon-btn" data-edit-client="'+esc(c.id)+'">Editar</button><button class="gm-me-icon-btn" data-del-client="'+esc(c.id)+'">Excluir</button></div></td>'+
  '</tr>';
 }).join(''):'<tr><td colspan="8"><div class="gm-me-empty">Sua carteira pessoal ainda está vazia.</div></td></tr>';
}
function renderCommission(){
 var cash=commissionCashflow();
 var flow=document.getElementById('gmMeCommissionCashflow');
 if(flow)flow.innerHTML=[
   ['ESTE MÊS',brl2.format(cash.thisGross),brl2.format(cash.thisNet)+' líquido'],
   ['PRÓXIMO MÊS',brl2.format(cash.nextGross),monthLabel(cash.next)],
   ['PRÓXIMOS 90 DIAS',brl2.format(cash.d90),brl2.format(cash.d90net)+' líquido'],
   ['PRÓXIMOS 12 MESES',brl2.format(cash.y12),brl2.format(cash.y12net)+' líquido']
 ].map(function(x,i){return '<article class="gm-me-summary '+(i===0?'focus':'')+'"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></article>'}).join('');
 var rows={};
 data.sales.forEach(function(s){var m=monthOf(s.date)||'Sem data';if(!rows[m])rows[m]={expected:0,received:0,sales:0};rows[m].expected+=commissionExpectedFor(s);rows[m].received+=num(s.commissionReceived);rows[m].sales+=1});
 var list=Object.keys(rows).sort().reverse(),totE=data.sales.reduce(function(a,s){return a+commissionExpectedFor(s)},0),totR=data.sales.reduce(function(a,s){return a+num(s.commissionReceived)},0),totNet=data.sales.reduce(function(a,s){return a+commissionNetFor(s)},0);
 document.getElementById('gmMeCommissionSummary').innerHTML=
  '<article class="gm-me-summary"><small>Comissão bruta · 2,2%</small><b>'+esc(brl2.format(totE))+'</b></article>'+
  '<article class="gm-me-summary"><small>Líquido estimado</small><b>'+esc(brl2.format(totNet))+'</b></article>'+
  '<article class="gm-me-summary"><small>Recebido informado</small><b>'+esc(brl2.format(totR))+'</b></article>';
 document.getElementById('gmMeCommissionBody').innerHTML=list.length?list.map(function(k){var x=rows[k];return '<tr><td>'+esc(monthLabel(k))+'</td><td>'+x.sales+'</td><td class="money">'+esc(brl2.format(x.expected))+'</td><td class="money">'+esc(brl2.format(x.received))+'</td><td class="money">'+esc(brl2.format(Math.max(0,x.expected-x.received)))+'</td><td>'+(x.expected?Math.min(100,x.received/x.expected*100).toFixed(0):0)+'%</td></tr>'}).join(''):'<tr><td colspan="6"><div class="gm-me-empty">Sem dados de comissão.</div></td></tr>';
 var detail=document.getElementById('gmMeCommissionSalesBody');
 if(detail)detail.innerHTML=data.sales.length?data.sales.slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).map(function(s){
   return '<tr><td>'+esc(dateLabel(s.date))+'</td><td><strong>'+esc(s.clientName||'Venda própria')+'</strong></td><td class="money">'+esc(brl2.format(num(s.credit)))+'</td><td>'+esc(conditionLabel(s.condition||defaultCondition(s.product)))+'</td><td class="money">'+esc(brl2.format(commissionExpectedFor(s)))+'</td><td class="muted">'+esc(scheduleText(s))+'</td></tr>';
 }).join(''):'<tr><td colspan="6"><div class="gm-me-empty">Nenhuma venda para calcular a diluição.</div></td></tr>';
 var monthly=document.getElementById('gmMeMonthlyCommissionBody');
 if(monthly){
  var projection=monthlyCommissionProjection(),months=Object.keys(projection).sort().reverse();
  monthly.innerHTML=months.length?months.map(function(k){var x=projection[k];return '<tr><td><strong>'+esc(monthLabel(k))+'</strong></td><td class="money"><strong>'+esc(brl2.format(x.gross))+'</strong></td><td class="money">'+esc(brl2.format(x.net))+'</td><td>'+x.sales+'</td></tr>'}).join(''):'<tr><td colspan="4"><div class="gm-me-empty">Nenhuma comissão mensal projetada.</div></td></tr>';
 }
}
function renderSettings(){
 var a=document.getElementById('gmMeSalesTarget'),b=document.getElementById('gmMeCommissionTarget');if(a)a.value=num(data.settings.monthlySalesTarget)||'';if(b)b.value=num(data.settings.monthlyCommissionTarget)||'';
 var p=currentPerformance(),cash=commissionCashflow(),root=document.getElementById('gmMeGoalIntelligence');
 if(root)root.innerHTML='<article><small>VENDIDO NO MÊS</small><b>'+esc(brl.format(p.sold))+'</b><span>'+(p.target?Math.min(100,p.sold/p.target*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% da meta':'sem meta definida')+'</span></article>'+
 '<article><small>FALTA PARA META</small><b>'+esc(brl.format(p.remaining))+'</b><span>'+p.daysLeft+' dias restantes</span></article>'+
 '<article><small>RITMO NECESSÁRIO</small><b>'+esc(brl.format(p.pace))+'</b><span>por dia até o fim do mês</span></article>'+
 '<article><small>PROJEÇÃO ATUAL</small><b>'+esc(brl.format(p.projection))+'</b><span>'+(p.target?(p.projection>=p.target?'ritmo acima da meta':'ritmo abaixo da meta'):'configure sua meta')+'</span></article>'+
 '<article><small>COMISSÃO DO MÊS</small><b>'+esc(brl2.format(cash.thisGross))+'</b><span>'+esc(brl2.format(cash.thisNet))+' líquido estimado</span></article>'+
 '<article><small>RECORDE DO ANO</small><b>'+esc(p.best?brl.format(p.best):'—')+'</b><span>'+esc(p.bestKey?monthLabel(p.bestKey):'sem histórico')+'</span></article>';
}
function render(){
 normalize();
 document.querySelectorAll('.gm-me-tab').forEach(function(b){b.classList.toggle('active',b.dataset.meTab===active)});
 document.querySelectorAll('.gm-me-view').forEach(function(v){v.classList.toggle('active',v.id==='gmMeView-'+active)});
 var sel=document.getElementById('gmMePeriod');if(sel&&sel.value!==period)sel.value=period;
 renderOverview();renderSales();renderClients();renderCommission();renderSettings();
}
function openModal(type,item){
 var modal=document.getElementById('gmMeModal'),body=document.getElementById('gmMeModalBody'),title=document.getElementById('gmMeModalTitle');
 if(type==='sale'){
  item=item||{};title.textContent=item.id?'Editar venda própria':'Nova venda própria';
  var initialCondition=item.condition||defaultCondition(item.product);
  body.innerHTML='<form id="gmMeForm" data-type="sale" data-id="'+esc(item.id||'')+'"><div class="gm-me-form-grid">'+
   '<div class="gm-me-field"><label>Data</label><input class="gm-me-input" name="date" type="date" required value="'+esc(item.date||today())+'"></div>'+
   '<div class="gm-me-field"><label>Cliente</label><input class="gm-me-input" name="clientName" placeholder="Nome do cliente" value="'+esc(item.clientName||'')+'"></div>'+
   '<div class="gm-me-field"><label>Produto</label><select class="gm-me-select" name="product"><option '+(item.product==='Lar'||!item.product?'selected':'')+'>Lar</option><option '+(item.product==='Motors'?'selected':'')+'>Motors</option></select></div>'+
   '<div class="gm-me-field"><label>Condição / diluição</label><select class="gm-me-select" name="condition"><option value="motors13" '+(initialCondition==='motors13'?'selected':'')+'>MOTORS · 13x linear</option><option value="lar100" '+(initialCondition==='lar100'?'selected':'')+'>LAR · 100% · 11x</option><option value="lar85" '+(initialCondition==='lar85'?'selected':'')+'>LAR · 85% · 11x</option><option value="lar70" '+(initialCondition==='lar70'?'selected':'')+'>LAR · 70% · 13x</option><option value="lar50" '+(initialCondition==='lar50'?'selected':'')+'>LAR · 50% · 10x + 2x + 1x</option></select></div>'+
   '<div class="gm-me-field"><label>Crédito vendido</label><input class="gm-me-input" name="credit" type="number" min="0" step="0.01" required value="'+esc(num(item.credit)||'')+'"></div>'+
   '<div class="gm-me-field"><label>Quantidade de cotas</label><input class="gm-me-input" name="qty" type="number" min="1" step="1" value="'+esc(Math.max(1,num(item.qty)||1))+'"></div>'+
   '<div class="gm-me-field"><label>Status</label><select class="gm-me-select" name="status"><option '+(item.status==='Ativa'||!item.status?'selected':'')+'>Ativa</option><option '+(item.status==='Contemplada'?'selected':'')+'>Contemplada</option><option '+(item.status==='Cancelada'?'selected':'')+'>Cancelada</option></select></div>'+
   '<div class="gm-me-field"><label>Comissão recebida até agora (R$)</label><input class="gm-me-input" name="commissionReceived" type="number" min="0" step="0.01" value="'+esc(num(item.commissionReceived)||'')+'"></div>'+
   '<div class="gm-me-field full"><div class="gm-me-auto-commission"><div class="gm-me-auto-head"><div><small>COMISSÃO AUTOMÁTICA DE GESTOR</small><strong>2,2% sobre o crédito</strong></div><div><small>BRUTO PREVISTO</small><b data-auto-commission>R$ 0,00</b></div><div><small>LÍQUIDO ESTIMADO</small><b data-auto-net>R$ 0,00</b></div></div><div class="gm-me-auto-parcels" data-auto-parcels></div><p>Mesma regra de diluição da aba Comissionamento. O líquido usa a mesma dedução estimada de 19,73% (NF + ISS).</p></div></div>'+
   '<div class="gm-me-field full"><label>Observação</label><textarea class="gm-me-textarea" name="note" placeholder="Informações importantes da venda">'+esc(item.note||'')+'</textarea></div>'+
   '</div><div class="gm-me-modal-actions"><button type="button" class="gm-me-btn ghost" data-close-modal>Cancelar</button><button type="submit" class="gm-me-btn primary">Salvar venda</button></div></form>';
  setTimeout(function(){var form=document.getElementById('gmMeForm');renderSaleCommissionPreview(form)},0);
 }else{
  item=item||{};title.textContent=item.id?'Editar cliente':'Novo cliente';
  body.innerHTML='<form id="gmMeForm" data-type="client" data-id="'+esc(item.id||'')+'"><div class="gm-me-form-grid">'+
   '<div class="gm-me-field"><label>Nome</label><input class="gm-me-input" name="name" required value="'+esc(item.name||'')+'"></div>'+
   '<div class="gm-me-field"><label>Telefone / WhatsApp</label><input class="gm-me-input" name="phone" placeholder="(11) 99999-9999" value="'+esc(item.phone||'')+'"></div>'+
   '<div class="gm-me-field"><label>Produto</label><select class="gm-me-select" name="product"><option value="">Não definido</option><option '+(item.product==='Lar'?'selected':'')+'>Lar</option><option '+(item.product==='Motors'?'selected':'')+'>Motors</option><option '+(item.product==='Outro'?'selected':'')+'>Outro</option></select></div>'+
   '<div class="gm-me-field"><label>Crédito / potencial</label><input class="gm-me-input" name="credit" type="number" min="0" step="0.01" value="'+esc(num(item.credit)||'')+'"></div>'+
   '<div class="gm-me-field"><label>Status</label><select class="gm-me-select" name="status"><option '+(item.status==='Em acompanhamento'?'selected':'')+'>Em acompanhamento</option><option '+(item.status==='Cliente ativo'?'selected':'')+'>Cliente ativo</option><option '+(item.status==='Contemplado'?'selected':'')+'>Contemplado</option><option '+(item.status==='Perdido'?'selected':'')+'>Perdido</option></select></div>'+
   '<div class="gm-me-field"><label>Próximo contato</label><input class="gm-me-input" name="nextContact" type="date" value="'+esc(item.nextContact||'')+'"></div>'+
   '<div class="gm-me-field full"><label>Observação</label><textarea class="gm-me-textarea" name="note" placeholder="Follow-up, preferências, situação do cliente...">'+esc(item.note||'')+'</textarea></div>'+
   '</div><div class="gm-me-modal-actions"><button type="button" class="gm-me-btn ghost" data-close-modal>Cancelar</button><button type="submit" class="gm-me-btn primary">Salvar cliente</button></div></form>';
 }
 modal.classList.add('open');
 setTimeout(function(){body.querySelector('input,select,textarea')?.focus()},40);
}
function closeModal(){document.getElementById('gmMeModal')?.classList.remove('open')}
function submitForm(form){
 var fd=new FormData(form),type=form.dataset.type,editId=form.dataset.id,obj={};
 fd.forEach(function(v,k){obj[k]=v});
 if(type==='sale'){
  obj.id=editId||id();obj.credit=Math.max(0,num(obj.credit));obj.qty=Math.max(1,Math.round(num(obj.qty)||1));obj.condition=obj.condition||defaultCondition(obj.product);obj.product=conditionConfig(obj.condition).product;obj.commissionExpected=obj.credit*MANAGER_COMMISSION_RATE;obj.commissionReceived=Math.max(0,num(obj.commissionReceived));
  var old=data.sales.find(function(x){return x.id===editId});if(old&&old.sourceId)obj.sourceId=old.sourceId;
  if(editId)data.sales=data.sales.map(function(x){return x.id===editId?Object.assign({},x,obj):x});else data.sales.push(obj);
 }else{
  obj.id=editId||id();obj.credit=Math.max(0,num(obj.credit));
  if(editId)data.clients=data.clients.map(function(x){return x.id===editId?Object.assign({},x,obj):x});else data.clients.push(obj);
 }
 closeModal();save().then(function(ok){if(ok)toast(type==='sale'?'Venda salva.':'Cliente salvo.')});
}
function syncOwnSales(){
 setLoading(true);
 api('/api/state').then(function(r){
  var s=r.state;if(!s||!Array.isArray(s.sales)||!Array.isArray(s.consultants))throw new Error('A base principal ainda não está disponível.');
  var me=s.consultants.find(function(c){return String(c.id||'').toLowerCase()==='mateus'||String(c.name||'').toLocaleLowerCase('pt-BR').includes('mateus menezes')});
  if(!me)throw new Error('Não encontrei seu cadastro na equipe.');
  var own=s.sales.filter(function(x){return x.consultantId===me.id}),added=0,updated=0;
  own.forEach(function(x){
   var sourceId=String(x.id||''),raw=String(x.product||'').toLowerCase(),product=raw.includes('motor')?'Motors':raw.includes('lar')?'Lar':'Outro';
   var found=data.sales.find(function(y){return String(y.sourceId||'')===sourceId});
   if(found){
    var nextCredit=Math.max(0,num(x.amount)),nextQty=Math.max(1,Math.round(num(x.qty)||1)),nextDate=x.date||found.date||today();
    var nextCondition=found.condition||defaultCondition(product);var nextCommission=nextCredit*MANAGER_COMMISSION_RATE;if(found.credit!==nextCredit||found.qty!==nextQty||found.date!==nextDate||found.product!==product||found.condition!==nextCondition||found.commissionExpected!==nextCommission){found.credit=nextCredit;found.qty=nextQty;found.date=nextDate;found.product=product;found.condition=nextCondition;found.commissionExpected=nextCommission;updated++}
   }else{
    var newCredit=Math.max(0,num(x.amount)),newCondition=defaultCondition(product);data.sales.push({id:id(),sourceId:sourceId,date:x.date||today(),clientName:'',product:product,condition:newCondition,credit:newCredit,qty:Math.max(1,Math.round(num(x.qty)||1)),status:'Ativa',commissionExpected:newCredit*MANAGER_COMMISSION_RATE,commissionReceived:0,note:String(x.note||'')});added++;
   }
  });
  if(!added&&!updated){toast('Suas vendas do dashboard já estão sincronizadas.');return false}
  return save().then(function(ok){if(ok)toast((added?added+' nova'+(added===1?' venda':'s vendas'):'')+(added&&updated?' e ':'')+(updated?updated+' atualizada'+(updated===1?'':'s'):'')+'.');return ok})
 }).catch(function(e){toast(e.message,true)}).finally(function(){setLoading(false)})
}
function build(){
 if(app)return;
 app=document.createElement('section');app.id='gmMeApp';app.setAttribute('aria-hidden','true');
 app.innerHTML=
 '<div class="gm-me-shell">'+
  '<header class="gm-me-top"><div class="gm-me-brand"><small>ÁREA PRIVADA DO GESTOR</small><h1>EU · Painel Pessoal</h1><p>Suas vendas, comissão, clientes e metas em uma única base.</p></div><div class="gm-me-top-actions"><button class="gm-me-btn" id="gmMeSync">↻ Sincronizar vendas</button><button class="gm-me-btn primary" id="gmMeAddSale">+ Venda</button><button class="gm-me-btn primary" id="gmMeAddClient">+ Cliente</button><button class="gm-me-btn gm-me-close" id="gmMeClose" aria-label="Fechar">×</button></div></header>'+
  '<main class="gm-me-wrap">'+
   '<div class="gm-me-toolbar"><div class="gm-me-tabs"><button class="gm-me-tab active" data-me-tab="overview">Visão Geral</button><button class="gm-me-tab" data-me-tab="sales">Minhas Vendas</button><button class="gm-me-tab" data-me-tab="commission">Comissões</button><button class="gm-me-tab" data-me-tab="clients">Clientes</button><button class="gm-me-tab" data-me-tab="goals">Metas</button></div><div class="gm-me-period"><label>Período</label><select class="gm-me-select" id="gmMePeriod"></select></div></div>'+
   '<section class="gm-me-view active" id="gmMeView-overview"><section class="gm-me-profile-hero" id="gmMeProfileHero"><div class="gm-me-profile-portrait"><div class="gm-me-profile-ring"><img id="gmMeProfilePhoto" alt="Mateus Menezes" hidden><div id="gmMeProfileFallback" class="gm-me-profile-fallback">MM</div></div></div><div class="gm-me-profile-copy"><small>GESTÃO MENEZES · PERFORMANCE PESSOAL</small><h2 id="gmMeProfileName">Mateus Menezes</h2><p id="gmMeProfileRole">Gestor Comercial</p><div class="gm-me-profile-progress"><div class="gm-me-profile-progress-top"><span id="gmMeHeroPeriod">Meta do mês</span><b id="gmMeHeroPct">0%</b></div><div class="gm-me-profile-track"><i id="gmMeHeroBar"></i></div></div></div><div class="gm-me-profile-stats"><article><small>VENDIDO NO MÊS</small><b id="gmMeHeroSold">R$ 0</b></article><article><small>COMISSÃO ESTE MÊS</small><b id="gmMeHeroCommission">R$ 0</b></article></div></section><div class="gm-me-kpis" id="gmMeKpis"></div><div class="gm-me-grid gm-me-grid-balanced"><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Evolução das vendas</h2><p>Últimos 12 meses da sua produção própria</p></div></div><div class="gm-me-chart" id="gmMeChart"></div></article><article class="gm-me-card gm-me-cash-card"><div class="gm-me-card-head"><div><h2>Minha renda de comissão</h2><p>Fluxo previsto dos próximos 8 meses</p></div><button class="gm-me-btn ghost" data-open-tab="commission">Detalhar</button></div><div class="gm-me-cashflow-stats" id="gmMeCashflowStats"></div><div class="gm-me-chart gm-me-cashflow-chart" id="gmMeCashflowChart"></div></article></div><div class="gm-me-grid"><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Ritmo da meta</h2><p>Quanto falta e onde seu ritmo atual te leva</p></div><button class="gm-me-btn ghost" data-open-tab="goals">Ajustar meta</button></div><div id="gmMeGoals"></div></article><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Próximas ações</h2><p>O que merece sua atenção comercial agora</p></div><button class="gm-me-btn ghost" data-open-tab="clients">Ver clientes</button></div><div class="gm-me-next-actions" id="gmMeNextActions"></div></article></div><div class="gm-me-grid"><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Vendas recentes</h2><p>Últimos lançamentos do período selecionado</p></div><button class="gm-me-btn ghost" data-open-tab="sales">Ver todas</button></div><div class="gm-me-list" id="gmMeRecent"></div></article><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Performance pessoal</h2><p>Seu recorde e sua produção atual</p></div></div><div class="gm-me-record" id="gmMeRecord"></div></article></div><section class="gm-me-year-section"><div class="gm-me-year-head"><div><small>VISÃO ANUAL</small><h2>2026 em números</h2><p>Sua produção própria consolidada, sem depender do filtro mensal.</p></div><span class="gm-me-year-badge">ANO EM CURSO</span></div><div class="gm-me-year-kpis" id="gmMeAnnualCards"></div><div class="gm-me-year-grid"><article class="gm-me-year-chart-card"><div class="gm-me-card-head"><div><h2>Evolução mês a mês</h2><p>Crédito vendido ao longo do ano</p></div></div><div class="gm-me-year-chart" id="gmMeAnnualChart"></div></article><article class="gm-me-year-details" id="gmMeAnnualDetails"></article></div></section></section>'+
   '<section class="gm-me-view" id="gmMeView-sales"><div class="gm-me-section-head"><div><h2>Minhas Vendas</h2><p>Consulte, filtre e gerencie sua produção própria.</p></div><button class="gm-me-btn primary" data-add-sale>+ Nova venda</button></div><div class="gm-me-inline-summary" id="gmMeSalesSummary"></div><div class="gm-me-filterbar"><input class="gm-me-input" id="gmMeSalesSearch" placeholder="Buscar cliente, produto, valor..."><select class="gm-me-select" id="gmMeSalesProduct"><option value="">Todos os produtos</option><option value="Lar">Lar</option><option value="Motors">Motors</option></select><select class="gm-me-select" id="gmMeSalesStatus"><option value="">Todos os status</option><option value="Ativa">Ativa</option><option value="Contemplada">Contemplada</option><option value="Cancelada">Cancelada</option></select></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Data</th><th>Cliente</th><th>Produto</th><th>Crédito</th><th>Cotas</th><th>Comissão prevista</th><th>Recebida</th><th>Status</th><th>Ações</th></tr></thead><tbody id="gmMeSalesBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-commission"><div class="gm-me-section-head"><div><h2>Comissões</h2><p>Primeiro, quanto entra no caixa. Depois, os detalhes técnicos da sua comissão de 2,2%.</p></div></div><div class="gm-me-section-label"><span>FLUXO DE RECEBIMENTO</span><small>Projeção baseada na diluição de cada venda</small></div><div class="gm-me-summary-grid gm-me-summary-grid-4" id="gmMeCommissionCashflow"></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Mês</th><th>Comissão no mês</th><th>Líquido estimado</th><th>Vendas contribuindo</th></tr></thead><tbody id="gmMeMonthlyCommissionBody"></tbody></table></div><div class="gm-me-section-head gm-me-commission-detail-head"><div><h2>Visão acumulada das vendas</h2><p>Totais originais preservados: comissão gerada, recebida e saldo a receber.</p></div></div><div class="gm-me-summary-grid" id="gmMeCommissionSummary"></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Mês da venda</th><th>Vendas</th><th>Bruto previsto</th><th>Recebido</th><th>A receber</th><th>Recebimento</th></tr></thead><tbody id="gmMeCommissionBody"></tbody></table></div><div class="gm-me-section-head gm-me-commission-detail-head"><div><h2>Diluição automática por venda</h2><p>Detalhamento técnico; as parcelas abaixo fecham exatamente a comissão de gestor de 2,2%.</p></div></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Data</th><th>Cliente</th><th>Crédito</th><th>Condição</th><th>Comissão 2,2%</th><th>Diluição</th></tr></thead><tbody id="gmMeCommissionSalesBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-clients"><div class="gm-me-section-head"><div><h2>Meus Clientes</h2><p>Carteira e follow-ups que precisam virar ação.</p></div><button class="gm-me-btn primary" data-add-client>+ Novo cliente</button></div><div class="gm-me-inline-summary gm-me-inline-summary-4" id="gmMeClientsSummary"></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Produto</th><th>Crédito</th><th>Status</th><th>Próximo contato</th><th>Observação</th><th>Ações</th></tr></thead><tbody id="gmMeClientsBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-goals"><div class="gm-me-section-head"><div><h2>Metas pessoais</h2><p>Ritmo, projeção e objetivo do mês em uma única leitura.</p></div></div><div class="gm-me-goal-grid" id="gmMeGoalIntelligence"></div><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Configurar objetivos</h2><p>Esses valores alimentam as projeções da Visão Geral.</p></div></div><div class="gm-me-settings"><div class="gm-me-field"><label>Meta mensal de vendas (R$)</label><input class="gm-me-input" id="gmMeSalesTarget" type="number" min="0" step="1000"></div><div class="gm-me-field"><label>Meta mensal de comissão (R$)</label><input class="gm-me-input" id="gmMeCommissionTarget" type="number" min="0" step="100"></div></div><div class="gm-me-modal-actions"><button class="gm-me-btn primary" id="gmMeSaveGoals">Salvar metas</button></div></article></section>'+
  '</main>'+
 '</div>'+
 '<div class="gm-me-modal" id="gmMeModal"><div class="gm-me-modal-card"><div class="gm-me-modal-head"><h3 id="gmMeModalTitle"></h3><button type="button" class="gm-me-btn gm-me-close" data-close-modal>×</button></div><div id="gmMeModalBody"></div></div></div>'+
 '<div class="gm-me-toast" id="gmMeToast" role="status" aria-live="polite"></div>';
 document.body.appendChild(app);
 var sel=document.getElementById('gmMePeriod');sel.innerHTML='<option value="">Todos os períodos</option>';
 var now=new Date();
 for(var i=0;i<36;i++){var d=new Date(now.getFullYear(),now.getMonth()-i,1),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),o=document.createElement('option');o.value=m;o.textContent=monthLabel(m);sel.appendChild(o)}
 period='';sel.value=period;
 app.addEventListener('click',function(e){
  var t=e.target.closest('button');if(!t)return;
  if(t.id==='gmMeClose')return close();
  if(t.id==='gmMeAddSale'||t.hasAttribute('data-add-sale'))return openModal('sale');
  if(t.id==='gmMeAddClient'||t.hasAttribute('data-add-client'))return openModal('client');
  if(t.id==='gmMeSync')return syncOwnSales();
  if(t.hasAttribute('data-close-modal'))return closeModal();
  if(t.dataset.meTab){active=t.dataset.meTab;render();return}
  if(t.dataset.openTab){active=t.dataset.openTab;render();return}
  if(t.dataset.editSale){var s=data.sales.find(function(x){return x.id===t.dataset.editSale});if(s)openModal('sale',s);return}
  if(t.dataset.delSale){if(confirm('Excluir esta venda da sua base pessoal?')){data.sales=data.sales.filter(function(x){return x.id!==t.dataset.delSale});save()}return}
  if(t.dataset.editClient){var c=data.clients.find(function(x){return x.id===t.dataset.editClient});if(c)openModal('client',c);return}
  if(t.dataset.delClient){if(confirm('Excluir este cliente da sua base pessoal?')){data.clients=data.clients.filter(function(x){return x.id!==t.dataset.delClient});save()}return}
  if(t.dataset.whatsapp){var p=t.dataset.whatsapp;if(p.length===10||p.length===11)p='55'+p;window.open('https://wa.me/'+p,'_blank','noopener');return}
  if(t.id==='gmMeSaveGoals'){data.settings.monthlySalesTarget=Math.max(0,num(document.getElementById('gmMeSalesTarget').value));data.settings.monthlyCommissionTarget=Math.max(0,num(document.getElementById('gmMeCommissionTarget').value));save().then(function(ok){if(ok)toast('Metas atualizadas.')});return}
 });
 app.addEventListener('submit',function(e){if(e.target.id==='gmMeForm'){e.preventDefault();submitForm(e.target)}});
 app.addEventListener('input',function(e){var form=e.target.closest&&e.target.closest('#gmMeForm[data-type="sale"]');if(form&&e.target.name==='credit')renderSaleCommissionPreview(form)});
 app.addEventListener('change',function(e){
   var form=e.target.closest&&e.target.closest('#gmMeForm[data-type="sale"]');if(!form)return;
   if(e.target.name==='product'){
     var condition=form.elements.condition;
     if(condition)condition.value=e.target.value==='Motors'?'motors13':'lar50';
   }else if(e.target.name==='condition'){
     var product=form.elements.product,cfg=conditionConfig(e.target.value);
     if(product)product.value=cfg.product;
   }
   renderSaleCommissionPreview(form);
 });
 sel.addEventListener('change',function(){period=sel.value;render()});
 var salesSearch=document.getElementById('gmMeSalesSearch'),salesProductEl=document.getElementById('gmMeSalesProduct'),salesStatusEl=document.getElementById('gmMeSalesStatus');
 if(salesSearch)salesSearch.addEventListener('input',function(){salesQuery=this.value;renderSales()});
 if(salesProductEl)salesProductEl.addEventListener('change',function(){salesProduct=this.value;renderSales()});
 if(salesStatusEl)salesStatusEl.addEventListener('change',function(){salesStatus=this.value;renderSales()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&app.classList.contains('open')){if(document.getElementById('gmMeModal').classList.contains('open'))closeModal();else close()}});
}
function load(){
 setLoading(true);
 return api('/api/me').then(function(r){data=r.data||data;revision=r.revision||0;normalize();render()}).catch(function(e){toast(e.message,true)}).finally(function(){setLoading(false)})
}
function open(){build();app.classList.add('open');app.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';load();loadProfile()}
function close(){if(!app)return;app.classList.remove('open');app.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function installNav(){
 var existing=document.getElementById('gmMeNavV3');
 if(existing && existing.isConnected && existing.offsetParent!==null)return;
 if(existing)existing.remove();

 function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR')}
 var all=Array.from(document.querySelectorAll('button,a,[role="button"],.nav-item'));
 var equipe=all.find(function(el){var t=norm(el.textContent);return t==='equipe'||t.endsWith(' equipe')});
 var config=all.find(function(el){var t=norm(el.textContent);return t.includes('configurações')||t.includes('configuracoes')});
 var dash=all.find(function(el){return norm(el.textContent)==='dashboard'||norm(el.textContent).endsWith(' dashboard')});
 var template=equipe||config||dash;
 if(!template)return;

 var parent=template.parentNode;
 if(!parent)return;

 var b=template.cloneNode(true);
 b.id='gmMeNavV3';
 b.removeAttribute('href');
 b.removeAttribute('aria-current');
 b.classList.remove('active','selected','current');
 Array.from(b.attributes||[]).forEach(function(attr){
   if(/^data-(view|target|page|section|tab|go)$/i.test(attr.name))b.removeAttribute(attr.name);
 });
 b.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id')});
 b.querySelectorAll('[data-view],[data-target],[data-page],[data-section],[data-tab],[data-go]').forEach(function(el){
   ['data-view','data-target','data-page','data-section','data-tab','data-go'].forEach(function(a){el.removeAttribute(a)});
 });

 var leaves=Array.from(b.querySelectorAll('*')).filter(function(el){return el.children.length===0&&norm(el.textContent)});
 var label=leaves.length?leaves[leaves.length-1]:b;
 label.textContent='EU';
 b.setAttribute('aria-label','EU');
 b.title='EU · Painel Pessoal';
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open()});

 if(equipe&&equipe.parentNode===parent)parent.insertBefore(b,equipe);
 else if(config&&config.parentNode===parent)parent.insertBefore(b,config);
 else parent.appendChild(b);
}
async function boot(){
 try{var r=await api('/api/session');if(r.role!=='gestor')return}catch(e){return}
 document.querySelectorAll('link[href*="me-dashboard-20261118.css"]').forEach(function(el){el.remove()});
 var link=document.createElement('link');link.rel='stylesheet';link.href='/me-dashboard-v7-20261118.css?v=11';document.head.appendChild(link);
 build();installNav();setInterval(installNav,1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
