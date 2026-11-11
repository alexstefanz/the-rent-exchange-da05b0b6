import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { getPvFinancials } from "./pvContent";

describe("PV reservation charges", () => {
  test("includes the recorded platform commission and Stripe charge", () => {
    assert.equal(getPvFinancials({ subtotal: 2, platform_fee: 0, stripe_fee: 1.03 }).total, 3.03);
    assert.deepEqual(getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.61 }), {
      subtotal: 100, platformFee: 15, stripeFee: 2.61, insuranceFee: 0, total: 117.61,
    });
  });

  test("includes insurance only when the reservation carries a charge", () => {
    const insured = getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.75, insurance_fee: 10 });
    assert.equal(insured.insuranceFee, 10);
    assert.equal(insured.total, 127.75);
    assert.equal(getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.61, insurance_fee: 0 }).insuranceFee, 0);
  });
});
import { buildPvRichContent } from "./pvContent";

const rental: any = {
  public_id: "RNT-000001", owner_name: "Ion", renter_name: "Ana", start_date: "2026-11-01", end_date: "2026-11-03",
  rental_days: 2, daily_price: 10, subtotal: 20, platform_fee: 3, stripe_fee: 1.28, insurance_fee: 0,
  product_title: "Cort", product_category: "Camping", product_included_items: ["Husa"], dispute_status: null,
};

describe("PV follows the official template", () => {
  test("handover: sections in template order, live signatures after section 5", () => {
    const c = buildPvRichContent(rental, "handover");
    assert.deepEqual(c.sections.map((s) => s.heading), [
      "1. PARTILE", "2. DATELE INCHIRIERII", "3. IDENTIFICAREA BUNULUI", "4. STAREA BUNULUI LA PREDARE",
      "5. INVENTAR SI ACCESORII PREDATE", "6. CONSTATAREA LA RESTITUIRE", "SEMNATURI Restituire", "7. DECLARATII",
    ]);
    assert.equal(c.sections.find((s) => s.signaturesAfter)?.heading, "5. INVENTAR SI ACCESORII PREDATE");
    assert.equal(c.signatures.left.party, "owner");
  });
  test("return: live signatures after section 6, renter hands over", () => {
    const c = buildPvRichContent(rental, "return");
    assert.equal(c.sections.find((s) => s.signaturesAfter)?.heading, "6. CONSTATAREA LA RESTITUIRE");
    assert.equal(c.signatures.left.party, "renter");
    assert.equal(c.title, "PROCES-VERBAL DE PREDARE-PRIMIRE (RESTITUIRE)");
  });
});

describe("PV language", () => {
  const rental: any = { public_id: "RNT-1", owner_name: "A", renter_name: "B", start_date: "2026-01-01", end_date: "2026-01-03", rental_days: 2, daily_price: 10, subtotal: 20, platform_fee: 3, stripe_fee: 1.3, product_title: "X" };
  test("Romanian stays the default", () => {
    assert.equal(buildPvRichContent(rental, "handover").sections[0].heading, "1. PARTILE");
  });
  test("English version translates headings and declarations", () => {
    const en = buildPvRichContent(rental, "handover", new Date(), "en");
    assert.equal(en.sections[0].heading, "1. PARTIES");
    assert.equal(en.signatures.heading, "SIGNATURES Handover");
    assert.equal(en.sections.at(-1)!.heading, "7. DECLARATIONS");
  });
});
