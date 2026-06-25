"use client";
import { useEffect, useState } from "react";
import { PageHeader, EmptyState } from "@/components/UI";
import { formatCurrency, formatDateTime, daysUntil, statusBadge } from "@/lib/utils";

type Kind = "sales" | "stock" | "low-stock" | "expiry" | "users";

const kinds: { key: Kind; label: string; description: string }[] = [
  { key: "sales", label: "Sales report", description: "All recorded sales" },
  { key: "stock", label: "Stock report", description: "Complete stock on hand" },
  { key: "low-stock", label: "Low stock report", description: "Items at or below threshold" },
  { key: "expiry", label: "Expiry report", description: "Expiring within 60 days" },
  { key: "users", label: "User activity", description: "Recent users" }
];

export default function ReportsPage() {
  const [kind, setKind] = useState<Kind>("sales");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(k: Kind) {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?kind=${k}`);
      const data = await res.json();
      setRows(data.rows || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(kind); }, [kind]);

  function downloadCsv() {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]).filter((k) => k !== "__v");
    const csv = [keys.join(",")].concat(
      rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${kind}-report.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Detailed insights for sales, stock, expiry and user activity."
        actions={<button onClick={downloadCsv} className="btn-secondary">Export CSV</button>}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {kinds.map((k) => (
          <button
            key={k.key}
            onClick={() => setKind(k.key)}
            className={`px-3 py-2 rounded-lg text-sm border transition ${
              kind === k.key ? "bg-brand-600 text-white border-brand-600 shadow-card" : "bg-white border-ink-200 hover:bg-ink-50 text-ink-700"
            }`}
          >{k.label}</button>
        ))}
      </div>

      <p className="text-sm text-ink-500 mb-3">{kinds.find((k) => k.key === kind)?.description} · {rows.length} rows</p>

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-ink-400">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No data yet" message="Records will appear here as activity occurs." />
        ) : (
          <div className="table-wrap rounded-xl border-0 shadow-none">
            {kind === "sales" && <SalesTable rows={rows} />}
            {kind === "stock" && <StockTable rows={rows} />}
            {kind === "low-stock" && <StockTable rows={rows} />}
            {kind === "expiry" && <ExpiryTable rows={rows} />}
            {kind === "users" && <UsersTable rows={rows} />}
          </div>
        )}
      </div>
    </>
  );
}

function SalesTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th className="th">When</th><th className="th">Product</th><th className="th">SKU</th><th className="th">Qty</th><th className="th">Unit</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Customer</th><th className="th">Sold by</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-ink-50/50">
            <td className="td whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
            <td className="td">{r.productName}</td>
            <td className="td font-mono text-xs">{r.sku}</td>
            <td className="td">{r.quantity}</td>
            <td className="td">{formatCurrency(r.unitPrice)}</td>
            <td className="td font-semibold">{formatCurrency(r.totalAmount)}</td>
            <td className="td">{r.paymentMethod}</td>
            <td className="td">{r.customerName || "Walk-in"}</td>
            <td className="td">{r.soldByName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StockTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th">Category</th><th className="th">Qty</th><th className="th">Min</th><th className="th">Selling</th><th className="th">Expiry</th><th className="th">Status</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-ink-50/50">
            <td className="td">{r.name}</td>
            <td className="td font-mono text-xs">{r.sku}</td>
            <td className="td">{r.category}</td>
            <td className="td font-semibold">{r.quantity}</td>
            <td className="td">{r.minStockLevel}</td>
            <td className="td">{formatCurrency(r.sellingPrice)}</td>
            <td className="td">{new Date(r.expiryDate).toLocaleDateString()}</td>
            <td className="td"><span className={`badge ${statusBadge(r.status)}`}>{(r.status || "unknown").replace(/_/g, " ")}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExpiryTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th">Qty</th><th className="th">Expiry</th><th className="th">Days left</th><th className="th">Status</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-ink-50/50">
            <td className="td">{r.name}</td>
            <td className="td font-mono text-xs">{r.sku}</td>
            <td className="td">{r.quantity}</td>
            <td className="td">{new Date(r.expiryDate).toLocaleDateString()}</td>
            <td className="td">{daysUntil(r.expiryDate)}</td>
            <td className="td"><span className={`badge ${statusBadge(r.status)}`}>{(r.status || "unknown").replace(/_/g, " ")}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersTable({ rows }: { rows: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Status</th><th className="th">Joined</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r._id} className="hover:bg-ink-50/50">
            <td className="td">{r.name}</td>
            <td className="td">{r.email}</td>
            <td className="td">{r.role}</td>
            <td className="td">{r.status}</td>
            <td className="td">{formatDateTime(r.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
