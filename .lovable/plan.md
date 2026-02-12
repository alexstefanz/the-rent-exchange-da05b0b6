

# Redesign complet pagina Mesaje + Chat fullscreen pe mobil

## Rezumat

Transformarea paginii `/mesaje` dintr-o lista simpla cu dialog popup intr-o interfata de chat completa, cu doua vizualizari diferite:
- **Mobile**: chat fullscreen (nu popup)
- **Desktop**: layout split-view (lista conversatii stanga + chat dreapta)
- **Ambele**: 2 tab-uri pentru filtrare: "Rezervari" (unde esti chirias/buyer) si "De Inchiriat" (unde esti proprietar/owner)

## Ce se schimba

### 1. Pagina Messages.tsx - redesign complet

**Desktop (lg+):**
- Layout cu 2 coloane: lista conversatii (w-1/3) | zona chat (w-2/3)
- Tab-uri "Rezervari" / "De Inchiriat" deasupra listei
- Sectiuni "NECITITE" si "CITITE" in lista
- Cand selectezi o conversatie, chatul apare inline in coloana dreapta (nu dialog)
- Header chat cu avatar + nume + produs

**Mobile (<lg):**
- Lista conversatii cu aceleasi tab-uri si sectiuni
- Cand selectezi o conversatie, se deschide chatul fullscreen (nu dialog)
- Buton back pentru a reveni la lista
- Fara Navbar/Footer in modul chat (fullscreen)

### 2. Componenta noua: ChatPanel.tsx
- Componenta reutilizabila de chat (nu dialog)
- Contine header, scroll area cu mesaje, input
- Functioneaza identic cu ChatDialog dar fara wrapper Dialog
- Suporta realtime subscriptions, mark as read

### 3. Componenta noua: ConversationList.tsx
- Lista de conversatii cu filtrare pe tab-uri
- Tab-uri: "Rezervari" (buyer_id === user.id) si "De Inchiriat" (owner_id === user.id)
- Grupare: NECITITE sus, CITITE jos
- Conversatia selectata evidentiata vizual

### 4. MobileBottomNav.tsx
- Badge-ul exista deja si functioneaza - nu necesita modificari

## Detalii tehnice

### Filtrare conversatii pe tab-uri
```text
Tab "Rezervari"    -> conv.buyer_id === user.id  (userul e chirias)
Tab "De Inchiriat" -> conv.owner_id === user.id  (userul e proprietar)
```

### Grupare NECITITE / CITITE
```text
NECITITE -> conv.unread_count > 0
CITITE   -> conv.unread_count === 0
```

### Structura fisiere

| Fisier | Actiune |
|--------|---------|
| `src/pages/Messages.tsx` | RESCRIS - layout split desktop, fullscreen mobile |
| `src/components/messaging/ChatPanel.tsx` | NOU - panel chat inline (fara Dialog wrapper) |
| `src/components/messaging/ConversationList.tsx` | NOU - lista conversatii cu tab-uri si grupare |
| `src/components/messaging/ChatDialog.tsx` | PASTRAT - folosit in alte locuri (MessagesTab, profile) |

### Flow mobil
```text
/mesaje -> ConversationList (fullscreen)
  -> click conversatie -> ChatPanel (fullscreen, cu buton back)
  -> click back -> ConversationList
```

### Flow desktop
```text
/mesaje -> [ConversationList | ChatPanel] side by side
  -> click conversatie -> ChatPanel se populeaza in dreapta
```

