
## Plan: Reparare checkout pentru userii KYC verificați

### Problemă confirmată
Contul `alexadvanceonline@gmail.com` este corect aprobat:
- `profiles.kyc_status = 'VERIFIED'`
- edge logs arată același `user_id` autenticat corect

Dar în `create-checkout-session` apare:
```ts
profile_found: false
```

Asta se întâmplă fiindcă funcția:
1. autentifică userul cu `auth.getUser(token)`,
2. apoi face query pe `profiles` cu un client anon care **nu este legat de JWT-ul userului**,
3. iar RLS pe `profiles` permite SELECT doar pentru profilul propriu când cererea poartă tokenul userului.

Rezultat: funcția “vede” userul, dar **nu vede profilul lui**, deci cade fals în `KYC_REQUIRED`.

---

### Ce voi modifica

#### 1. Repar `create-checkout-session`
În `supabase/functions/create-checkout-session/index.ts` voi separa clar cei 2 clienți:

- **user-scoped client** cu header-ul `Authorization` din request:
  - folosit pentru `auth.getUser()`
  - folosit pentru citirea `profiles.kyc_status`
- **admin client** cu service role:
  - folosit doar pentru `rentals` și update-ul `payment_method`

Pattern-ul va deveni similar cu funcțiile deja corecte din proiect (`respond-rental-request`, `request-account-deactivation`).

Practic:
```ts
const supabaseUser = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user } } = await supabaseUser.auth.getUser();

const { data: profile } = await supabaseUser
  .from("profiles")
  .select("kyc_status")
  .eq("id", user.id)
  .maybeSingle();
```

Asta face ca RLS să permită accesul la propriul profil și KYC gate-ul server-side să citească `VERIFIED` corect.

---

#### 2. Păstrez validarea KYC și debug-ul util
Nu scot protecția KYC din checkout.
Păstrez log-urile utile introduse deja, dar după fix ele trebuie să arate:
- `profile_found: true`
- `kyc_status: "VERIFIED"`

Astfel putem confirma rapid că bug-ul e rezolvat fără să slăbim securitatea.

---

#### 3. Curăț efectul secundar actual: rezervări “pending” create înainte de eșecul checkout
Am confirmat că există deja mai multe rânduri în `rentals` pentru acest user, toate `pending`, create de tentativele eșuate înainte ca Stripe session să pornească.

Voi corecta fluxul din `src/features/rentals/rentalsApi.ts` astfel încât:
- dacă `create-checkout-session` răspunde cu `KYC_REQUIRED` sau alt eșec,
- să nu rămână rezervări orfane `pending` create inutil.

Abordare:
- fie șterg/anulez rental-ul abia creat când checkout-ul nu pornește,
- fie mut crearea finală a rental-ului după confirmarea că Stripe session a fost creată.

Voi alege varianta cu impact minim asupra codului existent și compatibilă cu RLS-ul actual.

---

### Fișiere afectate

| Fișier | Modificare |
|---|---|
| `supabase/functions/create-checkout-session/index.ts` | Folosesc client user-scoped cu `Authorization` pentru `auth.getUser()` și query-ul pe `profiles` |
| `src/features/rentals/rentalsApi.ts` | Previn lăsarea rezervărilor `pending` dacă pornirea checkout-ului eșuează |
| posibil `supabase/migrations/<ts>.sql` | Doar dacă e nevoie de o politică minimă pentru cleanup-ul rental-ului creat de același renter; altfel evit migrarea |

---

### Rezultat așteptat
- Userul verificat și aprobat poate intra în checkout fără redirecționare falsă la `/verificare`
- `create-checkout-session` citește corect `profiles.kyc_status = VERIFIED`
- butonul „Rezervă” deschide Stripe normal
- tentativele eșuate nu mai lasă în urmă rezervări `pending` inutile

---

### Verificare după implementare
Voi valida explicit:
1. retry booking cu contul `alexadvanceonline@gmail.com`
2. logs din `create-checkout-session` să arate `profile_found: true`
3. lipsa erorii `KYC_REQUIRED`
4. să nu se mai acumuleze rentals `pending` orfane la eșecuri de checkout
