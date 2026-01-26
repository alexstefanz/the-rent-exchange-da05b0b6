import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { Loader2, ShieldX } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);

  // Still loading auth or admin check
  if (authLoading || adminLoading) {
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
    return <Navigate to="/auth" replace />;
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
