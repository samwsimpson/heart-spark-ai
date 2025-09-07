export async function GET() {
  return Response.json({ status: "ok", from: "run-proxy/health" });
}
