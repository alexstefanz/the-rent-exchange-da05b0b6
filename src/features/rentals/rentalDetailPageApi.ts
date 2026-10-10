import { supabase } from "@/integrations/supabase/client";

export interface RentalFullDetail {
  id: string;
  public_id: string;
  status: string;
  payment_status: string;
  rejection_reason: string | null;
  start_date: string;
  end_date: string;
  rental_days: number;
  daily_price: number;
  subtotal: number;
  platform_fee: number;
  owner_payout: number;
  pickup_location: string | null;
  pickup_time: string | null;
  handover_confirmed_at: string | null;
  return_confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  dispute_status: string | null;
  early_return_status: string | null;
  is_test_payment: boolean;
  created_at: string;
  product_id: string | null;
  product_title: string | null;
  product_image: string | null;
  product_category: string | null;
  product_included_items: string[] | null;
  product_deposit_value: number | null;
  product_location_city: string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  renter_id: string | null;
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  handover_pv_generated_at: string | null;
  handover_pv_owner_signed_at: string | null;
  handover_pv_renter_signed_at: string | null;
  return_pv_generated_at: string | null;
  return_pv_owner_signed_at: string | null;
  return_pv_renter_signed_at: string | null;
  cancel_request_status?: string | null;
  cancel_request_initiator?: string | null;
  cancel_request_subject?: string | null;
  cancel_request_reason?: string | null;
  cancel_request_created_at?: string | null;
  cancel_request_responded_at?: string | null;
  cancel_request_response_note?: string | null;
}

export async function getRentalFullDetail(publicId: string): Promise<RentalFullDetail | null> {
  const { data, error } = await supabase.rpc("get_rental_full_detail", { _public_id: publicId });
  if (error) throw error;
  const row = (data as any[])?.[0];
  if (!row) return null;
  // Augment with cancel_request_* fields (not part of the RPC payload)
  try {
    const { data: c } = await supabase
      .from("rentals")
      .select("stripe_fee, cancellation_reason, cancelled_by, wallet_credit_applied, cancel_request_status, cancel_request_initiator, cancel_request_subject, cancel_request_reason, cancel_request_created_at, cancel_request_responded_at, cancel_request_response_note")
      .eq("id", (row as any).id)
      .maybeSingle();
    return { ...(row as RentalFullDetail), ...(c || {}) } as RentalFullDetail;
  } catch {
    return row as RentalFullDetail;
  }
}

export interface PvDocument {
  id: string;
  rental_id: string;
  phase: "handover" | "return";
  pdf_path: string | null;
  photos: string[];
  photos_meta: PvPhotoMeta[];
  owner_signature_data: string | null;
  renter_signature_data: string | null;
  owner_signed_at: string | null;
  renter_signed_at: string | null;
  generated_at: string | null;
}

export interface PvPhotoMeta {
  path: string;
  role: "owner" | "renter";
  uploaded_at: string;
}

export async function getPvDocument(rentalId: string, phase: "handover" | "return"): Promise<PvDocument | null> {
  const { data, error } = await supabase
    .from("rental_pv_documents")
    .select("*")
    .eq("rental_id", rentalId)
    .eq("phase", phase)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const d: any = data;
  // Normalize: ensure photos_meta exists; backfill from photos if needed
  const meta: PvPhotoMeta[] = Array.isArray(d.photos_meta) ? d.photos_meta : [];
  if (meta.length === 0 && Array.isArray(d.photos) && d.photos.length > 0) {
    for (const p of d.photos) meta.push({ path: p, role: "owner", uploaded_at: new Date().toISOString() });
  }
  return { ...d, photos_meta: meta } as PvDocument;
}

export async function upsertPvPhotos(rentalId: string, phase: "handover" | "return", photos: string[]) {
  const { error } = await supabase
    .from("rental_pv_documents")
    .upsert(
      { rental_id: rentalId, phase, photos },
      { onConflict: "rental_id,phase" },
    );
  if (error) throw error;
}

/** Add a photo for the given uploader. Creates the PV row if missing. */
export async function addPvPhoto(args: { rentalId: string; phase: "handover" | "return"; role: "owner" | "renter"; path: string }) {
  const existing = await getPvDocument(args.rentalId, args.phase);
  const meta: PvPhotoMeta[] = existing?.photos_meta ?? [];
  meta.push({ path: args.path, role: args.role, uploaded_at: new Date().toISOString() });
  const photos = meta.map((m) => m.path);
  const { error } = await supabase
    .from("rental_pv_documents")
    .upsert(
      { rental_id: args.rentalId, phase: args.phase, photos, photos_meta: meta as any },
      { onConflict: "rental_id,phase" },
    );
  if (error) throw error;
}

