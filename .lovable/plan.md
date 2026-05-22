# Eliminare notificare „Mulțumim pentru feedback!" + toast curat la trimitere review

## Context

Nu există în cod string-ul literal „Mulțumim pentru feedback!". Cel mai probabil notificarea văzută este una dintre următoarele (toate gravitează în jurul fluxului de review):

1. `LeaveReviewDialog` — afișează inline ecranul „Ai lăsat deja review pentru această închiriere." cu icon `CheckCircle2` după ce review-ul a fost trimis.
2. `MainActionCard` (step 6 — rezervare finalizată) — afișează descrierea „Mulțumim! Ajută comunitatea cu un review scurt." (pill cu check icon în card portocaliu, similar capturii).

În prezent, după trimiterea cu succes a review-ului în `LeaveReviewDialog` NU se afișează niciun toast — dialogul se închide tăcut. User-ul vrea exact invers: să nu apară confirmări inline/repetate de tip „mulțumim pentru feedback", iar pe finalul trimiterii să apară un singur toast clar.

## Modificări

### 1. `src/components/dashboard/LeaveReviewDialog.tsx`
- La success final (când `productOk && userOk` în `handleSubmit`) se adaugă `toast.success(t("Mulțumim pentru review!", "Thanks for your review!"))` înainte de `onOpenChange(false)`.

### 2. `src/components/dashboard/MainActionCard.tsx`
- La `step === 6` (rezervare finalizată), pentru renter se înlocuiește descrierea „Mulțumim! Ajută comunitatea cu un review scurt." cu un text neutru, fără mulțumire repetată: „Rezervarea s-a încheiat. Lasă un review scurt pentru a ajuta comunitatea." (EN: „Rental completed. Leave a short review to help the community.")
- Nu se modifică logica de buton / CTA.

## Fișiere editate

- `src/components/dashboard/LeaveReviewDialog.tsx`
- `src/components/dashboard/MainActionCard.tsx`

## De confirmat cu user-ul

Dacă notificarea văzută provine din altă parte (ex: alt component cu mesaj de mulțumire), e nevoie de URL-ul exact / o captură mai largă pentru a o identifica.
