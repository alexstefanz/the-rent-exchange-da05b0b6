## Problemă

În `Confirmări / Anulări → Anulări rezervări → Arhivă`, după ce respingi (sau aprobi) o cerere din tab-ul „În așteptare", noua intrare nu apare în Arhivă până la un reload manual.

Cauza este în `src/components/admin/AdminCancellationRequestsPanel.tsx`:

- Query-ul arhivei are `enabled: innerTab === "archive"`, deci nu rulează cât timp ești pe „În așteptare".
- După respingere se cheamă `queryClient.invalidateQueries(...)`. Pentru un query dezactivat, invalidate doar marchează datele ca stale, fără să declanșeze fetch. Radix Tabs demontează conținutul tabului inactiv, deci nu există observer activ care să facă refetch.
- Când treci pe Arhivă, componenta se remontează cu datele cache vechi; refetch-ul pornește, dar până se termină, vezi exact lista veche (fără cererea proaspăt respinsă) și badge-ul cu numărul vechi.

## Fix

În `src/components/admin/AdminCancellationRequestsPanel.tsx`:

1. Activez query-ul arhivei permanent (`enabled: true`) ca să se țină în sincron cu lista pending și ca badge-ul „Arhivă (n)" să fie corect indiferent de tab.
2. În `invalidateAll()` (apelat din `approveMutation.onSuccess` și `rejectMutation.onSuccess`) folosesc `queryClient.refetchQueries` pentru cheia arhivei, în locul lui `invalidateQueries`, ca să forțez un fetch imediat chiar dacă tab-ul Arhivă nu e încă vizibil.
3. Pentru robustețe, păstrez și `invalidateQueries` pentru lista pending.

## Out of scope

- Fără modificări în RPC-uri (`list_resolved_cancellation_requests`, `admin_respond_cancellation`) — au fost verificate și funcționează corect.
- Fără modificări la `AdminApprovals.tsx`, edge functions sau email-uri.
- Fără realtime subscriptions noi.
