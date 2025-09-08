import type { NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

type HttpMethod =
  | "GET" | "HEAD" | "POST" | "DELETE" | "PUT"
  | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function getRunUrl(): string {
  const url = getEnv("GCP_RUN_URL").replace(/\/+$/, "");
  return url;
}

async function getIdClient(audience: string) {
  const client_email = getEnv("GCP_SA_EMAIL");
  const pkRaw = getEnv("GCP_SA_PRIVATE_KEY");
  // Support both literal newlines and \n-escaped keys
  const private_key = pkRaw.includes("\\n") ? pkRaw.replace(/\\n/g, "\n") : pkRaw;

  const auth = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  // ID token client with Cloud Run URL as audience
  return auth.getIdTokenClient(audience);
}

function methodOf(req: NextRequest): HttpMethod {
  const m = req.method.toUpperCase();
  if (!["GET","HEAD","POST","DELETE","PUT","CONNECT","OPTIONS","TRACE","PATCH"].includes(m)) {
    return "GET";
  }
  return m as HttpMethod;
}

export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}
export async function HEAD(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, ctx);
}

async function proxy(req: NextRequest, { params }: { params: { path?: string[] } }) {
  try {
    const RUN_URL = getRunUrl();
    const { search } = new URL(req.url);
    const segs = params?.path?.join("/") ?? "";
    const url = `${RUN_URL}/${segs}${search}`;

    const idClient = await getIdClient(RUN_URL);

    // Forward headers except hop-by-hop
    const headersObj = Object.fromEntries(
      Array.from(req.headers.entries())
        .filter(([k]) => !["host","connection","content-length"].includes(k.toLowerCase()))
    );

    // Body for non-GET/HEAD
    const method = methodOf(req);
    let data: Uint8Array | undefined = undefined;
    if (!["GET","HEAD"].includes(method)) {
      const buf = Buffer.from(await req.arrayBuffer());
      if (buf.length > 0) data = buf;
    }

    const resp = await idClient.request<Uint8Array>({
      url,
      method,
      headers: headersObj,
      data,
      responseType: "arraybuffer"
    });

    // Build response back to client
    const outHeaders = new Headers();
    for (const [k, v] of Object.entries(resp.headers || {})) {
      if (v == null) continue;
      const vv = Array.isArray(v) ? v.join(", ") : String(v);
      // Filter hop-by-hop / conflicting headers
      if (["transfer-encoding","content-encoding","connection"].includes(k.toLowerCase())) continue;
      outHeaders.set(k, vv);
    }
    return new Response(Buffer.from(resp.data || []), {
      status: resp.status,
      headers: outHeaders
    });
  } catch (err: any) {
    const msg = (err?.message || String(err)).slice(0, 2000);
    return Response.json({ error: "proxy_failed", message: msg }, { status: 502 });
  }
}
