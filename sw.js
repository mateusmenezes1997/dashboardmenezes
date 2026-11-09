const VERSION = "gm-pwa-arena-v6";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const GOAL_STYLE = `
<style id="gm-goal-mini-v5">
.commission-goal-mini{
  margin-top:14px !important;
  display:grid !important;
  grid-template-columns:minmax(0,1fr) auto !important;
  align-items:center !important;
  gap:34px !important;
  width:100% !important;
  min-height:0 !important;
  padding:22px 28px !important;
  border:1px solid rgba(221,174,83,.30) !important;
  border-radius:20px !important;
  background:
    radial-gradient(circle at 0% 0%, rgba(111,18,47,.18), transparent 34%),
    linear-gradient(135deg,rgba(35,11,20,.88),rgba(14,10,11,.96)) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025) !important;
  overflow:hidden !important;
}
.commission-goal-mini-copy{
  min-width:0 !important;
  width:100% !important;
  max-width:610px !important;
}
.commission-goal-mini-eyebrow{
  display:block !important;
  margin:0 0 7px !important;
  font-size:10px !important;
  font-weight:800 !important;
  letter-spacing:.15em !important;
  text-transform:uppercase !important;
  color:#d9ae5c !important;
}
.commission-goal-mini-title{
  display:block !important;
  margin:0 0 7px !important;
  font-size:20px !important;
  line-height:1.16 !important;
  letter-spacing:-.02em !important;
  color:#fff !important;
}
.commission-goal-mini-text{
  margin:0 !important;
  max-width:590px !important;
  font-size:14px !important;
  line-height:1.45 !important;
  color:rgba(255,255,255,.62) !important;
}
.commission-goal-mini-text b{
  color:rgba(255,255,255,.82) !important;
  font-weight:700 !important;
}
.commission-goal-mini-value{
  min-width:300px !important;
  padding-left:28px !important;
  border-left:1px solid rgba(221,174,83,.20) !important;
  text-align:right !important;
}
.commission-goal-mini-value small{
  display:block !important;
  margin:0 0 8px !important;
  font-size:10px !important;
  line-height:1 !important;
  font-weight:800 !important;
  letter-spacing:.15em !important;
  text-transform:uppercase !important;
  color:rgba(255,255,255,.47) !important;
}
.commission-goal-mini-value #commissionMonthlyNet{
  display:inline-block !important;
  width:auto !important;
  min-width:0 !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
  background:none !important;
  color:#f2ca75 !important;
  font-size:clamp(32px,3.25vw,44px) !important;
  font-weight:900 !important;
  line-height:1 !important;
  letter-spacing:-.045em !important;
  white-space:nowrap !important;
  text-align:right !important;
  text-shadow:none !important;
  transform-origin:right center !important;
  transition:transform .22s ease,filter .22s ease,text-shadow .22s ease !important;
}
.commission-goal-mini-value #commissionMonthlyNet:hover{
  transform:scale(1.025) !important;
  filter:brightness(1.08) !important;
  text-shadow:
    0 0 8px rgba(247,208,123,.52),
    0 0 22px rgba(220,159,45,.26) !important;
}
@media(max-width:820px){
  .commission-goal-mini{
    grid-template-columns:1fr !important;
    gap:16px !important;
    padding:20px !important;
  }
  .commission-goal-mini-copy{
    max-width:none !important;
  }
  .commission-goal-mini-value{
    min-width:0 !important;
    padding:16px 0 0 !important;
    border-left:0 !important;
    border-top:1px solid rgba(221,174,83,.18) !important;
    text-align:left !important;
  }
  .commission-goal-mini-value #commissionMonthlyNet{
    font-size:clamp(30px,8vw,40px) !important;
    text-align:left !important;
    white-space:normal !important;
    transform-origin:left center !important;
  }
}
</style>`;


const MONEY_STYLE = `
<style id="gm-money-safe-v1">
#team .commission-countdown-card .commission-money-float{
  position:relative !important;
  left:auto !important;
  right:auto !important;
  top:auto !important;
  bottom:auto !important;
  width:42px !important;
  height:26px !important;
  min-width:42px !important;
  flex:0 0 42px !important;
  margin:0 2px 0 0 !important;
  z-index:2 !important;
  opacity:.92 !important;
  transform:none;
  border:1px solid rgba(86,238,150,.45) !important;
  border-radius:9px !important;
  background:linear-gradient(135deg,rgba(45,210,119,.14),rgba(12,74,45,.18)) !important;
  box-shadow:
    0 0 18px rgba(60,226,133,.12),
    inset 0 1px 0 rgba(255,255,255,.05) !important;
  color:#80f4b3 !important;
  font-size:13px !important;
  font-weight:900 !important;
  letter-spacing:-.02em !important;
  animation:gmMoneyFloatSafe 3.2s ease-in-out infinite !important;
}
#team .commission-countdown-card .commission-kicker{
  display:flex !important;
  align-items:center !important;
  gap:10px !important;
}
#team .commission-countdown-card .commission-icon{
  display:none !important;
}
#team .commission-countdown-card .commission-money-float::before,
#team .commission-countdown-card .commission-money-float::after{
  content:none !important;
  display:none !important;
}
@keyframes gmMoneyFloatSafe{
  0%,100%{transform:translateY(1px) rotate(-3deg);opacity:.68}
  50%{transform:translateY(-4px) rotate(2deg);opacity:1}
}
@media(max-width:560px){
  #team .commission-countdown-card .commission-money-float{
    width:38px !important;
    height:24px !important;
    min-width:38px !important;
    flex-basis:38px !important;
    display:grid !important;
  }
}
</style>`;

const COMMISSION_HEADER_FIX_V2 = `
<style id="gm-commission-header-fix-v2">
.commission-countdown-card .commission-kicker{display:flex!important;align-items:center!important;gap:12px!important}
.commission-countdown-card .commission-kicker .commission-money-float{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  position:relative!important;inset:auto!important;margin:0 2px 0 0!important;
  flex:0 0 42px!important;width:42px!important;height:28px!important;
  color:#82f7b5!important;z-index:1!important;
}
.commission-countdown-card .commission-kicker .commission-icon{display:none!important}
</style>
<script id="gm-commission-header-fix-v2">
(function(){
 function fixHeader(){
  document.querySelectorAll('.commission-countdown-card').forEach(function(card){
   var kicker=card.querySelector('.commission-kicker');
   if(!kicker)return;
   kicker.querySelectorAll('.commission-icon').forEach(function(icon){icon.remove()});
   var money=card.querySelector('.commission-money-float');
   if(!money){
    money=document.createElement('span');money.className='commission-money-float';
    money.setAttribute('aria-hidden','true');money.textContent='R$';
   }
   if(money.parentElement!==kicker||kicker.firstElementChild!==money){kicker.insertBefore(money,kicker.firstChild)}
   card.querySelectorAll('.commission-money-float').forEach(function(el){if(el!==money)el.remove()});
  });
 }
 var queued=false;
 function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(function(){queued=false;fixHeader()});
 }
 document.addEventListener('DOMContentLoaded',schedule);
 window.addEventListener('load',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
 schedule();
})();
<\/script>
`;

