"use client";

import { useEffect, useRef } from "react";

import type { ToastItem } from "@/context/toast-context";

interface ErrorDetailModalProps {
  toast: ToastItem | null;
  onClose: () => void;
}

const tryFormatJson = (raw: string | null): string => {
  if (!raw) return "(empty)";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

export default function ErrorDetailModal({ toast, onClose }: ErrorDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (toast) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [toast, onClose]);

  if (!toast) return null;

  const details = toast.details;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
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
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                API Error Details
              </h2>
              {details && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(details.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {details ? (
            <>
              {/* Status + Method + URL */}
              <div className="grid grid-cols-3 gap-3">
                <InfoBlock label="Status">
                  <span className="font-mono text-red-600 font-bold text-lg">
                    {details.status}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    {details.statusText}
                  </span>
                </InfoBlock>
                <InfoBlock label="Method">
                  <span className="font-mono font-semibold text-gray-800">
                    {details.method}
                  </span>
                </InfoBlock>
                <InfoBlock label="URL">
                  <span className="font-mono text-sm text-gray-700 break-all">
                    {details.url}
                  </span>
                </InfoBlock>
              </div>

              {/* Request Body */}
              {details.requestBody && (
                <CodeBlock
                  label="Request Body"
                  content={tryFormatJson(details.requestBody)}
                />
              )}

              {/* Response Body */}
              <CodeBlock
                label="Response Body"
                content={tryFormatJson(details.responseBody)}
              />
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-mono">{toast.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-5 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const InfoBlock = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
      {label}
    </p>
    <div>{children}</div>
  </div>
);

const CodeBlock = ({
  label,
  content,
}: {
  label: string;
  content: string;
}) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}
    </p>
    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-60 whitespace-pre-wrap wrap-break-word">
      {content}
    </pre>
  </div>
);
