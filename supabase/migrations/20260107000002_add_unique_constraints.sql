-- Add UNIQUE constraints for email and phone to prevent duplicates
-- This ensures data integrity at the database level

-- Step 1: Remove any duplicate emails (keep the oldest record)
-- Only if duplicates exist
DO $$
DECLARE
  duplicate_record RECORD;
  keep_record_id uuid;
BEGIN
  FOR duplicate_record IN
    SELECT email
    FROM public.profiles
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the oldest record (by created_at)
    SELECT id INTO keep_record_id
    FROM public.profiles
    WHERE email = duplicate_record.email
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Delete duplicates, keep the oldest one
    DELETE FROM public.profiles
    WHERE email = duplicate_record.email
    AND id != keep_record_id;
  END LOOP;
END $$;

-- Step 2: Remove any duplicate phone numbers (keep the oldest record)
DO $$
DECLARE
  duplicate_record RECORD;
  keep_record_id uuid;
BEGIN
  FOR duplicate_record IN
    SELECT phone
    FROM public.profiles
    WHERE phone IS NOT NULL AND phone != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  LOOP
    -- Get the ID of the oldest record (by created_at)
    SELECT id INTO keep_record_id
    FROM public.profiles
    WHERE phone = duplicate_record.phone
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Delete duplicates, keep the oldest one
    DELETE FROM public.profiles
    WHERE phone = duplicate_record.phone
    AND id != keep_record_id;
  END LOOP;
END $$;

-- Step 3: Add UNIQUE constraint for email
-- Email must be unique (NULL values are allowed and don't conflict)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique 
UNIQUE (email);

-- Step 4: Add UNIQUE constraint for phone
-- Phone must be unique (NULL and empty strings are allowed)
-- Create a partial unique index that excludes NULL and empty strings
CREATE UNIQUE INDEX profiles_phone_unique 
ON public.profiles (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Step 5: Add comments for documentation
COMMENT ON CONSTRAINT profiles_email_unique ON public.profiles 
IS 'Ensures email addresses are unique across all profiles. NULL values are allowed.';

COMMENT ON INDEX profiles_phone_unique 
IS 'Ensures phone numbers are unique (excluding NULL and empty strings). Prevents users from registering with the same phone number.';
