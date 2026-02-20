# NaijaExpense — Antigravity Build Prompt

## Project Overview

Build **NaijaExpense**, a production-grade personal and business expense tracking web app, installable as a PWA on mobile, built for Nigerian freelancers, SMEs, and professionals who need to track expenses, manage receipts, and compute tax liability under Nigeria's **2026 Tax Reform Act** (effective January 1, 2026).

## Tech Stack (Non-Negotiable)

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Framework       | Next.js 15 (App Router only)                     |
| Language        | TypeScript (strict mode, zero `any`)             |
| Database        | Supabase (PostgreSQL + Storage)                  |
| Auth            | better-auth                                      |
| UI              | Shadcn/ui + Tailwind CSS v4                      |
| OCR             | Tesseract.js (client-side receipt scanning)      |
| Charts          | Recharts (see `.agent/skills/recharts/SKILL.md`) |
| Export          | csv-stringify or papaparse                       |
| PWA             | next-pwa or custom service worker                |
| Package manager | Bun                                              |

---

## Implementation Plan (Phased — Await Confirmation Before Each Phase)

> **CRITICAL:** You MUST stop at the end of each phase and output:
>
> ```
> ✅ PHASE [N] COMPLETE — Awaiting confirmation to proceed to Phase [N+1]
> ```
>
> Do NOT proceed to the next phase until the user explicitly says "confirmed" or "proceed".

---

### PHASE 1 — Project Scaffold & Foundation

**Goal:** Working skeleton with auth, theme, PWA config, and empty shell pages.

#### 1.1 Project Initialization

- Initialize Next.js 15 project with App Router using Bun
- Configure TypeScript strict mode in `tsconfig.json`
- Install all dependencies: `better-auth`, `@supabase/supabase-js`, `tesseract.js`, `recharts`, `csv-stringify`, `next-pwa`, shadcn/ui and all required components
- Set up ESLint + Prettier

#### 1.2 Theme & Global Styles

- Apply the exact Shadcn CSS theme provided (see theme spec below) to `globals.css`
- Override border width to `2px` on all Shadcn components globally
- Override border radius to `0px` globally (`--radius: 0rem`)
- Configure Geist font (sans, mono) via `next/font`

#### 1.3 Supabase Configuration

- Create `src/lib/supabase.ts` — server and client Supabase instances
- Create `src/lib/db.ts` — typed query helpers
- Create `schema/main.sql` with all tables (see schema spec below)
- Create `schema/rls.sql` with Row Level Security policies
- Create `schema/storage.sql` with storage bucket config for receipts

#### 1.4 better-auth Configuration

- Configure better-auth in `src/lib/auth.ts` with Supabase adapter
- Create `src/lib/auth-client.ts` for client-side auth hooks
- Create `src/app/api/auth/[...all]/route.ts`
- Implement middleware in `src/middleware.ts` to protect all `/dashboard/*` routes
- Build `src/app/login/page.tsx` — clean login/signup page using the Shadcn theme

#### 1.5 PWA Setup

- Create `public/manifest.json` with app name, icons, theme color, display: standalone
- Configure `next.config.ts` with PWA plugin
- Add service worker for offline caching of shell
- Set `<meta>` tags for mobile installability (apple-mobile-web-app-capable, etc.)

#### 1.6 App Shell

- Create root layout `src/app/layout.tsx` with font, theme provider, PWA meta tags
- Create `src/components/Providers.tsx` — wraps ThemeContext + auth session provider
- Create `src/components/Navigation/index.tsx` — responsive sidebar (desktop) + bottom nav (mobile)
- Create `src/components/ThemeToggle/index.tsx`
- Create `src/components/Logo/index.tsx`
- Create empty shell pages for all routes: `/dashboard`, `/expenses`, `/income`, `/reports`, `/settings`
- Create `src/app/(dashboard)/layout.tsx` with Navigation

**Acceptance Criteria — Phase 1:**

