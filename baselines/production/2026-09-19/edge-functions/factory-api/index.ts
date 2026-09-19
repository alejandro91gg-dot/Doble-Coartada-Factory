import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Agent={agent_code:string;display_name:string;capabilities:string[];active:boolean};
const J={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
const C={"access-control-allow-origin":"*","access-control-allow-headers":"content-type,x-factory-key,x-sync-id,x-package-sha256","access-control-allow-methods":"GET,POST,OPTIONS"};
const R=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...J,...C}});

function db(){
  const u=Deno.env.get("SUPABASE_URL"); if(!u) throw Error("SUPABASE_URL missing");
  let k:string|undefined;
  const n=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(n){const o=JSON.parse(n);k=o.default??Object.values(o)[0] as string|undefined}
  k??=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??undefined;
  if(!k) throw Error("backend key missing");
  return createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function sha(x:string|Uint8Array){
  const b=typeof x==="string"?new TextEncoder().encode(x):x;
  const d=await crypto.subtle.digest("SHA-256",b);
  return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function route(u:URL){const m="/factory-api",i=u.pathname.indexOf(m);return i<0?(u.pathname||"/"):(u.pathname.slice(i+m.length)||"/")}
const has=(a:Agent,c:string)=>Array.isArray(a.capabilities)&&a.capabilities.includes(c);
async function auth(req:Request,s:any){
  const raw=req.headers.get("x-factory-key"); if(!raw||raw.length<24)return {e:R({error:"AUTH_REQUIRED"},401)};
  const h=await sha(raw);
  const {data:c,error:ce}=await s.from("factory_agent_credentials").select("id,agent_code").eq("key_hash",h).eq("active",true).is("revoked_at",null).maybeSingle();
  if(ce)return {e:R({error:"AUTH_BACKEND_ERROR"},500)}; if(!c)return {e:R({error:"AUTH_INVALID"},401)};
  const {data:a,error:ae}=await s.from("factory_agents").select("agent_code,display_name,capabilities,active").eq("agent_code",c.agent_code).eq("active",true).single();
  if(ae||!a)return {e:R({error:"AGENT_DISABLED"},403)};
  s.from("factory_agent_credentials").update({last_used_at:new Date().toISOString()}).eq("id",c.id).then(()=>{});
  return {a:a as Agent};
}
const deny=(a:Agent,c:string)=>has(a,c)?null:R({error:"AUTHORITY_DENIED",agent:a.agent_code,required_capability:c},403);
function caseCode(n:string){const m=/^Caso\s+(\d{1,3})$/i.exec(n.trim());if(!m)return null;const x=+m[1];return x>=1&&x<=999?`DC-${String(x).padStart(3,"0")}`:null}
function rev(v:unknown){if(typeof v==="number"&&Number.isInteger(v)&&v>=1)return v;if(typeof v==="string"){const m=/^R?0*(\d+)$/i.exec(v.trim());if(m&&+m[1]>=1)return +m[1]}return null}
async function audit(s:any,actor:string,action:string,type:string,id:string|null,payload:any={}){await s.from("factory_audit_log").insert({actor,action,entity_type:type,entity_id:id,payload})}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:C});
  const u=new URL(req.url),p=route(u);
  if(req.method==="GET"&&p==="/health")return R({ok:true,service:"doble-coartada-factory-api",version:"1.1.0"});
  let s:any;try{s=db()}catch{return R({error:"BACKEND_CONFIGURATION_ERROR"},500)}
  const z=await auth(req,s);if(z.e)return z.e;const a=z.a!;

  if(req.method==="GET"&&p==="/whoami")return R({agent:a.agent_code,display_name:a.display_name,capabilities:a.capabilities});
  if(req.method==="GET"&&p==="/state"){
    const d=deny(a,"factory_read");if(d)return d;
    const [x,y]=await Promise.all([
      s.from("factory_cases").select("case_code,folder_name,title,case_version,canon_version,logic_version,production_state_version,authority_state,current_sync_rev,tree_sha256,updated_at").order("case_code"),
      s.from("factory_sync_packages").select("sync_id,status,global_changed,created_at,uploaded_at,package_sha256").order("created_at",{ascending:false}).limit(10)
    ]);
    if(x.error||y.error)return R({error:"DATABASE_ERROR"},500);return R({actor:a.agent_code,cases:x.data,recent_syncs:y.data});
  }
  if(req.method==="GET"&&p==="/cases"){
    const d=deny(a,"cases_read");if(d)return d;const q=await s.from("factory_cases").select("*").order("case_code");return q.error?R({error:"DATABASE_ERROR"},500):R({cases:q.data});
  }
  const cm=/^\/cases\/(DC-\d{3})$/i.exec(p);
  if(req.method==="GET"&&cm){
    const d=deny(a,"cases_read");if(d)return d;const q=await s.from("factory_cases").select("*").eq("case_code",cm[1].toUpperCase()).maybeSingle();
    if(q.error)return R({error:"DATABASE_ERROR"},500);return q.data?R({case:q.data}):R({error:"CASE_NOT_FOUND"},404);
  }
  if(req.method==="GET"&&p==="/documents"){
    const d=deny(a,"documents_read");if(d)return d;let q=s.from("factory_documents").select("document_key,case_code,scope,relative_path,filename,media_type,sha256,size_bytes,sync_id,sync_rev,is_authoritative,authority_state,updated_at").order("relative_path").limit(200);
    const cc=u.searchParams.get("case_code")?.toUpperCase(),t=u.searchParams.get("q")?.trim();if(cc)q=q.eq("case_code",cc);if(t)q=q.ilike("relative_path",`%${t}%`);
    const x=await q;return x.error?R({error:"DATABASE_ERROR"},500):R({documents:x.data});
  }
  const dm=/^\/documents\/(.+)$/.exec(p);
  if(req.method==="GET"&&dm){
    const d=deny(a,"documents_read");if(d)return d;const q=await s.from("factory_documents").select("*").eq("document_key",decodeURIComponent(dm[1])).maybeSingle();
    if(q.error)return R({error:"DATABASE_ERROR"},500);return q.data?R({document:q.data}):R({error:"DOCUMENT_NOT_FOUND"},404);
  }
  if(req.method==="GET"&&p==="/handoffs"){
    const all=has(a,"handoffs_read_all"),own=has(a,"handoffs_read_assigned");if(!all&&!own)return R({error:"AUTHORITY_DENIED"},403);
    let q=s.from("factory_handoffs").select("*").order("created_at",{ascending:false}).limit(100);const cc=u.searchParams.get("case_code")?.toUpperCase(),st=u.searchParams.get("status");
    if(cc)q=q.eq("case_code",cc);if(st)q=q.eq("status",st);if(!all)q=q.or(`to_agent.eq.${a.agent_code},from_agent.eq.${a.agent_code}`);const x=await q;
    return x.error?R({error:"DATABASE_ERROR"},500):R({handoffs:x.data});
  }
  if(req.method==="POST"&&p==="/handoffs"){
    const d=deny(a,"handoff_write");if(d)return d;const b=await req.json().catch(()=>null);if(!b?.handoff_id||!b?.to_agent)return R({error:"INVALID_HANDOFF"},400);
    const q=await s.from("factory_handoffs").insert({handoff_id:String(b.handoff_id),case_code:b.case_code?String(b.case_code).toUpperCase():null,from_agent:a.agent_code,to_agent:String(b.to_agent).toUpperCase(),protocol_version:b.protocol_version??null,gate:b.gate??null,status:"issued",payload:b.payload??{}}).select("*").single();
    if(q.error)return R({error:"HANDOFF_CREATE_FAILED"},400);await audit(s,a.agent_code,"HANDOFF_CREATED","handoff",q.data.id,{handoff_id:q.data.handoff_id});return R({handoff:q.data},201);
  }
  const am=/^\/handoffs\/([^/]+)\/ack$/.exec(p);
  if(req.method==="POST"&&am){
    const d=deny(a,"handoff_ack");if(d)return d;const h=await s.from("factory_handoffs").select("*").eq("handoff_id",decodeURIComponent(am[1])).maybeSingle();
    if(h.error)return R({error:"DATABASE_ERROR"},500);if(!h.data)return R({error:"HANDOFF_NOT_FOUND"},404);if(h.data.to_agent!==a.agent_code&&!has(a,"handoffs_read_all"))return R({error:"AUTHORITY_DENIED"},403);
    const b=await req.json().catch(()=>({})),st=b.status==="blocked"?"blocked":"accepted";const q=await s.from("factory_handoffs").update({status:st,acknowledged_at:new Date().toISOString()}).eq("id",h.data.id).select("*").single();
    if(q.error)return R({error:"HANDOFF_ACK_FAILED"},400);await audit(s,a.agent_code,"HANDOFF_ACKNOWLEDGED","handoff",h.data.id,{status:st});return R({handoff:q.data});
  }
  if(req.method==="GET"&&p==="/returns"){
    const d=deny(a,"returns_read_all");if(d)return d;let q=s.from("factory_agent_returns").select("*").order("created_at",{ascending:false}).limit(100);const cc=u.searchParams.get("case_code")?.toUpperCase();if(cc)q=q.eq("case_code",cc);const x=await q;return x.error?R({error:"DATABASE_ERROR"},500):R({returns:x.data});
  }
  if(req.method==="POST"&&p==="/returns"){
    const d=deny(a,"return_write");if(d)return d;const b=await req.json().catch(()=>null);if(!b?.return_id)return R({error:"INVALID_RETURN"},400);let hid:null|string=null;
    if(b.related_handoff_id){const h=await s.from("factory_handoffs").select("id").eq("handoff_id",String(b.related_handoff_id)).maybeSingle();hid=h.data?.id??null}
    const q=await s.from("factory_agent_returns").insert({return_id:String(b.return_id),case_code:b.case_code?String(b.case_code).toUpperCase():null,agent_code:a.agent_code,related_handoff_id:hid,verdict:b.verdict??null,content_text:b.content_text??null,artifact_path:b.artifact_path??null,sha256:b.sha256?String(b.sha256).toUpperCase():null,metadata:b.metadata??{}}).select("*").single();
    if(q.error)return R({error:"RETURN_CREATE_FAILED"},400);await audit(s,a.agent_code,"RETURN_CREATED","agent_return",q.data.id,{return_id:q.data.return_id});return R({return:q.data},201);
  }
  if(req.method==="POST"&&p==="/sync/register"){
    const d=deny(a,"sync_register");if(d)return d;const b=await req.json().catch(()=>null);if(!b?.sync_id||!b?.package_sha256||!/^[A-Fa-f0-9]{64}$/.test(String(b.package_sha256)))return R({error:"INVALID_SYNC_PACKAGE"},400);
    const list=Array.isArray(b.changed_cases)?b.changed_cases:[],id=String(b.sync_id);
    const pk=await s.from("factory_sync_packages").upsert({sync_id:id,package_sha256:String(b.package_sha256).toUpperCase(),package_tree_sha256:b.package_tree_sha256?String(b.package_tree_sha256).toUpperCase():null,global_changed:Boolean(b.global_changed),changed_cases:list,status:"staged",received_by:a.agent_code},{onConflict:"sync_id"});
    if(pk.error)return R({error:"SYNC_REGISTER_FAILED"},400);const accepted:any[]=[];
    for(const it of list){
      const name=String(it.case_name??it.case??""),cc=String(it.case_code??caseCode(name)??"").toUpperCase(),rv=rev(it.sync_rev),th=String(it.tree_sha256??"").toUpperCase();
      if(!/^DC-\d{3}$/.test(cc)||!rv||!/^[A-F0-9]{64}$/.test(th))return R({error:"INVALID_CHANGED_CASE",item:it},400);
      const ce=await s.from("factory_cases").upsert({case_code:cc,folder_name:name||null},{onConflict:"case_code",ignoreDuplicates:true});if(ce.error)return R({error:"CASE_SYNC_STAGE_FAILED",case_code:cc},400);
      const se=await s.from("factory_case_sync").upsert({case_code:cc,sync_id:id,sync_rev:rv,tree_sha256:th,status:"staged"},{onConflict:"case_code,sync_id"});if(se.error)return R({error:"CASE_SYNC_REGISTER_FAILED",case_code:cc},400);
      accepted.push({case_code:cc,sync_rev:rv});
    }
    await audit(s,a.agent_code,"SYNC_REGISTERED","sync_package",id,{changed_cases:accepted,global_changed:Boolean(b.global_changed)});return R({ok:true,sync_id:id,changed_cases:accepted},201);
  }
  if(req.method==="POST"&&p==="/sync/document"){
    const d=deny(a,"documents_sync");if(d)return d;const b=await req.json().catch(()=>null);if(!b?.document_key||!b?.relative_path||!b?.sha256||!/^[A-Fa-f0-9]{64}$/.test(String(b.sha256)))return R({error:"INVALID_DOCUMENT"},400);
    const sc=b.scope==="global"?"global":"case",cc=sc==="case"?String(b.case_code??"").toUpperCase():null;if(sc==="case"&&!/^DC-\d{3}$/.test(cc??""))return R({error:"INVALID_CASE_CODE"},400);
    const q=await s.from("factory_documents").upsert({document_key:String(b.document_key),case_code:cc,scope:sc,relative_path:String(b.relative_path),filename:String(b.filename??b.relative_path).split(/[\\/]/).pop(),media_type:String(b.media_type??"text/plain"),sha256:String(b.sha256).toUpperCase(),size_bytes:Number.isFinite(Number(b.size_bytes))?Number(b.size_bytes):null,content_text:b.content_text??null,storage_path:b.storage_path??null,sync_id:b.sync_id??null,sync_rev:rev(b.sync_rev),is_authoritative:false,authority_state:"staged",metadata:b.metadata??{}},{onConflict:"document_key"}).select("document_key,case_code,sha256,sync_id,sync_rev,authority_state").single();
    if(q.error)return R({error:"DOCUMENT_SYNC_FAILED"},400);return R({document:q.data},201);
  }
  if(req.method==="POST"&&p==="/sync/upload"){
    const d=deny(a,"sync_upload");if(d)return d;const id=req.headers.get("x-sync-id"),ex=req.headers.get("x-package-sha256")?.toUpperCase();if(!id||!ex||!/^[A-F0-9]{64}$/.test(ex))return R({error:"SYNC_HEADERS_REQUIRED"},400);
    const pk=await s.from("factory_sync_packages").select("*").eq("sync_id",id).maybeSingle();if(pk.error)return R({error:"DATABASE_ERROR"},500);if(!pk.data)return R({error:"SYNC_NOT_REGISTERED"},404);if(pk.data.package_sha256!==ex)return R({error:"DECLARED_SHA_MISMATCH"},409);
    const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.byteLength>45*1024*1024)return R({error:"PACKAGE_TOO_LARGE"},413);const ac=await sha(bytes);if(ac!==ex)return R({error:"PACKAGE_SHA256_MISMATCH",expected:ex,actual:ac},409);
    const sp=`sync/${id}/${id}.zip`,up=await s.storage.from("factory-packages").upload(sp,bytes,{contentType:"application/zip",upsert:true});if(up.error)return R({error:"STORAGE_UPLOAD_FAILED"},400);
    const pp=await s.from("factory_sync_packages").update({status:"uploaded",storage_path:sp,uploaded_at:new Date().toISOString()}).eq("sync_id",id);if(pp.error)return R({error:"SYNC_STATUS_UPDATE_FAILED"},500);
    const rows=await s.from("factory_case_sync").select("case_code,sync_rev,tree_sha256").eq("sync_id",id);if(rows.error)return R({error:"SYNC_CASE_LOOKUP_FAILED"},500);
    for(const it of rows.data??[]){const pr=await s.from("factory_cases").update({current_sync_rev:it.sync_rev,tree_sha256:it.tree_sha256}).eq("case_code",it.case_code);if(pr.error)return R({error:"SYNC_CASE_PROMOTION_FAILED",case_code:it.case_code},500)}
    const st=await s.from("factory_case_sync").update({status:"uploaded"}).eq("sync_id",id);if(st.error)return R({error:"SYNC_CASE_STATUS_UPDATE_FAILED"},500);
    await audit(s,a.agent_code,"SYNC_UPLOADED","sync_package",id,{sha256:ac,storage_path:sp,size_bytes:bytes.byteLength});return R({ok:true,sync_id:id,sha256:ac,storage_path:sp,size_bytes:bytes.byteLength},201);
  }
  return R({error:"NOT_FOUND",route:p},404);
});
