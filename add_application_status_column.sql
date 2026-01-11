-- Add application_status column to Farmer tables to track loan lifecycle directly on the user record
ALTER TABLE public.farmers_manual ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'none';
ALTER TABLE public.farmers_agristack ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'none';

-- Comment: This allows the MFI dashboard to easily see 'pending' or 'approved' status in the main directory.
