"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/roles";

type NavItem = { href: string; label: string; icon: JSX.Element; roles: Role[] };

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Icon("M3 12l9-9 9 9M5 10v10h14V10"), roles: ["admin", "manager", "seller", "vendor"] },
  { href: "/products", label: "Products", icon: Icon("M4 7h16M4 12h16M4 17h10"), roles: ["admin", "manager", "seller", "vendor"] },
  { href: "/inventory", label: "Inventory", icon: Icon("M4 4h16v6H4zM4 14h16v6H4z"), roles: ["admin", "manager", "seller", "vendor"] },
  { href: "/sales", label: "Sales / Stock Update", icon: Icon("M3 6h18l-2 12H5zM9 10v4M15 10v4"), roles: ["admin", "manager", "seller", "vendor"] },
  { href: "/users", label: "Users", icon: Icon("M16 11a4 4 0 100-8 4 4 0 000 8zM2 21a8 8 0 0116 0"), roles: ["admin"] },
  { href: "/notifications", label: "Notifications", icon: Icon("M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.6L4 17h5"), roles: ["admin", "manager", "seller", "vendor"] },
  { href: "/reports", label: "Reports", icon: Icon("M4 4v16h16M8 16V8M12 16V4M16 16v-6"), roles: ["admin", "manager"] },
  { href: "/settings", label: "Settings", icon: Icon("M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v.1a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"), roles: ["admin", "manager"] }
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = items.filter((i) => i.roles.includes(role));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 bg-white border border-ink-200 rounded-lg p-2 shadow-card"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-ink-100 transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-ink-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex w-9 h-9 rounded-lg bg-brand-600 text-white items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 6h6M12 3v18M3 12h18" /></svg>
            </span>
            <div className="leading-tight">
              <p className="font-semibold text-ink-900">PharmaCare</p>
              <p className="text-[11px] uppercase tracking-wider text-ink-400">{role} workspace</p>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-ink-500 hover:text-ink-700">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-72px)]">
          {visible.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-ink-50"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-ink-900/30 z-30 lg:hidden" />}
    </>
  );
}

function Icon(d: string) {
  return <path d={d} />;
}
