
- App emails send synchronously via `_shared/transactional-email-templates/send-app-email.ts` (managed email API, role theming); browser triggers go through `send-account-email` (own address) or `send-admin-user-email` (admin, recipient resolved server-side). Why: no queue, no generic send endpoint.
- Stripe Identity return URLs are normalized by the function-local return-url helper; mobile links go through the public HTTPS app-return page. Why: Stripe rejects custom schemes as return URLs.
- PV financial breakdowns use recorded reservation charges through the shared pvContent builder for screen, PDF and DOCX. Why: historical fees and totals must remain consistent across document formats.
