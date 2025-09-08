import { NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RUN_URL = process.env.GCP_RUN_URL || "";
const SA_EMAIL = process.env.GCP_SA_EMAIL || "";
const SA_KEY = (process.env.GCP_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");

function corsHeaders(): Record<string,string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  };
}

function buildBackendUrl(pathSegs: string[] | undefined, search: string) {
  const base = RUN_URL.replace(/\/+$/, "");
  const path = (pathSegs && pathSegs.length) ? "/" + pathSegs.join("/") : "";
  return base + path + (search || "");
}

async function idClient() {
  const auth = new GoogleAuth({
    credentials: { client_email: SA_EMAIL, private_key: SA_KEY },
  });
  return auth.getIdTokenClient(RUN_URL);
}

async function forward(req: NextRequest, method: string, segs?: string[]) {
  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Local diagnostic path: /api/run-proxy/_echo (never forwards)
  if (segs?.[0] === "_echo") {
    const isBodyless = method === "GET" || method === "HEAD";
    const text = isBodyless ? "" : await req.text();
    return new Response(
      JSON.stringify({ ok: true, from: "catch-all/_echo", method, segs, body: text || null }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders() } }
    );
  }

  if (!RUN_URL || !SA_EMAIL || !SA_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing env: GCP_RUN_URL / GCP_SA_EMAIL / GCP_SA_PRIVATE_KEY" }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders() } }
    );
  }

  const { search } = new URL(req.url);
  const url = buildBackendUrl(segs, search);

  // pass through a small set of safe headers
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (/^(content-type|accept|x-request-id|x-trace-id)$/i.test(k)) headers[k] = v;
  });

  const isBodyless = method === "GET" || method === "HEAD";
  const data = isBodyless ? undefined : Buffer.from(await req.arrayBuffer());

  const client = await idClient();
  const resp = await client.request({
    url,
    method: method as any,
    headers,
    data,
    responseType: "arraybuffer",
    validateStatus: () => true,
  });

  const respHeaders: Record<string, string> = {};
  Object.entries(resp.headers || {}).forEach(([k, v]) => {
    respHeaders[k] = Array.isArray(v) ? v.join(", ") : String(v ?? "");
  });

  return new Response(Buffer.from(resp.data), {
    status: resp.status,
    headers: { ...respHeaders, ...corsHeaders() },
  });
}

type Ctx = { params: { path?: string[] } };

export async function GET(req: NextRequest, { params }: Ctx)    { return forward(req, "GET",    params.path); }
export async function POST(req: NextRequest, { params }: Ctx)   { return forward(req, "POST",   params.path); }
export async function PUT(req: NextRequest, { params }: Ctx)    { return forward(req, "PUT",    params.path); }
export async function PATCH(req: NextRequest, { params }: Ctx)  { return forward(req, "PATCH",  params.path); }
export async function DELETE(req: NextRequest, { params }: Ctx) { return forward(req, "DELETE", params.path); }
export async function OPTIONS(req: NextRequest, { params }: Ctx){ return forward(req, "OPTIONS",params.path); }
