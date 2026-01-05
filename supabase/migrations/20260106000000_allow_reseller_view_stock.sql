-- Allow resellers and all authenticated users to view available keys for stock counting
-- This fixes the issue where resellers see "Out of Stock" for all products

-- Drop the old service role policy to recreate it as Policy 4
DROP POLICY IF EXISTS "Service role can manage all keys" ON product_keys;

-- Policy 3: All authenticated users can view available keys (for stock display)
-- They can see count and metadata, but key_value is protected by SELECT permissions
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
