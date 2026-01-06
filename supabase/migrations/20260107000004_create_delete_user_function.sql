-- Create RPC function to delete user (soft delete via profiles)
-- This function marks user as deleted and removes their data

-- Step 1: Add deleted_at column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Step 2: Create function to soft delete user
CREATE OR REPLACE FUNCTION delete_user(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent self-deletion
  IF auth.uid() = user_id_to_delete THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- Mark profile as deleted and clear sensitive data
  UPDATE public.profiles 
  SET 
    deleted_at = now(),
    email = NULL,
    phone = NULL,
    full_name = 'Deleted User',
    avatar_url = NULL,
    balance = 0
  WHERE id = user_id_to_delete;

  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = user_id_to_delete;
  
  -- Delete user's orders
  DELETE FROM public.orders WHERE user_id = user_id_to_delete;
  
  -- Delete user's cart items
  DELETE FROM public.cart_items WHERE user_id = user_id_to_delete;
END;
$$;

-- Step 3: Create policy to prevent deleted users from accessing
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    AND deleted_at IS NULL
  );

-- Step 4: Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user(uuid) TO authenticated;

-- Step 5: Add comment
COMMENT ON FUNCTION delete_user(uuid) IS 'Soft deletes user by marking profile as deleted and removing data.';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Timestamp when user was deleted. NULL means user is active.';
