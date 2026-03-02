
-- Admin can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
