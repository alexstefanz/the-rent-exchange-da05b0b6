
-- Allow admins to delete product reviews
CREATE POLICY "Admins can delete product reviews"
ON public.product_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user reviews
CREATE POLICY "Admins can delete user reviews"
ON public.user_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
