import { categories } from "@/data/categories";
import type { Product } from "@/features/products/productsApi";

/**
 * Returns the localized product title, falling back to the Romanian title
 * when the English translation is not yet available.
 */
export const getDisplayTitle = (
  product: Pick<Product, "title" | "title_en">,
  language: "ro" | "en"
): string => {
  if (language === "en" && product.title_en) return product.title_en;
  return product.title;
};

/**
 * Returns the localized product description with the same fallback rule.
 */
export const getDisplayDescription = (
  product: Pick<Product, "description" | "description_en">,
  language: "ro" | "en"
): string | null | undefined => {
  if (language === "en" && product.description_en) return product.description_en;
  return product.description;
};

/**
 * Returns the localized included_items list with fallback to the original.
 */
export const getDisplayIncludedItems = (
  product: { included_items?: string[] | null; included_items_en?: string[] | null },
  language: "ro" | "en"
): string[] => {
  const ro = product.included_items ?? [];
  const en = product.included_items_en ?? [];
  if (language === "en" && en.length === ro.length && en.length > 0) return en;
  return ro;
};

// Build a fast lookup table from RO category name to EN counterpart.
const categoryNameMap = new Map<string, string>();
const subcategoryNameMap = new Map<string, string>();
for (const cat of categories) {
  categoryNameMap.set(cat.name, cat.nameEn);
  for (const sub of cat.subcategories) {
    subcategoryNameMap.set(sub.name, sub.nameEn);
  }
}

export const getCategoryNameEn = (name: string | null | undefined): string => {
  if (!name) return "";
  return categoryNameMap.get(name) || name;
};

export const getSubcategoryNameEn = (name: string | null | undefined): string => {
  if (!name) return "";
  return subcategoryNameMap.get(name) || name;
};

export const getDisplayCategory = (
  name: string | null | undefined,
  language: "ro" | "en"
): string => {
  if (!name) return "";
  return language === "en" ? getCategoryNameEn(name) : name;
};

export const getDisplaySubcategory = (
  name: string | null | undefined,
  language: "ro" | "en"
): string => {
  if (!name) return "";
  return language === "en" ? getSubcategoryNameEn(name) : name;
};
