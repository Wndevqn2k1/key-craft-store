-- CRITICAL SECURITY FIX: Prevent unauthorized access to key_value
-- This migration fixes a security vulnerability where all authenticated users
-- could view key_value of available keys

-- Step 1: Drop ALL policies to start fresh
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'product_keys'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON product_keys', policy_record.policyname);
  END LOOP;
END $$;

-- Step 2: Create a secure function to count available keys
-- This function ONLY returns count, never exposes key_value
CREATE OR REPLACE FUNCTION public.get_available_keys_count(
  p_product_id UUID,
  p_price_tier_ids UUID[]
)
RETURNS TABLE (
  price_tier_id UUID,
  available_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    price_tier_id,
    COUNT(*) as available_count
  FROM product_keys
  WHERE product_id = p_product_id
    AND price_tier_id = ANY(p_price_tier_ids)
    AND status = 'available'
  GROUP BY price_tier_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_available_keys_count(UUID, UUID[]) TO authenticated;

-- Step 3: Recreate policies - ONLY purchased keys visible to users
CREATE POLICY "Users can view their purchased keys"
ON product_keys FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.key_id = product_keys.id
    AND o.user_id = auth.uid()
    AND o.status = 'paid'
  )
);

-- Step 4: Admins can manage all keys
CREATE POLICY "Admins can manage all keys"
ON product_keys FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Step 5: Service role for Edge Functions
CREATE POLICY "Service role can manage all keys"
ON product_keys FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON FUNCTION get_available_keys_count IS 'Secure function to count available keys without exposing key_value. Use this instead of direct SELECT on product_keys table.';


