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

function cleanPersonalData(input) {
  if(!input||typeof input!=='object') throw new HttpError(400,'Base pessoal inválida');
  const sales=Array.isArray(input.sales)?input.sales:[];
  const clients=Array.isArray(input.clients)?input.clients:[];
  if(sales.length>5000||clients.length>5000) throw new HttpError(413,'A base pessoal ultrapassou o limite de registros');
  const cleanText=(v,max=500)=>String(v??'').slice(0,max);
  const cleanMoney=v=>Math.max(0,Number(v)||0);
  const allowedConditions=new Set(['motors13','lar100','lar85','lar70','lar50']);
  const outSales=sales.map(s=>{
    if(!s||typeof s.id!=='string'||!s.id||s.id.length>200) throw new HttpError(400,'Há uma venda inválida na base pessoal');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s.date||''))) throw new HttpError(400,'Há uma venda com data inválida');
    const credit=cleanMoney(s.credit);
    const product=cleanText(s.product,60);
    const requested=String(s.condition||'');
    const condition=allowedConditions.has(requested)?requested:(product.toLowerCase().includes('motor')?'motors13':'lar50');
    return {
      id:s.id,
      ...(s.sourceId?{sourceId:cleanText(s.sourceId,200)}:{}),
      date:String(s.date),
      clientName:cleanText(s.clientName,180),
      product,
      condition,
      credit,
      qty:Math.max(1,Math.min(9999,Math.round(Number(s.qty)||1))),
      status:cleanText(s.status,80),
      commissionExpected:Math.round(credit*0.022*100)/100,
      commissionReceived:cleanMoney(s.commissionReceived),
      note:cleanText(s.note,2000)
    };
  });
  const outClients=clients.map(x=>{
    if(!x||typeof x.id!=='string'||!x.id||x.id.length>200) throw new HttpError(400,'Há um cliente inválido na base pessoal');
    const next=String(x.nextContact||'');
    if(next&&!/^\d{4}-\d{2}-\d{2}$/.test(next)) throw new HttpError(400,'Há um próximo contato com data inválida');
    return {
      id:x.id,
      name:cleanText(x.name,180),
      phone:cleanText(x.phone,40),
      product:cleanText(x.product,60),
      credit:cleanMoney(x.credit),
      status:cleanText(x.status,80),
      nextContact:next,
      note:cleanText(x.note,2000)
    };
  });
  const settings=input.settings&&typeof input.settings==='object'?input.settings:{};
  return {
    sales:outSales,
    clients:outClients,
    settings:{
      monthlySalesTarget:cleanMoney(settings.monthlySalesTarget)||5000000,
      monthlyCommissionTarget:cleanMoney(settings.monthlyCommissionTarget)
    },
    updatedAt:new Date().toISOString()
  };
}

