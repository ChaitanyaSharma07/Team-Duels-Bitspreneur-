-- Create farmers_manual table
CREATE TABLE IF NOT EXISTS public.farmers_manual (
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
    agristack_verified BOOLEAN DEFAULT FALSE
);

-- Create farmers_agristack table (similar structure but separate for logic if needed)
CREATE TABLE IF NOT EXISTS public.farmers_agristack (
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
    agristack_verified BOOLEAN DEFAULT TRUE
);

-- Create MFI Registrations table
CREATE TABLE IF NOT EXISTS public.mfi_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    org_name TEXT,
    institution_type TEXT,
    rbi_reg_number TEXT,
    settlement_account_number TEXT,
    merchant_id TEXT
);

-- Create MFI Products table
CREATE TABLE IF NOT EXISTS public.mfi_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    mfi_id UUID REFERENCES public.mfi_registrations(id),
    product_name TEXT,
    min_loan_amount NUMERIC,
    max_loan_amount NUMERIC
);

-- Enable Row Level Security (RLS) - Optional for dev but good practice
-- ALTER TABLE public.farmers_manual ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.farmers_agristack ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mfi_registrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mfi_products ENABLE ROW LEVEL SECURITY;

-- Create basic policies to allow public access for demo purposes (adjust for production!)
CREATE POLICY "Enable read access for all users" ON public.farmers_manual FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.farmers_manual FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.farmers_agristack FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.farmers_agristack FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.mfi_registrations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.mfi_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON public.mfi_products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.mfi_products FOR INSERT WITH CHECK (true);
