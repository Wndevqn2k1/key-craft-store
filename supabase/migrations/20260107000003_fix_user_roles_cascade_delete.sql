-- Fix user_roles cascade delete when profile is deleted
-- This ensures that when a profile is deleted, the user_roles are also deleted

-- Step 1: Drop the old foreign key constraint
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Step 2: Clean up orphaned user_roles (user_id not in profiles)
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Step 3: Add new foreign key constraint that references profiles with CASCADE delete
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Step 4: Add comment for documentation
COMMENT ON CONSTRAINT user_roles_user_id_fkey ON public.user_roles 
IS 'Ensures user_roles are automatically deleted when the associated profile is deleted.';
