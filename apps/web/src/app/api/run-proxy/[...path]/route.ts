import { NextRequest } from "next/server";
import { GoogleAuth } from "google-auth-library";

// Ensure this route is always dynamic (no static optimization)
// and uses Node runtime for google-auth-library
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HttpMethod =
  | "GET" | "HEAD" | "POST" | "DELETE" | "PUT"
  | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

function getRunUrl(): string {
  const url = process.env.GCP_RUN_URL;
  if (!url) throw new Error("GCP_RUN_URL is not set");
  return url.replace(/\/+$/, "");
}

async function getIdClient() {
  const email = process.env.GCP_SA_EMAIL;
  const key = process.env.GCP_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("GCP_SA_EMAIL or GCP_SA_PRIVATE_KEY missing");
  const auth = new GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return auth.getIdTokenClient(getRunUrl());
}

async function proxyToRun(req: NextRequest, method: HttpMethod, segs: string[]) {
  const base = getRunUrl();
  const { search } = new URL(req.url);
  const path = segs?.length ? `/${segs.join("/")}` : "";
  const url = `${base}${path}${search}`;

  // copy headers, skip hop-by-hop
  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers.entries()) {
    const lower = k.toLowerCase();
    if (["host", "connection", "transfer-encoding", "content-length"].includes(lower)) continue;
    headers[k] = v;
  }

  let data: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    data = await req.arrayBuffer();
  }

  const idClient = await getIdClient();
  const resp = await idClient.request({
    url,
    method,
    headers,
    data,
    responseType: "arraybuffer",
    validateStatus: () => true, // pass through Cloud Run status codes
  });

  const respHeaders = new Headers();
  for (const [k, v] of Object.entries(resp.headers || {})) {
    if (typeof v === "string") respHeaders.set(k, v);
  }

  return new Response(resp.data as ArrayBuffer, {
    status: resp.status,
    headers: respHeaders,
  });
}

// NOTE: Next 15 expects params as a Promise in App Router types.
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "GET", path ?? []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "POST", path ?? []);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToRun(req, "OPTIONS", path ?? []);
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
