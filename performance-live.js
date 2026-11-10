(function(){
if(window.__gmLiveV3)return;window.__gmLiveV3=true;
var ranks=null,totals=new Map(),sound=false,lastTicker='',timer;
var css='#gmRace{display:grid;gap:10px;margin-top:16px}.gm-racer{display:grid;grid-template-columns:42px 1fr 2fr auto;gap:12px;align-items:center;padding:12px;border:1px solid #2b2930;border-radius:13px;background:#0d1118;transition:transform .65s,border-color .4s,background .4s}.gm-racer.up{border-color:#dfb46a;background:#30251c}.gm-racer b{color:#e8c477;font-size:17px}.gm-racer strong{font-size:12px;color:#e8c477}.gm-racer .bar{height:9px;border-radius:9px;background:#24252a;overflow:hidden}.gm-racer .bar i{display:block;height:100%;background:linear-gradient(90deg,#741534,#e8c477);transition:width .6s}#gmOvertake{position:fixed;top:17%;left:50%;z-index:10010;transform:translate(-50%,-30px) scale(.9);opacity:0;pointer-events:none;padding:35px;border-radius:22px;border:2px solid #e7bd70;background:linear-gradient(120deg,#2a1724,#08090c);box-shadow:0 0 75px #c3935460;text-align:center;transition:.45s;min-width:min(500px,90vw)}#gmOvertake.show{opacity:1;transform:translate(-50%,0) scale(1)}#gmOvertake small{display:block;color:#e7bd70;font-weight:900;letter-spacing:.2em}#gmOvertake b{display:block;color:white;font:900 clamp(22px,3.5vw,42px) Sora,sans-serif;margin-top:12px}#gmLivePerformance.goldflash:before{content:"";position:fixed;inset:0;z-index:10000;pointer-events:none;animation:gmGold 1.2s}@keyframes gmGold{from{background:#f4cd8050}to{background:transparent}}@media(max-width:720px){.gm-racer{grid-template-columns:32px 1fr auto}.gm-racer .bar{grid-column:2/4;grid-row:2}}@media(prefers-reduced-motion:reduce){.gm-racer,#gmOvertake{transition:none!important}}';
function esc(v){return String(v??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}
function people(){try{var s=typeof state!=='undefined'?state:window.state;if(!s||!Array.isArray(s.consultants))return [];var m=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,7);return s.consultants.map(function(c){var v=c.monthOpenings&&c.monthOpenings[m]&&c.monthOpenings[m].total;if(v==null)v=c.opening||0;return {id:String(c.id||c.name),name:String(c.name||'Consultor'),total:Math.max(0,Number(v)||0)}}).filter(function(c){return c.total>0}).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name)})}catch(e){return []}}
function play(){if(!sound)return;try{var C=window.AudioContext||window.webkitAudioContext,c=new C();[660,880,1100].forEach(function(f,i){var o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.1;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.07,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.17);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.18)});setTimeout(function(){c.close()},900)}catch(e){}}
function celebrate(p,position){var live=document.getElementById('gmLivePerformance'),t=document.getElementById('gmOvertake');if(!live||!live.classList.contains('open')||!t)return;t.innerHTML='<small>▲ ULTRAPASSAGEM AO VIVO</small><b>'+esc(p.name.toUpperCase())+' SUBIU PARA '+position+'º</b>';t.classList.remove('show');void t.offsetHeight;t.classList.add('show');live.classList.remove('goldflash');void live.offsetHeight;live.classList.add('goldflash');clearTimeout(timer);timer=setTimeout(function(){t.classList.remove('show');live.classList.remove('goldflash')},3600);play();var panel=document.getElementById('gmNotifyPanel');if(panel)panel.insertAdjacentHTML('afterbegin','<div class="gm-note"><strong>▲ '+esc(p.name)+' subiu para '+position+'º</strong><small>'+money(p.total)+' no mês</small></div>');var badge=document.getElementById('gmNotifyBadge');if(badge)badge.textContent=Math.min(99,(Number(badge.textContent)||0)+1)}
function draw(ps,changed){var root=document.getElementById('gmRace');if(!root)return;var before=new Map(Array.from(root.children).map(function(e){return [e.dataset.id,e.getBoundingClientRect().top]})),max=Math.max(5000000,...ps.map(function(p){return p.total})),ids=new Set();ps.slice(0,12).forEach(function(p,i){ids.add(p.id);var el=Array.from(root.children).find(function(e){return e.dataset.id===p.id});if(!el){el=document.createElement('div');el.className='gm-racer';el.dataset.id=p.id;el.innerHTML='<b></b><span></span><div class="bar"><i></i></div><strong></strong>'}el.querySelector('b').textContent='#'+(i+1);el.querySelector('span').textContent=p.name;el.querySelector('strong').textContent=money(p.total);el.querySelector('i').style.width=Math.min(100,p.total/max*100)+'%';el.classList.toggle('up',changed.includes(p.id));root.appendChild(el)});Array.from(root.children).forEach(function(el){if(!ids.has(el.dataset.id))el.remove()});if(!ps.length)root.textContent='Aguardando vendas registradas neste mês.';requestAnimationFrame(function(){Array.from(root.children).forEach(function(el){var old=before.get(el.dataset.id);if(old==null)return;var dy=old-el.getBoundingClientRect().top;if(Math.abs(dy)<2)return;el.style.transition='none';el.style.transform='translateY('+dy+'px)';requestAnimationFrame(function(){el.style.transition='transform .7s cubic-bezier(.2,.75,.2,1)';el.style.transform='translateY(0)'})})})}
function tick(ps){var e=document.getElementById('gmTicker');if(!e)return;var key=ps.map(function(p){return p.id+':'+p.total}).join('|');if(key===lastTicker)return;lastTicker=key;var h=(ps.length?ps:[{name:'Aguardando vendas',total:0}]).slice(0,12).map(function(p,i){return '<div class="gm-ticker-item"><span>#'+(i+1)+' '+esc(p.name)+'</span><b>'+money(p.total)+'</b><em>▲ '+(100*p.total/5000000).toFixed(1)+'%</em></div>'}).join('');e.innerHTML=h+h}
function refresh(){var live=document.getElementById('gmLivePerformance');if(!live)return;var ps=people(),now=new Map(ps.map(function(p,i){return [p.id,i+1]})),up=[];if(ranks){ps.forEach(function(p){if(ranks.has(p.id)&&now.get(p.id)<ranks.get(p.id)&&p.total>(totals.get(p.id)||0))up.push(p)})}ranks=now;totals=new Map(ps.map(function(p){return [p.id,p.total]}));if(live.classList.contains('open')){draw(ps,up.map(function(p){return p.id}));tick(ps);if(up.length)celebrate(up[0],now.get(up[0].id))}}
function init(){var live=document.getElementById('gmLivePerformance'),bars=document.getElementById('gmBars');if(!live||!bars)return false;if(document.getElementById('gmRace'))return true;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);var title=document.createElement('h3');title.textContent='Ranking dinâmico • corrida de vendas';var root=document.createElement('div');root.id='gmRace';bars.after(title,root);bars.style.display='none';var toast=document.createElement('div');toast.id='gmOvertake';toast.setAttribute('aria-live','polite');document.body.appendChild(toast);var actions=live.querySelector('.gm-live-actions');if(actions){var b=document.createElement('button');b.type='button';b.textContent='♪ Som desligado';b.onclick=function(){sound=!sound;b.textContent=sound?'♪ Som ligado':'♪ Som desligado'};actions.prepend(b)}refresh();return true}
var attempts=0,boot=setInterval(function(){if(init()||++attempts>60)clearInterval(boot)},500);setInterval(refresh,1800);window.addEventListener('storage',refresh);document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
})();

