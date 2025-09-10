import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest) {
  return Response.json({
    GCP_RUN_URL: process.env.GCP_RUN_URL || "(unset)",
    GCP_SA_EMAIL: process.env.GCP_SA_EMAIL || "(unset)",
    has_key: Boolean(process.env.GCP_SA_PRIVATE_KEY),
  });
}
