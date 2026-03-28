

## Plan: Rebranding email templates — RentNow → Rentli

### Problema
Toate cele 8 Edge Functions care trimit emailuri folosesc vechiul brand:
- Numele **RentNow** (trebuie schimbat în **Rentli**)
- Culoarea verde **#3DB86A** (trebuie schimbată în portocaliu **#F59E0B**)
- URL-ul **the-rent-exchange.lovable.app** (trebuie schimbat în **rentli.ro**)
- `from: "RentNow <...>"` → `from: "Rentli <...>"`

### Fișierele afectate (8 Edge Functions)

| # | Fișier | Modificări |
|---|---|---|
| 1 | `test-email-notifications/index.ts` | PLATFORM_URL, header, culori, from, texte |
| 2 | `send-general-notification/index.ts` | PLATFORM_URL, header, culori, from, texte |
| 3 | `send-rental-notification/index.ts` | PLATFORM_URL, header, culori, from |
| 4 | `send-message-notification/index.ts` | PLATFORM_URL, header, culori, from |
| 5 | `send-cancellation-notification/index.ts` | PLATFORM_URL, header, culori, from |
| 6 | `send-password-changed-notification/index.ts` | PLATFORM_URL, header, culori |
| 7 | `respond-rental-request/index.ts` | PLATFORM_URL, header, culori, from |
| 8 | `odoo-proxy/index.ts` | header, culori, from, texte |
| 9 | `request-account-deactivation/index.ts` | siteUrl fallback |
| 10 | `auth-email-hook/index.ts` | SITE_NAME, SAMPLE_PROJECT_URL |
| 11 | `send-transactional-email/index.ts` | SITE_NAME |

### Modificări concrete (find & replace global)

- `RentNow` → `Rentli` (în texte, from, header)
- `#3DB86A` → `#F59E0B` (header background, button background, link color)
- `the-rent-exchange.lovable.app` → `rentli.ro` (PLATFORM_URL, footer links, fallback URLs)
- `SITE_NAME = "the-rent-exchange"` → `SITE_NAME = "Rentli"`
- Font-family adăugat: `'Plus Jakarta Sans'` ca prim font în font stack

### După modificări
Deploy toate funcțiile afectate.

