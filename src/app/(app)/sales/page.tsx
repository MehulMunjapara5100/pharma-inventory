"use client";
import { useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "@/components/UI";
import { useToast } from "@/components/Toast";
import { formatCurrency, daysUntil } from "@/lib/utils";

export default function SalesPage() {
  const toast = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"sell" | "adjust">("sell");

  async function load() {
    const [p, s] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/sales").then((r) => r.json())
    ]);
    setProducts(p.products || []);
    setSales(s.items || []);
  }
  useEffect(() => { load(); }, []);

  const results = useMemo(() => {
    if (!q.trim()) return products.slice(0, 8);
    const s = q.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)).slice(0, 20);
  }, [q, products]);

  async function recordSale() {
    if (!selected) return toast.push({ type: "error", message: "Please select a product." });
    const qty = Math.max(1, parseInt(quantity || "0", 10));
    if (qty <= 0) return toast.push({ type: "error", message: "Enter a valid quantity." });
    if (selected.quantity < qty) return toast.push({ type: "error", message: `Only ${selected.quantity} in stock.` });
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selected._id, quantity: qty, paymentMethod, customerName, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record sale");
      toast.push({ type: "success", message: `Sale recorded — ${formatCurrency(data.sale.totalAmount)}` });
      setSelected(null); setQuantity("1"); setCustomerName(""); setNote("");
      load();
    } catch (e: any) {
      toast.push({ type: "error", message: e.message });
    } finally { setLoading(false); }
  }

  async function adjustStock() {
    if (!selected) return toast.push({ type: "error", message: "Please select a product." });
    const delta = parseInt(stockAdjustment || "0", 10);
    if (!delta) return toast.push({ type: "error", message: "Enter a non-zero adjustment." });
    if (!adjustReason.trim()) return toast.push({ type: "error", message: "Add a reason for the adjustment." });
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selected._id, changeQty: delta, action: "adjustment", note: adjustReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");
      toast.push({ type: "success", message: "Stock updated" });
      setStockAdjustment(""); setAdjustReason(""); setSelected(null);
      load();
    } catch (e: any) {
      toast.push({ type: "error", message: e.message });
    } finally { setLoading(false); }
  }

  return (
    <>
      <PageHeader title="Sales & Stock Updates" subtitle="Record sales or adjust stock with full audit trail." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex gap-1 p-1 rounded-lg bg-ink-100 w-fit mb-4">
              <button onClick={() => setTab("sell")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "sell" ? "bg-white shadow-card text-ink-900" : "text-ink-500"}`}>Record sale</button>
              <button onClick={() => setTab("adjust")} className={`px-3 py-1.5 text-sm rounded-md ${tab === "adjust" ? "bg-white shadow-card text-ink-900" : "text-ink-500"}`}>Stock adjustment</button>
            </div>

            <div className="relative">
              <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input className="input pl-9" placeholder="Search product by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-h-[420px] overflow-y-auto">
              {results.length === 0 && (
                <div className="col-span-2 text-sm text-ink-400 text-center py-10">No products match.</div>
              )}
              {results.map((p) => (
                <button key={p._id}
                  onClick={() => setSelected(p)}
                  className={`text-left p-3 rounded-lg border transition flex items-center gap-3 ${
                    selected?._id === p._id ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-ink-300 bg-white"
                  }`}>
                  <div className="w-10 h-10 rounded-md bg-ink-100 overflow-hidden flex items-center justify-center text-ink-400">
                    {p.images?.[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : "💊"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900 truncate">{p.name}</p>
                    <p className="text-xs text-ink-500">{p.sku} · {p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-900">{p.quantity} left</p>
                    <p className="text-xs text-ink-500">${p.sellingPrice.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-900 mb-3">Recent sales</h3>
            {sales.length === 0 ? (
              <EmptyState title="No sales yet" message="Completed sales will show up here." />
            ) : (
              <div className="table-wrap rounded-xl border-0 shadow-none">
                <table className="w-full text-sm">
                  <thead><tr><th className="th">When</th><th className="th">Product</th><th className="th">Qty</th><th className="th">Total</th><th className="th">By</th></tr></thead>
                  <tbody>
                    {sales.slice(0, 20).map((s: any) => (
                      <tr key={s._id} className="hover:bg-ink-50/50">
                        <td className="td whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="td">{s.productName}</td>
                        <td className="td">{s.quantity}</td>
                        <td className="td font-semibold">{formatCurrency(s.totalAmount)}</td>
                        <td className="td">{s.soldByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <h3 className="font-semibold text-ink-900">
              {tab === "sell" ? "Sale details" : "Stock adjustment"}
            </h3>
            {!selected ? (
              <p className="text-sm text-ink-500 mt-3">Select a product from the list to begin.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-ink-50 p-3">
                  <p className="font-medium text-ink-900">{selected.name}</p>
                  <p className="text-xs text-ink-500">{selected.sku} · {selected.category}</p>
                  <p className="text-sm mt-2">Available: <strong>{selected.quantity}</strong> · Price: <strong>${selected.sellingPrice.toFixed(2)}</strong></p>
                  <p className="text-[11px] text-ink-400">Expires in {daysUntil(selected.expiryDate)}d</p>
                </div>

                {tab === "sell" ? (
                  <>
                    <div>
                      <label className="label">Quantity sold</label>
                      <input type="number" min={1} className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Customer name</label>
                      <input className="input" placeholder="Walk-in customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Payment method</label>
                      <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Note (optional)</label>
                      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. prescription #1234" />
                    </div>
                    <div className="rounded-lg bg-brand-50 border border-brand-100 p-3 text-sm">
                      <p className="text-ink-700">Total: <strong>${(Number(quantity || 0) * selected.sellingPrice).toFixed(2)}</strong></p>
                    </div>
                    <button disabled={loading} onClick={recordSale} className="btn-primary w-full">{loading ? "Saving…" : "Complete sale"}</button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="label">Quantity change</label>
                      <input type="number" className="input" value={stockAdjustment} onChange={(e) => setStockAdjustment(e.target.value)} placeholder="Use negative to reduce" />
                      <p className="text-xs text-ink-400 mt-1">e.g. +50 for new stock received, -2 for damaged.</p>
                    </div>
                    <div>
                      <label className="label">Reason / note *</label>
                      <input className="input" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Vendor delivery, audit, damage…" />
                    </div>
                    <button disabled={loading} onClick={adjustStock} className="btn-primary w-full">{loading ? "Saving…" : "Submit update"}</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
