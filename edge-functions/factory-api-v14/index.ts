import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Agent={agent_code:string;display_name:string;capabilities:string[];active:boolean};
const J={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const C={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,x-factory-key,x-sync-id,x-package-sha256","access-control-allow-methods":"GET,POST,OPTIONS"};
const R=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...J,...C}});
const TYPES=["CASE_CANON","CASE_LOGIC","PRODUCTION_STATE"];
const STATES=["staged","validated","authoritative","frozen","superseded"];
const GATE_STATES=["pending","pass","blocked","failed"];

function db(){
  const u=Deno.env.get("SUPABASE_URL"); if(!u) throw Error("SUPABASE_URL missing");
  let k:string|undefined; const n=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(n){const o=JSON.parse(n);k=o.default??Object.values(o)[0] as string|undefined}
  k??=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??undefined; if(!k) throw Error("backend key missing");
  return createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function sha(x:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(x));return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase()}
function route(u:URL){const m="/factory-api-v14",i=u.pathname.indexOf(m);return i<0?(u.pathname||"/"):(u.pathname.slice(i+m.length)||"/")}
const has=(a:Agent,c:string)=>Array.isArray(a.capabilities)&&a.capabilities.includes(c);
async function auth(req:Request,s:any){
  const raw=req.headers.get("x-factory-key"); if(!raw||raw.length<24)return {e:R({error:"AUTH_REQUIRED"},401)};
  const h=await sha(raw); const c=await s.from("factory_agent_credentials").select("id,agent_code").eq("key_hash",h).eq("active",true).is("revoked_at",null).maybeSingle();
  if(c.error)return {e:R({error:"AUTH_BACKEND_ERROR"},500)}; if(!c.data)return {e:R({error:"AUTH_INVALID"},401)};
  const q=await s.from("factory_agents").select("agent_code,display_name,capabilities,active").eq("agent_code",c.data.agent_code).eq("active",true).single();
  if(q.error||!q.data)return {e:R({error:"AGENT_DISABLED"},403)};
  s.from("factory_agent_credentials").update({last_used_at:new Date().toISOString()}).eq("id",c.data.id).then(()=>{});
  return {a:q.data as Agent};
}
const deny=(a:Agent,c:string)=>has(a,c)?null:R({error:"AUTHORITY_DENIED",agent:a.agent_code,required_capability:c},403);
async function audit(s:any,actor:string,action:string,type:string,id:string|null,payload:any={}){await s.from("factory_audit_log").insert({actor,action,entity_type:type,entity_id:id,payload})}
function meta(v:any){if(v==null)return {};if(typeof v==="object"&&!Array.isArray(v))return v;if(typeof v==="string"){try{const x=JSON.parse(v);return x&&typeof x==="object"&&!Array.isArray(x)?x:{}}catch{return {}}}return {}}
function up(v:any){return typeof v==="string"?v.trim().toUpperCase():""}
function hash64(v:any){const x=up(v);return /^[A-F0-9]{64}$/.test(x)?x:null}
function rpcError(e:any){const m=String(e?.message??e??"RPC_FAILED");const known=["AUTHORITY_NOT_FOUND","CASE_NOT_FOUND","AUTHORITY_NOT_STAGED","SOURCE_DOCUMENT_REQUIRED","SOURCE_DOCUMENT_MISMATCH","SUPPORTING_GATE_NOT_PASS","SUPPORTING_GATE_MISMATCH","AUTHORITY_NOT_VALIDATED","CURRENT_AUTHORITY_EXISTS","AUTHORITY_NOT_AUTHORITATIVE","AUTHORITY_NOT_CURRENT","SUPERSEDE_REASON_REQUIRED","AUTHORITY_NOT_CURRENT_STATE","INVALID_CASE_CODE","INVALID_IDEMPOTENCY_KEY","INVALID_MANIFEST_SHA256","INVALID_AUTHORITY_SET_SIZE","INVALID_SET_METADATA","AUTHORITY_SET_TYPE_MISMATCH","DUPLICATE_AUTHORITY_ID","INVALID_AUTHORITY_RECORD","INVALID_AUTHORITY_METADATA","AUTHORITY_ID_CONFLICT","AUTHORITY_VERSION_HASH_CONFLICT","PARENT_AUTHORITY_MISMATCH","PARENT_AUTHORITY_WITHOUT_CURRENT","IDEMPOTENCY_KEY_REUSE_MISMATCH","AUTHORITY_REGISTER_SET_CORRUPT"];for(const k of known)if(m.includes(k))return k;return "AUTHORITY_TRANSITION_FAILED"}
function codeFor(e:string){if(["AUTHORITY_NOT_FOUND","CASE_NOT_FOUND"].includes(e))return 404;if(["AUTHORITY_NOT_STAGED","AUTHORITY_NOT_VALIDATED","AUTHORITY_NOT_AUTHORITATIVE","AUTHORITY_NOT_CURRENT_STATE","AUTHORITY_NOT_CURRENT","CURRENT_AUTHORITY_EXISTS","SOURCE_DOCUMENT_REQUIRED","SOURCE_DOCUMENT_MISMATCH","SUPPORTING_GATE_NOT_PASS","SUPPORTING_GATE_MISMATCH","SUPERSEDE_REASON_REQUIRED","AUTHORITY_ID_CONFLICT","AUTHORITY_VERSION_HASH_CONFLICT","PARENT_AUTHORITY_MISMATCH","PARENT_AUTHORITY_WITHOUT_CURRENT","IDEMPOTENCY_KEY_REUSE_MISMATCH","AUTHORITY_REGISTER_SET_CORRUPT"].includes(e))return 409;return 400}