/** Remove a photo (only the uploader's own; caller enforces). Also deletes from storage. */
export async function removePvPhoto(args: { rentalId: string; phase: "handover" | "return"; path: string }) {
  const existing = await getPvDocument(args.rentalId, args.phase);
  if (!existing) return;
  const meta = (existing.photos_meta || []).filter((m) => m.path !== args.path);
  const photos = meta.map((m) => m.path);
  const { error } = await supabase
    .from("rental_pv_documents")
    .update({ photos, photos_meta: meta as any })
    .eq("rental_id", args.rentalId)
    .eq("phase", args.phase);
  if (error) throw error;
  // Best-effort storage cleanup
  try { await supabase.storage.from("rental-pvs").remove([args.path]); } catch { /* noop */ }
}

export async function savePvSignatureAndPdf(args: {
  rentalId: string;
  phase: "handover" | "return";
  role: "owner" | "renter";
  signatureDataUrl: string;
  pdfPath?: string | null;
}) {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = {};
  if (args.role === "owner") {
    update.owner_signature_data = args.signatureDataUrl;
    update.owner_signed_at = now;
  } else {
    update.renter_signature_data = args.signatureDataUrl;
    update.renter_signed_at = now;
  }
  if (args.pdfPath !== undefined && args.pdfPath !== null) {
    update.pdf_path = args.pdfPath;
    update.generated_at = now;
  }
  const { error } = await supabase
    .from("rental_pv_documents")
    .update(update as never)
    .eq("rental_id", args.rentalId)
    .eq("phase", args.phase);
  if (error) throw error;
}

export async function uploadPvPhoto(file: Blob, rentalId: string, phase: "handover" | "return"): Promise<string> {
  const ext = (file as File).name?.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${rentalId}/${phase}/photos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("rental-pvs").upload(filename, file, { upsert: false });
  if (error) throw error;
  return filename;
}

export async function uploadPvPdf(blob: Blob, rentalId: string, phase: "handover" | "return"): Promise<string> {
  const filename = `${rentalId}/${phase}/proces-verbal-${phase}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("rental-pvs").upload(filename, blob, {
    upsert: false,
    contentType: "application/pdf",
  });
  if (error) throw error;
  return filename;
}

export async function getPvFileSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("rental-pvs").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Update only the pdf_path on a PV (used for regeneration without touching signatures). */
export async function updatePvPdfPath(rentalId: string, phase: "handover" | "return", pdfPath: string) {
  const { error } = await supabase
    .from("rental_pv_documents")
    .update({ pdf_path: pdfPath, generated_at: new Date().toISOString() } as never)
    .eq("rental_id", rentalId)
    .eq("phase", phase);
  if (error) throw error;
}

/** Initiate the return phase (renter clicks "Iniciaza returnarea"). */
export async function initiateReturn(rentalId: string) {
  const { error } = await supabase.rpc("initiate_return" as never, { _rental_id: rentalId } as never);
  if (error) throw error;
  // Notify owner (and renter) that the return phase has started.
  const { data: userData } = await supabase.auth.getUser();
  supabase.functions
    .invoke("notify-rental-event", {
      body: { rental_id: rentalId, event_key: "return_in_progress", actor_id: userData?.user?.id },
    })
    .catch((e) => console.warn("notify return_in_progress failed", e));
}

/** Check if the return phase has been initiated (= return PV row exists). */
export async function getReturnInitiated(rentalId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("rental_pv_documents")
    .select("id")
    .eq("rental_id", rentalId)
    .eq("phase", "return")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** Renter confirms they physically received the product (after handover PV is signed by both). */
export async function confirmHandoverReceived(rentalId: string) {
  const { error } = await supabase.rpc("confirm_handover_received" as never, { _rental_id: rentalId } as never);
  if (error) throw error;
  // Note: handover_confirmed notification is fired by the DB trigger
  // `rentals_notify_status` when `handover_confirmed_at` transitions from NULL.
  // Do NOT invoke notify-rental-event here — it causes duplicate emails.
}