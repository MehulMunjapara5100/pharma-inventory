"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/roles";

interface Props {
  user: { name: string; email: string; role: Role };
  unread: number;
}

export function Topbar({ user, unread }: Props) {
  const router = useRouter();
  const [openNotif, setOpenNotif] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadNotifs() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
  }

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 20000);
    return () => clearInterval(t);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    loadNotifs();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    router.push(`/products${params}`);
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-ink-100">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
        <div className="lg:hidden w-9" />
        <form onSubmit={onSearch} className="flex-1 max-w-xl relative">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, SKU, category…"
            className="input pl-9 pr-4"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button onClick={() => setOpenNotif((v) => !v)} className="relative btn-ghost p-2" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.6L4 17h5" /><path d="M9 17a3 3 0 006 0" /></svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">{unread}</span>
              )}
            </button>
            {openNotif && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-auto rounded-xl border border-ink-100 bg-white shadow-soft">
                <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                  <p className="font-semibold text-ink-900 text-sm">Notifications</p>
                  <Link href="/notifications" className="text-xs text-brand-700 hover:underline">View all</Link>
                </div>
                <div className="divide-y divide-ink-100">
                  {items.length === 0 && (
                    <div className="px-4 py-6 text-sm text-ink-400 text-center">No notifications yet.</div>
                  )}
                  {items.map((n: any) => (
                    <button key={n._id} onClick={() => markRead(n._id)} className="w-full text-left px-4 py-3 hover:bg-ink-50">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full ${levelColor(n.level)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{n.title}</p>
                          <p className="text-xs text-ink-500 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-ink-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setOpenMenu((v) => !v)} className="flex items-center gap-2 btn-secondary py-1.5">
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">{initials}</span>
              <span className="hidden sm:inline text-sm">{user.name}</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {openMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-100 bg-white shadow-soft py-1">
                <div className="px-4 py-2 border-b border-ink-100">
                  <p className="text-sm font-semibold text-ink-900 truncate">{user.name}</p>
                  <p className="text-xs text-ink-500 truncate">{user.email}</p>
                  <p className="text-[10px] uppercase tracking-wide text-brand-700 mt-1">{user.role}</p>
                </div>
                <Link href="/settings" className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50">Settings</Link>
                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function levelColor(level: string) {
  return ({
    info: "bg-brand-500",
    success: "bg-mint-500",
    warning: "bg-amber-500",
    error: "bg-red-500"
  } as Record<string, string>)[level] || "bg-ink-400";
}
