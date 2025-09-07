import { GoogleAuth } from "google-auth-library";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getRunUrl(): string {
  const u = process.env.GCP_RUN_URL;
  if (!u) throw new Error("GCP_RUN_URL is not set");
  return u.replace(/\/+$/, "");
}

async function getClient() {
  const email = process.env.GCP_SA_EMAIL;
  const key = process.env.GCP_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("SA creds missing");
  const auth = new GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return auth.getIdTokenClient(getRunUrl());
}

export async function GET() {
  const url = `${getRunUrl()}/health`;
  const idc = await getClient();
  const resp = await idc.request({ url, validateStatus: () => true });
  return new Response(
    typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data),
    { status: resp.status, headers: { "content-type": "application/json" } }
  );
}
