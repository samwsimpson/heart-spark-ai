import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RUN_URL =
  process.env.CLOUD_RUN_URL ?? process.env.NEXT_PUBLIC_CLOUD_RUN_URL;
const SA_JSON =
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
  process.env.GCP_VER_CREDENTIALS ??
  process.env.GCP_SA_KEY_JSON;

if (!RUN_URL) {
  throw new Error("CLOUD_RUN_URL env var is not set");
}
if (!SA_JSON) {
  throw new Error(
    "Service Account JSON env var is not set (set GOOGLE_SERVICE_ACCOUNT_JSON or GCP_VER_CREDENTIALS)"
  );
}

const auth = new GoogleAuth({ credentials: JSON.parse(SA_JSON) });

async function proxyToRun(req: NextRequest, method: string, pathSegs: string[]) {
  const { search } = new URL(req.url);
  const url =
    RUN_URL.replace(/\/+$/, "") +
    "/" +
    (pathSegs?.join("/") ?? "") +
    search;

  // Get an ID token client for the Cloud Run audience (RUN_URL)
  const idClient = await auth.getIdTokenClient(RUN_URL);

  // Forward minimal safe headers
  const headers: Record<string, string> = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  // Body only for non-GET/HEAD
  const sendBody = method !== "GET" && method !== "HEAD";
  const data = sendBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  const resp = await idClient.request({
    url,
    method,
    headers,
    data,
    responseType: "arraybuffer",
    validateStatus: () => true, // always return the backend status
  });

  const outHeaders = new Headers();
  for (const [k, v] of Object.entries(resp.headers ?? {})) {
    if (typeof v === "string") outHeaders.set(k, v);
  }

  return new NextResponse(resp.data as any, {
    status: resp.status,
    headers: outHeaders,
  });
}

// NOTE: In Next 15, context.params is a *Promise*
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyToRun(req, "GET", path ?? []);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyToRun(req, "POST", path ?? []);
}

export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyToRun(req, "OPTIONS", path ?? []);
}
