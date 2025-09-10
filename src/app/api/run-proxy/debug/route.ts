export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    note: "This is the Next.js debug route under /api/run-proxy/debug (not forwarded).",
    env: {
      GCP_RUN_URL: process.env.GCP_RUN_URL || "(unset)",
      GCP_SA_EMAIL: process.env.GCP_SA_EMAIL ? "set" : "unset",
      GCP_SA_PRIVATE_KEY: process.env.GCP_SA_PRIVATE_KEY ? "set" : "unset",
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
