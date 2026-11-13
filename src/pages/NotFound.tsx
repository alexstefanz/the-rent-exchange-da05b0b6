import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    const prevTitle = document.title;
    document.title = "Pagina nu a fost găsită (404) | Rentli";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    meta.setAttribute("data-404", "true");
    document.head.appendChild(meta);
    return () => { document.title = prevTitle; meta.remove(); };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-xl font-medium">Pagina nu a fost găsită</p>
        <p className="mb-6 text-sm text-muted-foreground">Linkul accesat nu există sau a fost mutat.</p>
        <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Înapoi la pagina principală
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
