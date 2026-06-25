import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { Notification } from "@/models/Notification";

function auth() {
  const c = cookies().get("pharma_token")?.value;
  return c ? verifyToken(c) : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = auth();
    if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const update: any = {};
    ["name", "phone", "role", "status"].forEach((k) => { if (k in body) update[k] = body[k]; });
    if (body.password) update.passwordHash = await hashPassword(body.password);
    const u = await User.findByIdAndUpdate(params.id, update, { new: true });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.status === "active") {
      await Notification.create({
        title: "Account approved",
        message: `${u.name}'s account has been activated.`,
        type: "user",
        level: "success",
        targetRoles: [u.role],
        targetUsers: [u._id]
      });
    }
    return NextResponse.json({ success: true, user: { ...u.toObject(), passwordHash: undefined } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = auth();
    if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (target.role === "admin") return NextResponse.json({ error: "Admin users cannot be deleted." }, { status: 400 });
    await User.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
