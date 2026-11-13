import { test } from "node:test";
import { strict as assert } from "node:assert";
import { getCaptureState } from "./capture-state.ts";

test("automatically captured payments allow return confirmation on or after the end date", () => {
  for (const today of ["2026-11-13", "2026-11-14"]) {
    assert.equal(getCaptureState({ payment_status: "captured", end_date: "2026-11-13" }, today), "already_captured");
  }
});

test("already captured payments need no new capture even before the end date", () => {
  assert.equal(getCaptureState({ payment_status: "captured", end_date: "2026-11-14" }, "2026-11-13"), "already_captured");
});

test("owners cannot capture an authorized hold before the end date", () => {
  assert.equal(getCaptureState({ payment_status: "authorized", end_date: "2026-11-14" }, "2026-11-13"), "before_end_date");
});

test("authorized holds can be captured on and after the end date", () => {
  for (const today of ["2026-11-13", "2026-11-14"]) {
    assert.equal(getCaptureState({ payment_status: "authorized", end_date: "2026-11-13" }, today), "capture");
  }
});

test("the privileged early-capture path is preserved", () => {
  assert.equal(getCaptureState({ payment_status: "authorized", end_date: "2026-11-14" }, "2026-11-13", true), "capture");
});

test("unpaid, cancelled and refunded payments never count as captured", () => {
  for (const payment_status of ["pending", "failed", "cancelled", "refunded", undefined]) {
    assert.equal(getCaptureState({ payment_status, end_date: "2026-11-13" }, "2026-11-13", true), "not_authorized");
  }
});