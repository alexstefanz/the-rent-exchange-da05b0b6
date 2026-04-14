CREATE POLICY "Users can view own activity logs"
ON public.user_activity_logs
FOR SELECT TO authenticated
USING (user_id = auth.uid());