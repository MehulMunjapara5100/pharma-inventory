"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/AuthUI";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", role: "seller" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) { setError("All fields are required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Registration failed");
      router.push("/login?registered=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-mint-600 via-brand-700 to-brand-800 text-white">
        <h1 className="text-4xl font-bold leading-tight max-w-md">Join Smience Life Science and take control of your inventory.</h1>
        <p className="mt-4 text-brand-50 max-w-md">Create an account for your team. Admins approve role-based access before activation.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-ink-900">Create your account</h2>
          <p className="text-ink-500 text-sm mt-1">Fill in the details below to get started</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Confirm</label>
                <input type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} className="input" placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className="label">I am a…</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)} className="input">
                <option value="seller">Seller</option>
                <option value="vendor">Vendor</option>
                <option value="manager">Manager</option>
              </select>
              <p className="text-xs text-ink-400 mt-1">Admin accounts are created by an existing administrator.</p>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : null} {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-ink-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
