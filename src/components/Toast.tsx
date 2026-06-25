"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { id: number; type: "success" | "error" | "info"; message: string };
const Ctx = createContext<{ push: (t: Omit<Toast, "id">) => void }>({ push: () => {} });

export function useToast() { return useContext(Ctx); }

let counter = 1;

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = counter++;
    setItems((prev) => [...prev, { id, ...t }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3500);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto card px-4 py-3 text-sm shadow-soft border-l-4 ${
              t.type === "success" ? "border-mint-500" :
              t.type === "error" ? "border-red-500" :
              "border-brand-500"
            } animate-[fadeIn_.2s_ease-out]`}
          >
            <p className="font-medium text-ink-900">{t.message}</p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
