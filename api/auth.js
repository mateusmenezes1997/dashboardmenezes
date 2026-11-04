import crypto from 'node:crypto';
const roles={gestor:'GM_PASSWORD_GESTOR',trainee:'GM_PASSWORD_TRAINEE',consultor:'GM_PASSWORD_CONSULTOR'};
const cookieName='gm_session';
function eq(a,b){const x=Buffer.from(String(a));const y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function sign(value){return crypto.createHmac('sha256',process.env.GM_SESSION_SECRET||'').update(value).digest('hex')}
function verify(cookie){if(!process.env.GM_SESSION_SECRET)return null;const [role,exp,signature]=String(cookie||'').split('.');if(!roles[role]||!/^\d+$/.test(exp||'')||Number(exp)<Date.now())return null;return eq(signature||'',sign(role+'.'+exp))?role:null}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET'){const match=(req.headers.cookie||'').match(/(?:^|; )gm_session=([^;]*)/);return res.status(200).json({role:verify(match?.[1])})}
 if(req.method==='DELETE'){res.setHeader('Set-Cookie',cookieName+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return res.status(200).json({ok:true})}
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origem inválida'});
 const role=String(req.body?.role||'').toLowerCase(),password=String(req.body?.password||'');
 const expected=process.env[roles[role]];if(!roles[role]||!expected||!process.env.GM_SESSION_SECRET||!eq(password,expected))return res.status(401).json({error:'Perfil ou senha incorretos'});
 const exp=String(Date.now()+12*60*60*1000);const token=role+'.'+exp+'.'+sign(role+'.'+exp);
 res.setHeader('Set-Cookie',cookieName+'='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200');
 return res.status(200).json({ok:true,role});
}
