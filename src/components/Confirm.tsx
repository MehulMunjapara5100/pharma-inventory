"use client";
import { ReactNode, useState } from "react";

export function Confirm({
  trigger,
  title,
  message,
  onConfirm,
  confirmText = "Confirm",
  danger = false
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  message: ReactNode;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  danger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div className="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-soft w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
            <div className="text-sm text-ink-600 mt-2">{message}</div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button
                className={danger ? "btn-danger" : "btn-primary"}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onConfirm();
                    setOpen(false);
                  } finally { setBusy(false); }
                }}
              >
                {busy ? "Working…" : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
