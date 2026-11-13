import DocumentSignedSuccessHost from "@/components/rentals/DocumentSignedSuccessDialog";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Suspense } from "react";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import RouteTracker from "./components/RouteTracker";
import { useGlobalRealtime } from "@/hooks/useGlobalRealtime";
import { useGlobalPresence } from "@/hooks/useOnlineUsers";
import { SaveToastHost } from "@/lib/saveToast";

const SupportChatWidget = lazyWithRetry(() => import("./components/support/SupportChatWidget"));
const IdentityVerification = lazyWithRetry(() => import("./pages/IdentityVerification"));

const PhoneVerificationRequiredModal = lazyWithRetry(() => import("./components/profile/PhoneVerificationRequiredModal"));
const FullNameConfirmDialog = lazyWithRetry(() => import("./components/profile/FullNameConfirmDialog"));
const RentalPopupManager = lazyWithRetry(() => import("./components/rentals/RentalPopupManager"));
import { KycRequiredListener } from "./components/trust/IdentityRequiredDialog";

const ConditionalWidgets = () => {
  const { pathname } = useLocation();
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/checkout/mobile-return") ||
    pathname.startsWith("/kyc/app-return")
  ) return null;
  return (
    <>
      <SupportChatWidget />
    </>
  );
};

const GlobalRealtime = () => {
  const { user } = useAuth();
  useGlobalRealtime(user?.id);
  useGlobalPresence(user?.id);
  return null;
};

