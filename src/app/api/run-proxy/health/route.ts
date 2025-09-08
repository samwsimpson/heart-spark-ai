export const runtime = "nodejs";
export function GET() {
  return Response.json({ status: "ok", from: "root/src/app/api/run-proxy/health" });
}
