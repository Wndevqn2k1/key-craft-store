-- Re-enable RLS on product_keys table for security
ALTER TABLE product_keys ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies forcefully
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

-- Policy 1: Users can only view keys they have purchased
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

-- Policy 2: Admins can view and manage all keys
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

-- Policy 3: All authenticated users can view available keys count (for stock display)
-- But they cannot see the actual key_value
CREATE POLICY "Anyone can view available keys for stock count"
ON product_keys FOR SELECT
TO authenticated
USING (status = 'available');

-- Policy 4: Service role (for Edge Functions) can do everything
CREATE POLICY "Service role can manage all keys"
ON product_keys FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
