import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";

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
const Owner = lazy(() => import("./pages/Owner"));
const NewProduct = lazy(() => import("./pages/NewProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Messages = lazy(() => import("./pages/Messages"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MiniCrmTest = lazy(() => import("./pages/MiniCrmTest"));
const OdooTest = lazy(() => import("./pages/OdooTest"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const UserTickets = lazy(() => import("./pages/UserTickets"));
const KycVerification = lazy(() => import("./pages/KycVerification"));

// Legal pages
const TermsAndConditions = lazy(() => import("./pages/legal/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const CancellationPolicy = lazy(() => import("./pages/legal/CancellationPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReservations = lazy(() => import("./pages/admin/AdminReservations"));
const AdminFinances = lazy(() => import("./pages/admin/AdminFinances"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminTicketDetail = lazy(() => import("./pages/admin/AdminTicketDetail"));
const AdminTicketCreate = lazy(() => import("./pages/admin/AdminTicketCreate"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminKYCDetail = lazy(() => import("./pages/admin/AdminKYCDetail"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/categorii" element={<Categories />} />
                <Route path="/categorie/:id" element={<CategoryDetail />} />
                <Route path="/subcategorie/:id" element={<SubcategoryDetail />} />
                <Route path="/produs/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/cauta" element={<Search />} />
                <Route path="/adauga-anunt" element={<Navigate to="/owner/new-product" replace />} />
                <Route path="/utilizator/:id" element={<UserProfile />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/owner" element={<Owner />} />
                <Route path="/owner/new-product" element={<NewProduct />} />
                <Route path="/owner/edit-product/:id" element={<EditProduct />} />
                <Route path="/mesaje" element={<Messages />} />
                <Route path="/favorite" element={<Navigate to="/profile#favorite" replace />} />
                <Route path="/rezervari" element={<Navigate to="/profile#inchirieri" replace />} />
                <Route path="/centru-asistenta" element={<HelpCenter />} />
                <Route path="/suport" element={<UserTickets />} />
                <Route path="/verificare" element={<KycVerification />} />
                <Route path="/cum-functioneaza" element={<HowItWorks />} />
                <Route path="/despre-noi" element={<AboutUs />} />
                <Route path="/termeni-si-conditii" element={<TermsAndConditions />} />
                <Route path="/politica-confidentialitate" element={<PrivacyPolicy />} />
                <Route path="/politica-anulare" element={<CancellationPolicy />} />
                <Route path="/politica-cookies" element={<CookiePolicy />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/reservations" element={<AdminReservations />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
                <Route path="/admin/tickets/new" element={<AdminTicketCreate />} />
                <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/finances" element={<AdminFinances />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/kyc" element={<AdminKYC />} />
                <Route path="/admin/kyc/:id" element={<AdminKYCDetail />} />
                
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
