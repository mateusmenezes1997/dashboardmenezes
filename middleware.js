import { next } from '@vercel/functions';
export const config={matcher:['/','/index.html']};
export default async function middleware(req){
 const secret=process.env.GM_SESSION_SECRET;const token=(req.headers.get('cookie')||'').match(/(?:^|; )gm_session=([^;]*)/)?.[1]||'';
 const [role,expiration,signature]=token.split('.');
 if(secret&&['gestor','trainee','consultor'].includes(role)&&/^\d+$/.test(expiration||'')&&Number(expiration)>Date.now()&&/^[a-f0-9]{64}$/.test(signature||'')){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const sig=new Uint8Array(signature.match(/.{2}/g).map(v=>parseInt(v,16)));
  if(await crypto.subtle.verify('HMAC',key,sig,new TextEncoder().encode(role+'.'+expiration)))return next();
 }
 return Response.redirect(new URL('/login.html',req.url),302);
}
