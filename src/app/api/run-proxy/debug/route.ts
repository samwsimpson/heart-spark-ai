export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return Response.json({
    ok: true,
    where: "run-proxy/debug (local)",
    url: url.pathname + url.search,
    env: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      GCP_RUN_URL: process.env.GCP_RUN_URL ?? null,
      GCP_SA_EMAIL_set: Boolean(process.env.GCP_SA_EMAIL),
      GCP_SA_PRIVATE_KEY_set: Boolean(process.env.GCP_SA_PRIVATE_KEY),
    },
  });
}
