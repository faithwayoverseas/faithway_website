-- Add notes_terms column to invoice_settings
ALTER TABLE public.invoice_settings
ADD COLUMN IF NOT EXISTS notes_terms text DEFAULT
'All fees are non-refundable once the process has been initiated.
The applicant must provide all documents as per the checklist.
FaithWay Overseas is not responsible for delays caused by embassy/consulate decisions.
This invoice is valid for 7 days from the date of issue.';
