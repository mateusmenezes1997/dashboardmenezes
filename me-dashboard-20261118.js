
(function(){
'use strict';
if(window.__gmMeDashboardV1)return;
window.__gmMeDashboardV1=true;

var app=null,data={sales:[],clients:[],settings:{monthlySalesTarget:5000000,monthlyCommissionTarget:0}},revision=0,period='',active='overview',saving=false;
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
function saleStatusClass(s){s=String(s||'').toLowerCase();if(s.includes('cancel')||s.includes('inad'))return 'bad';if(s.includes('contempl')||s.includes('receb'))return 'ok';return 'warn'}
function clientStatusClass(s){s=String(s||'').toLowerCase();if(s.includes('cancel')||s.includes('perd'))return 'bad';if(s.includes('contempl')||s.includes('ativo')||s.includes('cliente'))return 'ok';return 'warn'}
function toast(msg,isError){var e=document.getElementById('gmMeToast');if(!e)return;e.textContent=msg;e.classList.toggle('error',!!isError);e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('show')},3200)}
function setLoading(v){if(app)app.classList.toggle('gm-me-loading',!!v)}
function api(url,opt){opt=opt||{};opt.credentials='same-origin';opt.cache='no-store';opt.headers=Object.assign({'content-type':'application/json'},opt.headers||{});return fetch(url,opt).then(async function(r){var b={};try{b=await r.json()}catch(e){}if(!r.ok)throw new Error(b.error||'Não foi possível concluir a operação.');return b})}
function normalize(){
 if(!Array.isArray(data.sales))data.sales=[];
 if(!Array.isArray(data.clients))data.clients=[];
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
 var sales=filteredSales(),sold=sales.reduce(function(a,s){return a+num(s.credit)},0),expected=sales.reduce(function(a,s){return a+num(s.commissionExpected)},0),received=sales.reduce(function(a,s){return a+num(s.commissionReceived)},0),qty=sales.reduce(function(a,s){return a+Math.max(1,num(s.qty)||1)},0);
 return {sales:sales,sold:sold,expected:expected,received:received,qty:qty,ticket:sales.length?sold/sales.length:0,clients:data.clients.length};
}
function monthSeries(){
 var now=new Date(),out=[];
 for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');out.push({m:m,total:data.sales.filter(function(s){return monthOf(s.date)===m}).reduce(function(a,s){return a+num(s.credit)},0)})}
 return out;
}
function renderOverview(){
 var m=metrics(),target=num(data.settings.monthlySalesTarget),ctarget=num(data.settings.monthlyCommissionTarget);
 document.getElementById('gmMeKpis').innerHTML=[
  ['VOLUME VENDIDO',brl.format(m.sold),m.sales.length+' venda'+(m.sales.length===1?'':'s')],
  ['COMISSÃO PREVISTA',brl2.format(m.expected),'no período selecionado'],
  ['COMISSÃO RECEBIDA',brl2.format(m.received),m.expected?Math.min(100,m.received/m.expected*100).toFixed(0)+'% da prevista':'sem previsão informada'],
  ['CLIENTES NA BASE',String(m.clients),'carteira pessoal'],
  ['TICKET MÉDIO',brl.format(m.ticket),'por venda'],
  ['COTAS',String(m.qty),'volume de cotas']
 ].map(function(x){return '<article class="gm-me-kpi"><small>'+x[0]+'</small><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></article>'}).join('');
 var salePct=target?Math.min(100,m.sold/target*100):0,comPct=ctarget?Math.min(100,m.expected/ctarget*100):0;
 document.getElementById('gmMeGoals').innerHTML=
  '<div class="gm-me-progress-item"><div class="gm-me-progress-label"><span>Meta de vendas</span><b>'+(target?brl.format(m.sold)+' / '+brl.format(target):'Defina sua meta')+'</b></div><div class="gm-me-track"><i style="width:'+salePct+'%"></i></div></div>'+
  '<div class="gm-me-progress-item"><div class="gm-me-progress-label"><span>Meta de comissão</span><b>'+(ctarget?brl2.format(m.expected)+' / '+brl2.format(ctarget):'Defina sua meta')+'</b></div><div class="gm-me-track"><i style="width:'+comPct+'%"></i></div></div>';
 var series=monthSeries(),max=Math.max(1,...series.map(function(x){return x.total}));
 document.getElementById('gmMeChart').innerHTML=series.map(function(x){
   var h=Math.max(3,x.total/max*155),p=x.m.split('-');
   return '<div class="gm-me-bar-wrap" title="'+esc(monthLabel(x.m))+' • '+esc(brl.format(x.total))+'"><span class="gm-me-bar-value">'+(x.total?esc((x.total/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'M'):'0')+'</span><i class="gm-me-bar" style="height:'+h+'px"></i><span class="gm-me-bar-label">'+p[1]+'/'+p[0].slice(2)+'</span></div>';
 }).join('');
 var recent=filteredSales().slice(0,6);
 document.getElementById('gmMeRecent').innerHTML=recent.length?recent.map(function(s){return '<div class="gm-me-list-row"><div><strong>'+esc(s.clientName||'Venda própria')+'</strong><small>'+esc(dateLabel(s.date))+' · '+esc(s.product||'Produto')+'</small></div><b>'+esc(brl.format(num(s.credit)))+'</b></div>'}).join(''):'<div class="gm-me-empty">Nenhuma venda registrada neste período.</div>';
}
function renderSales(){
 var rows=filteredSales();
 document.getElementById('gmMeSalesBody').innerHTML=rows.length?rows.map(function(s){
  return '<tr>'+
   '<td>'+esc(dateLabel(s.date))+'</td>'+
   '<td><strong>'+esc(s.clientName||'Cliente não informado')+'</strong>'+(s.sourceId?'<div class="muted">Sincronizada</div>':'')+'</td>'+
   '<td>'+esc(s.product||'—')+'</td>'+
   '<td class="money">'+esc(brl2.format(num(s.credit)))+'</td>'+
   '<td>'+esc(String(s.qty||1))+'</td>'+
   '<td class="money">'+esc(brl2.format(num(s.commissionExpected)))+'</td>'+
   '<td class="money">'+esc(brl2.format(num(s.commissionReceived)))+'</td>'+
   '<td><span class="gm-me-chip '+saleStatusClass(s.status)+'">'+esc(s.status||'Ativa')+'</span></td>'+
   '<td><div class="gm-me-actions"><button class="gm-me-icon-btn" data-edit-sale="'+esc(s.id)+'">Editar</button><button class="gm-me-icon-btn" data-del-sale="'+esc(s.id)+'">Excluir</button></div></td>'+
  '</tr>';
 }).join(''):'<tr><td colspan="9"><div class="gm-me-empty">Nenhuma venda cadastrada.</div></td></tr>';
}
function renderClients(){
 var rows=filteredClients();
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
 var rows={};
 data.sales.forEach(function(s){var m=monthOf(s.date)||'Sem data';if(!rows[m])rows[m]={expected:0,received:0,sales:0};rows[m].expected+=num(s.commissionExpected);rows[m].received+=num(s.commissionReceived);rows[m].sales+=1});
 var list=Object.keys(rows).sort().reverse(),totE=data.sales.reduce(function(a,s){return a+num(s.commissionExpected)},0),totR=data.sales.reduce(function(a,s){return a+num(s.commissionReceived)},0);
 document.getElementById('gmMeCommissionSummary').innerHTML=
  '<article class="gm-me-summary"><small>Comissão prevista</small><b>'+esc(brl2.format(totE))+'</b></article>'+
  '<article class="gm-me-summary"><small>Comissão recebida</small><b>'+esc(brl2.format(totR))+'</b></article>'+
  '<article class="gm-me-summary"><small>A receber</small><b>'+esc(brl2.format(Math.max(0,totE-totR)))+'</b></article>';
 document.getElementById('gmMeCommissionBody').innerHTML=list.length?list.map(function(k){var x=rows[k];return '<tr><td>'+esc(monthLabel(k))+'</td><td>'+x.sales+'</td><td class="money">'+esc(brl2.format(x.expected))+'</td><td class="money">'+esc(brl2.format(x.received))+'</td><td class="money">'+esc(brl2.format(Math.max(0,x.expected-x.received)))+'</td><td>'+(x.expected?Math.min(100,x.received/x.expected*100).toFixed(0):0)+'%</td></tr>'}).join(''):'<tr><td colspan="6"><div class="gm-me-empty">Sem dados de comissão.</div></td></tr>';
}
function renderSettings(){
 var a=document.getElementById('gmMeSalesTarget'),b=document.getElementById('gmMeCommissionTarget');if(a)a.value=num(data.settings.monthlySalesTarget)||'';if(b)b.value=num(data.settings.monthlyCommissionTarget)||'';
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
  body.innerHTML='<form id="gmMeForm" data-type="sale" data-id="'+esc(item.id||'')+'"><div class="gm-me-form-grid">'+
   '<div class="gm-me-field"><label>Data</label><input class="gm-me-input" name="date" type="date" required value="'+esc(item.date||today())+'"></div>'+
   '<div class="gm-me-field"><label>Cliente</label><input class="gm-me-input" name="clientName" placeholder="Nome do cliente" value="'+esc(item.clientName||'')+'"></div>'+
   '<div class="gm-me-field"><label>Produto</label><select class="gm-me-select" name="product"><option '+(item.product==='Lar'?'selected':'')+'>Lar</option><option '+(item.product==='Motors'?'selected':'')+'>Motors</option><option '+(item.product==='Outro'?'selected':'')+'>Outro</option></select></div>'+
   '<div class="gm-me-field"><label>Crédito vendido</label><input class="gm-me-input" name="credit" type="number" min="0" step="0.01" required value="'+esc(num(item.credit)||'')+'"></div>'+
   '<div class="gm-me-field"><label>Quantidade de cotas</label><input class="gm-me-input" name="qty" type="number" min="1" step="1" value="'+esc(Math.max(1,num(item.qty)||1))+'"></div>'+
   '<div class="gm-me-field"><label>Status</label><select class="gm-me-select" name="status"><option '+(item.status==='Ativa'?'selected':'')+'>Ativa</option><option '+(item.status==='Contemplada'?'selected':'')+'>Contemplada</option><option '+(item.status==='Cancelada'?'selected':'')+'>Cancelada</option></select></div>'+
   '<div class="gm-me-field"><label>Comissão prevista (R$)</label><input class="gm-me-input" name="commissionExpected" type="number" min="0" step="0.01" value="'+esc(num(item.commissionExpected)||'')+'"></div>'+
   '<div class="gm-me-field"><label>Comissão recebida (R$)</label><input class="gm-me-input" name="commissionReceived" type="number" min="0" step="0.01" value="'+esc(num(item.commissionReceived)||'')+'"></div>'+
   '<div class="gm-me-field full"><label>Observação</label><textarea class="gm-me-textarea" name="note" placeholder="Informações importantes da venda">'+esc(item.note||'')+'</textarea></div>'+
   '</div><div class="gm-me-modal-actions"><button type="button" class="gm-me-btn ghost" data-close-modal>Cancelar</button><button type="submit" class="gm-me-btn primary">Salvar venda</button></div></form>';
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
  obj.id=editId||id();obj.credit=Math.max(0,num(obj.credit));obj.qty=Math.max(1,Math.round(num(obj.qty)||1));obj.commissionExpected=Math.max(0,num(obj.commissionExpected));obj.commissionReceived=Math.max(0,num(obj.commissionReceived));
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
    if(found.credit!==nextCredit||found.qty!==nextQty||found.date!==nextDate||found.product!==product){found.credit=nextCredit;found.qty=nextQty;found.date=nextDate;found.product=product;updated++}
   }else{
    data.sales.push({id:id(),sourceId:sourceId,date:x.date||today(),clientName:'',product:product,credit:Math.max(0,num(x.amount)),qty:Math.max(1,Math.round(num(x.qty)||1)),status:'Ativa',commissionExpected:0,commissionReceived:0,note:String(x.note||'')});added++;
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
   '<section class="gm-me-view active" id="gmMeView-overview"><div class="gm-me-kpis" id="gmMeKpis"></div><div class="gm-me-grid"><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Evolução das vendas</h2><p>Últimos 12 meses da sua produção própria</p></div></div><div class="gm-me-chart" id="gmMeChart"></div></article><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Ritmo das metas</h2><p>Acompanhamento do período selecionado</p></div></div><div id="gmMeGoals"></div><button class="gm-me-btn ghost" data-open-tab="goals">Ajustar metas</button></article></div><div class="gm-me-grid"><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Vendas recentes</h2><p>Últimos lançamentos do período</p></div><button class="gm-me-btn ghost" data-open-tab="sales">Ver todas</button></div><div class="gm-me-list" id="gmMeRecent"></div></article><article class="gm-me-card"><div class="gm-me-card-head"><div><h2>Base pessoal</h2><p>Informações privadas, separadas da gestão</p></div></div><div class="gm-me-note">A aba <strong>EU</strong> é exclusiva do perfil Gestor. Vendas podem ser sincronizadas com o dashboard principal e enriquecidas aqui com cliente e comissão, sem expor sua carteira aos demais acessos.</div></article></div></section>'+
   '<section class="gm-me-view" id="gmMeView-sales"><div class="gm-me-section-head"><div><h2>Minhas Vendas</h2><p>Controle completo da sua produção própria.</p></div><button class="gm-me-btn primary" data-add-sale>+ Nova venda</button></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Data</th><th>Cliente</th><th>Produto</th><th>Crédito</th><th>Cotas</th><th>Comissão prevista</th><th>Recebida</th><th>Status</th><th>Ações</th></tr></thead><tbody id="gmMeSalesBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-commission"><div class="gm-me-section-head"><div><h2>Comissões</h2><p>Previsto, recebido e valores ainda a receber.</p></div></div><div class="gm-me-summary-grid" id="gmMeCommissionSummary"></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Mês</th><th>Vendas</th><th>Prevista</th><th>Recebida</th><th>A receber</th><th>Recebimento</th></tr></thead><tbody id="gmMeCommissionBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-clients"><div class="gm-me-section-head"><div><h2>Meus Clientes</h2><p>Carteira, próximos contatos e acompanhamento.</p></div><button class="gm-me-btn primary" data-add-client>+ Novo cliente</button></div><div class="gm-me-table-wrap"><table class="gm-me-table"><thead><tr><th>Cliente</th><th>WhatsApp</th><th>Produto</th><th>Crédito</th><th>Status</th><th>Próximo contato</th><th>Observação</th><th>Ações</th></tr></thead><tbody id="gmMeClientsBody"></tbody></table></div></section>'+
   '<section class="gm-me-view" id="gmMeView-goals"><div class="gm-me-section-head"><div><h2>Metas pessoais</h2><p>Defina os objetivos que serão usados no seu painel.</p></div></div><article class="gm-me-card"><div class="gm-me-settings"><div class="gm-me-field"><label>Meta mensal de vendas (R$)</label><input class="gm-me-input" id="gmMeSalesTarget" type="number" min="0" step="1000"></div><div class="gm-me-field"><label>Meta mensal de comissão (R$)</label><input class="gm-me-input" id="gmMeCommissionTarget" type="number" min="0" step="100"></div></div><div class="gm-me-modal-actions"><button class="gm-me-btn primary" id="gmMeSaveGoals">Salvar metas</button></div></article></section>'+
  '</main>'+
 '</div>'+
 '<div class="gm-me-modal" id="gmMeModal"><div class="gm-me-modal-card"><div class="gm-me-modal-head"><h3 id="gmMeModalTitle"></h3><button type="button" class="gm-me-btn gm-me-close" data-close-modal>×</button></div><div id="gmMeModalBody"></div></div></div>'+
 '<div class="gm-me-toast" id="gmMeToast" role="status" aria-live="polite"></div>';
 document.body.appendChild(app);
 var sel=document.getElementById('gmMePeriod');sel.innerHTML='<option value="">Todos os períodos</option>';
 var now=new Date();
 for(var i=0;i<36;i++){var d=new Date(now.getFullYear(),now.getMonth()-i,1),m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),o=document.createElement('option');o.value=m;o.textContent=monthLabel(m);sel.appendChild(o)}
 period=currentMonth();sel.value=period;
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
 sel.addEventListener('change',function(){period=sel.value;render()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&app.classList.contains('open')){if(document.getElementById('gmMeModal').classList.contains('open'))closeModal();else close()}});
}
function load(){
 setLoading(true);
 return api('/api/me').then(function(r){data=r.data||data;revision=r.revision||0;normalize();render()}).catch(function(e){toast(e.message,true)}).finally(function(){setLoading(false)})
}
function open(){build();app.classList.add('open');app.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';load()}
function close(){if(!app)return;app.classList.remove('open');app.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function installNav(){
 if(document.getElementById('gmMeNav'))return;
 var nav=document.querySelector('.sidebar nav')||document.querySelector('.sidebar .nav')||document.querySelector('aside nav')||document.querySelector('aside .nav');
 if(!nav)return;
 var template=nav.querySelector('button,a,[role="button"]');
 var b;
 if(template){
   b=template.cloneNode(true);
   b.removeAttribute('id');
   b.querySelectorAll('[id]').forEach(function(el){el.removeAttribute('id')});
   Array.from(b.attributes||[]).forEach(function(attr){
     if(/^data-(view|target|page|section|tab)$/i.test(attr.name))b.removeAttribute(attr.name);
   });
   b.querySelectorAll('[data-view],[data-target],[data-page],[data-section],[data-tab]').forEach(function(el){
     el.removeAttribute('data-view');el.removeAttribute('data-target');el.removeAttribute('data-page');el.removeAttribute('data-section');el.removeAttribute('data-tab');
   });
   var textNodes=[];
   (function walk(n){Array.from(n.childNodes||[]).forEach(function(ch){if(ch.nodeType===3&&ch.nodeValue.trim())textNodes.push(ch);else if(ch.nodeType===1)walk(ch)})})(b);
   if(textNodes.length){textNodes[textNodes.length-1].nodeValue=' EU';}
   else {
     var label=b.querySelector('span,strong,b')||b;
     if(label===b)b.textContent='EU';else label.textContent='EU';
   }
 }else{
   b=document.createElement('button');
   b.type='button';
   b.textContent='EU';
 }
 b.id='gmMeNav';
 b.type='button';
 b.setAttribute('aria-label','EU · Painel Pessoal');
 b.title='EU · Painel Pessoal';
 b.classList.remove('active','selected','current');
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();open()});
 nav.appendChild(b);
}
async function boot(){
 try{var r=await api('/api/session');if(r.role!=='gestor')return}catch(e){return}
 var link=document.createElement('link');link.rel='stylesheet';link.href='/me-dashboard-20261118.css?v=2';document.head.appendChild(link);
 build();installNav();setInterval(installNav,1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
