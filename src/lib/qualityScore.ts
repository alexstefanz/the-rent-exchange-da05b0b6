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

export const computeQualityScore = (data: PublishFormData): QualityScore => {
  const items: QualityScoreItem[] = [
    {
      id: "title",
      label: "Titlu descriptiv (≥ 20 caractere)",
      max: 15,
      earned: data.title.trim().length >= 20 ? 15 : data.title.trim().length >= 5 ? 7 : 0,
      done: data.title.trim().length >= 20,
    },
    {
      id: "description",
      label: "Descriere detaliată (≥ 150 caractere)",
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
      label: "Cel puțin 6 imagini",
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
      label: "Starea produsului setată",
      max: 10,
      earned: data.condition ? 10 : 0,
      done: !!data.condition,
    },
    {
      id: "rules",
      label: "Reguli de utilizare definite",
      max: 5,
      earned: data.usage_rules.length > 0 ? 5 : 0,
      done: data.usage_rules.length > 0,
    },
    {
      id: "category",
      label: "Categorie + subcategorie",
      max: 10,
      earned: data.category && data.subcategory ? 10 : data.category ? 5 : 0,
      done: !!(data.category && data.subcategory),
    },
    {
      id: "location",
      label: "Locație + pin pe hartă",
      max: 10,
      earned: data.location_city ? (data.pickup_lat && data.pickup_lng ? 10 : 6) : 0,
      done: !!(data.location_city && data.pickup_lat && data.pickup_lng),
    },
    {
      id: "price",
      label: "Preț setat",
      max: 5,
      earned: data.daily_price_owner && data.daily_price_owner > 0 ? 5 : 0,
      done: !!data.daily_price_owner,
    },
    {
      id: "included",
      label: "Accesorii incluse",
      max: 5,
      earned: data.included_items.length > 0 ? 5 : 0,
      done: data.included_items.length > 0,
    },
  ];

  const total = items.reduce((sum, i) => sum + i.earned, 0);

  const suggestions: string[] = [];
  if (data.images.length < 6) {
    suggestions.push(
      `Adaugă încă ${6 - data.images.length} ${data.images.length === 5 ? "imagine" : "imagini"} pentru un anunț mai atractiv`,
    );
  }
  if (data.description.trim().length < 150) {
    suggestions.push(
      `Mai adaugă ${150 - data.description.trim().length} caractere la descriere`,
    );
  }
  if (!data.condition) suggestions.push("Setează starea produsului");
  if (data.usage_rules.length === 0) suggestions.push("Adaugă reguli clare de utilizare");
  if (!data.subcategory) suggestions.push("Alege și o subcategorie");
  if (!data.pickup_lat) suggestions.push("Plasează pinul pe hartă pentru locație exactă");

  return { total, items, suggestions: suggestions.slice(0, 4) };
};