- [ ] `bun run dev` starts without errors
- [ ] Login page renders with correct theme (2px borders, 0 radius, Geist font)
- [ ] Dark/light mode toggle works
- [ ] Protected routes redirect to login when unauthenticated
- [ ] App is installable on Chrome Android (shows "Add to Home Screen" prompt)
- [ ] All shell pages render without errors
- [ ] Supabase schema SQL files are complete and ready to run

---

### PHASE 2 — Database Schema & Core Data Layer

**Goal:** Full Supabase schema deployed, type-safe data layer, seed data.

#### 2.1 Database Tables

```sql
-- Users profile (extends better-auth user)
profiles (
  id uuid references auth.users primary key,
  full_name text,
  business_name text,
  annual_turnover_ngn numeric default 0,
  fixed_assets_ngn numeric default 0,
  tax_year integer default 2026,
  currency_preference text default 'NGN',
  created_at timestamptz default now()
)

-- Expenses
expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  amount_ngn numeric not null,
  original_amount numeric,
  original_currency text default 'NGN',
  exchange_rate numeric default 1,
  category text not null, -- see categories enum
  description text,
  tag text not null, -- 'deductible' | 'capital' | 'personal' | 'business'
  receipt_url text,
  receipt_filename text,
  ocr_extracted boolean default false,
  ocr_amount numeric,
  ocr_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

-- Income entries
income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date date not null,
  amount_ngn numeric not null,
  original_amount numeric,
  original_currency text default 'NGN',
  exchange_rate numeric default 1,
  source text not null,
  income_type text not null, -- 'salary' | 'dividend' | 'freelance' | 'export' | 'other'
  description text,
  is_export_income boolean default false,
  created_at timestamptz default now()
)

-- Exchange rates cache
exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  fetched_at timestamptz default now()
)
```

#### 2.2 TypeScript Types

- Generate fully typed interfaces in `src/types/database.ts` matching all tables
- Create `src/types/expense.ts`, `src/types/income.ts`, `src/types/tax.ts`

#### 2.3 Service Layer

- `src/lib/expense-service.ts` — CRUD for expenses with filters, pagination
- `src/lib/income-service.ts` — CRUD for income
- `src/lib/storage-service.ts` — Supabase Storage upload/delete/getUrl for receipts
- `src/lib/exchange-rate-service.ts` — fetch live rates from ExchangeRate-API (free tier), cache in DB for 1 hour

#### 2.4 Server Actions

- `src/app/actions/expense-actions.ts` — createExpense, updateExpense, deleteExpense, getExpenses
- `src/app/actions/income-actions.ts` — createIncome, updateIncome, deleteIncome, getIncome
- `src/app/actions/profile-actions.ts` — getProfile, updateProfile

**Acceptance Criteria — Phase 2:**

- [ ] All SQL files run without errors on Supabase
- [ ] RLS policies ensure users can only access their own data
- [ ] All TypeScript types are generated and strict
- [ ] Server actions return typed responses with error handling
- [ ] Receipt storage bucket created with public read / authenticated write policy
- [ ] Exchange rate fetch works and caches correctly

---

### PHASE 3 — Expense Logging UI + OCR Receipt Scanning

**Goal:** Full expense entry form with receipt upload and Tesseract.js OCR auto-fill.

#### 3.1 Expense Form Component

Build `src/components/ExpenseForm/` with:

- `index.tsx` — main modal/sheet component
- `ExpenseFormFields.tsx` — all form fields
- `ReceiptUploader.tsx` — drag-and-drop + camera capture upload
- `OcrScanner.tsx` — Tesseract.js processor
- `hooks/use-expense-form.ts` — form state, validation, submission
- `hooks/use-ocr.ts` — OCR processing state machine

**Form fields:**

- Date (date picker, pre-filled from OCR)
- Amount in NGN (pre-filled from OCR)
- Original currency (select: NGN, USD, EUR, GBP, other) + original amount
- Category (select — see categories below)
- Tag (select: deductible / capital / personal / business)
- Description (textarea)
- Receipt upload (image or PDF)
- Notes (optional)

