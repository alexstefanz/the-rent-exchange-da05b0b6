import { usePageSeo } from "@/hooks/usePageSeo";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Package, ShoppingBag, UserCog, ShieldCheck, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyActivityLogs } from "@/hooks/queries/useMyActivityLogs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const actionLabels: Record<string, { ro: string; en: string }> = {
  PRODUCT_CREATED: { ro: "Produs creat", en: "Product created" },
  PRODUCT_DEACTIVATED: { ro: "Produs dezactivat", en: "Product deactivated" },
  PRODUCT_REACTIVATED: { ro: "Produs reactivat", en: "Product reactivated" },
  PRODUCT_DELETED: { ro: "Produs șters", en: "Product deleted" },
  PRICE_CHANGED: { ro: "Preț schimbat", en: "Price changed" },
  RENTAL_CREATED: { ro: "Rezervare creată", en: "Rental created" },
  RENTAL_CONFIRMED: { ro: "Rezervare confirmată", en: "Rental confirmed" },
  RENTAL_CANCELLED: { ro: "Rezervare anulată", en: "Rental cancelled" },
  RENTAL_COMPLETED: { ro: "Rezervare finalizată", en: "Rental completed" },
  RENTAL_REJECTED: { ro: "Rezervare respinsă", en: "Rental rejected" },
  RENTAL_ACTIVE: { ro: "Rezervare activă", en: "Rental active" },
  RENTAL_PENDING: { ro: "Rezervare în așteptare", en: "Rental pending" },
  PHONE_UPDATED: { ro: "Telefon actualizat", en: "Phone updated" },
  KYC_STATUS_CHANGED: { ro: "Status KYC schimbat", en: "KYC status changed" },
  KYC_CASE_CREATED: { ro: "Cerere KYC creată", en: "KYC case created" },
};

const extraLabels: Record<string, { ro: string; en: string }> = {
  KYC_APPROVED: { ro: "KYC aprobat", en: "KYC approved" },
  KYC_REJECTED: { ro: "KYC respins", en: "KYC rejected" },
  KYC_SUBMITTED: { ro: "KYC trimis", en: "KYC submitted" },
  KYC_IN_PROGRESS: { ro: "KYC în procesare", en: "KYC in progress" },
  KYC_NEEDS_MANUAL_REVIEW: { ro: "KYC necesită revizuire", en: "KYC needs review" },
  KYC_REUPLOAD_REQUESTED: { ro: "KYC reîncărcare cerută", en: "KYC reupload requested" },
  PASSWORD_RESET_REQUESTED: { ro: "Resetare parolă cerută", en: "Password reset requested" },
  RENTAL_EARLY_RETURN_REQUESTED: { ro: "Returnare anticipată cerută", en: "Early return requested" },
};
Object.assign(actionLabels, extraLabels);

const humanize = (action: string) =>
  action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const getActionIcon = (action: string) => {
  if (action.startsWith("PRODUCT")) return Package;
  if (action.startsWith("RENTAL")) return ShoppingBag;
  if (action.startsWith("KYC")) return ShieldCheck;
  if (action.startsWith("PHONE")) return UserCog;
  return Activity;
};

const getActionColor = (action: string) => {
  if (action.includes("CREATED") || action.includes("CONFIRMED") || action.includes("COMPLETED") || action.includes("REACTIVATED"))
    return "bg-green-100 text-green-800 border-green-200";
  if (action.includes("CANCELLED") || action.includes("REJECTED") || action.includes("DELETED") || action.includes("DEACTIVATED"))
    return "bg-red-100 text-red-800 border-red-200";
  if (action.includes("CHANGED") || action.includes("UPDATED"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-muted text-muted-foreground";
};

const ActivityLogPage = () => {
  usePageSeo({ title: "Activitate cont — Rentli", description: "Zona privată a contului tău Rentli.", noindex: true });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = (ro: string, en: string) => (language === "ro" ? ro : en);
  const { data: logs, isLoading } = useMyActivityLogs();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 pt-24 lg:pt-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          {t("Istoric activitate", "Activity Log")}
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          {t("Toate acțiunile tale pe platformă", "All your actions on the platform")}
        </p>

        {!logs?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{t("Nicio activitate înregistrată", "No activity recorded")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              const label = actionLabels[log.action];
              const colorClass = getActionColor(log.action);
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${colorClass}`}>
                        {label ? (language === "ro" ? label.ro : label.en) : humanize(log.action)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(log.created_at), "d MMM yyyy, HH:mm", {
                      locale: language === "ro" ? ro : undefined,
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ActivityLogPage;
