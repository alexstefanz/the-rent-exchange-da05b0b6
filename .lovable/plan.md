Șterg complet secțiunea „Metode de plată" din `src/components/profile/AccountTab.tsx`:

1. Elimin blocul `<Section id="payments">…</Section>` (liniile ~624-643), inclusiv cardul cu „Niciun card salvat" și butonul „Adaugă card".
2. Elimin entry-ul corespondent din nav-ul lateral (linia 59): `{ id: "payments", labelRo: "Plăți", … }`.
3. Curăț importurile rămase nefolosite (`CreditCard` doar dacă nu mai e referit altundeva în fișier — verific înainte).

Fără alte modificări (PayoutForm/IBAN rămân intacte). Plățile continuă să fie procesate exclusiv prin Stripe la checkout.