**Categories:**
`office_supplies`, `travel`, `meals_entertainment`, `software_subscriptions`, `equipment`, `rent`, `utilities`, `salaries`, `marketing`, `professional_services`, `bank_charges`, `insurance`, `repairs_maintenance`, `fuel`, `airtime_internet`, `other`

#### 3.2 OCR Pipeline

In `src/components/ExpenseForm/OcrScanner.tsx` and `hooks/use-ocr.ts`:

- When receipt image is uploaded, run Tesseract.js in a Web Worker
- Extract: amount (look for patterns like `₦`, `NGN`, `N`, `Total:`, `Amount:`, currency symbols), date (various formats: DD/MM/YYYY, MM-DD-YYYY, written month)
- Show extracted values as "Suggested" with accept/reject UI
- Store `ocr_extracted: true`, `ocr_amount`, `ocr_date` on the expense record
- Show OCR progress spinner during processing

#### 3.3 Expenses List Page

Build `src/components/ExpensesList/`:

- `index.tsx` — page wrapper
- `ExpensesTable.tsx` — sortable table (desktop)
- `ExpensesCards.tsx` — card list (mobile)
- `ExpenseFilters.tsx` — filter by date range, category, tag, currency
- `ExpenseRow.tsx` / `ExpenseCard.tsx`
- `ExpenseDetailModal.tsx` — view/edit/delete with receipt preview

Build `src/app/(dashboard)/expenses/page.tsx` using server-side data fetching.

**Acceptance Criteria — Phase 3:**

- [ ] Expense form opens as sheet/modal, all fields functional
- [ ] Receipt upload works (image + PDF)
- [ ] OCR extracts amount and date from a clear receipt image and pre-fills form fields
- [ ] Currency conversion auto-fills NGN amount when original currency + amount entered
- [ ] Expenses list shows on both mobile (cards) and desktop (table)
- [ ] Filters work correctly
- [ ] Edit and delete work with optimistic updates
- [ ] Receipt thumbnails visible in list and detail modal

---

### PHASE 4 — Income Tracking

**Goal:** Income entry, multi-currency, dividend and export income classification.

#### 4.1 Income Form Component

Build `src/components/IncomeForm/`:

- `index.tsx`
- `IncomeFormFields.tsx`
- `hooks/use-income-form.ts`

**Income form fields:**

- Date
- Source (text — e.g. "Client A", "Employer Ltd")
- Income type (select: salary / dividend / freelance / export / other)
- Amount + currency selector
- "Is this export income?" toggle (for CGT exemption)
- Description

#### 4.2 Income List Page

Build `src/components/IncomeList/`:

- `index.tsx`
- `IncomeTable.tsx` (desktop)
- `IncomeCards.tsx` (mobile)
- `IncomeFilters.tsx`

Build `src/app/(dashboard)/income/page.tsx`

**Acceptance Criteria — Phase 4:**

- [ ] Income form works with all types
- [ ] Export income flag stored and displayed
- [ ] Currency conversion correct
- [ ] Income list paginated and filterable

---

### PHASE 5 — Nigeria 2026 Tax Engine

**Goal:** Complete, accurate tax computation engine implementing the 2026 Tax Reform Act.

This is the most critical and complex module. Zero tolerance for logic errors.

#### 5.1 Tax Engine — `src/lib/tax-engine.ts`

Build a pure, fully-typed, testable tax computation module. No side effects.

**Company Income Tax (CIT) — 2026 Rules:**

