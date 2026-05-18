# Eliminare container fundal pentru notificarea de cerere

## Problema
La `notify.rental(...)` se afișează cardul custom `RentalToast`, dar în spatele lui se vede încă un container alb cu border și shadow. Acesta provine de la stilurile implicite aplicate de `Sonner` pe wrapper-ul oricărui toast (vezi `src/components/ui/sonner.tsx`, `toastOptions.classNames.toast`: `bg-background`, `border`, `rounded-2xl`, `shadow`, `px-4 py-3.5`). Pentru toasturile custom (rental) aceste stiluri se suprapun peste cardul nostru.

## Soluție
În `src/lib/notify.tsx`, la apelul `toast.custom(...)` pentru `rental`, dezactivăm stilurile wrapper-ului pasând opțiunea `unstyled: true` (suportat nativ de Sonner). Astfel rămâne doar cardul `RentalToast`, fără containerul din spate.

Alternativă echivalentă, dacă `unstyled` nu produce efectul dorit cu versiunea curentă: pasăm `classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0" }` pe acest singur apel — fără a atinge `sonner.tsx` (alte toasturi standard rămân stilizate ca acum).

## Fișiere modificate
- `src/lib/notify.tsx` — un singur diff în metoda `rental`, adăugând `unstyled: true` (sau `classNames` override) la opțiunile `toast.custom`.

## Ce NU se schimbă
- `src/components/ui/sonner.tsx` rămâne neatins → toasturile standard (`success`, `error`, `info`) păstrează aspectul actual.
- Layoutul, conținutul și animațiile cardului `RentalToast` nu se modifică.

## Verificare
Trigger o cerere/anulare care apelează `notify.rental(...)` și confirmă vizual că în spatele cardului nu mai există al doilea panou alb.
