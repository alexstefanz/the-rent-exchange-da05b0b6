## Notificare la aprobarea anunțului (email + în cont)

În prezent, când un admin **respinge** un anunț, proprietarul primește email + (TODO: notificare în cont). Când un admin **aprobă** un anunț, **NU se trimite nimic**. Acest plan adaugă ambele notificări la aprobare.

Există deja toată infrastructura necesară:
- Template email React: `supabase/functions/_shared/transactional-email-templates/product-published.tsx`
- Înregistrat în `registry.ts` ca `product-published`
- Tabela `notifications` + tab-ul „Notificări" din profil (afișează deja tipul `product_published` cu iconiță verde)

## Modificări

### 1. `src/features/admin/adminProductsApi.ts` — funcția `approveProduct`

După `UPDATE`-ul de aprobare, adaugă (non-blocking, în try/catch ca la `rejectProduct`):

a) **Fetch** date produs (`title`, `slug`, `owner_id`) + profil owner (`email`, `full_name`).

b) **Email tranzacțional** prin `send-transactional-email`:
   - `templateName: 'product-published'`
   - `recipientEmail: profile.email`
   - `idempotencyKey: product-published-${productId}`
   - `templateData: { productTitle: prod.title }`

c) **Notificare în cont** — insert direct în tabela `notifications`:
   - `user_id: prod.owner_id`
   - `type: 'product_published'`
   - `title_ro: "Anunțul tău a fost aprobat"` / `title_en: "Your listing has been approved"`
   - `description_ro: "Anunțul „<title>" este acum vizibil pe platformă."` / EN echivalent
   - `link: /produs/${slug ?? id}`

Insert-ul se face cu clientul Supabase normal — RLS pentru `notifications` permite admin-ului să creeze notificări (același pattern ca în alte fluxuri admin). Dacă RLS blochează, comutăm la o RPC `SECURITY DEFINER` sau mutăm logica într-o edge function — verific la implementare și adaug migrație doar dacă e necesar.

### Fără alte modificări
- Template-ul email există deja, nu trebuie redeployat.
- Nicio modificare UI; tab-ul Notificări deja randează corect tipul `product_published`.
- Fluxul de respingere rămâne neschimbat (nu a fost cerut).