```typescript
// Small Business Exemption threshold
const CIT_EXEMPTION_TURNOVER_THRESHOLD = 100_000_000; // ₦100M
const CIT_EXEMPTION_FIXED_ASSETS_THRESHOLD = 250_000_000; // ₦250M
const CIT_RATE = 0.3; // 30%
const DEVELOPMENT_LEVY_RATE = 0.04; // 4%

function isExemptFromCIT(annualTurnover: number, fixedAssets: number): boolean {
  return (
    annualTurnover <= CIT_EXEMPTION_TURNOVER_THRESHOLD &&
    fixedAssets <= CIT_EXEMPTION_FIXED_ASSETS_THRESHOLD
  );
}

function computeCIT(
  taxableProfit: number,
  annualTurnover: number,
  fixedAssets: number,
): CITResult {
  const exempt = isExemptFromCIT(annualTurnover, fixedAssets);
  if (exempt) return { exempt: true, cit: 0, developmentLevy: 0, total: 0 };
  const cit = taxableProfit * CIT_RATE;
  const developmentLevy = taxableProfit * DEVELOPMENT_LEVY_RATE;
  return { exempt: false, cit, developmentLevy, total: cit + developmentLevy };
}
```

**Personal Income Tax (PIT) — 2026 Progressive Brackets:**

```
₦0 – ₦800,000        → 0% (new tax-free threshold)
₦800,001 – ₦2,000,000 → 15%
₦2,000,001 – ₦4,000,000 → 19%
₦4,000,001 – ₦6,000,000 → 21%
₦6,000,001 – ₦10,000,000 → 23%
Above ₦10,000,000     → 25%
```

**Allowable Deductions (PIT):**

- Rent Relief: 20% of rent paid, capped at ₦500,000 per annum
- Pension contributions: 8% of gross salary (employee portion) — deductible
- NHF (National Housing Fund): 2.5% of basic salary — deductible

**Capital Gains Tax (CGT):**

- Standard CGT rate: 10%
- Exempt if: business qualifies for small business exemption (turnover ≤ ₦100M, fixed assets ≤ ₦250M)
- Export-oriented businesses: fully exempt from CGT

**Dividend Taxation:**

- Dividends from Nigerian companies: 10% withholding tax
- Dividends from export-oriented companies: exempt

**Deductible Expense Categories:**

```typescript
const FULLY_DEDUCTIBLE: Category[] = [
  "office_supplies",
  "travel",
  "software_subscriptions",
  "utilities",
  "salaries",
  "marketing",
  "professional_services",
  "bank_charges",
  "insurance",
  "repairs_maintenance",
  "fuel",
  "airtime_internet",
];
const PARTIALLY_DEDUCTIBLE: Record<Category, number> = {
  meals_entertainment: 0.5, // 50% deductible
};
const CAPITAL_ALLOWANCES: Category[] = ["equipment"]; // depreciation-based
const NON_DEDUCTIBLE: Category[] = ["personal"];
// Rent: deductible as business expense if tagged 'business'
```

**Taxable Profit Calculation:**

```
Taxable Profit = Total Business Income
              - Fully Deductible Business Expenses
              - 50% of Meals & Entertainment
              - Pension Contributions
              - NHF Contributions
              - Rent Relief (20% of rent, max ₦500k)
```

#### 5.2 Tax Computation Service

Build `src/lib/tax-computation-service.ts`:

- `computeFullTaxLiability(userId, year)` — aggregates all income/expenses, runs through tax engine, returns full breakdown
- Returns: `TaxLiabilityResult` with CIT, PIT, CGT, dividend tax, development levy, total payable, exemption status, deductible amounts, itemized computation steps (for audit export)

#### 5.3 Tax Engine Unit Tests

Create `src/lib/__tests__/tax-engine.test.ts`:

- Test CIT exemption at exactly ₦100M and ₦100M+1
- Test all PIT brackets with boundary values
- Test rent relief cap at ₦500k
- Test export income CGT exemption

**Acceptance Criteria — Phase 5:**

- [ ] All unit tests pass
- [ ] CIT correctly shows ₦0 for turnover ≤ ₦100M with fixed assets ≤ ₦250M
- [ ] CIT correctly applies 30% + 4% development levy above threshold
- [ ] PIT brackets compute correctly for boundary values
- [ ] Rent relief correctly caps at ₦500,000
- [ ] Export income correctly flagged as CGT exempt
- [ ] Taxable profit deduction logic is correct for all categories

