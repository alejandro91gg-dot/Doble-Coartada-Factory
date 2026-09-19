import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Agent={agent_code:string;display_name:string;capabilities:string[];active:boolean};
const J={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const C={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,x-factory-key,x-sync-id,x-package-sha256","access-control-allow-methods":"GET,POST,OPTIONS"};
const R=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...J,...C}});

function db(){
  const u=Deno.env.get("SUPABASE_URL"); if(!u) throw Error("SUPABASE_URL missing");
  let k:string|undefined; const n=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(n){const o=JSON.parse(n);k=o.default??Object.values(o)[0] as string|undefined}
  k??=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??undefined; if(!k) throw Error("backend key missing");
  return createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function sha(x:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(x));return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase()}
function base64(bytes:Uint8Array){let binary="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(binary)}
function route(u:URL){const m="/factory-api-v13",i=u.pathname.indexOf(m);return i<0?(u.pathname||"/"):(u.pathname.slice(i+m.length)||"/")}
const has=(a:Agent,c:string)=>Array.isArray(a.capabilities)&&a.capabilities.includes(c);
async function auth(req:Request,s:any){
  const raw=req.headers.get("x-factory-key"); if(!raw||raw.length<24)return {e:R({error:"AUTH_REQUIRED"},401)};
  const h=await sha(raw); const c=await s.from("factory_agent_credentials").select("id,agent_code").eq("key_hash",h).eq("active",true).is("revoked_at",null).maybeSingle();
  if(c.error)return {e:R({error:"AUTH_BACKEND_ERROR"},500)}; if(!c.data)return {e:R({error:"AUTH_INVALID"},401)};
  const q=await s.from("factory_agents").select("agent_code,display_name,capabilities,active").eq("agent_code",c.data.agent_code).eq("active",true).single();
  if(q.error||!q.data)return {e:R({error:"AGENT_DISABLED"},403)}; s.from("factory_agent_credentials").update({last_used_at:new Date().toISOString()}).eq("id",c.data.id).then(()=>{});
  return {a:q.data as Agent};
}
async function audit(s:any,actor:string,action:string,type:string,id:string|null,payload:any={}){await s.from("factory_audit_log").insert({actor,action,entity_type:type,entity_id:id,payload})}

async function proxy(req:Request,p:string,u:URL){
  const base=Deno.env.get("SUPABASE_URL"); if(!base)return R({error:"BACKEND_CONFIGURATION_ERROR"},500);
  const headers=new Headers(req.headers); headers.delete("host"); headers.delete("content-length");
  const body=(req.method==="GET"||req.method==="HEAD")?undefined:await req.arrayBuffer();
  return fetch(`${base}/functions/v1/factory-api${p}${u.search}`,{method:req.method,headers,body});
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:C});
  const u=new URL(req.url),p=route(u);
  if(req.method==="GET"&&p==="/health")return R({ok:true,service:"doble-coartada-factory-api",version:"1.3.1",gateway:"factory-api-v13",release:"BINARY_GET_DELIVERY"});

  // v1.3.1 compatibility route: ChatGPT Actions can materialize a stored binary
  // directly from the established GET document operation. Text documents keep
  // using the stable factory-api response unchanged.
  const dm=/^\/documents\/([^/]+)$/.exec(p);
  if(req.method==="GET"&&dm){
    let s:any; try{s=db()}catch{return R({error:"BACKEND_CONFIGURATION_ERROR"},500)}
    const z=await auth(req,s); if(z.e)return z.e; const a=z.a!;
    if(!has(a,"documents_read"))return R({error:"AUTHORITY_DENIED",agent:a.agent_code,required_capability:"documents_read"},403);
    const documentKey=decodeURIComponent(dm[1]);
    const q=await s.from("factory_documents").select("id,document_key,case_code,filename,media_type,sha256,size_bytes,content_text,storage_path,metadata").eq("document_key",documentKey).maybeSingle();
    if(q.error)return R({error:"DATABASE_ERROR"},500); if(!q.data)return R({error:"DOCUMENT_NOT_FOUND"},404);
    const document=q.data;
    if(document.content_text!=null||!document.storage_path)return proxy(req,p,u);
    const maxBytes=10*1024*1024,size=Number(document.size_bytes);
    if(!document.storage_path.startsWith("factory-packages/")||!Number.isSafeInteger(size)||size>maxBytes)return R({error:"DOCUMENT_FILE_NOT_DELIVERABLE",max_bytes:maxBytes},409);
    const objectPath=document.storage_path.slice("factory-packages/".length);
    const downloaded=await s.storage.from("factory-packages").download(objectPath);
    if(downloaded.error||!downloaded.data)return R({error:"DOCUMENT_FILE_DOWNLOAD_FAILED",document_key:document.document_key},500);
    const bytes=new Uint8Array(await downloaded.data.arrayBuffer());
    if(bytes.byteLength!==size)return R({error:"DOCUMENT_FILE_SIZE_MISMATCH",expected_bytes:size,actual_bytes:bytes.byteLength},409);
    await audit(s,a.agent_code,"DOCUMENT_FILE_ISSUED_VIA_GET_V13","factory_document",document.id,{document_key:document.document_key,sha256:document.sha256,size_bytes:size,delivery:"inline_base64"});
    return R({
      openaiFileResponse:[{name:document.filename,mime_type:document.media_type,content:base64(bytes)}],
      document:{document_key:document.document_key,case_code:document.case_code,filename:document.filename,media_type:document.media_type,sha256:document.sha256,size_bytes:size,metadata:document.metadata},
      actor:a.agent_code
    });
  }

  // v1.3 direct route: own/all returns read.
  if(req.method==="GET"&&p==="/returns"){
    let s:any; try{s=db()}catch{return R({error:"BACKEND_CONFIGURATION_ERROR"},500)}
    const z=await auth(req,s); if(z.e)return z.e; const a=z.a!;
    const all=has(a,"returns_read_all"),own=has(a,"returns_read_own"); if(!all&&!own)return R({error:"AUTHORITY_DENIED"},403);
    let q=s.from("factory_agent_returns").select("*").order("created_at",{ascending:false}).limit(100);
    const cc=u.searchParams.get("case_code")?.toUpperCase(),rid=u.searchParams.get("return_id");
    if(cc)q=q.eq("case_code",cc); if(rid)q=q.eq("return_id",rid); if(!all)q=q.eq("agent_code",a.agent_code);
    const x=await q; return x.error?R({error:"DATABASE_ERROR"},500):R({returns:x.data,scope:all?"all":"own",actor:a.agent_code});
  }

  // v1.3 direct route: explicit workflow completion. Only capability holders can call it.
  const cm=/^\/handoffs\/([^/]+)\/complete$/.exec(p);
  if(req.method==="POST"&&cm){
    let s:any; try{s=db()}catch{return R({error:"BACKEND_CONFIGURATION_ERROR"},500)}
    const z=await auth(req,s); if(z.e)return z.e; const a=z.a!;
    if(!has(a,"handoff_complete"))return R({error:"AUTHORITY_DENIED",agent:a.agent_code,required_capability:"handoff_complete"},403);
    const publicId=decodeURIComponent(cm[1]);
    const h=await s.from("factory_handoffs").select("*").eq("handoff_id",publicId).maybeSingle();
    if(h.error)return R({error:"DATABASE_ERROR"},500); if(!h.data)return R({error:"HANDOFF_NOT_FOUND"},404);
    if(h.data.status==="completed")return R({handoff:h.data,completion:{already_completed:true}});
    if(h.data.status!=="accepted")return R({error:"HANDOFF_NOT_ACCEPTED",handoff_id:publicId,status:h.data.status},409);
    const rr=await s.from("factory_agent_returns").select("id,return_id,agent_code,verdict,created_at").eq("related_handoff_id",h.data.id).eq("agent_code",h.data.to_agent).order("created_at",{ascending:true});
    if(rr.error)return R({error:"DATABASE_ERROR"},500); if(!rr.data||rr.data.length===0)return R({error:"HANDOFF_RETURN_REQUIRED",handoff_id:publicId,expected_agent:h.data.to_agent},409);
    const q=await s.from("factory_handoffs").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",h.data.id).eq("status","accepted").select("*").maybeSingle();
    if(q.error)return R({error:"HANDOFF_COMPLETE_FAILED"},400);
    if(!q.data){const now=await s.from("factory_handoffs").select("*").eq("id",h.data.id).single(); if(!now.error&&now.data?.status==="completed")return R({handoff:now.data,completion:{already_completed:true,verified_returns:rr.data}}); return R({error:"HANDOFF_STATE_CHANGED"},409)}
    const ids=rr.data.map((x:any)=>x.return_id); await audit(s,a.agent_code,"HANDOFF_COMPLETED","handoff",h.data.id,{handoff_id:publicId,recipient_agent:h.data.to_agent,return_ids:ids});
    return R({handoff:q.data,completion:{verified_returns:rr.data,authority_note:"Workflow closure only; no canon, logic, production-state, PASS, freeze, or promotion effect."}});
  }

  // All established v1.2 routes are delegated unchanged to the stable factory-api.
  return proxy(req,p,u);
});
