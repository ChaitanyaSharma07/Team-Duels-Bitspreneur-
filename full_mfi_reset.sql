-- =================================================================
-- RESET MFI REGISTRATIONS AND PRODUCTS (CORRECTED SCHEMA)
-- =================================================================

-- 1. Truncate Tables (Clear Data)
TRUNCATE TABLE public.mfi_registrations CASCADE;
TRUNCATE TABLE public.mfi_products CASCADE;
TRUNCATE TABLE public.loan_applications CASCADE; 

-- 2. Insert Test MFI (Bank) Registration
-- Using columns: org_name, rbi_reg_number, institution_type
-- UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
INSERT INTO public.mfi_registrations (
    id,
    org_name,
    rbi_reg_number,
    institution_type
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'State Bank of India',
    'REG-SBI-001',
    'Public Sector Bank'
);

-- 3. Insert Test Loan Products matches the MFI ID above
INSERT INTO public.mfi_products (
    mfi_id, 
    product_name, 
    product_type, 
    min_loan_amount, 
    max_loan_amount, 
    interest_rate, 
    tenure, 
    eligibility_criteria
) VALUES 
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Uses the ID of SBI created above
    'Kharif Crop Super Loan', 
    'Crop Loan', 
    50000, 
    200000, 
    '7% p.a.', 
    '12 Months', 
    'Must own at least 2 acres of land and grow Kharif crops like Paddy or Maize.'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Tractor Financing Scheme', 
    'Equipment', 
    400000, 
    1000000, 
    '10.5% p.a.', 
    '5 Years', 
    'Minimum 5 acres land holding required. Previous credit score > 700.'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Kisan Credit Card (KCC)', 
    'KCC', 
    10000, 
    300000, 
    '4% p.a.', 
    '5 Years', 
    'Valid for all registered farmers with active cultivation.'
);