function moveCommissionMoney(html){
  // O card de comissão agora é definido no index.html, sem reposicionamento pelo service worker.
  return html;
}

const CHAMPION_STYLE = `
<style id="gm-champion-highlight-v1">
#team .gm-champion-card{
  position:relative !important;
  border-color:rgba(244,197,83,.52) !important;
  box-shadow:
    0 0 0 1px rgba(244,197,83,.08) inset,
    0 0 30px rgba(244,197,83,.14),
    0 0 68px rgba(244,197,83,.08) !important;
  background:
    radial-gradient(circle at 10% 18%,rgba(244,197,83,.12),transparent 24%),
    radial-gradient(circle at 88% 14%,rgba(255,220,128,.06),transparent 20%),
    linear-gradient(135deg,rgba(32,13,17,.96),rgba(12,10,11,.98)) !important;
  overflow:hidden !important;
}
#team .gm-champion-card::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:linear-gradient(115deg,transparent 0%,rgba(255,223,131,.03) 35%,rgba(255,223,131,.12) 50%,rgba(255,223,131,.03) 65%,transparent 100%);
  transform:translateX(-120%);
  animation:gmChampionSweep 4.8s linear infinite;
  z-index:0;
}
#team .gm-champion-card > *{position:relative;z-index:1}
#team .gm-champion-photo{
  border-color:rgba(244,197,83,.95) !important;
  box-shadow:
    0 0 0 1px rgba(255,230,151,.25),
    0 0 20px rgba(244,197,83,.30),
    0 0 42px rgba(206,146,27,.18) !important;
}
#team .gm-champion-rank{
  border-color:rgba(244,197,83,.40) !important;
  background:linear-gradient(135deg,rgba(91,61,14,.90),rgba(28,17,7,.98)) !important;
  color:#ffd86f !important;
  box-shadow:0 0 18px rgba(244,197,83,.14) !important;
}
#team .gm-champion-trophy{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:54px;
  height:54px;
  margin-left:12px;
  border-radius:50%;
  border:1px solid rgba(255,225,139,.36);
  background:
    radial-gradient(circle at 34% 28%,#fff0b8 0%,#f6cf6d 30%,#c68a1d 72%,#8d5b0a 100%);
  box-shadow:
    0 0 16px rgba(255,211,100,.45),
    0 0 34px rgba(226,165,37,.22),
    inset 0 1px 4px rgba(255,255,255,.4);
  font-size:27px;
  line-height:1;
  transform-style:preserve-3d;
  animation:gmChampionTrophySpin 4.6s linear infinite;
  vertical-align:middle;
}
#team .gm-champion-live{
  display:inline-flex;
  align-items:center;
  gap:8px;
  margin-left:10px;
  padding:8px 14px;
  border-radius:999px;
  border:1px solid rgba(245,201,87,.34);
  background:linear-gradient(135deg,rgba(76,50,9,.86),rgba(24,16,8,.96));
  color:#ffd873;
  font-size:11px;
  font-weight:900;
  letter-spacing:.11em;
  text-transform:uppercase;
  box-shadow:0 0 18px rgba(245,201,87,.12);
}
#team .gm-champion-live i{
  width:7px;height:7px;border-radius:50%;
  background:#ffd66a;
  box-shadow:0 0 10px rgba(255,214,106,.7);
  animation:gmChampionPulse 1.35s ease-in-out infinite;
}
@keyframes gmChampionSweep{
  0%{transform:translateX(-120%)}
  100%{transform:translateX(120%)}
}
@keyframes gmChampionTrophySpin{
  0%{transform:rotateY(0deg)}
  100%{transform:rotateY(360deg)}
}
@keyframes gmChampionPulse{
  0%,100%{transform:scale(1);opacity:1}
  50%{transform:scale(1.35);opacity:.72}
}
@media(max-width:700px){
  #team .gm-champion-trophy{width:44px;height:44px;font-size:22px;margin-left:8px}
  #team .gm-champion-live{margin:8px 0 0 0}
}
@media(prefers-reduced-motion:reduce){
  #team .gm-champion-card::before,
  #team .gm-champion-trophy,
  #team .gm-champion-live i{animation:none!important}
}
</style>`;

