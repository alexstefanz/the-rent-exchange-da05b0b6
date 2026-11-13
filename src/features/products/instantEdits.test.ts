import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { partitionEdits } from "./productsApi";

describe("listing edits", () => {
  it("price change applies instantly without review", () => {
    const r = partitionEdits({ daily_price_owner: 80, title: "Bike" }, { title: "Bike" });
    expect(r.instant).toEqual({ daily_price_owner: 80 });
    expect(r.moderated).toEqual({});
  });
  it("min/max period and delivery radius are instant", () => {
    const r = partitionEdits({ min_rental_days: 2, max_rental_days: 10, delivery_radius_km: 5 }, {});
    expect(Object.keys(r.instant).sort()).toEqual(["delivery_radius_km", "max_rental_days", "min_rental_days"]);
    expect(r.moderated).toEqual({});
  });
  it("changed description and photos go to review", () => {
    const r = partitionEdits({ description: "new", images: ["b"] }, { description: "old", images: ["a"] });
    expect(r.moderated).toEqual({ description: "new", images: ["b"] });
  });
});
