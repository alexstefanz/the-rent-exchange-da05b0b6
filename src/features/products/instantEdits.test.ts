import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { partitionEdits } from "./instantEdits";

describe("listing edits", () => {
  test("price change applies instantly without review", () => {
    const r = partitionEdits({ daily_price_owner: 80, title: "Bike" }, { title: "Bike" });
    assert.deepEqual(r.instant, { daily_price_owner: 80 });
    assert.deepEqual(r.moderated, {});
  });
  test("min/max period and delivery radius are instant", () => {
    const r = partitionEdits({ min_rental_days: 2, max_rental_days: 10, delivery_radius_km: 5 }, {});
    assert.deepEqual(Object.keys(r.instant).sort(), ["delivery_radius_km", "max_rental_days", "min_rental_days"]);
    assert.deepEqual(r.moderated, {});
  });
  test("changed description and photos go to review", () => {
    const r = partitionEdits({ description: "new", images: ["b"] }, { description: "old", images: ["a"] });
    assert.deepEqual(r.moderated, { description: "new", images: ["b"] });
  });
});
