import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

type Params = { path: string[] };
type Ctx = { params: Promise<Params> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRunUrl() {
  const u = process.env.GCP_RUN_URL || process.env.RUN_URL;
  if (!u) throw new Error("RUN_URL env not set");
  return u;
}

type HttpMethod =
  | "GET" | "HEAD" | "POST" | "DELETE" | "PUT"
  | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

async function proxyToRun(req: NextRequest, method: HttpMethod, segs: string[]) {
  const RUN_URL = getRunUrl();
  const { search } = new URL(req.url);
  const url = RUN_URL.replace(/\/+$/, "") + "/" + (segs?.join("/") ?? "") + search;

  // forward headers (but drop hop-by-hop ones)
  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers.entries()) {
    const kl = k.toLowerCase();
    if (kl === "host" || kl === "content-length" || kl === "transfer-encoding") continue;
    headers[k] = v;
  }

  // body only for methods that allow it
  const body =
    method === "GET" || method === "HEAD" ? undefined : Buffer.from(await req.arrayBuffer());

  // SA creds from env
  const clientEmail = process.env.GCP_SA_EMAIL;
  const privateKey = process.env.GCP_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    return NextResponse.json(
      { error: "Missing GCP_SA_EMAIL or GCP_SA_PRIVATE_KEY" },
      { status: 500 }
    );
  }

  // Sign an ID token for Cloud Run
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  const idClient = await auth.getIdTokenClient(RUN_URL);

  const resp = await idClient.request<Buffer>({
    url,
    method,
    headers,
    data: body,
    responseType: "arraybuffer",
    validateStatus: () => true, // pass through 4xx/5xx
  });

  const out = new NextResponse(resp.data as any, { status: resp.status });
  for (const [k, v] of Object.entries(resp.headers)) {
    const kl = k.toLowerCase();
    if (kl === "transfer-encoding") continue;
    if (Array.isArray(v)) out.headers.set(k, v.join(", "));
    else if (v !== undefined) out.headers.set(k, String(v));
  }
  return out;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "GET", path ?? []);
}
export async function HEAD(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "HEAD", path ?? []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "POST", path ?? []);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "PUT", path ?? []);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "PATCH", path ?? []);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "DELETE", path ?? []);
}

// CORS preflight passthrough
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
