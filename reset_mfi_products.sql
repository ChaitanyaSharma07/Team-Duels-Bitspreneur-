-- ==========================================
-- CLEAR EXISTING MFI PRODUCTS
-- ==========================================
TRUNCATE TABLE public.mfi_products CASCADE;
-- Note: truncate cascade will delete linked loan applications too. 
-- If you want to keep applications but just clear products, remove CASCADE (but that might fail foreign keys).
-- Assuming you want a fresh start for MFIs.

-- ==========================================
-- INSERT NEW TEST MFI PRODUCTS
-- ==========================================
-- IMPORTANT: You must replace 'YOUR_MFI_UUID_HERE' with the actual UUID of the MFI user you are logged in as.
-- You can find this UUID in your 'mfi_registrations' table or 'users' table (depending on your auth setup).

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
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- SBI UUID
    'Kharif Crop Super Loan', 
    'Crop Loan', 
    50000, 
    200000, 
    '7% p.a.', 
    '12 Months', 
    'Must own at least 2 acres of land and grow Kharif crops like Paddy or Maize.'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- SBI UUID
    'Tractor Financing Scheme', 
    'Equipment', 
    400000, 
    1000000, 
    '10.5% p.a.', 
    '5 Years', 
    'Minimum 5 acres land holding required. Previous credit score > 700.'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- SBI UUID
    'Kisan Credit Card (KCC)', 
    'KCC', 
    10000, 
    300000, 
    '4% p.a.', 
    '5 Years', 
    'Valid for all registered farmers with active cultivation.'
);
