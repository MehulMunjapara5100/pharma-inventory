import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { Notification } from "@/models/Notification";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!["seller", "vendor", "manager"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    await connectDB();
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      status: "pending"
    });

    await Notification.create({
      title: "New user registered",
      message: `${user.name} registered as a ${user.role} and is awaiting approval.`,
      type: "user",
      level: "info",
      targetRoles: ["admin"]
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
