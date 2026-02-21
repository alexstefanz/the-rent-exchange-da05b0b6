import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import SubcategoryDetail from "./pages/SubcategoryDetail";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import ListItem from "./pages/ListItem";
import Checkout from "./pages/Checkout";
import UserProfile from "./pages/UserProfile";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Owner from "./pages/Owner";
import NewProduct from "./pages/NewProduct";
import EditProduct from "./pages/EditProduct";
import Messages from "./pages/Messages";
import HelpCenter from "./pages/HelpCenter";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminFinances from "./pages/admin/AdminFinances";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminKYC from "./pages/admin/AdminKYC";

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
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reservations" element={<AdminReservations />} />
              <Route path="/admin/finances" element={<AdminFinances />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
