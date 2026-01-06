-- 🚨 CRITICAL FIX: Prevent users from manipulating their own balance
-- This migration fixes a critical security vulnerability where users could
-- update their own balance field in the profiles table

-- Step 1: Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Step 2: Create new restricted policy that blocks balance manipulation
-- Users can update their profile BUT NOT the balance field
CREATE POLICY "Users can update their own profile except balance"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Ensure balance cannot be changed by user
  AND balance = (SELECT balance FROM public.profiles WHERE id = auth.uid())
);

-- Alternative: Create separate policies for different fields
-- This is more explicit but requires multiple policies

-- Allow users to update their name, phone, avatar
-- DROP POLICY IF EXISTS "Users can update their own profile except balance" ON public.profiles;
-- 
-- CREATE POLICY "Users can update profile info"
-- ON public.profiles
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = id)
-- WITH CHECK (
--   auth.uid() = id 
--   AND full_name = NEW.full_name
--   AND phone = NEW.phone
--   AND avatar_url = NEW.avatar_url
--   AND balance = OLD.balance  -- Balance must not change
--   AND email = OLD.email      -- Email must not change
-- );

COMMENT ON POLICY "Users can update their own profile except balance" ON public.profiles 
IS 'Users can update their profile information but cannot modify balance field. Balance can only be updated by admins or through secure functions.';
