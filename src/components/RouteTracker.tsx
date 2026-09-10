import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/analytics";

// Sends a GA4 page_view on every SPA route change, but not on initial load
// because index.html disables the automatic page_view from gtag('config').
// Query strings and hashes are stripped inside trackPageview so tokens never leak.
const RouteTracker = () => {
  const { pathname } = useLocation();
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    // Defer to next tick so document.title is updated by usePageSeo first.
    const id = window.setTimeout(() => trackPageview(pathname), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
};

export default RouteTracker;