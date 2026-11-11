import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
import crypto from 'node:crypto';
import {saleOK,distinctSaleIds,sameSale} from '../lib/sales.js';
import {configured,json,session} from './_auth.js';
const PATH='gestao-menezes/state-v1.json';
const MATEUS_MANUAL_ID='mateus-manual-2026-11';
function materializeMateusManual(doc){
 const state=doc?.state;
 if(!state||!Array.isArray(state.consultants)||!Array.isArray(state.sales))return doc;
 const consultant=state.consultants.find(c=>c.id==='mateus');
 const opening=consultant?.monthOpenings?.['2026-11'];
 if(!consultant||!opening)return doc;
 const total=Math.max(0,Number(opening.total)||0);
 const lar=Math.max(0,Number(opening.lar)||0);
 const motors=Math.max(0,Number(opening.motors)||0);
 const existing=state.sales.some(s=>s.id===MATEUS_MANUAL_ID);
 if(total<=0&&!existing)return doc;

 // Qualquer valor lanÃ§ado manualmente para o Mateus em novembro vira uma venda
 // individual real no estado entregue ao dashboard. Assim ele aparece em
 // "Ãšltimas vitÃ³rias" e pode ser excluÃ­do pelo mesmo botÃ£o das demais vendas.
 if(!existing&&total>0){
  const product=lar>0&&motors<=0?'lar':motors>0&&lar<=0?'motors':'nao_definido';
  const qty=Math.max(1,Math.round(
   (Number(opening.larQty)||0)+(Number(opening.motorsQty)||0)+(Number(opening.unclassifiedQty)||0)
  )||1);
  state.sales.unshift({id:MATEUS_MANUAL_ID,consultantId:'mateus',product,amount:total,qty,date:'2026-11-06'});
 }
 consultant.monthOpenings['202¶»§q«^