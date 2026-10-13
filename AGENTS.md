
- App emails send synchronously via `_shared/transactional-email-templates/send-app-email.ts` (managed email API, role theming); browser triggers go through `send-account-email` (own address) or `send-admin-user-email` (admin, recipient resolved server-side). Why: no queue, no generic send endpoint.
