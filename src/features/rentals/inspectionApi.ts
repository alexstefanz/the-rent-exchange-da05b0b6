import { supabase } from "@/integrations/supabase/client";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;
const COMPRESS_THRESHOLD = 1 * 1024 * 1024;

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.size <= COMPRESS_THRESHOLD) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Eroare procesare imagine")); };
    img.src = url;
  });
};

export async function uploadInspectionPhoto(file: File, rentalId: string, userId: string): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop() || "jpg";
  const path = `${rentalId}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("rental-inspections")
    .upload(path, compressed, { contentType: compressed.type });

  if (error) throw error;

  const { data } = supabase.storage.from("rental-inspections").getPublicUrl(path);
  return data.publicUrl;
}

export type InspectionPhase = "checkout" | "checkin";
export type InspectionRole = "owner" | "renter";

export interface Inspection {
  id: string;
  rental_id: string;
  user_id: string;
  phase: InspectionPhase;
  role: InspectionRole;
  photos: string[];
  notes: string | null;
  created_at: string;
}

export async function createInspection(
  rentalId: string,
  phase: InspectionPhase,
  role: InspectionRole,
  photos: string[],
  notes?: string
): Promise<Inspection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nu ești autentificat");

  const { data, error } = await supabase
    .from("rental_inspections")
    .insert({
      rental_id: rentalId,
      user_id: user.id,
      phase,
      role,
      photos,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Inspection;
}

export async function getInspections(rentalId: string): Promise<Inspection[]> {
  const { data, error } = await supabase
    .from("rental_inspections")
    .select("*")
    .eq("rental_id", rentalId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as Inspection[];
}
