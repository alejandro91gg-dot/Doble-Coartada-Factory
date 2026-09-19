import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

type Agent = {
  agent_code: string;
  display_name: string;
  capabilities: string[];
  active: boolean;
};

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,x-factory-key",
  "access-control-allow-methods": "GET,OPTIONS",
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  });

function database() {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL missing");
  let key: string | undefined;
  const named = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (named) {
    const parsed = JSON.parse(named);
    key = parsed.default ?? Object.values(parsed)[0] as string | undefined;
  }
  key ??= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
  if (!key) throw new Error("backend key missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sha256(value: string) {
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
  const marker = "/factory-api-v2-read";
  const index = url.pathname.indexOf(marker);
  return index < 0
    ? (url.pathname || "/")
    : (url.pathname.slice(index + marker.length) || "/");
}

async function authenticate(req: Request, client: any) {
  const raw = req.headers.get("x-factory-key");
  if (!raw || raw.length < 24) return { error: response({ error: "AUTH_REQUIRED" }, 401) };
  const keyHash = await sha256(raw);
  const credential = await client
    .from("factory_agent_credentials")
    .select("id,agent_code")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .is("revoked_at", null)
    .maybeSingle();
  if (credential.error) return { error: response({ error: "AUTH_BACKEND_ERROR" }, 500) };
  if (!credential.data) return { error: response({ error: "AUTH_INVALID" }, 401) };
  const agent = await client
    .from("factory_agents")
    .select("agent_code,display_name,capabilities,active")
    .eq("agent_code", credential.data.agent_code)
    .eq("active", true)
    .single();
  if (agent.error || !agent.data) return { error: response({ error: "AGENT_DISABLED" }, 403) };
  return { agent: agent.data as Agent };
}

function canRead(agent: Agent) {
  return Array.isArray(agent.capabilities) &&
    (agent.capabilities.includes("factory_read") || agent.capabilities.includes("authority_read"));
}

function validCaseCode(value: string) {
  return /^DC-\d{3}$/.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  const url = new URL(req.url);
  const path = route(url);
  if (req.method === "GET" && path === "/health") {
    return response({
      ok: true,
      service: "doble-coartada-factory-api-v2-read",
      version: "2.1.0-phase1",
      mode: "read_only",
      model: "CASE_AUTHORITY_CASE_CORE_EDITION_PROFILE_SKU_RELEASE",
    });
  }
  if (req.method !== "GET") return response({ error: "METHOD_NOT_ALLOWED" }, 405);

  let client: any;
  try {
    client = database();
  } catch {
    return response({ error: "BACKEND_CONFIGURATION_ERROR" }, 500);
  }
  const authenticated = await authenticate(req, client);
  if (authenticated.error) return authenticated.error;
  const agent = authenticated.agent!;
  if (!canRead(agent)) {
    return response({
      error: "AUTHORITY_DENIED",
      agent: agent.agent_code,
      required_capability: "factory_read",
    }, 403);
  }

  if (path === "/v2/capabilities") {
    return response({
      model: ["CASE_AUTHORITY", "CASE_CORE", "EDITION_PROFILE", "SKU_RELEASE"],
      authority_types: ["CASE_CANON", "CASE_LOGIC", "PRODUCTION_STATE"],
      editions: ["ECONOMICO", "ESTANDAR", "PREMIUM"],
      audio_rules: {
        ECONOMICO: { included: false, optional_for_player: false, required_for_solution: false },
        ESTANDAR: { included: true, optional_for_player: true, required_for_solution: false },
        PREMIUM: { included: true, optional_for_player: true, required_for_solution: false },
      },
      gate_scopes: ["CASE_CORE", "VISUAL_SYSTEM", "EDITION", "AUDIO", "SKU_RELEASE"],
      writes_enabled: false,
      actor: agent.agent_code,
    });
  }

  const caseState = /^\/v2\/cases\/(DC-\d{3})\/state$/i.exec(path);
  if (caseState) {
    const caseCode = caseState[1].toUpperCase();
    const caseRow = await client.from("factory_cases").select("*").eq("case_code", caseCode).maybeSingle();
    if (caseRow.error) return response({ error: "DATABASE_ERROR" }, 500);
    if (!caseRow.data) return response({ error: "CASE_NOT_FOUND" }, 404);
    const [state, artifacts, gates, jobs] = await Promise.all([
      client.from("factory_v2_case_state").select("*").eq("case_code", caseCode).order("edition_code"),
      client.from("factory_production_artifacts").select("*").eq("case_code", caseCode).order("created_at"),
      client.from("factory_scoped_gate_runs").select("*").eq("case_code", caseCode).order("created_at"),
      client.from("factory_production_jobs").select("*").eq("case_code", caseCode).order("created_at"),
    ]);
    if (state.error || artifacts.error || gates.error || jobs.error) {
      return response({ error: "DATABASE_ERROR" }, 500);
    }
    return response({
      case: caseRow.data,
      v2_state: state.data ?? [],
      artifacts: artifacts.data ?? [],
      scoped_gate_runs: gates.data ?? [],
      production_jobs: jobs.data ?? [],
      actor: agent.agent_code,
    });
  }

  const collections: Record<string, { table: string; order: string }> = {
    "/v2/case-cores": { table: "factory_case_cores", order: "created_at" },
    "/v2/edition-profiles": { table: "factory_edition_profiles", order: "created_at" },
    "/v2/sku-releases": { table: "factory_sku_releases", order: "created_at" },
    "/v2/artifacts": { table: "factory_production_artifacts", order: "created_at" },
    "/v2/gate-runs": { table: "factory_scoped_gate_runs", order: "created_at" },
    "/v2/jobs": { table: "factory_production_jobs", order: "created_at" },
  };
  const collection = collections[path];
  if (collection) {
    const caseCode = (url.searchParams.get("case_code") ?? "").trim().toUpperCase();
    if (caseCode && !validCaseCode(caseCode)) return response({ error: "INVALID_CASE_CODE" }, 400);
    let query = client.from(collection.table).select("*").order(collection.order).limit(200);
    if (caseCode) query = query.eq("case_code", caseCode);
    const result = await query;
    if (result.error) return response({ error: "DATABASE_ERROR" }, 500);
    return response({ records: result.data ?? [], actor: agent.agent_code });
  }

  return response({ error: "NOT_FOUND" }, 404);
});
