import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import RouteTracker from "./components/RouteTracker";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";

const SupportChatWidget = lazy(() => import("./components/support/SupportChatWidget"));

const RentalPopupManager = lazy(() => import("./components/rentals/RentalPopupManager"));

const ConditionalWidgets = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/auth") || pathname.startsWith("/reset-password") || pathname.startsWith("/onboarding")) return null;
  return (
    <>
      <SupportChatWidget />
    </>
  );
};

const GlobalRealtime = () => {
  const { user } = useAuth();
  useGlobalRealtime(user?.id);
  return null;
};

// Lazy-loaded routes
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const SubcategoryDetail = lazy(() => import("./pages/SubcategoryDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Search = lazy(() => import("./pages/Search"));
const ListItem = lazy(() => import("./pages/ListItem"));
const Checkout = lazy(() => import("./pages/Checkout"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const NewProduct = lazy(() => import("./pages/NewProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const ProductPreview = lazy(() => import("./pages/ProductPreview"));
const Messages = lazy(() => import("./pages/Messages"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MiniCrmTest = lazy(() => import("./pages/MiniCrmTest"));
const OdooTest = lazy(() => import("./pages/OdooTest"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const UserTickets = lazy(() => import("./pages/UserTickets"));
const Contact = lazy(() => import("./pages/Contact"));
const DeactivateAccount = lazy(() => import("./pages/DeactivateAccount"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ShortLinkRedirect = lazy(() => import("./pages/ShortLinkRedirect"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const EarningsPage = lazy(() => import("./pages/EarningsPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AccountDetailsPage = lazy(() => import("./pages/AccountDetailsPage"));
const RentalsPage = lazy(() => import("./pages/RentalsPage"));
const OwnerRentalsPage = lazy(() => import("./pages/OwnerRentalsPage"));
const RentalDetailPage = lazy(() => import("./pages/RentalDetailPage"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancelled = lazy(() => import("./pages/CheckoutCancelled"));
const MobileCheckoutReturn = lazy(() => import("./pages/MobileCheckoutReturn"));

// Legal pages
const TermsAndConditions = lazy(() => import("./pages/legal/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const CancellationPolicy = lazy(() => import("./pages/legal/CancellationPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const FAQ = lazy(() => import("./pages/FAQ"));
// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReservations = lazy(() => import("./pages/admin/AdminReservations"));
const AdminFinances = lazy(() => import("./pages/admin/AdminFinances"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminTicketDetail = lazy(() => import("./pages/admin/AdminTicketDetail"));
const AdminTicketCreate = lazy(() => import("./pages/admin/AdminTicketCreate"));
const AdminSupportAnalytics = lazy(() => import("./pages/admin/AdminSupportAnalytics"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminConversations = lazy(() => import("./pages/admin/AdminConversations"));
const AdminConversationDetail = lazy(() => import("./pages/admin/AdminConversationDetail"));
const AdminApprovals = lazy(() => import("./pages/admin/AdminApprovals"));
const AdminTestEmails = lazy(() => import("./pages/admin/AdminTestEmails"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminSmsLogs = lazy(() => import("./pages/admin/AdminSmsLogs"));
const AdminNotificationAudit = lazy(() => import("./pages/admin/AdminNotificationAudit"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <RouteTracker />
            <Suspense fallback={null}>
              <ConditionalWidgets />
              
              <RentalPopupManager />
            </Suspense>
            <GlobalRealtime />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categorii" element={<Categories />} />
                <Route path="/categorie/:slug" element={<CategoryDetail />} />
                <Route path="/subcategorie/:id" element={<SubcategoryDetail />} />
                <Route path="/produs/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/checkout/cancelled" element={<CheckoutCancelled />} />
                <Route path="/checkout/mobile-return" element={<MobileCheckoutReturn />} />
                <Route path="/cauta" element={<Search />} />
                <Route path="/adauga-anunt" element={<Navigate to="/owner/new-product" replace />} />
                <Route path="/utilizator/:id" element={<UserProfile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contul-meu" element={<AccountDetailsPage />} />
                <Route path="/owner" element={<Navigate to="/anunturi" replace />} />
                <Route path="/owner/new-product" element={<NewProduct />} />
                <Route path="/owner/edit-product/:id" element={<EditProduct />} />
                <Route path="/publica/previzualizare" element={<ProductPreview />} />
                <Route path="/mesaje" element={<Messages />} />
                <Route path="/favorite" element={<FavoritesPage />} />
                <Route path="/castiguri" element={<EarningsPage />} />
                <Route path="/recenzii" element={<ReviewsPage />} />
                <Route path="/notificari" element={<NotificationsPage />} />
                <Route path="/cereri" element={<Navigate to="/rezervari" replace />} />
                <Route path="/rezervari" element={<RentalsPage />} />
                <Route path="/inchirieri" element={<OwnerRentalsPage />} />
                <Route path="/rezervari/:publicId" element={<RentalDetailPage />} />
                <Route path="/inchirieri/:publicId" element={<RentalDetailPage />} />
                <Route path="/anunturi" element={<ListingsPage />} />
                <Route path="/activitate" element={<ActivityLogPage />} />
                <Route path="/rezervari-old" element={<Navigate to="/rezervari" replace />} />
                <Route path="/centru-asistenta" element={<HelpCenter />} />
                <Route path="/suport" element={<UserTickets />} />
                <Route path="/cum-functioneaza" element={<HowItWorks />} />
                <Route path="/despre-noi" element={<AboutUs />} />
                <Route path="/termeni-si-conditii" element={<TermsAndConditions />} />
                <Route path="/politica-confidentialitate" element={<PrivacyPolicy />} />
                <Route path="/politica-anulare" element={<CancellationPolicy />} />
                <Route path="/politica-cookies" element={<CookiePolicy />} />
                <Route path="/intrebari-frecvente" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dezactivare-cont" element={<DeactivateAccount />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/reservations" element={<AdminReservations />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
                <Route path="/admin/tickets/new" element={<AdminTicketCreate />} />
                <Route path="/admin/tickets/analytics" element={<AdminSupportAnalytics />} />
                <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/finances" element={<AdminFinances />} />
                <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                <Route path="/admin/conversations" element={<AdminConversations />} />
                <Route path="/admin/conversations/:id" element={<AdminConversationDetail />} />
                <Route path="/admin/approvals" element={<AdminApprovals />} />
                <Route path="/admin/test-emails" element={<AdminTestEmails />} />
                <Route path="/admin/sms-logs" element={<AdminSmsLogs />} />
                <Route path="/admin/notification-audit" element={<AdminNotificationAudit />} />
                <Route path="/a/:token" element={<ShortLinkRedirect />} />
                <Route path="/setari/notificari" element={<NotificationPreferences />} />
                
                {/* Integration tests */}
                <Route path="/minicrm-test" element={<MiniCrmTest />} />
                <Route path="/odoo-test" element={<OdooTest />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
