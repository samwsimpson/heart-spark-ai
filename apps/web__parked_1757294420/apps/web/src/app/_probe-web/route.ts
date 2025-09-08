export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, from: "apps/web/src/app/_probe-web" }),
    { headers: { "content-type": "application/json" } }
  );
}
