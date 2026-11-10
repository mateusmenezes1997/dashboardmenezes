import {get,put,head,BlobPreconditionFailedError} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {configured,session,json} from './_auth.js';
import {createCoachingHandler} from '../lib/coaching.js';
const PATH='gestao-menezes/coaching-v1.json';
async function read(){
 for(let i=0;i<3;i++){
  let before;
  try{before=await head(PATH)}catch(e){if(e?.name==='BlobNotFoundError')return null;throw e}
  if(!before)return null;
  const blob=await get(PATH,{access:'private',useCache:false});
  if(!blob?.stream)continue;
  const doc=JSON.parse(await new Response(blob.stream).text()),after=await head(PATH);
  if(before.etag===after.etag)return {...doc,etag:after.etag};
 }
 throw new Error('Concurrent update');
}
async function write(doc,etag){
 await put(PATH,JSON.stringify(doc),{access:'private',addRandomSuffix:false,allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});
}
export default createCoachingHandler({configured,session,json,read,write,uuid:randomUUID,conflict:e=>e instanceof BlobPreconditionFailedError||['BlobPreconditionFailedError','BlobAlreadyExistsError'].includes(e?.name)});
