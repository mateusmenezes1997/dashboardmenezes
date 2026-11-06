import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
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
 const manual=Math.max(0,total-lar-motors);
 const existing=state.sales.some(s=>s.id===MATEUS_MANUAL_ID);
 if(manual<=0&&!existing)return doc;
 consultant.monthOpenings['2026-11']={...opening,total:lar+motors,unclassifiedQty:0};
 if(!existing&&manual>0){
  const qty=Math.max(1,Math.round(Number(opening.unclassifiedQty)||1));
  state.sales.unshift({id:MATEUS_MANUAL_ID,consultantId:'mateus',product:'nao_definido',amount:manual,qty,date:'2026-11-06'});
 }
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
export default async function handler(req,res){
 if(!configured())return json(res,503,{error:'Servidor ainda não configurado'});
 const user=session(req);if(!user)return json(res,401,{error:'Faça login para continuar'});
 try{
  if(req.method==='GET'){const doc=await current();return json(res,200,{state:doc?.state||null,revision:doc?.revision||0})}
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido'});
  if(req.body?.action==='addSale'){
   if(!['gestor','trainee'].includes(user.role))return json(res,403,{error:'Sem permissão para cadastrar vendas'});
   const sale=req.body.sale;
   for(let attempt=0;attempt<3;attempt++){
    const doc=await currentForWrite();
    if(!doc)return json(res,409,{error:'O gestor precisa importar a base inicial antes de cadastrar vendas'});
    const cids=new Set((doc.state.consultants||[]).map(c=>c.id));
    if(!saleOK(sale,cids))return json(res,400,{error:'Venda inválida'});
    if((doc.state.sales||[]).some(s=>s.id===sale.id))return json(res,409,{error:'Venda já cadastrada'});
    const updated={...doc.state,sales:[...(doc.state.sales||[]),sale]};
    const next={revision:doc.revision+1,state:updated};
    try{await write(next,doc.etag);return json(res,200,{...next,ok:true})}
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
    const updated={...doc.state,sales:doc.state.sales.filter(s=>s.id!==id)};
    const next={revision:doc.revision+1,state:updated};
    try{await write(next,doc.etag);return json(res,200,{...next,ok:true})}
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
   await write({revision:1,state:s});return json(res,200,{revision:1,state:s,ok:true});
  }
  if(req.body?.action==='replace'){
   if(!doc)return json(res,409,{error:'Inicialize a base antes de editar'});
   if(req.body.revision!==doc.revision)return json(res,409,{error:'A base foi atualizada por outra pessoa. Atualize a página antes de editar.'});
   const s=req.body.state;
   if(!s||!Array.isArray(s.consultants)||!Array.isArray(s.sales)||!s.settings)return json(res,400,{error:'Dados inválidos'});
   const next={revision:doc.revision+1,state:s};await write(next,doc.etag);return json(res,200,{...next,ok:true});
  }
  return json(res,400,{error:'Operação não reconhecida'});
 }catch(e){
  console.error('State API',e);
  return json(res,conflict(e)?409:500,{error:conflict(e)?'A base mudou durante a gravação. Atualize a página e confira os lançamentos antes de tentar novamente.':'Erro ao acessar armazenamento compartilhado'});
 }
}