const PERSONAL_HISTORICAL_SALES_IMPORT_ID='personal-me-import-20261118-historical-sales-v1';
const PERSONAL_HISTORICAL_SALES=[
  ['2026-02-04','RIO DAS OSTRAS ODONTO',103480.00],
  ['2026-02-04','RIO DAS OSTRAS ODONTO',103480.00],
  ['2026-02-27','PEDRO HENRIQUE BERNARDINO DE SOUZA',141989.01],
  ['2026-04-15','GUSTAVO HENRIQUE FELISBINO',80000.00],
  ['2026-05-31','LUCAS MOLITOR SOUZA PICOLO',100000.00],
  ['2026-06-03','MATHEUS OLIVEIRA PASSIANO',160000.00],
  ['2026-06-18','GABRIEL NASCIMENTO SOUZA',150000.00],
  ['2026-07-07','JULLIA MOREIRA SOUSA PASSIANO',800000.00],
  ['2026-07-15','OSMAR BESSA DA SILVA',80000.00],
  ['2026-08-07','THIAGO HENRIQUE PROTASIO DE OLIVEIRA',200000.00],
  ['2026-09-04','FELIPE FERREIRA HUEMER ULHOA CINTRA',90000.00],
  ['2026-10-13','SERWATH SOLUCOES CONTABEIS',1033203.60],
  ['2026-10-17','MATEUS HENRIQUE SANTOS MENEZES',80000.00],
  ['2026-11-04','MARCO ANTONIO DE PAULA OLIVEIRA',100000.00],
  ['2026-11-09','MAICON PEREIRA FIGUEIREDO',100000.00],
  ['2026-11-11','MATEUS HENRIQUE SANTOS MENEZES',90000.00]
];
function personalSaleImportKey(date,name,credit){
  const normalized=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  return String(date||'')+'|'+normalized+'|'+Math.round((Number(credit)||0)*100);
}
function personalSeedId(date,name,credit,occurrence){
  const slug=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
  return 'me-hist-'+String(date).replace(/-/g,'')+'-'+slug+'-'+Math.round((Number(credit)||0)*100)+'-'+occurrence;
}
async function ensureHistoricalPersonalSales(env){
  const done=await readDoc(env,PERSONAL_HISTORICAL_SALES_IMPORT_ID);
  if(done) return done.result||{added:0,skipped:PERSONAL_HISTORICAL_SALES.length,total:PERSONAL_HISTORICAL_SALES.length};
  const original=await readDoc(env,'personal-me');
  const base=original?.data||{sales:[],clients:[],settings:{monthlySalesTarget:5000000,monthlyCommissionTarget:0}};
  const sales=Array.isArray(base.sales)?base.sales.slice():[];
  const existingCounts=new Map();
  sales.forEach(s=>{
    const k=personalSaleImportKey(s.date,s.clientName,s.credit);
    existingCounts.set(k,(existingCounts.get(k)||0)+1);
  });
  const consumed=new Map();
  let added=0,skipped=0;
  PERSONAL_HISTORICAL_SALES.forEach(([date,clientName,credit])=>{
    const k=personalSaleImportKey(date,clientName,credit);
    const used=consumed.get(k)||0;
    const have=existingCounts.get(k)||0;
    consumed.set(k,used+1);
    if(used<have){skipped++;return;}
    const occurrence=used+1;
    sales.push({
      id:personalSeedId(date,clientName,credit,occurrence),
      date,clientName,product:'Lar',condition:'lar50',credit,qty:1,status:'Ativa',
      commissionExpected:Math.round(credit*0.022*100)/100,commissionReceived:0,
      note:'Venda histórica própria'
    });
    added++;
  });
  const data=cleanPersonalData({...base,sales});
  if(added){
    const ok=await writeDoc(env,'personal-me',{data},original?original.revision:null);
    if(!ok) throw new HttpError(409,'A base pessoal mudou durante a importação histórica. Tente novamente.');
  }
  await writeDoc(env,PERSONAL_HISTORICAL_SALES_IMPORT_ID,{result:{added,skipped,total:PERSONAL_HISTORICAL_SALES.length,importedAt:new Date().toISOString()}},null);
  return {added,skipped,total:PERSONAL_HISTORICAL_SALES.length};
}


