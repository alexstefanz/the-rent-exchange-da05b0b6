import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield, Package, Ticket, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";

const AdminActionRequiredWidget = () => {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useAdminNotificationSummary();

  const tiles = [
    {
      key: "kyc",
      label: "KYC de verificat",
      count: summary?.pending_kyc || 0,
      icon: Shield,
      onClick: () => navigate("/admin/kyc"),
    },
    {
      key: "products",
      label: "Produse de aprobat",
      count: summary?.pending_products || 0,
      icon: Package,
      onClick: () => navigate("/admin/approvals"),
    },
    {
      key: "tickets",
      label: "Tickete deschise",
      count: summary?.open_tickets || 0,
      icon: Ticket,
      onClick: () => navigate("/admin/tickets"),
    },
    {
      key: "withdrawals",
      label: "Retrageri în așteptare",
      count: summary?.pending_withdrawals || 0,
      icon: Banknote,
      onClick: () => navigate("/admin/finances"),
    },
  ];

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Acțiuni necesare
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiles.map((t) => {
              const Icon = t.icon;
              const has = t.count > 0;
              return (
                <button
                  key={t.key}
                  onClick={t.onClick}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                    has
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-muted/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        has ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-2xl font-bold ml-auto ${
                        has ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {t.count}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground line-clamp-2">{t.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminActionRequiredWidget;