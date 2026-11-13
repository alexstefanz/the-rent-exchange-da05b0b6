import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/queries/useAdminStats";
import { useIsInsurer, INSURER_HOME } from "@/hooks/queries/useIsInsurer";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  BarChart3,
  Users,
  ShieldCheck,
  Home,
  Package,
  TicketCheck,
  FolderTree,
  MessageSquare,
  Activity,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Rezervări", url: "/admin/reservations", icon: CalendarCheck },
  { title: "Dosare asigurări", url: "/admin/asigurari", icon: ShieldCheck },
  { title: "Produse", url: "/admin/products", icon: Package },
  { title: "Tichete", url: "/admin/tickets", icon: TicketCheck },
  { title: "Categorii", url: "/admin/categories", icon: FolderTree },
  { title: "Financiar", url: "/admin/finances", icon: Wallet },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Utilizatori", url: "/admin/users", icon: Users },
  { title: "Jurnal activitate", url: "/admin/activity", icon: Activity },
  { title: "SMS Logs", url: "/admin/sms-logs", icon: MessageSquare },
];

interface MobileAdminMenuProps {
  onClose: () => void;
}

const MobileAdminMenu = ({ onClose }: MobileAdminMenuProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: isInsurer } = useIsInsurer(user?.id);
  const insurerOnly = !isAdmin && !!isInsurer;
  const visibleItems = insurerOnly
    ? [{ title: "Dosare închirieri", url: INSURER_HOME, icon: ShieldCheck }]
    : menuItems;

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <span className="font-bold text-lg text-primary">{insurerOnly ? "Asigurator" : "Admin ERP"}</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Meniu Principal
        </p>
        {visibleItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary border-r-2 border-primary"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-2">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-md"
        >
          <Home className="h-5 w-5" />
          Înapoi la site
        </Link>
      </div>
    </div>
  );
};

export default MobileAdminMenu;
