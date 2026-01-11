ALTER TABLE mfi_products
DROP COLUMN IF EXISTS min_interest_rate,
DROP COLUMN IF EXISTS max_interest_rate,
DROP COLUMN IF EXISTS repayment_type,
DROP COLUMN IF EXISTS collateral_required,
DROP COLUMN IF EXISTS insurance_mandatory,
DROP COLUMN IF EXISTS tenure_months;
