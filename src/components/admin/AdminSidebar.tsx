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
  MessageCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Rezervări", url: "/admin/reservations", icon: CalendarCheck },
  { title: "Produse", url: "/admin/products", icon: Package },
  { title: "Confirmări", url: "/admin/approvals", icon: ClipboardCheck },
  { title: "Tickete", url: "/admin/tickets", icon: TicketCheck },
  { title: "Conversații", url: "/admin/conversations", icon: MessageCircle },
  { title: "Categorii", url: "/admin/categories", icon: FolderTree },
  { title: "Financiar", url: "/admin/finances", icon: Wallet },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Utilizatori", url: "/admin/users", icon: Users },
  { title: "Verificări KYC", url: "/admin/kyc", icon: ShieldCheck },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
