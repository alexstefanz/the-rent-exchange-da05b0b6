import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { requireCaller, callerHasRole, unauthorizedResponse } from "../_shared/authGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "rental-pvs";

// Strip Romanian diacritics — Helvetica (StandardFonts) does NOT support them.
function noDia(s: string | null | undefined): string {
  if (!s) return "-";
  return s
    .replace(/[ăâ]/g, "a").replace(/[ĂÂ]/g, "A")
    .replace(/î/g, "i").replace(/Î/g, "I")
    .replace(/[șş]/g, "s").replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t").replace(/[ȚŢ]/g, "T");
}

function fmtDate(d?: string | null) {
  if (!d) return "-";
  try { return new Date(d).toLocaleDateString("ro-RO"); } catch { return d; }
}

function fmtDateTime(d?: string | null) {
  if (!d) return "-";
  try { return new Date(d).toLocaleString("ro-RO"); } catch { return d; }
}

async function decodeDataUrlImage(dataUrl: string | null | undefined): Promise<{ bytes: Uint8Array; mime: string } | null> {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/i);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const b64 = m[3];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const caller = await requireCaller(req);
    if (!caller) return unauthorizedResponse(corsHeaders);
    const { rental_id, phase } = await req.json() as { rental_id: string; phase: "handover" | "return" };
    if (!rental_id || (phase !== "handover" && phase !== "return")) {
      return new Response(JSON.stringify({ error: "rental_id and phase required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: rental, error: rErr } = await admin.from("rentals").select("*").eq("id", rental_id).single();
    if (rErr || !rental) throw new Error("Rental not found");

    // Only rental participants (owner/renter) or admins may generate/read the PV.
    if (caller.kind === "user") {
      const isParty = caller.userId === rental.owner_id || caller.userId === rental.renter_id;
      const isAdmin = !isParty && (await callerHasRole(caller.userId!, "admin"));
      if (!isParty && !isAdmin) return unauthorizedResponse(corsHeaders);
    }

    const [productRes, ownerRes, renterRes, pvRes] = await Promise.all([
      admin.from("products").select("title, category, included_items, daily_price_owner, deposit_value").eq("id", rental.product_id).maybeSingle(),
      admin.from("profiles").select("full_name, email, phone").eq("id", rental.owner_id).maybeSingle(),
      admin.from("profiles").select("full_name, email, phone").eq("id", rental.renter_id).maybeSingle(),
      admin.from("rental_pv_documents").select("*").eq("rental_id", rental_id).eq("phase", phase).maybeSingle(),
    ]);
    if (productRes.error) console.error("[generate-pv-pdf] product lookup failed:", productRes.error.message);
    const product = productRes.data;
    const owner = ownerRes.data;
    const renter = renterRes.data;
    const pv = pvRes.data;

    if (!pv) throw new Error("PV document not found");

    // ─── Build PDF ────────────────────────────────────────────────────────
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const PAGE_W = 595.28; // A4
    const PAGE_H = 841.89;
    const MARGIN_X = 50;
    let page = pdf.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - 60;

    const ink = rgb(0.1, 0.08, 0.06);
    const muted = rgb(0.42, 0.39, 0.38);
    const accent = rgb(0.961, 0.620, 0.043); // #F59E0B

    function newPageIfNeeded(need: number) {
      if (y - need < 60) {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 60;
      }
    }

    function drawWrapped(text: string, size: number, opts: { bold?: boolean; color?: any; lineGap?: number } = {}) {
      const useFont = opts.bold ? fontBold : font;
      const color = opts.color ?? ink;
      const maxW = PAGE_W - MARGIN_X * 2;
      const words = noDia(text).split(/\s+/);
      let line = "";
      const lineHeight = size + (opts.lineGap ?? 4);
      for (const w of words) {
        const test = line ? line + " " + w : w;
        const width = useFont.widthOfTextAtSize(test, size);
        if (width > maxW && line) {
          newPageIfNeeded(lineHeight);
          page.drawText(line, { x: MARGIN_X, y, size, font: useFont, color });
          y -= lineHeight;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) {
        newPageIfNeeded(lineHeight);
        page.drawText(line, { x: MARGIN_X, y, size, font: useFont, color });
        y -= lineHeight;
      }
    }

    // ── Header ────────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: PAGE_H - 36, width: PAGE_W, height: 36, color: accent });
    page.drawText("RENTLI", { x: MARGIN_X, y: PAGE_H - 24, size: 14, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Marketplace pentru inchirieri in Romania", { x: MARGIN_X + 70, y: PAGE_H - 23, size: 9, font, color: rgb(1, 1, 1) });

    y = PAGE_H - 70;
    const title = phase === "handover" ? "PROCES-VERBAL DE PREDARE-PRIMIRE" : "PROCES-VERBAL DE RETURNARE";
    page.drawText(title, { x: MARGIN_X, y, size: 16, font: fontBold, color: ink });
    y -= 22;
    page.drawText(`Rezervare: ${rental.public_id ?? rental.id.slice(0, 8)}  |  Generat: ${fmtDateTime(new Date().toISOString())}`,
      { x: MARGIN_X, y, size: 9, font, color: muted });
    y -= 24;

    // ── Parties ───────────────────────────────────────────────────────────
    drawWrapped("PARTILE CONTRACTANTE", 11, { bold: true });
    y -= 4;
    drawWrapped(
      `Predator (proprietar): ${owner?.full_name ?? "-"}, telefon ${owner?.phone ?? "-"}, email ${owner?.email ?? "-"}.`,
      10
    );
    drawWrapped(
      `Primitor (chirias): ${renter?.full_name ?? "-"}, telefon ${renter?.phone ?? "-"}, email ${renter?.email ?? "-"}.`,
      10
    );
    y -= 8;

    // ── Object ────────────────────────────────────────────────────────────
    drawWrapped("OBIECTUL INCHIRIERII", 11, { bold: true });
    y -= 4;
    drawWrapped(
      `Produs: ${product?.title ?? "-"}${product?.category ? ` (categoria ${product.category})` : ""}.`,
      10
    );
    drawWrapped(
      `Perioada: ${fmtDate(rental.start_date)} - ${fmtDate(rental.end_date)} (${rental.rental_days} zile).`,
      10
    );
    drawWrapped(
      `Pret: ${rental.daily_price ?? product?.daily_price_owner ?? 0} RON/zi  |  Subtotal: ${rental.subtotal ?? 0} RON  |  Garantie: ${product?.deposit_value ?? 0} RON.`,
      10
    );
    const items = (product?.included_items as string[] | null) || [];
    if (items.length) {
      drawWrapped(`Accesorii incluse: ${items.join(", ")}.`, 10);
    }
    y -= 8;

    // ── Clauses ───────────────────────────────────────────────────────────
    drawWrapped(
      phase === "handover" ? "DECLARATIE LA PREDARE" : "DECLARATIE LA RETURNARE",
      11, { bold: true }
    );
    y -= 4;
    drawWrapped(
      phase === "handover"
        ? "Primitorul declara ca a verificat bunul si il accepta in starea documentata prin fotografiile anexate in platforma Rentli, obligandu-se sa il utilizeze conform destinatiei sale, sa il pastreze in bune conditii si sa il returneze la termenul stabilit, in aceeasi stare, cu exceptia uzurii normale."
        : "Primitorul restituie bunul catre Predator, iar Predatorul confirma primirea acestuia in starea documentata prin fotografiile anexate in platforma Rentli. Eventualele daune constatate la momentul returnarii vor fi reglementate prin intermediul platformei Rentli, conform termenilor si conditiilor agreate.",
      10
    );
    y -= 6;
    drawWrapped(`Fotografii anexate in platforma: ${(pv.photos || []).length} buc.`, 10, { color: muted });
    y -= 14;

    // ── Signatures ────────────────────────────────────────────────────────
    newPageIfNeeded(180);
    drawWrapped("SEMNATURI", 11, { bold: true });
    y -= 6;

    const sigBoxW = (PAGE_W - MARGIN_X * 2 - 20) / 2;
    const sigBoxH = 90;
    const sigY = y - sigBoxH;

    async function embedSig(dataUrl: string | null | undefined, x: number, boxY: number) {
      const img = await decodeDataUrlImage(dataUrl);
      if (!img) return;
      try {
        const embedded = img.mime.includes("png")
          ? await pdf.embedPng(img.bytes)
          : await pdf.embedJpg(img.bytes);
        const ratio = embedded.width / embedded.height;
        let w = sigBoxW - 16, h = w / ratio;
        if (h > sigBoxH - 20) { h = sigBoxH - 20; w = h * ratio; }
        page.drawImage(embedded, { x: x + (sigBoxW - w) / 2, y: boxY + 18, width: w, height: h });
      } catch (e) {
        console.warn("Signature embed failed", e);
      }
    }

    // Owner box
    page.drawRectangle({ x: MARGIN_X, y: sigY, width: sigBoxW, height: sigBoxH, borderColor: muted, borderWidth: 0.5 });
    page.drawText("Predator (proprietar)", { x: MARGIN_X + 6, y: sigY + sigBoxH - 12, size: 9, font: fontBold, color: ink });
    page.drawText(noDia(owner?.full_name ?? "-"), { x: MARGIN_X + 6, y: sigY + 6, size: 8, font, color: muted });
    page.drawText(`Semnat: ${fmtDateTime(pv.owner_signed_at)}`, { x: MARGIN_X + sigBoxW - 160, y: sigY + 6, size: 8, font, color: muted });
    await embedSig(pv.owner_signature_data, MARGIN_X, sigY);

    // Renter box
    const rX = MARGIN_X + sigBoxW + 20;
    page.drawRectangle({ x: rX, y: sigY, width: sigBoxW, height: sigBoxH, borderColor: muted, borderWidth: 0.5 });
    page.drawText("Primitor (chirias)", { x: rX + 6, y: sigY + sigBoxH - 12, size: 9, font: fontBold, color: ink });
    page.drawText(noDia(renter?.full_name ?? "-"), { x: rX + 6, y: sigY + 6, size: 8, font, color: muted });
    page.drawText(`Semnat: ${fmtDateTime(pv.renter_signed_at)}`, { x: rX + sigBoxW - 160, y: sigY + 6, size: 8, font, color: muted });
    await embedSig(pv.renter_signature_data, rX, sigY);

    y = sigY - 16;

    // ── Footer ────────────────────────────────────────────────────────────
    page.drawText("Document generat automat de platforma Rentli. Valabilitate juridica conform T&C Rentli.",
      { x: MARGIN_X, y: 36, size: 8, font, color: muted });

    const pdfBytes = await pdf.save();

    // ── Upload ────────────────────────────────────────────────────────────
    const path = `${rental_id}/generated/${phase}.pdf`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, pdfBytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

    // Mark generated_at on the PV row (best-effort)
    await admin.from("rental_pv_documents")
      .update({ generated_at: new Date().toISOString(), pdf_path: path })
      .eq("id", pv.id);

    // 7-day signed URL
    const { data: signed, error: signErr } = await admin.storage.from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr || !signed) throw new Error(`Sign URL failed: ${signErr?.message}`);

    // Base64 for attachment use
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < pdfBytes.length; i += CHUNK) {
      binary += String.fromCharCode(...pdfBytes.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);

    return new Response(JSON.stringify({
      success: true,
      path,
      signed_url: signed.signedUrl,
      filename: `PV-${phase}-${rental.public_id ?? rental_id.slice(0, 8)}.pdf`,
      base64,
      size: pdfBytes.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[generate-pv-pdf] error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});