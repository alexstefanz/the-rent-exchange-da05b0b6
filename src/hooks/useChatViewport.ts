import { useEffect } from "react";

/**
 * Tracks the mobile visual viewport (which shrinks/offsets when the OS
 * keyboard or browser accessory bars appear) and exposes it as CSS
 * variables on <html>:
 *   --chat-h   → visible viewport height in px
 *   --chat-top → visible viewport top offset in px (iOS Safari can push
 *                the layout viewport up under the keyboard)
 *
 * Consumers should position the mobile chat overlay with
 *   position: fixed; left: 0; right: 0;
 *   top: var(--chat-top, 0px);
 *   height: var(--chat-h, 100dvh);
 * so the input stays flush above the keyboard and the page underneath
 * never bleeds through.
 */
export function useChatViewport(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--chat-h", `${Math.round(vv.height)}px`);
      root.style.setProperty("--chat-top", `${Math.round(vv.offsetTop)}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      root.style.removeProperty("--chat-h");
      root.style.removeProperty("--chat-top");
    };
  }, [active]);
}