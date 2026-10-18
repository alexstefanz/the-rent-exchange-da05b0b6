import { test } from "node:test";
import { strict as assert } from "node:assert";
import { identityReturnUrl } from "./return-url.ts";

for (const deepLink of ["rentli://auth/callback?done=1", "exp://192.168.1.2:8081/--/kyc", "exps://example.test/kyc"]) {
  test(`wraps ${deepLink.split(":")[0]} in the HTTPS app return page`, () => {
    const result = new URL(identityReturnUrl({ return_url: deepLink }));
    assert.equal(result.origin, "https://rentli.ro");
    assert.equal(result.pathname, "/kyc/app-return");
    assert.equal(result.searchParams.get("redirect"), deepLink);
  });
}
test("preserves an existing HTTPS Rentli return page", () => {
  const url = "https://www.rentli.ro/kyc/app-return?redirect=rentli%3A%2F%2Fkyc";
  assert.equal(identityReturnUrl({ return_url: url }), url);
});
test("uses the accepted web origin for normal browser returns", () => {
  assert.equal(identityReturnUrl({ return_origin: "https://the-rent-exchange.lovable.app" }), "https://the-rent-exchange.lovable.app/verificare?done=1");
});
test("rejects unsafe schemes and lookalike domains", () => {
  for (const url of ["javascript:alert(1)", "https://rentli.ro.evil.test/", "https://evil.test", "http://rentli.ro/"]) {
    assert.equal(identityReturnUrl({ return_url: url, return_origin: "https://evil.test" }), "https://rentli.ro/verificare?done=1");
  }
});