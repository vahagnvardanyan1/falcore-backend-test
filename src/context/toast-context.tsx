"use client";

import { createContext, useCallback, useContext, useState } from "react";

import type { ApiErrorDetails } from "@/lib/api-error";
import { extractApiError, formatErrorMessage } from "@/lib/api-error";

export interface ToastItem {
  id: number;
  message: string;
  details: ApiErrorDetails | null;
  createdAt: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showError: (error: unknown) => void;
  dismissToast: (id: number) => void;
  selectedToast: ToastItem | null;
  openDetail: (toast: ToastItem) => void;
  closeDetail: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedToast, setSelectedToast] = useState<ToastItem | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (error: unknown) => {
      const id = nextId++;
      const toast: ToastItem = {
        id,
        message: formatErrorMessage(error),
        details: extractApiError(error),
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        dismissToast(id);
      }, 10_000);
    },
    [dismissToast]
  );

  const openDetail = useCallback((toast: ToastItem) => {
    setSelectedToast(toast);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedToast(null);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, showError, dismissToast, selectedToast, openDetail, closeDetail }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};
