

# Actualizare adresa email expeditor: rentli.ro

## Schimbare

Inlocuire `from: "RentNow <onboarding@resend.dev>"` cu `from: "RentNow <noreply@rentli.ro>"` in toate cele 5 edge functions care trimit email-uri.

## Fisiere modificate

| Fisier | Locuri |
|--------|--------|
| `supabase/functions/send-cancellation-notification/index.ts` | 2 locuri (email proprietar + chirias) |
| `supabase/functions/send-password-changed-notification/index.ts` | 1 loc |
| `supabase/functions/respond-rental-request/index.ts` | 2 locuri (email chirias + proprietar) |
| `supabase/functions/send-rental-notification/index.ts` | 1 loc |
| `supabase/functions/send-message-notification/index.ts` | 1 loc |

**Total: 7 inlocuiri** in 5 fisiere.

Dupa modificare, toate edge functions se redeploieaza automat.

