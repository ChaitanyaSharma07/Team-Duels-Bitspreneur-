-- Recreate Farmers Tables with UUIDs and all required columns (including profile_picture)
DROP TABLE IF EXISTS public.farmers_manual CASCADE;
DROP TABLE IF EXISTS public.farmers_agristack CASCADE;

-- 1. Farmers Manual
CREATE TABLE public.farmers_manual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    mobile_number TEXT,
    doc_type TEXT,
    village TEXT,
    district TEXT,
    state TEXT,
    address TEXT,
    land_size TEXT,
    current_crop TEXT,
    gps_lat TEXT,
    gps_lng TEXT,
    annual_income TEXT,
    has_bank_account TEXT,
    account_holder_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    previous_loans TEXT,
    credit_score NUMERIC,
    agristack_verified BOOLEAN DEFAULT FALSE,
    profile_picture TEXT -- Added for profile images
);

-- 2. Farmers Agristack
CREATE TABLE public.farmers_agristack (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    mobile_number TEXT,
    doc_type TEXT,
    village TEXT,
    district TEXT,
    state TEXT,
    address TEXT,
    land_size TEXT,
    current_crop TEXT,
    gps_lat TEXT,
    gps_lng TEXT,
    annual_income TEXT,
    has_bank_account TEXT,
    account_holder_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    previous_loans TEXT,
    credit_score NUMERIC,
    agristack_verified BOOLEAN DEFAULT TRUE,
    agristack_id TEXT, -- Specific to agristack
    profile_picture TEXT
);

-- 3. Enable RLS
ALTER TABLE public.farmers_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers_agristack ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Enable read access for all users" ON public.farmers_manual FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.farmers_manual FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.farmers_manual FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.farmers_agristack FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.farmers_agristack FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.farmers_agristack FOR UPDATE USING (true);

-- 5. Grant Permissions (User/Anon)
GRANT ALL ON public.farmers_manual TO anon;
GRANT ALL ON public.farmers_manual TO authenticated;
GRANT ALL ON public.farmers_manual TO service_role;

GRANT ALL ON public.farmers_agristack TO anon;
GRANT ALL ON public.farmers_agristack TO authenticated;
GRANT ALL ON public.farmers_agristack TO service_role;
