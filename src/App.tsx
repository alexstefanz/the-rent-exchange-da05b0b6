import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import SubcategoryDetail from "./pages/SubcategoryDetail";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import ListItem from "./pages/ListItem";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/cauta" element={<Search />} />
          <Route path="/adauga-anunt" element={<ListItem />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
