import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { InlineToast, type InlineToastTone } from "./InlineToast";

interface ToastState {
  id: number;
  message: string;
  tone: InlineToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: InlineToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, tone: InlineToastTone = "default") => {
    if (!message) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast({
      id: Date.now(),
      message,
      tone,
    });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeoutMs = toast.tone === "error" ? 4000 : 2500;

    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, timeoutMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <InlineToast message={toast.message} tone={toast.tone} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
