import { validTask } from '../lib/coaching.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ROLES = new Set(['gestor','trainee','consultor']);
const COOKIE = 'gm_session';
const TTL = 43200;
const MAX_BYTES = 1850000;
const MANUAL_ID = 'mateus-manual-2026-11';

function configured(env) {
  return !!(env.DB && env.SESSION_SECRET && env.PASSWORD_GESTOR && env.PASSWORD_TRAINEE && env.PASSWORD_CONSULTOR);
}
function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {status, headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff', ...headers
  }});
}
function b64(bytes) {
  let s='';
  for(const byte of bytes) s+=String.fromCharCode(byte);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64(s) {
  if(!/^[a-zA-Z0-9_-]+$/.test(s) || s.length>1024) return null;
  try {return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));}
  catch {return null;}
}
async function signKey(env) {
  return crypto.subtle.importKey('raw',encoder.encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function makeCookie(role,env) {
  const payload=b64(encoder.encode(JSON.stringify({role,exp:Math.floor(Date.now()/1000)+TTL})));
  const mac=await crypto.subtle.sign('HMAC',await signKey(env),encoder.encode(payload));
  return COOKIE+'='+payload+'.'+b64(new Uint8Array(mac))+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age='+TTL;
}
const clearCookie=COOKIE+'=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
async function session(req,env) {
  if(!env.SESSION_SECRET) return null;
  const entry=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
  if(!entry) return null;
  const val=entry.slice(COOKIE.length+1), pos=val.lastIndexOf('.');
  if(pos<1) return null;
  const payload=val.slice(0,pos), signature=unb64(val.slice(pos+1));
  if(!signature) return null;
  const verified=await crypto.subtle.verify('HMAC',await signKey(env),signature,encoder.encode(payload));
  if(!verified) return null;
  const body=unb64(payload);
  if(!body) return null;
  try {
    const data=JSON.parse(decoder.decode(body));
    return ROLES.has(data.role)&&Number.isFinite(data.exp)&&data.exp>Date.now()/1000 ? data : null;
  } catch {return null;}
}
async function auth(role,password,env) {
  if(!ROLES.has(role)||typeof password!=='string') return false;
  const envName={gestor:'PASSWORD_GESTOR',trainee:'PASSWORD_TRAINEE',consultor:'PASSWORD_CONSULTOR'}[role];
  if(!env[envName]) return false;
  const [a,b]=await Promise.all([
    crypto.subtle.digest('SHA-256',encoder.encode(password)),
    crypto.subtle.digest('SHA-256',encoder.encode(env[envName]))
  ]);
  let diff=0;
  const x=new Uint8Array(a), y=new Uint8Array(b);
  for(let i=0;i<x.length;i++) diff|=x[i]^y[i];
  return diff===0;
}
class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
async function parse(req) {
  if(Number(req.headers.get('content-length')||0)>MAX_IMPORT_BYTES+100000) throw new HttpError(413,'Arquivo grande demais');
  let raw;
  try {raw=await req.text();} catch {throw new HttpError(400,'Não foi possível ler os dados enviados');}
  if(encoder.encode(raw).byteLength>MAX_IMPORT_BYTES+100000) throw new HttpError(413,'Arquivo grande demais');
  try{return JSON.parse(raw);}catch{throw new HttpError(400,'Dados JSON inválidos');}
}
let schemaReady=false;
const MAX_IMPORT_BYTES=15_000_000;
const CHUNK_LENGTH=140_000;
async function schema(env) {
  if(schemaReady||!env.DB) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS app_documents (id TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS app_document_chunks (document_key TEXT NOT NULL, chunk_index INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (document_key, chunk_index))').run();
  schemaReady=true;
}
async function readDoc(env,id) {
  const row=await env.DB.prepare('SELECT revision, data FROM app_documents WHERE id = ?').bind(id).first();
  if(!row) return null;
  const stored=JSON.parse(row.data);
  if(!stored?.__gm_chunks_v1) return {revision:Number(row.revision),...stored};
  const key=stored.__gm_chunks_v1, expected=stored.chunkCount;
  if(typeof key!=='string'||!Number.isInteger(expected)||expected<1||expected>200) throw new HttpError(500,'Documento armazenado inválido');
  const rows=await env.DB.prepare('SELECT chunk_index, data FROM app_document_chunks WHERE document_key=? ORDER BY chunk_index').bind(key).all();
  const chunks=rows.results||[];
  if(chunks.length!==expected||chunks.some((r,i)=>Number(r.chunk_index)!==i)) throw new HttpError(503,'Backup parcialmente armazenado. Nenhum dado foi alterado.');
  return {revision:Number(row.revision),...JSON.parse(chunks.map(x=>x.data).join(''))};
}
async function writeDoc(env,id,data,prev) {
  const raw=JSON.stringify(data);
  if(encoder.encode(raw).byteLength>MAX_IMPORT_BYTES) throw new HttpError(413,'O backup ultrapassa 15 MB. É necessário importar imagens separadamente.');
  const isChunked=raw.length>CHUNK_LENGTH;
  let stored=raw, chunkKey=null;
  if(isChunked) {
    chunkKey=crypto.randomUUID();
    const tasks=[];
    for(let i=0,n=0;i<raw.length;i+=CHUNK_LENGTH,n++) {
      tasks.push(env.DB.prepare('INSERT INTO app_document_chunks (document_key,chunk_index,data) VALUES (?,?,?)').bind(chunkKey,n,raw.slice(i,i+CHUNK_LENGTH)));
    }
    for(let i=0;i<tasks.length;i+=50) await env.DB.batch(tasks.slice(i,i+50));
    stored=JSON.stringify({__gm_chunks_v1:chunkKey,chunkCount:tasks.length});
  }
  let result;
  try {
    if(prev===null) {
      result=await env.DB.prepare('INSERT OR IGNORE INTO app_documents (id, revision, data) VALUES (?, 1, ?)').bind(id,stored).run();
    } else {
      result=await env.DB.prepare('UPDATE app_documents SET revision=revision+1,data=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(stored,id,prev).run();
    }
  } catch(e) {
    if(chunkKey) await env.DB.prepare('DELETE FROM app_document_chunks WHERE document_key=?').bind(chunkKey).run().catch(()=>{});
    throw e;
  }
  const success=result.meta?.changes===1;
  if(!success && chunkKey) await env.DB.prepare('DELETE FROM app_document_chunks WHERE document_key=?').bind(chunkKey).run().catch(()=>{});
  return success;
}
function validState(s) {return !!(s&&Array.isArray(s.consultants)&&Array.isArray(s.sales)&&s.settings&&typeof s.settings==='object');}
function novemberTotal(s) {
  const sales=s.sales.reduce((sum,sale)=>sum+(String(sale.date||'').startsWith('2026-11')?Math.max(0,Number(sale.amount)||0):0),0);
  const openings=s.consultants.reduce((sum,c)=>sum+Math.max(0,Number(c.monthOpenings?.['2026-11']?.total)||0),0);
  return Math.round((sales+openings)*100)/100;
}

function withAudit(s,previous,user,action,details={}) {
  const trail=Array.isArray(previous?.auditTrail)?previous.auditTrail:[];
  return {...s,auditTrail:[...trail.slice(-79),{id:crypto.randomUUID(),at:new Date().toISOString(),actor:user.role,action,details}]};
}
function limited(state,user) {
  if(!state||user.role==='gestor') return state;
  const {auditTrail,...visible}=state;
  return visible;
}
function materialize(doc) {
  if(!doc||!Array.isArray(doc.state?.consultants)||!Array.isArray(doc.state?.sales)) return doc;
  const c=doc.state.consultants.find(x=>x.id==='mateus');
  const opening=c?.monthOpenings?.['2026-11'];
  if(!opening) return doc;
  const total=Math.max(0,Number(opening.total)||0);
  if(total<=0&&!doc.state.sales.some(x=>x.id===MANUAL_ID)) return doc;
  const result=structuredClone(doc);
  const consult=result.state.consultants.find(x=>x.id==='mateus');
  const op=consult.monthOpenings['2026-11'];
  if(total>0&&!result.state.sales.some(x=>x.id===MANUAL_ID)) {
    const lar=Math.max(0,Number(op.lar)||0),motors=Math.max(0,Number(op.motors)||0);
    const qty=Math.max(1,Math.round((Number(op.larQty)||0)+(Number(op.motorsQty)||0)+(Number(op.unclassifiedQty)||0))||1);
    result.state.sales.unshift({id:MANUAL_ID,consultantId:'mateus',product:lar>0&&motors<=0?'lar':motors>0&&lar<=0?'motors':'nao_definido',amount:total,qty,date:'2026-11-06'});
  }
  consult.monthOpenings['2026-11']={...op,total:0,lar:0,motors:0,larQty:0,motorsQty:0,unclassifiedQty:0};
  return result;
}
function saleOK(s,ids) {
  return !!(s&&typeof s.id==='string'&&s.id.length>0&&s.id.length<=200
    &&typeof s.consultantId==='string'&&ids.has(s.consultantId)
    &&['Lar','Motors','lar','motors','nao_definido'].includes(s.product)
    &&Number.isFinite(Number(s.amount))&&Number(s.amount)>0
    &&Number.isInteger(Number(s.qty))&&Number(s.qty)>0
    &&/^\d{4}-\d{2}-\d{2}$/.test(s.date));
}
async function routeSession(req,env) {
  if(req.method==='GET') return json(200,{role:(await session(req,env))?.role||null,configured:configured(env)});
  if(req.method==='DELETE') return json(200,{ok:true},{'set-cookie':clearCookie});
  if(req.method!=='POST') return json(405,{error:'Método não permitido'});
  if(!configured(env)) return json(503,{error:'Servidor ainda não configurado'});
  const data=await parse(req);
  if(!(await auth(data?.role,data?.password,env))) return json(401,{error:'Perfil ou senha incorretos'});
  return json(200,{role:data.role},{'set-cookie':await makeCookie(data.role,env)});
}
async function routeState(req,env) {
  if(!configured(env)) return json(503,{error:'Servidor ainda não configurado'});
  const user=await session(req,env);
  if(!user) return json(401,{error:'Faça login para continuar'});
  if(req.method==='GET') {
    const doc=materialize(await readDoc(env,'state'));
    return json(200,{state:limited(doc?.state||null,user),revision:doc?.revision||0});
  }
  if(req.method!=='POST') return json(405,{error:'Método não permitido'});
  const body=await parse(req);
  if(body?.action==='addSale'||body?.action==='deleteSale') {
    if(!['gestor','trainee'].includes(user.role)) return json(403,{error:'Sem permissão para editar vendas'});
    for(let attempt=0;attempt<3;attempt++) {
      const doc=materialize(await readDoc(env,'state'));
      if(!doc) return json(409,{error:'O gestor precisa importar a base inicial antes de cadastrar vendas'});
      const state=doc.state;
      if(body.action==='addSale') {
        const sale=body.sale, ids=new Set((state.consultants||[]).map(c=>c.id));
        if(!saleOK(sale,ids)) return json(400,{error:'Venda inválida'});
        const existing=(state.sales||[]).find(s=>s.id===sale.id);
        if(existing) {
          const same=['consultantId','product','date'].every(k=>existing[k]===sale[k])
            &&Number(existing.amount)===Number(sale.amount)&&Number(existing.qty)===Number(sale.qty)
            &&String(existing.note||'')===String(sale.note||'');
          return same?json(200,{state:limited(state,user),revision:doc.revision,ok:true}):json(409,{error:'Identificador já usado em outra venda'});
        }
        const duplicate=(state.sales||[]).find(s=>{
          const t=Date.parse(s.createdAt||'');
          return Number.isFinite(t)&&Date.now()-t>=0&&Date.now()-t<=90000
            &&s.consultantId===sale.consultantId&&s.product===sale.product&&s.date===sale.date
            &&Math.abs(Number(s.amount)-Number(sale.amount))<.01&&Number(s.qty)===Number(sale.qty)
            &&String(s.note||'').trim()===String(sale.note||'').trim();
        });
        if(duplicate) return json(200,{state:limited(state,user),revision:doc.revision,ok:true,duplicate:true,existingSaleId:duplicate.id});
        const next=withAudit({...state,sales:[...state.sales,{...sale,createdAt:new Date().toISOString()}]},state,user,'VENDA_CRIADA',{consultantId:sale.consultantId,saleId:sale.id,amount:Number(sale.amount)});
        if(await writeDoc(env,'state',{state:next},doc.revision)) return json(200,{state:limited(next,user),revision:doc.revision+1,ok:true});
      } else {
        const id=body.saleId;
        if(typeof id!=='string'||!id||id.length>200) return json(400,{error:'Identificador de venda inválido'});
        const removed=(state.sales||[]).find(s=>s.id===id);
        if(!removed) return json(404,{error:'Venda não encontrada. Atualize a página.'});
        const next=withAudit({...state,sales:state.sales.filter(s=>s.id!==id)},state,user,'VENDA_EXCLUIDA',{consultantId:removed.consultantId,saleId:id,amount:Number(removed.amount)||0});
        if(await writeDoc(env,'state',{state:next},doc.revision)) return json(200,{state:limited(next,user),revision:doc.revision+1,ok:true});
      }
    }
    return json(409,{error:'A base mudou durante a operação. Atualize e confira antes de tentar novamente.'});
  }
  if(user.role!=='gestor') return json(403,{error:'Somente o gestor pode editar a base'});
  const doc=materialize(await readDoc(env,'state'));
  if(body?.action==='initialize') {
    if(doc) return json(409,{error:'Base já inicializada'});
    if(!validState(body.state)) return json(400,{error:'Backup inicial inválido'});
    const nov=novemberTotal(body.state);
    if(nov<=3300000) return json(422,{error:'Backup desatualizado: a importação exige vendas comprovadas acima de R$ 3,3 milhões em novembro de 2026. Verifique a base antes de continuar.',novemberTotal:nov});
    const state=withAudit(body.state,null,user,'BASE_INICIALIZADA');
    if(!(await writeDoc(env,'state',{state},null))) return json(409,{error:'Base já inicializada'});
    return json(200,{revision:1,state,ok:true});
  }
  if(body?.action==='replace') {
    if(!doc) return json(409,{error:'Inicialize a base antes de editar'});
    if(body.revision!==doc.revision) return json(409,{error:'A base foi atualizada por outra pessoa. Atualize a página antes de editar.'});
    if(!validState(body.state)) return json(400,{error:'Dados inválidos'});
    const action=JSON.stringify(doc.state.settings)!==JSON.stringify(body.state.settings)?'CONFIGURACOES_ATUALIZADAS'
      :JSON.stringify(doc.state.consultants)!==JSON.stringify(body.state.consultants)?'EQUIPE_ATUALIZADA':'BASE_ATUALIZADA';
    const state=withAudit(body.state,doc.state,user,action);
    if(!(await writeDoc(env,'state',{state},doc.revision))) return json(409,{error:'A base mudou durante a edição. Recarregue.'});
    return json(200,{revision:doc.revision+1,state,ok:true});
  }
  return json(400,{error:'Operação não reconhecida'});
}
async function routeCoaching(req,env) {
  if(!configured(env)) return json(503,{error:'Armazenamento indisponível'});
  const user=await session(req,env);
  if(!user) return json(401,{error:'Faça login para continuar'});
  if(user.role!=='gestor') return json(403,{error:'Acompanhamento exclusivo do gestor'});
  if(!['GET','POST'].includes(req.method)) return json(405,{error:'Método não permitido'});
  const original=await readDoc(env,'coaching');
  const doc=original||{revision:0,tasks:[]};
  if(req.method==='GET') return json(200,{revision:doc.revision,tasks:doc.tasks});
  const body=await parse(req);
  if(body?.revision!==doc.revision) return json(409,{error:'Outro acompanhamento foi salvo. Recarregue antes de tentar novamente.'});
  const input=body?.task;
  if(!validTask(input)) return json(400,{error:'Informe consultor, ação, prazo válido e situação.'});
  if(doc.tasks.length>=1000&&!input.id) return json(400,{error:'Limite de acompanhamentos atingido.'});
  if(input.id&&!doc.tasks.some(t=>t.id===input.id)) return json(404,{error:'Compromisso não encontrado'});
  const task={id:input.id||crypto.randomUUID(),consultantId:input.consultantId,action:input.action.trim(),deadline:input.deadline,status:input.status,updatedAt:new Date().toISOString()};
  const tasks=input.id?doc.tasks.map(t=>t.id===input.id?task:t):[task,...doc.tasks];
  if(!(await writeDoc(env,'coaching',{tasks},original?doc.revision:null))) return json(409,{error:'Outro acompanhamento foi salvo. Recarregue antes de tentar novamente.'});
  return json(200,{revision:doc.revision+1,tasks});
}
export default {
  async fetch(req,env) {
    const path=new URL(req.url).pathname;
    if(!path.startsWith('/api/')) {
      const response=await env.ASSETS.fetch(req);
      if(req.method!=='GET'||!response.ok||!(response.headers.get('content-type')||'').includes('text/html')) return response;
      let html=await response.text();
      const premium='<script defer src="/ranking-executivo-20261113.js?v=premium-v4"></script>';
      if(!html.includes('ranking-executivo-20261113.js')) {
        if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,premium+'\n</body>');
        else html+=premium;
      }
      const headers=new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('cache-control','no-store');
      headers.set('x-gm-ranking-version','premium-v4-20261113');
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    }
    try {
      await schema(env);
      if(path==='/api/health'&&req.method==='GET') { const required=['SESSION_SECRET','PASSWORD_GESTOR','PASSWORD_TRAINEE','PASSWORD_CONSULTOR']; const missing=required.filter(key=>!env[key]); return json(200,{ok:true,configured:configured(env),databaseBound:!!env.DB,...(missing.length?{missingConfig:missing}:{})}); }
      if(path==='/api/session') return await routeSession(req,env);
      if(path==='/api/state') return await routeState(req,env);
      if(path==='/api/coaching') return await routeCoaching(req,env);
      return json(404,{error:'Rota não encontrada'});
    } catch(e) {
      if(e instanceof HttpError) return json(e.status,{error:e.message});
      console.error('Dashboard Cloudflare API',path,e);
      return json(500,{error:'Erro interno ao processar a solicitação'});
    }
  }
};