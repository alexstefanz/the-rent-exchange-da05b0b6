import { supabase } from "@/integrations/supabase/client";

export interface GenerateDescriptionPayload {
  title: string;
  category?: string;
  subcategory?: string;
  condition?: string;
  included_items?: string[];
  usage_rules?: string[];
}

export const generateProductDescription = async (
  payload: GenerateDescriptionPayload,
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke<{ description?: string; error?: string }>(
    "generate-product-description",
    { body: payload },
  );

  if (error) throw new Error(error.message || "Eroare AI");
  if (!data?.description) throw new Error(data?.error || "Răspuns AI gol");
  return data.description;
};
