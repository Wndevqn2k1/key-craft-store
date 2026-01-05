-- Allow admins to delete user profiles
-- This fixes the issue where admins cannot delete users

-- Add DELETE policy for admins on profiles table
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Also ensure admins can delete user_roles
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);
