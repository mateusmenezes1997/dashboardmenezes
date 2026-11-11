/* Arena Executiva 3.0 — camada visual isolada, sem escrever vendas, login ou agendamentos */
(function(){
'use strict';
if(window.__gmArenaExecutiveV7)return;
window.__gmArenaExecutiveV7=true;
var source=null,ready=false,queued=false;
function byId(id){return document.getElementById(id)}
function text(el,value){if(el)el.textContent=value==null?'':String(value)}
function brl(value){return (Number(value)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0})}
function valueOf(card){return Number(String(card&&card.querySelector('.gmv-champ-total')&&card.querySelector('.gmv-champ-total').textContent||'').replace(/[^\d]/g,''))||0}
function labelOf(card){return String(card&&card.querySelector('.gmv-champ-name')&&card.querySelector('.gmv-champ-name').textContent||'Consultor').trim()}
function getPhoto(consultant){
 var url=String(consultant&&consultant.photo||'').trim();
 return /^(data:image\/(?:png|jpe?g|webp|gif);base64,|https:\/\/|\/(?!\/))/i.test(url)?url:'';
}
function ensure(){
 var arena=byId('gmv-arena');if(!arena)return false;
 arena.classList.add('gmv-v7');
 if(ready)return true;
 var title=arena.querySelector('.gmv-head h1'),kicker=arena.querySelector('.gmv-kicker'),sub=arena.querySelector('.gmv-sub');
 if(title)title.innerHTML='ARENA <em>DOS CAMPEÕES</em>';
 text(kicker,'GESTÃO MENEZES  /  PERFORMANCE AO VIVO');
 text(sub,'Vendas reais, disputas em movimento e conquistas do mês.');
 var stage=arena.querySelector('.gmv-stage'),champions=byId('gmv-champions');
 if(!stage||!champions)return false;
 var top=stage.querySelector('.gmv-stage-top strong'),meta=stage.querySelector('.gmv-stage-top span'),track=stage.querySelector('.gmv-track-label strong'),trackHint=stage.querySelector('.gmv-track-label small');
 text(top,'CORRIDA PELO TOPO');
 text(meta,'COMPETIÇÃO MENSAL  •  DADOS REAIS');
 text(track,'PISTAS DE PERFORMANCE');
 text(trackHint,'Fotos avançam conforme o volume de vendas confirmado');
 var aside=document.createElement('aside');
 aside.className='gmv7-insights';
 aside.setAttribute('aria-label','Destaques da competição');
 aside.innerHTML='<section class="gmv7-insight gmv7-chase"><div class="gmv7-heading"><span class="gmv7-heading-symbol">◎</span><h2>PRÓXIMA ULTRAPASSAGEM</h2></div><p class="gmv7-chase-copy" id="gmv7-chase-copy">Aguardando competidores.</p><div class="gmv7-comparison"><div class="gmv7-compare-row"><span id="gmv7-top-name">—</span><b id="gmv7-top-value">—</b></div><div class="gmv7-mini-bar"><i id="gmv7-top-bar"></i></div><div class="gmv7-compare-row"><span id="gmv7-chaser-name">—</span><b id="gmv7-chaser-value">—</b></div><div class="gmv7-mini-bar is-silver"><i id="gmv7-chaser-bar"></i></div><div class="gmv7-distance"><small>DISTÂNCIA PARA ALCANÇAR</small><strong id="gmv7-distance">—</strong></div></div></section><section class="gmv7-insight gmv7-sale"><div class="gmv7-heading"><span class="gmv7-heading-symbol">✦</span><h2>ÚLTIMA VENDA REGISTRADA</h2></div><div class="gmv7-last-body"><div class="gmv7-last-photo" id="gmv7-last-photo"><span>GM</span></div><div class="gmv7-last-copy"><small>MAIS UMA CONQUISTA</small><strong id="gmv7-last-name">Aguardando nova venda</strong><b id="gmv7-last-amount">—</b><span id="gmv7-last-meta">O próximo destaque pode ser você.</span></div></div></section>';
 champions.insertAdjacentElement('afterend',aside);
 var lower=arena.querySelectorAll('.gmv-lower .gmv-panel');
 if(lower.length>=2){
  var leftTitle=lower[0].querySelector('h2'),rightTitle=lower[1].querySelector('h2'),rightDesc=lower[1].querySelector('.gmv-panel-sub');
  text(leftTitle,'DUELO DO MOMENTO');text(rightTitle,'MOVIMENTAÇÕES DA SEMANA');text(rightDesc,'Vendas e ultrapassagens registradas nesta semana');
 }
 ready=true;return true;
}
function paintChase(){
 var cards=Array.prototype.slice.call(document.querySelectorAll('#gmv-champions .gmv-champion'));
 var a=cards[0],b=cards[1];
 if(!a||!b){
  text(byId('gmv7-chase-copy'),'A disputa começa quando dois consultores registrarem produção no mês.');
  text(byId('gmv7-top-name'),a?labelOf(a):'—');text(byId('gmv7-top-value'),a?brl(valueOf(a)):'—');
  text(byId('gmv7-chaser-name'),'—');text(byId('gmv7-chaser-value'),'—');text(byId('gmv7-distance'),'—');
  byId('gmv7-top-bar').style.width=a?'100%':'0%';byId('gmv7-chaser-bar').style.width='0%';return;
 }
 var first=valueOf(a),second=valueOf(b),gap=Math.max(0,first-second);
 text(byId('gmv7-chase-copy'),gap>0?labelOf(b)+' está a '+brl(gap)+' de alcançar '+labelOf(a)+'.':labelOf(a)+' e '+labelOf(b)+' estão empatados na liderança.');
 text(byId('gmv7-top-name'),labelOf(a));text(byId('gmv7-top-value'),brl(first));
 text(byId('gmv7-chaser-name'),labelOf(b));text(byId('gmv7-chaser-value'),brl(second));
 text(byId('gmv7-distance'),brl(gap));
 byId('gmv7-top-bar').style.width='100%';
 byId('gmv7-chaser-bar').style.width=Math.max(0,Math.min(100,first?100*second/first:0))+'%';
}
function paintLast(){
 var all=source&&Array.isArray(source.sales)?source.sales:[],members=source&&Array.isArray(source.consultants)?source.consultants:[];
 var now=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());
 var monthSales=all.filter(function(s){return String(s.date||'').slice(0,7)===now&&(Number(s.amount)||0)>0});
 var last=monthSales.map(function(s,i){return {sale:s,index:i}}).sort(function(a,b){var d=String(a.sale.date||'').localeCompare(String(b.sale.date||''));return d||a.index-b.index}).pop();
 var holder=byId('gmv7-last-photo');if(holder)holder.replaceChildren();
 if(!last){
  text(byId('gmv7-last-name'),'Aguardando a próxima venda');text(byId('gmv7-last-amount'),'—');
  text(byId('gmv7-last-meta'),'O primeiro lançamento do mês inicia a celebração.');
  if(holder)text(holder,'GM');return;
 }
 var sale=last.sale,person=members.find(function(p){return String(p.id)===String(sale.consultantId)});
 var name=person&&person.name||'Consultor';
 text(byId('gmv7-last-name'),name);
 text(byId('gmv7-last-amount'),brl(sale.amount));
 text(byId('gmv7-last-meta'),String(sale.date||'').split('-').reverse().join('/')+'  •  '+(String(sale.product||'').toLowerCase()==='motors'?'Motors':'Lar / Crédito'));
 if(holder){
  var photo=getPhoto(person);
  if(!photo){var official=document.querySelector('#gmv-champions .gmv-champion[data-id="'+CSS.escape(String(sale.consultantId))+'"] .gmv-portrait img');if(official)photo=getPhoto({photo:official.getAttribute('src')})}
  if(photo){
   var image=document.createElement('img');image.alt='Foto de '+name;image.src=photo;image.loading='lazy';
   image.onerror=function(){if(image.parentNode===holder){holder.textContent=String(name).trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('').toUpperCase()}};
   holder.appendChild(image);
  }else text(holder,String(name).trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('').toUpperCase());
 }
}
function paintWeek(){
 var list=byId('gmv-news'),panel=byId('gmv-notify-panel');
 if(!list||!panel)return;
 var history=Array.prototype.slice.call(panel.querySelectorAll('.gmv-notification-item')).filter(function(el){return el.querySelector('strong')}).slice(0,5);
 list.replaceChildren();
 if(!history.length){var empty=document.createElement('div');empty.className='gmv-empty';empty.textContent='Nenhuma movimentação registrada nesta semana.';list.appendChild(empty);return}
 history.forEach(function(item){
  var line=document.createElement('div'),dot=document.createElement('i'),copy=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');
  line.className='gmv-news-row';dot.className='gmv-news-dot';
  strong.textContent=item.querySelector('strong').textContent;small.textContent=item.querySelector('small')&&item.querySelector('small').textContent||'';
  copy.append(strong,small);line.append(dot,copy);list.appendChild(line);
 });
}
function paint(){
 queued=false;
 if(!ensure())return;
 if(!document.body.classList.contains('gmv-authenticated'))return;
 paintChase();paintLast();paintWeek();
}
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(function(){requestAnimationFrame(paint)});
}
window.addEventListener('gm:performance-state',function(e){source=e.detail; schedule()});
function boot(){if(!ensure())setTimeout(boot,600);else schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.addEventListener('focus',schedule);
})();