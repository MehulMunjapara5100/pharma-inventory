import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET() {
  const user = getAuthFromCookies();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user });
}
