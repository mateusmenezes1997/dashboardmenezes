/* Gestão Menezes | Arena 4.0. Camada de leitura: não altera vendas, autenticação ou agendamentos. */
(function(){
'use strict';
if(window.__gmArenaV8)return;
window.__gmArenaV8=true;
var state=null,arena=null,mounted=false,mode='consultants',snapshot=null,prior=null,knownSaleIds=null,queued=false;
var tvIndex=0,tvTimer=null,tvRunning=false,tvSlides=['Campeão do momento','Pódio dos campeões','Corrida ao vivo','Duelo do momento','Próxima ultrapassagem','Evolução de vendas','Arena dos líderes','Movimentações da semana'];
var colors=['#e5bd78','#bcc4d0','#c89371'];
function byId(id){return document.getElementById(id)}
function node(tag,cls,content){var n=document.createElement(tag);if(cls)n.className=cls;if(content!=null)n.textContent=String(content);return n}
function text(id,v){var n=typeof id==='string'?byId(id):id;if(n)n.textContent=v==null?'':String(v)}
function number(v){var n=Number(v);return isFinite(n)?n:0}
function brl(n){return number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}
function compact(n){n=number(n);return n>=1000000?'R$ '+(n/1000000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' mi':n>=1000?'R$ '+(n/1000).toLocaleString('pt-BR',{maximumFractionDigits:0})+' mil':brl(n)}
function nowKey(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function initial(name){return String(name||'GM').trim().split(/\s+/).slice(0,2).map(function(x){return x.charAt(0)}).join('').toUpperCase()}
function photo(person){var v=String(person&&person.photo||'').trim();return /^(data:image\/(?:jpe?g|png|webp|gif);base64,|https:\/\/|\/(?!\/))/i.test(v)?v:''}
function face(person,cls){
 var host=node('div',cls),src=photo(person);
 if(src){var img=node('img');img.alt='Foto de '+(person.name||'consultor');img.loading='lazy';img.src=src;img.onerror=function(){host.textContent=initial(person.name)};host.appendChild(img)}
 else host.textContent=initial(person&&person.name);
 return host;
}
function isOpen(){return Boolean(arena&&arena.classList.contains('gmv-open')&&document.body.classList.contains('gmv-authenticated'))}
function opening(c,m){var v=c.monthOpenings&&c.monthOpenings[m];return Math.max(0,number(v?v.total:m==='2026-10'?c.opening:0))}
function aggregate(src){
 var month=nowKey().slice(0,7),members=Array.isArray(src.consultants)?src.consultants:[],sales=Array.isArray(src.sales)?src.sales:[],total=new Map(),qty=new Map(),lookup=new Map();
 members.forEach(function(c){var id=String(c.id);lookup.set(id,c);total.set(id,opening(c,month));var o=c.monthOpenings&&c.monthOpenings[month];qty.set(id,o?number(o.larQty)+number(o.motorsQty)+number(o.unclassifiedQty):0)});
 var monthSales=sales.filter(function(s){return String(s.date||'').slice(0,7)===month&&number(s.amount)>0&&lookup.has(String(s.consultantId))});
 monthSales.forEach(function(s){var id=String(s.consultantId);total.set(id,total.get(id)+number(s.amount));qty.set(id,qty.get(id)+Math.max(1,Math.round(number(s.qty)||1)))});
 var people=members.filter(function(c){return c.role!=='gestor'}).map(function(c){return {id:String(c.id),name:String(c.name||'Consultor'),photo:photo(c),gender:c.gender,role:c.role,total:Math.max(0,total.get(String(c.id))||0),qty:qty.get(String(c.id))||0}}).filter(function(p){return p.total>0}).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name,'pt-BR')});
 function descendants(id){
  var visited=new Set([String(id)]),found=[];
  function scan(parent){
   members.forEach(function(c){var cid=String(c.id);if(String(c.leaderId||'')!==String(parent)||visited.has(cid))return;visited.add(cid);found.push(c);scan(cid)});
  }
  scan(id);return found;
 }
 var leaders=members.filter(function(c){return c.role==='trainee'}).map(function(leader){
  var team=descendants(leader.id),peopleInTeam=[leader].concat(team);
  var teamTotal=team.reduce(function(a,c){return a+(total.get(String(c.id))||0)},0);
  var own=total.get(String(leader.id))||0;
  var quantities=peopleInTeam.reduce(function(a,c){return a+(qty.get(String(c.id))||0)},0);
  var active=team.filter(function(c){return (total.get(String(c.id))||0)>0}).length;
  return {id:String(leader.id),name:String(leader.name||'Líder'),photo:photo(leader),total:teamTotal+own,qty:quantities,active:active,members:team.length,average:team.length?teamTotal/team.length:0,teamTotal:teamTotal,own:own}
 }).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name,'pt-BR')});
 return {month:month,people:people,leaders:leaders,sales:monthSales,lookup:lookup,totals:total,members:members};
}
function ensure(){
 arena=byId('gmv-arena');if(!arena||!arena.classList.contains('gmv-v7'))return false;
 if(mounted)return true;
 var actions=arena.querySelector('.gmv-actions'),stage=arena.querySelector('.gmv-stage'),lower=arena.querySelector('.gmv-lower');
 if(!actions||!stage||!lower)return false;
 var switcher=node('div','gmv8-switch');
 switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Tipo de competição');
 [['consultants','CONSULTORES'],['leaders','LÍDERES']].forEach(function(item){
  var btn=node('button','gmv8-switch-btn',item[1]);btn.type='button';btn.dataset.mode=item[0];btn.setAttribute('aria-pressed',String(item[0]==='consultants'));
  btn.addEventListener('click',function(){mode=item[0];changeMode();paint();});
  switcher.appendChild(btn);
 });
 actions.insertBefore(switcher,actions.firstChild);
 var tvButton=node('button','gmv-btn gmv8-tv-button','▣ MODO TV');
 tvButton.type='button';tvButton.title='Apresentação automática em tela cheia';
 tvButton.addEventListener('click',function(){if(arena.requestFullscreen)arena.requestFullscreen().catch(function(){})});
 var fullscreen=byId('gmv-fullscreen');actions.insertBefore(tvButton,fullscreen||null);
 var leaders=node('section','gmv8-leaders');leaders.id='gmv8-leaders';
 leaders.innerHTML='<div class="gmv8-section-head"><div><span>ARENA DOS LÍDERES</span><h2>Performance das equipes</h2><p>Volume da estrutura, consultores ativos e média de produção.</p></div><span class="gmv8-caption">DADOS REAIS DO MÊS</span></div><div id="gmv8-leader-cards" class="gmv8-leader-cards"></div>';
 stage.insertAdjacentElement('beforebegin',leaders);
 var trends=node('section','gmv8-trends');trends.id='gmv8-trends';
 trends.innerHTML='<div class="gmv8-section-head"><div><span>EVOLUÇÃO DOS CAMPEÕES</span><h2>Quem está acelerando no mês?</h2><p>Histórico diário acumulado dos três primeiros, sem simulações.</p></div><span class="gmv8-caption">VENDAS ACUMULADAS POR DIA</span></div><div class="gmv8-chart-legend" id="gmv8-chart-legend"></div><div class="gmv8-chart-window"><div id="gmv8-chart" class="gmv8-chart"></div><div id="gmv8-chart-tooltip" class="gmv8-chart-tooltip" role="status" hidden></div></div><div id="gmv8-chart-note" class="gmv8-chart-note"></div>';
 stage.insertAdjacentElement('afterend',trends);
 var tv=node('div','gmv8-tv');tv.id='gmv8-tv';tv.setAttribute('aria-label','Apresentação automática da Arena');
 tv.innerHTML='<div class="gmv8-tv-head"><div><span>GESTÃO MENEZES</span><strong>ARENA DOS CAMPEÕES</strong></div><div class="gmv8-tv-live">● AO VIVO <span id="gmv8-tv-count"></span></div><div class="gmv8-tv-actions"><button type="button" id="gmv8-tv-prev" aria-label="Destaque anterior">‹</button><button type="button" id="gmv8-tv-pause" aria-label="Pausar a apresentação">❚❚</button><button type="button" id="gmv8-tv-next" aria-label="Próximo destaque">›</button><button type="button" id="gmv8-tv-exit" aria-label="Sair da tela cheia">SAIR</button></div></div><div id="gmv8-tv-body" class="gmv8-tv-body"></div><div class="gmv8-tv-foot"><span id="gmv8-tv-caption"></span><div id="gmv8-tv-progress" class="gmv8-tv-progress"></div></div>';
 arena.appendChild(tv);
 byId('gmv8-tv-prev').addEventListener('click',function(){tvIndex=(tvIndex+tvSlides.length-1)%tvSlides.length;paintTv()});
 byId('gmv8-tv-next').addEventListener('click',function(){tvIndex=(tvIndex+1)%tvSlides.length;paintTv()});
 byId('gmv8-tv-pause').addEventListener('click',function(){tvRunning=!tvRunning;this.textContent=tvRunning?'❚❚':'▶';this.setAttribute('aria-label',tvRunning?'Pausar':'Retomar');});
 byId('gmv8-tv-exit').addEventListener('click',function(){if(document.fullscreenElement===arena)document.exitFullscreen().catch(function(){})});
 mounted=true;changeMode();
 installPopupWatcher();
 return true;
}
function changeMode(){
 if(!arena)return;
 arena.classList.toggle('gmv8-leader-mode',mode==='leaders');
 arena.querySelectorAll('.gmv8-switch-btn').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===mode))});
}
function paintHero(){
 var champs=byId('gmv-champions');if(!champs)return;
 var cards=Array.prototype.slice.call(champs.querySelectorAll('.gmv-champion'));
 cards.forEach(function(card,i){
  card.classList.toggle('gmv8-first',i===0);
  if(i===0&&!card.querySelector('.gmv8-trophy')){
   var trophy=node('span','gmv8-trophy','🏆');
   trophy.setAttribute('aria-label','Troféu do primeiro lugar');
   card.appendChild(trophy);
  }
 });
 var old=champs.querySelectorAll('.gmv8-trophy');
 old.forEach(function(el){if(el.parentElement&&el.parentElement.dataset.place!=='1')el.remove()});
}
function paintLeaders(){
 var host=byId('gmv8-leader-cards');if(!host||!snapshot)return;
 host.replaceChildren();
 if(!snapshot.leaders.length){host.appendChild(node('div','gmv-empty','Nenhum líder cadastrado para esta competição.'));return}
 snapshot.leaders.forEach(function(p,i){
  var card=node('article','gmv8-leader-card'),head=node('div','gmv8-leader-head'),rank=node('div','gmv8-leader-rank',(i+1)+'º'),info=node('div','gmv8-leader-person'),name=node('strong','',p.name),label=node('small','',i===0?'LÍDER DO MÊS':'LIDERANÇA COMERCIAL');
  card.dataset.place=String(i+1);
  info.append(name,label);head.append(rank,face(p,'gmv8-leader-photo'),info);
  var amount=node('div','gmv8-leader-amount');amount.append(node('span','', 'VENDAS DA ESTRUTURA'),node('strong','',brl(p.total)));
  var metrics=node('div','gmv8-leader-metrics');
  [['CONSULTORES ATIVOS',String(p.active)+' / '+String(p.members)],['QUANTIDADE DE VENDAS',String(p.qty)],['MÉDIA POR CONSULTOR',brl(p.average)]].forEach(function(q){
   var cell=node('div');cell.append(node('small','',q[0]),node('strong','',q[1]));metrics.appendChild(cell);
  });
  card.append(head,amount,metrics);host.appendChild(card);
 });
}
function svgEl(tag,attrs,content){var x=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.keys(attrs||{}).forEach(function(k){x.setAttribute(k,String(attrs[k]))});if(content!=null)x.textContent=content;return x}
var chartInfo=null;
function paintChart(){
 var host=byId('gmv8-chart'),legend=byId('gmv8-chart-legend'),note=byId('gmv8-chart-note');
 if(!host||!snapshot)return;
 host.replaceChildren();legend.replaceChildren();chartInfo=null;
 var people=snapshot.people.slice(0,3),today=nowKey(),days=Number(today.slice(-2)),maxDays=Number(new Date(Number(today.slice(0,4)),Number(today.slice(5,7)),0).getDate());
 if(days<2||!people.length){host.appendChild(node('div','gmv-empty','Aguardando movimentações suficientes para mostrar a evolução diária.'));text(note,'A evolução começa com as vendas registradas neste mês.');return}
 var dates=Array.from({length:days},function(_,i){return snapshot.month+'-'+String(i+1).padStart(2,'0')});
 var rows=people.map(function(p,i){
  var c=snapshot.lookup.get(p.id),base=opening(c,snapshot.month),value=base,daily=new Map();
  snapshot.sales.filter(function(s){return String(s.consultantId)===p.id}).forEach(function(s){var d=String(s.date||'');daily.set(d,(daily.get(d)||0)+number(s.amount))});
  return {p:p,color:colors[i],opening:base,values:dates.map(function(d){value+=daily.get(d)||0;return value})};
 });
 var changes=rows.some(function(r){return r.values.some(function(v,j){return j>0&&Math.abs(v-r.values[j-1])>0.01})});
 if(!changes){host.appendChild(node('div','gmv-empty','Ainda não há variação diária suficiente para exibir o gráfico.'));text(note,'Os saldos iniciais importados são preservados; aguardando novas vendas em dias diferentes.');return}
 rows.forEach(function(r){
  var item=node('span','gmv8-legend-item'),dot=node('i');dot.style.background=r.color;
  item.append(dot,node('strong','',r.p.name));legend.appendChild(item);
 });
 var w=900,h=260,left=68,right=862,top=18,bottom=209,highest=Math.max(1,...rows.flatMap(function(r){return r.values}))*1.07;
 function x(i){return left+(days===1?0:i/(days-1))*(right-left)}
 function y(n){return bottom-(Math.max(0,n)/highest)*(bottom-top)}
 var svg=svgEl('svg',{viewBox:'0 0 '+w+' '+h,role:'img','aria-label':'Gráfico da evolução diária acumulada de vendas dos três consultores líderes'});
 svg.classList.add('gmv8-svg');
 [0,.25,.5,.75,1].forEach(function(k){
  var yp=bottom-(bottom-top)*k;
  svg.appendChild(svgEl('line',{x1:left,x2:right,y1:yp,y2:yp,stroke:'#5d4950','stroke-opacity':.36,'stroke-width':1}));
  svg.appendChild(svgEl('text',{x:left-10,y:yp+4,'text-anchor':'end',fill:'#ad9ca2','font-size':11},compact(highest*k)));
 });
 var ticks=days<10?dates.map(function(_,i){return i}):Array.from(new Set([0,Math.floor((days-1)/4),Math.floor((days-1)/2),Math.floor((days-1)*.75),days-1]));
 ticks.forEach(function(i){svg.appendChild(svgEl('text',{x:x(i),y:244,'text-anchor':'middle',fill:'#b3a3a4','font-size':12},String(i+1).padStart(2,'0')+'/'+snapshot.month.slice(-2)))});
 rows.forEach(function(r){
  var points=r.values.map(function(v,i){return x(i)+','+y(v)}).join(' ');
  svg.appendChild(svgEl('polyline',{points:points,fill:'none',stroke:r.color,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'}));
  svg.appendChild(svgEl('circle',{cx:x(days-1),cy:y(r.values[days-1]),r:5,fill:r.color,stroke:'#171017','stroke-width':2}));
 });
 var cursor=svgEl('line',{x1:0,y1:top,x2:0,y2:bottom,stroke:'#c7b6a3','stroke-opacity':.75,'stroke-dasharray':'4 5',visibility:'hidden'});
 svg.appendChild(cursor);host.appendChild(svg);
 chartInfo={rows:rows,dates:dates,days:days};
 var tooltip=byId('gmv8-chart-tooltip'),windowEl=host.parentElement;
 svg.addEventListener('pointermove',function(e){
  var rect=svg.getBoundingClientRect(),scaled=(e.clientX-rect.left)/Math.max(rect.width,1)*w,index=Math.max(0,Math.min(days-1,Math.round((scaled-left)/(right-left)*(days-1))));
  var xx=x(index);cursor.setAttribute('x1',xx);cursor.setAttribute('x2',xx);cursor.setAttribute('visibility','visible');
  tooltip.replaceChildren();
  tooltip.appendChild(node('strong','',dates[index].split('-').reverse().join('/')));
  rows.forEach(function(r){tooltip.appendChild(node('span','',r.p.name+' · '+brl(r.values[index])))});
  tooltip.hidden=false;
  var fraction=xx/w;
  tooltip.style.left=Math.max(8,Math.min((windowEl.clientWidth||800)-Math.min(250,(windowEl.clientWidth||800)-16),fraction*(windowEl.clientWidth||800)))+'px';
 });
 svg.addEventListener('pointerleave',function(){tooltip.hidden=true;cursor.setAttribute('visibility','hidden')});
 text(note,'Valores acumulados por dia. Saldos de abertura importados aparecem como base inicial, sem criar vendas fictícias. '+(maxDays-days)+' dia(s) restante(s) no mês.');
}
function updateRace(old,updated){
 if(!old||!updated)return;
 var added=Array.from(updated.sales).filter(function(s){return !knownSaleIds.has(String(s.id))});
 if(!added.length)return;
 var ids=new Set(added.map(function(s){return String(s.consultantId)}));
 setTimeout(function(){
  ids.forEach(function(id){
   var lane=Array.prototype.slice.call(document.querySelectorAll('#gmv-lanes .gmv-lane')).find(function(el){return el.dataset.id===id});
   if(lane){lane.classList.remove('gmv8-race-move');void lane.offsetWidth;lane.classList.add('gmv8-race-move');setTimeout(function(){lane.classList.remove('gmv8-race-move')},1600)}
  });
 },100);
}
function updateState(src){
 if(!src||!Array.isArray(src.consultants))return;
 var next=aggregate(src);
 if(snapshot&&knownSaleIds)updateRace(snapshot,next);
 state=src;snapshot=next;
 knownSaleIds=new Set(next.sales.map(function(s){return String(s.id)}));
 schedule();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){requestAnimationFrame(function(){queued=false;paint()})})}
function paint(){
 if(!ensure()||!snapshot||!document.body.classList.contains('gmv-authenticated'))return;
 paintHero();paintLeaders();paintChart();
 if(document.fullscreenElement===arena)paintTv();
}
function setPhotoBlock(host,p){
 var faceEl=face(p,'gmv8-tv-face');host.appendChild(faceEl);
}
function labeled(title,content,cls){var cell=node('div',cls||'gmv8-tv-stat');cell.append(node('small','',title),node('strong','',content));return cell}
function appendHeading(stage,supertitle,title){
 stage.append(node('span','gmv8-tv-kicker',supertitle),node('h2','gmv8-tv-title',title));
}
function paintTv(){
 if(!mounted||!snapshot||document.fullscreenElement!==arena)return;
 var target=byId('gmv8-tv-body');if(!target)return;
 target.replaceChildren();
 var top=snapshot.people.slice(0,3),leaders=snapshot.leaders,duel=[top[0],top[1]],title=tvSlides[tvIndex];
 text('gmv8-tv-caption',title.toUpperCase());
 text('gmv8-tv-count',String(tvIndex+1).padStart(2,'0')+' / '+String(tvSlides.length).padStart(2,'0'));
 var progress=byId('gmv8-tv-progress');progress.replaceChildren();
 tvSlides.forEach(function(_,i){var b=node('i');b.className=i===tvIndex?'active':'';progress.appendChild(b)});
 function empty(msg){target.appendChild(node('div','gmv8-tv-empty',msg))}
 if(tvIndex===0){
  appendHeading(target,'DESTAQUE MENSAL','CAMPEÃO DO MOMENTO');
  if(!top[0])return empty('Aguardando a primeira venda do mês');
  var box=node('div','gmv8-tv-hero');
  setPhotoBlock(box,top[0]);
  var content=node('div');content.append(node('span','gmv8-tv-gold',top[0].gender==='f'?'CAMPEÃ DO MÊS':'CAMPEÃO DO MÊS'),node('h3','',top[0].name),node('strong','',brl(top[0].total)));
  box.appendChild(content);target.appendChild(box);
 }else if(tvIndex===1){
  appendHeading(target,'ELITE DO MÊS','PÓDIO DOS CAMPEÕES');
  if(!top.length)return empty('Aguardando movimentação');
  var grid=node('div','gmv8-tv-grid');
  top.forEach(function(p,i){var c=node('div','gmv8-tv-podium');c.dataset.place=String(i+1);c.append(node('span','gmv8-tv-medal',(i+1)+'º LUGAR'),face(p,'gmv8-tv-face'),node('h3','',p.name),node('strong','',brl(p.total)));grid.appendChild(c)});
  target.appendChild(grid);
 }else if(tvIndex===2){
  appendHeading(target,'MOVIMENTAÇÃO EM TEMPO REAL','CORRIDA PELO TOPO');
  if(!top.length)return empty('Aguardando movimentação');
  var race=node('div','gmv8-tv-race');
  top.forEach(function(p,i){var line=node('div','gmv8-tv-race-row');line.append(face(p,'gmv8-tv-mini'),node('span','',p.name));var track=node('div','gmv8-tv-race-track'),fill=node('i');fill.style.width=Math.max(0,Math.min(100,top[0].total?100*p.total/top[0].total:0))+'%';fill.style.background=colors[i];track.appendChild(fill);line.append(track,node('strong','',brl(p.total)));race.appendChild(line)});
  target.appendChild(race);
 }else if(tvIndex===3){
  appendHeading(target,'CONFRONTO DIRETO','DUELO DO MOMENTO');
  if(top.length<2)return empty('Aguardando dois competidores');
  if(top[2]&&top[1].total-top[2].total<top[0].total-top[1].total)duel=[top[1],top[2]];
  var versus=node('div','gmv8-tv-versus');
  duel.forEach(function(p,i){if(i===1)versus.appendChild(node('b','gmv8-tv-vs','VS'));var c=node('div','gmv8-tv-duelist');c.append(face(p,'gmv8-tv-face'),node('h3','',p.name),node('strong','',brl(p.total)));versus.appendChild(c)});
  target.append(versus,labeled('DISTÂNCIA ENTRE OS COMPETIDORES',brl(Math.abs(duel[0].total-duel[1].total)),'gmv8-tv-gap'));
 }else if(tvIndex===4){
  appendHeading(target,'DISPUTA PELA LIDERANÇA','PRÓXIMA ULTRAPASSAGEM');
  if(top.length<2)return empty('Aguardando dois competidores');
  var chase=node('div','gmv8-tv-chase');
  chase.append(node('span','gmv8-tv-gold',top[1].name+' PERSEGUE '+top[0].name),node('strong','',brl(Math.max(0,top[0].total-top[1].total))),node('p','','de diferença entre os dois primeiros colocados.'));
  target.appendChild(chase);
 }else if(tvIndex===5){
  appendHeading(target,'CRESCIMENTO MENSAL','EVOLUÇÃO DOS CAMPEÕES');
  var orig=byId('gmv8-chart');var svg=orig&&orig.querySelector('svg');
  if(!svg)return empty('Aguardando histórico de vendas em dias diferentes');
  var copy=node('div','gmv8-tv-chart');copy.appendChild(svg.cloneNode(true));target.appendChild(copy);
  var textBox=node('div','gmv8-tv-legend');
  top.forEach(function(p,i){var it=node('span','',p.name);it.style.color=colors[i];textBox.appendChild(it)});
  target.appendChild(textBox);
 }else if(tvIndex===6){
  appendHeading(target,'RESULTADOS DAS ESTRUTURAS','ARENA DOS LÍDERES');
  if(!leaders.length)return empty('Nenhum líder cadastrado');
  var list=node('div','gmv8-tv-leader-list');
  leaders.slice(0,4).forEach(function(p,i){var row=node('div');row.append(node('b','',(i+1)+'º'),face(p,'gmv8-tv-mini'),node('span','',p.name),node('strong','',brl(p.total)),node('small','',p.active+' ativos · '+p.qty+' vendas'));list.appendChild(row)});
  target.appendChild(list);
 }else{
  appendHeading(target,'ÚLTIMAS MOVIMENTAÇÕES','MOVIMENTAÇÕES DA SEMANA');
  var today=nowKey(),d=new Date(today+'T12:00:00Z'),offset=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-offset);
  var since=d.toISOString().slice(0,10),sales=snapshot.sales.filter(function(s){return s.date>=since&&s.date<=today}).slice().sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''))}).slice(0,6);
  if(!sales.length)return empty('Sem vendas registradas nesta semana');
  var feed=node('div','gmv8-tv-feed');
  sales.forEach(function(s){var c=snapshot.lookup.get(String(s.consultantId));feed.appendChild(node('div','',(c&&c.name||'Consultor')+'  •  '+brl(s.amount)+'  •  '+String(s.date||'').split('-').reverse().join('/')))});
  target.appendChild(feed);
 }
}
function changeFullScreen(){
 if(!ensure())return;
 if(document.fullscreenElement===arena){
  arena.classList.add('gmv8-tv-active');tvRunning=true;tvIndex=0;
  byId('gmv8-tv-pause').textContent='❚❚';
  paintTv();clearInterval(tvTimer);
  tvTimer=setInterval(function(){if(!tvRunning||!document.fullscreenElement||!isOpen())return;var popup=byId('gmv-event');if(popup&&popup.classList.contains('gmv-show'))return;tvIndex=(tvIndex+1)%tvSlides.length;paintTv()},9000);
 }else{
  arena.classList.remove('gmv8-tv-active');clearInterval(tvTimer);tvTimer=null;tvRunning=false;
 }
}
var popupProcessed=false;
function installPopupWatcher(){
 var popup=byId('gmv-event');if(!popup||popup.dataset.gmv8Watcher)return;popup.dataset.gmv8Watcher='true';
 function process(){
  if(!popup.classList.contains('gmv-show')){popupProcessed=false;popup.classList.remove('gmv8-tier-sale','gmv8-tier-overtake','gmv8-tier-leader');return}
  if(popupProcessed)return;popupProcessed=true;
  var movement=popup.querySelector('.gmv-celebration-movement'),rank=popup.querySelector('.gmv-celebration-rank'),rankText=rank?rank.textContent:'';
  var crowned=Boolean(movement&&/1\s*[º°]\s*LUGAR/i.test(rankText));
  var tier=crowned?'leader':movement?'overtake':'sale';
  popup.classList.add('gmv8-tier-'+tier);
  var small=popup.querySelector('small'),title=popup.querySelector('strong');
  if(small){
   if(crowned){
    var name=title?title.textContent.replace(/^PARABÉNS,?\s*/i,'').replace(/!$/,'').trim():'';
    var person=state&&state.consultants&&state.consultants.find(function(c){return String(c.name).trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')});
    small.textContent=person&&person.gender==='f'?'NOVA CAMPEÃ DO MOMENTO':'NOVO CAMPEÃO DO MOMENTO';
   }else if(tier==='overtake')small.textContent='ULTRAPASSAGEM CONFIRMADA';
   else small.textContent='NOVA VENDA • GESTÃO MENEZES';
  }
  if(tier==='sale')setTimeout(function(){if(popup.classList.contains('gmv-show')&&popup.classList.contains('gmv8-tier-sale')){var close=popup.querySelector('button[aria-label="Fechar mensagem de parabéns"]');if(close)close.click()}},6500);
 }
 new MutationObserver(process).observe(popup,{attributes:true,attributeFilter:['class'],childList:true});
}
function boot(){
 if(!ensure()){setTimeout(boot,400);return}
 window.addEventListener('gm:performance-state',function(e){updateState(e.detail)});
 document.addEventListener('fullscreenchange',changeFullScreen);
 window.addEventListener('focus',schedule);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();