---
name: supabase-schema
description: NaijaExpense Supabase PostgreSQL schema reference. Use when creating or modifying database tables (profiles, expenses, income, exchange_rates), writing SQL migrations, configuring Row Level Security (RLS) policies, setting up Supabase Storage buckets for receipts, or writing typed Supabase client queries. Contains full table DDL, RLS policy patterns, storage bucket config, and query examples.
---

# SKILL: Supabase Schema

## Purpose

Guide for creating, migrating, and managing the NaijaExpense Supabase PostgreSQL schema.

## Schema Files Location

- `schema/main.sql` — all table definitions + enums
- `schema/rls.sql` — Row Level Security policies
- `schema/storage.sql` — storage bucket configuration

## Execution Order

Always run in this order:

1. `main.sql`
2. `rls.sql`
3. `storage.sql`

## Table Reference

### profiles

Stores user business profile used for tax computation.

```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  business_name text,
  annual_turnover_ngn numeric DEFAULT 0 NOT NULL,
  fixed_assets_ngn numeric DEFAULT 0 NOT NULL,
  monthly_rent_ngn numeric DEFAULT 0,
  pension_rate numeric DEFAULT 0.08, -- 8% default
  nhf_rate numeric DEFAULT 0.025,    -- 2.5% default
  tax_year integer DEFAULT 2026,
  currency_preference text DEFAULT 'NGN',
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### expenses

Core expense records.

```sql
CREATE TYPE expense_tag AS ENUM ('deductible', 'capital', 'personal', 'business');
CREATE TYPE expense_category AS ENUM (
  'office_supplies', 'travel', 'meals_entertainment', 'software_subscriptions',
  'equipment', 'rent', 'utilities', 'salaries', 'marketing',
  'professional_services', 'bank_charges', 'insurance', 'repairs_maintenance',
  'fuel', 'airtime_internet', 'other'
);

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
```

### income

Income records.

```sql
CREATE TYPE income_type AS ENUM ('salary', 'dividend', 'freelance', 'export', 'other');

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
```

### exchange_rates

Cache for live FX rates.

```sql
CREATE TABLE exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);
```

## RLS Policies Pattern

Every table must have these 4 policies:

```sql
-- Enable RLS
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

-- SELECT: own rows only
CREATE POLICY "[table]_select_own" ON [table]
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: own rows only
CREATE POLICY "[table]_insert_own" ON [table]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: own rows only
CREATE POLICY "[table]_update_own" ON [table]
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: own rows only
CREATE POLICY "[table]_delete_own" ON [table]
  FOR DELETE USING (auth.uid() = user_id);
```

Exception: `profiles` uses `auth.uid() = id` not `user_id`.

## Storage Bucket Config

```sql
-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "receipts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read
CREATE POLICY "receipts_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

-- Allow owner to delete
CREATE POLICY "receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Storage Path Convention

Always upload receipts to: `{userId}/{expenseId}/{filename}`

This ensures RLS folder-based policies work correctly.

## Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Server client (service role — server actions only)
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Client (anon key — browser only)
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

## Common Query Patterns

```typescript
// Always filter by user_id in every query
const { data, error } = await supabase
  .from("expenses")
  .select("*")
  .eq("user_id", userId)
  .order("date", { ascending: false })

  // Date range filter
  .gte("date", startDate)
  .lte("date", endDate)

  // Category filter
  .eq("category", category)

  // Tag filter
  .eq("tag", tag)

  // Pagination
  .range(offset, offset + limit - 1);
```
