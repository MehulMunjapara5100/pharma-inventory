"use client";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/UI";
import { formatDateTime, daysUntil, statusBadge } from "@/lib/utils";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/inventory").then((r) => r.json())
      ]);
      setProducts(p.products || []);
      setHistory(h.items || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Stock levels and full audit trail of every change."
        actions={
          <div className="flex gap-1 p-1 rounded-lg bg-ink-100">
            <button onClick={() => setTab("stock")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "stock" ? "bg-white shadow-card text-ink-900" : "text-ink-500"}`}>Stock levels</button>
            <button onClick={() => setTab("history")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "history" ? "bg-white shadow-card text-ink-900" : "text-ink-500"}`}>History</button>
          </div>
        }
      />

      <div className="card p-4 mb-4">
        <div className="relative">
          <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input className="input pl-9" placeholder="Search by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-ink-400">Loading…</div>
      ) : tab === "stock" ? (
        <div className="card">
          {filtered.length === 0 ? (
            <EmptyState title="No products found" message="Try adjusting your search or add a new product." />
          ) : (
            <div className="table-wrap rounded-xl border-0 shadow-none">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th">Product</th><th className="th">SKU</th><th className="th">Quantity</th><th className="th">Min level</th><th className="th">Expiry</th><th className="th">Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-ink-50/50">
                      <td className="td"><p className="font-medium text-ink-900">{p.name}</p><p className="text-xs text-ink-500">{p.manufacturer}</p></td>
                      <td className="td font-mono text-xs">{p.sku}</td>
                      <td className="td"><span className="font-semibold">{p.quantity}</span></td>
                      <td className="td">{p.minStockLevel}</td>
                      <td className="td">{new Date(p.expiryDate).toLocaleDateString()} <span className="text-xs text-ink-400 ml-1">({daysUntil(p.expiryDate)}d)</span></td>
                      <td className="td"><span className={`badge ${statusBadge(p.status)}`}>{(p.status || "unknown").replace(/_/g, " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          {history.length === 0 ? (
            <EmptyState title="No inventory history" message="Changes to stock will appear here." />
          ) : (
            <div className="table-wrap rounded-xl border-0 shadow-none">
              <table className="w-full text-sm">
                <thead><tr>
                  <th className="th">When</th><th className="th">Product</th><th className="th">Action</th><th className="th">By</th><th className="th">Change</th><th className="th">Before → After</th><th className="th">Note</th>
                </tr></thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h._id} className="hover:bg-ink-50/50">
                      <td className="td whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                      <td className="td"><p className="font-medium text-ink-900">{h.productName}</p><p className="text-xs text-ink-500">{h.sku}</p></td>
                      <td className="td"><span className="badge bg-ink-50 text-ink-700 border-ink-200">{h.action}</span></td>
                      <td className="td">{h.performedByName}<p className="text-xs text-ink-500">{h.performedByRole}</p></td>
                      <td className="td"><span className={h.changeQty >= 0 ? "text-mint-600 font-semibold" : "text-rose-600 font-semibold"}>{h.changeQty >= 0 ? "+" : ""}{h.changeQty}</span></td>
                      <td className="td">{h.previousQty} → {h.newQty}</td>
                      <td className="td text-ink-500">{h.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
