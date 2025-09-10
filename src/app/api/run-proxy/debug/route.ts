export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    using_GCP_RUN_URL: process.env.GCP_RUN_URL || "(unset)",
    note: "If this doesn't show the Cloud Run *service* URL (…us-central1.run.app), update Vercel envs and redeploy.",
  });
}
