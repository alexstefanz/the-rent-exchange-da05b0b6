import { supabase } from "@/integrations/supabase/client";
import { handleApiError } from "@/lib/errorHandler";

export const uploadProductImage = async (
  file: File,
  userId: string
): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (uploadError) {
    handleApiError("Error uploading image", uploadError);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const deleteProductImage = async (imageUrl: string): Promise<void> => {
  // Extract the path from the URL
  const urlParts = imageUrl.split("/product-images/");
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from("product-images")
    .remove([filePath]);

  if (error) {
    handleApiError("Error deleting image", error);
  }
};
