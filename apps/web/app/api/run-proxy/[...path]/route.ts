// apps/web/app/api/run-proxy/[...path]/route.ts
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";         // IMPORTANT: Node runtime (not Edge)
export const dynamic = "force-dynamic";  // Always run server-side

const RUN_URL = process.env.CLOUD_RUN_URL!;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL!;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

async function forward(req: Request, path: string[]) {
  if (!RUN_URL || !CLIENT_EMAIL || !PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "Missing envs" }), { status: 500 });
  }

  const url = new URL(req.url);
  const suffix = path?.join("/") ?? "";
  const target = `${RUN_URL.replace(/\/$/, "")}/${suffix}${url.search}`;

  // Get ID token for Cloud Run (audience must be the service URL)
  const auth = new GoogleAuth({
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  });
  const idToken = await auth.fetchIdToken(RUN_URL);

  // Copy headers, set Authorization
  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  headers.delete("host");
  headers.delete("content-length");

  // Only send body on non-GET/HEAD
  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : Buffer.from(await req.arrayBuffer());

  const resp = await fetch(target, { method, headers, body, redirect: "manual" });

  // Stream response back through
  const out = new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
  });
  resp.headers.forEach((v, k) => out.headers.set(k, v));
  return out;
}

export async function GET(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function POST(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function PUT(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function PATCH(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function DELETE(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function OPTIONS() {
  // Minimal CORS for preflight (safe even if not strictly needed)
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600",
    },
  });
}
