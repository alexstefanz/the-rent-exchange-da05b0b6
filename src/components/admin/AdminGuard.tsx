import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsInsurer, INSURER_HOME } from "@/hooks/queries/useIsInsurer";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { Loader2, ShieldX } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { data: isInsurer, isLoading: insurerLoading } = useIsInsurer(user?.id);
  const location = useLocation();

  // Still loading auth or admin check
  if (authLoading || (user && (adminLoading || insurerLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Se verifică accesul...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Insurer: read-only access, limited to the insurer section
  if (!isAdmin && isInsurer) {
    if (!location.pathname.startsWith(INSURER_HOME)) return <Navigate to={INSURER_HOME} replace />;
    return <>{children}</>;
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acces Restricționat
          </h1>
          <p className="text-muted-foreground mb-6">
            Nu aveți permisiunea de a accesa panoul de administrare. 
            Această zonă este rezervată doar administratorilor platformei.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Înapoi la pagina principală
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