// Lazy-loaded routes
const Categories = lazyWithRetry(() => import("./pages/Categories"));
const CategoryDetail = lazyWithRetry(() => import("./pages/CategoryDetail"));
const SubcategoryDetail = lazyWithRetry(() => import("./pages/SubcategoryDetail"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const ListItem = lazyWithRetry(() => import("./pages/ListItem"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const UserProfile = lazyWithRetry(() => import("./pages/UserProfile"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const NewProduct = lazyWithRetry(() => import("./pages/NewProduct"));
const EditProduct = lazyWithRetry(() => import("./pages/EditProduct"));
const ProductPreview = lazyWithRetry(() => import("./pages/ProductPreview"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const MiniCrmTest = lazyWithRetry(() => import("./pages/MiniCrmTest"));
const OdooTest = lazyWithRetry(() => import("./pages/OdooTest"));
const HowItWorks = lazyWithRetry(() => import("./pages/HowItWorks"));
const AboutUs = lazyWithRetry(() => import("./pages/AboutUs"));
const UserTickets = lazyWithRetry(() => import("./pages/UserTickets"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const DeactivateAccount = lazyWithRetry(() => import("./pages/DeactivateAccount"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const ShortLinkRedirect = lazyWithRetry(() => import("./pages/ShortLinkRedirect"));
const NotificationPreferences = lazyWithRetry(() => import("./pages/NotificationPreferences"));
const FavoritesPage = lazyWithRetry(() => import("./pages/FavoritesPage"));
const EarningsPage = lazyWithRetry(() => import("./pages/EarningsPage"));
const ReviewsPage = lazyWithRetry(() => import("./pages/ReviewsPage"));
const NotificationsPage = lazyWithRetry(() => import("./pages/NotificationsPage"));
const AccountDetailsPage = lazyWithRetry(() => import("./pages/AccountDetailsPage"));
const RentalsPage = lazyWithRetry(() => import("./pages/RentalsPage"));
const OwnerRentalsPage = lazyWithRetry(() => import("./pages/OwnerRentalsPage"));
const RentalDetailPage = lazyWithRetry(() => import("./pages/RentalDetailPage"));
const ListingsPage = lazyWithRetry(() => import("./pages/ListingsPage"));
const BusinessDashboard = lazyWithRetry(() => import("./pages/BusinessDashboard"));
const BusinessOnboarding = lazyWithRetry(() => import("./pages/BusinessOnboarding"));
const ActivityLogPage = lazyWithRetry(() => import("./pages/ActivityLogPage"));
const CheckoutSuccess = lazyWithRetry(() => import("./pages/CheckoutSuccess"));
const CheckoutCancelled = lazyWithRetry(() => import("./pages/CheckoutCancelled"));
const MobileCheckoutReturn = lazyWithRetry(() => import("./pages/MobileCheckoutReturn"));
const KycAppReturn = lazyWithRetry(() => import("./pages/KycAppReturn"));

// Legal pages
const TermsAndConditions = lazyWithRetry(() => import("./pages/legal/TermsAndConditions"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/legal/PrivacyPolicy"));
const CancellationPolicy = lazyWithRetry(() => import("./pages/legal/CancellationPolicy"));
const CookiePolicy = lazyWithRetry(() => import("./pages/legal/CookiePolicy"));
const ImageConsentForm = lazyWithRetry(() => import("./pages/legal/ImageConsentForm"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
// Admin pages
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const AdminReservations = lazyWithRetry(() => import("./pages/admin/AdminReservations"));
const AdminFinances = lazyWithRetry(() => import("./pages/admin/AdminFinances"));
const AdminAnalytics = lazyWithRetry(() => import("./pages/admin/AdminAnalytics"));
const AdminUsers = lazyWithRetry(() => import("./pages/admin/AdminUsers"));
const AdminProducts = lazyWithRetry(() => import("./pages/admin/AdminProducts"));
const AdminTickets = lazyWithRetry(() => import("./pages/admin/AdminTickets"));
const AdminTicketDetail = lazyWithRetry(() => import("./pages/admin/AdminTicketDetail"));
const AdminTicketCreate = lazyWithRetry(() => import("./pages/admin/AdminTicketCreate"));
const AdminSupportAnalytics = lazyWithRetry(() => import("./pages/admin/AdminSupportAnalytics"));
const AdminCategories = lazyWithRetry(() => import("./pages/admin/AdminCategories"));
const AdminUserDetail = lazyWithRetry(() => import("./pages/admin/AdminUserDetail"));
const AdminConversations = lazyWithRetry(() => import("./pages/admin/AdminConversations"));
const AdminConversationDetail = lazyWithRetry(() => import("./pages/admin/AdminConversationDetail"));
const AdminApprovals = lazyWithRetry(() => import("./pages/admin/AdminApprovals"));
const AdminTestEmails = lazyWithRetry(() => import("./pages/admin/AdminTestEmails"));
const AdminNotifications = lazyWithRetry(() => import("./pages/admin/AdminNotifications"));
const AdminSmsLogs = lazyWithRetry(() => import("./pages/admin/AdminSmsLogs"));
const AdminActivityLog = lazyWithRetry(() => import("./pages/admin/AdminActivityLog"));
const AdminNotificationAudit = lazyWithRetry(() => import("./pages/admin/AdminNotificationAudit"));
const AdminWithdrawals = lazyWithRetry(() => import("./pages/admin/AdminWithdrawals"));
const AdminReports = lazyWithRetry(() => import("./pages/admin/AdminReports"));
const InsurerPortal = lazyWithRetry(() => import("./pages/InsurerPortal"));

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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <RouteTracker />
            <Suspense fallback={null}>
              <ConditionalWidgets />
              
              <RentalPopupManager />
              <KycRequiredListener />
              <PhoneVerificationRequiredModal />
              <FullNameConfirmDialog />
            </Suspense>
            <GlobalRealtime />
            <DocumentSignedSuccessHost />
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
                <Route path="/verificare" element={<IdentityVerification />} />
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
                <Route path="/business" element={<BusinessDashboard />} />
                <Route path="/onboarding/business" element={<BusinessOnboarding />} />
                <Route path="/activitate" element={<ActivityLogPage />} />
                <Route path="/rezervari-old" element={<Navigate to="/rezervari" replace />} />
                <Route path="/suport" element={<UserTickets />} />
                <Route path="/cum-functioneaza" element={<HowItWorks />} />
                <Route path="/despre-noi" element={<AboutUs />} />
                <Route path="/termeni-si-conditii" element={<TermsAndConditions />} />
                <Route path="/politica-confidentialitate" element={<PrivacyPolicy />} />
                <Route path="/politica-de-confidentialitate" element={<Navigate to="/politica-confidentialitate" replace />} />
                <Route path="/politica-anulare" element={<CancellationPolicy />} />
                <Route path="/politica-cookies" element={<CookiePolicy />} />
                <Route path="/formular-consimtamant-imagine" element={<ImageConsentForm />} />
                <Route path="/intrebari-frecvente" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dezactivare-cont" element={<DeactivateAccount />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/kyc/app-return" element={<KycAppReturn />} />
                
                {/* Admin routes */}
                <Route path="/admin/asigurari" element={<InsurerPortal />} />
                <Route path="/portal-asigurari" element={<Navigate to="/admin/asigurari" replace />} />
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
                <Route path="/admin/activity" element={<AdminActivityLog />} />
                <Route path="/a/:token" element={<ShortLinkRedirect />} />
                <Route path="/setari/notificari" element={<NotificationPreferences />} />
                
                {/* Integration tests */}
                <Route path="/minicrm-test" element={<MiniCrmTest />} />
                <Route path="/odoo-test" element={<OdooTest />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
           </BrowserRouter>
           <SaveToastHost />
         </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
