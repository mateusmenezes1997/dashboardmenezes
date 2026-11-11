/* GESTAO MENEZES // ARENA V6: only real recorded results */
(function(){
'use strict';
if(window.__gmArenaV6)return;window.__gmArenaV6=true;
var GOAL=5000000,arena=null,ticker=null,champions=null,lanes=null,news=null,snapshot=null,remoteState=null;
var previous=new Map(),hasServerBaseline=false,enabledSound=false,duelIndex=0,duelTimer=0,toastTimer=0;
var latestSignature='',lastTape='',inFlight=false,lastSync=0,sessionDenied=false,lastAuth=false,notices=[],unread=0;
var COLORS=['#eac782','#9de2ed','#d3819d'];
var money=function(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})};
var compact=function(n){return (Number(n)||0).toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:2})};
var percent=function(n){return Number(n||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'};
var dateKey=function(d){return String(d||'').slice(0,7)};
var currentMonth=function(){var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());return parts.slice(0,7)};
var monthLabel=function(){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',month:'long',year:'numeric'}).format(new Date())};
var initials=function(n){return String(n||'').trim().split(/\s+/).slice(0,2).map(function(w){return w[0]||''}).join('').toUpperCase()||'GM'};
var qs=function(id){return document.getElementById(id)};
var h=function(tag,cls){var el=document.createElement(tag);if(cls)el.className=cls;return el};
var text=function(el,content){if(el)el.textContent=content==null?'':String(content)};
function authenticated(){
 var auth=qs('gmAuth');
 return !!auth && auth.classList.contains('hidden') && !sessionDenied;
}
function localState(){
 try{if(typeof state!=='undefined'&&state&&Array.isArray(state.consultants))return state}catch(e){}
 return null;
}
function allowedPhoto(value){
 var v=String(value||'').trim();
 if(/^data:image\/(?:jpeg|jpg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(v))return v;
 if(/^https:\/\//i.test(v)||/^\/(?!\/)/.test(v))return v;
 return '';
}
function photoInto(host,p){
 if(!host)return;
 var src=allowedPhoto(p&&p.photo),old=host.querySelector('img');
 if(src){
  if(old && old.getAttribute('src')===src)return;
  host.replaceChildren();
  var img=h('img');img.alt=p.name||'Foto do consultor';img.loading='eager';img.decoding='async';img.src=src;
  img.onerror=function(){if(img.parentNode===host){host.replaceChildren();var fallback=h('span',host.classList.contains('gmv-fighter-face')?'gmv-fighter-initials':'gmv-initials');text(fallback,initials(p.name));host.appendChild(fallback)}};
  host.appendChild(img);
 }else{
  if(old || !host.textContent.trim()){host.replaceChildren();var span=h('span',host.classList.contains('gmv-fighter-face')?'gmv-fighter-initials':'gmv-initials');text(span,initials(p.name));host.appendChild(span)}
 }
}
function calculate(source){
 if(!source || !Array.isArray(source.consultants))return {people:[],trio:[],sales:[],total:0,target:15000000,month:currentMonth()};
 var m=currentMonth(),by=Object.create(null),qty=Object.create(null),members=source.consultants;
 members.forEach(function(c){
  var baseline=c.monthOpenings&&c.monthOpenings[m],v=baseline?Number(baseline.total)||0:(m==='2026-10'?Number(c.opening)||0:0);
  by[c.id]=Math.max(0,v);qty[c.id]=baseline?(Number(baseline.larQty||0)+Number(baseline.motorsQty||0)+Number(baseline.unclassifiedQty||0)):0;
 });
 var sales=(Array.isArray(source.sales)?source.sales:[]).filter(function(s){return dateKey(s.date)===m});
 sales.forEach(function(s){
  if(!(s.consultantId in by))return;
  by[s.consultantId]+=Number(s.amount)||0;qty[s.consultantId]+=Math.max(1,Math.round(Number(s.qty)||1));
 });
 var local=localState();var published=[];try{if(typeof publishedTeamPhotos!=='undefined'&&Array.isArray(publishedTeamPhotos))published=publishedTeamPhotos}catch(e){}
 var people=members.filter(function(c){return c.role!=='gestor'}).map(function(c){
 var fallback=local&&local.consultants.find(function(item){return String(item.id)===String(c.id)});
 var official=published.find(function(item){return String(item.id)===String(c.id)});
 return {id:String(c.id),name:String(c.name||'Consultor'),photo:c.photo||(fallback&&fallback.photo)||(official&&official.photo)||'',role:c.role||'consultor',gender:c.gender||'',total:Math.max(0,by[c.id]||0),qty:qty[c.id]||0}
 }).filter(function(p){return p.total>0}).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name,'pt-BR')});
 return {people:people,trio:people.slice(0,3),sales:sales,total:Object.values(by).reduce(function(acc,n){return acc+Math.max(0,n||0)},0),target:Number(source.settings&&source.settings.teamTarget)||15000000,month:m};
}
function makeUI(){
 if(arena)return;
 ticker=h('div');ticker.id='gmv-ticker';
 ticker.innerHTML='<div id="gmv-ticker-brand"><i class="gmv-live-dot"></i> MENEZES / EXCHANGE</div><div id="gmv-ticker-window"><div id="gmv-ticker-track"></div></div><button type="button" id="gmv-notify" aria-label="Notificações"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><sup id="gmv-notify-count" hidden>0</sup></button><button type="button" id="gmv-ticker-open">◈ ABRIR ARENA</button>';
 document.body.appendChild(ticker);
 var launcher=h('button');launcher.type='button';launcher.id='gmv-launch';launcher.textContent='◈ ARENA LIVE';launcher.title='Abrir a Arena de Performance';document.body.appendChild(launcher);
 arena=h('section');arena.id='gmv-arena';arena.setAttribute('aria-hidden','true');arena.setAttribute('aria-label','Arena de Performance da Gestão Menezes');
 arena.innerHTML=[
 '<div class="gmv-wrap"><header class="gmv-head">',
 '<div><div class="gmv-kicker"><i class="gmv-live-dot"></i> GESTÃO MENEZES / SISTEMA DE PERFORMANCE</div><h1>ARENA <em>LIVE.</em></h1><div class="gmv-sub">Corrida de crédito • desafios reais • os três campeões do mês</div></div>',
 '<div class="gmv-actions"><span id="gmv-status" class="gmv-status"><i class="gmv-live-dot"></i> CONECTANDO</span>',
 '<button type="button" class="gmv-btn" id="gmv-sound" aria-pressed="false">♪ SOM OFF</button>',
 '<button type="button" class="gmv-btn" id="gmv-fullscreen">⛶ TELA CHEIA</button>',
 '<button type="button" class="gmv-btn" id="gmv-close">✕ FECHAR</button></div></header>',
 '<div class="gmv-stats"><div class="gmv-stat"><small>Volume da gestão / mês</small><strong id="gmv-stat-total">—</strong></div>',
 '<div class="gmv-stat"><small>Volume dos três campeões</small><strong id="gmv-stat-trio">—</strong></div>',
 '<div class="gmv-stat"><small>Avanço da meta gestão</small><strong id="gmv-stat-target">—</strong></div>',
 '<div class="gmv-stat"><small>Mês de referência</small><strong id="gmv-stat-month">—</strong></div></div>',
 '<div class="gmv-section-label">01 / ELITE DO MÊS</div><div class="gmv-stage">',
 '<div class="gmv-stage-top"><strong>Os três protagonistas da competição</strong><span>FOTOS OFICIAIS • VALORES REAIS</span></div>',
 '<div id="gmv-champions" class="gmv-champions"></div>',
 '<div class="gmv-track-label"><strong>◈ CORRIDA DE PERFORMANCE</strong><small>Posição relativa ao líder • avanço real de crédito</small></div>',
 '<div id="gmv-lanes" class="gmv-track-zone"></div></div>',
 '<div class="gmv-lower"><div class="gmv-panel"><div class="gmv-section-label">02 / FACE OFF</div>',
 '<h2>Confronto dos campeões</h2><div class="gmv-panel-sub">Duelo visual 1×1: quem está mais à frente em crédito vendido?</div>',
 '<div class="gmv-duel-tabs"><button class="gmv-duel-tab" type="button" data-duel="0" aria-pressed="true">1 × 2</button><button class="gmv-duel-tab" type="button" data-duel="1" aria-pressed="false">2 × 3</button><button class="gmv-duel-tab" type="button" data-duel="2" aria-pressed="false">1 × 3</button></div>',
 '<div id="gmv-duel-content"></div></div>',
 '<div class="gmv-panel"><div class="gmv-section-label">03 / RADAR</div><h2>Pulso comercial do mês</h2>',
 '<div class="gmv-panel-sub">Vendas registradas • sem resultados simulados</div><div id="gmv-news" class="gmv-news"></div></div></div>',
 '<div class="gmv-footer"><span>GESTÃO MENEZES • DADOS DO DASHBOARD / SINCRONIZAÇÃO AUTOMÁTICA</span><span>REFRESH SEGURO • ATÉ 4 SEGUNDOS COM PÁGINA ATIVA</span></div>',
 '</div><div id="gmv-event" role="status" aria-live="polite"></div>'
 ].join('');
 document.body.appendChild(arena);
 champions=qs('gmv-champions');lanes=qs('gmv-lanes');news=qs('gmv-news');
 qs('gmv-ticker-open').addEventListener('click',open);
 var nPanel=h('div');nPanel.id='gmv-notify-panel';nPanel.hidden=true;document.body.appendChild(nPanel);
 qs('gmv-notify').addEventListener('click',function(){nPanel.hidden=!nPanel.hidden;unread=0;renderNotifications()});
 qs('gmv-launch').addEventListener('click',open);
 qs('gmv-close').addEventListener('click',close);
 qs('gmv-sound').addEventListener('click',function(){
  enabledSound=!enabledSound;
  this.setAttribute('aria-pressed',String(enabledSound));this.textContent=enabledSound?'♪ SOM ON':'♪ SOM OFF';
 });
 qs('gmv-fullscreen').addEventListener('click',function(){
  try{if(!document.fullscreenElement && arena.requestFullscreen)arena.requestFullscreen();else if(document.exitFullscreen)document.exitFullscreen()}catch(e){}
 });
 arena.querySelectorAll('[data-duel]').forEach(function(b){b.addEventListener('click',function(){duelIndex=Number(b.dataset.duel)||0;renderDuel()})});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&arena.classList.contains('gmv-open'))close()});
 document.addEventListener('fullscreenchange',function(){if(document.fullscreenElement===arena){if(ticker&&ticker.parentElement!==arena)arena.appendChild(ticker)}else if(ticker&&ticker.parentElement!==document.body){document.body.appendChild(ticker)}});
}
function open(){
 if(!authenticated())return;
 makeUI();
 var panel=qs('gmv-notify-panel');if(panel)panel.hidden=true;
 arena.classList.add('gmv-open');arena.setAttribute('aria-hidden','false');
 document.body.classList.add('gmv-immersive');
 if(!document.body.dataset.gmvOldOverflow)document.body.dataset.gmvOldOverflow=document.body.style.overflow||'unset';
 document.body.style.overflow='hidden';
 render(true);
 refresh();
}
function close(){
 if(!arena)return;
 arena.classList.remove('gmv-open');arena.setAttribute('aria-hidden','true');
 document.body.classList.remove('gmv-immersive');
 document.body.style.overflow=document.body.dataset.gmvOldOverflow==='unset'?'':document.body.dataset.gmvOldOverflow||'';
 delete document.body.dataset.gmvOldOverflow;
 if(document.fullscreenElement===arena&&document.exitFullscreen)document.exitFullscreen().catch(function(){});
}
function cardFor(p,i){
 var existing=Array.from(champions.children).find(function(el){return el.dataset.id===p.id});
 if(existing)return existing;
 var el=h('article','gmv-champion');el.dataset.id=p.id;
 el.innerHTML='<div class="gmv-champ-top"><span class="gmv-champ-mark"></span><span class="gmv-champ-icon"></span></div><div class="gmv-champ-middle"><div class="gmv-portrait"></div><div><div class="gmv-champ-name"></div><div class="gmv-champ-role"></div></div></div><strong class="gmv-champ-total"></strong><div class="gmv-champ-foot"><span>META INDIVIDUAL 5MM</span><span class="gmv-champ-pct"></span></div><div class="gmv-champ-progress"><i></i></div>';
 return el;
}
function laneFor(p){
 var existing=Array.from(lanes.children).find(function(el){return el.dataset.id===p.id});
 if(existing)return existing;
 var el=h('div','gmv-lane');el.dataset.id=p.id;
 el.innerHTML='<div class="gmv-lane-name"></div><div class="gmv-path"><div class="gmv-path-fill"></div><div class="gmv-runner"></div></div><div class="gmv-lane-amount"></div>';
 return el;
}
function reorder(container,people,paint){
 var old=new Map(Array.from(container.children).map(function(el){var rect=el.getBoundingClientRect();return [el.dataset.id,{x:rect.left,y:rect.top}]}));
 var ids=new Set();
 people.forEach(function(p,i){ids.add(p.id);var el=paint(p,i);container.appendChild(el)});
 Array.from(container.children).forEach(function(el){if(!ids.has(el.dataset.id))el.remove()});
 requestAnimationFrame(function(){
  Array.from(container.children).forEach(function(el){
   var a=old.get(el.dataset.id);if(!a)return;
   var rect=el.getBoundingClientRect(),x=a.x-rect.left,y=a.y-rect.top;
   if(Math.abs(x)+Math.abs(y)<2)return;
   el.style.transition='none';el.style.transform='translate('+x+'px,'+y+'px)';
   requestAnimationFrame(function(){el.style.transition='transform .75s cubic-bezier(.19,.9,.17,1)';el.style.transform='translate(0,0)';setTimeout(function(){if(el.style.transform==='translate(0px, 0px)'||el.style.transform==='translate(0, 0)'||el.style.transform==='translate(0,0)'){el.style.removeProperty('transform');el.style.removeProperty('transition')}},840)});
  });
 });
}
function renderChampions(){
 var arr=snapshot?snapshot.trio:[],titles=[arr[0]&&(arr[0].gender==='f'||arr[0].gender==='female')?'CAMPEÃ DO MÊS':'CAMPEÃO DO MÊS','DESAFIANTE PRINCIPAL','NA DISPUTA'],symbols=['♛','✧','◇'];
 reorder(champions,arr,function(p,i){
  var el=cardFor(p,i);el.dataset.place=String(i+1);
  text(el.querySelector('.gmv-champ-mark'),titles[i]);
  text(el.querySelector('.gmv-champ-icon'),symbols[i]);
  photoInto(el.querySelector('.gmv-portrait'),p);
  text(el.querySelector('.gmv-champ-name'),p.name);
  text(el.querySelector('.gmv-champ-role'),p.role==='trainee'?'LÍDER DE EQUIPE':p.gender==='f'?'CONSULTORA':'CONSULTOR');
  text(el.querySelector('.gmv-champ-total'),money(p.total));
  text(el.querySelector('.gmv-champ-pct'),percent(100*p.total/GOAL));
  el.querySelector('.gmv-champ-progress i').style.width=Math.min(100,100*p.total/GOAL)+'%';
  return el;
 });
 if(!arr.length)champions.innerHTML='<div class="gmv-empty">A arena ainda está vazia neste mês. A primeira venda registrada abre a disputa.</div>';
}
function renderRace(){
 var arr=snapshot?snapshot.trio:[],leader=arr.length?Math.max(1,arr[0].total):1;
 reorder(lanes,arr,function(p,i){
  var el=laneFor(p);el.dataset.place=String(i+1);
  el.style.setProperty('--gmv-color',COLORS[i]);
  var name=el.querySelector('.gmv-lane-name');name.replaceChildren();
  name.appendChild(document.createTextNode(p.name));var mini=h('small');mini.textContent='CORREDOR '+String(i+1).padStart(2,'0');name.appendChild(mini);
  text(el.querySelector('.gmv-lane-amount'),money(p.total));
  var fraction=Math.max(.08,p.total/leader),position=Math.min(91,9+fraction*80);
  el.querySelector('.gmv-path-fill').style.width=position+'%';
  var runner=el.querySelector('.gmv-runner');runner.style.left=position+'%';
  photoInto(runner,p);
  return el;
 });
 if(!arr.length)lanes.innerHTML='<div class="gmv-empty">Aguardando o início da corrida de vendas.</div>';
}
function fighter(p){
 var box=h('div','gmv-fighter');var face=h('div','gmv-fighter-face');
 photoInto(face,p);var name=h('div','gmv-fighter-name');text(name,p.name);
 var sum=h('div','gmv-fighter-sum');text(sum,money(p.total));
 box.append(face,name,sum);return box;
}
function renderDuel(){
 var host=qs('gmv-duel-content');if(!host||!snapshot)return;
 var arr=snapshot.trio,pairs=[[0,1],[1,2],[0,2]],pair=pairs[duelIndex],a=arr[pair[0]],b=arr[pair[1]];
 arena.querySelectorAll('[data-duel]').forEach(function(el){el.setAttribute('aria-pressed',String(Number(el.dataset.duel)===duelIndex));el.disabled=!(arr[pairs[Number(el.dataset.duel)][0]]&&arr[pairs[Number(el.dataset.duel)][1]])});
 host.replaceChildren();
 if(!a||!b){var no=h('div','gmv-empty');text(no,'Aguardando pelo menos dois campeões com produção neste mês para iniciar o duelo.');host.appendChild(no);return}
 var stage=h('div','gmv-duel-stage'),vs=h('div','gmv-vs');vs.textContent='VS';stage.append(fighter(a),vs,fighter(b));
 var adv=h('div','gmv-duel-advantage'),gap=Math.abs(a.total-b.total);
 text(adv,gap<.01?'DISPUTA EMPATADA':(a.total>b.total?a.name:b.name)+' À FRENTE POR '+money(gap));
 var meter=h('div','gmv-duel-meter'),left=h('div'),right=h('div'),sum=Math.max(1,a.total+b.total);
 left.style.width=(100*a.total/sum)+'%';left.style.background='linear-gradient(90deg,#7e294e,#f1c578)';
 right.style.width=(100*b.total/sum)+'%';right.style.background='linear-gradient(90deg,#8ce7e1,#456779)';
 meter.append(left,right);host.append(stage,adv,meter);
}
function renderNews(){
 if(!snapshot||!news)return;
 var rows=snapshot.sales.slice().sort(function(a,b){var da=String(a.date||''),db=String(b.date||'');return db.localeCompare(da)}).slice(0,4);
 news.replaceChildren();
 if(!rows.length){var no=h('div','gmv-empty');text(no,'Ainda não há lançamentos individuais recentes neste mês. A produção inicial registrada continua visível na disputa.');news.appendChild(no);return}
 rows.forEach(function(s){
  var p=snapshot.people.find(function(q){return q.id===String(s.consultantId)});
  var el=h('div','gmv-news-row'),dot=h('i','gmv-news-dot'),copy=h('div'),label=h('strong'),meta=h('small');
  text(label,(p?p.name:'Consultor')+' • '+money(s.amount));
  text(meta,(String(s.product)==='motors'?'MOTORS':String(s.product)==='lar'?'LAR':'VENDA')+'  /  '+String(s.date||'').split('-').reverse().join('/'));
  copy.append(label,meta);el.append(dot,copy);news.appendChild(el);
 });
}
function renderTicker(){
 if(!ticker||!snapshot)return;
 var p=snapshot.people,items=p.length?p.slice(0,12):[{id:'zero',name:'Aguardando vendas do mês',total:0}];
 var key=snapshot.month+'|'+items.map(function(x){return x.id+':'+x.total}).join(';');
 if(lastTape===key)return;lastTape=key;
 var track=qs('gmv-ticker-track');track.replaceChildren();
 for(var pass=0;pass<2;pass++)for(var repeat=0;repeat<Math.max(1,Math.ceil(10/items.length));repeat++)items.forEach(function(item){
  var cell=h('div','gmv-tick');var name=h('span','gmv-tick-name'),value=h('span','gmv-tick-money'),pct=h('span','gmv-tick-pct'),sep=h('span','gmv-tick-sep');
  text(name,item.name);text(value,money(item.total));text(pct,percent(100*item.total/GOAL)+' DA META');text(sep,'◇');
  cell.append(name,value,pct,sep);track.appendChild(cell);
 });
}
function render(force){
 if(!arena||!snapshot)return;
 var sig=snapshot.month+'|'+snapshot.people.map(function(p){return p.id+':'+p.total+':'+String(p.photo).length}).join('|')+'|'+snapshot.total+'|'+snapshot.sales.length;
 if(force||sig!==latestSignature){
  latestSignature=sig;
  text(qs('gmv-stat-total'),money(snapshot.total));
  text(qs('gmv-stat-trio'),money(snapshot.trio.reduce(function(a,p){return a+p.total},0)));
  text(qs('gmv-stat-target'),percent(100*snapshot.total/Math.max(1,snapshot.target)));
  text(qs('gmv-stat-month'),monthLabel());
  renderTicker();renderChampions();renderRace();renderDuel();renderNews();
 }
 var status=qs('gmv-status');if(status){
  status.classList.toggle('gmv-offline',lastSync===0);
  text(status,(lastSync?'● SINCRONIZADO ':'◉ DADOS LOCAIS ') +(lastSync?new Date(lastSync).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo'}):''));
 }
}
function chime(){
 if(!enabledSound)return;
 try{
  var Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  var ctx=new Audio();
  [523,784,1047].forEach(function(freq,i){
   var osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+i*.115;
   osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.09,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.19);
  });
  setTimeout(function(){ctx.close()},900);
 }catch(e){}
}
// Rebuild the weekly feed from persisted sales, including daily ranking changes.
var knownSales=null,celebrationQueue=[],celebrationActive=false,closeCelebration=null;
function weeklyHistory(source,now){
 var today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now||new Date());
 var monday=new Date(today+'T12:00:00Z');monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
 var start=monday.toISOString().slice(0,10),events=[],members=source.consultants||[],sales=source.sales||[];
 var days=Array.from(new Set(sales.map(function(s){return s.date}).filter(function(d){return d>=start&&d<=today}))).sort();
 days.forEach(function(day){
  var month=day.slice(0,7),totals=new Map();
  members.filter(function(c){return c.role!=='gestor'}).forEach(function(c){var o=c.monthOpenings&&c.monthOpenings[month];totals.set(String(c.id),Number(o?o.total:month==='2026-10'?c.opening:0)||0)});
  sales.filter(function(s){return dateKey(s.date)===month&&s.date<day}).forEach(function(s){var id=String(s.consultantId);if(totals.has(id))totals.set(id,totals.get(id)+(Number(s.amount)||0))});
  var before=new Map(totals);
  sales.filter(function(s){return s.date===day}).forEach(function(s){
   var c=members.find(function(c){return String(c.id)===String(s.consultantId)});if(!c)return;
   events.push({id:'sale:'+s.id,date:day,title:c.name+' vendeu '+money(s.amount),label:'VENDA REGISTRADA • '+(Number(s.qty)||1)+' cota(s)'});
   var id=String(c.id);if(totals.has(id))totals.set(id,totals.get(id)+(Number(s.amount)||0));
  });
  members.filter(function(c){return totals.has(String(c.id))}).forEach(function(c){
   var id=String(c.id),passed=members.filter(function(other){var oid=String(other.id);return oid!==id&&before.has(oid)&&before.get(id)<=before.get(oid)&&totals.get(id)>totals.get(oid)&&totals.get(id)>before.get(id)});
   if(passed.length)events.push({id:'rank:'+day+':'+id,date:day,title:c.name+' passou '+passed.map(function(c){return c.name}).join(', '),label:'RANKING MENSAL • comparação do saldo do dia'});
  });
 });
 return events.sort(function(a,b){return b.date.localeCompare(a.date)});
}
function renderNotifications(){
 var count=qs('gmv-notify-count'),box=qs('gmv-notify-panel');if(!box)return;
 if(count){count.hidden=unread<=0;text(count,Math.min(99,unread))}
 box.replaceChildren();
 var head=h('div','gmv-notification-title');text(head,'HISTÓRICO DA SEMANA');box.appendChild(head);
 var hint=h('small');text(hint,'Desde segunda-feira • vendas e mudanças no ranking');box.appendChild(hint);
 if(!notices.length){var empty=h('div','gmv-notification-item');text(empty,'Nenhuma venda registrada nesta semana.');box.appendChild(empty)}
 notices.forEach(function(n){var item=h('div','gmv-notification-item'),top=h('strong'),sub=h('small');text(top,n.title);text(sub,n.date.split('-').reverse().join('/')+' • '+n.label);item.append(top,sub);box.appendChild(item)});
}
function showNextCelebration(){
 if(celebrationActive||!celebrationQueue.length||!authenticated())return;
 celebrationActive=true;var n=celebrationQueue.shift(),el=qs('gmv-event'),backdrop=qs('gmv-celebration-backdrop');
 if(!backdrop){backdrop=h('div');backdrop.id='gmv-celebration-backdrop';backdrop.setAttribute('aria-hidden','true')}
 var host=document.fullscreenElement||document.body;host.append(backdrop,el);
 el.replaceChildren();
 var dismiss=h('button'),small=h('small'),large=h('strong'),amount=h('div','gmv-celebration-amount'),face=h('div','gmv-celebration-photo'),message=h('p','gmv-celebration-message'),movement=h('div','gmv-celebration-movement'),rank=h('div','gmv-celebration-rank');
 dismiss.type='button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Fechar mensagem de parabéns');
 text(small,'NOVA VENDA • GESTÃO MENEZES');text(large,'PARABÉNS, '+n.person.name+'!');
 text(message,'Você realizou mais um sonho de um cliente!');
 text(amount,'Você vendeu '+Number(n.sale.amount).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}));
 if(n.passed&&n.passed.length){
  var movementTitle=h('small'),movementNames=h('strong');
  text(movementTitle,'VOCÊ ACABA DE ULTRAPASSAR');
  text(movementNames,n.passed.join(', '));
  movement.append(movementTitle,movementNames);
  text(rank,'ULTRAPASSOU '+n.passed.length+' '+(n.passed.length===1?'PESSOA':'PESSOAS')+(n.position?' • AGORA ESTÁ EM '+n.position+'º LUGAR':''));
 }else{
  movement.remove();
  text(rank,n.position?'Agora você está em '+n.position+'º lugar no ranking do mês!':'Mais uma conquista para a Gestão Menezes!');
 }
 photoInto(face,n.person);el.append(dismiss,face,small,large,message,amount);if(n.passed&&n.passed.length)el.append(movement);el.append(rank);el.classList.add('gmv-show');backdrop.classList.add('gmv-show');
 el.setAttribute('aria-hidden','false');
 var finished=false;
 function done(){if(finished)return;finished=true;clearTimeout(toastTimer);el.classList.remove('gmv-show');el.setAttribute('aria-hidden','true');backdrop.classList.remove('gmv-show');celebrationActive=false;closeCelebration=null;toastTimer=setTimeout(showNextCelebration,450)}
 closeCelebration=done;dismiss.onclick=done;backdrop.onclick=done;toastTimer=setTimeout(done,10000);chime();
}
function updateWith(newState,fromServer){
 if(!newState)return;
 var next=calculate(newState);
 if(fromServer){
  var sales=newState.sales||[],members=newState.consultants||[],oldIds=new Set(notices.map(function(n){return n.id}));
  notices=weeklyHistory(newState);
  if(knownSales){
   unread+=notices.filter(function(n){return !oldIds.has(n.id)}).length;
   var runningTotals=new Map();
   members.filter(function(c){return c.role!=='gestor'}).forEach(function(c){runningTotals.set(String(c.id),0)});
   if(snapshot&&snapshot.month===next.month)snapshot.people.forEach(function(p){runningTotals.set(String(p.id),Number(p.total)||0)});
   function rankedFromRunning(){
    return members.filter(function(c){return c.role!=='gestor'&&(runningTotals.get(String(c.id))||0)>0}).map(function(c){return{id:String(c.id),name:String(c.name||'Consultor'),total:runningTotals.get(String(c.id))||0}}).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name,'pt-BR')});
   }
   sales.filter(function(s){return !knownSales.has(String(s.id))}).forEach(function(s){
    var p=members.find(function(c){return String(c.id)===String(s.consultantId)});if(!p||!(Number(s.amount)>0))return;
    var passed=[],position=0;
    if(dateKey(s.date)===next.month&&runningTotals.has(String(p.id))){
     var beforeRank=rankedFromRunning(),sellerId=String(p.id),beforePos=beforeRank.findIndex(function(item){return item.id===sellerId});
     runningTotals.set(sellerId,(runningTotals.get(sellerId)||0)+(Number(s.amount)||0));
     var afterRank=rankedFromRunning(),afterPos=afterRank.findIndex(function(item){return item.id===sellerId});
     position=afterPos>=0?afterPos+1:0;
     passed=beforeRank.filter(function(item,index){
      if(item.id===sellerId)return false;
      var afterOther=afterRank.findIndex(function(row){return row.id===item.id});
      var wasAhead=beforePos<0||index<beforePos;
      return wasAhead&&afterPos>=0&&afterOther>afterPos;
     }).map(function(item){return item.name});
    }
    celebrationQueue.push({sale:s,person:p,position:position,passed:passed});
   });
  }else unread=notices.length;
  knownSales=new Set(sales.map(function(s){return String(s.id)}));
  renderNotifications();showNextCelebration();hasServerBaseline=true;
 }
 snapshot=next;
 window.dispatchEvent(new CustomEvent('gm:performance-state',{detail:newState}));
 render();
}
function sync(){
 if(inFlight||!authenticated()||document.hidden)return;
 inFlight=true;
 fetch('/api/state',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}})
 .then(function(r){
  if(r.status===401||r.status===403){sessionDenied=true;close();var auth=qs('gmAuth');if(auth)auth.classList.remove('hidden');document.body.classList.remove('gmv-authenticated');throw new Error('Sessão encerrada')}
  if(!r.ok)throw new Error('Falha na sincronização');
  return r.json();
 }).then(function(result){
  if(result&&result.state){sessionDenied=false;remoteState=result.state;lastSync=Date.now();updateWith(remoteState,true)}
 }).catch(function(){if(arena)render(false)}).finally(function(){inFlight=false});
}
function refresh(){
 if(!authenticated())return;
 if(!remoteState){var s=localState();if(s)updateWith(s,false)}
 sync();
}
function checkLogin(){
 var active=authenticated();
 document.body.classList.toggle('gmv-authenticated',active);
 if(!active){
  if(closeCelebration)closeCelebration();
  if(arena&&arena.classList.contains('gmv-open'))close();
  remoteState=null;lastSync=0;hasServerBaseline=false;knownSales=null;notices=[];unread=0;celebrationQueue=[];celebrationActive=false;clearTimeout(toastTimer);var popup=qs('gmv-event');if(popup)popup.classList.remove('gmv-show');var panel=qs('gmv-notify-panel');if(panel)panel.hidden=true;lastTape='';latestSignature='';
 }else if(!lastAuth){
  sessionDenied=false;refresh();
 }
 lastAuth=active;
}
function boot(){
 var style=h('style');style.textContent='#gmv-celebration-backdrop{position:fixed;inset:0;z-index:10049;background:rgba(4,6,12,.65);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .35s,visibility .35s}#gmv-celebration-backdrop.gmv-show{opacity:1;visibility:visible;pointer-events:auto}body:not(.gmv-authenticated) #gmv-celebration-backdrop{display:none!important}#gmv-event:not(.gmv-show){visibility:hidden}#gmv-event strong{display:block;overflow-wrap:anywhere}.gmv-celebration-message{color:#e6dfe5;font:500 clamp(16px,2.5vw,21px)/1.5 Manrope,Arial;margin:18px 0 0}.gmv-celebration-rank{display:inline-block;margin-top:20px;padding:12px 18px;border:1px solid #eac78266;border-radius:14px;background:#eac78212;color:#f2cc82;font:800 clamp(15px,2.5vw,20px)/1.5 Manrope,Arial}.gmv-celebration-movement{margin:22px auto 0;width:min(610px,100%);padding:16px 18px;border-radius:16px;border:1px solid rgba(234,199,130,.48);background:linear-gradient(135deg,rgba(234,199,130,.16),rgba(126,23,50,.14));box-shadow:0 0 34px rgba(234,199,130,.10)}.gmv-celebration-movement small{display:block;color:#f0cb8c;font:900 11px/1.2 Manrope,Arial;letter-spacing:.16em}.gmv-celebration-movement strong{margin-top:8px;color:#fff;font:900 clamp(19px,3vw,30px)/1.15 Manrope,Arial;text-transform:uppercase}@media(prefers-reduced-motion:reduce){#gmv-celebration-backdrop{transition:none}}#gmv-event{top:50%;transform:translate(-50%,-45%) scale(.96);z-index:10050;width:min(700px,92vw);box-sizing:border-box;max-height:90vh;overflow:auto}#gmv-event.gmv-show{transform:translate(-50%,-50%) scale(1);pointer-events:auto}#gmv-event button{position:absolute;right:14px;top:8px;background:transparent;border:0;color:#fff;font-size:30px;cursor:pointer}#gmv-event .gmv-celebration-photo{width:90px;height:90px;border:3px solid #eac782;border-radius:50%;overflow:hidden;margin:0 auto 18px;display:grid;place-items:center;color:#eac782;font-size:28px}#gmv-event img{width:100%;height:100%;object-fit:cover}.gmv-celebration-amount{font:bold clamp(23px,4vw,40px) Arial;color:#f2cc82;margin-top:22px}body:not(.gmv-authenticated) #gmv-event,body:not(.gmv-authenticated) #gmv-notify-panel{display:none!important}#gmv-notify-panel{max-height:min(65vh,600px);width:min(430px,calc(100vw - 28px))}.gmv-notification-item strong{overflow-wrap:anywhere}@media(prefers-reduced-motion:reduce){#gmv-event{transition:none}}';document.head.appendChild(style);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&closeCelebration){e.stopImmediatePropagation();closeCelebration()}},true);
 document.addEventListener('fullscreenchange',function(){if(celebrationActive){var host=document.fullscreenElement||document.body;host.append(qs('gmv-celebration-backdrop'),qs('gmv-event'))}});
 try{makeUI()}catch(error){console.error('Arena: falha ao montar navegação',error)}
 checkLogin();
 var auth=qs('gmAuth');
 if(auth&&window.MutationObserver){
  var ob=new MutationObserver(function(){if(auth.classList.contains('hidden'))sessionDenied=false;checkLogin()});
  ob.observe(auth,{attributes:true,attributeFilter:['class']});
 }
 window.addEventListener('focus',function(){checkLogin();if(authenticated())sync()});
 document.addEventListener('visibilitychange',function(){if(!document.hidden){checkLogin();sync()}});
 // Aviso imediato entre abas do mesmo navegador; outros dispositivos usam polling leve.
 var saleChannel=null;
 try{
  if('BroadcastChannel' in window){
   saleChannel=new BroadcastChannel('gestao-menezes-vendas');
   saleChannel.onmessage=function(){if(authenticated()){lastSync=0;sync()}};
  }
 }catch(e){}
 window.addEventListener('gm:local-sale-saved',function(){
  if(authenticated()){lastSync=0;sync()}
  try{if(saleChannel)saleChannel.postMessage({type:'sale-saved'})}catch(e){}
 });
 window.addEventListener('storage',function(){if(authenticated()&&!remoteState){var s=localState();if(s)updateWith(s,false)}});
 setInterval(function(){checkLogin();if(authenticated()&&arena&&arena.classList.contains('gmv-open')&&snapshot&&snapshot.trio.length>=2){duelIndex=snapshot.trio.length>=3?(duelIndex+1)%3:0;renderDuel()}},9000);
 setInterval(function(){if(authenticated())sync()},4000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* Load the performance workspace without changing the sale, booking or settings flows. */
(function(){if(window.__gmWorkspaceLoading)return;window.__gmWorkspaceLoading=true;var css=document.createElement('link');css.rel='stylesheet';css.href='/performance-coach.css?v=1';document.head.appendChild(css);function load(src){return new Promise(function(resolve,reject){var script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.body.appendChild(script)})}load('/performance-metrics.js?v=1').then(function(){return load('/performance-coach.js?v=2')}).then(function(){return load('/performance-proposals.js?v=1')}).catch(function(){console.error('Não foi possível carregar as ferramentas de performance. Atualize a página.');});})();


/* Trainee may view Líderes - Gestão; manager-only actions remain protected elsewhere. */
(function(){
 if(window.__gmArenaTraineeLeadersV2)return;window.__gmArenaTraineeLeadersV2=true;
 var enabled=false,busy=false;
 function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR')}
 function isLeaderNav(el){
  if(!el||!el.matches)return false;
  var view=norm(el.dataset&&el.dataset.view),go=norm(el.dataset&&el.dataset.go),id=norm(el.id),txt=norm(el.textContent);
  return view==='leaders'||go==='leaders'||id==='navleaders'||id==='leadersnav'||
   txt.includes('líderes - gestão')||txt.includes('lideres - gestão')||
   txt.includes('líderes - gestao')||txt.includes('lideres - gestao');
 }
 function reveal(el){
  if(!el)return;
  el.hidden=false;el.removeAttribute('hidden');el.setAttribute('aria-hidden','false');
  ['hidden','manager-only','gestor-only','managerOnly','gestorOnly','only-manager','only-gestor'].forEach(function(k){el.classList.remove(k)});
  el.removeAttribute('data-manager-only');el.removeAttribute('data-gestor-only');
  el.style.setProperty('visibility','visible','important');
  el.style.setProperty('opacity','1','important');
  el.style.setProperty('pointer-events','auto','important');
  if(getComputedStyle(el).display==='none')el.style.setProperty('display','flex','important');
 }
 function apply(){
  if(!enabled||busy)return;busy=true;
  try{
   document.body&&document.body.classList.add('gm-trainee-leaders');
   Array.from(document.querySelectorAll('button,a,[role="button"],[data-view],[data-go],.nav-item,.sidebar *')).filter(isLeaderNav).forEach(reveal);
   var section=document.getElementById('leaders');
   if(section){
    ['manager-only','gestor-only','only-manager','only-gestor'].forEach(function(k){section.classList.remove(k)});
    section.removeAttribute('data-manager-only');section.removeAttribute('data-gestor-only');
   }
  }finally{busy=false}
 }
 async function bootAccess(){
  try{
   var r=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
   if(!r.ok)return;
   var data=await r.json();
   enabled=data&&data.role==='trainee';
   if(!enabled)return;
   apply();
   new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true});
   setInterval(apply,1000);
  }catch(_){}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootAccess,{once:true});else bootAccess();
})();


