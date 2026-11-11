/* Gestão Menezes · Dashboard Performance v2
   Escopo somente visual. Dados: estado oficial da gestão. Não escreve vendas,
   não muda autenticação, ranking de líderes ou agendamentos. */
(function(){
'use strict';
if(window.__gmDashboardPerformanceV2)return;
window.__gmDashboardPerformanceV2=true;
var remote=null,lastKey='',booted=false;
function byId(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function brl(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}
function compact(n){n=Number(n)||0;return Math.abs(n)>=1000000?'R$ '+(n/1000000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' mi':brl(n)}
function asNum(n){return Number(n)||0}
function month(){var el=byId('monthFilter');return el?el.value:''}
function getSource(){try{if(remote&&Array.isArray(remote.consultants))return remote;if(typeof state!=='undefined'&&state&&Array.isArray(state.consultants))return state}catch(e){}return null}
function logged(){var el=byId('gmAuth');return Boolean(el&&el.classList.contains('hidden'))}
function imageUrl(url){var u=String(url||'');return /^(data:image\/(?:png|jpeg|webp|gif);base64,|https:\/\/|\/(?!\/))/i.test(u)?u:''}
function initials(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('').toUpperCase()}
function face(p,cls){if(!p)return '<div class="'+cls+'">—</div>';var src=imageUrl(p.photo);return '<div class="'+cls+'">'+(src?'<img src="'+esc(src)+'" alt="Foto de '+esc(p.name)+'" loading="lazy">':esc(initials(p.name)))+'</div>'}
function originalOpening(c,m){
 var o=c.monthOpenings&&c.monthOpenings[m];
 if(o)return {amount:asNum(o.total),qty:asNum(o.larQty)+asNum(o.motorsQty)+asNum(o.unclassifiedQty)};
 return m==='2026-10'?{amount:asNum(c.opening),qty:asNum(c.openingLarQty)+asNum(c.openingMotorsQty)+asNum(c.openingUnclassifiedQty)}:{amount:0,qty:0};
}
function buildData(source,m){
 var by={},quantity={},ids={};
 source.consultants.forEach(function(c){ids[c.id]=true;var o=originalOpening(c,m);by[c.id]=o.amount;quantity[c.id]=o.qty});
 var sales=(source.sales||[]).filter(function(x){return String(x.date||'').slice(0,7)===m&&ids[x.consultantId]});
 sales.forEach(function(x){by[x.consultantId]+=asNum(x.amount);quantity[x.consultantId]+=Math.max(1,Math.round(asNum(x.qty)||1))});
 var people=source.consultants.map(function(c){return {id:c.id,name:c.name,gender:c.gender,role:c.role,photo:c.photo,total:by[c.id]||0,qty:quantity[c.id]||0}}).filter(function(c){return c.role!=='gestor'&&c.total>0}).sort(function(a,b){return b.total-a.total||String(a.name).localeCompare(String(b.name),'pt-BR')});
 var total=Object.keys(by).reduce(function(sum,id){return sum+by[id]},0);
 var qty=Object.keys(quantity).reduce(function(sum,id){return sum+quantity[id]},0);
 return {people:people,by:by,total:total,qty:qty,sales:sales,goal:asNum(source.settings&&source.settings.teamTarget)||15000000};
}
function panelHeader(title,desc,badge){return '<div class="gm-p2-head"><div><span class="gm-p2-eyebrow">'+esc(badge||'GESTÃO MENEZES')+'</span><h3>'+esc(title)+'</h3>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div></div>'}
function makeLayout(){
 var page=byId('dashboard');if(!page||byId('gm-performance-v2'))return;
 var host=document.createElement('div');host.id='gm-performance-v2';host.className='gm-p2';host.setAttribute('aria-label','Painel de performance comercial');
 host.innerHTML=
 '<section class="gm-p2-panel gm-p2-hero" aria-labelledby="gm-p2-goal-title">'+
 ' <div><span class="gm-p2-eyebrow">CENTRAL DE PERFORMANCE • GESTÃO MENEZES</span><h3 id="gm-p2-goal-title">Rumo à meta da gestão</h3>'+
 ' <strong id="gm-p2-total" class="gm-p2-total gm-p2-money">R$ —</strong><div class="gm-p2-meta" id="gm-p2-goal-summary">Acompanhamento do mês selecionado</div>'+
 ' <div class="gm-p2-track" role="progressbar" aria-label="Meta de vendas da gestão" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="gm-p2-fill"></span></div>'+
 ' <div class="gm-p2-progress-legend"><span id="gm-p2-pct">0% atingido</span><span id="gm-p2-goal">Meta: R$ 15 mi</span></div></div>'+
 ' <div class="gm-p2-goal-side"><div class="gm-p2-stat"><span class="gm-p2-label">FALTA PARA CONQUISTAR</span><strong class="gm-p2-goal-number gm-p2-money" id="gm-p2-gap">R$ —</strong></div>'+
 ' <div class="gm-p2-stat"><span class="gm-p2-label">RITMO PROJETADO NO MÊS</span><strong class="gm-p2-goal-number gm-p2-money" id="gm-p2-projection">—</strong></div>'+
 ' <div class="gm-p2-stat"><span class="gm-p2-label">PERÍODO</span><strong id="gm-p2-month" style="display:block;margin-top:6px;font-size:14px">—</strong></div></div></section>'+
 ' <div class="gm-p2-strip"><article><span class="gm-p2-label">COTAS VENDIDAS / BASE</span><b id="gm-p2-quotas">—</b></article>'+
 ' <article><span class="gm-p2-label">CONSULTORES COM RESULTADO</span><b id="gm-p2-active">—</b></article>'+
 ' <article><span class="gm-p2-label">MÉDIA POR VENDEDOR ATIVO</span><b id="gm-p2-average">—</b></article>'+
 ' <article><span class="gm-p2-label">MAIOR VENDA INDIVIDUAL</span><b id="gm-p2-top">—</b></article></div>'+
 ' <section class="gm-p2-panel"><div class="gm-p2-head"><div><span class="gm-p2-eyebrow">ARENA DOS CAMPEÕES</span><h3>Pódio do mês</h3><p>Os três maiores resultados entre consultores e líderes</p></div><span class="gm-p2-tag">TOP 3</span></div><div class="gm-p2-podium-grid" id="gm-p2-podium"></div></section>'+
 ' <div class="gm-p2-grid2">'+
 ' <section class="gm-p2-panel">'+panelHeader('Corrida para o topo','Proporção em relação ao primeiro colocado','COMPETIÇÃO EM TEMPO REAL')+'<div id="gm-p2-race"></div></section>'+
 ' <section class="gm-p2-panel">'+panelHeader('Últimas vitórias','Lançamentos reais do período selecionado','FEED COMERCIAL')+'<div class="gm-p2-feed" id="gm-p2-feed"></div></section></div>'+
 ' <div class="gm-p2-grid3">'+
 ' <section class="gm-p2-panel">'+panelHeader('Evolução das semanas','Vendas lançadas com data, sem distribuir saldos históricos','PRODUÇÃO SEMANAL')+'<div class="gm-p2-week-bars" id="gm-p2-weeks"></div></section>'+
 ' <section class="gm-p2-panel">'+panelHeader('Duelo do momento','Diferença entre os concorrentes mais próximos','DISPUTA COMERCIAL')+'<div class="gm-p2-duel" id="gm-p2-duel"></div></section>'+
 ' <section class="gm-p2-panel">'+panelHeader('Líderes da gestão','Resultados somados das equipes','TOP LIDERANÇAS')+'<div class="gm-p2-leader-list" id="gm-p2-leaders"></div></section></div>';
 var anchor=page.querySelector('.topbar');if(anchor)anchor.insertAdjacentElement('afterend',host);else page.prepend(host);
 var heading=page.querySelector('.content-grid .section-head h3');if(heading)heading.textContent='Classificação completa';
}
function makeTools(){
 var dashboard=byId('dashboard'),actions=dashboard&&dashboard.querySelector('.topbar .actions');
 if(!actions)return;
 var nodes=['exportBtn','exportRankCard','autoRankExport'].map(byId).filter(Boolean);
 var menu=actions.querySelector('.gm-p2-tools');
 if(!menu && !nodes.length)return;
 if(!menu){
  menu=document.createElement('details');menu.className='gm-p2-tools';
  var summary=document.createElement('summary');summary.textContent='Ferramentas';
  summary.setAttribute('aria-label','Abrir ferramentas de exportação');
  var box=document.createElement('div');box.className='gm-p2-toolbox';
  menu.append(summary,box);
  var saleBtn=actions.querySelector('[data-go="sale"]');
  if(saleBtn)actions.insertBefore(menu,saleBtn);else actions.appendChild(menu);
  document.addEventListener('pointerdown',function(ev){if(menu.open&&!menu.contains(ev.target))menu.open=false});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&menu.open){menu.open=false;summary.focus()}});
 }
 var target=menu.querySelector('.gm-p2-toolbox');
 if(!target)return;
 nodes.forEach(function(n){
  var item=n.id==='autoRankExport'?n.closest('label'):n;
  if(item&&item.parentElement!==target)target.appendChild(item);
 });
 var hasTools=!!target.querySelector('#exportBtn,#exportRankCard,#autoRankExport');
 menu.hidden=!hasTools;
 if(!hasTools)menu.open=false;
}
function podiumCard(p,pos){
 var label=pos===1?(p&&p.gender==='f'?'CAMPEÃ DO MÊS':'CAMPEÃO DO MÊS'):pos===2?'VICE-LIDERANÇA':'3º LUGAR';
 var cls=pos===1?'gold':pos===2?'silver':'bronze';
 return '<article class="gm-p2-person '+cls+(p?'':' empty')+'"><span class="gm-p2-medal">'+pos+'º</span>'+
 (pos===1?'<span class="gm-p2-trophy" aria-hidden="true">🏆</span>':'')+
 face(p,'gm-p2-face')+'<h4>'+esc(p?p.name:'Aguardando resultado')+'</h4>'+
 '<strong class="gm-p2-money">'+(p?brl(p.total):'—')+'</strong><small>'+label+'</small></article>';
}
function drawPodium(people){
 var top=people.slice(0,3);
 byId('gm-p2-podium').innerHTML=podiumCard(top[1],2)+podiumCard(top[0],1)+podiumCard(top[2],3);
}
function drawRace(people){
 var host=byId('gm-p2-race'),max=people[0]?people[0].total:0;
 if(!max){host.innerHTML='<div class="gm-p2-empty">A corrida começa assim que uma venda for registrada.</div>';return}
 host.innerHTML=people.slice(0,6).map(function(p,i){
  var pct=Math.max(2,Math.min(100,p.total/max*100));
  return '<div class="gm-p2-race-row"><span class="gm-p2-race-place">'+(i+1)+'º</span>'+
  face(p,'gm-p2-race-photo')+'<div><div class="gm-p2-race-name" title="'+esc(p.name)+'">'+esc(p.name)+'</div>'+
  '<div class="gm-p2-race-track"><span style="width:'+pct.toFixed(2)+'%"></span></div></div>'+
  '<span class="gm-p2-race-value">'+compact(p.total)+'</span></div>';
 }).join('');
}
function drawFeed(data,source){
 var host=byId('gm-p2-feed'),names={};
 source.consultants.forEach(function(c){names[c.id]=c.name});
 var rows=data.sales.slice().sort(function(a,b){
  var ta=String(a.createdAt||a.at||a.date||''),tb=String(b.createdAt||b.at||b.date||'');
  return tb.localeCompare(ta);
 }).slice(0,5);
 if(!rows.length){host.innerHTML='<div class="gm-p2-empty">Sem novos lançamentos datados neste mês. A base histórica permanece contabilizada na meta.</div>';return}
 host.innerHTML=rows.map(function(s){
  var label=names[s.consultantId]||'Consultor';
  var date=String(s.date||'');
  return '<div class="gm-p2-feed-item"><span class="gm-p2-feed-icon">✦</span><div><strong>'+esc(label)+' · '+brl(s.amount)+'</strong>'+
   '<small>'+esc(date.split('-').reverse().join('/'))+' · '+Math.max(1,Math.round(asNum(s.qty)||1))+' cota(s) · '+(s.product==='lar'?'Lar':s.product==='motors'?'Motors':'Não classificado')+'</small></div></div>';
 }).join('');
}
function drawWeeks(data,m){
 var sums=[0,0,0,0,0];
 data.sales.forEach(function(s){var day=parseInt(String(s.date||'').slice(8,10),10);if(day>=1&&day<=31)sums[Math.min(4,Math.floor((day-1)/7))]+=asNum(s.amount)});
 var max=Math.max.apply(null,sums.concat([1]));
 var host=byId('gm-p2-weeks');
 host.innerHTML=sums.map(function(v,i){
  var height=v?Math.max(7,Math.round(v/max*100)):2;
  return '<div class="gm-p2-week-col" title="Semana '+(i+1)+': '+esc(brl(v))+'"><span class="gm-p2-week-value">'+(v?compact(v):'—')+'</span>'+
   '<div class="gm-p2-week-bar" style="height:'+height+'%"></div><span class="gm-p2-week-label">'+(i===4?'29–fim':(i*7+1)+'–'+((i+1)*7))+'</span></div>';
 }).join('');
}
function drawDuel(people){
 var host=byId('gm-p2-duel');if(people.length<2){host.innerHTML='<div class="gm-p2-empty">É preciso ter pelo menos dois vendedores com resultado para iniciar uma disputa.</div>';return}
 var a=people[0],b=people[1],min=Infinity;
 for(var i=0;i<people.length-1;i++){var gap=people[i].total-people[i+1].total;if(gap<min){min=gap;a=people[i];b=people[i+1]}}
 host.innerHTML='<div class="gm-p2-duel-pair"><span class="gm-p2-duel-name">'+esc(a.name)+'</span><span class="gm-p2-duel-versus">VS</span><span class="gm-p2-duel-name">'+esc(b.name)+'</span></div>'+
 '<div><span class="gm-p2-label">DIFERENÇA ATUAL</span><div class="gm-p2-duel-gap">'+brl(min)+'</div></div>'+
 '<p>'+esc(b.name)+' precisa vender mais de '+brl(min)+' para ultrapassar '+esc(a.name)+'.</p>';
}
function drawLeaders(source,data,m){
 var host=byId('gm-p2-leaders'),leaderRows=[];
 try{
  var manager=source.consultants.find(function(c){return c.role==='gestor'})||source.consultants.find(function(c){return c.id==='mateus'});
  var leaders=source.consultants.filter(function(c){return c.role==='trainee'&&(!manager||c.leaderId===manager.id)});
  function descendants(id,visited){
   visited=visited||{};if(visited[id])return [];visited[id]=true;
   return source.consultants.filter(function(c){return c.leaderId===id&&c.id!==id}).reduce(function(all,c){all.push(c);return all.concat(descendants(c.id,visited))},[]);
  }
  leaderRows=leaders.map(function(leader){
   var team=descendants(leader.id,{});
   return {name:leader.name,number:team.length,total:[leader].concat(team).reduce(function(a,c){return a+asNum(data.by[c.id])},0)};
  }).sort(function(a,b){return b.total-a.total||String(a.name).localeCompare(String(b.name),'pt-BR')});
 }catch(e){leaderRows=[]}
 if(!leaderRows.length){host.innerHTML='<div class="gm-p2-empty">Nenhuma liderança cadastrada neste período.</div>';return}
 host.innerHTML=leaderRows.slice(0,3).map(function(r,i){return '<div class="gm-p2-leader-row"><span class="gm-p2-leader-rank">'+(i+1)+'º</span><div><strong class="gm-p2-leader-name">'+esc(r.name)+'</strong>'+
 '<div class="gm-p2-leader-detail">'+brl(r.total)+' · '+r.number+' consultor'+(r.number===1?'':'es')+' na equipe</div></div></div>'}).join('');
}
function currentMonthDate(m){
 var date=new Date();var yyyy=date.getFullYear(),mm=String(date.getMonth()+1).padStart(2,'0');
 if(yyyy+'-'+mm!==m)return null;
 return {day:date.getDate(),days:new Date(yyyy,date.getMonth()+1,0).getDate()};
}
function refresh(){
 if(!logged())return;
 var source=getSource(),m=month();
 if(!source||!m||!Array.isArray(source.sales))return;
 if(!byId('gm-performance-v2'))makeLayout();
 if(!byId('gm-performance-v2'))return;
 makeTools();
 var data=buildData(source,m);
 var key=JSON.stringify([m,data.goal,data.total,data.qty,data.people.map(function(p){return [p.id,p.total,String(p.photo||'').length,String(p.photo||'').slice(0,30),p.name,p.gender]}),data.sales.map(function(s){return [s.id,s.amount,s.date,s.consultantId,s.qty]}),source.consultants.map(function(c){return [c.id,c.leaderId,c.role,c.name]}),new Date().toISOString().slice(0,10)]);
 if(key===lastKey)return;lastKey=key;
 var pct=Math.min(100,data.total/data.goal*100),gap=Math.max(0,data.goal-data.total);
 var now=currentMonthDate(m);
 byId('gm-p2-total').textContent=brl(data.total);
 byId('gm-p2-goal').textContent='Meta: '+brl(data.goal);
 byId('gm-p2-pct').textContent=pct.toLocaleString('pt-BR',{maximumFractionDigits:1})+'% atingido';
 byId('gm-p2-goal-summary').textContent='Resultado consolidado da gestão · vendas registradas + saldos de abertura';
 byId('gm-p2-gap').textContent=gap?brl(gap):'META CONQUISTADA';
 byId('gm-p2-projection').textContent=now?brl(data.total/Math.max(1,now.day)*now.days):'Mês encerrado';
 byId('gm-p2-month').textContent=m.split('-').reverse().join('/');
 byId('gm-p2-fill').style.width=pct+'%';
 byId('gm-p2-fill').parentElement.setAttribute('aria-valuenow',String(Math.round(pct)));
 byId('gm-p2-quotas').textContent=String(data.qty);
 byId('gm-p2-active').textContent=String(data.people.length);
 byId('gm-p2-average').textContent=brl(data.people.length?data.people.reduce(function(sum,p){return sum+p.total},0)/data.people.length:0);
 byId('gm-p2-top').textContent=brl(data.people[0]?data.people[0].total:0);
 drawPodium(data.people);drawRace(data.people);drawFeed(data,source);drawWeeks(data,m);drawDuel(data.people);drawLeaders(source,data,m);
}
function boot(){
 if(booted)return;booted=true;
 var style=document.createElement('link');style.rel='stylesheet';style.href='/dashboard-performance-20261111.css?v=3';document.head.appendChild(style);
 makeLayout();makeTools();refresh();
 var m=byId('monthFilter');if(m)m.addEventListener('change',function(){lastKey='';setTimeout(refresh,80)});
 window.addEventListener('gm:performance-state',function(ev){if(ev.detail&&Array.isArray(ev.detail.consultants)){remote=ev.detail;lastKey='';refresh()}});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){lastKey='';refresh()}});
 setInterval(refresh,2800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();