import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __rentliMapsInit?: () => void;
  }
}

let loadPromise: Promise<void> | null = null;

const loadGoogleMaps = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (!key) {
      reject(new Error("missing-key"));
      return;
    }
    window.__rentliMapsInit = () => resolve();
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__rentliMapsInit` +
      (channel ? `&channel=${channel}` : "") +
      `&language=ro&region=RO`;
    script.async = true;
    script.onerror = () => reject(new Error("script-error"));
    document.head.appendChild(script);
  });

  return loadPromise;
};

export function useGoogleMaps() {
  const [ready, setReady] = useState(!!window.google?.maps?.Map);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(() => active && setReady(true))
      .catch((e) => active && setError(e?.message || "error"));
    return () => {
      active = false;
    };
  }, []);

  return { ready, error };
}
