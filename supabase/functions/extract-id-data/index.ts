// Extract Romanian ID card data (CNP, series, number, name, address) from the
// ID_FRONT / ID_BACK images uploaded for a KYC case, using Lovable AI (Gemini).
// Saves the result in public.kyc_extracted_data. Non-blocking: callers should
// ignore failures.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

interface ExtractRequest {
  kyc_case_id: string;
}

function validateCnp(cnp: string | null | undefined): boolean {
  if (!cnp) return false;
  if (!/^\d{13}$/.test(cnp)) return false;
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cnp[i], 10) * weights[i];
  let check = sum % 11;
  if (check === 10) check = 1;
  return check === parseInt(cnp[12], 10);
}

function cleanText(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length > 0 && t.toLowerCase() !== "null" ? t : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "lovable_api_key_missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = (await req.json()) as ExtractRequest;
    if (!body?.kyc_case_id) {
      return new Response(JSON.stringify({ error: "missing_kyc_case_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up the case + user
    const { data: kycCase, error: caseErr } = await admin
      .from("kyc_cases")
      .select("id, user_id")
      .eq("id", body.kyc_case_id)
      .single();
    if (caseErr || !kycCase) {
      return new Response(JSON.stringify({ error: "case_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ID_FRONT (and ID_BACK if present)
    const { data: docs } = await admin
      .from("kyc_documents")
      .select("document_type, file_url")
      .eq("kyc_case_id", body.kyc_case_id)
      .in("document_type", ["ID_FRONT", "ID_BACK"]);

    if (!docs || docs.length === 0) {
      return new Response(JSON.stringify({ error: "no_id_documents" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build signed URLs (file_url can be either a storage path or a public URL)
    const imageUrls: string[] = [];
    for (const doc of docs) {
      let path = doc.file_url as string;
      if (path.includes("/kyc-documents/")) path = path.split("/kyc-documents/")[1];
      const { data: signed } = await admin.storage
        .from("kyc-documents")
        .createSignedUrl(path, 600);
      if (signed?.signedUrl) imageUrls.push(signed.signedUrl);
    }
    if (imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "no_signed_urls" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI (Gemini) with vision input + structured output
    const systemPrompt =
      "Esti un OCR specializat in carti de identitate romanesti (CI). " +
      "Extrage exact urmatoarele campuri din imaginea documentului si raspunde " +
      "STRICT in format JSON valid, fara explicatii, fara markdown, fara backticks. " +
      'Daca un camp nu este vizibil sau nu poti sa il citesti cu certitudine, foloseste null. ' +
      "Schema raspunsului: " +
      '{"cnp": "string sau null - 13 cifre", ' +
      '"id_series": "string sau null - 2 litere mari (ex: RR, RX, RT)", ' +
      '"id_number": "string sau null - 6 cifre", ' +
      '"full_name": "string sau null - NUME PRENUME complet", ' +
      '"address": "string sau null - adresa completa de domiciliu", ' +
      '"birth_date": "string sau null - format YYYY-MM-DD", ' +
      '"issued_by": "string sau null - autoritatea emitenta (SPCLEP/SCEP)", ' +
      '"valid_until": "string sau null - format YYYY-MM-DD", ' +
      '"confidence": "numar intre 0 si 1 - cat de increzator esti in extractie"}';

    const userContent: any[] = [
      { type: "text", text: "Extrage datele din aceasta carte de identitate romaneasca." },
      ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
    ];

    const aiResp = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "ai_error", status: aiResp.status, detail: txt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const rawContent: string = aiJson?.choices?.[0]?.message?.content ?? "";
    // strip markdown fences if present
    const cleaned = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to recover the first {...} block
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch { /* noop */ }
      }
    }
    if (!parsed) {
      return new Response(JSON.stringify({ error: "parse_failed", raw: rawContent }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cnp = cleanText(parsed.cnp);
    if (cnp && !validateCnp(cnp)) {
      console.warn("CNP failed checksum, keeping but flagging confidence", cnp);
    }

    const row = {
      user_id: kycCase.user_id,
      kyc_case_id: kycCase.id,
      cnp,
      id_series: cleanText(parsed.id_series)?.toUpperCase() ?? null,
      id_number: cleanText(parsed.id_number),
      full_name: cleanText(parsed.full_name),
      address: cleanText(parsed.address),
      birth_date: cleanText(parsed.birth_date),
      issued_by: cleanText(parsed.issued_by),
      valid_until: cleanText(parsed.valid_until),
      extraction_model: MODEL,
      extraction_confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
      extraction_raw: parsed,
      extracted_at: new Date().toISOString(),
      verified_by_admin: false,
    };

    const { error: upErr } = await admin
      .from("kyc_extracted_data")
      .upsert(row, { onConflict: "user_id" });
    if (upErr) {
      console.error("upsert kyc_extracted_data failed", upErr);
      return new Response(JSON.stringify({ error: "save_failed", detail: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit
    await admin.from("kyc_audit_log").insert({
      kyc_case_id: kycCase.id,
      action: "ID_DATA_EXTRACTED",
      old_value: null,
      new_value: `cnp=${cnp ? "***" + cnp.slice(-4) : "null"}; series=${row.id_series}; number=${row.id_number}; confidence=${row.extraction_confidence}`,
      actor_type: "SYSTEM",
    });

    return new Response(JSON.stringify({ ok: true, extracted: row }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-id-data crash", e);
    return new Response(JSON.stringify({ error: "internal_error", detail: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});