function applyChampionVisual(html){
  if (!html.includes('id="team"')) return html;

  if (!html.includes('gm-champion-highlight-v1')) {
    html = html.replace('</head>', CHAMPION_STYLE + '\n</head>');
  }

  const hook = '<script id="gm-champion-runtime-v1">';
  if (html.includes(hook)) return html;

  const runtime = `
<script id="gm-champion-runtime-v1">
(function(){
  function text(el){ return (el && el.textContent || '').trim(); }
  function findRankOne(){
    var nodes = Array.from(document.querySelectorAll('#team *'));
    return nodes.find(function(el){
      var t=text(el);
      return /^Ranking\\s*#?1$/i.test(t) || /^#1$/i.test(t);
    }) || null;
  }
  function closestUseful(el){
    if(!el) return null;
    return el.closest('.consultant-card,.consultant-hero,.consultant-showcase,.consultor-card,.consultor-hero,.team-highlight-card,.team-card,.card,.panel,.mini-card') || el.closest('section') || el.parentElement;
  }
  function findPhoto(){
    var selectors=[
      '#team .consultant-photo-wrap',
      '#team .consultant-photo',
      '#team .consultor-photo',
      '#team .profile-photo',
      '#team .hero-photo',
      '#team img'
    ];
    for(var i=0;i<selectors.length;i++){
      var el=document.querySelector(selectors[i]);
      if(el) return el.closest('div') || el;
    }
    return null;
  }
  function findName(){
    var nodes=Array.from(document.querySelectorAll('#team h1,#team h2,#team h3,#team .consultant-name,#team .consultor-name,#team .highlight-name'));
    return nodes.find(function(el){
      var t=text(el);
      return t && t.length>2 && !/Equipe|Painel|Selecionar|Resultado/i.test(t);
    }) || null;
  }
  function update(){
    document.querySelectorAll('#team .gm-champion-card').forEach(function(el){el.classList.remove('gm-champion-card')});
    document.querySelectorAll('#team .gm-champion-photo').forEach(function(el){el.classList.remove('gm-champion-photo')});
    document.querySelectorAll('#team .gm-champion-rank').forEach(function(el){el.classList.remove('gm-champion-rank')});
    document.querySelectorAll('#team .gm-champion-trophy,#team .gm-champion-live').forEach(function(el){el.remove()});

    var rank=findRankOne();
    if(!rank) return;

    rank.classList.add('gm-champion-rank');

    var card=closestUseful(rank);
    if(card) card.classList.add('gm-champion-card');

    var photo=findPhoto();
    if(photo) photo.classList.add('gm-champion-photo');

    var name=findName();
    if(name){
      var trophy=document.createElement('span');
      trophy.className='gm-champion-trophy';
      trophy.setAttribute('aria-label','Campeão atual');
      trophy.textContent='🏆';
      name.insertAdjacentElement('afterend',trophy);

      var live=document.createElement('span');
      live.className='gm-champion-live';
      live.innerHTML='<i></i>Campeão do momento';
      trophy.insertAdjacentElement('afterend',live);
    }
  }
  var timer;
  function schedule(){ clearTimeout(timer); timer=setTimeout(update,80); }
  document.addEventListener('DOMContentLoaded',schedule);
  window.addEventListener('load',schedule);
  var team=document.getElementById('team');
  if(team){
    new MutationObserver(schedule).observe(team,{subtree:true,childList:true,characterData:true,attributes:true});
  }
  schedule();
})();
<\/script>`;

  return html.replace('</body>', runtime + '\n</body>');
}

function enhanceCommissionGoal(html){
  if (!html.includes('Batendo 5MM no mês')) return html;

  const blockPattern = /<div class="commission-highlight" style="margin-top:4px">\s*<div>\s*<strong>Batendo 5MM no mês, quanto isso representa no bolso\?<\/strong>\s*<span>Com 2% de comissão bruta e os descontos estimados do simulador, a projeção é de <b id="commissionAnnualProjection">[^<]*<\/b> mantendo essa meta todos os meses\.<\/span>\s*<\/div>\s*<div class="big" id="commissionMonthlyNet">[^<]*<\/div>\s*<\/div>/;

  const replacement = `
        <div class="commission-goal-mini">
          <div class="commission-goal-mini-copy">
            <span class="commission-goal-mini-eyebrow">Meta de performance</span>
            <strong class="commission-goal-mini-title">Batendo 5MM no mês</strong>
            <p class="commission-goal-mini-text">Com 2% de comissão bruta e os descontos estimados do simulador. Mantendo essa meta: <b id="commissionAnnualProjection">R$ 963.240,00 líquidos em 12 meses</b>.</p>
          </div>
          <div class="commission-goal-mini-value">
            <small>Líquido estimado / mês</small>
            <b id="commissionMonthlyNet">R$ 80.270,00/mês</b>
          </div>
        </div>`;

  html = html.replace(blockPattern, replacement);
  if (!html.includes('gm-goal-mini-v5')) {
    html = html.replace('</head>', GOAL_STYLE + '\n</head>');
  }
  return html;
}


