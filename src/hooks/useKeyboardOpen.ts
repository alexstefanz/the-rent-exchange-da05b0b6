import { useEffect, useState } from "react";

/**
 * Returns true when the on-screen keyboard is likely open on mobile.
 * Uses visualViewport height delta vs window.innerHeight, plus an active
 * editable-element check. The threshold is intentionally low (100px) so it
 * also catches Chrome iOS where the ↑↓✓ accessory bar shrinks the viewport
 * by less than a full keyboard.
 */
export function useKeyboardOpen(threshold = 100): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const delta = window.innerHeight - vv.height;
      const ae = document.activeElement as HTMLElement | null;
      const isEditing = !!ae && (
        ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.isContentEditable
      );
      setOpen(delta > threshold || (isEditing && delta > 50));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, [threshold]);

  return open;
}