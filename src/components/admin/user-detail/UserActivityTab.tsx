import { useUserActivityLogs } from "@/hooks/queries/useUserActivityLogs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Props {
  userId: string;
}

const actionLabels: Record<string, string> = {
  PRODUCT_CREATED: "Produs creat",
  PRODUCT_DEACTIVATED: "Produs dezactivat",
  PRODUCT_REACTIVATED: "Produs reactivat",
  PRODUCT_DELETED: "Produs șters",
  PRICE_CHANGED: "Preț schimbat",
  RENTAL_CREATED: "Rezervare creată",
  RENTAL_CONFIRMED: "Rezervare confirmată",
  RENTAL_CANCELLED: "Rezervare anulată",
  RENTAL_COMPLETED: "Rezervare finalizată",
  RENTAL_REJECTED: "Rezervare respinsă",
  RENTAL_ACTIVE: "Rezervare activă",
  PHONE_UPDATED: "Telefon actualizat",
};

const UserActivityTab = ({ userId }: Props) => {
  const { data: logs, isLoading } = useUserActivityLogs(userId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!logs?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nicio activitate înregistrată</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.slice(0, 50).map((log) => (
        <div key={log.id} className="flex items-center gap-3 p-2 rounded text-sm hover:bg-muted/30">
          <span className="text-xs text-muted-foreground flex-shrink-0 w-24">
            {format(new Date(log.created_at), "d MMM HH:mm", { locale: ro })}
          </span>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {actionLabels[log.action] || log.action}
          </Badge>
          {log.metadata && (
            <span className="text-xs text-muted-foreground truncate">
              {log.metadata.title || log.metadata.product_id || log.metadata.new_status || ''}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserActivityTab;
