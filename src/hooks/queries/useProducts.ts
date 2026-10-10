import { useQuery } from "@tanstack/react-query";
import { 
  getProducts, 
  getProductById, 
  getMyProducts, 
  getPublicUserProducts,
  getNearbyProducts,
  ProductFilters, 
  Product 
} from "@/features/products/productsApi";

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMyProducts = (ownerId: string | undefined) => {
  return useQuery({
    queryKey: ["my-products", ownerId],
    queryFn: () => getMyProducts(ownerId!),
    enabled: !!ownerId,
    staleTime: 15 * 1000, // short: status changes (admin approval) must show quickly
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
};

export const usePublicUserProducts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-products", userId],
    queryFn: () => getPublicUserProducts(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useNearbyProducts = (
  currentProductId: string | undefined, 
  locationCity: string | null, 
  category: string | null,
  limit: number = 8
) => {
  return useQuery({
    queryKey: ["nearby-products", currentProductId, locationCity, category],
    queryFn: () => getNearbyProducts(currentProductId!, locationCity, category, limit),
    enabled: !!currentProductId,
    staleTime: 5 * 60 * 1000,
  });
};