async function currentBundle(s:any,cc?:string|null){
  let q=s.from("factory_authority_current").select("case_code,authority_type,authority_record_id,updated_at").order("case_code").order("authority_type");
  if(cc)q=q.eq("case_code",cc);
  const c=await q; if(c.error)throw c.error;
  const ids=(c.data??[]).map((x:any)=>x.authority_record_id);
  let records:any[]=[];
  if(ids.length){const r=await s.from("factory_authority_records").select("*").in("id",ids);if(r.error)throw r.error;records=r.data??[]}
  const by=new Map(records.map((x:any)=>[x.id,x]));
  return (c.data??[]).map((x:any)=>({...x,record:by.get(x.authority_record_id)??null}));
}
async function proxy(req:Request,p:string,u:URL){
  const base=Deno.env.get("SUPABASE_URL"); if(!base)return R({error:"BACKEND_CONFIGURATION_ERROR"},500);
  const headers=new Headers(req.headers); headers.delete("host"); headers.delete("content-length");
  const body=(req.method==="GET"||req.method==="HEAD")?undefined:await req.arrayBuffer();
  return fetch(`${base}/functions/v1/factory-api-v13${p}${u.search}`,{method:req.method,headers,body});
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:C});
  const u=new URL(req.url),p=route(u);
  if(req.method==="GET"&&p==="/health")return R({ok:true,service:"doble-coartada-factory-api",version:"1.4.2",gateway:"factory-api-v14",authority_registry:true,atomic_authority_registration:true,action_file_delivery:true});

  if(req.method==="POST"&&p==="/documents/files"){
    const base=Deno.env.get("SUPABASE_URL"); if(!base)return R({error:"BACKEND_CONFIGURATION_ERROR"},500);
    const headers=new Headers(req.headers); headers.delete("host"); headers.delete("content-length");
    const body=await req.arrayBuffer();
    return fetch(`${base}/functions/v1/factory-api-premium/documents/files`,{method:req.method,headers,body});
  }

  let s:any; try{s=db()}catch{return R({error:"BACKEND_CONFIGURATION_ERROR"},500)}
  const z=await auth(req,s); if(z.e)return z.e; const a=z.a!;

  if(req.method==="GET"&&p==="/authority"){
    const d=deny(a,"authority_read");if(d)return d;
    let q=s.from("factory_authority_records").select("*").order("created_at",{ascending:false}).limit(200);
    const cc=up(u.searchParams.get("case_code")),ty=up(u.searchParams.get("authority_type")),st=(u.searchParams.get("state")??"").toLowerCase();
    if(cc)q=q.eq("case_code",cc);if(ty)q=q.eq("authority_type",ty);if(st)q=q.eq("state",st);
    const x=await q;if(x.error)return R({error:"DATABASE_ERROR"},500);
    return R({records:x.data,actor:a.agent_code});
  }
  if(req.method==="GET"&&p==="/authority/current"){
    const d=deny(a,"authority_read");if(d)return d;
    const cc=up(u.searchParams.get("case_code"));
    try{return R({current:await currentBundle(s,cc||null),actor:a.agent_code})}catch{return R({error:"DATABASE_ERROR"},500)}
  }
  const ag=/^\/authority\/([^/]+)$/.exec(p);
  if(req.method==="GET"&&ag){
    const d=deny(a,"authority_read");if(d)return d;
    const x=await s.from("factory_authority_records").select("*").eq("authority_id",decodeURIComponent(ag[1])).maybeSingle();
    if(x.error)return R({error:"DATABASE_ERROR"},500);return x.data?R({record:x.data,actor:a.agent_code}):R({error:"AUTHORITY_NOT_FOUND"},404);
  }
  if(req.method==="POST"&&p==="/authority/register"){
    const d=deny(a,"authority_register");if(d)return d;
    const b=await req.json().catch(()=>null);if(!b)return R({error:"INVALID_BODY"},400);
    const aid=String(b.authority_id??"").trim(),cc=up(b.case_code),ty=up(b.authority_type),ver=String(b.version??"").trim(),hs=hash64(b.sha256),doc=String(b.source_document_key??"").trim()||null,gate=String(b.supporting_gate_id??"").trim()||null;
    if(!aid||!/^DC-\d{3}$/.test(cc)||!TYPES.includes(ty)||!ver||!hs)return R({error:"INVALID_AUTHORITY_RECORD"},400);
    const ce=await s.from("factory_cases").select("case_code").eq("case_code",cc).maybeSingle();if(ce.error)return R({error:"DATABASE_ERROR"},500);if(!ce.data)return R({error:"CASE_NOT_FOUND"},404);
    if(doc){const de=await s.from("factory_documents").select("document_key,case_code,sha256").eq("document_key",doc).maybeSingle();if(de.error)return R({error:"DATABASE_ERROR"},500);if(!de.data||de.data.case_code!==cc||de.data.sha256!==hs)return R({error:"SOURCE_DOCUMENT_MISMATCH"},409)}
    if(gate){const ge=await s.from("factory_gate_records").select("gate_id,case_code").eq("gate_id",gate).maybeSingle();if(ge.error)return R({error:"DATABASE_ERROR"},500);if(!ge.data||ge.data.case_code!==cc)return R({error:"SUPPORTING_GATE_MISMATCH"},409)}
    const x=await s.from("factory_authority_records").insert({authority_id:aid,case_code:cc,authority_type:ty,version:ver,sha256:hs,source_document_key:doc,supporting_gate_id:gate,state:"staged",registered_by:a.agent_code,metadata:meta(b.metadata)}).select("*").single();
    if(x.error)return R({error:"AUTHORITY_REGISTER_FAILED",detail:x.error.message},400);
    await audit(s,a.agent_code,"AUTHORITY_REGISTERED","authority_record",x.data.id,{authority_id:aid,case_code:cc,authority_type:ty,version:ver,sha256:hs});
    return R({record:x.data,authority_note:"Registration is staged only; no canon, logic, production-state, PASS, freeze, or promotion effect."},201);
  }
  if(req.method==="POST"&&p==="/authority/set/register"){
    const d=deny(a,"authority_register");if(d)return d;
    const b=await req.json().catch(()=>null);if(!b)return R({error:"INVALID_BODY"},400);
    const cc=up(b.case_code),key=String(b.idempotency_key??"").trim(),manifest=hash64(b.manifest_sha256);
    if(!/^DC-\d{3}$/.test(cc)||key.length<8||!manifest||!Array.isArray(b.members)||b.members.length!==3)return R({error:"INVALID_AUTHORITY_SET"},400);
    const x=await s.rpc("factory_register_authority_set",{p_case_code:cc,p_idempotency_key:key,p_manifest_sha256:manifest,p_members:b.members,p_actor:a.agent_code,p_metadata:meta(b.metadata)});
    if(x.error){const e=rpcError(x.error);return R({error:e},codeFor(e))}
    return R({result:x.data,actor:a.agent_code,authority_note:"Atomic staged registration only; either all three authority domains are registered or none are. No validation, promotion, replacement, freeze, gate, or current-pointer effect."},x.data?.idempotent_replay?200:201);
  }
  const tr=/^\/authority\/([^/]+)\/(validate|promote|freeze|supersede)$/.exec(p);
  if(req.method==="POST"&&tr){
    const aid=decodeURIComponent(tr[1]),op=tr[2];
    const caps:any={validate:"authority_validate",promote:"authority_promote",freeze:"authority_freeze",supersede:"authority_supersede"};
    const d=deny(a,caps[op]);if(d)return d;
    const b=await req.json().catch(()=>({}));
    let fn="",args:any={p_authority_id:aid,p_actor:a.agent_code};
    if(op==="validate")fn="factory_validate_authority";
    if(op==="promote")fn="factory_promote_authority";
    if(op==="freeze")fn="factory_freeze_authority";
    if(op==="supersede"){fn="factory_supersede_authority";args.p_reason=String(b.reason??"")}
    const x=await s.rpc(fn,args);
    if(x.error){const e=rpcError(x.error);return R({error:e},codeFor(e))}
    const rec=x.data;
    const cc=rec?.case_code??null;
    const ce=cc?await s.from("factory_cases").select("*").eq("case_code",cc).maybeSingle():{data:null,error:null};
    let current:any[]=[];try{current=cc?await currentBundle(s,cc):[]}catch{}
    return R({record:rec,case:ce.data,current,authority_note:"Explicit authority transition only; transport/sync state cannot perform this operation."});
  }

  if(req.method==="GET"&&p==="/gates"){
    const d=deny(a,"gates_read");if(d)return d;
    let q=s.from("factory_gate_records").select("*").order("created_at",{ascending:false}).limit(200);
    const cc=up(u.searchParams.get("case_code")),gc=String(u.searchParams.get("gate_code")??"").trim(),st=(u.searchParams.get("status")??"").toLowerCase();
    if(cc)q=q.eq("case_code",cc);if(gc)q=q.eq("gate_code",gc);if(st)q=q.eq("status",st);
    const x=await q;return x.error?R({error:"DATABASE_ERROR"},500):R({gates:x.data,actor:a.agent_code});
  }
  if(req.method==="POST"&&p==="/gates"){
    const d=deny(a,"gate_write");if(d)return d;
    const b=await req.json().catch(()=>null);if(!b)return R({error:"INVALID_BODY"},400);
    const gid=String(b.gate_id??"").trim(),cc=up(b.case_code),gc=String(b.gate_code??"").trim(),gv=String(b.gate_version??"").trim()||null,st=String(b.status??"").trim().toLowerCase(),eh=b.evidence_sha256?hash64(b.evidence_sha256):null,src=String(b.source_return_id??"").trim()||null;
    if(!gid||!/^DC-\d{3}$/.test(cc)||!gc||!GATE_STATES.includes(st)||(b.evidence_sha256&&!eh))return R({error:"INVALID_GATE_RECORD"},400);
    let srcUuid:null|string=null;
    if(src){const rr=await s.from("factory_agent_returns").select("id,case_code,return_id").eq("return_id",src).maybeSingle();if(rr.error)return R({error:"DATABASE_ERROR"},500);if(!rr.data||rr.data.case_code!==cc)return R({error:"SOURCE_RETURN_MISMATCH"},409);srcUuid=rr.data.id}
    const x=await s.from("factory_gate_records").insert({gate_id:gid,case_code:cc,gate_code:gc,gate_version:gv,status:st,source_return_id:srcUuid,evidence_sha256:eh,metadata:meta(b.metadata),recorded_by:a.agent_code}).select("*").single();
    if(x.error)return R({error:"GATE_CREATE_FAILED",detail:x.error.message},400);
    await audit(s,a.agent_code,"GATE_RECORDED","gate_record",x.data.id,{gate_id:gid,case_code:cc,gate_code:gc,status:st,source_return_id:src});
    return R({gate:x.data,authority_note:"Gate registration has no automatic canon, logic, production-state, PASS, freeze, or promotion effect."},201);
  }

  return proxy(req,p,u);
});
