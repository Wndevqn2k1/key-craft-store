-- Create trigger to automatically delete auth.users when profiles is deleted
-- This solves the issue where deleted users can still login

-- Step 1: Create function that deletes from auth.users
CREATE OR REPLACE FUNCTION delete_auth_user_on_profile_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from auth.users using the deleted profile's id
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- Step 2: Create trigger that fires AFTER profile deletion
DROP TRIGGER IF EXISTS trigger_delete_auth_user ON public.profiles;
CREATE TRIGGER trigger_delete_auth_user
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_profile_delete();

-- Step 3: Add comment
COMMENT ON FUNCTION delete_auth_user_on_profile_delete() IS 'Automatically deletes user from auth.users when their profile is deleted';
