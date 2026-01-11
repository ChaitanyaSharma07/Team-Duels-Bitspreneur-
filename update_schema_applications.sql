-- Create Loan Applications Table
CREATE TABLE IF NOT EXISTS public.loan_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    farmer_id UUID, -- Can link to either manual or agristack table, so keeping as UUID for now without strict FK constraint or using a polymorphic approach. For simplicity, we store the ID.
    farmer_type TEXT, -- 'manual' or 'agristack'
    product_id UUID REFERENCES public.mfi_products(id),
    mfi_id UUID REFERENCES public.mfi_registrations(id),
    status TEXT DEFAULT 'pending' -- pending, approved, rejected
);

-- Policy
CREATE POLICY "Enable read access for all users" ON public.loan_applications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.loan_applications FOR UPDATE USING (true);