const MANAGER_SALE_DELETE = `
<style id="gm-manager-sale-delete-style-v1">
#editSalesModal .gm-sale-list{margin-top:14px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;display:grid;gap:8px}
#editSalesModal .gm-sale-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
#editSalesModal .gm-sale-list-head b{font-size:11px;color:#fff}
#editSalesModal .gm-sale-list-head small{font-size:9px;color:#8f99a6}
#editSalesModal .gm-sale-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 11px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.025)}
#editSalesModal .gm-sale-main{min-width:0;display:grid;gap:2px}
#editSalesModal .gm-sale-main b{font-size:10px;color:#fff}
#editSalesModal .gm-sale-main small{font-size:9px;color:#8f99a6}
#editSalesModal .gm-sale-actions{display:flex;align-items:center;gap:9px;flex:none}
#editSalesModal .gm-sale-actions strong{font-size:10px;color:#fff;white-space:nowrap}
#editSalesModal .gm-delete-sale{height:28px;padding:0 10px;border-radius:9px;border:1px solid rgba(239,90,102,.35);background:rgba(239,90,102,.08);color:#ff9aa3;font-size:9px;font-weight:900;cursor:pointer}
#editSalesModal .gm-delete-sale:hover{background:rgba(239,90,102,.16);border-color:rgba(239,90,102,.6);color:#ffc2c7}
</style>
<script id="gm-manager-sale-delete-v1">
(function(){
  function fmtDate(v){
    try{var p=String(v||'').split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(v||'');}catch(e){return String(v||'');}
  }
  function schedule(){
    clearTimeout(schedule.t);
    schedule.t=setTimeout(renderList,80);
  }
  function renderList(){
    var modal=document.getElementById('editSalesModal');
    if(!modal||modal.classList.contains('hidden'))return;
    if(typeof editingSalesId==='undefined'||!editingSalesId)return;
    if(typeof state==='undefined'||!state||!Array.isArray(state.sales))return;
    var month=document.getElementById('monthFilter')?.value||'';
    var prefix=month?month+'-':'';
    var sales=state.sales.filter(function(x){return x.consultantId===editingSalesId&&(!prefix||String(x.date||'').startsWith(prefix));})
      .sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''));});
    var body=modal.querySelector('.edit-modal-body');if(!body)return;
    var box=body.querySelector('.gm-sale-list');
    if(!box){
      box=document.createElement('div');box.className='gm-sale-list';
      var err=document.getElementById('editSalesError');
      if(err)body.insertBefore(box,err);else body.appendChild(box);
    }
    box.replaceChildren();
    var head=document.createElement('div');head.className='gm-sale-list-head';
    var title=document.createElement('b');title.textContent='Lançamentos individuais';
    var count=document.createElement('small');count.textContent=sales.length+' venda'+(sales.length===1?'':'s')+' no mês';
    head.append(title,count);box.appendChild(head);
    if(!sales.length){
      var empty=document.createElement('div');empty.className='empty';empty.textContent='Nenhum lançamento individual neste mês.';box.appendChild(empty);return;
    }
    sales.forEach(function(sale){
      var row=document.createElement('div');row.className='gm-sale-row';
      var main=document.createElement('div');main.className='gm-sale-main';
      var prod=document.createElement('b');
      prod.textContent=(sale.product==='lar'||sale.product==='Lar'?'Lar':sale.product==='motors'||sale.product==='Motors'?'Motors':'Não definido')+' • '+fmtDate(sale.date);
      var qty=document.createElement('small');qty.textContent=(Number(sale.qty)||1)+' cota'+((Number(sale.qty)||1)===1?'':'s');
      main.append(prod,qty);
      var actions=document.createElement('div');actions.className='gm-sale-actions';
      var value=document.createElement('strong');value.textContent=typeof money==='function'?money(Number(sale.amount)||0):String(sale.amount||0);
      var del=document.createElement('button');del.type='button';del.className='gm-delete-sale';del.textContent='Excluir';
      del.onclick=async function(){
        if(typeof canDeleteSale==='function'&&!canDeleteSale()){alert('Somente Gestor ou Trainee podem excluir vendas.');return;}
        if(typeof remoteReady!=='undefined'&&!remoteReady){alert('A base compartilhada não está disponível.');return;}
        var shown=typeof money==='function'?money(Number(sale.amount)||0):String(sale.amount||0);
        if(!confirm('Excluir esta venda de '+shown+'?\\n\\nEssa ação removerá o lançamento do dashboard.'))return;
        del.disabled=true;
        try{
          if(typeof saveQueue!=='undefined')await saveQueue;
          var result=await apiJSON('/api/state','POST',{action:'deleteSale',saleId:sale.id});
          state=result.state;
          if(typeof serverRevision!=='undefined')serverRevision=result.revision;
          try{if(typeof KEY!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
          if(typeof render==='function')render();
          if(typeof openEditSales==='function')openEditSales(editingSalesId);
          if(typeof maybeAutoExportRanking==='function')maybeAutoExportRanking();
          schedule();
        }catch(error){del.disabled=false;alert('Não foi possível excluir a venda: '+error.message);}
      };
      actions.append(value,del);row.append(main,actions);box.appendChild(row);
    });
  }
  document.addEventListener('click',function(e){
    if(e.target&&e.target.closest&&e.target.closest('[data-edit-sales]'))schedule();
  },true);
  document.addEventListener('DOMContentLoaded',schedule);
  window.addEventListener('load',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  schedule();
})();

(function(){
  var recentObserver=null;

  function monthLabel(month){
    var parts=String(month||'').split('-');
    if(parts.length!==2)return String(month||'');
    var names=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    var idx=Math.max(0,Math.min(11,(Number(parts[1])||1)-1));
    return names[idx]+' '+parts[0];
  }

  function renderManualRecent(){
    var host=document.getElementById('recent');
    if(!host)return;

    var old=host.querySelector('.gm-manual-recent');
    if(typeof isManager==='function'&&!isManager()){
      if(old)old.remove();
      return;
    }
    if(typeof state==='undefined'||!state||!Array.isArray(state.consultants)){
      if(old)old.remove();
      return;
    }

    var month=document.getElementById('monthFilter')?.value||'';
    var consultant=state.consultants.find(function(x){return x.id==='mateus';});
    var opening=consultant&&consultant.monthOpenings&&consultant.monthOpenings[month];
    var amount=Number(opening&&opening.total)||0;
    var signature=month+'|'+amount;

    if(amount<=0){
      if(old)old.remove();
      return;
    }
    if(old&&old.dataset.signature===signature)return;
    if(old)old.remove();

    var row=document.createElement('div');
    row.className='recentitem gm-manual-recent';
    row.dataset.signature=signature;

    var left=document.createElement('div');
    left.style.minWidth='0';
    var name=document.createElement('b');
    name.textContent=consultant.name||'Mateus Menezes';
    var meta=document.createElement('small');
    meta.textContent='Ajuste manual • '+monthLabel(month);
    left.append(name,meta);

    var actions=document.createElement('div');
    actions.className='recentitem-actions';
    var value=document.createElement('b');
    value.textContent=typeof money==='function'?money(amount):String(amount);
    var del=document.createElement('button');
    del.className='sale-delete-btn';
    del.type='button';
    del.textContent='Excluir';
    del.onclick=async function(){
      if(typeof isManager==='function'&&!isManager()){
        alert('Somente o Gestor pode excluir este ajuste manual.');
        return;
      }
      if(typeof remoteReady!=='undefined'&&!remoteReady){
        alert('A base compartilhada não está disponível.');
        return;
      }
      var shown=typeof money==='function'?money(amount):String(amount);
      if(!confirm('Excluir o ajuste manual de '+shown+' de '+(consultant.name||'Mateus Menezes')+'?\\n\\nA venda individual de R$ 100 mil não será alterada.'))return;

      del.disabled=true;
      var backup={
        total:Number(opening.total)||0,
        lar:Number(opening.lar)||0,
        motors:Number(opening.motors)||0,
        larQty:Number(opening.larQty)||0,
        motorsQty:Number(opening.motorsQty)||0,
        unclassifiedQty:Number(opening.unclassifiedQty)||0
      };
      try{
        setOpeningForMonth(consultant,month,{total:0,lar:0,motors:0,larQty:0,motorsQty:0,unclassifiedQty:0});
        await save();
        if(typeof render==='function')render();
        if(typeof maybeAutoExportRanking==='function')maybeAutoExportRanking();
        setTimeout(renderManualRecent,30);
      }catch(error){
        setOpeningForMonth(consultant,month,backup);
        try{if(typeof KEY!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
        if(typeof render==='function')render();
        alert('Não foi possível excluir o ajuste: '+error.message);
      }
    };

    actions.append(value,del);
    row.append(left,actions);
    host.prepend(row);
  }

  function bindObserver(){
    var host=document.getElementById('recent');
    if(!host||recentObserver)return;
    recentObserver=new MutationObserver(function(){setTimeout(renderManualRecent,0);});
    recentObserver.observe(host,{childList:true});
  }

  function refresh(){
    renderManualRecent();
    bindObserver();
  }

  document.addEventListener('change',function(e){
    if(e.target&&e.target.id==='monthFilter')setTimeout(refresh,0);
  },true);
  document.addEventListener('DOMContentLoaded',refresh);
  window.addEventListener('load',refresh);
  setTimeout(refresh,0);
})();
<\/script>
`;

