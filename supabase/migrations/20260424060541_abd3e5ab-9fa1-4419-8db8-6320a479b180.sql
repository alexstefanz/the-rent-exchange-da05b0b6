UPDATE public.notifications
SET link = REPLACE(link, '/anunturi?rental_id=', '/inchirieri?rental_id=')
WHERE type = 'rental_request'
  AND link LIKE '/anunturi?rental_id=%';