
-- Storage bucket for chat media (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- ===== message_attachments =====
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  uploader_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  width integer,
  height integer,
  duration_ms integer,
  thumbnail_path text,
  hidden_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_conv ON public.message_attachments(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_attachments_msg ON public.message_attachments(message_id);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view attachments"
ON public.message_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = message_attachments.conversation_id
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Uploader can insert attachments"
ON public.message_attachments FOR INSERT
TO authenticated
WITH CHECK (
  uploader_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = message_attachments.conversation_id
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
);

CREATE POLICY "Uploader can delete own attachments"
ON public.message_attachments FOR DELETE
TO authenticated
USING (uploader_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update attachments"
ON public.message_attachments FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===== Storage policies for chat-media bucket =====
-- Folder structure: {conversation_id}/...
CREATE POLICY "Chat media: participants can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  )
);

CREATE POLICY "Chat media: participants can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
  )
);

CREATE POLICY "Chat media: uploaders or admins can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR owner = auth.uid()
  )
);

-- ===== message_reports =====
CREATE TABLE IF NOT EXISTS public.message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  attachment_id uuid REFERENCES public.message_attachments(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters insert reports"
ON public.message_reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters view own reports"
ON public.message_reports FOR SELECT TO authenticated
USING (reporter_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update reports"
ON public.message_reports FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===== user_blocks =====
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blocks"
ON public.user_blocks FOR ALL TO authenticated
USING (blocker_id = auth.uid())
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Admins view all blocks"
ON public.user_blocks FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== conversations: last read timestamps =====
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS buyer_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_last_read_at timestamptz;

-- RPC: mark conversation read for current user
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer uuid;
  v_owner uuid;
BEGIN
  SELECT buyer_id, owner_id INTO v_buyer, v_owner
  FROM conversations WHERE id = p_conversation_id;

  IF v_buyer IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() = v_buyer THEN
    UPDATE conversations SET buyer_last_read_at = now() WHERE id = p_conversation_id;
  ELSIF auth.uid() = v_owner THEN
    UPDATE conversations SET owner_last_read_at = now() WHERE id = p_conversation_id;
  END IF;

  -- Also flip messages.is_read for messages from peer
  UPDATE messages
     SET is_read = true
   WHERE conversation_id = p_conversation_id
     AND sender_id <> auth.uid()
     AND is_read = false;
END;
$$;

-- RPC: get signed URL for chat media (only participants/admins)
CREATE OR REPLACE FUNCTION public.get_chat_signed_media_url(p_attachment_id uuid, p_expires_in integer DEFAULT 3600)
RETURNS TABLE(signed_url text, thumbnail_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_storage_path text;
  v_thumb_path text;
  v_conv uuid;
  v_allowed boolean;
BEGIN
  SELECT a.storage_path, a.thumbnail_path, a.conversation_id
    INTO v_storage_path, v_thumb_path, v_conv
  FROM message_attachments a
  WHERE a.id = p_attachment_id AND a.hidden_by_admin = false;

  IF v_storage_path IS NULL THEN
    RETURN;
  END IF;

  SELECT (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = v_conv AND (c.buyer_id = auth.uid() OR c.owner_id = auth.uid())
    )
  ) INTO v_allowed;

  IF NOT v_allowed THEN
    RETURN;
  END IF;

  -- Note: caller will use storage SDK directly to create signed URLs.
  -- This RPC just authorizes & returns the paths.
  signed_url := v_storage_path;
  thumbnail_url := v_thumb_path;
  RETURN NEXT;
END;
$$;

-- Tighten messages INSERT to also block when peer has blocked sender
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages"
ON public.messages FOR INSERT
TO public
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND ((c.buyer_id = auth.uid()) OR (c.owner_id = auth.uid()))
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks b
        WHERE (b.blocker_id = c.buyer_id AND b.blocked_id = c.owner_id)
           OR (b.blocker_id = c.owner_id AND b.blocked_id = c.buyer_id)
      )
  )
);
