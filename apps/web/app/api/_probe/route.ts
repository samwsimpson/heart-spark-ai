export async function GET() {
  return Response.json({ ok: true, where: "app/api/_probe" });
}
