SELECT net.http_post(
  url := 'https://tsffyecastudajmgrckt.supabase.co/functions/v1/capture-rental-payment',
  headers := jsonb_build_object(
    'Content-Type','application/json',
    'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZmZ5ZWNhc3R1ZGFqbWdyY2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDA0NzIsImV4cCI6MjA4MjcxNjQ3Mn0.pdlhN1E_CWT2SQMWllEm349kxqfkGwzs30R41Jnofw4'
  ),
  body := jsonb_build_object('rental_id','f5e1e0f9-50f8-4117-a1e1-81e4b057c0ad')
);