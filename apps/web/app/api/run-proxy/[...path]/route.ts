import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Get the Cloud Run base URL from any of your env names */
function getRunUrl(): string {
  const v =
    process.env.CLOUD_RUN_URL ??
    process.env.NEXT_PUBLIC_CLOUD_RUN_URL ??
    process.env.GCP_RUN_URL;
  if (!v) throw new Error("CLOUD_RUN_URL / NEXT_PUBLIC_CLOUD_RUN_URL / GCP_RUN_URL is not set");
  return v;
}

/** Build credentials from either full JSON or email+private key */
function getAuth(): GoogleAuth {
  const fullJson =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
    process.env.GCP_VER_CREDENTIALS ??
    null;

  if (fullJson) {
    return new GoogleAuth({ credentials: JSON.parse(fullJson) });
  }

  const client_email = process.env.GCP_SA_EMAIL;
  let private_key = process.env.GCP_SA_PRIVATE_KEY;
  if (!client_email || !private_key) {
    throw new Error("Missing service account creds: set GOOGLE_SERVICE_ACCOUNT_JSON OR GCP_SA_EMAIL + GCP_SA_PRIVATE_KEY");
  }
  // Vercel envs often store newlines as literal \n
  private_key = private_key.replace(/\\n/g, "\n");

  return new GoogleAuth({
    credentials: {
      type: "service_account",
      client_email,
      private_key,
      // private_key_id is optional for JWT flows
    } as any,
  });
}

const auth = getAuth();

async function proxyToRun(req: NextRequest, method: string, segs: string[]) {
  const RUN_URL = getRunUrl();
  const { search } = new URL(req.url);
  const url =
    RUN_URL.replace(/\/+$/, "") + "/" + (segs?.join("/") ?? "") + search;

  const idClient = await auth.getIdTokenClient(RUN_URL);

  const headers: Record<string, string> = {};
  const ct = req.headers.get("content-type");
  if (ct) headers["content-type"] = ct;

  const hasBody = method !== "GET" && method !== "HEAD";
  const data = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

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

  return new NextResponse(resp.data as any, {
    status: resp.status,
    headers: outHeaders,
  });
}

// In Next 15, context.params is a Promise
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
