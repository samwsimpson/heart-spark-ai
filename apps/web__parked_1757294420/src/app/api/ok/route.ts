export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, from: "src/app/api/ok" }),
    { headers: { "content-type": "application/json" } }
  );
}
