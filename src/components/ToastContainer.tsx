"use client";

import { useToast } from "@/context/toast-context";

import ErrorDetailModal from "@/components/ErrorDetailModal";

export default function ToastContainer() {
  const { toasts, dismissToast, openDetail, selectedToast, closeDetail } =
    useToast();

  return (
    <>
      {/* Toast stack — bottom right */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-100 flex flex-col gap-2 sm:max-w-md sm:w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in bg-red-600 text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-red-700 transition-colors"
            onClick={() => openDetail(toast)}
            role="alert"
          >
            {/* Error icon */}
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">API Error</p>
              <p className="text-xs text-red-100 truncate mt-0.5">
                {toast.message}
              </p>
              <p className="text-[10px] text-red-200 mt-1">
                Click for full details
              </p>
            </div>

            {/* Dismiss button */}
            <button
              className="shrink-0 text-red-200 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Error detail modal */}
      <ErrorDetailModal toast={selectedToast} onClose={closeDetail} />
    </>
  );
}
