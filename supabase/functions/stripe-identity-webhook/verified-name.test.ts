import { assertEquals } from "jsr:@std/assert@1";
import { verifiedFullName } from "./verified-name.ts";
Deno.test("formats uppercase ID names", () => {
  assertEquals(verifiedFullName({ first_name: "ALEXANDRU-ION", last_name: "ȘTEFAN" }), "Alexandru-Ion Ștefan");
});
Deno.test("returns null when missing", () => {
  assertEquals(verifiedFullName({ first_name: null, last_name: "" }), null);
  assertEquals(verifiedFullName(null), null);
});
