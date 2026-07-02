import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/analytics";

// Sends a GA4 page_view on every SPA route change. Query strings and hashes
// are stripped inside trackPageview so tokens (e.g. checkout, auth) never leak.
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