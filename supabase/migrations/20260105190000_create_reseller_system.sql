-- Create reseller system tables

-- 1. Add reseller role to user_roles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN
    CREATE TYPE app_role AS ENUM ('user', 'admin', 'reseller');
  ELSE
    BEGIN
      ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'reseller';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  END IF;
END $$;

-- 2. Add reseller_price column to price_tiers table
ALTER TABLE price_tiers 
ADD COLUMN IF NOT EXISTS reseller_price DECIMAL(10,2);

-- 3. Create reseller_profiles table
CREATE TABLE IF NOT EXISTS reseller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  reseller_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  note TEXT,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create reseller_orders tracking table
CREATE TABLE IF NOT EXISTS reseller_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  reseller_id UUID REFERENCES reseller_profiles(id) NOT NULL,
  profit_amount DECIMAL(10,2) DEFAULT 0, -- Chênh lệch giữa giá thường và giá reseller
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user_id ON reseller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_status ON reseller_profiles(status);
CREATE INDEX IF NOT EXISTS idx_reseller_orders_reseller_id ON reseller_orders(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_orders_order_id ON reseller_orders(order_id);

-- 6. Enable RLS on reseller tables
ALTER TABLE reseller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_orders ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for reseller_profiles
-- Users can view their own reseller profile
CREATE POLICY "Users can view own reseller profile"
ON reseller_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert reseller registration
CREATE POLICY "Users can register as reseller"
ON reseller_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can view all reseller profiles
CREATE POLICY "Admins can view all reseller profiles"
ON reseller_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 8. RLS Policies for reseller_orders
-- Resellers can view their own orders
CREATE POLICY "Resellers can view own orders"
ON reseller_orders FOR SELECT
TO authenticated
USING (
  reseller_id IN (
    SELECT id FROM reseller_profiles
    WHERE user_id = auth.uid()
  )
);

-- Admins can view all reseller orders
CREATE POLICY "Admins can view all reseller orders"
ON reseller_orders FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role can manage everything
CREATE POLICY "Service role can manage reseller orders"
ON reseller_orders FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 9. Function to automatically create reseller_order when order is created
CREATE OR REPLACE FUNCTION create_reseller_order()
RETURNS TRIGGER AS $$
DECLARE
  v_reseller_id UUID;
  v_profit DECIMAL(10,2);
BEGIN
  -- Check if user is a reseller
  SELECT id INTO v_reseller_id
  FROM reseller_profiles
  WHERE user_id = NEW.user_id
  AND status = 'active'
  LIMIT 1;

  IF v_reseller_id IS NOT NULL THEN
    -- Calculate profit (will be updated later with actual values)
    INSERT INTO reseller_orders (order_id, reseller_id, profit_amount)
    VALUES (NEW.id, v_reseller_id, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for reseller orders
DROP TRIGGER IF EXISTS trigger_create_reseller_order ON orders;
CREATE TRIGGER trigger_create_reseller_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_reseller_order();

-- 11. Update price_tiers with default reseller prices (10% discount)
UPDATE price_tiers
SET reseller_price = ROUND(price * 0.9, 0)
WHERE reseller_price IS NULL;

COMMENT ON COLUMN price_tiers.reseller_price IS 'Special price for resellers (typically 10-20% lower than regular price)';
COMMENT ON TABLE reseller_profiles IS 'Reseller accounts with special pricing privileges';
COMMENT ON TABLE reseller_orders IS 'Tracking orders purchased by resellers for profit calculation';
