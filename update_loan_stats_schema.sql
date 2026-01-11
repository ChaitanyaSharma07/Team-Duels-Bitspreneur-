-- Add 'amount' (numeric) to loan_applications to track disbursed/requested value
ALTER TABLE public.loan_applications ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;

-- Optional: Add 'disbursed_date' if you want to track when money was sent
ALTER TABLE public.loan_applications ADD COLUMN IF NOT EXISTS disbursed_date TIMESTAMP WITH TIME ZONE;
