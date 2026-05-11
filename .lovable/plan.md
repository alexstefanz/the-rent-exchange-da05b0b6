## Problemă
În cardul cu calendar (`PremiumBookingCard.tsx`), ultima zi din intervalul selectat are o formă diferită (mai rotunjită) față de celelalte zile, din cauza claselor implicite `day_range_end` din `react-day-picker`.

## Modificare
Un singur fișier: **`src/components/product/PremiumBookingCard.tsx`**

În componenta `<CalendarComponent>`, extind `classNames` ca să forțez același border-radius (10px) pe toate stările zilelor selectate:

```ts
classNames={{
  day_selected: "!bg-[#FA8729] !text-white !rounded-[10px] !opacity-100",
  day_range_start: "!rounded-[10px]",
  day_range_end: "!rounded-[10px]",
  day_range_middle: "!rounded-[10px] !bg-[#FA8729] !text-white",
}}
```

## Rezultat
Toate zilele selectate (start, mijloc, end) au identic colțuri rotunjite 10px.
