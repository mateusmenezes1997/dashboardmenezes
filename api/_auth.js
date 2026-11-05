import crypto from 'node:crypto';
const SESSION_COOKIE='gm_session';
const TTL=12*60*60;
function b64(s){return Buffer.from(s).toString('base64url')}
function sign(s){return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(s).digest('base64url')}
export function configured(){return Boolean(process.env.SESSION_SECRET&&process.env.PASSWORD_GESTOR&&process.env.PASSWORD_TRAINEE&&process.env.PASSWORD_CONSULTOR&&process.env.BLOB_READ_WRITE_TOKEN)}
export function authenticate(role,password){
 const roles={gestor:'PASSWORD_GESTOR',trainee:'PASSWORD_TRAINEE',consultor:'PASSWORD_CONSULTOR'};
 if(!roles[role]||typeof password!=='string')return false;
 const expected=process.env[roles[role]];
 if(!expected)return false;
 const a=crypto.createHash('sha256').update(password).digest();
 const b=crypto.createHash('sha256').update(expected).digest();
 return crypto.timingSafeEqual(a,b);
}
export function makeCookie(role){const body=b64(JSON.stringify({role,exp:Math.floor(Date.now()/1000)+TTL}));return `${SESSION_COOKIE}=${body}.${sign(body)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TTL}`}
export const clearCookie=`${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
export function session(req){
 if(!process.env.SESSION_SECRET)return null;
 const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
 if(!value)return null;
 const i=value.lastIndexOf('.');if(i<1)return null;
 const body=value.slice(0,i),mac=value.slice(i+1), expected=sign(body);
 if(mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return null;
 try{const parsed=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));return parsed.exp>Date.now()/1000&&['gestor','trainee','consultor'].includes(parsed.role)?parsed:null}catch{return null}
}
export function json(res,status,obj){res.status(status).setHeader('Cache-Control','no-store').json(obj)}
