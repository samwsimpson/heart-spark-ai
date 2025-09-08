export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(JSON.stringify({ ok: true, from: "root/api/ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
