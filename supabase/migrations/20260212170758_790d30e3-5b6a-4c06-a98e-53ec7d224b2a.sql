-- Allow authenticated users to insert notifications (needed for cancellation notifications)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);