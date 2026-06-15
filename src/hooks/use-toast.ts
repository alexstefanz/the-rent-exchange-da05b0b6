import * as React from "react";
// Legacy useToast hook bridged to the unified `notify` card system.
// Kept for backward compatibility with files that still import from
// "@/hooks/use-toast" or "@/components/ui/use-toast".
import { notify, notifyError } from "@/lib/notify";

type LegacyToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | string;
  // ignored extra fields preserved for compat
  [key: string]: unknown;
};

function toString(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean") return String(node);
  try { return String(node); } catch { return ""; }
}

function toast(input: LegacyToastInput = {}) {
  const title = toString(input.title);
  const message = toString(input.description);
  const isError = input.variant === "destructive";
  if (isError) {
    notifyError(message || title || "A apărut o eroare.", { fallbackTitle: title || "Eroare" });
  } else {
    const t = title || "Succes";
    const m = message && message !== title ? message : "";
    notify.success(m, t);
  }
  return { id: "0", dismiss: () => {}, update: () => {} };
}

function useToast() {
  return { toasts: [], toast, dismiss: (_?: string) => {} };
}

export { useToast, toast };