const PERSONAL_HISTORICAL_REPAIR_ID='personal-me-reconcile-20261118-v2';
function normalizePersonalClientName(v){
  return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');
}
async function reconcileHistoricalPersonalSales(env){
  const done=await readDoc(env,PERSONAL_HISTORICAL_REPAIR_ID);
  if(done) return done.result||{reconciled:true};
  const original=await readDoc(env,'personal-me');
  if(!original?.data) {
    const result={reconciled:true,removedDuplicates:0,enrichedExisting:0,keptImported:0,total:PERSONAL_HISTORICAL_SALES.length};
    await writeDoc(env,PERSONAL_HISTORICAL_REPAIR_ID,{result},null);
    return result;
  }
  const base=original.data;
  const sales=Array.isArray(base.sales)?base.sales.map(x=>({...x})):[];
  const occurrences=new Map();
  const desired=PERSONAL_HISTORICAL_SALES.map(([date,clientName,credit])=>{
    const k=personalSaleImportKey(date,clientName,credit);
    const occurrence=(occurrences.get(k)||0)+1;
    occurrences.set(k,occurrence);
    return {date,clientName,credit,occurrence,id:personalSeedId(date,clientName,credit,occurrence)};
  });
  const importedIds=new Set(desired.map(x=>x.id));
  const used=new Set();
  const removeIds=new Set();
  let removedDuplicates=0,enrichedExisting=0,keptImported=0;

  desired.forEach(d=>{
    const desiredName=normalizePersonalClientName(d.clientName);
    const amountCents=Math.round(Number(d.credit)*100);
    const candidates=[];
    sales.forEach((s,i)=>{
      if(importedIds.has(String(s.id||''))||used.has(i)) return;
      if(String(s.date||'')!==d.date) return;
      if(Math.round((Number(s.credit)||0)*100)!==amountCents) return;
      candidates.push({i,s,name:normalizePersonalClientName(s.clientName)});
    });

    let match=candidates.find(x=>x.name===desiredName);
    if(!match) match=candidates.find(x=>!x.name||x.name==='VENDA PROPRIA'||x.name==='CLIENTE NAO INFORMADO');

    const imported=sales.find(s=>String(s.id||'')===d.id);
    if(match){
      used.add(match.i);
      if(!match.name||match.name==='VENDA PROPRIA'||match.name==='CLIENTE NAO INFORMADO'){
        match.s.clientName=d.clientName;
        enrichedExisting++;
      }
      if(imported){
        removeIds.add(String(imported.id));
        removedDuplicates++;
      }
    } else if(imported) {
      keptImported++;
    }
  });

  const repaired=sales.filter(s=>!removeIds.has(String(s.id||'')));
  const data=cleanPersonalData({...base,sales:repaired});
  const ok=await writeDoc(env,'personal-me',{data},original.revision);
  if(!ok) throw new HttpError(409,'A base pessoal mudou durante a correção das vendas. Tente novamente.');
  const result={reconciled:true,removedDuplicates,enrichedExisting,keptImported,total:PERSONAL_HISTORICAL_SALES.length,finalSales:data.sales.length};
  await writeDoc(env,PERSONAL_HISTORICAL_REPAIR_ID,{result},null);
  return result;
}


const PERSONAL_HISTORICAL_REPAIR_V3_ID='personal-me-reconcile-20261118-v3';
async function reconcileHistoricalPersonalSalesV3(env){
  const done=await readDoc(env,PERSONAL_HISTORICAL_REPAIR_V3_ID);
  if(done) return done.result||{reconciled:true};
  const original=await readDoc(env,'personal-me');
  if(!original?.data){
    const result={reconciled:true,removedDuplicates:0,enrichedExisting:0,keptImported:0,total:PERSONAL_HISTORICAL_SALES.length};
    await writeDoc(env,PERSONAL_HISTORICAL_REPAIR_V3_ID,{result},null);
    return result;
  }
  const base=original.data;
  const sales=Array.isArray(base.sales)?base.sales.map(x=>({...x})):[];
  const occurrences=new Map();
  const desired=PERSONAL_HISTORICAL_SALES.map(([date,clientName,credit])=>{
    const k=personalSaleImportKey(date,clientName,credit);
    const occurrence=(occurrences.get(k)||0)+1;
    occurrences.set(k,occurrence);
    return {date,clientName,credit,occurrence,id:personalSeedId(date,clientName,credit,occurrence)};
  });
  const importedIds=new Set(desired.map(x=>x.id));
  const used=new Set(),removeIds=new Set();
  let removedDuplicates=0,enrichedExisting=0,keptImported=0;

  desired.forEach(d=>{
    const desiredName=normalizePersonalClientName(d.clientName);
    const amountCents=Math.round(Number(d.credit)*100);
    const desiredMonth=String(d.date).slice(0,7);
    const candidates=[];
    sales.forEach((s,i)=>{
      if(importedIds.has(String(s.id||''))||used.has(i)) return;
      if(Math.round((Number(s.credit)||0)*100)!==amountCents) return;
      const name=normalizePersonalClientName(s.clientName);
      const month=String(s.date||'').slice(0,7);
      const isSynced=!!s.sourceId;
      const isBlank=!name||name==='VENDA PROPRIA'||name==='CLIENTE NAO INFORMADO';
      candidates.push({i,s,name,month,isSynced,isBlank});
    });
    let match=
      candidates.find(x=>String(x.s.date||'')===d.date&&x.name===desiredName) ||
      candidates.find(x=>String(x.s.date||'')===d.date&&(x.isSynced||x.isBlank)) ||
      candidates.find(x=>x.month===desiredMonth&&(x.isSynced||x.isBlank)) ||
      candidates.find(x=>x.month===desiredMonth&&x.name===desiredName);

    const imported=sales.find(s=>String(s.id||'')===d.id);
    if(match){
      used.add(match.i);
      match.s.date=d.date;
      match.s.clientName=d.clientName;
      if(!match.s.status) match.s.status='Ativa';
      enrichedExisting++;
      if(imported){
        removeIds.add(String(imported.id));
        removedDuplicates++;
      }
    }else if(imported){
      keptImported++;
    }
  });

  const repaired=sales.filter(s=>!removeIds.has(String(s.id||'')));
  const data=cleanPersonalData({...base,sales:repaired});
  const ok=await writeDoc(env,'personal-me',{data},original.revision);
  if(!ok) throw new HttpError(409,'A base pessoal mudou durante a reconciliação final. Tente novamente.');
  const result={reconciled:true,removedDuplicates,enrichedExisting,keptImported,total:PERSONAL_HISTORICAL_SALES.length,finalSales:data.sales.length};
  await writeDoc(env,PERSONAL_HISTORICAL_REPAIR_V3_ID,{result},null);
  return result;
}

