-- Add missing columns to mfi_products table to support the new loan creation form
ALTER TABLE public.mfi_products ADD COLUMN IF NOT EXISTS interest_rate TEXT;
ALTER TABLE public.mfi_products ADD COLUMN IF NOT EXISTS tenure TEXT;
ALTER TABLE public.mfi_products ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;
ALTER TABLE public.mfi_products ADD COLUMN IF NOT EXISTS product_type TEXT;
