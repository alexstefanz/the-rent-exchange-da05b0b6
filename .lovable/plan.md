## Obiectiv
Înlocuirea celor 3 cutiuțe înghesuite (Perioadă / Zile / Total) cu un singur card unificat pe cardurile de rezervare, atât pentru chiriaș (`RentalsTab.tsx`) cât și pentru proprietar (`RentalsOutTab.tsx`).

## Design propus
Un singur card cu fundal `bg-card` și border subtil, organizat orizontal pe două coloane:

- **Stânga (flex-1):** iconiță `Calendar`, deasupra label-ul „Perioadă" (text-[10px] uppercase muted), dedesubt intervalul „26 mai – 27 mai" pe un rând, urmat de un sub-text muted „2 zile".
- **Dreapta (auto width, aliniat la dreapta, separator `border-l border-border` cu `pl-3`):** label „Total" (text-[10px] uppercase, primary/70), dedesubt suma în primary, bold, `text-lg` „2 RON".

Avantaje: o singură suprafață vizuală, mai mult spațiu pentru date, „Total" rămâne accentuat vizual prin culoarea primary fără să mai aibă fundal propriu.

## Implementare
Înlocuiește blocul `<div className="grid grid-cols-1 sm:grid-cols-3 ...">...</div>` (cele 3 boxes) cu un singur card:

```tsx
<div className="mt-3 sm:mt-4 flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
  <div className="min-w-0 flex-1">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Perioadă</p>
    <p className="text-sm font-semibold text-foreground leading-tight truncate">
      {format(new Date(rental.start_date), "d MMM", { locale: roLocale })} – {format(new Date(rental.end_date), "d MMM", { locale: roLocale })}
    </p>
    <p className="text-[11px] text-muted-foreground">{rental.rental_days} {rental.rental_days === 1 ? "zi" : "zile"}</p>
  </div>
  <div className="border-l border-border pl-3 text-right">
    <p className="text-[10px] uppercase tracking-wide text-primary/70 font-semibold">Total</p>
    <p className="text-base sm:text-lg font-bold text-primary leading-tight">{rental.subtotal} RON</p>
  </div>
</div>
```

Aceeași schimbare pe ambele fișiere:
- `src/components/dashboard/RentalsTab.tsx` (chiriaș, folosește `rental.subtotal`)
- `src/components/dashboard/RentalsOutTab.tsx` (proprietar, va folosi câmpul echivalent — `owner_payout` dacă există, altfel `subtotal`; verific în implementare).

## În afara scopului
Nu se modifică restul cardului (imagine, header, mesaj, butoane).
