export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }});
}

export async function GET(_req: Request, ctx: { params: { path?: string[] } }) {
  return Response.json({ ok: true, handler: 'GET', path: ctx.params?.path ?? [] });
}

export async function POST(req: Request, ctx: { params: { path?: string[] } }) {
  const body = await req.text();
  return Response.json({ ok: true, handler: 'POST', path: ctx.params?.path ?? [], body });
}

export async function PUT(req: Request, ctx: { params: { path?: string[] } }) {
  const body = await req.text();
  return Response.json({ ok: true, handler: 'PUT', path: ctx.params?.path ?? [], body });
}

export async function PATCH(req: Request, ctx: { params: { path?: string[] } }) {
  const body = await req.text();
  return Response.json({ ok: true, handler: 'PATCH', path: ctx.params?.path ?? [], body });
}

export async function DELETE(_req: Request, ctx: { params: { path?: string[] } }) {
  return Response.json({ ok: true, handler: 'DELETE', path: ctx.params?.path ?? [] });
}
