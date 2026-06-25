"use client";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/UI";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setItems(data.items || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    load();
  }

  return (
    <>
      <PageHeader title="Notifications" subtitle="Stay updated on inventory changes, alerts, and approvals." />
      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-ink-400">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState title="You're all caught up" message="No notifications yet." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((n: any) => {
              const levelColor = ({
                info: "bg-brand-500", success: "bg-mint-500", warning: "bg-amber-500", error: "bg-red-500"
              } as Record<string, string>)[n.level] || "bg-ink-400";
              return (
                <li key={n._id} className="p-4 flex items-start gap-3 hover:bg-ink-50/50">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ${levelColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink-900">{n.title}</p>
                      <span className="badge bg-ink-50 text-ink-600 border-ink-200">{(n.type || "info").replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-ink-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-ink-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <button onClick={() => markRead(n._id)} className="text-xs font-medium text-brand-700 hover:underline">Mark as read</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
