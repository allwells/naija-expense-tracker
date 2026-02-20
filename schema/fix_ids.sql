-- Align Schema with Better Auth (String IDs require TEXT columns)
-- This script must run BEFORE rls.sql so policies are created on the correct column type.

-- 1. Drop constraints relying on the UUID columns
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_user_id_fkey;
ALTER TABLE income DROP CONSTRAINT IF EXISTS income_user_id_fkey;

-- 2. Drop RLS policies that reference these columns (required to alter type)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON expenses;

DROP POLICY IF EXISTS "income_select_own" ON income;
DROP POLICY IF EXISTS "income_insert_own" ON income;
DROP POLICY IF EXISTS "income_update_own" ON income;
DROP POLICY IF EXISTS "income_delete_own" ON income;

DROP POLICY IF EXISTS "exchange_rates_select_all" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_insert_service" ON exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_update_service" ON exchange_rates;

-- 3. Modify columns to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE text;
ALTER TABLE expenses ALTER COLUMN user_id TYPE text;
ALTER TABLE income ALTER COLUMN user_id TYPE text;

-- 4. Re-add constraints
ALTER TABLE expenses ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE income ADD CONSTRAINT income_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
