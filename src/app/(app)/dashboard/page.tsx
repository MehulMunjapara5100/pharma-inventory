import { Stat, PageHeader } from "@/components/UI";
import { getAuthFromCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { InventoryHistory } from "@/models/InventoryHistory";
import { formatCurrency, formatDateTime, daysUntil, statusBadge } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = getAuthFromCookies();
  await connectDB();
  const [products, sales, history] = await Promise.all([
    Product.find().lean(),
    Sale.find().sort({ createdAt: -1 }).limit(10).lean(),
    InventoryHistory.find().sort({ createdAt: -1 }).limit(8).lean()
  ]);

  const totals = {
    products: products.length,
    totalStock: products.reduce((a, p) => a + p.quantity, 0),
    stockValue: products.reduce((a, p) => a + p.quantity * p.purchasePrice, 0),
    salesValue: sales.reduce((a, s) => a + s.totalAmount, 0),
    lowStock: products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length,
    outOfStock: products.filter((p) => p.quantity <= 0).length,
    expired: products.filter((p) => new Date(p.expiryDate) < new Date()).length,
    nearExpiry: products.filter((p) => daysUntil(p.expiryDate) <= 30 && daysUntil(p.expiryDate) >= 0).length
  };

  const lowStockProducts = products
    .filter((p) => p.quantity <= p.minStockLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6);

  const expiryProducts = products
    .filter((p) => daysUntil(p.expiryDate) <= 60)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 6);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${me?.name?.split(" ")[0] || ""} 👋`}
        subtitle="Here's a snapshot of your pharmacy today."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total products" value={totals.products} hint={`${totals.totalStock} units in stock`} tone="brand"
          icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>} />
        <Stat label="Stock value" value={formatCurrency(totals.stockValue)} hint="At purchase price" tone="mint"
          icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M5 5h11a3 3 0 010 6H8a3 3 0 000 6h11"/></svg>} />
        <Stat label="Low stock" value={totals.lowStock + totals.outOfStock} hint={`${totals.outOfStock} out of stock`} tone="amber"
          icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.86l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.14l-8-14a2 2 0 00-3.4 0z"/></svg>} />
        <Stat label="Expiry alerts" value={totals.expired + totals.nearExpiry} hint={`${totals.expired} expired · ${totals.nearExpiry} ≤30d`} tone="rose"
          icon={<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 7v5l3 2"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Recent inventory updates</h2>
          </div>
          <div className="space-y-3">
            {history.length === 0 && <p className="text-sm text-ink-500">No inventory activity yet.</p>}
            {history.map((h: any) => (
              <div key={h._id} className="flex items-center gap-3 p-3 rounded-lg bg-ink-50/60">
                <div className="w-9 h-9 rounded-lg bg-white border border-ink-100 flex items-center justify-center text-brand-700">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v6H4zM4 14h16v6H4z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{h.productName}</p>
                  <p className="text-xs text-ink-500">{h.performedByName} · {h.action} · {formatDateTime(h.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">{h.previousQty} → {h.newQty}</p>
                  <p className={`text-xs ${h.changeQty >= 0 ? "text-mint-600" : "text-rose-600"}`}>{h.changeQty >= 0 ? "+" : ""}{h.changeQty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-4">Recent sales</h2>
          <div className="space-y-3">
            {sales.length === 0 && <p className="text-sm text-ink-500">No sales yet.</p>}
            {sales.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-ink-50/60">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{s.productName}</p>
                  <p className="text-xs text-ink-500">{s.soldByName} · {formatDateTime(s.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink-900">{formatCurrency(s.totalAmount)}</p>
                  <p className="text-xs text-ink-500">x{s.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Low stock alerts</h2>
            <span className="badge bg-amber-50 text-amber-700 border-amber-200">{lowStockProducts.length} items</span>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Product</th><th className="th">SKU</th><th className="th">Qty</th><th className="th">Status</th></tr></thead>
              <tbody>
                {lowStockProducts.map((p: any) => (
                  <tr key={p._id}>
                    <td className="td">{p.name}</td>
                    <td className="td font-mono text-xs">{p.sku}</td>
                    <td className="td">{p.quantity}</td>
                    <td className="td"><span className={`badge ${statusBadge(p.status)}`}>{(p.status || "unknown").replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && (
                  <tr><td className="td text-center text-ink-400" colSpan={4}>All products are well stocked 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">Expiry alerts</h2>
            <span className="badge bg-rose-50 text-rose-700 border-rose-200">{expiryProducts.length} items</span>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr><th className="th">Product</th><th className="th">Expiry</th><th className="th">Days left</th></tr></thead>
              <tbody>
                {expiryProducts.map((p: any) => (
                  <tr key={p._id}>
                    <td className="td">{p.name}</td>
                    <td className="td">{new Date(p.expiryDate).toLocaleDateString()}</td>
                    <td className="td">{daysUntil(p.expiryDate)}</td>
                  </tr>
                ))}
                {expiryProducts.length === 0 && (
                  <tr><td className="td text-center text-ink-400" colSpan={3}>No expiry concerns 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