function enableManagerSaleDelete(html){
  if (!html.includes('id="editSalesModal"')) return html;
  if (html.includes('gm-manager-sale-delete-v1')) return html;
  if (!html.includes('gm-manager-sale-delete-style-v1')) {
    html = html.replace('</head>', MANAGER_SALE_DELETE.split('<script id="gm-manager-sale-delete-v1">')[0] + '\n</head>');
  }
  const script = '<script id="gm-manager-sale-delete-v1">' + MANAGER_SALE_DELETE.split('<script id="gm-manager-sale-delete-v1">')[1];
  return html.replace('</body>', script + '\n</body>');
}



const LEADER_PHOTOS_STYLE = `
<style id="gm-leader-photos-v1">
#leadershipGrid .leader-avatar.gm-leader-photo{
  position:relative!important;
  width:58px!important;
  height:58px!important;
  flex:0 0 58px!important;
  padding:2px!important;
  border-radius:18px!important;
  overflow:hidden!important;
  background:linear-gradient(145deg,rgba(239,202,119,.95),rgba(120,77,18,.95))!important;
  border:1px solid rgba(246,216,145,.42)!important;
  box-shadow:0 10px 28px rgba(0,0,0,.34),0 0 18px rgba(213,171,103,.16)!important;
}
#leadershipGrid .leader-avatar.gm-leader-photo img{
  display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:15px!important;
}
#leadershipGrid .leader-card.rank-1{
  border-color:rgba(244,198,82,.68)!important;
  background:radial-gradient(circle at 12% 14%,rgba(244,198,82,.16),transparent 28%),radial-gradient(circle at 92% 8%,rgba(255,226,142,.08),transparent 22%),linear-gradient(180deg,#1d1711,#0d1014)!important;
  box-shadow:0 0 0 1px rgba(244,198,82,.09) inset,0 0 34px rgba(244,198,82,.18),0 20px 54px rgba(0,0,0,.34)!important;
}
#leadershipGrid .leader-card.rank-1::after{
  content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0%,rgba(255,229,154,.03) 36%,rgba(255,229,154,.14) 50%,rgba(255,229,154,.03) 64%,transparent 100%);transform:translateX(-125%);animation:gmLeaderChampionSweep 4.8s linear infinite;z-index:0;
}
#leadershipGrid .leader-card.rank-1 > *{position:relative;z-index:1}
#leadershipGrid .leader-card.rank-1 .leader-avatar.gm-leader-photo{
  background:linear-gradient(145deg,#fff0ae,#e7b849 38%,#9e6509 72%,#f5d475)!important;border-color:rgba(255,231,158,.84)!important;box-shadow:0 0 0 1px rgba(255,233,167,.22),0 0 24px rgba(247,203,93,.42),0 12px 30px rgba(0,0,0,.36)!important;
}
#leadershipGrid .gm-leader-champion{
  display:inline-flex;align-items:center;gap:7px;margin-top:8px;padding:6px 10px;border-radius:999px;border:1px solid rgba(245,201,86,.36);background:linear-gradient(135deg,rgba(83,55,10,.92),rgba(26,17,7,.98));color:#ffdc7b;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 0 16px rgba(245,201,86,.12);
}
#leadershipGrid .gm-leader-champion .gm-trophy{display:inline-block;transform-style:preserve-3d;animation:gmLeaderTrophySpin 4s linear infinite}
@keyframes gmLeaderChampionSweep{0%{transform:translateX(-125%)}100%{transform:translateX(125%)}}
@keyframes gmLeaderTrophySpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
@media(prefers-reduced-motion:reduce){#leadershipGrid .leader-card.rank-1::after,#leadershipGrid .gm-leader-champion .gm-trophy{animation:none!important}}
</style>`;

