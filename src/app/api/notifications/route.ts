import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

function auth() {
  const c = cookies().get("pharma_token")?.value;
  return c ? verifyToken(c) : null;
}

export async function GET() {
  try {
    const me = auth();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const items = await Notification.find({
      $or: [
        { targetRoles: me.role },
        { targetUsers: me.uid }
      ]
    }).sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
