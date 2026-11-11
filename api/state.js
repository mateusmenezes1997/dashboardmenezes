import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
import crypto from 'node:crypto';
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

 // Qualquer valor lançado manualmente para o Mateus em novembro vira uma venda
 // individual real no estado entregue ao dashboard. Assim ele aparece em
 // "Últimas vitórias" e pode ser excluído pelo mesmo botão das demais vendas.
 if(!existing&&total>0){
  const product=lar>0&&motors<=0?'lar':motors>0&&lar<=0?'motors':'nao_definido';
  const qty=Math.max(1,Math.round(
   (Number(opening.larQty)||0)+(Number(opening.motorsQty)||0)+(Number(opening.unclassifiedQty)||0)
  )||1);
  state.sales.unshift({id:MATEUS_MANUAL_ID,consultantId:'mateus',product,amount:total,qty,date:'2026-11-06'});
 }
 consultant.monthOpenings['2026-11']={
  ...opening,total:0,lar:0,motors:0,larQty:0,motorsQty:0,unclassifiedQty:0
 };
 return doc;
}
async function current(){
 const blob=await get(PATH,{access:'private',useCache:false});
 if(!blob?.stream)return null;
 const text=await new Response(blob.stream).text();
 return materializeMateusManual({...JSON.parse(text),etag:blob.blob.etag});
}
// A blob read's response ETag can differ from metadata returned by head().
// For writes, use the storage metadata ETag and ensure no update occurred
// while fetching the uncached document. This avoids false CAS failures.
async function currentForWrite(){
 for(let attempt=0;attempt<4;attempt++){
  const before=await head(PATH);
  if(!before)return null;
  const doc=await current();
  if(!doc)return null;
  const after=await head(PATH);
  if(before.etag===after.etag)return {...doc,etag:after.etag};
  console.warn('Blob changed during read; retrying stable read', {attempt});
 }
 return null;
}
async function write(doc,etag){
 await put(PATH,JSON.stringify(doc),{...(etag?{ifMatch:etag}:{}),access:'private',allowOverwrite:true,contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60});
}
function saleOK(s,cids){return s&&typeof s.id==='string'&&typeof s.consultantId==='string'&&cids.has(s.consultantId)&&['Lar','Motors','lar','motors','nao_definido'].includes(s.product)&&Number.isFinite(Number(s.amount))&&Number(s.amount)>0&&Number.isInteger(Number(s.qty))&&Number(s.qty)>0&&/^\d{4}-\d{2}-\d{2}$/.test(s.date)}
function conflict(e){return e instanceof BlobPreconditionFailedError||e?.name==='BlobPreconditionFailedError'}
function withAudit(nextState,currentDoc,actor,action,details={}){
 const before=Array.isArray(currentDoc?.state?.auditTrail)?currentDoc.state.auditTrail:[];
 const entry={id:crypto.randomUUID(),at:new Date().toISOString(),actor:actor.role,action,details};
 return {...nextState,auditTrail:[...before.slice(-79),entry]};
}
function limitedState(state,user){
 if(!state||user.role==='gestor')return state;
 const {auditTrail,...visible}=state;
 return visible;
}
export default async function handler(req,res){
 if(!configured())return json(res,503,{error:'Servidor ainda não configurado'});
 const user=session(req);if(!user)return json(res,401,{error:'Faça login para continuar'});
 try{
  if(req.method==='GET'){const doc=await current();return json(res,200,{state:limitedState(doc?.state||null,user),revision:doc?.revision||0})}
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido'});
  if(req.body?.action==='addSale'){
   if(!['gestor','trainee'].includes(user.role))return json(res,403,{error:'Sem permissão para cadastrar vendas'});
   const sale=req.body.sale;
   for(let attempt=0;attempt<3;attempt++){
    const doc=await currentForWrite();
    if(!doc)return json(res,409,{error:'O gestor precisa importar a base inicial antes de cadastrar vendas'});
    const cids=new Set((doc.state.consultants||[]).map(c=>c.id));
    if(!saleOK(sale,cids))return json(res,400,{error:'Venda inválida'});
    const existing=(doc.state.sales||[]).find(s=>s.id===sale.id);
    if(existing){
     const same=['consultantId','product','date'].every(key=>existing[key]===sale[key])&&Number(existing.amount)===Number(sale.amount)&&Number(existing.qty)===Number(sale.qty)&&String(existing.note||'')===String(sale.note||'');
     if(!same)return json(res,409,{error:'Identificador já usado em outra venda'});
     return json(res,200,{state:limitedState(doc.state,user),revision:doc.revision,ok:true});
    }
    // A mesma ação pode chegar com outro UUID por clique duplo, nova aba ou retry.
    // Bloqueamos apenas duplicações idênticas e recentes, preservando vendas legítimas.
    const duplicate=(doc.state.sales||[]).find(s=>{
     const recorded=Date.parse(s.createdAt||'');
     if(!Number.isFinite(recorded)||Date.now()-recorded<0||Date.now()-recorded>90000)return false;
     return s.consultantId===sale.consultantId&&s.product===sale.product&&s.date===sale.date&&
       Math.abs(Number(s.amount)-Number(sale.amount))<0.01&&Number(s.qty)===Number(sale.qty)&&
       String(s.note||'').trim()===String(sale.note||'').trim();
    });
    if(duplicate)return json(res,200,{state:limitedState(doc.state,user),revision:doc.revision,ok:true,duplicate:true,existingSaleId:duplicate.id});
    const safeSale={...sale,createdAt:new Date().toISOString()};
    const updated=withAudit({...doc.state,sales:[...(doc.state.sales||[]),safeSale]},doc,user,'VENDA_CRIADA',{consultantId:sale.consultantId,saleId:sale.id,amount:Number(sale.amount)});
    const next={revision:doc.revision+1,state:updated};
    try{await write(next,doc.etag);return json(res,200,{...next,state:limitedState(next.state,user),ok:true})}
    catch(e){if(!conflict(e))throw e;console.warn('Blob conditional write conflict; retrying', {attempt})}
   }
   return json(res,409,{error:'Os dados foram modificados durante o lançamento. Atualize a página e confira se a venda foi registrada antes de tentar novamente.'});
  }
  if(req.body?.action==='deleteSale'){
   if(!['gestor','trainee'].includes(user.role))return json(res,403,{error:'Sem permissão para excluir vendas'});
   const id=req.body.saleId;
   if(typeof id!=='string'||!id||id.length>200)return json(res,400,{error:'Identificador de venda inválido'});
   for(let attempt=0;attempt<3;attempt++){
    const doc=await currentForWrite();
    if(!doc)return json(res,409,{error:'Base compartilhada não inicializada'});
    if(!(doc.state.sales||[]).some(s=>s.id===id))return json(res,404,{error:'Venda não encontrada. Atualize a página.'});
    const removed=doc.state.sales.find(s=>s.id===id);
    const updated=withAudit({...doc.state,sales:doc.state.sales.filter(s=>s.id!==id)},doc,user,'VENDA_EXCLUIDA',{consultantId:removed?.consultantId||'',saleId:id,amount:Number(removed?.amount)||0});
    const next={revision:doc.revision+1,state:updated};
    try{await write(next,doc.etag);return json(res,200,{...next,state:limitedState(next.state,user),ok:true})}
    catch(e){if(!conflict(e))throw e;console.warn('Sale delete conflict; retrying',{attempt})}
   }
   return json(res,409,{error:'Os dados mudaram durante a exclusão. Atualize a página.'});
  }
  const doc=await currentForWrite();
  if(user.role!=='gestor')return json(res,403,{error:'Somente o gestor pode editar a base'});
  if(req.body?.action==='initialize'){
   if(doc)return json(res,409,{error:'Base já inicializada'});
   const s=req.body.state;
   if(!s||!Array.isArray(s.consultants)||!Array.isArray(s.sales)||!s.settings)return json(res,400,{error:'Backup inicial inválido'});
   const initialized=withAudit(s,null,user,'BASE_INICIALIZADA');
   await write({revision:1,state:initialized});return json(res,200,{revision:1,state:initialized,ok:true});
  }
  if(req.body?.action==='replace'){
   if(!doc)return json(res,409,{error:'Inicialize a base antes de editar'});
   if(req.body.revision!==doc.revision)return json(res,409,{error:'A base foi atualizada por outra pessoa. Atualize a página antes de editar.'});
   const s=req.body.state;
   if(!s||!Array.isArray(s.consultants)||!Array.isArray(s.sales)||!s.settings)return json(res,400,{error:'Dados inválidos'});
   const action=JSON.stringify(doc.state.settings)!==JSON.stringify(s.settings)?'CONFIGURACOES_ATUALIZADAS':JSON.stringify(doc.state.consultants)!==JSON.stringify(s.consultants)?'EQUIPE_ATUALIZADA':'BASE_ATUALIZADA';
   const next={revision:doc.revision+1,state:withAudit(s,doc,user,action)};await write(next,doc.etag);return json(res,200,{...next,ok:true});
  }
  return json(res,400,{error:'Operação não reconhecida'});
 }catch(e){
  console.error('State API',e);
  return json(res,conflict(e)?409:500,{error:conflict(e)?'A base mudou durante a gravação. Atualize a página e confira os lançamentos antes de tentar novamente.':'Erro ao acessar armazenamento compartilhado'});
 }
}
