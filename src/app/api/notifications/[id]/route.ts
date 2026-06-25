import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

function auth() {
  const c = cookies().get("pharma_token")?.value;
  return c ? verifyToken(c) : null;
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = auth();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    await Notification.findByIdAndUpdate(params.id, {
      $addToSet: { readBy: me.uid }
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
