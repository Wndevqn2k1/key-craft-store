-- 🚨 HIGH PRIORITY FIX: Secure checkout flow with atomic transaction
-- This migration creates a secure checkout function that:
-- 1. Validates balance FIRST
-- 2. Deducts balance BEFORE assigning keys
-- 3. Uses transaction to ensure atomicity (rollback if any step fails)

CREATE OR REPLACE FUNCTION public.process_secure_checkout(
  p_user_id UUID,
  p_total_amount NUMERIC,
  p_order_items JSONB -- Array of {product_id, price_tier_id, quantity, unit_price}
)
RETURNS TABLE(
  order_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_current_balance NUMERIC;
  v_item JSONB;
  v_assigned_count INTEGER;
BEGIN
  -- Step 1: Validate user balance (with row lock to prevent race conditions)
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Lock this row until transaction completes
  
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Không tìm thấy tài khoản';
    RETURN;
  END IF;
  
  IF v_current_balance < p_total_amount THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Số dư không đủ';
    RETURN;
  END IF;
  
  -- Step 2: Deduct balance FIRST (before creating order)
  UPDATE profiles
  SET balance = balance - p_total_amount
  WHERE id = p_user_id;
  
  -- Step 3: Create order
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (p_user_id, p_total_amount, 'paid')
  RETURNING id INTO v_order_id;
  
  -- Step 4: Assign keys for each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    -- Call existing assign_product_keys function
    SELECT COUNT(*) INTO v_assigned_count
    FROM assign_product_keys(
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'price_tier_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      p_user_id
    );
    
    -- If not enough keys, the assign_product_keys function will raise an exception
    -- which will rollback the entire transaction including balance deduction
  END LOOP;
  
  -- Step 5: Return success
  RETURN QUERY SELECT v_order_id, TRUE, NULL::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Any error will automatically rollback the transaction
    -- including the balance deduction
    RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION process_secure_checkout(UUID, NUMERIC, JSONB) TO authenticated;

COMMENT ON FUNCTION process_secure_checkout IS 'Secure atomic checkout function that deducts balance BEFORE assigning keys. Automatically rolls back on any error.';

-- Note: Frontend should be updated to use this function instead of manual checkout flow
-- Example usage:
-- SELECT * FROM process_secure_checkout(
--   auth.uid(),
--   100000,
--   '[
--     {"product_id": "...", "price_tier_id": "...", "quantity": 1, "unit_price": 100000}
--   ]'::jsonb
-- );
