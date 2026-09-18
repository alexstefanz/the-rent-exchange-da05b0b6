import { useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Wallet, 
  BarChart3, 
  Users, 
  ShieldCheck,
  Home,
  Package,
  ClipboardCheck,
  TicketCheck,
  FolderTree,
  MessageCircle,
  Mail,
  Bell,
  MessageSquare,
  Banknote,
  Flag
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAdminNotificationSummary } from "@/hooks/queries/useAdminNotifications";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type BadgeKey =
  | "unread_total"
  | "pending_products"
  | "open_tickets"
  | "pending_withdrawals"
  | "pending_approvals_total"
  | "pending_reports";

const menuItems: Array<{
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badgeKey?: BadgeKey;
}> = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Notificări", url: "/admin/notifications", icon: Bell, badgeKey: "unread_total" },
  { title: "Rezervări", url: "/admin/reservations", icon: CalendarCheck },
  { title: "Produse", url: "/admin/products", icon: Package },
  { title: "Confirmări / Anulări", url: "/admin/approvals", icon: ClipboardCheck, badgeKey: "pending_approvals_total" },
  { title: "Tickete", url: "/admin/tickets", icon: TicketCheck, badgeKey: "open_tickets" },
  { title: "Analytics Suport", url: "/admin/tickets/analytics", icon: BarChart3 },
  { title: "Conversații", url: "/admin/conversations", icon: MessageCircle },
  { title: "Categorii", url: "/admin/categories", icon: FolderTree },
  { title: "Financiar", url: "/admin/finances", icon: Wallet },
  { title: "Retrageri", url: "/admin/withdrawals", icon: Banknote, badgeKey: "pending_withdrawals" },
  { title: "Reports", url: "/admin/reports", icon: Flag, badgeKey: "pending_reports" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Utilizatori", url: "/admin/users", icon: Users },
  { title: "Test Emailuri", url: "/admin/test-emails", icon: Mail },
  { title: "Jurnal activitate", url: "/admin/activity", icon: Activity },
  { title: "SMS Logs", url: "/admin/sms-logs", icon: MessageSquare },
  { title: "Audit notificări", url: "/admin/notification-audit", icon: ScrollText },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: summary } = useAdminNotificationSummary();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="font-bold text-lg text-primary">Admin ERP</span>
        )}
        <SidebarTrigger className={collapsed ? "mx-auto" : ""} />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Meniu Principal</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const count = item.badgeKey
                  ? item.badgeKey === "pending_approvals_total"
                    ? Number(summary?.pending_products || 0) + Number(summary?.pending_cancellations || 0)
                    : Number(summary?.[item.badgeKey as keyof typeof summary] || 0)
                  : 0;
                const showBadge = count > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="hover:bg-muted/50 relative"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <span className="relative mr-2 flex items-center">
                          <item.icon className="h-4 w-4" />
                          {showBadge && collapsed && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                          )}
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                        {showBadge && !collapsed && (
                          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                            {count > 9 ? "9+" : count}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-muted/50">
                    <Home className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Înapoi la site</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
