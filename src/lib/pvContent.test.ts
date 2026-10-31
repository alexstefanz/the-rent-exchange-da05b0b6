import { describe, expect, test } from "bun:test";
import { getPvFinancials } from "./pvContent";

describe("PV reservation charges", () => {
  test("includes the recorded platform commission and Stripe charge", () => {
    expect(getPvFinancials({ subtotal: 2, platform_fee: 0, stripe_fee: 1.03 }).total).toBe(3.03);
    expect(getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.61 })).toEqual({
      subtotal: 100, platformFee: 15, stripeFee: 2.61, insuranceFee: 0, total: 117.61,
    });
  });

  test("includes insurance only when the reservation carries a charge", () => {
    const insured = getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.75, insurance_fee: 10 });
    expect(insured.insuranceFee).toBe(10);
    expect(insured.total).toBe(127.75);
    expect(getPvFinancials({ subtotal: 100, platform_fee: 15, stripe_fee: 2.61, insurance_fee: 0 }).insuranceFee).toBe(0);
  });
});