Voi corecta fluxul astfel încât fiecare buton din cererile de anulare să deschidă conversația exactă cu persoana respectivă, nu doar pagina generală de mesaje.

Pași:
1. În `AdminCancellationRequestsPanel.tsx`, voi schimba navigarea de la parametrul greșit `?conversation=` la parametrul folosit de pagina Mesaje: `?conv=`.
2. În `Messages.tsx`, voi face pagina mai tolerantă și pentru `?conversation=`, ca fallback, dar fluxul principal va folosi `?conv=`.
3. Voi ajusta logica de selectare astfel încât, după încărcarea conversațiilor, conversația găsită după ID să fie selectată automat și tab-ul corect să fie activat.

Detalii tehnice:
- Problema actuală este că butoanele creează/returnează un `conversationId`, dar pagina `/mesaje` citește doar `conv`, nu `conversation`; de aceea se deschide lista de chat-uri fără conversația selectată.
- Nu este nevoie de migrare de bază de date pentru acest fix.