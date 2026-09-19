import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Agent = {
  agent_code: string;
  display_name: string;
  capabilities: string[];
  active: boolean;
};

const J = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const C = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers":
    "content-type,x-factory-key,x-sync-id,x-package-sha256",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};
const R = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...J, ...C } });

function db() {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw Error("SUPABASE_URL missing");
  let key: string | undefined;
  const named = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (named) {
    const parsed = JSON.parse(named);
    key = parsed.default ?? Object.values(parsed)[0] as string | undefined;
  }
  key ??= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
  if (!key) throw Error("backend key missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function route(url: URL) {
  const marker = "/factory-api-premium";
  const index = url.pathname.indexOf(marker);
  return index < 0
    ? (url.pathname || "/")
    : (url.pathname.slice(index + marker.length) || "/");
}

const has = (agent: Agent, capability: string) =>
  Array.isArray(agent.capabilities) && agent.capabilities.includes(capability);

async function auth(req: Request, client: any) {
  const raw = req.headers.get("x-factory-key");
  if (!raw || raw.length < 24) return { e: R({ error: "AUTH_REQUIRED" }, 401) };
  const keyHash = await sha(raw);
  const credential = await client
    .from("factory_agent_credentials")
    .select("id,agent_code")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .is("revoked_at", null)
    .maybeSingle();
  if (credential.error) return { e: R({ error: "AUTH_BACKEND_ERROR" }, 500) };
  if (!credential.data) return { e: R({ error: "AUTH_INVALID" }, 401) };
  const agent = await client
    .from("factory_agents")
    .select("agent_code,display_name,capabilities,active")
    .eq("agent_code", credential.data.agent_code)
    .eq("active", true)
    .single();
  if (agent.error || !agent.data) return { e: R({ error: "AGENT_DISABLED" }, 403) };
  client
    .from("factory_agent_credentials")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", credential.data.id)
    .then(() => {});
  return { a: agent.data as Agent };
}

const deny = (agent: Agent, capability: string) =>
  has(agent, capability)
    ? null
    : R({
      error: "AUTHORITY_DENIED",
      agent: agent.agent_code,
      required_capability: capability,
    }, 403);

function up(value: any) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function hash64(value: any) {
  const normalized = up(value);
  return /^[A-F0-9]{64}$/.test(normalized) ? normalized : null;
}

function meta(value: any) {
  if (value == null) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function rpcError(error: any) {
  const message = String(error?.message ?? error ?? "RPC_FAILED");
  const known = [
    "AUTHORITY_NOT_FOUND",
    "AUTHORITY_SET_CASE_MISMATCH",
    "AUTHORITY_SET_TYPE_MISMATCH",
    "AUTHORITY_SET_NOT_VALIDATED",
    "AUTHORITY_SET_NOT_AUTHORITATIVE",
    "SOURCE_DOCUMENT_REQUIRED",
    "SOURCE_DOCUMENT_MISMATCH",
    "SUPPORTING_GATE_NOT_PASS",
    "CURRENT_AUTHORITY_NOT_EMPTY",
    "AUTHORITY_SET_NOT_CURRENT",
    "CURRENT_AUTHORITY_SET_INCOMPLETE",
    "CURRENT_AUTHORITY_SET_INVALID",
    "REPLACEMENT_REASON_REQUIRED",
    "USE_ATOMIC_AUTHORITY_SET_OPERATION",
    "CASE_NOT_FOUND",
    "INVALID_CASE_CODE",
    "INVALID_IDEMPOTENCY_KEY",
    "INVALID_MANIFEST_SHA256",
    "INVALID_AUTHORITY_SET_SIZE",
    "INVALID_SET_METADATA",
    "AUTHORITY_SET_TYPE_MISMATCH",
    "DUPLICATE_AUTHORITY_ID",
    "INVALID_AUTHORITY_RECORD",
    "INVALID_AUTHORITY_METADATA",
    "AUTHORITY_ID_CONFLICT",
    "AUTHORITY_VERSION_HASH_CONFLICT",
    "PARENT_AUTHORITY_MISMATCH",
    "PARENT_AUTHORITY_WITHOUT_CURRENT",
    "SUPPORTING_GATE_MISMATCH",
    "IDEMPOTENCY_KEY_REUSE_MISMATCH",
    "AUTHORITY_REGISTER_SET_CORRUPT",
  ];
  for (const item of known) if (message.includes(item)) return item;
  return "AUTHORITY_SET_TRANSITION_FAILED";
}

function codeFor(error: string) {
  if (error === "AUTHORITY_NOT_FOUND" || error === "CASE_NOT_FOUND") return 404;
  if (error === "AUTHORITY_SET_TRANSITION_FAILED") return 400;
  if (error.startsWith("INVALID_") || error === "AUTHORITY_SET_TYPE_MISMATCH" || error === "DUPLICATE_AUTHORITY_ID") return 400;
  return 409;
}

async function currentBundle(client: any, caseCode: string) {
  const current = await client
    .from("factory_authority_current")
    .select("case_code,authority_type,authority_record_id,updated_at")
    .eq("case_code", caseCode)
    .order("authority_type");
  if (current.error) throw current.error;
  const ids = (current.data ?? []).map((item: any) => item.authority_record_id);
  let records: any[] = [];
  if (ids.length) {
    const response = await client.from("factory_authority_records").select("*").in("id", ids);
    if (response.error) throw response.error;
    records = response.data ?? [];
  }
  const byId = new Map(records.map((item: any) => [item.id, item]));
  return (current.data ?? []).map((item: any) => ({
    ...item,
    record: byId.get(item.authority_record_id) ?? null,
  }));
}

async function proxy(req: Request, path: string, url: URL) {
  const base = Deno.env.get("SUPABASE_URL");
  if (!base) return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");
  const body = req.method === "GET" || req.method === "HEAD"
    ? undefined
    : await req.arrayBuffer();
  return fetch(`${base}/functions/v1/factory-api-v14${path}${url.search}`, {
    method: req.method,
    headers,
    body,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: C });
  const url = new URL(req.url);
  const path = route(url);
  const synthetic = (Deno.env.get("SUPABASE_URL") ?? "").includes("dzsuprknwgwjymeiiwzz");

  if (req.method === "GET" && path === "/health") {
    return R({
      ok: true,
      service: "doble-coartada-factory-api",
      version: "2.0.3",
      gateway: "factory-api-premium",
      release: synthetic ? "SYNTHETIC_ATOMIC_REGISTER" : "PREMIUM_ATOMIC_REGISTER",
      authority_registry: true,
      atomic_authority_sets: true,
      atomic_authority_registration: true,
      action_file_delivery: true,
      synthetic,
    });
  }

  const documentMatch = /^\/documents\/([^/]+)$/.exec(path);
  if (req.method === "GET" && documentMatch) {
    let client: any;
    try {
      client = db();
    } catch {
      return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
    }
    const authorized = await auth(req, client);
    if (authorized.e) return authorized.e;
    const agent = authorized.a!;
    const denied = deny(agent, "documents_read");
    if (denied) return denied;
    const documentKey = decodeURIComponent(documentMatch[1]);
    const result = await client.from("factory_documents")
      .select("id,document_key,case_code,filename,media_type,sha256,size_bytes,content_text,storage_path,metadata")
      .eq("document_key", documentKey).maybeSingle();
    if (result.error) return R({ error: "DATABASE_ERROR" }, 500);
    if (!result.data) return R({ error: "DOCUMENT_NOT_FOUND" }, 404);
    const document = result.data;
    if (document.content_text != null || !document.storage_path) {
      return proxy(req, path, url);
    }
    const maxBytes = 10 * 1024 * 1024;
    if (!document.storage_path.startsWith("factory-packages/") ||
      !Number.isSafeInteger(Number(document.size_bytes)) || Number(document.size_bytes) > maxBytes) {
      return R({ error: "DOCUMENT_FILE_NOT_DELIVERABLE", max_bytes: maxBytes }, 409);
    }
    const objectPath = document.storage_path.slice("factory-packages/".length);
    const signed = await client.storage.from("factory-packages")
      .createSignedUrl(objectPath, 300, { download: document.filename });
    if (signed.error || !signed.data?.signedUrl) {
      return R({ error: "SIGNED_URL_FAILED", document_key: document.document_key }, 500);
    }
    await client.from("factory_audit_log").insert({
      actor: agent.agent_code,
      action: "DOCUMENT_FILE_ISSUED_VIA_GET",
      entity_type: "factory_document",
      entity_id: document.id,
      payload: {
        document_key: document.document_key,
        sha256: document.sha256,
        expires_in_seconds: 300,
      },
    });
    return R({
      openaiFileResponse: [signed.data.signedUrl],
      document: {
        document_key: document.document_key,
        case_code: document.case_code,
        filename: document.filename,
        media_type: document.media_type,
        sha256: document.sha256,
        size_bytes: document.size_bytes,
        metadata: document.metadata,
      },
      delivery: { expires_in_seconds: 300, mode: "binary_get_compatibility" },
      actor: agent.agent_code,
    });
  }

  if (req.method === "POST" && path === "/documents/files") {
    let client: any;
    try {
      client = db();
    } catch {
      return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
    }
    const authorized = await auth(req, client);
    if (authorized.e) return authorized.e;
    const agent = authorized.a!;
    const denied = deny(agent, "documents_read");
    if (denied) return denied;

    const body = await req.json().catch(() => null);
    const keys = body?.document_keys;
    if (!Array.isArray(keys) || keys.length < 1 || keys.length > 10 ||
      keys.some((item: unknown) => typeof item !== "string" || !item.trim())) {
      return R({ error: "INVALID_DOCUMENT_KEYS", limit: 10 }, 400);
    }
    const normalized = keys.map((item: string) => item.trim());
    if (new Set(normalized).size !== normalized.length) {
      return R({ error: "DUPLICATE_DOCUMENT_KEYS" }, 400);
    }
    const documents = await client
      .from("factory_documents")
      .select("id,document_key,case_code,filename,media_type,sha256,size_bytes,storage_path,metadata")
      .in("document_key", normalized);
    if (documents.error) return R({ error: "DATABASE_ERROR" }, 500);
    const byKey = new Map((documents.data ?? []).map((item: any) => [item.document_key, item]));
    const missing = normalized.filter((key: string) => !byKey.has(key));
    if (missing.length) return R({ error: "DOCUMENT_NOT_FOUND", document_keys: missing }, 404);

    const ordered = normalized.map((key: string) => byKey.get(key));
    const maxBytes = 10 * 1024 * 1024;
    for (const document of ordered) {
      if (!document.storage_path || !document.storage_path.startsWith("factory-packages/")) {
        return R({ error: "DOCUMENT_STORAGE_PATH_INVALID", document_key: document.document_key }, 409);
      }
      if (!Number.isSafeInteger(Number(document.size_bytes)) || Number(document.size_bytes) > maxBytes) {
        return R({
          error: "ACTION_FILE_SIZE_LIMIT",
          document_key: document.document_key,
          max_bytes: maxBytes,
        }, 413);
      }
    }

    const urls: string[] = [];
    for (const document of ordered) {
      const objectPath = document.storage_path.slice("factory-packages/".length);
      const signed = await client.storage
        .from("factory-packages")
        .createSignedUrl(objectPath, 300, { download: document.filename });
      if (signed.error || !signed.data?.signedUrl) {
        return R({ error: "SIGNED_URL_FAILED", document_key: document.document_key }, 500);
      }
      urls.push(signed.data.signedUrl);
    }

    await client.from("factory_audit_log").insert({
      actor: agent.agent_code,
      action: "DOCUMENT_FILES_ISSUED",
      entity_type: "factory_document",
      entity_id: ordered[0].id,
      payload: {
        document_keys: normalized,
        sha256: ordered.map((item: any) => item.sha256),
        expires_in_seconds: 300,
      },
    });

    return R({
      openaiFileResponse: urls,
      files: ordered.map((document: any, index: number) => ({
        order: index + 1,
        document_key: document.document_key,
        case_code: document.case_code,
        filename: document.filename,
        mime_type: document.media_type,
        size_bytes: document.size_bytes,
        sha256: document.sha256,
        metadata: document.metadata,
      })),
      delivery: {
        expires_in_seconds: 300,
        instruction: "Use files in response order. For chunked packages concatenate byte-for-byte, then verify the parent SHA-256 before opening.",
      },
      actor: agent.agent_code,
    });
  }

  if (req.method === "GET" && path === "/authority/set/status") {
    let client: any;
    try {
      client = db();
    } catch {
      return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
    }
    const authorized = await auth(req, client);
    if (authorized.e) return authorized.e;
    const agent = authorized.a!;
    const denied = deny(agent, "authority_read");
    if (denied) return denied;
    const caseCode = up(url.searchParams.get("case_code"));
    if (!/^DC-\d{3}$/.test(caseCode)) return R({ error: "INVALID_CASE_CODE" }, 400);
    const records = await client
      .from("factory_authority_records")
      .select("*")
      .eq("case_code", caseCode)
      .order("created_at");
    if (records.error) return R({ error: "DATABASE_ERROR" }, 500);
    const caseEntry = await client
      .from("factory_cases")
      .select("*")
      .eq("case_code", caseCode)
      .maybeSingle();
    if (caseEntry.error) return R({ error: "DATABASE_ERROR" }, 500);
    let current: any[] = [];
    try {
      current = await currentBundle(client, caseCode);
    } catch {
      return R({ error: "DATABASE_ERROR" }, 500);
    }
    const latest: any = {};
    for (const record of records.data ?? []) latest[record.authority_type] = record;
    return R({
      case: caseEntry.data,
      records: records.data,
      current,
      latest,
      complete_current_set: current.length === 3,
      actor: agent.agent_code,
    });
  }

  if (req.method === "POST" && path === "/authority/set/register") {
    let client: any;
    try {
      client = db();
    } catch {
      return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
    }
    const authorized = await auth(req, client);
    if (authorized.e) return authorized.e;
    const agent = authorized.a!;
    const denied = deny(agent, "authority_register");
    if (denied) return denied;
    const body = await req.json().catch(() => null);
    if (!body) return R({ error: "INVALID_BODY" }, 400);
    const caseCode = up(body.case_code);
    const idempotencyKey = String(body.idempotency_key ?? "").trim();
    const manifestSha256 = hash64(body.manifest_sha256);
    if (!/^DC-\d{3}$/.test(caseCode) || idempotencyKey.length < 8 || !manifestSha256 ||
      !Array.isArray(body.members) || body.members.length !== 3) {
      return R({ error: "INVALID_AUTHORITY_SET" }, 400);
    }
    const registration = await client.rpc("factory_register_authority_set", {
      p_case_code: caseCode,
      p_idempotency_key: idempotencyKey,
      p_manifest_sha256: manifestSha256,
      p_members: body.members,
      p_actor: agent.agent_code,
      p_metadata: meta(body.metadata),
    });
    if (registration.error) {
      const error = rpcError(registration.error);
      return R({ error }, codeFor(error));
    }
    return R({
      result: registration.data,
      actor: agent.agent_code,
      authority_note:
        "Atomic staged registration only; either all three authority domains are registered or none are. No validation, promotion, replacement, freeze, gate, or current-pointer effect.",
    }, registration.data?.idempotent_replay ? 200 : 201);
  }

  const setMatch = /^\/authority\/set\/(promote|freeze|replace)$/.exec(path);
  if (req.method === "POST" && setMatch) {
    let client: any;
    try {
      client = db();
    } catch {
      return R({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
    }
    const authorized = await auth(req, client);
    if (authorized.e) return authorized.e;
    const agent = authorized.a!;
    const operation = setMatch[1];
    const capability = operation === "promote"
      ? "authority_promote"
      : operation === "freeze"
      ? "authority_freeze"
      : "authority_supersede";
    const denied = deny(agent, capability);
    if (denied) return denied;
    const body = await req.json().catch(() => null);
    if (!body) return R({ error: "INVALID_BODY" }, 400);
    const caseCode = up(body.case_code);
    const canon = String(body.case_canon_authority_id ?? "").trim();
    const logic = String(body.case_logic_authority_id ?? "").trim();
    const production = String(body.production_state_authority_id ?? "").trim();
    if (!/^DC-\d{3}$/.test(caseCode) || !canon || !logic || !production) {
      return R({ error: "INVALID_AUTHORITY_SET" }, 400);
    }
    let functionName = "";
    const args: any = {
      p_case_code: caseCode,
      p_case_canon_authority_id: canon,
      p_case_logic_authority_id: logic,
      p_production_state_authority_id: production,
      p_actor: agent.agent_code,
    };
    if (operation === "promote") functionName = "factory_promote_authority_set";
    if (operation === "freeze") functionName = "factory_freeze_authority_set";
    if (operation === "replace") {
      functionName = "factory_replace_authority_set";
      args.p_reason = String(body.reason ?? "");
    }
    const transition = await client.rpc(functionName, args);
    if (transition.error) {
      const error = rpcError(transition.error);
      return R({ error }, codeFor(error));
    }
    const caseEntry = await client
      .from("factory_cases")
      .select("*")
      .eq("case_code", caseCode)
      .maybeSingle();
    if (caseEntry.error) return R({ error: "DATABASE_ERROR" }, 500);
    let current: any[] = [];
    try {
      current = await currentBundle(client, caseCode);
    } catch {
      return R({ error: "DATABASE_ERROR" }, 500);
    }
    return R({
      result: transition.data,
      case: caseEntry.data,
      current,
      actor: agent.agent_code,
      authority_note:
        "Atomic three-domain authority-set transition. Either all three domains transition or none do.",
    });
  }

  return proxy(req, path, url);
});
