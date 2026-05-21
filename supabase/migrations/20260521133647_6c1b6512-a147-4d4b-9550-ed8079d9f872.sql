ALTER TABLE public.product_reviews    REPLICA IDENTITY FULL;
ALTER TABLE public.user_reviews       REPLICA IDENTITY FULL;
ALTER TABLE public.favorite_products  REPLICA IDENTITY FULL;
ALTER TABLE public.favorite_users     REPLICA IDENTITY FULL;
ALTER TABLE public.ops_ticket_attachments REPLICA IDENTITY FULL;
ALTER TABLE public.kyc_documents      REPLICA IDENTITY FULL;
ALTER TABLE public.user_blocks        REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.product_reviews,
  public.user_reviews,
  public.favorite_products,
  public.favorite_users,
  public.ops_ticket_attachments,
  public.kyc_documents,
  public.user_blocks;