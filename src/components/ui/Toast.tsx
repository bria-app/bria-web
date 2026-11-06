"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  /** Shows a «Deshacer» button; the toast stays longer so there is time to use it. */
  undo?: () => void;
  /** A second action, e.g. «Ver ficha». */
  action?: ToastAction;
}

interface ToastState extends ToastOptions {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(null);

const SHORT_MS = 2800;
const LONG_MS = 8000;

/** One toast at a time, top-center, announced politely to screen readers. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, ...options });
    const lasting = options.undo || options.action;
    timer.current = window.setTimeout(() => setToast(null), lasting ? LONG_MS : SHORT_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = (fn?: () => void) => () => {
    dismiss();
    fn?.();
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className="toast-in pointer-events-auto flex max-w-xl items-center gap-3 rounded-2xl bg-strong py-2.5 pl-4 pr-2.5 text-sm font-semibold text-strong-foreground shadow-soft-xl"
          >
            <span className="min-w-0 break-words">{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={run(toast.undo)}
                className="h-8 shrink-0 rounded-lg border border-strong-foreground/60 px-3 text-[13px] font-bold transition-opacity hover:opacity-80 focus-visible:outline-accent-on-strong"
              >
                Deshacer
              </button>
            )}
            {toast.action && (
              <button
                type="button"
                onClick={run(toast.action.onClick)}
                className="h-8 shrink-0 whitespace-nowrap rounded-lg bg-primary px-3 text-[13px] font-bold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-accent-on-strong"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
