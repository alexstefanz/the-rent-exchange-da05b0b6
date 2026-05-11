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

  // Return scoped reference instead of public URL (bucket is private)
  return `rental-inspections://${path}`;
}

const PUBLIC_URL_PREFIX = "/storage/v1/object/public/rental-inspections/";

export function extractInspectionPath(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("rental-inspections://")) {
    return value.slice("rental-inspections://".length);
  }
  const idx = value.indexOf(PUBLIC_URL_PREFIX);
  if (idx >= 0) {
    return value.slice(idx + PUBLIC_URL_PREFIX.length);
  }
  return null;
}

export async function getInspectionSignedUrl(reference: string): Promise<string | null> {
  const path = extractInspectionPath(reference);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("rental-inspections")
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export type InspectionPhase = "checkout" | "checkin";
export type InspectionRole = "owner" | "renter";

/** Minimum photos required by the digital PV (proces verbal). */
export const MIN_INSPECTION_PHOTOS = 3;

export const INSPECTION_CHECKLIST_KEYS = [
  "functional",
  "no_defects",
  "complete_accessories",
  "clean",
  "packaging",
  "verified_together",
] as const;

export type InspectionChecklistKey = typeof INSPECTION_CHECKLIST_KEYS[number];
export type InspectionChecklist = Record<InspectionChecklistKey, boolean>;

export const emptyChecklist = (): InspectionChecklist =>
  INSPECTION_CHECKLIST_KEYS.reduce((acc, k) => {
    acc[k] = false;
    return acc;
  }, {} as InspectionChecklist);

export const normalizeChecklist = (raw: unknown): InspectionChecklist => {
  const base = emptyChecklist();
  if (raw && typeof raw === "object") {
    for (const k of INSPECTION_CHECKLIST_KEYS) {
      base[k] = Boolean((raw as Record<string, unknown>)[k]);
    }
  }
  return base;
};

export const countChecked = (c: InspectionChecklist): number =>
  INSPECTION_CHECKLIST_KEYS.reduce((n, k) => n + (c[k] ? 1 : 0), 0);

export interface Inspection {
  id: string;
  rental_id: string;
  user_id: string;
  phase: InspectionPhase;
  role: InspectionRole;
  photos: string[];
  notes: string | null;
  checklist: InspectionChecklist;
  created_at: string;
  locked_at?: string | null;
  declaration_accepted?: boolean;
  metadata?: Record<string, unknown> | null;
}

export async function createInspection(
  rentalId: string,
  phase: InspectionPhase,
  role: InspectionRole,
  photos: string[],
  notes: string | undefined,
  checklist: InspectionChecklist,
  declarationAccepted: boolean
): Promise<Inspection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nu ești autentificat");

  if (photos.length < MIN_INSPECTION_PHOTOS) {
    throw new Error(`Adaugă minim ${MIN_INSPECTION_PHOTOS} poze`);
  }
  if (!declarationAccepted) {
    throw new Error("Trebuie să accepți declarația de predare");
  }

  const metadata = {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : null,
    submittedAt: new Date().toISOString(),
    photoCount: photos.length,
  };

  const { data, error } = await supabase
    .from("rental_inspections")
    .insert({
      rental_id: rentalId,
      user_id: user.id,
      phase,
      role,
      photos,
      notes: notes || null,
      checklist: checklist as unknown as any,
      declaration_accepted: declarationAccepted,
      metadata: metadata as any,
    })
    .select()
    .single();

  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { ...(row as object), checklist: normalizeChecklist(row.checklist) } as Inspection;
}

export async function getInspections(rentalId: string): Promise<Inspection[]> {
  const { data, error } = await supabase
    .from("rental_inspections")
    .select("*")
    .eq("rental_id", rentalId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((row) => ({
    ...(row as object),
    checklist: normalizeChecklist((row as Record<string, unknown>).checklist),
  })) as Inspection[];
}
