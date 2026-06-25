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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
                  <LogoMark className="h-10 w-auto brightness-0 invert" />
            <span className="text-2xl font-semibold">Smience Life Science</span>
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
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} Smience Life Science Inc.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-ink-50 via-white to-brand-50/40 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-200/40 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-mint-200/40 blur-3xl pointer-events-none" />

              <div className="relative w-full max-w-md">
                <div className="lg:hidden mb-6 flex items-center gap-2">
                                  <LogoMark className="h-9 w-auto" />
                  <span className="text-xl font-semibold text-ink-900">Smience Life Science</span>
                </div>

                <div className="rounded-2xl bg-white/80 backdrop-blur border border-ink-100 shadow-soft p-7 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-mint-600 items-center justify-center text-white shadow-card">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-ink-900 leading-tight">Welcome back</h2>
                      <p className="text-xs text-ink-500">Sign in to your dashboard</p>
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="label">Email address</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="M3 7l9 6 9-6" />
                          </svg>
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input pl-9"
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="label mb-0">Password</label>
                        <Link href="/forgot-password" className="text-xs text-brand-700 hover:underline">Forgot password?</Link>
                      </div>
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="11" width="16" height="9" rx="2" />
                            <path d="M8 11V7a4 4 0 018 0v4" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input pl-9 pr-10"
                          placeholder="••••••••"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 3l18 18" />
                              <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                              <path d="M16.7 16.7C15 17.7 13.5 18 12 18c-4 0-8-4-9-6 0-1 1.5-3 3.5-4.5" />
                              <path d="M9.9 5.1A10 10 0 0112 5c4 0 8 4 9 6-.3.6-.9 1.5-1.7 2.4" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 text-xs text-ink-600 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                        />
                        Remember me
                      </label>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                      {loading ? <Spinner /> : null}
                      {loading ? "Signing in…" : "Sign in"}
                    </button>
                  </form>

                  <p className="text-sm text-ink-500 mt-5 text-center">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-brand-700 font-medium hover:underline">Create one</Link>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-ink-400">
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="11" width="16" height="9" rx="2" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                    SSL secured
                  </span>
                  <span className="h-3 w-px bg-ink-200" />
                  <span>© {new Date().getFullYear()} Smience Life Science</span>
                </div>
              </div>
            </div>
    </div>
      );
    }