---

### PHASE 6 — Dashboard & Reports

**Goal:** Visual monthly/yearly dashboards with real tax liability numbers.

#### 6.1 Dashboard Page

Build `src/components/Dashboard/`:

- `index.tsx` — page orchestrator
- `StatsRow.tsx` — 4 key metric cards (Total Income, Total Expenses, Net Profit, Tax Liability)
- `SpendByCategoryChart.tsx` — **Donut/Pie chart** (Recharts `PieChart` + `Pie` with `innerRadius`) showing spend breakdown by category. Use `CATEGORY_COLORS` from `chart-theme.ts`. See recharts skill.
- `MonthlyTrendChart.tsx` — **Composed chart** (Recharts `ComposedChart`) with `Bar` for expenses and `Line` for income per month. Dual Y-axis optional. See recharts skill.
- `TaxLiabilityCard.tsx` — special card showing:
  - "You qualify for CIT exemption" (green) OR "CIT liability: ₦X" (amber/red)
  - Breakdown: CIT, development levy, PIT, total
  - Projected annual liability based on YTD
- `DeductiblesCard.tsx` — shows total deductible vs non-deductible as a **horizontal stacked bar chart** (Recharts `BarChart` with `layout="vertical"`). See recharts skill.
- `RecentExpenses.tsx` — last 5 expenses with quick-add button
- `ExemptionStatusBanner.tsx` — prominent banner showing current exemption status with turnover vs threshold

Build `src/app/(dashboard)/dashboard/page.tsx` with server-side data.

#### 6.2 Reports Page

Build `src/components/Reports/`:

- `index.tsx`
- `ReportFilters.tsx` — year/month selector
- `TaxLiabilityBreakdownChart.tsx` — **Stacked bar chart** (Recharts `BarChart`) with CIT, Development Levy, and PIT as stacked segments per month. See recharts skill.
- `ProfitLossStatement.tsx` — formal P&L layout (income - expenses = profit)
- `TaxComputationTable.tsx` — itemized FIRS-style tax computation:
  - Gross Income
  - Less: Deductible Expenses (itemized by category)
  - Less: Pension, NHF, Rent Relief
  - = Taxable Income/Profit
  - Tax Computation: CIT / PIT / CGT (with rates shown)
  - Total Tax Payable
  - Exemption notes if applicable
- `CategoryBreakdownTable.tsx` — all expenses grouped by category with deductibility status

Build `src/app/(dashboard)/reports/page.tsx`

#### 6.3 Exchange Rate Display

Show in dashboard header: current USD/NGN and EUR/NGN rates with last-updated timestamp.

**Acceptance Criteria — Phase 6:**

- [ ] Dashboard loads with correct aggregated numbers
- [ ] Tax liability card correctly reflects exemption vs liability status
- [ ] Charts render correctly on both mobile and desktop
- [ ] P&L statement numbers match raw data
- [ ] Tax computation table is itemized and audit-ready
- [ ] Exchange rates display with last-updated time
- [ ] All numbers formatted as Nigerian Naira (₦) with comma separators

---

### PHASE 7 — CSV Export & Audit Package

**Goal:** One-click export of audit-ready CSV files for FIRS submission or accountant review.

#### 7.1 Export Service

Build `src/lib/export-service.ts`:

**Expenses CSV columns:**
`Date, Description, Category, Tag (Deductible/Capital/Personal/Business), Original Amount, Original Currency, Exchange Rate, Amount (NGN), Deductible Amount (NGN), Non-Deductible Amount (NGN), Receipt URL, OCR Extracted (Y/N), Notes`

**Income CSV columns:**
`Date, Source, Income Type, Original Amount, Original Currency, Exchange Rate, Amount (NGN), Is Export Income (Y/N), Description`

**Tax Computation Summary CSV:**

