"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/UI";
import { useToast } from "@/components/Toast";

interface FormState {
  name: string; sku: string; barcode: string; category: string; manufacturer: string;
  batchNumber: string; expiryDate: string; purchasePrice: string; sellingPrice: string;
  quantity: string; minStockLevel: string; supplier: string; storageLocation: string; description: string;
}

const blank: FormState = {
  name: "", sku: "", barcode: "", category: "", manufacturer: "", batchNumber: "",
  expiryDate: "", purchasePrice: "", sellingPrice: "", quantity: "0", minStockLevel: "10",
  supplier: "", storageLocation: "", description: ""
};

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(blank);
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
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
    const e: Record<string, string> = {};
    if (!form.name) e.name = "Product name is required.";
    if (!form.sku) e.sku = "SKU is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required.";
    if (!form.purchasePrice || isNaN(+form.purchasePrice)) e.purchasePrice = "Enter a valid purchase price.";
    if (!form.sellingPrice || isNaN(+form.sellingPrice)) e.sellingPrice = "Enter a valid selling price.";
    if (form.quantity && isNaN(+form.quantity)) e.quantity = "Quantity must be a number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity || 0),
        minStockLevel: Number(form.minStockLevel || 10),
        images: images.map((url, i) => ({ url, isPrimary: i === 0 }))
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      toast.push({ type: "success", message: "Product added successfully" });
      router.push("/products");
    } catch (err: any) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Add new product" subtitle="Create a new item in your pharma catalog." />
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-6">
          <Section title="Basic details">
            <Grid>
              <Field label="Product name *" error={errors.name}>
                <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
              </Field>
              <Field label="SKU *" error={errors.sku}>
                <input className="input" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="PHAR-0001" />
              </Field>
              <Field label="Barcode">
                <input className="input" value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="8901234567890" />
              </Field>
              <Field label="Category *" error={errors.category}>
                <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Tablet, Syrup, etc." />
              </Field>
              <Field label="Manufacturer">
                <input className="input" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Cipla, Sun Pharma…" />
              </Field>
              <Field label="Batch number">
                <input className="input" value={form.batchNumber} onChange={(e) => set("batchNumber", e.target.value)} placeholder="BATCH-001" />
              </Field>
            </Grid>
          </Section>

          <Section title="Stock & pricing">
            <Grid>
              <Field label="Purchase price *" error={errors.purchasePrice}>
                <input className="input" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Selling price *" error={errors.sellingPrice}>
                <input className="input" value={form.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Quantity" error={errors.quantity}>
                <input className="input" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Min stock level">
                <input className="input" value={form.minStockLevel} onChange={(e) => set("minStockLevel", e.target.value)} placeholder="10" />
              </Field>
              <Field label="Supplier / vendor name">
                <input className="input" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Vendor name" />
              </Field>
              <Field label="Storage location">
                <input className="input" value={form.storageLocation} onChange={(e) => set("storageLocation", e.target.value)} placeholder="Aisle B, Shelf 3" />
              </Field>
            </Grid>
          </Section>

          <Section title="Description">
            <textarea className="input min-h-[100px]" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Notes, dosage, usage instructions…" />
          </Section>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-900 mb-3">Expiry & status</h3>
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
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs hidden group-hover:flex items-center justify-center"
                    aria-label="Remove"
                  >×</button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 mt-2">First image will be the primary thumbnail.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => router.push("/products")}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving…" : "Save product"}</button>
          </div>
        </div>
      </form>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-ink-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
