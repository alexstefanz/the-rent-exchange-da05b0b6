import { useEffect, useState } from "react";

/**
 * Returns true when the on-screen keyboard is likely open on mobile.
 * Uses visualViewport height delta vs window.innerHeight.
 */
export function useKeyboardOpen(threshold = 150): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const delta = window.innerHeight - vv.height;
      setOpen(delta > threshold);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [threshold]);

  return open;
}