function applyLeaderPhotos(html){
  if (!html.includes('</body>')) return html;
  if (!html.includes('gm-leader-photos-v1')) html=html.replace('</head>',LEADER_PHOTOS_STYLE+'\n</head>');
  const hook='<script id="gm-leader-photos-runtime-v1">';
  if(html.includes(hook))return html;
  const runtime=`
<script id="gm-leader-photos-runtime-v1">
(function(){
  var busy=false;
  function updateLeaderPhotos(){
    if(busy)return;busy=true;
    try{
      var grid=document.getElementById('leadershipGrid');
      if(typeof state==='undefined'||!Array.isArray(state.consultants))return;
      if(grid)Array.from(grid.querySelectorAll('.leader-card')).forEach(function(card){
        var nameEl=card.querySelector('.leader-head b');
        var avatar=card.querySelector('.leader-avatar');
        if(!nameEl||!avatar)return;
        var name=(nameEl.textContent||'').trim();
        var person=state.consultants.find(function(c){return String(c.name||'').trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')});
        if(person&&person.photo){
          var img=avatar.querySelector('img');
          if(!img){img=document.createElement('img');img.alt='Foto de '+name;avatar.textContent='';avatar.appendChild(img);}
          if(img.src!==person.photo)img.src=person.photo;
          avatar.classList.add('gm-leader-photo');
        }
        card.querySelectorAll('.gm-leader-champion').forEach(function(el){el.remove()});
        if(card.classList.contains('rank-1')){
          var meta=card.querySelector('.leader-head > div:last-child');
          if(meta){var tag=document.createElement('span');tag.className='gm-leader-champion';tag.innerHTML='<span class="gm-trophy">🏆</span> Campeão do momento';meta.appendChild(tag);}
        }
      });

      // Aba exclusiva do gestor: Líderes - Gestão
      var podium=document.getElementById('leadersPodium');
      if(podium){
        Array.from(podium.querySelectorAll('.leader-rank-card')).forEach(function(card,index){
          var nameEl=card.querySelector('h4');
          if(!nameEl)return;
          var name=(nameEl.textContent||'').trim();
          var person=state.consultants.find(function(c){return String(c.name||'').trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')});
          var existing=card.querySelector('.gm-management-leader-photo');
          if(person&&person.photo&&!existing){
            var wrap=document.createElement('div');
            wrap.className='gm-management-leader-photo';
            wrap.style.cssText='width:58px;height:58px;border-radius:17px;overflow:hidden;margin:0 0 10px;border:2px solid '+(index===0?'#e8c469':'#343c48')+';box-shadow:'+(index===0?'0 0 22px rgba(232,196,105,.32)':'0 10px 24px rgba(0,0,0,.26)');
            var img=document.createElement('img');
            img.src=person.photo;img.alt='Foto de '+name;img.style.cssText='width:100%;height:100%;object-fit:cover;display:block';
            wrap.appendChild(img);
            var small=card.querySelector('small');
            if(small)card.insertBefore(wrap,small);else card.insertBefore(wrap,card.firstChild);
          }
          if(index===0){
            card.style.borderColor='rgba(240,203,140,.78)';
            card.style.boxShadow='0 0 0 1px rgba(240,203,140,.12) inset,0 0 30px rgba(213,171,103,.20),0 18px 44px rgba(0,0,0,.32)';
            card.style.background='radial-gradient(circle at 14% 12%,rgba(240,203,140,.15),transparent 30%),linear-gradient(180deg,#191712,#0e1319)';
            if(!card.querySelector('.gm-management-champion')){
              var badge=document.createElement('div');
              badge.className='gm-management-champion';
              badge.textContent='🏆 Campeão do momento';
              badge.style.cssText='display:inline-flex;align-items:center;gap:6px;margin:8px 0 3px;padding:6px 10px;border-radius:999px;border:1px solid rgba(240,203,140,.34);background:rgba(213,171,103,.10);color:#f0cb8c;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase';
              nameEl.insertAdjacentElement('afterend',badge);
            }
          }
        });
      }

      var tbody=document.getElementById('leadersRankingBody');
      if(tbody){
        Array.from(tbody.querySelectorAll('tr')).forEach(function(row){
          var nameEl=row.querySelector('.person .name');
          var avatar=row.querySelector('.person .avatar');
          if(!nameEl||!avatar)return;
          var name=(nameEl.textContent||'').trim();
          var person=state.consultants.find(function(c){return String(c.name||'').trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')});
          if(person&&person.photo&&!avatar.querySelector('img')){
            avatar.textContent='';avatar.style.overflow='hidden';
            var img=document.createElement('img');
            img.src=person.photo;img.alt='Foto de '+name;img.style.cssText='width:100%;height:100%;object-fit:cover;display:block';
            avatar.appendChild(img);
          }
        });
      }
    }finally{busy=false}
  }
  function bindLeaderObservers(){
    var grid=document.getElementById('leadershipGrid');
    if(grid&&!grid.dataset.gmLeaderObserved){
      grid.dataset.gmLeaderObserved='1';
      new MutationObserver(function(){setTimeout(updateLeaderPhotos,0)}).observe(grid,{childList:true,subtree:true});
    }
    var mgmt=document.getElementById('leadersExportArea');
    if(mgmt&&!mgmt.dataset.gmLeaderObserved){
      mgmt.dataset.gmLeaderObserved='1';
      new MutationObserver(function(){setTimeout(updateLeaderPhotos,0)}).observe(mgmt,{childList:true,subtree:true});
    }
  }
  function refreshLeaders(){
    bindLeaderObservers();
    updateLeaderPhotos();
  }
  document.addEventListener('DOMContentLoaded',refreshLeaders);
  window.addEventListener('load',function(){setTimeout(refreshLeaders,120)});
  new MutationObserver(function(){setTimeout(refreshLeaders,0)}).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(refreshLeaders,180);
})();
<\/script>`;
  return html.replace('</body>',runtime+'\n</body>');
}



