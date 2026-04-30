-- Migration to add accounting fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS payment_type text,
ADD COLUMN IF NOT EXISTS service_total_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_received numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_charge_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_due numeric DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.invoices.payment_type IS 'Full Payment, Advance Payment, Partial Payment, or Final Settlement';
