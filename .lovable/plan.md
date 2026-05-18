Voi face o corecție țintită pentru ca notificările toast să poată afișa fizic un singur card.

Pași:
1. Înlocuiesc configurația actuală cu două instanțe Sonner cu o singură instanță Sonner. Acum există două viewports Sonner montate în `App`, iar toast-ul custom poate fi randat în ambele, ceea ce explică exact cardurile suprapuse din screenshot.
2. Păstrez `visibleToasts={1}` și `expand={false}`, dar pe o singură instanță globală, astfel încât Sonner să nu mai aibă unde duplica același toast.
3. Ajustez `notifyFromDb` ca să folosească același toast ID stabil și să închidă explicit doar acel toast înainte de a-l înlocui, nu toate toast-urile aplicației.
4. Las deduplicarea din `useGlobalRealtime` pentru evenimente reale duplicate din backend, dar elimin cauza vizuală principală: randarea aceluiași toast prin două Toastere.
5. Verific după schimbare prin cod și semnal runtime că în aplicație rămâne montat un singur Sonner pentru notificări.