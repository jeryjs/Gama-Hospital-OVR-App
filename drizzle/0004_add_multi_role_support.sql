-- Migration: Add multi-role support with Azure AD groups
-- Date: 2025-11-29
-- Description: Replace single role enum with roles array and AD groups tracking

-- Step 1: Add new columns for multi-role support
ALTER TABLE users 
  ADD COLUMN roles TEXT[] DEFAULT ARRAY['employee']::TEXT[],
  ADD COLUMN ad_groups TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN last_ad_sync TIMESTAMP;

-- Step 2: Migrate existing single role to array format
UPDATE users 
SET roles = CASE 
  WHEN role IS NOT NULL THEN ARRAY[role::TEXT]
  ELSE ARRAY['employee']::TEXT[]
END
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_users_ad_groups ON users USING GIN (ad_groups);
CREATE INDEX IF NOT EXISTS idx_users_last_ad_sync ON users (last_ad_sync);

-- Step 4: Add check constraint (at least one role required)
ALTER TABLE users 
ADD CONSTRAINT users_roles_not_empty 
CHECK (array_length(roles, 1) > 0);

-- Step 5: Drop old role column
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Step 6: Drop old role enum
DROP TYPE IF EXISTS role CASCADE;
