import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
import {configured,json,session} from './_auth.js';
const PATH='gestao-menezes/state-v1.json';
async function current(){
 const blob=await get(PATH,{access:'private',useCache:false});
 if(!blob?.stream)return null;
 const text=await new Response(blob.stream).text();
 return {...JSON.parse(text),etag:blob.blob.etag};
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
    const doc=await current();
    if(!doc)return json(res,409,{error:'O gestor precisa importar a base inicial antes de cadastrar vendas'});
    const cids=new Set((doc.state.consultants||[]).map(c=>c.id));
    if(!saleOK(sale,cids))return json(res,400,{error:'Venda inválida'});
    if((doc.state.sales||[]).some(s=>s.id===sale.id))return json(res,409,{error:'Venda já cadastrada'});
    // Confirm the content read is still the latest version, without overwriting newer writes.
    const latest=await head(PATH);
    if(latest?.etag!==doc.etag)continue;
    const updated={...doc.state,sales:[...(doc.state.sales||[]),sale]};
    const next={revision:doc.revision+1,state:updated};
    try{await write(next,doc.etag);return json(res,200,{...next,ok:true})}
    catch(e){if(!conflict(e))throw e}
   }
   return json(res,409,{error:'Os dados foram modificados durante o lançamento. Atualize a página e confira se a venda foi registrada antes de tentar novamente.'});
  }
  const doc=await current();
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
   const latest=await head(PATH);
   if(latest?.etag!==doc.etag)return json(res,409,{error:'A base mudou durante a edição. Atualize a página e tente novamente.'});
   const next={revision:doc.revision+1,state:s};await write(next,doc.etag);return json(res,200,{...next,ok:true});
  }
  return json(res,400,{error:'Operação não reconhecida'});
 }catch(e){
  console.error('State API',e);
  return json(res,conflict(e)?409:500,{error:conflict(e)?'A base mudou durante a gravação. Atualize a página e confira os lançamentos antes de tentar novamente.':'Erro ao acessar armazenamento compartilhado'});
 }
}
