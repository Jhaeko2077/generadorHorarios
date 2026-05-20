"use client";

import type { ReactNode } from "react";

export function ConfirmDialog({
  message,
  onConfirm,
  children,
}: {
  message: string;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(message)) {
          onConfirm();
        }
      }}
    >
      {children}
    </button>
  );
}
