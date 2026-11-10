// Manager-only commitments are stored separately from the shared sales document.
export function validTask(task){
 if(!task||typeof task.consultantId!=='string'||!task.consultantId||task.consultantId.length>100)return false;
 if(typeof task.action!=='string'||!task.action.trim()||task.action.length>600)return false;
 if(typeof task.deadline!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(task.deadline))return false;
 const d=new Date(task.deadline+'T12:00:00Z');
 return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===task.deadline&&['open','done'].includes(task.status);
}
export function createCoachingHandler({configured,session,json,read,write,conflict,uuid}){
 return async function(req,res){
  if(!configured())return json(res,503,{error:'Armazenamento indisponível'});
  const user=session(req);
  if(!user)return json(res,401,{error:'Faça login para continuar'});
  if(user.role!=='gestor')return json(res,403,{error:'Acompanhamento exclusivo do gestor'});
  if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Método não permitido'});
  try{
   const current=await read()||{revision:0,tasks:[]};
   if(req.method==='GET')return json(res,200,{revision:current.revision,tasks:current.tasks});
   if(req.body?.revision!==current.revision)return json(res,409,{error:'Outro acompanhamento foi salvo. Recarregue antes de tentar novamente.'});
   const input=req.body?.task;
   if(!validTask(input))return json(res,400,{error:'Informe consultor, ação, prazo válido e situação.'});
   if(current.tasks.length>=1000&&!input.id)return json(res,400,{error:'Limite de acompanhamentos atingido.'});
   if(input.id&&!current.tasks.some(x=>x.id===input.id))return json(res,404,{error:'Compromisso não encontrado'});
   const task={id:input.id||uuid(),consultantId:input.consultantId,action:input.action.trim(),deadline:input.deadline,status:input.status,updatedAt:new Date().toISOString()};
   const tasks=input.id?current.tasks.map(x=>x.id===input.id?task:x):[task,...current.tasks];
   const next={revision:current.revision+1,tasks};
   await write(next,current.etag);
   return json(res,200,next);
  }catch(e){return json(res,conflict(e)?409:500,{error:conflict(e)?'Outro acompanhamento foi salvo. Recarregue antes de tentar novamente.':'Não foi possível salvar ou carregar o acompanhamento.'})}
 };
}
