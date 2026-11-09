const VERSION = "gm-pwa-v6";
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

function moveCommissionMoney(html){
  if (!html.includes('commission-money-float')) return html;

  html = html.replace(
    /\s*<span class="commission-money-float" aria-hidden="true">R\$<\/span>/,
    ''
  );

  html = html.replace(
    /(<div class="countdown-kicker commission-kicker">\s*<span class="countdown-icon commission-icon"[^>]*>[\s\S]*?<\/span>)/,
    '$1<span class="commission-money-float" aria-hidden="true">R$</span>'
  );

  if (!html.includes('gm-money-safe-v1')) {
    html = html.replace('</head>', MONEY_STYLE + '\n</head>');
  }
  return html;
}


const CHAMPION_STYLE = \`
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
</style>\`;

function applyChampionVisual(html){
  if (!html.includes('id="team"')) return html;

  if (!html.includes('gm-champion-highlight-v1')) {
    html = html.replace('</head>', CHAMPION_STYLE + '\n</head>');
  }

  const hook = '<script id="gm-champion-runtime-v1">';
  if (html.includes(hook)) return html;

  const runtime = \`
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
<\/script>\`;

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



const LEADER_PHOTOS_STYLE = \`
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
  display:block!important;
  width:100%!important;
  height:100%!important;
  object-fit:cover!important;
  object-position:center!important;
  border-radius:15px!important;
}
#leadershipGrid .leader-card.rank-1{
  border-color:rgba(244,198,82,.68)!important;
  background:
    radial-gradient(circle at 12% 14%,rgba(244,198,82,.16),transparent 28%),
    radial-gradient(circle at 92% 8%,rgba(255,226,142,.08),transparent 22%),
    linear-gradient(180deg,#1d1711,#0d1014)!important;
  box-shadow:
    0 0 0 1px rgba(244,198,82,.09) inset,
    0 0 34px rgba(244,198,82,.18),
    0 20px 54px rgba(0,0,0,.34)!important;
}
#leadershipGrid .leader-card.rank-1::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:linear-gradient(115deg,transparent 0%,rgba(255,229,154,.03) 36%,rgba(255,229,154,.14) 50%,rgba(255,229,154,.03) 64%,transparent 100%);
  transform:translateX(-125%);
  animation:gmLeaderChampionSweep 4.8s linear infinite;
  z-index:0;
}
#leadershipGrid .leader-card.rank-1 > *{position:relative;z-index:1}
#leadershipGrid .leader-card.rank-1 .leader-avatar.gm-leader-photo{
  background:linear-gradient(145deg,#fff0ae,#e7b849 38%,#9e6509 72%,#f5d475)!important;
  border-color:rgba(255,231,158,.84)!important;
  box-shadow:0 0 0 1px rgba(255,233,167,.22),0 0 24px rgba(247,203,93,.42),0 12px 30px rgba(0,0,0,.36)!important;
}
#leadershipGrid .gm-leader-champion{
  display:inline-flex;
  align-items:center;
  gap:7px;
  margin-top:8px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid rgba(245,201,86,.36);
  background:linear-gradient(135deg,rgba(83,55,10,.92),rgba(26,17,7,.98));
  color:#ffdc7b;
  font-size:9px;
  font-weight:900;
  letter-spacing:.08em;
  text-transform:uppercase;
  box-shadow:0 0 16px rgba(245,201,86,.12);
}
#leadershipGrid .gm-leader-champion .gm-trophy{
  display:inline-block;
  transform-style:preserve-3d;
  animation:gmLeaderTrophySpin 4s linear infinite;
}
@keyframes gmLeaderChampionSweep{
  0%{transform:translateX(-125%)}
  100%{transform:translateX(125%)}
}
@keyframes gmLeaderTrophySpin{
  0%{transform:rotateY(0deg)}
  100%{transform:rotateY(360deg)}
}
@media(prefers-reduced-motion:reduce){
  #leadershipGrid .leader-card.rank-1::after,
  #leadershipGrid .gm-leader-champion .gm-trophy{animation:none!important}
}
</style>\`;

function applyLeaderPhotos(html){
  if (!html.includes('id="leadershipGrid"')) return html;
  if (!html.includes('gm-leader-photos-v1')) {
    html = html.replace('</head>', LEADER_PHOTOS_STYLE + '\n</head>');
  }
  const hook='<script id="gm-leader-photos-runtime-v1">';
  if (html.includes(hook)) return html;

  const runtime=\`
<script id="gm-leader-photos-runtime-v1">
(function(){
  var busy=false;
  function updateLeaderPhotos(){
    if(busy)return;
    busy=true;
    try{
      var grid=document.getElementById('leadershipGrid');
      if(!grid||typeof state==='undefined'||!Array.isArray(state.consultants))return;

      var cards=Array.from(grid.querySelectorAll('.leader-card'));
      cards.forEach(function(card,index){
        var nameEl=card.querySelector('.leader-head b');
        var avatar=card.querySelector('.leader-avatar');
        if(!nameEl||!avatar)return;

        var name=(nameEl.textContent||'').trim();
        var person=state.consultants.find(function(c){
          return String(c.name||'').trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR');
        });

        if(person&&person.photo){
          var current=avatar.querySelector('img');
          if(!current){
            current=document.createElement('img');
            current.alt='Foto de '+name;
            avatar.textContent='';
            avatar.appendChild(current);
          }
          if(current.src!==person.photo)current.src=person.photo;
          avatar.classList.add('gm-leader-photo');
        }

        card.querySelectorAll('.gm-leader-champion').forEach(function(el){el.remove();});
        if(card.classList.contains('rank-1')){
          var meta=card.querySelector('.leader-head > div:last-child');
          if(meta){
            var champion=document.createElement('span');
            champion.className='gm-leader-champion';
            champion.innerHTML='<span class="gm-trophy">🏆</span> Campeão do momento';
            meta.appendChild(champion);
          }
        }
      });
    }finally{
      busy=false;
    }
  }

  var grid=document.getElementById('leadershipGrid');
  if(grid)new MutationObserver(function(){setTimeout(updateLeaderPhotos,0)}).observe(grid,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',updateLeaderPhotos);
  window.addEventListener('load',function(){setTimeout(updateLeaderPhotos,120)});
  setTimeout(updateLeaderPhotos,180);
})();
<\/script>\`;
  return html.replace('</body>',runtime+'\n</body>');
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const type = response.headers.get("content-type") || "";
        if (!type.includes("text/html")) return response;
        let html = enhanceCommissionGoal(await response.text());
        html = moveCommissionMoney(html);
        html = applyChampionVisual(html);
        html = applyLeaderPhotos(html);
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