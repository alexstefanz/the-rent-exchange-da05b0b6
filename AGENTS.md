
- App emails send synchronously via `_shared/transactional-email-templates/send-app-email.ts` (managed email API, role theming); browser triggers go through `send-account-email` (own address) or `send-admin-user-email` (admin, recipient resolved server-side). Why: no queue, no generic send endpoint.
- Stripe Identity return URLs are normalized by the function-local return-url helper; mobile links go through the public HTTPS app-return page. Why: Stripe rejects custom schemes as return URLs.
- PV financial breakdowns use recorded reservation charges through the shared pvContent builder for screen, PDF and DOCX. Why: historical fees and totals must remain consistent across document formats.
- Edge functions wrap their handler with `withCors` from `_shared/cors.ts` (allow-listed origins, never `*`), take site URL/routes from `_shared/config.ts` and phone normalization from `_shared/phone.ts`; cron jobs call `requireServiceCaller` and are scheduled via `invoke_edge_function_async`. Why: single source of truth for security policy and config.
- Edge function 5xx responses return a generic message; details go to console logs only. Why: avoid leaking internals.
- Payment capture uses the function-local capture-state guard and treats recorded captured payments as success before any side effects. Why: automatic collection must not block return confirmation or duplicate financial records.

- Legal name comes from Stripe Identity verified_outputs in the identity webhook (locked, source stripe_identity). Why: contracts/PVs must carry the ID-document name without manual matching.
