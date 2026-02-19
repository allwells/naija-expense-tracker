---
name: tax-engine
description: Nigeria 2026 Tax Reform Act computation engine. Use when implementing or referencing CIT exemption logic (₦100M turnover / ₦250M fixed assets threshold), PIT progressive brackets (₦800k tax-free threshold), CGT, Development Levy, rent relief, pension/NHF deductions, deductible expense categorisation, or the full taxable profit calculation. This skill contains exact TypeScript implementations, named constants, and unit test coverage requirements.
---

# SKILL: Nigeria 2026 Tax Engine

## Purpose

Complete reference for implementing Nigeria's 2026 Tax Reform Act logic. This is the most critical module in the app — errors here affect real money.

## Golden Rule

The tax engine (`src/lib/tax-engine.ts`) is a PURE module:

- No Supabase imports
- No API calls
- No side effects
- Only inputs → computed outputs
- Fully unit testable in isolation

---

## Company Income Tax (CIT)

### Thresholds (Named Constants)

```typescript
export const TAX_CONSTANTS = {
  CIT_EXEMPTION_TURNOVER: 100_000_000, // ₦100,000,000
  CIT_EXEMPTION_FIXED_ASSETS: 250_000_000, // ₦250,000,000
  CIT_RATE: 0.3, // 30%
  DEVELOPMENT_LEVY_RATE: 0.04, // 4%
  CGT_RATE: 0.1, // 10%
  DIVIDEND_WITHHOLDING_RATE: 0.1, // 10%
  RENT_RELIEF_RATE: 0.2, // 20% of rent
  RENT_RELIEF_CAP: 500_000, // ₦500,000 max
  DEFAULT_PENSION_RATE: 0.08, // 8% employee
  DEFAULT_NHF_RATE: 0.025, // 2.5%
} as const;
```

### Exemption Check

```typescript
export function isSmallBusinessExempt(
  annualTurnover: number,
  fixedAssets: number,
): boolean {
  return (
    annualTurnover <= TAX_CONSTANTS.CIT_EXEMPTION_TURNOVER &&
    fixedAssets <= TAX_CONSTANTS.CIT_EXEMPTION_FIXED_ASSETS
  );
}
```

### CIT Computation

```typescript
export interface CITResult {
  exempt: boolean;
  taxableProfit: number;
  cit: number;
  developmentLevy: number;
  total: number;
  reason: string; // human-readable exemption/liability reason
}

export function computeCIT(
  taxableProfit: number,
  annualTurnover: number,
  fixedAssets: number,
): CITResult {
  const exempt = isSmallBusinessExempt(annualTurnover, fixedAssets);
  if (exempt) {
    return {
      exempt: true,
      taxableProfit,
      cit: 0,
      developmentLevy: 0,
      total: 0,
      reason: `Turnover ₦${annualTurnover.toLocaleString()} ≤ ₦100M and Fixed Assets ₦${fixedAssets.toLocaleString()} ≤ ₦250M — exempt under 2026 Tax Reform Act`,
    };
  }
  const cit = taxableProfit * TAX_CONSTANTS.CIT_RATE;
  const developmentLevy = taxableProfit * TAX_CONSTANTS.DEVELOPMENT_LEVY_RATE;
  return {
    exempt: false,
    taxableProfit,
    cit,
    developmentLevy,
    total: cit + developmentLevy,
    reason: `Exceeds small business threshold — CIT @ 30% + Development Levy @ 4%`,
  };
}
```

---

## Personal Income Tax (PIT)

### 2026 Brackets

```typescript
export const PIT_BRACKETS = [
  { min: 0, max: 800_000, rate: 0 },
  { min: 800_001, max: 2_000_000, rate: 0.15 },
  { min: 2_000_001, max: 4_000_000, rate: 0.19 },
  { min: 4_000_001, max: 6_000_000, rate: 0.21 },
  { min: 6_000_001, max: 10_000_000, rate: 0.23 },
  { min: 10_000_001, max: Infinity, rate: 0.25 },
] as const;

export interface PITBracketBreakdown {
  bracket: string;
  taxableAmount: number;
  rate: number;
  tax: number;
}

export interface PITResult {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  bracketBreakdown: PITBracketBreakdown[];
  totalPIT: number;
}

export function computePIT(
  grossSalary: number,
  pensionContribution: number,
  nhfContribution: number,
  annualRent: number,
): PITResult {
  const rentRelief = Math.min(
    annualRent * TAX_CONSTANTS.RENT_RELIEF_RATE,
    TAX_CONSTANTS.RENT_RELIEF_CAP,
  );
  const totalDeductions = pensionContribution + nhfContribution + rentRelief;
  const taxableIncome = Math.max(0, grossSalary - totalDeductions);

  const bracketBreakdown: PITBracketBreakdown[] = [];
  let remaining = taxableIncome;
  let totalPIT = 0;

  for (const bracket of PIT_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize =
      bracket.max === Infinity
        ? remaining
        : Math.min(remaining, bracket.max - bracket.min + 1);
    const taxableInBracket = Math.min(remaining, bracketSize);
    const tax = taxableInBracket * bracket.rate;

    if (taxableInBracket > 0) {
      bracketBreakdown.push({
        bracket:
          bracket.max === Infinity
            ? `Above ₦${bracket.min.toLocaleString()}`
            : `₦${bracket.min.toLocaleString()} – ₦${bracket.max.toLocaleString()}`,
        taxableAmount: taxableInBracket,
        rate: bracket.rate,
        tax,
      });
    }

    totalPIT += tax;
    remaining -= taxableInBracket;
  }

  return {
    grossIncome: grossSalary,
    totalDeductions,
    taxableIncome,
    bracketBreakdown,
    totalPIT,
  };
}
```

