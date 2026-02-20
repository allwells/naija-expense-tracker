import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET(): NextResponse {
  return NextResponse.json({ ok: true });
}

export function HEAD(): NextResponse {
  return new NextResponse(null, { status: 200 });
}
