ALTER TABLE public.rental_physical_pvs ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT 'other';
ALTER TABLE public.rental_physical_pvs ADD COLUMN IF NOT EXISTS reason_details text;
ALTER TABLE public.rental_physical_pvs ADD CONSTRAINT rental_physical_pvs_reason_check CHECK (reason IN ('battery','no_signal','upload_error','platform_down','other'));