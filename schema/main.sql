-- NaijaExpense Database Schema
-- Run this first, then rls.sql, then storage.sql

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE expense_tag AS ENUM ('deductible', 'capital', 'personal', 'business');

CREATE TYPE expense_category AS ENUM (
  'office_supplies', 'travel', 'meals_entertainment', 'software_subscriptions',
  'equipment', 'rent', 'utilities', 'salaries', 'marketing',
  'professional_services', 'bank_charges', 'insurance', 'repairs_maintenance',
  'fuel', 'airtime_internet', 'other'
);

CREATE TYPE income_type AS ENUM ('salary', 'dividend', 'freelance', 'export', 'other');

CREATE TYPE currency_code AS ENUM ('NGN', 'USD', 'EUR', 'GBP', 'other');

-- ============================================================
-- TABLES
-- ============================================================

-- User business profile (extends better-auth user table)
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  full_name text,
  business_name text,
  annual_turnover_ngn numeric DEFAULT 0 NOT NULL,
  fixed_assets_ngn numeric DEFAULT 0 NOT NULL,
  monthly_rent_ngn numeric DEFAULT 0,
  pension_rate numeric DEFAULT 0.08,
  nhf_rate numeric DEFAULT 0.025,
  tax_year integer DEFAULT 2026,
  currency_preference text DEFAULT 'NGN',
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount_ngn numeric NOT NULL,
  original_amount numeric,
  original_currency text DEFAULT 'NGN',
  exchange_rate numeric DEFAULT 1,
  category expense_category NOT NULL,
  description text NOT NULL,
  tag expense_tag NOT NULL,
  receipt_url text,
  receipt_filename text,
  receipt_storage_path text,
  ocr_extracted boolean DEFAULT false,
  ocr_amount numeric,
  ocr_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Income entries
CREATE TABLE income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount_ngn numeric NOT NULL,
  original_amount numeric,
  original_currency text DEFAULT 'NGN',
  exchange_rate numeric DEFAULT 1,
  source text NOT NULL,
  income_type income_type NOT NULL,
  description text,
  is_export_income boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exchange rates cache
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_category ON expenses(user_id, category);
CREATE INDEX idx_expenses_tag ON expenses(user_id, tag);
CREATE INDEX idx_income_user_date ON income(user_id, date DESC);
CREATE INDEX idx_income_type ON income(user_id, income_type);
CREATE INDEX idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency);

-- ============================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_income_updated_at
  BEFORE UPDATE ON income
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
