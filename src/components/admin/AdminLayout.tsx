import { ReactNode, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminGuard from "./AdminGuard";
import MobileAdminMenu from "./MobileAdminMenu";
import AdminNotificationBell from "./AdminNotificationBell";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          {/* Desktop sidebar */}
          <div className="hidden md:block">
            <AdminSidebar />
          </div>

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Mobile header with hamburger + notification bell */}
            <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <MobileAdminMenu onClose={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <span className="font-bold text-primary flex-1">Admin Panel</span>
              <AdminNotificationBell />
            </div>

            {/* Desktop header with notification bell */}
            <div className="hidden md:flex sticky top-0 z-40 items-center justify-end gap-3 border-b bg-background px-6 py-2">
              <AdminNotificationBell />
            </div>

            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminLayout;
