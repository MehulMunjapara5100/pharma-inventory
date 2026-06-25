"use client";
import { useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/AuthUI";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } finally {
      setLoading(false);
      setDone(true);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-brand-700 to-mint-700 text-white">
        <h1 className="text-4xl font-bold max-w-md">Forgot your password?</h1>
        <p className="mt-4 text-brand-100 max-w-md">Enter the email associated with your account. We&apos;ll send you a secure link to reset your password.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-ink-900">Reset password</h2>
          <p className="text-ink-500 text-sm mt-1">We&apos;ll email you a secure reset link.</p>

          {done ? (
            <div className="mt-8 rounded-lg border border-mint-200 bg-mint-50 text-mint-800 px-4 py-3 text-sm">
              If an account exists for <strong>{email}</strong>, you will receive a reset link shortly.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner /> : null} {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="text-sm text-ink-500 mt-6">
            Remembered your password?{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
