"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Feature, LogoMark, Spinner } from "@/components/AuthUI";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ink-500">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("admin@pharmacare.test");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Login failed");
      const target = next || data.redirect || "/dashboard";
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-700 to-mint-700 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-mint-400/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <LogoMark className="w-10 h-10" />
            <span className="text-2xl font-semibold">PharmaCare</span>
          </div>
          <p className="mt-2 text-brand-100 text-sm">Smart pharmaceutical inventory & operations</p>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Manage stock, sales, and compliance in one place.</h1>
          <p className="text-brand-100">Real-time inventory sync, role-based access, expiry alerts, and audit-ready history for every batch.</p>
          <ul className="space-y-3 text-brand-50">
            <Feature>Multi-role access for Admin, Manager, Seller, Vendor</Feature>
            <Feature>Automatic low-stock & expiry notifications</Feature>
            <Feature>Full audit history of every stock movement</Feature>
          </ul>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} PharmaCare Inc.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <LogoMark className="w-9 h-9" />
            <span className="text-xl font-semibold text-ink-900">PharmaCare</span>
          </div>
          <h2 className="text-2xl font-semibold text-ink-900">Welcome back</h2>
          <p className="text-ink-500 text-sm mt-1">Sign in to continue to your dashboard</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-700 hover:underline">Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : null} {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-ink-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-700 font-medium hover:underline">Create one</Link>
          </p>

          <div className="mt-8 border-t border-ink-100 pt-6">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-3">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <DemoChip role="Admin" email="admin@pharmacare.test" />
              <DemoChip role="Manager" email="manager@pharmacare.test" />
              <DemoChip role="Seller" email="seller@pharmacare.test" />
              <DemoChip role="Vendor" email="vendor@pharmacare.test" />
            </div>
            <p className="text-xs text-ink-400 mt-2">Password for all demo accounts: <code className="font-mono">Demo@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoChip({ role, email }: { role: string; email: string }) {
  return (
    <div className="border border-ink-100 rounded-lg px-2 py-1.5 bg-ink-50/60">
      <p className="font-semibold text-ink-700">{role}</p>
      <p className="text-ink-500 truncate">{email}</p>
    </div>
  );
}
