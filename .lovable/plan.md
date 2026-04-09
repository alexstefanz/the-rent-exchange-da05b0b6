

## Plan: Actualizare mesaj de reassurance conform sistemului escrow

### Problema
Mesajul curent „Plata ta este protejată. Nu se debitează până la confirmare." nu reflectă noul flux escrow unde suma este **blocată temporar** pe card și **debitată doar după finalizarea perioadei de închiriere**.

### Modificare

**Fișier: `src/data/uxCopy.ts`** (linia 115)

Schimbare text `reassurance.paymentProtected`:
- **RO**: „Plata ta este protejată. Suma se blochează temporar și se debitează doar după finalizarea închirierii."
- **EN**: „Your payment is protected. The amount is temporarily held and charged only after the rental period ends."

O singură linie de modificat.

