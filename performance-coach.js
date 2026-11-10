(function(){
'use strict';
if(window.__gmCoach)return;window.__gmCoach=true;
const M=window.MenezesMetrics,$=id=>document.getElementById(id);
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const pct=n=>Number(n||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const date=x=>x?x.split('-').reverse().join('/'):'Sem lançamento datado';
const monthName=m=>new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-02T12:00:00Z'));
const metric=(label,value,sub='')=>`<div class="gmp-metric"><small>${E(label)}</small><strong>${E(value)}</strong><span>${E(sub)}</span></div>`;
const head=(eyebrow,title,sub='')=>`<div class="gmp-heading"><small>${E(eyebrow)}</small><h3>${E(title)}</h3>${sub?`<p>${E(sub)}</p>`:''}</div>`;
let data=null,scheduled=false,privateData=null,privateLoading=false,privateError='',privateEpoch=0,arenaMode='elite',arenaIndex=0,autoArena=true,arenaTimer=null;
function source(){try{return data||state}catch{return null}}
function allowed(){return $('gmAuth')?.classList.contains('hidden')}
function manager(){return allowed()&&document.body.dataset.role==='manager'}
function mount(id,parent,before){if($(id))return $(id);const el=document.createElement('div');el.id=id;el.className='gmp-panel';while(before&&before.parentNode!==parent)before=before.parentNode;if(before)parent.insertBefore(el,before);else parent.appendChild(el);return el}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})}
function showStatus(id,message){const el=$(id);if(el)el.textContent=message}
function dashboard(s,m){
 const parent=$('dashboard'),box=mount('gmp-dashboard',parent,parent.querySelector('.kpis'));
 const p=M.pace(s,m,Number(s.settings?.teamTarget)||15000000),c=M.comparison(s,m),w=M.weekly(s,m),first=M.firstSales(s,m),record=M.records(s,m).filter(x=>x.record);
 const delta=c.available&&c.cut?`${c.delta>=0?'+':''}${cash(c.delta)}${c.percent===null?'':` (${c.percent>=0?'+':''}${pct(c.percent)})`}`:'Sem base comparável';
 box.innerHTML=head('DIREÇÃO DO MÊS',p.closed?'Fechamento do período':'O próximo resultado começa hoje',monthName(m))+`<div class="gmp-grid gmp-three">${metric('Crédito vendido',cash(p.value),'Saldo importado + lançamentos')}${metric('Falta para a meta',cash(p.gap),'Meta da gestão: '+cash(Number(s.settings?.teamTarget)||15000000))}${metric(p.closed?'Período encerrado':'Ritmo necessário / dia',p.daily===null?'—':cash(p.daily),p.closed?'Consulte o mês atual para o ritmo diário':p.left+' dias corridos, incluindo hoje')}</div><div class="gmp-inline"><div><small>Mesmo período do mês anterior</small><b>${E(delta)}</b><span>Somente lançamentos datados até o dia ${c.cut||'—'}; saldos importados não entram na comparação.</span></div><div><small>Semana · ${date(p.week.start)} a ${date(p.week.end)}</small><b>${cash(p.weekly)} <span>em lançamentos</span></b><span>Referência semanal: ${cash(p.weeklyGoal)} · proporcional aos dias do mês.</span></div></div><div class="gmp-grid gmp-three gmp-wins">${metric('Arrancada da semana',w[0]?.weekly>0?w[0].name:'A primeira venda abre a disputa',w[0]?.weekly>0?cash(w[0].weekly)+' em lançamentos datados':'')}${metric('Primeira venda do mês',first[0]?.name||'Aguardando lançamento identificado',first[0]?cash(first[0].first.amount)+' · '+date(first[0].first.date):'Saldos sem data não são tratados como primeira venda')}${metric('Recorde pessoal',record[0]?.name||'Seu melhor resultado é o próximo alvo',record[0]?cash(record[0].total)+' · superou '+cash(record[0].best):'Comparação com meses anteriores registrados')}</div>`;
 const actions=parent.querySelector('.topbar .actions');
 if(actions&&!$('gmp-export-menu')){const details=document.createElement('details');details.id='gmp-export-menu';details.className='gmp-export';details.innerHTML='<summary>Exportar resultados</summary><div></div>';const contents=details.lastChild;['exportBtn','exportRankCard'].forEach(id=>{if($(id))contents.appendChild($(id))});const label=$('autoRankExport')?.closest('label');if(label)contents.appendChild(label);actions.appendChild(details)}
}
function team(s,m){
 const parent=$('team')?.querySelector('.consultor-main');if(!parent)return;
 const id=$('consultantFocus')?.value,c=s.consultants.find(x=>x.id===id);if(!c)return;
 const box=mount('gmp-personal',parent,parent.children[1]||null),p=M.pace(s,m,5000000,id),record=M.records(s,m).find(x=>x.id===id),hist=M.history(s,m,id),max=Math.max(1,...hist.map(x=>x.total)),streak=M.consistency(s,m,id),first=M.firstSales(s,m).find(x=>x.id===id);
 const next=p.gap===0?'Meta atingida. Busque ampliar seu recorde e apoiar o desenvolvimento da equipe.':p.weekly===0?'Revise as propostas em aberto e combine com seu líder quais clientes serão retomados nesta semana.':`Priorize as negociações mais próximas do fechamento. O ritmo necessário é ${cash(p.daily||0)} por dia para chegar aos R$ 5 milhões.`;
 box.innerHTML=head('PLANO INDIVIDUAL',c.name,'Mês selecionado: '+monthName(m))+`<div class="gmp-grid gmp-three">${metric('Semana registrada',cash(p.weekly),'Referência semanal: '+cash(p.weeklyGoal))}${metric('Melhor mês anterior',record?.hasHistory?cash(record.best):'Sem histórico anterior',record?.record?'Novo recorde pessoal!':record?.hasHistory?'Distância para igualar: '+cash(record.gap):'Seu primeiro resultado cria a referência')}${metric('Ritmo até R$ 5 milhões',p.daily===null?'Mês encerrado':cash(p.daily)+'/dia',p.left?p.left+' dias corridos restantes':'Meta mensal preservada')}</div><div class="gmp-progress" role="meter" aria-label="Avanço da referência semanal" aria-valuenow="${Math.min(100,Math.round(p.weekly/Math.max(1,p.weeklyGoal)*100))}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100,p.weekly/Math.max(1,p.weeklyGoal)*100)}%"></i></div><p class="gmp-note">${date(p.week.start)} a ${date(p.week.end)} · Referência proporcional à meta mensal. Saldos importados não têm alocação semanal.</p><div class="gmp-next"><small>PRÓXIMA AÇÃO SUGERIDA</small><p>${E(p.closed?'Período encerrado. Revise o histórico e selecione o mês atual para planejar a próxima semana.':next)}</p></div><div class="gmp-badges">${first?'<span>◆ Primeira venda do mês registrada</span>':''}${record?.record?'<span>★ Recorde pessoal</span>':''}${streak?`<span>◈ ${streak} semana${streak>1?'s':''} com lançamento</span>`:'<span>Seu próximo lançamento inicia uma sequência</span>'}</div><details class="gmp-details" open><summary>Evolução nos meses registrados</summary><div class="gmp-history">${hist.length?hist.map(x=>`<div><span>${E(monthName(x.month))}</span><div class="gmp-history-track"><i style="width:${x.total/max*100}%"></i></div><b>${cash(x.total)}</b></div>`).join(''):'<p class="gmp-note">Ainda não há histórico registrado.</p>'}</div></details>`;
 setupPrivate(s,id,box);
}
function leaders(s,m){
 const parent=$('leaders');if(!parent)return;
 const box=mount('gmp-leaders',parent,parent.querySelector('#leadersExportArea'));
 box.hidden=!manager();if(!manager()){box.replaceChildren();return}
 const rows=M.leadership(s,m),w=M.week(m);
 box.innerHTML=head('DESENVOLVIMENTO DA EQUIPE','Quem está fazendo a equipe crescer?','Participação, distribuição da produção e evolução por liderança.')+`<div class="gmp-leader-grid">${rows.map(r=>`<article class="gmp-leader"><h4>${E(r.leader.name)}</h4><div class="gmp-grid">${metric('Consultores com vendas',r.active+' / '+r.team.length,r.team.length?pct(r.active/r.team.length*100)+' da equipe':'Sem consultores vinculados')}${metric('Média por consultor',cash(r.average),'Produção da equipe, sem o líder')}${metric('Venda própria / estrutura',pct(r.share),'Quanto o resultado depende do líder')}${metric('Semana atual',cash(r.currentWeek),'Semana anterior: '+cash(r.previousWeek))}</div><p class="gmp-note">${r.team.length===0?'Vincule consultores para acompanhar o desenvolvimento.':r.active===r.team.length?'Todos os consultores da equipe têm produção no mês.':(r.team.length-r.active)+' consultor(es) ainda sem produção neste mês. Priorize o acompanhamento.'}</p></article>`).join('')||'<p>Nenhuma liderança cadastrada.</p>'}</div><p class="gmp-note">Semana ${date(w.start)} a ${date(w.end)} comparada aos sete dias anteriores. Semana atual pode estar incompleta; valores semanais incluem apenas lançamentos datados.</p><details class="gmp-details" open><summary>Acompanhamento privado · consultores sem produção ou sem lançamento recente</summary><div class="gmp-table-wrap"><table><thead><tr><th>Consultor</th><th>Liderança</th><th>Última venda datada</th><th>Próxima ação combinada</th></tr></thead><tbody>${attentionRows(s,m,rows)}</tbody></table></div></details>`;
}
function attentionRows(s,m,leaders){
 const until=m===M.today().slice(0,7)?M.today():m+'-'+M.days(m),cut=M.shift(until,-7),seen=new Set(),rows=[];
 leaders.forEach(r=>r.team.forEach(c=>{if(seen.has(c.id))return;seen.add(c.id);const last=M.lastSale(s,c.id,until),value=M.total(s,m,c.id);if(value>0&&last&&last>cut)return;const task=privateData?.tasks.find(t=>t.consultantId===c.id&&t.status==='open');rows.push(`<tr><td>${E(c.name)}<small>${cash(value)} no mês</small></td><td>${E(r.leader.name)}</td><td>${E(date(last))}${!last&&value>0?'<small>Há saldo importado sem data.</small>':''}</td><td>${task?E(task.action)+'<small>Até '+date(task.deadline)+'</small>':'Sem compromisso em aberto'}<button class="gmp-text-button" data-person="${E(c.id)}">Acompanhar na Equipe</button></td></tr>`)}));
 return rows.join('')||'<tr><td colspan="4">Nenhum consultor neste critério de acompanhamento.</td></tr>';
}
async function loadPrivate(){
 if(privateLoading||!manager())return;privateLoading=true;const epoch=privateEpoch;privateError='';
 try{const response=await fetch('/api/coaching',{credentials:'same-origin',cache:'no-store'});const result=await response.json();if(!response.ok)throw Error(result.error||'Falha ao carregar');if(epoch!==privateEpoch||!manager())return;privateData=result}
 catch(e){if(epoch===privateEpoch)privateError=e.message}
 finally{if(epoch===privateEpoch){privateLoading=false;renderTasks();if(source())leaders(source(),$('leadersMonthFilter')?.value||$('monthFilter').value)}}
}
function setupPrivate(s,id,after){
 let box=$('gmp-private');
 if(!manager()){box?.remove();return}
 if(!box){box=document.createElement('div');box.id='gmp-private';box.className='gmp-panel';after.after(box);box.innerHTML=head('EXCLUSIVO DO GESTOR','Compromisso da semana','Registro privado de ação, prazo e conclusão. Os demais perfis não acessam essas anotações.')+'<form id="gmp-task-form"><input type="hidden" id="gmp-task-id"><label for="gmp-task-person">Consultor</label><select id="gmp-task-person"></select><label for="gmp-task-action">Ação combinada</label><textarea id="gmp-task-action" maxlength="600" required placeholder="Ex.: retomar três propostas e revisar as objeções com a liderança."></textarea><div class="gmp-form-row"><div><label for="gmp-task-deadline">Prazo</label><input id="gmp-task-deadline" type="date" required></div><div><label for="gmp-task-status">Situação</label><select id="gmp-task-status"><option value="open">Em andamento</option><option value="done">Concluído</option></select></div></div><div class="gmp-buttons"><button type="submit" class="gmp-button" id="gmp-task-save">Salvar compromisso</button><button type="button" class="gmp-button secondary" id="gmp-task-cancel">Novo compromisso</button><button type="button" class="gmp-button secondary" id="gmp-task-reload">Recarregar</button></div><p id="gmp-task-feedback" role="status"></p></form><div id="gmp-task-list"></div>'; $('gmp-task-form').addEventListener('submit',saveTask);$('gmp-task-cancel').onclick=()=>{resetTask();renderTasks()};$('gmp-task-reload').onclick=loadPrivate;
 }
 const sel=$('gmp-task-person');if(sel.dataset.people!==s.consultants.map(c=>c.id+':'+c.name).join('|')){const old=sel.value;sel.innerHTML=s.consultants.filter(c=>c.role!=='gestor').map(c=>`<option value="${E(c.id)}">${E(c.name)}</option>`).join('');sel.value=old||id;sel.dataset.people=s.consultants.map(c=>c.id+':'+c.name).join('|')}
 if(!box.dataset.focus||(box.dataset.focus!==id&&!$('gmp-task-action').value.trim()&&!$('gmp-task-id').value))sel.value=id;
 box.dataset.focus=id;
 if(!privateData&&!privateLoading&&!privateError)loadPrivate();renderTasks();
}
function resetTask(){if(!$('gmp-task-form'))return;$('gmp-task-form').reset();$('gmp-task-id').value='';$('gmp-task-person').value=$('consultantFocus').value;showStatus('gmp-task-feedback','');}
function renderTasks(){
 const list=$('gmp-task-list');if(!list||!manager())return;
 if(!privateData){list.innerHTML=`<p class="gmp-note">${E(privateError||'Carregando compromissos…')}</p>`;return}
 const id=$('consultantFocus')?.value,tasks=privateData.tasks.filter(t=>t.consultantId===id);
 list.innerHTML=`<h4>Compromissos de ${E(source()?.consultants.find(c=>c.id===id)?.name||'consultor')}</h4>`+(tasks.length?tasks.map(t=>`<article class="gmp-task"><span class="gmp-tag">${t.status==='done'?'CONCLUÍDO':t.deadline<M.today()?'PRAZO VENCIDO':'EM ANDAMENTO'}</span><p>${E(t.action)}</p><small>Prazo: ${date(t.deadline)}</small><button class="gmp-text-button" data-task="${E(t.id)}">Editar / atualizar situação</button></article>`).join(''):'<p class="gmp-note">Nenhum compromisso registrado para este consultor.</p>');
}
async function saveTask(event){
 event.preventDefault();if(!manager()||!privateData){showStatus('gmp-task-feedback','Carregue os compromissos antes de salvar.');return}
 const button=$('gmp-task-save'),epoch=privateEpoch;button.disabled=true;showStatus('gmp-task-feedback','Salvando…');
 const task={id:$('gmp-task-id').value||undefined,consultantId:$('gmp-task-person').value,action:$('gmp-task-action').value,deadline:$('gmp-task-deadline').value,status:$('gmp-task-status').value};
 try{const response=await fetch('/api/coaching',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:privateData.revision,task})});const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível salvar');if(epoch!==privateEpoch||!manager())return;privateData=result;resetTask();showStatus('gmp-task-feedback','Compromisso salvo e sincronizado.');renderTasks();leaders(source(),$('leadersMonthFilter')?.value||$('monthFilter').value)}catch(e){if(epoch===privateEpoch)showStatus('gmp-task-feedback',e.message)}finally{button.disabled=false}
}
function commission(s,m){
 const parent=$('commission'),box=mount('gmp-commission',parent,parent.querySelector('.commission-layout')||parent.children[1]);
 if(!box.dataset.ready){box.dataset.ready='1';box.innerHTML=head('COMISSÃO E TEMPO','O que a venda gera e quando pode entrar','Estimativa por parcela. Datas e pagamentos dependem das regras contratuais e da situação do cliente.')+'<div class="gmp-form-row"><div><label for="gmp-commission-person">Produção registrada de</label><select id="gmp-commission-person"></select></div><div><label for="gmp-extra-credit">Nova venda hipotética (R$)</label><input id="gmp-extra-credit" inputmode="decimal" value="100000"></div></div><div id="gmp-commission-summary"></div><details class="gmp-details" open><summary>Linha do tempo da simulação atual</summary><p class="gmp-note">Ordem das parcelas, não datas garantidas de pagamento. Valores líquidos estimados.</p><div id="gmp-timeline" class="gmp-timeline"></div></details>';}
 const sel=$('gmp-commission-person');const old=sel.value||$('consultantFocus')?.value;sel.innerHTML=s.consultants.map(c=>`<option value="${E(c.id)}">${E(c.name)}</option>`).join('');if(s.consultants.some(c=>c.id===old))sel.value=old;
 const parse=v=>{try{return parseNumber(v)}catch{return 0}},credit=parse($('commissionCredit')?.value),condition=$('commissionCondition')?.value||'lar50',calc=M.commission(credit,condition),extra=M.commission(Math.max(0,parse($('gmp-extra-credit').value)),condition);
 $('gmp-commission-summary').innerHTML=`<div class="gmp-grid gmp-three">${metric('Produção registrada · '+monthName(m),cash(M.total(s,m,sel.value)),'Volume vendido; não é comissão paga')}${metric('Simulação atual · líquido total',cash(calc.net),'Distribuído em '+calc.payments.length+' parcelas estimadas')}${metric('Pagamentos confirmados','Não integrados','Nenhum recebimento é presumido')}</div><div class="gmp-next"><small>SE UMA NOVA VENDA FOR FECHADA</small><p>Acrescentaria aproximadamente <strong>${cash(extra.net)}</strong> de comissão líquida total, distribuída em ${extra.payments.length} parcelas. Primeira parcela estimada: <strong>${extra.payments[0].toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong>.</p></div>`;
 $('gmp-timeline').innerHTML=calc.payments.map((value,i)=>`<div><small>PARCELA ${String(i+1).padStart(2,'0')}</small><strong>${value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>`).join('');
 const caption=$('commissionNetCaption');if(caption)caption.textContent='Total líquido estimado desta venda, distribuído ao longo das parcelas; não é recebimento imediato.';
 const monthly=$('commissionMonthlyNet')?.previousElementSibling;if(monthly)monthly.textContent='Líquido total gerado pelas vendas do mês';
 const annual=$('commissionAnnualProjection');if(annual)annual.textContent=annual.textContent.replace('líquidos em 12 meses','líquidos gerados por 12 meses de vendas');
 const goalCopy=parent.querySelector('.commission-goal-copy');if(goalCopy&&!goalCopy.querySelector('.gmp-note')){const note=document.createElement('p');note.className='gmp-note';note.textContent='Comissões geradas, não necessariamente recebidas dentro desses 12 meses. O recebimento segue o parcelamento.';goalCopy.appendChild(note)}
 const details=parent.querySelector('.commission-details-grid')||parent.querySelector('.commission-grid');
 // Keep the existing calculation and explanation nodes intact while reducing clutter.
 if(!$('gmp-commission-details')){const cards=[...parent.querySelectorAll('.commission-card')];const explanations=cards.filter(c=>c.querySelector('.commission-card-head'));if(explanations.length){const d=document.createElement('details');d.id='gmp-commission-details';d.className='gmp-details gmp-panel';d.innerHTML='<summary>Regras, impostos e legendas da simulação</summary>';explanations[0].before(d);explanations.forEach(c=>d.appendChild(c));}}
}
function safePhoto(person){const photo=String(person?.photo||'');return /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(photo)||/^https:\/\//i.test(photo)||/^\/(?!\/)/.test(photo)?photo:''}
function face(person){const src=safePhoto(person);return `<div class="gmp-face">${src?`<img src="${E(src)}" alt="${E(person.name)}">`:`<span>${E(person.name.split(' ').map(x=>x[0]).slice(0,2).join(''))}</span>`}</div>`}
function arena(s){
 if(!$('gmv-arena'))return;const parent=$('gmv-arena').querySelector('.gmv-wrap'),box=mount('gmp-arena',parent,parent.querySelector('.gmv-section-label'));
 box.className='gmp-arena-panel';
 if(!box.dataset.ready){box.dataset.ready='1';box.innerHTML='<div class="gmp-arena-controls" role="group" aria-label="Modos da Arena"><button data-arena-mode="elite">Elite do mês</button><button data-arena-mode="close">Disputas próximas</button><button data-arena-mode="week">Arrancada da semana</button><button data-arena-mode="records">Recordes pessoais</button><button id="gmp-arena-auto" aria-pressed="true">Alternância automática: ligada</button></div><div id="gmp-arena-content" aria-live="off"></div>';autoArena=!window.matchMedia('(max-width:700px), (prefers-reduced-motion:reduce)').matches;$('gmp-arena-auto').onclick=()=>{autoArena=!autoArena;paintArena(source())};}
 paintArena(s);
 if(!arenaTimer)arenaTimer=setInterval(()=>{if(document.hidden||!allowed()||!$('gmv-arena')?.classList.contains('gmv-open')||!autoArena)return;const modes=['elite','close','week','records'];arenaMode=modes[(modes.indexOf(arenaMode)+1)%modes.length];arenaIndex++;paintArena(source())},14000);
}
function paintArena(s){
 if(!s||!$('gmp-arena-content'))return;
 const m=M.today().slice(0,7),content=$('gmp-arena-content'),arena=$('gmv-arena');
 arena.classList.toggle('gmp-alternate',arenaMode!=='elite');
 document.querySelectorAll('[data-arena-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.arenaMode===arenaMode)));
 $('gmp-arena-auto').textContent='Alternância automática: '+(autoArena?'ligada':'desligada');$('gmp-arena-auto').setAttribute('aria-pressed',String(autoArena));
 if(arenaMode==='elite'){content.innerHTML='<p class="gmp-note">Os três maiores volumes do mês. Selecione outro modo para acompanhar novas disputas.</p>';return}
 let body='';
 if(arenaMode==='close'){
  const pairs=M.closePairs(s,m),pair=pairs[arenaIndex%Math.max(1,pairs.length)];
  body=head('DISPUTAS PRÓXIMAS','A próxima posição está ao alcance','Consultores com produção · menor diferença primeiro.');
  body+=pair?`<div class="gmp-faceoff">${[pair.a,pair.b].map((p,i)=>`<article>${face(p)}<small>${pair.position-1+i}º NO MÊS</small><h4>${E(p.name)}</h4><strong>${cash(p.total)}</strong></article>`).join('<span class="gmp-vs">×</span>')}</div><p class="gmp-gap">${E(pair.b.name)} precisa de <strong>${cash(pair.gap)}</strong> para empatar com ${E(pair.a.name)}.</p><div class="gmp-buttons"><button class="gmp-button secondary" id="gmp-next-pair">Próxima disputa</button></div>`:'<p class="gmp-note">Aguardando dois consultores com produção para abrir uma disputa.</p>';
 }else if(arenaMode==='week'){
  const rows=M.weekly(s,m).filter(x=>x.weekly>0).slice(0,6),w=M.week(m),max=Math.max(1,...rows.map(p=>p.weekly));
  body=head('ARRANCADA DA SEMANA','Toda semana abre uma nova disputa',date(w.start)+' a '+date(w.end)+' · somente lançamentos datados');
  body+=rows.length?`<div class="gmp-week-race">${rows.map((p,i)=>`<article>${face(p)}<div><small>${i+1}º NA SEMANA</small><h4>${E(p.name)}</h4><div class="gmp-progress"><i style="width:${p.weekly/max*100}%"></i></div></div><strong>${cash(p.weekly)}</strong></article>`).join('')}</div>`:'<p class="gmp-note">A primeira venda datada desta semana abre a corrida.</p>';
 }else{
  const records=M.records(s,m).filter(p=>p.hasHistory).sort((a,b)=>Number(b.record)-Number(a.record)||a.gap-b.gap).slice(0,6);
  body=head('RECORDE PESSOAL','Sua própria história também merece palco','Comparação com os meses anteriores registrados.');
  body+=records.length?`<div class="gmp-record-grid">${records.map(p=>`<article>${face(p)}<small>${p.record?'NOVO RECORDE':'PRÓXIMO MARCO'}</small><h4>${E(p.name)}</h4><strong>${cash(p.total)}</strong><p>${p.record?'Superou o melhor mês de '+cash(p.best):'Faltam '+cash(p.gap)+' para igualar '+cash(p.best)}</p></article>`).join('')}</div>`:'<p class="gmp-note">Os primeiros meses registrados vão criar a referência para recordes pessoais.</p>';
 }
 content.innerHTML=body;const next=$('gmp-next-pair');if(next)next.onclick=()=>{arenaIndex++;paintArena(source())};
}
function refresh(){
 if(!allowed())return;const s=source();if(!s?.consultants||!$('monthFilter'))return;
 const m=$('monthFilter').value||M.today().slice(0,7);
 dashboard(s,m);team(s,m);leaders(s,$('leadersMonthFilter')?.value||m);commission(s,m);arena(s);
}
function revoke(){privateEpoch++;privateData=null;privateLoading=false;privateError='';$('gmp-private')?.remove();$('gmp-leaders')?.replaceChildren();}
['render','renderTeam','renderLeadersManagement','renderCommissionSimulator'].forEach(name=>{const original=window[name];if(typeof original==='function')window[name]=function(...args){const result=original.apply(this,args);try{data=state}catch{}schedule();return result}});
window.addEventListener('gm:performance-state',event=>{data=event.detail;schedule()});
document.addEventListener('change',e=>{if(e.target.closest('#dashboard,#leaders,#team,#commission'))schedule()});
document.addEventListener('input',e=>{if(['commissionCredit','gmp-extra-credit'].includes(e.target.id))schedule()});
document.addEventListener('click',e=>{
 const mode=e.target.closest('[data-arena-mode]');if(mode){arenaMode=mode.dataset.arenaMode;autoArena=false;paintArena(source())}
 const person=e.target.closest('[data-person]');if(person&&manager()){window.switchView('team');$('consultantFocus').value=person.dataset.person;$('consultantFocus').dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{$('gmp-private')?.scrollIntoView({behavior:'smooth',block:'start'});if($('gmp-task-person'))$('gmp-task-person').value=person.dataset.person},50)}
 const task=e.target.closest('[data-task]');if(task&&manager()){const t=privateData?.tasks.find(x=>x.id===task.dataset.task);if(t){$('gmp-task-id').value=t.id;$('gmp-task-person').value=t.consultantId;$('gmp-task-action').value=t.action;$('gmp-task-deadline').value=t.deadline;$('gmp-task-status').value=t.status;$('gmp-task-action').focus()}}
 if(e.target.closest('[data-view],[data-go],[data-commission-credit]'))schedule();
});
new MutationObserver(()=>{if(!manager())revoke();schedule()}).observe(document.body,{attributes:true,attributeFilter:['data-role']});
if($('gmAuth'))new MutationObserver(()=>{if(!allowed())revoke();schedule()}).observe($('gmAuth'),{attributes:true,attributeFilter:['class']});
window.addEventListener('resize',()=>{if(window.innerWidth<=700){autoArena=false;if(source())paintArena(source())}});
schedule();
})();