/* Bootstrap independente: sempre oferece acesso ao telao, sem depender do service worker. */
(function(){
 if(window.__gmLiveLauncherV4)return;window.__gmLiveLauncherV4=true;
 var style=document.createElement('style');style.textContent='#gmLiveLauncherV4{position:fixed;bottom:22px;right:22px;z-index:9995;border:1px solid #e5bd77;border-radius:16px;background:linear-gradient(115deg,#240d18,#080b0f);color:#f8dfaa;box-shadow:0 12px 34px #0009,0 0 25px #d2a35a33;font:900 12px Manrope,Arial,sans-serif;letter-spacing:.12em;padding:17px 23px;cursor:pointer;transition:transform .2s}#gmLiveLauncherV4:hover{transform:scale(1.05)}#gmLiveLauncherV4 .gm-dot-v4{display:inline-block;width:9px;height:9px;border-radius:50%;background:#32cc8d;box-shadow:0 0 12px #32cc8d;margin-right:9px;vertical-align:middle}#gmLivePerformance.open{display:block!important;visibility:visible!important;opacity:1!important}#gmLivePerformance .gm-live-shell{min-height:100vh}@media(max-width:620px){#gmLiveLauncherV4{bottom:12px;right:12px;padding:12px 14px;font-size:10px}}';
 document.head.appendChild(style);
 function ensurePanel(){
  var el=document.getElementById('gmLivePerformance');
  if(el)return el;
  el=document.createElement('section');el.id='gmLivePerformance';el.setAttribute('aria-hidden','true');
  el.innerHTML='<div class="gm-live-shell"><header class="gm-live-head"><div class="gm-live-brand"><small>GESTÃO MENEZES • PERFORMANCE EXCHANGE</small><h1>Central de Performance ao Vivo</h1></div><div class="gm-live-actions"><button type="button" id="gmLiveFullscreen">⛶ Tela cheia</button><button type="button" id="gmLiveClose">Fechar</button></div></header><div class="gm-market-strip"><div class="gm-market-track" id="gmTicker"></div></div><div class="gm-live-grid"><div class="gm-live-card"><h3>Ranking ao vivo</h3><div id="gmPodium" class="gm-podium"></div><div id="gmBars"></div></div><div><div id="gmKpis" class="gm-kpis"></div><div class="gm-live-card"><h3>Resultados dos líderes</h3><div id="gmLeaders" class="gm-leader-list"></div></div></div></div></div>';
  var fallback=document.createElement('style');fallback.textContent='#gmLivePerformance{position:fixed;inset:0;z-index:9998;background:#07090e;color:white;display:none;overflow-y:auto}#gmLivePerformance .gm-live-shell{padding:24px;max-width:1800px;margin:auto}#gmLivePerformance .gm-live-head{display:flex;justify-content:space-between;gap:20px;align-items:center}#gmLivePerformance h1{font-size:clamp(24px,3vw,43px)}#gmLivePerformance .gm-live-actions{display:flex;gap:8px}#gmLivePerformance button{cursor:pointer;border:1px solid #d9b06b;background:#15131b;color:#f4d7a0;padding:10px 13px;border-radius:10px}#gmLivePerformance .gm-market-strip{overflow:hidden;margin:20px 0;border-block:1px solid #453b35;padding:14px}#gmLivePerformance .gm-market-track{display:flex;gap:28px;width:max-content;animation:gm-market-move 25s linear infinite}#gmLivePerformance .gm-ticker-item{white-space:nowrap;display:flex;gap:9px}#gmLivePerformance .gm-ticker-item b{color:#ebc37e}#gmLivePerformance .gm-ticker-item em{color:#33c990;font-style:normal}@keyframes gm-market-move{to{transform:translateX(-50%)}}#gmLivePerformance .gm-live-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:20px}#gmLivePerformance .gm-live-card{border:1px solid #43352a;border-radius:18px;padding:20px;background:#111319}#gmLivePerformance .gm-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}#gmLivePerformance .gm-podium-item{border:1px solid #58452c;border-radius:12px;padding:16px}#gmLivePerformance .gm-podium-item.first{border-color:#e4b66a}#gmLivePerformance .gm-money{color:#edc278;font-weight:900}#gmLivePerformance .gm-kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:15px}#gmLivePerformance .gm-kpi{padding:14px;border:1px solid #383039;border-radius:12px}#gmLivePerformance .gm-kpi small{display:block;color:#999}#gmLivePerformance .gm-kpi b{font-size:20px}#gmLivePerformance .gm-leader-row{padding:10px;border-bottom:1px solid #36313b}@media(max-width:900px){#gmLivePerformance .gm-live-grid{grid-template-columns:1fr}#gmLivePerformance .gm-podium{grid-template-columns:1fr}}';document.head.appendChild(fallback);
  document.body.appendChild(el);
  return el;
 }
 function open(){
   var el=ensurePanel();el.classList.add('open');el.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
   try{document.querySelector('#gmLivePerformance #gmLiveFullscreen').onclick=function(){if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.()};document.querySelector('#gmLivePerformance #gmLiveClose').onclick=close}catch(e){}
 }
 function close(){var el=document.getElementById('gmLivePerformance');if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true')}document.body.style.overflow='';if(document.fullscreenElement)document.exitFullscreen?.()}
 function attach(){
  if(!document.body)return;
  ensurePanel();
  var launch=document.getElementById('gmLiveLauncherV4');
  if(!launch){launch=document.createElement('button');launch.type='button';launch.id='gmLiveLauncherV4';launch.innerHTML='<span class="gm-dot-v4"></span> ABRIR TELÃO LIVE';launch.addEventListener('click',open);document.body.appendChild(launch)}
  var nav=document.querySelector('.sidebar nav,.sidebar .nav,.sidebar');
  if(nav&&!nav.querySelector('#gmLiveMenuV4')&&!document.querySelector('.gm-live-nav')){
   var b=document.createElement('button');b.id='gmLiveMenuV4';b.type='button';b.className='gm-live-nav';b.textContent='◉  Telão ao vivo';b.addEventListener('click',open);nav.appendChild(b);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
 setInterval(attach,2500);
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('gmLivePerformance')?.classList.contains('open'))close()});
})();


