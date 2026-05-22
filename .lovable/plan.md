## Verificare formulare de contact

Am scanat tot codul după `mailto:` și am verificat formularele de contact din platformă:

| Locație | Destinație actuală | Status |
|---|---|---|
| `src/pages/HelpCenter.tsx` (formular „Trimite o solicitare", 2 ocurențe — linia 82 și 108) | `mailto:office@rentli.ro` | ✅ Corect |
| `src/pages/Contact.tsx` (formular contact + link afișat) | `mailto:office@rentli.ro` | ✅ Corect |

Restul ocurențelor `@rentli.ro` din cod nu sunt formulare de contact:
- `noreply@rentli.ro` — adresa de expediere pentru emailuri tranzacționale (corect, nu se modifică)
- `owner@rentli.ro` / `renter@rentli.ro` / `contact@rentli.ro` — valori de fallback/dummy în template-urile PV (procese verbale), nu formulare către utilizator
- `ShareDialog` — `mailto:` gol pentru share produs (utilizatorul completează destinatarul)
- `ContactInfoCard` / `InfoPanel` (mesagerie) — `mailto:` către emailul celuilalt utilizator după unlock contact (gated contact flow — corect)

## Concluzie

**Nu este nimic de schimbat.** Toate formularele de contact destinate echipei Rentli trimit deja către `office@rentli.ro`.

Dacă vrei să adaug `office@rentli.ro` și ca afișare vizibilă (ex. în Footer, sau ca buton secundar „Trimite direct un email") confirmă-mi unde și revin cu modificările.