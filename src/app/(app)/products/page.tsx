"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/UI";
import { statusBadge } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { Confirm } from "@/components/Confirm";

interface Product {
  _id: string; name: string; sku: string; category: string; manufacturer: string;
  expiryDate: string; quantity: number; sellingPrice: number; status: string;
  images?: { url: string }[];
}

export default function ProductsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (category) params.set("category", category);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setItems(data.products || []);
    } catch (e: any) {
      toast.push({ type: "error", message: e.message });
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [status, category]);

  const categories = Array.from(new Set(items.map((p) => p.category))).filter(Boolean);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Manage medicines, medical supplies, and equipment."
        actions={
          <Link href="/products/new" className="btn-primary">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Add product
          </Link>
        }
      />

      <div className="card p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input className="input pl-9" placeholder="Search by name, SKU, or manufacturer…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="expired">Expired</option>
          </select>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-ink-400">Loading products…</div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No products yet"
            message="Get started by adding your first product to the catalog."
            action={<Link href="/products/new" className="btn-primary">Add product</Link>}
          />
        ) : (
          <div className="table-wrap rounded-xl border-0 shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Product</th>
                  <th className="th">SKU</th>
                  <th className="th">Category</th>
                  <th className="th">Qty</th>
                  <th className="th">Selling price</th>
                  <th className="th">Expiry</th>
                  <th className="th">Status</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id} className="hover:bg-ink-50/50">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-ink-100 overflow-hidden flex items-center justify-center">
                          {p.images && p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                          ) : <PillIcon />}
                        </div>
                        <div>
                          <p className="font-medium text-ink-900">{p.name}</p>
                          <p className="text-xs text-ink-500">{p.manufacturer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td font-mono text-xs">{p.sku}</td>
                    <td className="td">{p.category}</td>
                    <td className="td">{p.quantity}</td>
                    <td className="td">${p.sellingPrice.toFixed(2)}</td>
                    <td className="td">{new Date(p.expiryDate).toLocaleDateString()}</td>
                    <td className="td">
                      <span className={`badge ${statusBadge(p.status)}`}>
                        {(p.status || "unknown").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/products/${p._id}`} className="text-brand-700 text-xs font-medium hover:underline">Edit</Link>
                        <Confirm
                          trigger={(open) => (
                            <button onClick={open} className="text-red-600 text-xs font-medium hover:underline">Delete</button>
                          )}
                          title="Delete product?"
                          message={<>This will permanently delete <strong>{p.name}</strong> and remove its inventory history.</>}
                          confirmText="Delete"
                          danger
                          onConfirm={async () => {
                            const res = await fetch(`/api/products/${p._id}`, { method: "DELETE" });
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}));
                              toast.push({ type: "error", message: data.error || "Delete failed" });
                              return;
                            }
                            toast.push({ type: "success", message: "Product deleted" });
                            load();
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function PillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M12 9v6" />
    </svg>
  );
}
