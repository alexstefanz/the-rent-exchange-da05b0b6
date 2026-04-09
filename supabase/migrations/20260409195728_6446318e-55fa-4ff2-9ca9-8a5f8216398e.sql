-- Add last_admin_read_at to ops_tickets
ALTER TABLE public.ops_tickets ADD COLUMN last_admin_read_at timestamptz;

-- Enable realtime for ops_tickets and ops_ticket_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ops_ticket_messages;