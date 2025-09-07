import type { NextRequest } from "next/server";
type Segs = { path?: string[] };

export async function GET(_req: NextRequest, { params }: Segs) {
  return Response.json({ method: "GET", path: params.path ?? [] });
}
export async function POST(req: NextRequest, { params }: Segs) {
  const body = await req.text();
  return Response.json({ method: "POST", path: params.path ?? [], body });
}
