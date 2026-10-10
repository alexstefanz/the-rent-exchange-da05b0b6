import { containsProfanityWords } from "@/lib/profanityFilter";
import { z } from "zod";
import { containsContactInfo } from "@/lib/inputValidation";

export type ProductCondition = "new" | "very_good" | "good" | "used";
export type DepositType = "none" | "fixed" | "percent";
export type MinRentalPreset = "1_day" | "weekend" | "3_days" | "7_days" | "custom";

export interface PublishFormData {
  // Step 1
  category: string;
  subcategory: string;

  // Step 2
  title: string;
  description: string;
  condition: ProductCondition | "";
  included_items: string[];
  usage_rules: string[];
  serial_number: string;

  // Step 3
  images: string[];

  // Step 4
  location_county: string;
  location_city: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_available: boolean;
  delivery_available: boolean;
  delivery_fee: number | null;
  delivery_radius_km: number | null;

  // Step 5
  daily_price_owner: number | null;
  deposit_type: DepositType;
  deposit_value: number | null;
  min_rental_preset: MinRentalPreset;
  min_rental_days: number;
  max_rental_days: number | null;
  available_immediately: boolean;
  blocked_dates: string[]; // ISO YYYY-MM-DD

  // Internal
  is_active: boolean;
}

export const emptyPublishForm = (): PublishFormData => ({
  category: "",
  subcategory: "",
  title: "",
  description: "",
  condition: "",
  included_items: [],
  usage_rules: [],
  serial_number: "",
  images: [],
  location_county: "",
  location_city: "",
  pickup_address: "",
  pickup_lat: null,
  pickup_lng: null,
  pickup_available: true,
  delivery_available: false,
  delivery_fee: null,
  delivery_radius_km: null,
  daily_price_owner: null,
  deposit_type: "none",
  deposit_value: null,
  min_rental_preset: "1_day",
  min_rental_days: 1,
  max_rental_days: null,
  available_immediately: true,
  blocked_dates: [],
  is_active: true,
});

const PROFANITY_ERROR =
  "Textul conține un limbaj neadecvat. Te rugăm să păstrezi un ton profesional.";

const CONTACT_ERROR =
  "Nu poți include date de contact (telefon, email sau link-uri). Comunicarea se face doar prin Rentli.";

export const stepValidators = {
  step1: z.object({
    category: z.string().min(1, "Selectează o categorie"),
  }),
  step2: z.object({
    title: z
      .string()
      .min(5, "Titlul trebuie să aibă minim 5 caractere")
      .max(100, "Titlul nu poate depăși 100 caractere")
      .refine((v) => !containsContactInfo(v), { message: CONTACT_ERROR })
      .refine((v) => !containsProfanityWords(v).hit, { message: PROFANITY_ERROR }),
    description: z
      .string()
      .max(2000, "Descrierea nu poate depăși 2000 caractere")
      .refine((v) => !v || !containsContactInfo(v), { message: CONTACT_ERROR })
      .refine((v) => !v || !containsProfanityWords(v).hit, { message: PROFANITY_ERROR })
      .optional()
      .or(z.literal("")),
    condition: z.enum(["new", "very_good", "good", "used"], {
      errorMap: () => ({ message: "Alege starea produsului" }),
    }),
  }),
  step3: z.object({
    images: z.array(z.string().url()).min(1, "Adaugă cel puțin o imagine"),
  }),
  step4: z.object({
    location_county: z.string().min(1, "Selectează județul"),
    location_city: z.string().min(1, "Selectează localitatea"),
  }),
  step5: z.object({
    daily_price_owner: z
      .number({ invalid_type_error: "Introdu un preț valid" })
      .min(2, "Prețul minim este 2 RON")
      .max(999999, "Preț prea mare"),
  }),
};

export const CONDITION_LABELS: Record<ProductCondition, { ro: string; en: string }> = {
  new: { ro: "Nou", en: "New" },
  very_good: { ro: "Foarte bun", en: "Very good" },
  good: { ro: "Bun", en: "Good" },
  used: { ro: "Cu urme de utilizare", en: "Used" },
};

export const DEFAULT_USAGE_RULES = [
  "Doar interior",
  "Fără apă / umiditate",
  "Fără animale",
  "Doar uz personal",
  "Permis profesional",
  "Fără fumat",
] as const;

export const DEFAULT_USAGE_RULES_I18N: Record<(typeof DEFAULT_USAGE_RULES)[number], { ro: string; en: string }> = {
  "Doar interior": { ro: "Doar interior", en: "Indoor only" },
  "Fără apă / umiditate": { ro: "Fără apă / umiditate", en: "No water / humidity" },
  "Fără animale": { ro: "Fără animale", en: "No pets" },
  "Doar uz personal": { ro: "Doar uz personal", en: "Personal use only" },
  "Permis profesional": { ro: "Permis profesional", en: "Professional license required" },
  "Fără fumat": { ro: "Fără fumat", en: "No smoking" },
};