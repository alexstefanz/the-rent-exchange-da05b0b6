## Goal
Face animația pasului activ ("Produs predat" etc.) din timeline-ul rezervării mai lentă și mai blândă, ca un "slow motion".

## Changes

**`src/components/dashboard/RentalTimeline.tsx`** (line 98)
- Schimbă `animate-[soft-pulse_3.2s_ease-in-out_infinite]` în `animate-[soft-pulse_5s_ease-in-out_infinite]` pentru a încetini ritmul pulsului.

**`tailwind.config.ts`** (keyframe + animation `soft-pulse`)
- Mărește durata default de la `3.2s` la `5s`.
- Înmoaie pulsul: începe de la un halo deja vizibil și se extinde mai puțin abrupt, ca să pulseze "ușor":
  ```ts
  "soft-pulse": {
    "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.18)", transform: "scale(1)" },
    "50%":      { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)",   transform: "scale(1.04)" },
  },
  ```
- Scade scale-ul (1.04 în loc de orice salt brusc) și raza halo-ului (8px), pentru o respirație fină, nu un puls accentuat.

## Result
Iconița portocalie a pasului activ va respira lent (~5s pe ciclu), cu un halo subtil și o ușoară mărire/micșorare, în loc de pulsul rapid actual. Restul timeline-ului rămâne neschimbat.
