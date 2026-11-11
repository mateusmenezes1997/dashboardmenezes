/* GestÃ£o Menezes Â· refinamentos 11/11/2026.
   Complemento visual, sem alterar a aba de agendamentos e sem gravar dados. */
(function(){
'use strict';
if(window.__gmRefinement20261111)return;
window.__gmRefinement20261111=true;
var stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';stylesheet.href='/menezes-refinement-20261111.css?v=3';
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
 var host¶»§q«^