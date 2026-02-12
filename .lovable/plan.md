

# Desktop Chat Button + Mobile Bottom Navigation Bar

## Ce se schimba

### Desktop (lg+)
- Se adauga un buton "Chat" in header, langa celelalte iconite (notificari, avatar), similar cu screenshot-ul: iconita de mesaj + text "Chat", cu background inchis si stil pill/rounded.
- Butonul duce la `/mesaje`.

### Mobile / Tablet (sub lg)
- Se elimina butonul "Adauga" din header (muta in bottom bar).
- In header raman doar: logo, notification bell, hamburger menu.
- Se adauga un **bottom navigation bar fix** cu 5 tab-uri (ca in screenshot):
  - **Exploreaza** (Search icon) -> `/cauta`
  - **Favorite** (Heart icon) -> `/profile#favorite`
  - **Vinde** (PlusCircle icon) -> `/owner/new-product`
  - **Chat** (MessageCircle icon) -> `/mesaje`
  - **Cont** (User icon) -> `/profile#contul-meu`
- Bottom bar e vizibil pe toate paginile, fixat jos, cu border-top si background solid.

## Detalii tehnice

### Fisier: `src/components/layout/Navbar.tsx`
- **Desktop**: Adaug un buton/link "Chat" (`MessageCircle` + text) in zona din dreapta header-ului, vizibil doar pe `lg:flex`, cu stil dark pill (bg-foreground text-background rounded-full). Include badge cu unread count daca > 0.
- **Mobile header**: Ascund butonul "Adauga" pe mobil (`hidden lg:flex`). Pastrez doar NotificationBell + Menu button.

### Fisier nou: `src/components/layout/MobileBottomNav.tsx`
- Component separat pentru bottom navigation bar.
- 5 tab-uri cu iconite si labels.
- Fixed bottom, z-50, border-top, background solid.
- Highlight tab-ul activ bazat pe ruta curenta (`useLocation`).
- Badge pe Chat tab cu numarul de mesaje necitite.

### Fisier: `src/pages/Index.tsx` (si alte pagini)
- Adaug `MobileBottomNav` in layout-ul paginilor (sau il pun direct in Navbar ca sa fie global).
- Alternativ: il includ in Navbar.tsx ca parte a return-ului, dupa header, ca sa apara pe toate paginile automat.

### Fisier: `src/index.css`
- Adaug padding-bottom pe body/main content pe mobil pentru a nu acoperi continutul cu bottom nav (~70px).

## Structura bottom nav

```text
+--------------------------------------------------+
|  Exploreaza  |  Favorite  |  Vinde  |  Chat  |  Cont  |
|   (Search)   |  (Heart)   | (Plus)  | (Msg)  | (User) |
+--------------------------------------------------+
```

## Fisiere modificate

| Fisier | Schimbare |
|--------|-----------|
| `src/components/layout/MobileBottomNav.tsx` | Component nou - bottom navigation bar |
| `src/components/layout/Navbar.tsx` | Adauga Chat button desktop, ascunde "Adauga" pe mobil, include MobileBottomNav |
| `src/index.css` | Padding bottom pe mobil pentru bottom nav |

