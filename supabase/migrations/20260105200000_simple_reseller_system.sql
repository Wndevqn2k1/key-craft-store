-- Rollback previous reseller system
DROP TABLE IF EXISTS reseller_orders CASCADE;
DROP TABLE IF EXISTS reseller_profiles CASCADE;
DROP TRIGGER IF EXISTS trigger_create_reseller_order ON orders;
DROP FUNCTION IF EXISTS create_reseller_order();

-- Simple reseller system: just add role and price

-- 1. Add reseller role to enum (if not exists)
DO $$ 
BEGIN
  BEGIN
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'reseller';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;
END $$;

-- 2. Ensure reseller_price column exists
ALTER TABLE price_tiers 
ADD COLUMN IF NOT EXISTS reseller_price DECIMAL(10,2);

-- 3. Set default reseller prices (10% discount from regular price)
UPDATE price_tiers
SET reseller_price = ROUND(price * 0.9, 0)
WHERE reseller_price IS NULL;

-- 4. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_price_tiers_reseller_price ON price_tiers(reseller_price);

COMMENT ON COLUMN price_tiers.reseller_price IS 'Special price for reseller accounts (10-20% discount)';
