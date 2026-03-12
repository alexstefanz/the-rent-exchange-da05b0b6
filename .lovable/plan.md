

## Simplificare meniu tab-uri profil

### Ce se schimbă

**Ștergere din tab-uri:** favorite, mesaje, câștiguri, recenzii, notificări (acestea rămân accesibile doar din cardurile dashboard de sus).

**Rămân 4 tab-uri:** Detalii cont, Cereri, Rezervări, Anunțuri — stilizate mai mari cu fundal portocaliu permanent.

**Notă:** Tab-urile șterse din meniu rămân ca `TabsContent` ascuns, accesibil prin click pe cardurile BalanceCard care fac `navigate("#mesaje")` etc.

### Implementare

**Fișier:** `src/pages/Profile.tsx`

1. **TABS array** — păstrăm doar 4 intrări vizibile în meniu:
   - `contul-meu`, `cereri`, `inchirieri`, `anunturi`

2. **TabsList styling** — tab-urile rămase primesc stil mai mare:
   - `px-6 py-3 text-base font-semibold` 
   - Fundal portocaliu gradient permanent: `bg-gradient-to-r from-[#F97717] to-[#FAA73C] text-white`
   - Active state cu opacity/shadow diferit pentru distincție

3. **TabsContent** — toate 9 rămân funcționale (pentru navigare din dashboard cards), doar tab-urile din meniu se reduc la 4.

4. **getTabFromHash** — funcționează în continuare cu toate ID-urile (inclusiv `#mesaje`, `#castiguri` etc. din BalanceCard).

5. Curățare importuri nefolosite din TABS (dar păstrate pentru TabsContent).

