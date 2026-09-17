import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunk-reload-ts";

/**
 * Lazy import that survives stale build chunks after a new deploy.
 * If a dynamic import fails (old hashed file no longer exists), reload once.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      // Avoid infinite reload loops: retry at most once per 10 seconds.
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
        // Never resolves; page is reloading.
        return await new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