/* TEAM CHAMPION V3: one correctly gendered monthly title; removes badges injected by older layers. */
(function(){
  'use strict';
  if(window.__gmChampionSingleMonthV3)return;
  window.__gmChampionSingleMonthV3=true;
  var style=document.createElement('style');
  style.id='gm-single-month-champion-style';
  style.textContent=[
    '#team .gm-month-champion-line{display:flex;align-items:center;margin:8px 0 10px;min-height:30px}',
    '#team .gm-month-champion-badge{display:inline-flex;align-items:center;gap:9px;padding:8px 15px;border-radius:999px;border:1px solid rgba(249,201,83,.55);background:linear-gradient(125deg,rgba(88,58,10,.96),rgba(20,14,7,.96));color:#ffdf82;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 0 20px rgba(235,177,43,.16)}',
    '#team .gm-month-champion-badge:before{content:"";width:8px;height:8px;flex-shrink:0;border-radius:50%;background:#ffda67;box-shadow:0 0 10px rgba(255,215,104,.8)}'
  ].join('\n');
  (document.head||document.documentElement).appendChild(style);
  var timer=0,running=false;
  function update(){
    if(running)return;
    running=true;
    try{
      var team=document.getElementById('team');
      if(!team)return;
      var rank=team.querySelector('#consultantRank');
      var first=rank && String(rank.textContent||'').trim()==='#1';
      var titleRow=team.querySelector('.hero-title-row');
      var copy=team.querySelector('.hero-copy-clean');
      var badge=team.querySelector('.gm-month-champion-line');

      // Native v2 and old service-worker injections must never create a second title.
      team.querySelectorAll('.gm-champion-label,.gm-champion-live').forEach(function(node){node.remove();});
      if(!first||!titleRow||!copy){
        if(badge)badge.remove();
        return;
      }

      var role=team.querySelector('#consultantRole');
      var roleText=(role && role.textContent||'').trim();
      var female=/\bconsultora\b/i.test(roleText);
      var focus=document.getElementById('consultantFocus');
      var id=focus&&focus.value;
      if(!female && typeof state!=='undefined' && state && Array.isArray(state.consultants)){
        var person=state.consultants.find(function(c){return String(c.id)===String(id)});
        if(person)female=person.gender==='f'||person.gender==='female';
      }
      var label=female?'CAMPEÃ DO MÊS':'CAMPEÃO DO MÊS';
      if(!badge){
        badge=document.createElement('div');
        badge.className='gm-month-champion-line';
        var inner=document.createElement('span');
        inner.className='gm-month-champion-badge';
        badge.appendChild(inner);
        titleRow.insertAdjacentElement('afterend',badge);
      }else if(badge.previousElementSibling!==titleRow){
        titleRow.insertAdjacentElement('afterend',badge);
      }
      var inner=badge.querySelector('.gm-month-champion-badge');
      if(inner && inner.textContent!==label)inner.textContent=label;
    }finally{running=false}
  }
  function schedule(){
    if(timer)return;
    timer=setTimeout(function(){timer=0;update();},30);
  }
  function boot(){
    var team=document.getElementById('team');
    if(!team)return;
    new MutationObserver(schedule).observe(team,{subtree:true,childList:true,characterData:true});
    var focus=document.getElementById('consultantFocus');
    if(focus)focus.addEventListener('change',schedule);
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  window.addEventListener('load',schedule);
})();

/* Carregador isolado dos refinamentos executivos (sem mudanças na aba Agendamentos). */
(function(){if(window.__gmRefinementLoader20261111)return;window.__gmRefinementLoader20261111=true;var s=document.createElement('script');s.src='/menezes-refinement-20261111.js?v=2';s.async=true;document.head.appendChild(s)})();
