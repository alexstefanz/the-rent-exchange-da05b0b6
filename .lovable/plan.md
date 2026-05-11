# Notificări complete (in-app + email) pentru aprobări și restul fluxurilor

## Diagnostic

Am verificat fluxul actual:

- **Aprobare produs (admin):** funcția `approveProduct` din `src/features/admin/adminProductsApi.ts` încearcă să insereze o notificare in-app direct din client, dar tabela `notifications` nu are politică INSERT pentru admini → inserarea **eșuează silențios**. Email-ul `product-published` se trimite corect (confirmat în log).
- **Respingere produs:** există deja triggerul DB `trg_notify_user_product_rejected` care creează notificarea in-app, plus email `product-rejected` din client. OK.
- **Mesaj nou (`send-message-notification`):** creează notificare in-app, **dar nu trimite email**, deși există template `new-message`.
- **Anulare cerere de către chiriaș (`send-cancellation-notification`):** notificare in-app + SMS, **dar fără email** (templates `cancellation-owner` / `cancellation-renter` există).
- **Reminder de returnare (`notify-return-day`):** notificare in-app + SMS, **dar fără email** (template `return-reminder` există).
- **Acceptare/refuz cerere închiriere (`respond-rental-request`):** invocă `notify-rental-event` care trimite email + notificare. OK.
- **KYC, withdrawals, ban, payout, recenzii, tickete:** au deja email + in-app. OK.

## Modificări

### 1. Aprobare produs — trigger DB pentru in-app

Migrare: creez funcția `notify_user_product_approved` (SECURITY DEFINER, oglindă a `notify_user_product_rejected`) și triggerul `trg_notify_user_product_approved` pe `products`. Se declanșează când `approval_status` trece la `'approved'`, cheamă `create_user_notification` cu type `product_published`, link `/produs/{slug}`.

Curățare: elimin INSERT-ul client din `approveProduct` (devine redundant). Păstrez invocarea `send-transactional-email` pentru email (deja funcționează).

### 2. Mesaj nou → email

În `supabase/functions/send-message-notification/index.ts`, după inserarea notificării, invoc `send-transactional-email` cu template `new-message` și `templateData: { senderName, productTitle, messagePreview, conversationLink }`. Idempotency key: `new-message-{conversationId}-{messageId}`.

Respect `notification_preferences.email_transactional` — citim înainte de send și sărim dacă `false`.

### 3. Anulare cerere → email

În `supabase/functions/send-cancellation-notification/index.ts`, după notificarea in-app către owner, invoc `send-transactional-email` cu template `cancellation-owner` și datele necesare (`renterName`, `productTitle`, `startDate`, `endDate`, `reason`). Idempotency: `cancel-owner-{rentalId}`.

Verific dacă există flux similar pentru chiriaș (când owner-ul anulează) — adaug `cancellation-renter` analog.

### 4. Reminder zi de returnare → email

În `supabase/functions/notify-return-day/index.ts`, după inserarea notificării, invoc `send-transactional-email` cu template `return-reminder`, date: `productTitle`, `endDate`. Idempotency: `return-reminder-{rentalId}-{YYYY-MM-DD}`.

### 5. Helper comun (opțional, pentru a evita duplicarea)

În cele 3 edge functions modificate, folosesc același mic pattern:
```ts
const { data: prefs } = await supabase
  .from("notification_preferences")
  .select("email_transactional")
  .eq("user_id", userId)
  .maybeSingle();
if (prefs?.email_transactional !== false && profile?.email) {
  await supabase.functions.invoke("send-transactional-email", { body: {...} });
}
```

## Validare

- Deploy: `notify-return-day`, `send-message-notification`, `send-cancellation-notification`.
- Smoke test din `psql`: forțez un UPDATE pe `products` (approval_status → approved) pentru un produs de test, verific că apare rândul în `notifications` și că `email_send_log` are intrare `product-published` `sent`.
- Verific `email_send_log` după ce trimit un mesaj de test în chat și după ce anulez o cerere.

## Fișiere atinse

- migrare nouă: `notify_user_product_approved` + trigger
- `src/features/admin/adminProductsApi.ts` — elimin INSERT client redundant
- `supabase/functions/send-message-notification/index.ts`
- `supabase/functions/send-cancellation-notification/index.ts`
- `supabase/functions/notify-return-day/index.ts`

Fără modificări la business logic, RLS pe alte tabele, sau plată.
