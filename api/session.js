import {authenticate,clearCookie,configured,json,makeCookie,session} from './_auth.js';
export default async function handler(req,res){
 if(req.method==='GET')return json(res,200,{role:session(req)?.role||null,configured:configured()});
 if(req.method==='DELETE'){res.setHeader('Set-Cookie',clearCookie);return json(res,200,{ok:true})}
 if(req.method!=='POST')return json(res,405,{error:'Método não permitido'});
 if(!configured())return json(res,503,{error:'Autenticação ainda não configurada na Vercel'});
 const {role,password}=req.body||{};
 if(!authenticate(role,password))return json(res,401,{error:'Perfil ou senha incorretos'});
 res.setHeader('Set-Cookie',makeCookie(role));return json(res,200,{role});
}