/* Libera a visualizacao de Lideres - Gestao para Trainee, mantendo controles de edicao do Gestor. */
(function(){
  if(window.__gmTraineeLeadersAccessV1)return;window.__gmTraineeLeadersAccessV1=true;
  var trainee=false,observer=null,timer=null;

  function textOf(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR')}
  function isLeadersControl(el){
    if(!el||!el.matches)return false;
    var view=String(el.dataset&&el.dataset.view||'').toLocaleLowerCase('pt-BR');
    var id=String(el.id||'').toLocaleLowerCase('pt-BR');
    var txt=textOf(el);
    return view.includes('leader')||id.includes('leader')||txt.includes('líderes - gestão')||txt.includes('lideres - gestão')||txt.includes('líderes - gestao')||txt.includes('lideres - gestao');
  }
  function reveal(el){
    if(!el)return;
    el.hidden=false;
    el.removeAttribute('hidden');
    el.classList.remove('hidden','manager-only','gestor-only','managerOnly','gestorOnly');
    el.style.removeProperty('display');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
    el.setAttribute('data-trainee-leaders-visible','1');
  }
  function protectReadOnly(){
    var roots=[
      document.getElementById('leadersExportArea'),
      document.getElementById('leadersView'),
      document.getElementById('leadersManagement'),
      document.getElementById('leadersManagementView')
    ].filter(Boolean);
    roots.forEach(function(root){
      root.querySelectorAll('button,input,select,textarea').forEach(function(el){
        var label=(textOf(el)+' '+String(el.id||'')+' '+String(el.className||'')).toLocaleLowerCase('pt-BR');
        if(label.includes('baixar')||label.includes('export')||label.includes('download'))return;
        if(el.matches('input,select,textarea')||label.includes('editar')||label.includes('excluir')||label.includes('salvar')||label.includes('cadastrar')||label.includes('adicionar')){
          el.disabled=true;
          el.setAttribute('data-trainee-readonly','1');
        }
      });
    });
  }
  function apply(){
    if(!trainee)return;
    var candidates=Array.from(document.querySelectorAll('button,a,[data-view],[role="button"],.nav-item,.nav button'));
    candidates.filter(isLeadersControl).forEach(reveal);
    var sections=[
      document.getElementById('leaders'),
      document.getElementById('leadersView'),
      document.getElementById('leadersManagement'),
      document.getElementById('leadersManagementView'),
      document.getElementById('leadersExportArea')
    ].filter(Boolean);
    sections.forEach(function(section){
      section.classList.remove('manager-only','gestor-only');
      section.removeAttribute('data-manager-only');
    });
    protectReadOnly();
  }
  async function boot(){
    try{
      var res=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
      if(!res.ok)return;
      var data=await res.json();
      trainee=data&&data.role==='trainee';
      if(!trainee)return;
      apply();
      observer=new MutationObserver(function(){apply()});
      observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
      timer=setInterval(apply,1200);
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
