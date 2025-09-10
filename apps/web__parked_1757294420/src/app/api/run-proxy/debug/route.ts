import { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest) {
  return Response.json({
    GCP_RUN_URL: process.env.GCP_RUN_URL || "(unset)",
    note: "This is the exact base URL the proxy prepends to your paths."
  });
}
