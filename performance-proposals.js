(function(){
'use strict';
const $=id=>document.getElementById(id),M=window.MenezesMetrics;
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=x=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),ids=['simProduct','simCredit','simParcel','simBid','simQty','simFreeBid'];
const key='gm-proposals-v1';let saved=[],a=null,b=null;
try{const parsed=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(parsed))saved=parsed.filter(x=>x&&typeof x.id==='string'&&x.fields&&x.values).slice(0,30)}catch{}
const parent=$('simulator');if(!parent)return;
const box=document.createElement('div');box.id='gmp-proposals';box.className='gmp-panel';
box.innerHTML='<div class="gmp-heading"><small>CONVERSA COM O CLIENTE</small><h3>Duas propostas. Uma escolha mais clara.</h3><p>Monte uma opÃ§Ã£o no simulador, capture como A ou B e compare os valores.</p></div><div class="gmp-buttons"><button class="gmp-button" id="gmp-capture-a">Usar atual como A</button><button class="gmp-button secondary" id="gmp-capture-b">Usar atual como B</button></div><div id="gmp-comparison"></div><div class="gmp-form-row"><div><label for="gmp-proposal-label">Nome da proposta</label><input id="gmp-proposal-label" maxlength="80" placeholder="Ex.: ImÃ³vel Â· opÃ§Ã£o de entrada menor"></div><div class="gmp-buttons"><button class="gmp-button" id="gmp-proposal-save">Salvar proposta atual</button></div></div><p class="gmp-note">Propos¶»§q«^