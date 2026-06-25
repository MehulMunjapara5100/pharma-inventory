"use client";
import type { ReactNode } from "react";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Feature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex w-5 h-5 rounded-full bg-white/20 items-center justify-center">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
