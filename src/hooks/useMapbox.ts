import { useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

let initPromise: Promise<void> | null = null;

const initMapbox = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = new Promise<void>((resolve, reject) => {
    const token = import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      reject(new Error("missing-mapbox-token"));
      return;
    }
    mapboxgl.accessToken = token;
    resolve();
  });

  return initPromise;
};

export function useMapbox() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    initMapbox()
      .then(() => active && setReady(true))
      .catch((e) => active && setError(e?.message || "error"));
    return () => {
      active = false;
    };
  }, []);

  return { ready, error };
}
