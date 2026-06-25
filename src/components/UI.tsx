"use client";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone = "brand" }:
  { label: string; value: string | number; hint?: string; icon: ReactNode; tone?: "brand" | "mint" | "amber" | "rose" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    mint: "bg-mint-50 text-mint-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700"
  } as Record<string, string>;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-ink-900 mt-2">{value}</p>
      {hint && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-ink-100 text-ink-500 mx-auto flex items-center justify-center mb-3">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {message && <p className="text-sm text-ink-500 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-4 rounded bg-ink-100 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
