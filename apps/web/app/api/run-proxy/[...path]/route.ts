import { GoogleAuth } from "google-auth-library";

// Force runtime routing; prevents any static optimization 404s
export const dynamic = "force-dynamic";
// (Optional) keep Node runtime (works fine on Edge too, but Node is safest for auth libs)
// export const runtime = "nodejs";

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
  const client = await auth.getIdTokenClient(getRunUrl());
  return client;
}

async function proxyToRun(request: Request, method: HttpMethod, segs: string[]) {
  const base = getRunUrl();
  const { search } = new URL(request.url);
  const path = segs?.length ? `/${segs.join("/")}` : "";
  const url = `${base}${path}${search}`;

  // Copy headers except hop-by-hop
  const headers: Record<string, string> = {};
  for (const [k, v] of request.headers.entries()) {
    const lower = k.toLowerCase();
    if (["host", "connection", "transfer-encoding", "content-length"].includes(lower)) continue;
    headers[k] = v;
  }

  let data: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    data = await request.arrayBuffer();
  }

  const idClient = await getIdClient();
  const resp = await idClient.request({
    url,
    method,
    headers,
    data,
    responseType: "arraybuffer",
    // Important for Cloud Run: pass through status codes untouched
    validateStatus: () => true,
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

// Next App Router handlers (Web standard Request + params)
export async function GET(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "GET", ctx.params.path ?? []);
}
export async function POST(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "POST", ctx.params.path ?? []);
}
export async function OPTIONS(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "OPTIONS", ctx.params.path ?? []);
}
export async function PUT(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "PUT", ctx.params.path ?? []);
}
export async function PATCH(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "PATCH", ctx.params.path ?? []);
}
export async function DELETE(req: Request, ctx: { params: { path?: string[] } }) {
  return proxyToRun(req, "DELETE", ctx.params.path ?? []);
}
