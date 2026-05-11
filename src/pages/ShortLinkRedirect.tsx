import { useEffect } from "react";
import { useParams } from "react-router-dom";

/**
 * /a/:token — redirects to the edge function `resolve-action-token` which
 * validates the token, marks it used, and 302-redirects to the real app path.
 */
const ShortLinkRedirect = () => {
  const { token } = useParams();
  useEffect(() => {
    if (!token) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    window.location.replace(
      `https://${projectId}.supabase.co/functions/v1/resolve-action-token?t=${encodeURIComponent(token)}`,
    );
  }, [token]);
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Te redirecționăm…
    </div>
  );
};

export default ShortLinkRedirect;