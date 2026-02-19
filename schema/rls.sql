-- NaijaExpense Row Level Security Policies
-- Run AFTER main.sql

-- ============================================================
-- PROFILES — uses id (not user_id)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- EXPENSES
-- ============================================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert_own" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update_own" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_own" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INCOME
-- ============================================================

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "income_select_own" ON income
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "income_insert_own" ON income
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "income_update_own" ON income
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "income_delete_own" ON income
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- EXCHANGE RATES — readable by all authenticated users
-- ============================================================

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_select_all" ON exchange_rates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exchange_rates_insert_service" ON exchange_rates
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "exchange_rates_update_service" ON exchange_rates
  FOR UPDATE TO service_role USING (true);