async function routeMe(req,env) {
  if(!configured(env)) return json(503,{error:'Servidor ainda não configurado'});
  const user=await session(req,env);
  if(!user) return json(401,{error:'Faça login para continuar'});
  if(user.role!=='gestor') return json(403,{error:'Área exclusiva do gestor'});
  if(!['GET','POST'].includes(req.method)) return json(405,{error:'Método não permitido'});
  const doc=await readDoc(env,'personal-me');
  if(req.method==='GET') {
    return json(200,{
      revision:doc?.revision||0,
      data:doc?.data||{sales:[],clients:[],settings:{monthlySalesTarget:5000000,monthlyCommissionTarget:0}}
    });
  }
  const body=await parse(req);
  if(body?.action!=='replace') return json(400,{error:'Operação não reconhecida'});
  const expected=doc?.revision||0;
  if(Number(body.revision)!==expected) return json(409,{error:'Sua base pessoal mudou em outra sessão. Reabra a aba EU antes de salvar novamente.'});
  const data=cleanPersonalData(body.data);
  const ok=await writeDoc(env,'personal-me',{data},doc?doc.revision:null);
  if(!ok) return json(409,{error:'A base pessoal mudou durante a gravação. Reabra a aba EU antes de tentar novamente.'});
  return json(200,{ok:true,revision:expected+1,data});
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
      const premium='<script defer src="/ranking-executivo-20261113.js?v=premium-v4"></script><script defer src="/month-close-alert-20261117.js?v=month-close-v1"></script><script defer src="/me-dashboard-v7-20261118.js?v=me-v8-all-periods"></script>';
      if(!html.includes('ranking-executivo-20261113.js')) {
        if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,premium+'\n</body>');
        else html+=premium;
      }
      const headers=new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('cache-control','no-store');
      headers.set('x-gm-ranking-version','premium-v4-20261113');
      headers.set('x-gm-me-version','me-v8-all-periods-20261118');
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    }
    try {
      await schema(env);
      const personalImport=await ensureHistoricalPersonalSales(env);
      const personalRepair=await reconcileHistoricalPersonalSales(env);
      const personalRepairV3=await reconcileHistoricalPersonalSalesV3(env);
      if(path==='/api/health'&&req.method==='GET') { const required=['SESSION_SECRET','PASSWORD_GESTOR','PASSWORD_TRAINEE','PASSWORD_CONSULTOR']; const missing=required.filter(key=>!env[key]); return json(200,{ok:true,configured:configured(env),databaseBound:!!env.DB,personalImport,personalRepair,personalRepairV3,...(missing.length?{missingConfig:missing}:{})}); }
      if(path==='/api/session') return await routeSession(req,env);
      if(path==='/api/state') return await routeState(req,env);
      if(path==='/api/me') return await routeMe(req,env);
      if(path==='/api/coaching') return await routeCoaching(req,env);
      return json(404,{error:'Rota não encontrada'});
    } catch(e) {
      if(e instanceof HttpError) return json(e.status,{error:e.message});
      console.error('Dashboard Cloudflare API',path,e);
      return json(500,{error:'Erro interno ao processar a solicitação'});
    }
  }
};