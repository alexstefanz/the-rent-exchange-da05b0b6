import { Link } from "react-router-dom";
import { Activity, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { actionLabel, activityDetails } from "@/features/admin/activityFeedApi";
import { useAdminActivityFeed } from "@/hooks/queries/useAdminActivityFeed";

const DashboardActivityWidget = () => {
  const { data, isLoading } = useAdminActivityFeed({ page: 0, pageSize: 8 });
  const rows = data?.rows ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 md:p-6 flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Ultima activitate
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/activity">
            Vezi tot <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nicio activitate înregistrată
          </p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
              <span className="text-xs text-muted-foreground w-24 shrink-0">
                {format(new Date(row.created_at), "d MMM HH:mm", { locale: ro })}
              </span>
              <Badge variant="outline" className="text-xs shrink-0">
                {actionLabel(row.action)}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {row.user_name || row.user_email || ""}
                {activityDetails(row) ? ` · ${activityDetails(row)}` : ""}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardActivityWidget;
