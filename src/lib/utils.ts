export function formatCurrency(value: number, currency = "USD") {
  if (Number.isNaN(value)) value = 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatDate(d: Date | string | undefined | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(d: Date | string | undefined | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export function daysUntil(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired: "bg-red-50 text-red-700 border-red-200",
    low_stock: "bg-amber-50 text-amber-700 border-amber-200",
    out_of_stock: "bg-rose-50 text-rose-700 border-rose-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200"
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
}
