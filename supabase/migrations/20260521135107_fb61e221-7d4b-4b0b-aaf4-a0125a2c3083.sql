
REVOKE EXECUTE ON FUNCTION public.post_rental_timeline_chat_event(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_rental_chat_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_return_started_chat_event() FROM PUBLIC, anon, authenticated;
