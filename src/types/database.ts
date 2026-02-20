// Auto-generated from schema/main.sql
// Matches Supabase PostgreSQL schema exactly

export type ExpenseTag = "deductible" | "capital" | "personal" | "business";

export type ExpenseCategory =
  | "office_supplies"
  | "travel"
  | "meals_entertainment"
  | "software_subscriptions"
  | "equipment"
  | "rent"
  | "utilities"
  | "salaries"
  | "marketing"
  | "professional_services"
  | "bank_charges"
  | "insurance"
  | "repairs_maintenance"
  | "fuel"
  | "airtime_internet"
  | "loan_repayment"
  | "gift"
  | "groceries"
  | "reimbursement"
  | "transport"
  | "education"
  | "healthcare"
  | "personal_care"
  | "clothing"
  | "household"
  | "charity"
  | "taxes_levies"
  | "entertainment"
  | "savings_investment"
  | "other";

export type IncomeType =
  | "salary"
  | "dividend"
  | "freelance"
  | "export"
  | "other";

export type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP" | "other";

// ----------------------------------------------------------------
// Row types (what Supabase returns)
// ----------------------------------------------------------------

export interface ProfileRow {
  id: string;
  full_name: string | null;
  business_name: string | null;
  annual_turnover_ngn: number;
  fixed_assets_ngn: number;
  monthly_rent_ngn: number | null;
  pension_rate: number | null;
  nhf_rate: number | null;
  tax_year: number;
  currency_preference: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: string;
  user_id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  amount_ngn: number;
  original_amount: number | null;
  original_currency: string;
  exchange_rate: number;
  category: ExpenseCategory;
  description: string;
  tag: ExpenseTag;
  receipt_url: string | null;
  receipt_filename: string | null;
  receipt_storage_path: string | null;
  ocr_extracted: boolean;
  ocr_amount: number | null;
  ocr_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncomeRow {
  id: string;
  user_id: string;
  date: string; // ISO date string "YYYY-MM-DD"
  amount_ngn: number;
  original_amount: number | null;
  original_currency: string;
  exchange_rate: number;
  source: string;
  income_type: IncomeType;
  description: string | null;
  is_export_income: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRateRow {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

// ----------------------------------------------------------------
// Insert types (what we send to Supabase)
// ----------------------------------------------------------------

export interface ProfileInsert {
  id: string;
  full_name?: string | null;
  business_name?: string | null;
  annual_turnover_ngn?: number;
  fixed_assets_ngn?: number;
  monthly_rent_ngn?: number | null;
  pension_rate?: number | null;
  nhf_rate?: number | null;
  tax_year?: number;
  currency_preference?: string;
  onboarding_complete?: boolean;
}

export type ExpenseInsert = Omit<
  ExpenseRow,
  "id" | "created_at" | "updated_at"
>;

export type IncomeInsert = Omit<IncomeRow, "id" | "created_at" | "updated_at">;

export type ExchangeRateInsert = Omit<ExchangeRateRow, "id">;

// ----------------------------------------------------------------
// Update types
// ----------------------------------------------------------------

export type ProfileUpdate = Partial<
  Omit<ProfileRow, "id" | "created_at" | "updated_at">
>;

export type ExpenseUpdate = Partial<
  Omit<ExpenseRow, "id" | "user_id" | "created_at" | "updated_at">
>;

export type IncomeUpdate = Partial<
  Omit<IncomeRow, "id" | "user_id" | "created_at" | "updated_at">
>;

// ----------------------------------------------------------------
// Database type for Supabase client generic
// ----------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      expenses: {
        Row: ExpenseRow;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
      };
      income: {
        Row: IncomeRow;
        Insert: IncomeInsert;
        Update: IncomeUpdate;
      };
      exchange_rates: {
        Row: ExchangeRateRow;
        Insert: ExchangeRateInsert;
        Update: Partial<Omit<ExchangeRateRow, "id">>;
      };
    };
  };
}
