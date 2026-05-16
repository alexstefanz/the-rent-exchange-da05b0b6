## Obiectiv
Curățăm `MiddleZone` din `src/components/layout/AccountHubMenu.tsx` (dropdown desktop + sheet mobil — folosesc același conținut). Acțiunile rapide sunt deja accesibile prin cele 4 `StatusCard`-uri (Închirieri, Balanță, Cereri proprietar, Anunțuri) și prin `HeaderCard` (→ `/contul-meu`).

## Modificări în `AccountHubMenu.tsx`

### 1. Elimină rândurile duplicate
Șterge complet din `MiddleZone`:
- `SectionLabel "Ca chiriaș"` + `NavRow` pentru `/rezervari` (Închirierile mele) și `/favorite` (Favorite).
- `SectionLabel "Ca proprietar"` + `NavRow` pentru `/anunturi`, `/inchirieri`, `/castiguri`.
- `SectionLabel "Cont"` + `NavRow` pentru `/contul-meu` (deja acoperit de `HeaderCard`).
- `SectionLabel "Suport"` (header devine inutil — vezi punctul 3).

### 2. KYC — vizibil DOAR dacă nu este verificat
Înlocuiește `NavRow` curent pentru `/verificare` cu un card de avertizare evidențiat, randat condiționat `!trust?.verified` (KYC neverificat). Stil propus:

```
<button onClick={() => handleNav("/verificare")}
  className="flex w-full items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3.5 py-3 text-left transition hover:bg-amber-100/70">
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
    <ShieldCheck className="h-5 w-5 text-amber-600" />
  </span>
  <span className="flex-1 min-w-0">
    <span className="block text-sm font-semibold text-amber-900">
      {t("Verifică-ți identitatea", "Verify your identity")}
    </span>
    <span className="block text-[11px] text-amber-700/80">
      {signals?.kycPending
        ? t("Documentele tale sunt în verificare.", "Your documents are under review.")
        : t("Necesar pentru rezervări și încasări.", "Required for bookings and payouts.")}
    </span>
  </span>
  <ChevronRight className="h-4 w-4 text-amber-700/60" />
</button>
```

Când `trust.verified === true`, nu mai randăm nimic pentru KYC (deja apare ca "Cont complet verificat" în `health` block).

### 3. Suport & Tickete — stil identic cu mobile offcanvas
Înlocuiește `NavRow` curent pentru `/suport` cu un card alb cu `border + shadow-sm`, care reproduce stilul din `src/components/layout/mobile-drawer/MobileDrawer.tsx` (LifeBuoy + label + badge `openTickets`).

- Adaugă imports: `LifeBuoy` (lucide-react) și `useDrawerStats` din hook-ul existent folosit de mobile drawer.
- Citește `openTickets = stats?.openTickets ?? 0`.
- Markup:

```
<button onClick={() => handleNav("/suport")}
  className="flex w-full items-center gap-3 h-12 px-4 rounded-xl bg-white border border-border/60 shadow-sm hover:bg-white/90 transition-colors">
  <LifeBuoy className="h-5 w-5 text-foreground" />
  <span className="flex-1 text-sm font-medium text-foreground text-left">
    {t("Suport & Tickete", "Support & Tickets")}
  </span>
  {openTickets > 0 && (
    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
      {openTickets}
    </span>
  )}
</button>
```

### 4. Curățare
- Elimină din imports lucide-react ce nu mai e folosit (`ShoppingBag`, `Heart`, `Package` în secțiunea NavRow, `CreditCard`, `PackageCheck`, `User`, `FileText`, `Shield`, `HelpCircle`) — păstrează doar ce e folosit în StatusCards / header / trigger. `Package` rămâne (StatusCard cereri). `User`/`FileText` rămân doar dacă mai sunt folosite altundeva în fișier; le verificăm la implementare.
- Distanțarea finală a `MiddleZone`: wrappează cele 2 carduri rămase (KYC condiționat + Suport) într-un `div className="space-y-2 mt-2"`.

## În afara scopului
- Fără modificări la `MobileDrawer` (sursa de adevăr pentru stilul cardului de suport).
- Fără modificări la `StatusCard`-uri, `HeaderCard`, `FooterZone`, sau la trigger-ul desktop/mobil.
- Fără modificări în rute, RLS sau backend.
- Comportament identic pe sheet-ul mobil al `AccountHubMenu` (același `MiddleZone`) — utilizatorul a cerut explicit doar desktop, dar conținutul fiind partajat, simplificarea se aplică ambelor; aspectul rămâne consistent.