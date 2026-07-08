import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { notify, notifyError } from "@/lib/notify";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  // Responsive offset so toasts always sit above the chat FAB
  // (mobile: FAB at bottom-20 ≈ 80px + 56px height; desktop: bottom-6 ≈ 24px + 56px).
  const [offset, setOffset] = useState<{ bottom: number; right: number }>({ bottom: 152, right: 16 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setOffset({ bottom: mq.matches ? 96 : 152, right: 16 });
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      offset={offset.bottom as any}
      duration={6000}
      visibleToasts={1}
      expand={false}
      gap={0}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-transparent group-[.toaster]:!border-0 group-[.toaster]:!shadow-none group-[.toaster]:!p-0 group-[.toaster]:!rounded-none group-[.toaster]:!w-full group-[.toaster]:!flex group-[.toaster]:!justify-center",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!left-auto !right-2 !top-2 !bg-transparent !border-0 !text-muted-foreground hover:!text-foreground hover:!bg-muted/60 !rounded-full !h-6 !w-6 transition-colors",
        },
      }}
      {...props}
    />
  );
};

/**
 * Proxy `toast` that routes plain sonner calls (toast.success/error/info/…)
 * through the unified `notify` card system so every toast shares the single
 * global notification id — preventing overlapping / "double background" cards.
 *
 * Passthrough for advanced APIs (`custom`, `promise`, `loading`, `dismiss`),
 * which are used by `notify` itself or rare edge cases.
 */
type ToastPayload = string | { title?: unknown; description?: unknown; message?: unknown };
type ToastOpts = { description?: unknown; title?: unknown } | undefined;

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return String(v); } catch { return ""; }
}

function splitTitleMessage(payload: ToastPayload, opts: ToastOpts, defaultTitle: string) {
  let title = defaultTitle;
  let message = "";
  if (typeof payload === "string") {
    message = payload;
  } else if (payload && typeof payload === "object") {
    const p = payload as { title?: unknown; description?: unknown; message?: unknown };
    title = asString(p.title) || defaultTitle;
    message = asString(p.description ?? p.message);
  }
  if (opts && typeof opts === "object") {
    const o = opts as { title?: unknown; description?: unknown };
    if (o.title != null) title = asString(o.title) || title;
    if (o.description != null) message = asString(o.description);
  }
  return { title, message };
}

function callDefault(payload: ToastPayload, opts?: ToastOpts) {
  const { title, message } = splitTitleMessage(payload, opts, "Notificare");
  return notify.system({ title, message });
}

const toast: any = Object.assign(
  (payload: ToastPayload, opts?: ToastOpts) => callDefault(payload, opts),
  {
    success: (payload: ToastPayload, opts?: ToastOpts) => {
      const { title, message } = splitTitleMessage(payload, opts, "Succes");
      return notify.confirmation({ title, message });
    },
    error: (payload: ToastPayload, opts?: ToastOpts) => {
      if (payload instanceof Error) return notifyError(payload);
      const { title, message } = splitTitleMessage(payload, opts, "Eroare");
      return notify.cancellation({ title, message });
    },
    warning: (payload: ToastPayload, opts?: ToastOpts) => {
      const { title, message } = splitTitleMessage(payload, opts, "Atenție");
      return notify.warning({ title, message });
    },
    warn: (payload: ToastPayload, opts?: ToastOpts) => {
      const { title, message } = splitTitleMessage(payload, opts, "Atenție");
      return notify.warning({ title, message });
    },
    info: (payload: ToastPayload, opts?: ToastOpts) => {
      const { title, message } = splitTitleMessage(payload, opts, "Info");
      return notify.info({ title, message });
    },
    message: (payload: ToastPayload, opts?: ToastOpts) => callDefault(payload, opts),
    // Passthrough for advanced APIs used by notify() and rare edge cases.
    custom: sonnerToast.custom.bind(sonnerToast),
    promise: sonnerToast.promise.bind(sonnerToast),
    loading: sonnerToast.loading.bind(sonnerToast),
    dismiss: sonnerToast.dismiss.bind(sonnerToast),
  },
);

export { Toaster, toast };
