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