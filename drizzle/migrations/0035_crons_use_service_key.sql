-- lovable-cron-fallback-reviewed: existing jobs, unchanged cadence; only switching auth from public key to vault service key
SELECT cron.unschedule('capture-rental-payments-daily');
SELECT cron.schedule('capture-rental-payments-daily', '0 0 * * *', $$SELECT public.invoke_edge_function_async('process-rental-captures', '{}'::jsonb);$$);
SELECT cron.unschedule('notify-return-day-daily');
SELECT cron.schedule('notify-return-day-daily', '0 9 * * *', $$SELECT public.invoke_edge_function_async('notify-return-day', '{}'::jsonb);$$);
SELECT cron.unschedule('send-pickup-reminders-every-15-min');
SELECT cron.schedule('send-pickup-reminders-every-15-min', '*/15 * * * *', $$SELECT public.invoke_edge_function_async('send-pickup-reminders', '{}'::jsonb);$$);
SELECT cron.unschedule('send-request-deadline-reminders');
SELECT cron.schedule('send-request-deadline-reminders', '*/15 * * * *', $$SELECT public.invoke_edge_function_async('send-request-deadline-reminders', '{}'::jsonb);$$);
SELECT cron.unschedule('send-return-deadline-reminders-hourly');
SELECT cron.schedule('send-return-deadline-reminders-hourly', '5 * * * *', $$SELECT public.invoke_edge_function_async('send-return-deadline-reminders', '{}'::jsonb);$$);
SELECT cron.unschedule('send-return-reminders-hourly');
SELECT cron.schedule('send-return-reminders-hourly', '15 * * * *', $$SELECT public.invoke_edge_function_async('send-return-reminders', '{}'::jsonb);$$);
SELECT cron.unschedule('auto-confirm-handovers-hourly');
SELECT cron.schedule('auto-confirm-handovers-hourly', '0 * * * *', $$SELECT public.invoke_edge_function_async('auto-confirm-handovers', '{}'::jsonb);$$);