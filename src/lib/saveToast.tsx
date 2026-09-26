import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Minimal "saved" confirmation pill, independent of the globally disabled
 * toast systems (sonner / use-toast). Shows a small bottom-center pill that
 * auto-hides after ~2.5s. Use for profile/settings save confirmations:
 *   showSaveToast("Nume actualizat");
 */

type SaveToastItem = { id: number; label: string };

let listener: ((item: SaveToastItem) => void) | null = null;
let counter = 0;

export function showSaveToast(label: string) {
  if (!label) return;
  listener?.({ id: ++counter, label });
}

export function SaveToastHost() {
  const [item, setItem] = useState<SaveToastItem | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    listener = (next) => {
      setItem(next);
      // Trigger enter animation
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    };
    return () => {
      listener = null;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    const hide = setTimeout(() => setVisible(false), 2200);
    const clear = setTimeout(() => setItem(null), 2600);
    return () => {
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className={
          "flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-2 " +
          "shadow-[0_8px_30px_-8px_hsl(var(--foreground)/0.25)] " +
          "transition-all duration-300 ease-out " +
          (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")
        }
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.label}</span>
      </div>
    </div>
  );
}
