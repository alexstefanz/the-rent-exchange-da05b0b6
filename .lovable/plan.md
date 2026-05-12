## Obiectiv

Iconița flotantă de suport (căști portocalii) apare peste butonul de send pe mobil când utilizatorul este în chat (pagina `/mesaje`). Trebuie ascunsă pe mobil pe paginile de chat, atât pentru useri obișnuiți cât și pentru admini.

## Modificări

1. **`src/components/support/SupportChatWidget.tsx`** — adaugă verificare:
   - dacă `pathname.startsWith("/mesaje")`, nu randa butonul flotant (`return null` sau `className="hidden lg:block"` doar pe FAB, păstrând comportamentul desktop intact). Panoul deschis rămâne disponibil pe desktop.

2. **`src/components/admin/AdminSupportWidget.tsx`** — aceeași logică:
   - importă `useLocation` din `react-router-dom`.
   - dacă `pathname.startsWith("/mesaje")` și e mobil (`lg:hidden`), ascunde FAB-ul. Pe desktop rămâne vizibil (nu se suprapune peste send acolo).

## Implementare concretă

În ambele componente, pe wrapper-ul butonului flotant (FAB) se adaugă `lg:flex hidden` când suntem pe `/mesaje`, altfel comportament normal. Cel mai simplu:

```tsx
const isOnChatPage = pathname.startsWith("/mesaje");
// pe FAB:
className={cn("fixed ...", isOnChatPage && "hidden lg:flex")}
```

Panoul deschis (`isOpen`) nu este afectat.

## Out of scope

- Nu modific layout-ul paginii de mesaje.
- Nu schimb poziția FAB-ului pe alte rute.
- Nu schimb comportamentul desktop.

## Fișiere

- Editat: `src/components/support/SupportChatWidget.tsx`
- Editat: `src/components/admin/AdminSupportWidget.tsx`
