"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/UI";
import { useToast } from "@/components/Toast";

interface FormState {
  name: string; sku: string; barcode: string; category: string; manufacturer: string;
  batchNumber: string; expiryDate: string; purchasePrice: string; sellingPrice: string;
  quantity: string; minStockLevel: string; supplier: string; storageLocation: string; description: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState | null>(null);
  const [originalQty, setOriginalQty] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load product");
        const p = data.product;
        setForm({
          name: p.name || "", sku: p.sku || "", barcode: p.barcode || "", category: p.category || "",
          manufacturer: p.manufacturer || "", batchNumber: p.batchNumber || "",
          expiryDate: new Date(p.expiryDate).toISOString().slice(0, 10),
          purchasePrice: String(p.purchasePrice), sellingPrice: String(p.sellingPrice),
          quantity: String(p.quantity), minStockLevel: String(p.minStockLevel),
          supplier: p.supplier || "", storageLocation: p.storageLocation || "", description: p.description || ""
        });
        setOriginalQty(p.quantity);
        setImages((p.images || []).map((i: any) => i.url));
      } catch (e: any) {
        toast.push({ type: "error", message: e.message });
      } finally { setPageLoading(false); }
    })();
  }, [params.id]);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((s) => s ? { ...s, [k]: v } : s);
  }

  async function uploadFiles(files: FileList | File[]) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.urls) setImages((prev) => [...prev, ...data.urls]);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  function validate() {
    if (!form) return false;
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Product name is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required.";
    if (!form.purchasePrice || isNaN(+form.purchasePrice)) e.purchasePrice = "Enter a valid purchase price.";
    if (!form.sellingPrice || isNaN(+form.sellingPrice)) e.sellingPrice = "Enter a valid selling price.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity || 0),
        minStockLevel: Number(form.minStockLevel || 10),
        images: images.map((url, i) => ({ url, isPrimary: i === 0 })),
        note: Number(form.quantity) !== originalQty ? note || "Manual edit" : undefined
      };
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      toast.push({ type: "success", message: "Product updated" });
      router.push("/products");
    } catch (err: any) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) return <div className="card p-10 text-center text-ink-400">Loading product…</div>;
  if (!form) return null;

  const qtyChanged = Number(form.quantity) !== originalQty;

  return (
    <>
      <PageHeader title="Edit product" subtitle={`Editing ${form.name}`} />
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-6">
          <Section title="Basic details">
            <Grid>
              <Field label="Product name *" error={errors.name}>
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="SKU">
                <input className="input bg-ink-50" value={form.sku} disabled />
              </Field>
              <Field label="Barcode">
                <input className="input" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} />
              </Field>
              <Field label="Category *" error={errors.category}>
                <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Manufacturer">
                <input className="input" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} />
              </Field>
              <Field label="Batch number">
                <input className="input" value={form.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} />
              </Field>
            </Grid>
          </Section>

          <Section title="Stock & pricing">
            <Grid>
              <Field label="Purchase price *" error={errors.purchasePrice}>
                <input className="input" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} />
              </Field>
              <Field label="Selling price *" error={errors.sellingPrice}>
                <input className="input" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} />
              </Field>
              <Field label={`Quantity ${qtyChanged ? "(changing)" : ""}`}>
                <input className="input" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </Field>
              <Field label="Min stock level">
                <input className="input" value={form.minStockLevel} onChange={(e) => set("minStockLevel", e.target.value)} />
              </Field>
              <Field label="Supplier / vendor name">
                <input className="input" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} />
              </Field>
              <Field label="Storage location">
                <input className="input" value={form.storageLocation} onChange={(e) => set("storageLocation", e.target.value)} />
              </Field>
            </Grid>
          </Section>

          {qtyChanged && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Stock changing from {originalQty} → {Number(form.quantity)}</p>
              <p className="text-xs text-amber-700 mt-1">A history entry will be created automatically.</p>
              <input className="input mt-2" placeholder="Reason / note for this change" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          )}

          <Section title="Description">
            <textarea className="input min-h-[100px]" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Section>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-900 mb-3">Expiry</h3>
            <Field label="Expiry date *" error={errors.expiryDate}>
              <input type="date" className="input" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
            </Field>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-ink-900 mb-3">Product images</h3>
            <div className="relative">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`dropzone rounded-lg border-2 border-dashed p-6 text-center transition ${dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50/40"}`}
              >
                <p className="text-sm font-medium text-ink-700">Drag &amp; drop images</p>
                <p className="text-xs text-ink-400">or click to browse</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((url, i) => (
                <div key={url + i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Product" className="w-full h-20 object-cover rounded-md border border-ink-200" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs hidden group-hover:flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => router.push("/products")}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="font-semibold text-ink-900 mb-3">{title}</h3>{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <div><label className="label">{label}</label>{children}{error && <p className="text-xs text-red-600 mt-1">{error}</p>}</div>;
}
