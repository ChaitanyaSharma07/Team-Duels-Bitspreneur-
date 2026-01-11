-- Recreate loan_applications table with correct UUID types and all required columns (including amount)
DROP TABLE IF EXISTS public.loan_applications;

CREATE TABLE public.loan_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    farmer_id UUID,          -- Must be UUID to match farmers_manual.id
    farmer_type TEXT,        -- 'manual' or 'agristack'
    product_id UUID REFERENCES public.mfi_products(id),
    mfi_id UUID REFERENCES public.mfi_registrations(id),
    status TEXT DEFAULT 'pending',
    amount NUMERIC,          -- Added for dashboard stats
    disbursed_date TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

-- Policies (Permissive for demo)
CREATE POLICY "Enable read access for all users" ON public.loan_applications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.loan_applications FOR UPDATE USING (true);

-- Initial Grant
GRANT ALL ON public.loan_applications TO anon;
GRANT ALL ON public.loan_applications TO authenticated;
GRANT ALL ON public.loan_applications TO service_role;
