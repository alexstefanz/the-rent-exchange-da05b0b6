import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import DebugSupabase from "./pages/DebugSupabase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/categorii" element={<Categories />} />
            <Route path="/categorie/:id" element={<CategoryDetail />} />
            <Route path="/subcategorie/:id" element={<SubcategoryDetail />} />
            <Route path="/produs/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cauta" element={<Search />} />
            <Route path="/adauga-anunt" element={<ListItem />} />
            <Route path="/utilizator/:id" element={<UserProfile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/owner" element={<Owner />} />
            <Route path="/owner/new-product" element={<NewProduct />} />
            <Route path="/owner/edit-product/:id" element={<EditProduct />} />
            <Route path="/debug-supabase" element={<DebugSupabase />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
