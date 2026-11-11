/* Gestão Menezes · refinamentos 11/11/2026.
   Complemento visual, sem alterar a aba de agendamentos e sem gravar dados. */
(function(){
'use strict';
if(window.__gmRefinement20261111)return;
window.__gmRefinement20261111=true;
var stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';stylesheet.href='/menezes-refinement-20261111.css?v=2';
document.head.appendChild(stylesheet);
var brl=function(n){return (Number(n)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})};
var get=function(id){return document.getElementById(id)};
var prevTotal=null,prevMonth='',saleWatch=null;
function source(){try{return typeof state!=='undefined'&&state&&Array.isArray(state.consultants)?state:null}catch(e){return null}}
function month(){return (get('monthFilter')||{}).value||''}
function totalsOf(m){try{return typeof totals==='function'?totals(m):null}catch(e){return null}}
function ready(){return get('gmAuth')&&get('gmAuth').classList.contains('hidden')}
function node(tag,cls){var el=document.createElement(tag);if(cls)el.className=cls;return el}
function after(ref,el){if(ref&&ref.parentNode)ref.insertAdjacentElement('afterend',el)}
function dashboard(){
 var page=get('dashboard'),s=source(),m=month(),t=totalsOf(m);
 if(!page||!s||!t)return;
 var goal=Math.max(1,Number(s.settings&&s.settings.teamTarget)||15000000);
 var amount=Math.max(0,Number(t.total)||0),left=Math.max(0,goal-amount);
 var percentage=Math.min(100,amount/goal*100);
 var host=get('gm-goal-progress-2026');
 if(!host){
  host=node('div','gm-goal-progress');host.id='gm-goal-progress-2026';
  host.innerHTML='<div class="gm-goal-head"><div><small>PERFORMANCE DA GESTÃO</small><h3>Rumo à meta de '+brl(goal)+'</h3></div><div class="gm-goal-togo"><small>FALTA PARA CONQUISTAR</small><b data-gm-remaining></b></div></div><div class="gm-goal-track" role="progressbar" aria-label="Progresso da meta da gestão" aria-valuemin="0" aria-valuemax="100"><div data-gm-bar></div></div><div class="gm-goal-foot"><span data-gm-progress></span><span data-gm-total></span></div>';
  var anchor=page.querySelector('.topbar')||page.querySelector('.section-head')||page.firstElementChild;
  after(anchor,host);
 }
 var title=host.querySelector('h3');if(title)title.textContent='Rumo à meta de '+brl(goal);
 host.querySelector('[data-gm-remaining]').textContent=left===0?'META CONQUISTADA':brl(left);
 host.querySelector('[data-gm-progress]').textContent=percentage.toLocaleString('pt-BR',{maximumFractionDigits:1})+'% da meta';
 host.querySelector('[data-gm-total]').textContent=brl(amount)+' em vendas';
 host.querySelector('[data-gm-bar]').style.width=percentage+'%';
 host.querySelector('.gm-goal-track').setAttribute('aria-valuenow',String(Math.round(percentage)));
 if(prevMonth===m&&prevTotal!==null&&amount>prevTotal){
  host.classList.remove('gm-goal-win');void host.offsetWidth;host.classList.add('gm-goal-win');
  setTimeout(function(){host.classList.remove('gm-goal-win')},1500);
 }
 prevTotal=amount;prevMonth=m;
}
function leaderRows(){
 try{if(typeof managementLeaderRows!=='function')return [];
 return managementLeaderRows((get('leadersMonthFilter')||{}).value||month())||[]}catch(e){return []}
}
function leaders(){
 var page=get('leaders'),podium=get('leadersPodium'),tbody=get('leadersRankingBody');
 if(!page||!podium||!tbody)return;
 var rows=leaderRows();
 Array.from(podium.children).forEach(function(card,i){
  var r=rows[i];if(!r)return;
  var avg=Number(r.teamTotal||0)/Math.max(1,(r.team||[]).length);
  var slot=card.querySelector('.gm-leader-average');
  if(!slot){slot=node('div','gm-leader-average');card.appendChild(slot)}
  var txt='Produtividade da equipe · '+brl(avg)+' por consultor';
  if(slot.textContent!==txt)slot.textContent=txt;
 });
 var head=page.querySelector('.leaders-table thead tr');
 if(head&&!head.querySelector('[data-gm-avg-head]')){
  var th=node('th');th.dataset.gmAvgHead='1';th.textContent='Média / consultor';head.appendChild(th);
 }
 Array.from(tbody.children).forEach(function(tr,i){
  var r=rows[i];if(!r)return;
  var cell=tr.querySelector('[data-gm-avg-cell]');
  if(!cell){cell=node('td');cell.dataset.gmAvgCell='1';tr.appendChild(cell)}
  var n=(r.team||[]).length,avg=n?Number(r.teamTotal||0)/n:0;
  var val=n?brl(avg):'Sem equipe';
  if(cell.textContent!==val)cell.textContent=val;
 });
}
function team(){
 var page=get('team'),list=get('teamList'),s=source(),t=totalsOf(month());
 if(!page||!list||!s||!t)return;
 var active=list.querySelector('[data-consultant-row].active');
 var host=get('gm-next-place');
 if(!host){host=node('div','gm-next-place');host.id='gm-next-place';after(list,host)}
 if(!active){host.hidden=true;return}
 var rows=s.consultants.map(function(c){return {id:String(c.id),name:String(c.name),total:Number(t.by[c.id])||0}}).sort(function(a,b){return b.total-a.total||a.name.localeCompare(b.name,'pt-BR')});
 var idx=rows.findIndex(function(r){return r.id===active.dataset.consultantRow});
 if(idx<0){host.hidden=true;return}
 host.hidden=false;
 if(idx===0){
  host.textContent='1º LUGAR · Você está liderando o ranking neste mês. Continue avançando!';
 }else{
  var ahead=rows[idx-1],gap=Math.max(0,ahead.total-rows[idx].total)+1;
  host.textContent='PRÓXIMA CONQUISTA · Faltam '+brl(gap)+' para ultrapassar '+ahead.name+' e chegar à '+idx+'ª posição.';
 }
}
function simulator(){
 var page=get('simulator');if(!page)return;
 if(get('gm-simulator-note'))return;
 var el=node('div','gm-safe-note');el.id='gm-simulator-note';
 el.innerHTML='<b>Leitura da proposta</b><span>Crédito, prazo e parcelas correspondem à opção selecionada na simulação. Lances e contemplação são cenários estimados, não representam promessa de contemplação. Confira o regulamento e as condições vigentes antes de apresentar ao cliente.</span>';
 var anchor=page.querySelector('.topbar')||page.firstElementChild;
 after(anchor,el);
}
function commission(){
 var page=get('commission'),results=page&&page.querySelector('.commission-results');
 if(!results)return;
 var host=get('gm-commission-planning');
 if(!host){
  host=node('div','gm-commission-planning');host.id='gm-commission-planning';
  host.innerHTML='<div class="gm-planning-head"><small>PLANEJAMENTO COMERCIAL</small><h3>Quanto sua produção pode representar?</h3><p>Projeção de líquido aproximado nas mesmas premissas de 2% e descontos exibidos no simulador. Não é promessa de recebimento.</p></div><div class="gm-planning-grid"></div>';
  after(results,host);
 }
 var netRate=0.02*(1-0.1823-0.015);
 var amounts=[1000000,3000000,5000000];
 var grid=host.querySelector('.gm-planning-grid');
 var html=amounts.map(function(v){return '<div class="gm-plan"><small>PRODUÇÃO DE '+brl(v)+'</small><b>'+brl(v*netRate)+'</b><span>Líquido estimado</span></div>'}).join('');
 if(grid.innerHTML!==html)grid.innerHTML=html;
}
function sale(){
 var old=get('saveSaleShare'),button=get('saveSale'),page=get('sale');
 if(!old||!button||!page)return;
 old.hidden=true;old.style.display='none';old.setAttribute('aria-hidden','true');
 var share=get('gm-share-after-sale');
 if(!share){
  share=node('button','btn gm-share-after-sale');
  share.type='button';share.id='gm-share-after-sale';share.hidden=true;
  share.textContent='Compartilhar ranking da conquista';
  button.insertAdjacentElement('afterend',share);
  share.addEventListener('click',function(){
   if(typeof prepareRankingShare==='function')prepareRankingShare();
  });
  button.addEventListener('click',function(){
   share.hidden=true;
   var s=source();if(!s)return;
   var before=new Set((s.sales||[]).map(function(x){return String(x.id)}));
   var consultant=(get('saleConsultant')||{}).value;
   var raw=(get('saleAmount')||{}).value||'0';
   var unit=Number(raw.replace(/\./g,'').replace(',','.').replace(/[^0-9.]/g,''))||0;
   var qty=Number((get('saleQty')||{}).value)||1;
   var date=(get('saleDate')||{}).value;
   var count=0;
   if(saleWatch)clearInterval(saleWatch);
   saleWatch=setInterval(function(){
    count++;
    var latest=source();
    var created=latest&&(latest.sales||[]).some(function(x){
     return !before.has(String(x.id))&&String(x.consultantId)===String(consultant)&&
       String(x.date)===String(date)&&Math.abs(Number(x.amount)-unit*qty)<0.01;
    });
    if(created){share.hidden=false;share.focus({preventScroll:true})}
    if(created||count>=55){clearInterval(saleWatch);saleWatch=null}
   },250);
  });
 }
}
function settings(){
 var page=get('settings');if(!page||get('gm-backup-advice'))return;
 var hint=node('p','gm-backup-advice');hint.id='gm-backup-advice';
 hint.textContent='Segurança operacional: antes de restaurar ou importar um backup, confira a data e mantenha uma cópia atual. Mudanças administrativas devem ser feitas somente pelo acesso Gestor.';
 var anchor=page.querySelector('.topbar')||page.firstElementChild;
 after(anchor,hint);
}
function refresh(){
 if(!ready())return;
 dashboard();leaders();team();simulator();commission();sale();settings();
}
function boot(){
 refresh();
 setInterval(refresh,1800);
 ['monthFilter','leadersMonthFilter','consultantFocus','commissionCondition'].forEach(function(id){
  var el=get(id);if(el)el.addEventListener('change',function(){setTimeout(refresh,60)});
 });
 document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();