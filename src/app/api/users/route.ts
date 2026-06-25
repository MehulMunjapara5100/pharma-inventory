import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

function auth() {
  const c = cookies().get("pharma_token")?.value;
  return c ? verifyToken(c) : null;
}

export async function GET(req: NextRequest) {
  try {
    const me = auth();
    if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const filter: any = {};
    if (q) filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } }
    ];
    if (role) filter.role = role;
    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users: users.map((u: any) => ({ ...u, passwordHash: undefined })) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = auth();
    if (!me || me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await connectDB();
    const { name, email, password, role, phone } = await req.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    const passwordHash = await hashPassword(password);
    const u = await User.create({ name, email: email.toLowerCase(), passwordHash, role, phone });
    return NextResponse.json({ success: true, user: { ...u.toObject(), passwordHash: undefined } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
