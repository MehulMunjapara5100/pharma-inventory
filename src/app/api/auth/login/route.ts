import { NextRequest, NextResponse } from "next/server";
import dns from "dns";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

export async function POST(req: NextRequest) {
  try {
    // Re-assert public DNS resolvers before any SRV lookup that mongoose
    // will perform when connecting via mongodb+srv://. Some host DNS
    // stacks (corporate / ISP / VPN) refuse _mongodb._tcp.* queries,
    // causing `querySrv ECONNREFUSED`.
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    if (user.status !== "active") {
      return NextResponse.json({ error: `Account is ${user.status}. Contact administrator.` }, { status: 403 });
    }
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ uid: String(user._id), email: user.email, role: user.role, name: user.name });
    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      redirect: ROLE_HOME[user.role] || "/dashboard",
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
