import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

type HttpMethod =
  | "GET" | "HEAD" | "POST" | "DELETE" | "PUT"
  | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

/** Required at build & runtime */
function getRunUrl(): string {
  const v = process.env.GCP_RUN_URL;
  if (!v) {
    throw new Error("GCP_RUN_URL env var is required");
  }
  return v.replace(/\/+$/, "");
}

async function getIdClient() {
  // If you provided SA email/key via env (recommended on Vercel), use them.
  const client_email = process.env.GCP_SA_EMAIL;
  const private_key_raw = process.env.GCP_SA_PRIVATE_KEY;
  const private_key = private_key_raw?.replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials:
      client_email && private_key
        ? { client_email, private_key }
        : undefined,
  });

  // We want an ID token for the Cloud Run URL
  return auth.getIdTokenClient(getRunUrl());
}

function sanitizeHeaders(inHeaders: Headers): Record<string, string> {
  const banned = new Set(["host", "connection", "content-length", "accept-encoding"]);
  const out: Record<string, string> = {};
  for (const [k, v] of inHeaders.entries()) {
    if (!banned.has(k.toLowerCase())) out[k] = v;
  }
  return out;
}

async function segsFrom(ctx: any): Promise<string[]> {
  if (!ctx?.params) return [];
  // Next 15 sometimes passes Promise<{ path: string[] }>
  if (typeof (ctx.params as any)?.then === "function") {
    const p = await ctx.params;
    return p?.path ?? [];
  }
  return (ctx.params as any)?.path ?? [];
}

async function proxyToRun(req: NextRequest, method: HttpMethod, segs: string[]) {
  const base = getRunUrl();
  const { search } = new URL(req.url);
  const url = base + "/" + (segs?.join("/") ?? "") + search;

  const idClient = await getIdClient();

  const headers = sanitizeHeaders(req.headers);
  headers["x-forwarded-host"] = req.headers.get("host") || "";

  let data: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    data = await req.arrayBuffer();
  }

  const resp = await idClient.request({
    url,
    method,
    headers,
    data,
    responseType: "arraybuffer",
    validateStatus: () => true,
  });

  const outHeaders = new Headers();
  for (const [k, v] of Object.entries(resp.headers ?? {})) {
    if (typeof v === "string") outHeaders.set(k, v);
  }

  const body =
    resp.data instanceof ArrayBuffer ? Buffer.from(resp.data) : (resp.data as any);

  return new NextResponse(body, {
    status: resp.status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, ctx: any) {
  return proxyToRun(req, "GET", await segsFrom(ctx));
}
export async function POST(req: NextRequest, ctx: any) {
  return proxyToRun(req, "POST", await segsFrom(ctx));
}
export async function PUT(req: NextRequest, ctx: any) {
  return proxyToRun(req, "PUT", await segsFrom(ctx));
}
export async function PATCH(req: NextRequest, ctx: any) {
  return proxyToRun(req, "PATCH", await segsFrom(ctx));
}
export async function DELETE(req: NextRequest, ctx: any) {
  return proxyToRun(req, "DELETE", await segsFrom(ctx));
}
export async function OPTIONS(req: NextRequest, ctx: any) {
  return proxyToRun(req, "OPTIONS", await segsFrom(ctx));
}
export async function HEAD(req: NextRequest, ctx: any) {
  return proxyToRun(req, "HEAD", await segsFrom(ctx));
}
