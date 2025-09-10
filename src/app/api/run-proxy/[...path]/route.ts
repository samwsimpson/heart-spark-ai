export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "authorization,content-type",
    },
  });
}

export async function GET(_req: Request, ctx: { params: { path?: string[] } }) {
  return Response.json({ ok: true, method: "GET", path: ctx.params?.path ?? [] });
}

export async function POST(req: Request, ctx: { params: { path?: string[] } }) {
  const body = await req.text();
  return Response.json({ ok: true, method: "POST", path: ctx.params?.path ?? [], body });
}
