## Fix titlu notificări și poziție timp

**Problemă:** Titlurile notificărilor sunt trunchiate (ex. "Plata a fost confirma...") din cauza `truncate` pe aceeași linie cu timestamp-ul.

**Fișier de modificat:** `src/components/notifications/NotificationCard.tsx`

**Schimbări:**

1. Elimin `truncate` de pe titlu și `whitespace-nowrap` de pe rândul flex; titlul devine `line-clamp-2` pe lățime completă, fără competiție pentru spațiu.
2. Mut timestamp-ul sub titlu (rând nou), cu `text-[11px] text-muted-foreground/70`, eventual cu un punct separator înainte de descriere sau pe linie proprie.

**Structură nouă a body-ului:**
```
[Titlu complet pe 1–2 rânduri]
[Timp — mai puțin de un minut în urmă]
[Descriere line-clamp-2]
[Buton acțiune]
```

**În afara scopului:** Logica de filtre, categorii, realtime, mapLink — neatinse. Doar layout în card.
