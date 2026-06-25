import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  // In production, send a tokenized email link.
  return NextResponse.json({ success: true, message: `If an account exists for ${email || "your email"}, a reset link was sent.` });
}
