-- Enable RLS on tables to ensure policies apply
ALTER TABLE public.farmers_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers_agristack ENABLE ROW LEVEL SECURITY;

-- GRANT read access to everyone (User for demo purposes)
-- This ensures that the Bank Dashboard can read the farmer data even if created by another user/anon
CREATE POLICY "Enable read access for all users" ON public.farmers_manual 
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.farmers_agristack 
FOR SELECT USING (true);

-- Allow Insert (if not already set)
CREATE POLICY "Enable insert for all users" ON public.farmers_manual 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON public.farmers_agristack 
FOR INSERT WITH CHECK (true);
