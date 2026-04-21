

## Plan: Badge cu număr roșu pe item-urile din meniul Admin

### Scop
Afișez un badge circular roșu cu numărul de elemente care necesită atenție lângă item-urile relevante din `AdminSidebar` (când sidebar-ul e expandat). Început cu **Verificări KYC** (cum ai cerut) și extind logic la celelalte item-uri pentru consistență.

### Surse de date

Folosesc hook-ul existent `useAdminNotificationSummary()` (din `src/hooks/queries/useAdminNotifications.ts`) care returnează deja:
- `pending_kyc` → badge pe **Verificări KYC**
- `pending_products` → badge pe **Confirmări** (produse de aprobat)
- `open_tickets` → badge pe **Tickete**
- `pending_withdrawals` → badge pe **Financiar**
- `unread_total` → badge pe **Notificări**

Toate vin dintr-un singur RPC (`get_admin_notification_summary`), deci zero requesturi suplimentare.

### Implementare

**Modific doar `src/components/admin/AdminSidebar.tsx`:**

1. Import `useAdminNotificationSummary` din `@/hooks/queries/useAdminNotifications`.
2. Adaug un câmp `badgeKey` opțional fiecărui item în `menuItems` care are notificări (kyc, approvals, tickets, finances, notifications).
3. În render, dacă `count > 0`, afișez un span circular roșu (background `bg-destructive`, text alb) la dreapta titlului item-ului. Format `count > 9 ? "9+" : count`.
4. În stare `collapsed` (sidebar îngust), badge-ul devine un dot mic roșu poziționat absolut top-right peste icon (fără număr, doar indicator).

### Detaliu vizual

**Expandat:**
```text
🛡  Verificări KYC          (3)   ← cerc roșu cu nr alb
📦  Confirmări              (2)
🎫  Tickete                 (1)
```

**Restrâns (icon-only):**
```text
🛡•   ← dot roșu mic top-right
```

Badge: `min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold flex items-center justify-center ml-auto`

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Adaug hook summary + badge condițional pe 5 item-uri (KYC, Confirmări, Tickete, Financiar, Notificări) |

### Limitări recunoscute
- Badge-ul se actualizează la refresh-ul React Query (60s polling deja activ în hook) și la realtime push pe `admin_notifications` (deja conectat în `AdminNotificationBell`)
- În stare collapsed afișez doar dot roșu fără număr (lipsă spațiu pentru cifră)