```
FIRS TAX COMPUTATION SUMMARY
Tax Year: 2026
Business Name: [name]
Prepared: [date]

SECTION A: INCOME
[itemized income rows]
Total Income: ₦X

SECTION B: DEDUCTIBLE EXPENSES
[itemized deductible expense rows by category]
Total Deductible Expenses: ₦X

SECTION C: ADJUSTMENTS
Pension Contributions: ₦X
NHF Contributions: ₦X
Rent Relief (20% of ₦X rent, capped ₦500k): ₦X
Total Adjustments: ₦X

SECTION D: TAXABLE INCOME
Gross Income: ₦X
Less Deductible Expenses: (₦X)
Less Adjustments: (₦X)
Taxable Income/Profit: ₦X

SECTION E: TAX LIABILITY
CIT Exemption Status: EXEMPT / NOT EXEMPT
[if not exempt:]
CIT @ 30%: ₦X
Development Levy @ 4%: ₦X
PIT Computation: [bracket breakdown]
Total Tax Payable: ₦X
```

#### 7.2 Export UI

Build `src/components/ExportPanel/`:

- `index.tsx` — export options panel
- Export buttons: "Expenses CSV", "Income CSV", "Tax Summary CSV", "Full Audit Package (ZIP)"
- Date range selector
- Show file size estimate

Build `src/app/api/export/expenses/route.ts`
Build `src/app/api/export/income/route.ts`
Build `src/app/api/export/tax-summary/route.ts`

**Acceptance Criteria — Phase 7:**

- [ ] All 3 CSV exports download correctly
- [ ] Tax computation CSV is formatted for FIRS review (sections clearly labeled)
- [ ] Receipt URLs are valid Supabase Storage public URLs in the export
- [ ] Date range filter applies to exports
- [ ] Numbers in CSV match dashboard numbers exactly

---

### PHASE 8 — Settings, Profile & Polish

**Goal:** User settings, business profile for tax calculations, final mobile polish.

#### 8.1 Settings Page

Build `src/components/Settings/`:

- `ProfileForm.tsx` — full name, business name, annual turnover, fixed assets (these drive tax exemption calculation)
- `TaxSettingsForm.tsx` — tax year, pension contribution %, NHF setting, monthly rent amount
- `CurrencySettings.tsx` — preferred display currency, auto-conversion toggle
- `DangerZone.tsx` — delete account, clear all data

Build `src/app/(dashboard)/settings/page.tsx`

#### 8.2 Onboarding Flow

First-time user sees a 3-step onboarding:

1. Business profile (name, turnover, fixed assets)
2. Tax preferences (pension, NHF, rent)
3. Import existing data (CSV upload) or start fresh

#### 8.3 Mobile Polish

- Bottom navigation bar with 5 tabs: Dashboard, Expenses, Income, Reports, Settings
- Floating Action Button (FAB) on mobile for quick expense add
- Touch-optimized form inputs (large tap targets, no zoom on focus)
- Pull-to-refresh on expense list
- Swipe-to-delete on expense cards

#### 8.4 Empty States

- All list pages have illustrated empty states with clear CTAs
- Dashboard empty state with onboarding prompt

#### 8.5 Error Handling & Loading States

- Skeleton loaders for all data-fetching components
- Error boundaries on all page components
- Toast notifications for all CRUD operations (success/error) — see `.agent/skills/sonner-notifications/SKILL.md` for exact titles and messages
- Network error states with retry buttons

**Acceptance Criteria — Phase 8:**

- [ ] Profile saves and immediately updates tax computation
- [ ] Turnover/fixed assets change correctly flips exemption status in dashboard
- [ ] Onboarding completes and stores profile
- [ ] Mobile FAB opens expense form
- [ ] All skeleton loaders present
- [ ] Toast notifications on all actions with correct titles and descriptions per sonner-notifications skill
- [ ] App fully functional on iPhone Safari and Chrome Android

---

## Database Schema (Full Spec)

