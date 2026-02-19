import { NextResponse } from "next/server";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}
