-- Create a secure function to atomically assign product keys using row locking
-- This prevents race conditions where multiple users could get the same key

CREATE OR REPLACE FUNCTION public.assign_product_keys(
  p_order_id UUID,
  p_product_id UUID,
  p_price_tier_id UUID,
  p_quantity INTEGER,
  p_unit_price NUMERIC,
  p_buyer_id UUID
)
RETURNS TABLE(order_item_id UUID, key_id UUID, key_value TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_order_item_id UUID;
  v_assigned_count INTEGER := 0;
BEGIN
  -- Verify buyer owns the order
  IF NOT EXISTS (
    SELECT 1 FROM orders 
    WHERE id = p_order_id 
    AND user_id = p_buyer_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized order access';
  END IF;
  
  -- Atomically select and mark keys using FOR UPDATE SKIP LOCKED
  -- This prevents race conditions - concurrent transactions will skip locked rows
  FOR v_key_record IN
    SELECT pk.id, pk.key_value
    FROM product_keys pk
    WHERE pk.product_id = p_product_id
      AND pk.price_tier_id = p_price_tier_id
      AND pk.status = 'available'
    ORDER BY pk.created_at
    LIMIT p_quantity
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Update key status within same transaction
    UPDATE product_keys
    SET status = 'sold',
        buyer_id = p_buyer_id,
        sold_at = NOW()
    WHERE id = v_key_record.id;
    
    -- Create order item
    INSERT INTO order_items (
      order_id,
      product_id,
      price_tier_id,
      quantity,
      unit_price,
      key_id
    ) VALUES (
      p_order_id,
      p_product_id,
      p_price_tier_id,
      1,
      p_unit_price,
      v_key_record.id
    ) RETURNING id INTO v_order_item_id;
    
    v_assigned_count := v_assigned_count + 1;
    
    -- Return assigned key info
    RETURN QUERY
    SELECT v_order_item_id, v_key_record.id, v_key_record.key_value;
  END LOOP;
  
  -- Check if we got enough keys
  IF v_assigned_count < p_quantity THEN
    RAISE EXCEPTION 'Không đủ key khả dụng. Yêu cầu: %, Có sẵn: %', p_quantity, v_assigned_count;
  END IF;
END;
$$;