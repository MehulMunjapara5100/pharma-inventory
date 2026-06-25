import Link from "next/link";
import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ToastHost } from "@/components/Toast";
import { getAuthFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = getAuthFromCookies();
  if (!me) redirect("/login");

  let unread = 0;
  try {
    await connectDB();
    unread = await Notification.countDocuments({
      $or: [{ targetRoles: me.role }, { targetUsers: me.uid }],
      readBy: { $ne: me.uid }
    });
  } catch {}

  return (
    <div className="min-h-screen flex bg-ink-50">
      <Sidebar role={me.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={{ name: me.name, email: me.email, role: me.role }} unread={unread} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
        <footer className="px-6 py-4 text-xs text-ink-400 border-t border-ink-100 bg-white">
          © {new Date().getFullYear()} Smience Life Science · <Link href="#" className="hover:underline">Help</Link> · <Link href="#" className="hover:underline">Privacy</Link>
        </footer>
      </div>
      <ToastHost />
    </div>
  );
}
