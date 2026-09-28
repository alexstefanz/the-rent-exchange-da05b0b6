import type { PublishFormData } from "./publishTypes";

export interface QualityScoreItem {
  id: string;
  label: string;
  earned: number;
  max: number;
  done: boolean;
}

export interface QualityScore {
  total: number;
  items: QualityScoreItem[];
  suggestions: string[];
}

type Lang = "ro" | "en";
const tr = (lang: Lang, ro: string, en: string) => (lang === "en" ? en : ro);

export const computeQualityScore = (data: PublishFormData, lang: Lang = "ro"): QualityScore => {
  const items: QualityScoreItem[] = [
    {
      id: "title",
      label: tr(lang, "Titlu descriptiv (≥ 20 caractere)", "Descriptive title (≥ 20 characters)"),
      max: 15,
      earned: data.title.trim().length >= 20 ? 15 : data.title.trim().length >= 5 ? 7 : 0,
      done: data.title.trim().length >= 20,
    },
    {
      id: "description",
      label: tr(lang, "Descriere detaliată (≥ 150 caractere)", "Detailed description (≥ 150 characters)"),
      max: 20,
      earned:
        data.description.trim().length >= 150
          ? 20
          : data.description.trim().length >= 60
            ? 10
            : 0,
      done: data.description.trim().length >= 150,
    },
    {
      id: "images",
      label: tr(lang, "Cel puțin 6 imagini", "At least 6 images"),
      max: 20,
      earned:
        data.images.length >= 6
          ? 20
          : data.images.length >= 3
            ? 12
            : data.images.length >= 1
              ? 5
              : 0,
      done: data.images.length >= 6,
    },
    {
      id: "condition",
      label: tr(lang, "Starea produsului setată", "Product condition set"),
      max: 10,
      earned: data.condition ? 10 : 0,
      done: !!data.condition,
    },
    {
      id: "rules",
      label: tr(lang, "Regulile proprietarului definite", "Owner's rules defined"),
      max: 5,
      earned: data.usage_rules.length > 0 ? 5 : 0,
      done: data.usage_rules.length > 0,
    },
    {
      id: "category",
      label: tr(lang, "Categorie + subcategorie", "Category + subcategory"),
      max: 10,
      earned: data.category && data.subcategory ? 10 : data.category ? 5 : 0,
      done: !!(data.category && data.subcategory),
    },
    {
      id: "location",
      label: tr(lang, "Locație", "Location"),
      max: 10,
      earned: data.location_city
        ? (data.pickup_lat && data.pickup_lng) || data.pickup_address.trim().length >= 5
          ? 10
          : 6
        : 0,
      done: !!(
        data.location_city &&
        ((data.pickup_lat && data.pickup_lng) || data.pickup_address.trim().length >= 5)
      ),
    },
    {
      id: "price",
      label: tr(lang, "Preț setat", "Price set"),
      max: 5,
      earned: data.daily_price_owner && data.daily_price_owner > 0 ? 5 : 0,
      done: !!data.daily_price_owner,
    },
    {
      id: "included",
      label: tr(lang, "Accesorii incluse", "Included accessories"),
      max: 5,
      earned: data.included_items.length > 0 ? 5 : 0,
      done: data.included_items.length > 0,
    },
  ];

  const total = items.reduce((sum, i) => sum + i.earned, 0);

  const suggestions: string[] = [];
  if (data.images.length < 6) {
    const missing = 6 - data.images.length;
    suggestions.push(
      tr(
        lang,
        `Adaugă încă ${missing} ${missing === 1 ? "imagine" : "imagini"} pentru un anunț mai atractiv`,
        `Add ${missing} more ${missing === 1 ? "image" : "images"} for a more attractive listing`,
      ),
    );
  }
  if (data.description.trim().length < 150) {
    const missing = 150 - data.description.trim().length;
    suggestions.push(
      tr(
        lang,
        `Mai adaugă ${missing} caractere la descriere`,
        `Add ${missing} more characters to the description`,
      ),
    );
  }
  if (!data.condition) suggestions.push(tr(lang, "Setează starea produsului", "Set the product condition"));
  if (data.usage_rules.length === 0) suggestions.push(tr(lang, "Adaugă reguli clare de utilizare", "Add clear usage rules"));
  if (!data.subcategory) suggestions.push(tr(lang, "Alege și o subcategorie", "Pick a subcategory too"));
  if (!data.pickup_lat && data.pickup_address.trim().length < 5)
    suggestions.push(
      tr(
        lang,
        "Adaugă adresa (stradă și număr) sau plasează pinul pe hartă",
        "Add the address (street and number) or place the map pin",
      ),
    );

  return { total, items, suggestions: suggestions.slice(0, 4) };
};