```sql
-- Run in order:
-- 1. schema/main.sql
-- 2. schema/rls.sql
-- 3. schema/storage.sql

-- ENUMS
CREATE TYPE expense_tag AS ENUM ('deductible', 'capital', 'personal', 'business');
CREATE TYPE expense_category AS ENUM (
  'office_supplies', 'travel', 'meals_entertainment', 'software_subscriptions',
  'equipment', 'rent', 'utilities', 'salaries', 'marketing',
  'professional_services', 'bank_charges', 'insurance', 'repairs_maintenance',
  'fuel', 'airtime_internet', 'other'
);
CREATE TYPE income_type AS ENUM ('salary', 'dividend', 'freelance', 'export', 'other');
CREATE TYPE currency_code AS ENUM ('NGN', 'USD', 'EUR', 'GBP', 'other');
```

---

## Theme Specification

Apply exactly as follows in `src/app/globals.css`:

```css
/* [paste full theme CSS here — same as provided in user spec] */

/* OVERRIDE: Shadcn border width to 2px */
*,
*::before,
*::after {
  --tw-border-opacity: 1;
}
.border,
[class*="border-"] {
  border-width: 2px;
}

/* OVERRIDE: border radius to 0 */
:root {
  --radius: 0rem;
}
```

---

## Project Folder Structure

Follow this structure **exactly**. No deviations.

```
naija-expense-tracker/
├── docs/
│   └── prompt.md
├── schema/
│   ├── main.sql
│   ├── rls.sql
│   └── storage.sql
├── scripts/
│   ├── seed-mock-data.ts
│   └── test-tax-engine.ts
├── public/
│   ├── manifest.json
│   ├── icons/ (PWA icons at 192x192 and 512x512)
│   └── sw.js
├── src/
│   ├── app/
│   │   ├── actions/
│   │   │   ├── expense-actions.ts
│   │   │   ├── income-actions.ts
│   │   │   ├── profile-actions.ts
│   │   │   └── report-actions.ts
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── exchange-rates/route.ts
│   │   │   └── export/
│   │   │       ├── expenses/route.ts
│   │   │       ├── income/route.ts
│   │   │       └── tax-summary/route.ts
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   ├── income/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── login/page.tsx
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── StatsRow.tsx
│   │   │   ├── SpendByCategoryChart.tsx
│   │   │   ├── MonthlyTrendChart.tsx
│   │   │   ├── TaxLiabilityCard.tsx
│   │   │   ├── DeductiblesCard.tsx
│   │   │   ├── RecentExpenses.tsx
│   │   │   └── ExemptionStatusBanner.tsx
│   │   ├── ExpenseForm/
│   │   │   ├── index.tsx
│   │   │   ├── ExpenseFormFields.tsx
│   │   │   ├── ReceiptUploader.tsx
│   │   │   ├── OcrScanner.tsx
│   │   │   └── hooks/
│   │   │       ├── use-expense-form.ts
│   │   │       └── use-ocr.ts
│   │   ├── ExpensesList/
│   │   │   ├── index.tsx
│   │   │   ├── ExpensesTable.tsx
│   │   │   ├── ExpensesCards.tsx
│   │   │   ├── ExpenseFilters.tsx
│   │   │   ├── ExpenseRow.tsx
│   │   │   ├── ExpenseCard.tsx
│   │   │   └── ExpenseDetailModal.tsx
│   │   ├── IncomeForm/
│   │   │   ├── index.tsx
│   │   │   ├── IncomeFormFields.tsx
│   │   │   └── hooks/
│   │   │       └── use-income-form.ts
│   │   ├── IncomeList/
│   │   │   ├── index.tsx
│   │   │   ├── IncomeTable.tsx
│   │   │   ├── IncomeCards.tsx
│   │   │   └── IncomeFilters.tsx
│   │   ├── Reports/
│   │   │   ├── index.tsx
│   │   │   ├── ReportFilters.tsx
│   │   │   ├── TaxLiabilityBreakdownChart.tsx
│   │   │   ├── ProfitLossStatement.tsx
│   │   │   ├── TaxComputationTable.tsx
│   │   │   └── CategoryBreakdownTable.tsx
│   │   ├── ExportPanel/
│   │   │   └── index.tsx
│   │   ├── Settings/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── TaxSettingsForm.tsx
│   │   │   ├── CurrencySettings.tsx
│   │   │   └── DangerZone.tsx
│   │   ├── Onboarding/
│   │   │   ├── index.tsx
│   │   │   ├── StepBusinessProfile.tsx
│   │   │   ├── StepTaxPreferences.tsx
│   │   │   └── StepImportData.tsx
│   │   ├── Navigation/
│   │   │   └── index.tsx
│   │   ├── Logo/
│   │   │   └── index.tsx
│   │   ├── ThemeToggle/
│   │   │   └── index.tsx
│   │   └── Providers.tsx
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-expenses.ts
│   │   ├── use-income.ts
│   │   ├── use-exchange-rates.ts
│   │   ├── use-tax-liability.ts
│   │   └── use-dashboard-data.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── supabase.ts
│   │   ├── db.ts
│   │   ├── expense-service.ts
│   │   ├── income-service.ts
│   │   ├── storage-service.ts
│   │   ├── exchange-rate-service.ts
│   │   ├── tax-engine.ts
│   │   ├── tax-computation-service.ts
│   │   ├── export-service.ts
│   │   ├── normalise-error.ts
│   │   ├── api-response.ts
│   │   ├── format.ts
│   │   └── chart-theme.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── expense.ts
│   │   ├── income.ts
│   │   ├── tax.ts
│   │   └── actions.ts
│   └── middleware.ts
├── context.md
├── .agent/
│   ├── rules/rules.md
│   └── skills/
│       ├── recharts/
│       │   └── SKILL.md
│       ├── sonner-notifications/
│       │   └── SKILL.md
│       ├── api-structure/
│       │   └── SKILL.md
│       ├── supabase-schema/
│       │   └── SKILL.md
│       ├── tax-engine/
│       │   └── SKILL.md
│       ├── ocr-receipt/
│       │   └── SKILL.md
│       ├── currency-fx/
│       │   └── SKILL.md
│       ├── component-builder/
│       │   └── SKILL.md
│       ├── csv-export/
│       │   └── SKILL.md
│       ├── better-auth/
│       │   └── SKILL.md
│       └── pwa-setup/
│           └── SKILL.md
├── bun.lock
├── next.config.ts
├── next-env.d.ts
├── tsconfig.json
├── package.json
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EXCHANGE_RATE_API_KEY= # from exchangerate-api.com free tier
```

