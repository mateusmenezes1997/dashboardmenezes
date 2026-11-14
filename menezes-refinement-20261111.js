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
 // Panorama executivo: uma única leitura dos indicadores essenciais.
 var overview=get('gm-overview-2026');
 if(!overview){
  overview=node('div','gm-overview');overview.id='gm-overview-2026';
  overview.innerHTML='<article><small>PRODUÇÃO DA GESTÃO</small><b data-overview-total></b><span>Volume apurado no mês</span></article><article><small>PARA A META</small><b data-overview-gap></b><span>Meta de '+brl(goal)+'</span></article><article><small>VENDAS REGISTRADAS</small><b data-overview-sales></b><span>Lançamentos deste mês</span></article><article><small>CONSULTORES ATIVOS</small><b data-overview-active></b><span>Com produção no mês</span></article>';
  after(host,overview);
 }
 var salesCount=(s.sales||[]).filter(function(x){return String(x.date||'').slice(0,7)===m}).length;
 var activeCount=s.consultants.filter(function(x){return x.role!=='gestor'&&(Number(t.by&&t.by[x.id])||0)>0}).length;
 overview.querySelector('[data-overview-total]').textContent=brl(amount);
 overview.querySelector('[data-overview-gap]').textContent=left===0?'Meta atingida':brl(left);
 overview.querySelector('[data-overview-sales]').textContent=String(salesCount);
 overview.querySelector('[data-overview-active]').textContent=String(activeCount);
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
 var note=get('gm-simulator-note');
 if(!note){
  note=node('div','gm-safe-note');note.id='gm-simulator-note';
  note.innerHTML='<b>Proposta comercial</b><span>Os valores acompanham as condições selecionadas no simulador. Lances e contemplação são cenários estimados, sem garantia de contemplação. Confira as condições do grupo antes do envio.</span>';
  var anchor=page.querySelector('.topbar')||page.firstElementChild;
  after(anchor,note);
 }
 var values=typeof window.simulatorValues==='function'?window.simulatorValues():null;
 if(!values)return;
 var host=get('gm-simulator-summary');
 if(!host){
  host=node('section','gm-simulator-summary');host.id='gm-simulator-summary';
  host.innerHTML='<div class="gm-simulator-summary-title"><small>RESUMO DA PROPOSTA SELECIONADA</small><strong>Condições que o cliente precisa entender</strong></div><div class="gm-simulator-summary-grid"><div><small>Crédito contratado</small><b data-sim-credit></b></div><div><small>Parcela selecionada</small><b data-sim-installment></b></div><div><small>Recurso próprio para lance</small><b data-sim-pocket></b></div><div><small>Crédito após embutido</small><b data-sim-released></b></div></div>';
  after(note,host);
 }
 host.querySelector('[data-sim-credit]').textContent=brl(values.credit);
 host.querySelector('[data-sim-installment]').textContent=brl(values.installment);
 host.querySelector('[data-sim-pocket]').textContent=brl(values.pocket);
 host.querySelector('[data-sim-released]').textContent=brl(values.released);
}
function commission(){
 var page=get('commission'),results=page&&page.querySelector('.commission-results');
 if(!results)return;
 var host=get('gm-commission-planning');
 if(!host){
  host=node('div','gm-commission-planning');host.id='gm-commission-planning';
  host.innerHTML='<div class="gm-planning-head"><small>PLANEJAMENTO COMERCIAL</small><h3>Quanto sua produção pode representar?</h3><p>Valores calculados pelas regras de comissionamento da condição selecionada. Projeção de líquido total, não de recebimento imediato.</p></div><div class="gm-planning-grid"></div>';
  after(results,host);
 }
 var metrics=window.MenezesMetrics;
 var amounts=[1000000,3000000,5000000];
 var condition=(get('commissionCondition')||{}).value||'lar50';
 var grid=host.querySelector('.gm-planning-grid');
 if(!metrics||typeof metrics.commission!=='function'){
  grid.textContent='Carregando condições de comissionamento...';return;
 }
 var html=amounts.map(function(v){
  var calc=metrics.commission(v,condition),installments=calc.payments.length;
  return '<div class="gm-plan"><small>PRODUÇÃO DE '+brl(v)+'</small><b>'+brl(calc.net)+'</b><span>Líquido total estimado · '+installments+' repasses</span><small>Primeiro repasse estimado: '+brl(calc.payments[0])+'</small></div>';
 }).join('');
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
  // Bloqueia o segundo clique no mesmo lançamento antes de acionar handlers da página.
  button.addEventListener('click',function(event){
   var now=Date.now(),previous=Number(button.dataset.gmClickAt||0);
   if(previous&&now-previous<1800){
    event.preventDefault();event.stopImmediatePropagation();return;
   }
   button.dataset.gmClickAt=String(now);
   button.classList.add('gm-saving');
   setTimeout(function(){button.classList.remove('gm-saving')},1800);
  },true);
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
    if(created){share.hidden=false;share.focus({preventScroll:true});window.dispatchEvent(new Event('gm:local-sale-saved'))}
    if(created||count>=55){clearInterval(saleWatch);saleWatch=null}
   },250);
  });
 }
}
function settings(){
 var page=get('settings');if(!page)return;
 if(!get('gm-backup-advice')){
  var hint=node('p','gm-backup-advice');hint.id='gm-backup-advice';
  hint.textContent='Segurança operacional: confira a data do backup antes de qualquer importação e mantenha uma cópia atual. Alterações administrativas pertencem ao acesso Gestor.';
  var anchor=page.querySelector('.topbar')||page.firstElementChild;
  after(anchor,hint);
 }
 var importFile=get('importBackupFile');
 if(importFile&&!importFile.dataset.gmGuarded){
  importFile.dataset.gmGuarded='1';
  importFile.addEventListener('change',function(event){
   var file=importFile.files&&importFile.files[0];
   if(!file)return;
   var ok=window.confirm('ATENÇÃO: importar "'+file.name+'" substituirá os dados atualmente exibidos, incluindo consultores e vendas. Você já baixou um backup atualizado e confirma a substituição?');
   if(!ok){event.stopImmediatePropagation();importFile.value=''}
  },true);
 }
 var reset=get('resetData');
 if(reset&&!reset.dataset.gmGuarded){
  reset.dataset.gmGuarded='1';
  reset.addEventListener('click',function(event){
   var ok=window.confirm('RESTAURAÇÃO DA BASE INICIAL: esta ação pode substituir informações da gestão. Você possui um backup atualizado e quer continuar?');
   if(!ok){event.stopImmediatePropagation();event.preventDefault()}
  },true);
 }
 var s=source();
 if(!s||!Array.isArray(s.auditTrail))return;
 var history=get('gm-audit-history');
 if(!history){
  history=node('section','gm-audit-history');history.id='gm-audit-history';
  history.innerHTML='<div class="gm-audit-title"><small>EXCLUSIVO DO GESTOR</small><h3>Histórico de alterações administrativas</h3><p>Registros gerados pelo servidor. Exibindo as oito atividades mais recentes.</p></div><div class="gm-audit-list"></div>';
  page.appendChild(history);
 }
 var list=history.querySelector('.gm-audit-list'),recent=s.auditTrail.slice(-8).reverse();
 var key=recent.map(function(x){return x.id}).join('|');
 if(list.dataset.gmKey===key)return;
 list.dataset.gmKey=key;list.replaceChildren();
 if(!recent.length){var blank=node('p');blank.textContent='Nenhuma alteração registrada desde a ativação do histórico.';list.appendChild(blank);return}
 var titles={VENDA_CRIADA:'Venda cadastrada',VENDA_EXCLUIDA:'Venda excluída',EQUIPE_ATUALIZADA:'Equipe atualizada',CONFIGURACOES_ATUALIZADAS:'Configurações alteradas',BASE_ATUALIZADA:'Base administrativa atualizada',BASE_INICIALIZADA:'Base inicializada'};
 recent.forEach(function(entry){
  var item=node('div','gm-audit-row'),label=node('strong'),meta=node('small');
  label.textContent=titles[entry.action]||'Alteração registrada';
  var when='';try{when=new Date(entry.at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'})}catch(e){when=entry.at||''}
  var name='';if(entry.details&&entry.details.consultantId){
   var who=s.consultants.find(function(c){return String(c.id)===String(entry.details.consultantId)});
   name=who?' · '+who.name:'';
  }
  meta.textContent=when+' · '+(entry.actor==='gestor'?'Gestor':entry.actor==='trainee'?'Trainee':'Sistema')+name;
  item.append(label,meta);list.appendChild(item);
 });
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
 window.addEventListener('gm:performance-state',refresh);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* Dashboard Performance v2: loader isolado, com cache bust e sem interferir nos agendamentos. */
(function(){
 if(window.__gmPerformanceLoaderV2)return;
 window.__gmPerformanceLoaderV2=true;
 var script=document.createElement('script');
 script.src='/dashboard-performance-20261111.js?v=3';script.defer=true;
 document.head.appendChild(script);
})();


/* GM_COMMISSION_HEADER_ALERT_V1 */
(function(){
  'use strict';
  if(window.__gmCommissionHeaderAlertV1)return;
  window.__gmCommissionHeaderAlertV1=true;

  function spToday(){
    try{
      var parts=new Intl.DateTimeFormat('en-CA',{
        timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(new Date()).reduce(function(acc,p){acc[p.type]=p.value;return acc},{});
      return {y:Number(parts.year),m:Number(parts.month),d:Number(parts.day)};
    }catch(e){
      var n=new Date();return {y:n.getFullYear(),m:n.getMonth()+1,d:n.getDate()};
    }
  }
  function closeInfo(){
    var t=spToday(),cy=t.y,cm=t.m,cd=15;
    if(t.y===2026&&t.m===11&&t.d<=16){
      cy=2026;cm=11;cd=16;
    }else if(t.d>15){
      cm=t.m+1;if(cm===13){cm=1;cy=t.y+1}
    }
    var todayUTC=Date.UTC(t.y,t.m-1,t.d);
    var closeUTC=Date.UTC(cy,cm-1,cd);
    var days=Math.max(0,Math.round((closeUTC-todayUTC)/86400000));
    return {days:days,label:String(cd).padStart(2,'0')+'/'+String(cm).padStart(2,'0')};
  }
  function ensure(){
    var page=document.getElementById('dashboard');
    if(!page)return;
    var top=page.querySelector('.topbar');
    if(!top)return;

    var sourceCard=page.querySelector('#commissionCountdownCard');
    if(sourceCard)sourceCard.classList.add('gm-source-hidden-on-dashboard');

    var host=document.getElementById('gmCommissionHeaderAlert');
    if(!host){
      host=document.createElement('aside');
      host.id='gmCommissionHeaderAlert';
      host.className='gm-commission-header-alert';
      host.setAttribute('role','status');
      host.setAttribute('aria-live','polite');
      host.innerHTML=
        '<div class="gm-cha-icon" aria-hidden="true">!</div>'+
        '<div class="gm-cha-copy">'+
          '<small>Fechamento de comissão</small>'+
          '<strong><b data-gm-cha-days>-- dias</b> • até <span data-gm-cha-date>--/--</span></strong>'+
          '<span data-gm-cha-message>Janela atual de comissão</span>'+
        '</div>'+
        '<div class="gm-cha-badge" data-gm-cha-badge>ALERTA</div>';
      var actions=top.querySelector('.actions');
      if(actions)top.insertBefore(host,actions);else top.appendChild(host);
    }

    var info=closeInfo();
    var daysText=info.days===0?'HOJE':info.days+' '+(info.days===1?'dia':'dias');
    var message=info.days===0?'Fechamento hoje. Última chamada para esta janela.':
      info.days===1?'Último dia amanhã para aumentar sua comissão.':
      info.days<=3?'Reta final para aumentar sua comissão.':
      'Acompanhe a janela atual de comissão.';
    host.querySelector('[data-gm-cha-days]').textContent=daysText;
    host.querySelector('[data-gm-cha-date]').textContent=info.label;
    host.querySelector('[data-gm-cha-message]').textContent=message;
    host.querySelector('[data-gm-cha-badge]').textContent=info.days<=3?'ALERTA':'COMISSÃO';
    host.classList.toggle('urgent',info.days<=3);
    host.classList.toggle('today',info.days===0);
  }
  function boot(){
    ensure();
    setInterval(ensure,1800);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)ensure()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
