# Îmbunătățiri AI Chat-bot Suport (5 funcționalități)

## Ce vom construi

### 1. Severitate / urgență automată
AI-ul va seta automat `priority` (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`) pe ticket bazat pe context din conversație.
- Adaug parametrul `priority` în schema `create_support_ticket` din `support-ai-chat`.
- Update system prompt cu reguli clare de clasificare:
  - **CRITICAL**: fraudă, abuz, dispute financiare active, KYC blocat
  - **HIGH**: nu primesc bani înapoi, produs nereturnat, anulare după start
  - **MEDIUM**: probleme cu rezervări viitoare, întrebări despre plată
  - **LOW**: întrebări generale, sugestii, clarificări

### 2. Detectare automată context
Când user-ul deschide chat-ul de pe pagina unui produs sau a unei rezervări, ID-ul respectiv să fie auto-injectat în ticket.
- `SupportChatWidget` detectează ruta curentă (`/product/:slug`, `/checkout/:id`, `/rentals/:id`, `/rentals-out/:id`).
- Fetch product/rental ID din slug/URL via API existent.
- Trimit context-ul ca `metadata` în payload-ul către edge function.
- AI-ul primește în system prompt: "Userul e pe pagina produsului X / rezervării Y" → poate referi explicit în întrebări.
- La crearea ticket-ului, `product_id`/`reservation_id` se completează automat (deja suportat în `userTicketsApi.createUserTicket`).

### 3. Notificare admin în timp real
Când se creează un ticket nou via AI, admin-ii primesc notificare instant.
- Adaug trigger în Postgres pe `INSERT` în `ops_tickets`: dacă `requester_user_id IS NOT NULL` (creat de user), inserează în `admin_notifications` cu prioritate egală cu ticket-ul.
- Pentru CRITICAL/HIGH: priority `urgent`, link către `/admin/tickets/:id`.
- `AdminSupportWidget` deja folosește Realtime → va apărea bell instant.
- Bonus: pentru CRITICAL, queue email către admini (folosind `pgmq` queue existentă + template nou `new-critical-ticket`).

### 4. FAQ pre-AI
Înainte ca user-ul să intre în conversație cu AI-ul, afișăm 4-5 întrebări frecvente cu răspunsuri instant.
- Card nou în `SupportChatWidget` la deschidere (înainte de mesajul AI):
  - "Cum anulez o rezervare?"
  - "Când primesc banii înapoi?"
  - "Cum funcționează depozitul de garanție?"
  - "Cum confirm predarea/returnarea?"
  - "Comisionul platformei"
- Click pe întrebare → afișează răspunsul markdown inline + buton "Tot am nevoie de ajutor" care continuă către AI.
- Răspunsurile stocate într-un fișier static `src/data/supportFaq.ts` (bilingv RO/EN via `uxCopy`).
- Dacă userul ignoră FAQ și scrie direct → trece la AI normal.

### 5. Auto-routing pe categorie
Ticket-ele se atribuie automat unui admin specializat bazat pe `category_group`.
- Adaug coloana `specialization` pe `user_roles` (sau tabelă nouă `admin_specializations` cu `user_id` + `category_group`).
- Decizie: tabelă nouă `admin_specializations(user_id, category_group)` cu unique pe pereche, RLS doar admin.
- UI nou în `/admin/users/:id` (tab Setări admin): checkboxes pentru a marca specializările (FINANCIAL, DISPUTE, KYC, RESERVATION, PRODUCT, USER).
- Trigger Postgres pe `INSERT` în `ops_tickets`: dacă `assigned_to IS NULL`, caută în `admin_specializations` un admin cu `category_group` matching → setează `assigned_to`.
- Round-robin simplu dacă există mai mulți (cel cu cele mai puține tickete deschise în acea categorie).
- Dacă nicio specializare configurată → rămâne `assigned_to = NULL` (ca acum, oricine din admini îl vede).

## Detalii tehnice

### Schimbări DB (migrare)
```sql
-- 1. Specializări admin
CREATE TABLE public.admin_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_group text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_group)
);
ALTER TABLE public.admin_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage specializations" ON public.admin_specializations
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Trigger auto-routing + admin notification
CREATE OR REPLACE FUNCTION public.handle_new_ops_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  selected_admin uuid;
BEGIN
  -- Auto-routing
  IF NEW.assigned_to IS NULL THEN
    SELECT s.user_id INTO selected_admin
    FROM admin_specializations s
    WHERE s.category_group = NEW.category_group
    ORDER BY (SELECT COUNT(*) FROM ops_tickets t WHERE t.assigned_to = s.user_id AND t.status NOT IN ('CLOSED','RESOLVED')) ASC
    LIMIT 1;
    IF selected_admin IS NOT NULL THEN NEW.assigned_to := selected_admin; END IF;
  END IF;

  -- Admin notification
  IF NEW.requester_user_id IS NOT NULL THEN
    INSERT INTO admin_notifications (type, priority, entity_type, entity_id, link, title_ro, title_en, description_ro, description_en)
    VALUES (
      'new_ticket',
      CASE WHEN NEW.priority IN ('CRITICAL','HIGH') THEN 'urgent' ELSE 'normal' END,
      'ticket', NEW.id, '/admin/tickets/' || NEW.id,
      'Ticket nou: ' || NEW.public_id, 'New ticket: ' || NEW.public_id,
      NEW.title, NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_new_ops_ticket BEFORE INSERT ON public.ops_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_ops_ticket();
```

### Edge function `support-ai-chat`
- Schema tool primește `priority` enum.
- Acceptă în payload `context: { route, productId, reservationId }` din frontend.
- System prompt extins cu reguli severitate + context.

### Frontend
- `src/components/support/SupportChatWidget.tsx`: detect route + product/rental ID, FAQ initial state.
- `src/data/supportFaq.ts`: nou, bilingv.
- `src/data/uxCopy.ts`: chei FAQ + UI labels.
- `src/pages/admin/AdminUserDetail.tsx`: tab nou „Specializări" doar pentru admini.
- API nou `src/features/admin/adminSpecializationsApi.ts`.

## Fișiere afectate
- **Nou**: migrare SQL, `src/data/supportFaq.ts`, `src/features/admin/adminSpecializationsApi.ts`
- **Modificat**: `supabase/functions/support-ai-chat/index.ts`, `src/components/support/SupportChatWidget.tsx`, `src/data/uxCopy.ts`, `src/pages/admin/AdminUserDetail.tsx`
- **Opțional (CRITICAL email)**: nou template + push în queue în trigger
