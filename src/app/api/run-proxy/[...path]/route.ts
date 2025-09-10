import type { NextRequest } from "next/server";
import { GoogleAuth, IdTokenClient } from "google-auth-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HttpMethod =
  | "GET" | "HEAD" | "POST" | "DELETE" | "PUT"
  | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// We build the JSON credentials at RUNTIME (not import time) so build never fails.
async function getIdTokenClient(audience: string): Promise<IdTokenClient> {
  const client_email = requireEnv("GCP_SA_EMAIL");
  // Private key might be stored with escaped newlines in Vercel
  const private_key = requireEnv("GCP_SA_PRIVATE_KEY").replace(/\\n/g, "\n");

  const auth = new GoogleAuth({
    credentials: { client_email, private_key },
  });

  return auth.getIdTokenClient(audience);
}

async function proxy(req: NextRequest, method: HttpMethod, segs?: string[]) {
  const runUrl = requireEnv("GCP_RUN_URL").replace(/\/+$/, "");
  const { search } = new URL(req.url);

  const path = (segs?.length ? "/" + segs.join("/") : "");
  const url = runUrl + path + search;
  async function proxy(req: NextRequest, method: HttpMethod, segs?: string[]) {
    // --- local debug without forwarding upstream ---
    if (segs?.length === 1 && segs[0].toLowerCase() === "debug") {
      const gcpRunUrl = process.env.GCP_RUN_URL || "(unset)";
      const gcpSaEmail = process.env.GCP_SA_EMAIL ? "set" : "unset";
      const gcpSaKey   = process.env.GCP_SA_PRIVATE_KEY ? "set" : "unset";
      const urlFromReq = new URL(req.url).toString();

      return Response.json({
        ok: true,
        note: "This came from Next.js, not FastAPI. If GCP_RUN_URL isn't the Cloud Run *service* URL, fix your Vercel envs.",
        method,
        segs,
        urlFromReq,
        env: {
          GCP_RUN_URL: gcpRunUrl,
          GCP_SA_EMAIL: gcpSaEmail,
          GCP_SA_PRIVATE_KEY: gcpSaKey,
        },
      });
    }
    // --- normal proxy flow continues below ---

  // Copy through headers, but strip hop-by-hop/host
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (["host", "connection", "content-length"].includes(lk)) return;
    headers[k] = v;
  });

  // Preserve body for non-GET/HEAD
  let body: Buffer | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const ab = await req.arrayBuffer();
    body = Buffer.from(ab);
  }

  // Get ID token
  const client = await getIdTokenClient(runUrl);
  const authHeaders = await client.getRequestHeaders(url);
  headers["Authorization"] = authHeaders["Authorization"] ?? headers["Authorization"];

  // Send to Cloud Run using node fetch
  const resp = await fetch(url, {
    method,
    headers,
    body,
  });

  // Stream response back
  const outHeaders = new Headers();
  resp.headers.forEach((v, k) => outHeaders.set(k, v));
  return new Response(resp.body, { status: resp.status, headers: outHeaders });
}

// Route handlers
export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, "GET", ctx.params?.path);
}
export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, "POST", ctx.params?.path);
}
export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, "PUT", ctx.params?.path);
}
export async function PATCH(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, "PATCH", ctx.params?.path);
}
export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return proxy(req, "DELETE", ctx.params?.path);
}
