import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/analytics";

// Sends a GA4 page_view on the initial load and on every SPA route change.
// index.html sets send_page_view: false, so this is the single source of
// page_view events (no duplicates on load).
// Query strings and hashes are stripped inside trackPageview so tokens never leak.
const RouteTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Defer to next tick so document.title is updated by usePageSeo first.
    const id = window.setTimeout(() => trackPageview(pathname), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
};

export default RouteTracker;