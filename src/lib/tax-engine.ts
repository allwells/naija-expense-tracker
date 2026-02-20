/**
 * Nigeria 2026 Tax Reform Act — Computation Engine
 *
 * PURE MODULE: no Supabase, no API calls, no side effects.
 * All monetary values are in NGN (Naira) as `number`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TAX_CONSTANTS = {
  CIT_EXEMPTION_TURNOVER: 100_000_000, // ₦100,000,000
  CIT_EXEMPTION_FIXED_ASSETS: 250_000_000, // ₦250,000,000
  CIT_RATE: 0.3, // 30%
  DEVELOPMENT_LEVY_RATE: 0.04, // 4%
  CGT_RATE: 0.1, // 10%
  DIVIDEND_WITHHOLDING_RATE: 0.1, // 10%
  RENT_RELIEF_RATE: 0.2, // 20% of annual rent
  RENT_RELIEF_CAP: 500_000, // ₦500,000 maximum
  DEFAULT_PENSION_RATE: 0.08, // 8% employee contribution
  DEFAULT_NHF_RATE: 0.025, // 2.5%
} as const;

// ---------------------------------------------------------------------------
// PIT Brackets — 2026 Reform
// ---------------------------------------------------------------------------

export const PIT_BRACKETS: ReadonlyArray<{
  readonly min: number;
  readonly max: number;
  readonly rate: number;
}> = [
  { min: 0, max: 800_000, rate: 0 },
  { min: 800_000, max: 2_000_000, rate: 0.15 },
  { min: 2_000_000, max: 4_000_000, rate: 0.19 },
  { min: 4_000_000, max: 6_000_000, rate: 0.21 },
  { min: 6_000_000, max: 10_000_000, rate: 0.23 },
  { min: 10_000_000, max: Infinity, rate: 0.25 },
];

// ---------------------------------------------------------------------------
// Deductibility rates by expense category
// ---------------------------------------------------------------------------

export const DEDUCTIBILITY: Record<string, number> = {
  office_supplies: 1.0,
  travel: 1.0,
  meals_entertainment: 0.5, // 50% deductible
  software_subscriptions: 1.0,
  equipment: 0, // capital allowance — not immediately deductible
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

// ---------------------------------------------------------------------------
// Result Types
// ---------------------------------------------------------------------------

export interface CITResult {
  exempt: boolean;
  taxableProfit: number;
  cit: number;
  developmentLevy: number;
  total: number;
  /** Human-readable explanation of exemption or liability */
  reason: string;
}

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

export interface FullTaxLiabilityResult {
  taxYear: number;
  isSmallBusinessExempt: boolean;
  taxableProfit: TaxableProfitResult;
  cit: CITResult;
  pit: PITResult | null; // null if no salary income
  cgt: number; // 0 if export income (exempt)
  dividendTax: number;
  totalTaxPayable: number;
  effectiveTaxRate: number; // totalTaxPayable / totalIncome
}

// ---------------------------------------------------------------------------
// CIT Functions
// ---------------------------------------------------------------------------

/**
 * Returns true when the business qualifies for the small-business CIT exemption.
 * Both conditions must hold simultaneously.
 */
export function isSmallBusinessExempt(
  annualTurnover: number,
  fixedAssets: number,
): boolean {
  return (
    annualTurnover <= TAX_CONSTANTS.CIT_EXEMPTION_TURNOVER &&
    fixedAssets <= TAX_CONSTANTS.CIT_EXEMPTION_FIXED_ASSETS
  );
}

/**
 * Computes Company Income Tax (CIT) and Development Levy.
 * Returns zero liability when the small-business exemption applies.
 */
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

// ---------------------------------------------------------------------------
// PIT Functions
// ---------------------------------------------------------------------------

/**
 * Computes Personal Income Tax using the 2026 progressive bracket schedule.
 * Applies pension, NHF, and rent relief deductions before bracketising.
 */
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

    const bracketWidth =
      bracket.max === Infinity ? remaining : bracket.max - bracket.min;

    const taxableInBracket = Math.min(remaining, bracketWidth);
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

// ---------------------------------------------------------------------------
// Deductibility
// ---------------------------------------------------------------------------

/**
 * Returns the deductible portion of an expense given its category and tag.
 * - `personal` tag → always ₦0 (non-business)
 * - `equipment` → ₦0 (capital; claimed via capital allowance, not immediate deduction)
 * - `meals_entertainment` → 50%
 * - All other business categories → 100%
 */
export function computeDeductibleAmount(
  amount: number,
  category: string,
  tag: string,
): number {
  if (tag === "personal") return 0;
  const rate = DEDUCTIBILITY[category] ?? 1.0;
  return amount * rate;
}

// ---------------------------------------------------------------------------
// Taxable Profit (Business)
// ---------------------------------------------------------------------------

/**
 * Aggregates all income deductions to arrive at taxable profit.
 * Used as the input to `computeCIT`.
 */
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

// ---------------------------------------------------------------------------
// CGT Helper
// ---------------------------------------------------------------------------

/**
 * Returns CGT payable on a capital gain.
 * Export income is CGT-exempt under the 2026 Reform Act.
 */
export function computeCGT(
  capitalGain: number,
  isExportIncome: boolean,
): number {
  if (isExportIncome) return 0;
  return capitalGain * TAX_CONSTANTS.CGT_RATE;
}

// ---------------------------------------------------------------------------
// Dividend Withholding Tax Helper
// ---------------------------------------------------------------------------

/**
 * Returns dividend withholding tax at 10%.
 */
export function computeDividendTax(dividendAmount: number): number {
  return dividendAmount * TAX_CONSTANTS.DIVIDEND_WITHHOLDING_RATE;
}