---

## Deductible Expense Computation

```typescript
export const DEDUCTIBILITY: Record<string, number> = {
  office_supplies: 1.0,
  travel: 1.0,
  meals_entertainment: 0.5, // 50% deductible
  software_subscriptions: 1.0,
  equipment: 0, // capital allowance — not immediate
  rent: 1.0, // if tagged 'business'
  utilities: 1.0,
  salaries: 1.0,
  marketing: 1.0,
  professional_services: 1.0,
  bank_charges: 1.0,
  insurance: 1.0,
  repairs_maintenance: 1.0,
  fuel: 1.0,
  airtime_internet: 1.0,
  other: 1.0,
};

export function computeDeductibleAmount(
  amount: number,
  category: string,
  tag: string,
): number {
  if (tag === "personal") return 0;
  const rate = DEDUCTIBILITY[category] ?? 1.0;
  return amount * rate;
}
```

---

## Taxable Profit (Business)

```typescript
export interface TaxableProfitResult {
  totalIncome: number;
  totalDeductibleExpenses: number;
  pensionDeduction: number;
  nhfDeduction: number;
  rentRelief: number;
  totalDeductions: number;
  taxableProfit: number;
  itemizedDeductions: Array<{ label: string; amount: number }>;
}

export function computeTaxableProfit(
  totalIncome: number,
  expensesByCategory: Record<string, { total: number; tag: string }>,
  annualRent: number,
  grossSalary: number,
  pensionRate: number,
  nhfRate: number,
): TaxableProfitResult {
  let totalDeductibleExpenses = 0;
  const itemizedDeductions: Array<{ label: string; amount: number }> = [];

  for (const [category, { total, tag }] of Object.entries(expensesByCategory)) {
    const deductible = computeDeductibleAmount(total, category, tag);
    if (deductible > 0) {
      totalDeductibleExpenses += deductible;
      itemizedDeductions.push({ label: category, amount: deductible });
    }
  }

  const pensionDeduction = grossSalary * pensionRate;
  const nhfDeduction = grossSalary * nhfRate;
  const rentRelief = Math.min(
    annualRent * TAX_CONSTANTS.RENT_RELIEF_RATE,
    TAX_CONSTANTS.RENT_RELIEF_CAP,
  );

  const totalDeductions =
    totalDeductibleExpenses + pensionDeduction + nhfDeduction + rentRelief;
  const taxableProfit = Math.max(0, totalIncome - totalDeductions);

  return {
    totalIncome,
    totalDeductibleExpenses,
    pensionDeduction,
    nhfDeduction,
    rentRelief,
    totalDeductions,
    taxableProfit,
    itemizedDeductions,
  };
}
```

---

## Full Tax Liability Result Type

```typescript
export interface FullTaxLiabilityResult {
  taxYear: number;
  isSmallBusinessExempt: boolean;
  taxableProfit: TaxableProfitResult;
  cit: CITResult;
  pit: PITResult | null; // null if no salary income
  cgt: number; // 0 if exempt
  dividendTax: number;
  totalTaxPayable: number;
  effectiveTaxRate: number; // totalTax / totalIncome
}
```

---

## Unit Test Coverage Required

Every function must have tests covering:

- CIT: exactly at ₦100M threshold (exempt), ₦100M + ₦1 (not exempt)
- CIT: exactly at ₦250M fixed assets (exempt), ₦250M + ₦1 (not exempt)
- PIT: each bracket boundary value
- PIT: rent relief at exactly ₦500k cap
- PIT: rent relief below cap (e.g., 20% of ₦1M rent = ₦200k, not capped)
- Deductibility: meals_entertainment at 50%
- Deductibility: personal tag returns 0
- Export income: CGT = 0