const LIVE_PERFORMANCE_INJECT = \`
<style id="gm-live-performance-v2">
#gmNotifyBtn{position:fixed;right:24px;top:22px;z-index:9996;width:46px;height:46px;border-radius:16px;border:1px solid rgba(213,171,103,.38);background:rgba(10,12,16,.92);backdrop-filter:blur(15px);color:#f0cb8c;display:grid;place-items:center;box-shadow:0 12px 35px rgba(0,0,0,.38);cursor:pointer;transition:.22s ease}
#gmNotifyBtn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 16px 42px rgba(213,171,103,.16)}
#gmNotifyBtn svg{width:21px;height:21px}#gmNotifyBadge{position:absolute;right:-5px;top:-5px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#8b1737;color:#fff;font:900 10px/20px Manrope,sans-serif;border:2px solid #080a0d}
#gmNotifyPanel{position:fixed;right:24px;top:76px;z-index:9997;width:min(390px,calc(100vw - 28px));max-height:520px;overflow:auto;border:1px solid rgba(213,171,103,.25);border-radius:22px;background:linear-gradient(180deg,rgba(17,20,25,.99),rgba(8,10,13,.99));box-shadow:0 24px 70px rgba(0,0,0,.58);padding:18px;display:none}
#gmNotifyPanel.open{display:block}.gm-notify-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}.gm-notify-title b{font:800 16px Manrope}.gm-notify-title span{font:900 9px Manrope;color:#d5ab67;letter-spacing:.14em;text-transform:uppercase}.gm-note{padding:12px;border-radius:15px;background:#10151b;border:1px solid #202832;margin:8px 0}.gm-note strong{display:block;font-size:13px}.gm-note small{display:block;color:#9aa3af;margin-top:4px}
.gm-live-nav{margin-top:8px!important;border-color:rgba(213,171,103,.38)!important;background:linear-gradient(90deg,rgba(124,23,51,.25),rgba(213,171,103,.09))!important;color:#f0cb8c!important;position:relative;overflow:hidden}.gm-live-nav:after{content:"LIVE";position:absolute;right:12px;top:50%;transform:translateY(-50%);font:900 8px Manrope;letter-spacing:.12em;padding:4px 6px;border-radius:999px;background:#8d1738;color:#fff;box-shadow:0 0 14px rgba(141,23,56,.65)}
#gmLivePerformance{position:fixed;inset:0;z-index:9998;background:radial-gradient(circle at 78% 8%,rgba(124,23,51,.27),transparent 27%),radial-gradient(circle at 18% 0%,rgba(213,171,103,.13),transparent 26%),#05070a;color:#f6f2ea;display:none;overflow:auto}#gmLivePerformance.open{display:block}.gm-live-shell{min-height:100vh;padding:24px 28px 40px}.gm-live-head{display:flex;align-items:center;gap:18px;justify-content:space-between;margin-bottom:18px}.gm-live-brand small{display:block;color:#d5ab67;letter-spacing:.20em;text-transform:uppercase;font:900 9px Manrope}.gm-live-brand h1{margin:4px 0 0;font:800 clamp(24px,3vw,44px) Sora,sans-serif;letter-spacing:-.05em}.gm-live-actions{display:flex;gap:8px}.gm-live-actions button{background:#0e1319;color:#eee;border:1px solid #252d36;border-radius:13px;padding:10px 13px;cursor:pointer;font-weight:800}.gm-live-actions button:hover{border-color:#d5ab67;color:#f0cb8c}
.gm-market-strip{position:relative;overflow:hidden;border-block:1px solid rgba(213,171,103,.24);background:linear-gradient(90deg,rgba(213,171,103,.05),rgba(124,23,51,.08));padding:12px 0;margin:0 -28px 22px}.gm-market-track{display:flex;width:max-content;gap:32px;animation:gmTicker 24s linear infinite;padding-left:28px}.gm-market-strip:hover .gm-market-track{animation-play-state:paused}.gm-ticker-item{display:flex;gap:10px;align-items:center;white-space:nowrap;font:800 12px Manrope}.gm-ticker-item b{color:#f0cb8c}.gm-ticker-item em{font-style:normal;color:#2eb67d}@keyframes gmTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.gm-live-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.gm-live-card{border:1px solid #202832;border-radius:22px;background:linear-gradient(180deg,rgba(15,20,26,.96),rgba(8,11,15,.96));box-shadow:0 18px 50px rgba(0,0,0,.22);padding:20px}.gm-live-card h3{margin:0 0 16px;font:900 12px Manrope;letter-spacing:.10em;text-transform:uppercase;color:#cfc6b8}.gm-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gm-podium-item{padding:18px;border-radius:18px;background:#0b1016;border:1px solid #202832;position:relative;overflow:hidden}.gm-podium-item.first{border-color:rgba(213,171,103,.62);box-shadow:inset 0 0 0 1px rgba(213,171,103,.12),0 0 32px rgba(213,171,103,.10)}.gm-place{font:900 9px Manrope;letter-spacing:.12em;color:#9aa3af}.gm-podium-item.first .gm-place{color:#f0cb8c}.gm-name{font:800 17px Sora;margin:9px 0 5px}.gm-money{font:800 20px Sora;color:#f0cb8c}.gm-progress{height:7px;border-radius:999px;background:#171d24;margin-top:13px;overflow:hidden}.gm-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7c1733,#d5ab67);box-shadow:0 0 18px rgba(213,171,103,.25)}
.gm-chart-row{display:grid;grid-template-columns:minmax(120px,1fr) 3fr auto;align-items:center;gap:12px;margin:11px 0}.gm-chart-row span{font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gm-chart-bar{height:9px;background:#171d24;border-radius:999px;overflow:hidden}.gm-chart-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#73172f,#d5ab67)}.gm-chart-row b{font:800 11px Manrope;color:#cfc6b8}.gm-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px}.gm-kpi{padding:16px;border-radius:17px;background:#0b1016;border:1px solid #202832}.gm-kpi small{display:block;color:#8f99a5;text-transform:uppercase;letter-spacing:.11em;font-size:9px;font-weight:800}.gm-kpi b{display:block;font:800 22px Sora;margin-top:7px}.gm-kpi.gold b{color:#f0cb8c}.gm-leader-list{display:flex;flex-direction:column;gap:9px}.gm-leader-row{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:11px 12px;background:#0b1016;border:1px solid #202832;border-radius:14px}.gm-leader-row .num{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:#171d24;font-weight:900;color:#d5ab67}.gm-leader-row b{font-size:12px}.gm-leader-row small{display:block;color:#7f8994;margin-top:2px}.gm-leader-row strong{font-size:12px;color:#f0cb8c}.gm-live-pulse{display:inline-flex;align-items:center;gap:7px;font:900 9px Manrope;color:#b7c0ca;letter-spacing:.08em;text-transform:uppercase}.gm-live-pulse i{width:8px;height:8px;border-radius:50%;background:#2eb67d;box-shadow:0 0 0 0 rgba(46,182,125,.5);animation:gmPulse 1.6s infinite}@keyframes gmPulse{70%{box-shadow:0 0 0 9px rgba(46,182,125,0)}100%{box-shadow:0 0 0 0 rgba(46,182,125,0)}}
@media(max-width:900px){#gmNotifyBtn{right:14px;top:14px}.gm-live-shell{padding:18px}.gm-market-strip{margin-left:-18px;margin-right:-18px}.gm-live-grid{grid-template-columns:1fr}.gm-podium{grid-template-columns:1fr}.gm-live-head{align-items:flex-start}.gm-live-actions{flex-direction:column}.gm-kpis{grid-template-columns:1fr 1fr}}
</style>
<button id="gmNotifyBtn" type="button" aria-label="Notificações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span id="gmNotifyBadge">0</span></button><div id="gmNotifyPanel"></div>
<section id="gmLivePerformance" aria-hidden="true"><div class="gm-live-shell"><div class="gm-live-head"><div class="gm-live-brand"><small>Gestão Menezes • Performance Exchange</small><h1>Central de Performance ao Vivo</h1></div><div class="gm-live-actions"><button id="gmLiveFullscreen">⛶ Tela cheia</button><button id="gmLiveClose">Fechar</button></div></div><div class="gm-market-strip"><div class="gm-market-track" id="gmTicker"></div></div><div class="gm-live-grid"><div class="gm-live-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0">Top performance</h3><span class="gm-live-pulse"><i></i> atualiza automaticamente</span></div><div class="gm-podium" id="gmPodium"></div><div style="height:18px"></div><h3>Corrida para 5MM</h3><div id="gmBars"></div></div><div><div class="gm-kpis" id="gmKpis"></div><div class="gm-live-card"><h3>Líderes • resultado das equipes</h3><div class="gm-leader-list" id="gmLeaders"></div></div></div></div></div></section>
<script id="gm-live-performance-runtime-v2">
(function(){
 var money=function(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})};
 var currentMonth=function(){return new Date().toISOString().slice(0,7)};
 function opening(c){var m=currentMonth(),o=c&&c.monthOpenings&&c.monthOpenings[m];return o&&isFinite(Number(o.total))?Number(o.total):Number(c&&c.opening||0)}
 function snapshot(){
   var people=(typeof state!=='undefined'&&Array.isArray(state.consultants)?state.consultants:[]).map(function(c){return Object.assign({},c,{gmTotal:opening(c)})}).filter(function(c){return c.gmTotal>0}).sort(function(a,b){return b.gmTotal-a.gmTotal});
   var leaders=(typeof state!=='undefined'&&Array.isArray(state.consultants)?state.consultants:[]).filter(function(c){return c.role==='trainee'||c.role==='gestor'}).map(function(l){
     var team=(state.consultants||[]).filter(function(c){return String(c.leaderId)===String(l.id)});
     return Object.assign({},l,{gmTotal:opening(l)+team.reduce(function(a,c){return a+opening(c)},0),teamCount:team.length});
   }).filter(function(x){return x.gmTotal>0}).sort(function(a,b){return b.gmTotal-a.gmTotal});
   return {people:people,leaders:leaders,total:people.reduce(function(a,c){return a+c.gmTotal},0),target:5000000};
 }
 function render(){
   var d=snapshot(),p=d.people,max=Math.max(d.target,p.length?p[0].gmTotal:1);
   var items=(p.length?p:[{name:'Aguardando vendas',gmTotal:0}]).slice(0,10).map(function(x,i){return '<div class="gm-ticker-item"><span>#'+(i+1)+' '+x.name+'</span><b>'+money(x.gmTotal)+'</b><em>▲ '+Math.min(999,x.gmTotal/d.target*100).toFixed(1)+'%</em></div>'}).join('');
   var tick=document.getElementById('gmTicker');if(tick)tick.innerHTML=items+items;
   var pod=document.getElementById('gmPodium');if(pod)pod.innerHTML=p.slice(0,3).map(function(x,i){return '<div class="gm-podium-item '+(i===0?'first':'')+'"><div class="gm-place">'+(i===0?'🏆 CAMPEÃO DO MOMENTO':'#'+(i+1)+' COLOCAÇÃO')+'</div><div class="gm-name">'+x.name+'</div><div class="gm-money">'+money(x.gmTotal)+'</div><div class="gm-progress"><i style="width:'+Math.min(100,x.gmTotal/d.target*100)+'%"></i></div></div>'}).join('');
   var bars=document.getElementById('gmBars');if(bars)bars.innerHTML=p.slice(0,8).map(function(x,i){return '<div class="gm-chart-row"><span>#'+(i+1)+' '+x.name+'</span><div class="gm-chart-bar"><i style="width:'+Math.min(100,x.gmTotal/max*100)+'%"></i></div><b>'+money(x.gmTotal)+'</b></div>'}).join('');
   var k=document.getElementById('gmKpis');if(k)k.innerHTML='<div class="gm-kpi gold"><small>Volume da gestão</small><b>'+money(d.total)+'</b></div><div class="gm-kpi"><small>Vendedores ativos</small><b>'+p.length+'</b></div><div class="gm-kpi"><small>Falta p/ 15MM</small><b>'+money(Math.max(0,15000000-d.total))+'</b></div><div class="gm-kpi"><small>Líder do mês</small><b>'+(p[0]?p[0].name:'—')+'</b></div>';
   var le=document.getElementById('gmLeaders');if(le)le.innerHTML=(d.leaders.length?d.leaders:[{name:'Sem líderes com produção',gmTotal:0,teamCount:0}]).map(function(x,i){return '<div class="gm-leader-row"><div class="num">'+(i+1)+'</div><div><b>'+x.name+'</b><small>'+x.teamCount+' pessoas na equipe</small></div><strong>'+money(x.gmTotal)+'</strong></div>'}).join('');
   var notes=[];if(p[0])notes.push('<div class="gm-note"><strong>🏆 '+p[0].name+' lidera agora</strong><small>'+money(p[0].gmTotal)+' no mês.</small></div>');
   var hot=p.find(function(x){return x.gmTotal>=d.target*.5});if(hot)notes.push('<div class="gm-note"><strong>🔥 '+hot.name+' acelerando</strong><small>Já passou de 50% da meta de 5MM.</small></div>');
   if(d.leaders[0])notes.push('<div class="gm-note"><strong>📈 Liderança em destaque</strong><small>'+d.leaders[0].name+' está na frente entre os líderes.</small></div>');
   var panel=document.getElementById('gmNotifyPanel');if(panel)panel.innerHTML='<div class="gm-notify-title"><b>Notificações</b><span>Performance</span></div>'+notes.join('');
   var badge=document.getElementById('gmNotifyBadge');if(badge)badge.textContent=String(notes.length);
 }
 function openLive(){render();var e=document.getElementById('gmLivePerformance');if(!e)return;e.classList.add('open');e.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
 function closeLive(){var e=document.getElementById('gmLivePerformance');if(!e)return;e.classList.remove('open');e.setAttribute('aria-hidden','true');document.body.style.overflow=''}
 function addNav(){var nav=document.querySelector('.sidebar nav,.sidebar .nav,.sidebar');if(!nav||document.querySelector('.gm-live-nav'))return;var b=document.createElement('button');b.type='button';b.className='gm-live-nav';b.innerHTML='<span class="nav-icon" aria-hidden="true">◫</span> Performance ao Vivo';b.onclick=openLive;var settings=Array.from(nav.querySelectorAll('button')).find(function(x){return x.dataset&&x.dataset.view==='settings'});settings?nav.insertBefore(b,settings):nav.appendChild(b)}
 document.getElementById('gmNotifyBtn')?.addEventListener('click',function(){render();document.getElementById('gmNotifyPanel')?.classList.toggle('open')});
 document.getElementById('gmLiveClose')?.addEventListener('click',closeLive);
 document.getElementById('gmLiveFullscreen')?.addEventListener('click',function(){var e=document.getElementById('gmLivePerformance');if(!document.fullscreenElement)e.requestFullscreen&&e.requestFullscreen();else document.exitFullscreen&&document.exitFullscreen()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLive()});
 document.addEventListener('click',function(e){if(!e.target.closest('#gmNotifyPanel,#gmNotifyBtn'))document.getElementById('gmNotifyPanel')?.classList.remove('open')});
 addNav();render();setInterval(function(){if(document.getElementById('gmLivePerformance')?.classList.contains('open'))render()},4000);
})();
<\/script>\`;

function applyLivePerformance(html){
  if(html.includes("gm-arena-v6")) return html;
  if(!html.includes('</body>')) return html;
  if(!html.includes('gm-live-performance-v2')) html = html.replace('</body>', LIVE_PERFORMANCE_INJECT + '\n</body>');
  if(!html.includes('performance-live.js')) html = html.replace('</body>', '<script src="/performance-live.js?v=3"></script>\n</body>');
  return html;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, {cache:'no-store'});
        const type = response.headers.get("content-type") || "";
        if (!type.includes("text/html")) return response;
        let html = enhanceCommissionGoal(await response.text());
        html = moveCommissionMoney(html);
        html = applyChampionVisual(html);
        html = applyLeaderPhotos(html);
        html = enableManagerSaleDelete(html);
        html = applyLivePerformance(html);
        const headers = new Headers(response.headers);
        headers.delete("content-length");
        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (err) {
        return caches.match(event.request);
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});