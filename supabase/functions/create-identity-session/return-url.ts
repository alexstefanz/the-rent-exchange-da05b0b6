// Stripe receives HTTPS only; the public return page opens supported app links.
export function identityReturnUrl(body: { return_origin?: unknown; return_url?: unknown }): string {
  const origin = typeof body.return_origin === "string" &&
    /^https:\/\/([a-z0-9-]+\.)*(rentli\.ro|lovable\.app)$/.test(body.return_origin)
    ? body.return_origin : "https://rentli.ro";
  const raw = typeof body.return_url === "string" ? body.return_url : "";
  if (/^(rentli|exp|exps):\/\//i.test(raw)) {
    return `https://rentli.ro/kyc/app-return?redirect=${encodeURIComponent(raw)}`;
  }
  if (/^https:\/\/(www\.)?rentli\.ro(\/|\?|#|$)/.test(raw)) return raw;
  return `${origin}/verificare?done=1`;
}