export const runtime = 'nodejs';
// Serverless proxy that attaches a Google ID token (audience = RUN_URL)
// and forwards requests to Cloud Run.
//
// Usage on Vercel:
//   GET  /api/run-proxy/health
//   POST /api/run-proxy/auth/login

import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

export const runtime = "nodejs";

const RUN_URL = process.env.GCP_RUN_URL || "";

function getCreds() {
  const email = process.env.GCP_SA_EMAIL || "";
  const key = (process.env.GCP_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!RUN_URL) throw new Error("Missing env: GCP_RUN_URL");
  if (!email || !key) throw new Error("Missing env: GCP_SA_EMAIL or GCP_SA_PRIVATE_KEY");
  return { client_email: email, private_key: key };
}

async function getClient() {
  const auth = new GoogleAuth({ credentials: getCreds() });
  return auth.getIdTokenClient(RUN_URL);
}

async function handler(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const segments = ctx.params?.path || [];
  const path = "/" + segments.join("/");
  const method = req.method;

  const fwdHeaders: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) fwdHeaders["Content-Type"] = contentType;

  let data: Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    data = Buffer.from(await req.arrayBuffer());
  }

  try {
    const client = await getClient();
    const resp = await client.request({
      url: `${RUN_URL}${path}`,
      method,
      headers: fwdHeaders,
      data,
      responseType: "arraybuffer",
      validateStatus: () => true,
    });

    const outHeaders = new Headers();
    const ct = (resp.headers as any)["content-type"];
    if (ct) outHeaders.set("content-type", Array.isArray(ct) ? ct[0] : ct);

    return new NextResponse(Buffer.from(resp.data as ArrayBuffer), {
      status: resp.status,
      headers: outHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "proxy_error", message: err?.message || String(err) },
      { status: 502 }
    );
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