---

## Coding Standards

1. **TypeScript strict mode** — zero `any`, all types explicit
2. **Server Actions** for all mutations (no client-side fetch to API routes for data mutations)
3. **API Routes** only for: auth, file export (streaming), exchange rates
4. **Shadcn/ui** for all UI components — no custom primitives for things Shadcn covers
5. **No inline styles** — Tailwind utility classes only
6. **Component files** — PascalCase folder names, `index.tsx` default export, co-located hooks in `hooks/` subfolder
7. **Error handling** — every server action returns `ActionResult<T>` from `src/types/actions.ts`; all API routes use `apiOk()` / `apiError()` from `src/lib/api-response.ts`; see `.agent/skills/api-structure/SKILL.md`
8. **Notifications** — every user-facing action triggers a Sonner toast with the exact title and description defined in `.agent/skills/sonner-notifications/SKILL.md`
9. **Loading states** — every async operation has a corresponding loading state
10. **Mobile first** — design for 375px width first, then scale up

---

## Phase Confirmation Protocol

At the end of EVERY phase, output this exact block:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PHASE [N] COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
What was built: [brief summary]
Files created: [list]
Test checklist:
  □ [acceptance criterion 1]
  □ [acceptance criterion 2]
  ...

⏸️  AWAITING CONFIRMATION — Reply "proceed" to begin Phase [N+1]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do NOT continue past this block until the user responds.
