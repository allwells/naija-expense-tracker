// Tax computation types — used by tax-engine.ts and tax-computation-service.ts

// ----------------------------------------------------------------
// CIT
// ----------------------------------------------------------------

export interface CITResult {
  exempt: boolean;
  cit: number;
  developmentLevy: number;
  total: number;
}

// ----------------------------------------------------------------
// PIT
// ----------------------------------------------------------------

export interface PITBracket {
  from: number;
  to: number | null; // null = no upper bound
  rate: number;
  taxInBracket: number;
}

export interface PITResult {
  grossIncome: number;
  taxableIncome: number;
  rentRelief: number;
  pensionDeduction: number;
  nhfDeduction: number;
  totalDeductions: number;
  brackets: PITBracket[];
  totalTax: number;
}

// ----------------------------------------------------------------
// CGT
// ----------------------------------------------------------------

export interface CGTResult {
  exempt: boolean;
  exemptionReason: "small_business" | "export_income" | null;
  capitalGains: number;
  cgt: number;
}

// ----------------------------------------------------------------
// Dividend Tax
// ----------------------------------------------------------------

export interface DividendTaxResult {
  grossDividends: number;
  exempt: boolean;
  withholdingTax: number;
}

// ----------------------------------------------------------------
// Full tax liability
// ----------------------------------------------------------------

export interface TaxLiabilityResult {
  taxYear: number;

  // Income summary
  totalIncome: number;
  businessIncome: number;
  salaryIncome: number;
  dividendIncome: number;
  exportIncome: number;

  // Expense deductions
  totalDeductibleExpenses: number;
  fullyDeductibleAmount: number;
  partiallyDeductibleAmount: number; // 50% of meals_entertainment
  capitalAllowances: number; // equipment — for reference only

  // Personal deductions
  rentRelief: number;
  pensionDeduction: number;
  nhfDeduction: number;

  // Taxable profit / income
  taxableProfit: number; // for CIT
  taxableIncome: number; // for PIT

  // Tax components
  cit: CITResult;
  pit: PITResult;
  cgt: CGTResult;
  dividendTax: DividendTaxResult;

  // Summary
  totalTaxPayable: number;
  effectiveTaxRate: number; // percentage

  // Exemption status for UI
  isSmallBusinessExempt: boolean;
  annualTurnover: number;
  fixedAssets: number;
}

// ----------------------------------------------------------------
// Computation input (passed to tax engine)
// ----------------------------------------------------------------

export interface TaxComputationInput {
  taxYear: number;

  // Business profile
  annualTurnover: number;
  fixedAssets: number;
  monthlyRent: number;
  pensionRate: number; // e.g. 0.08
  nhfRate: number; // e.g. 0.025

  // Income entries
  incomeEntries: Array<{
    amount_ngn: number;
    income_type: string;
    is_export_income: boolean;
  }>;

  // Expense entries
  expenseEntries: Array<{
    amount_ngn: number;
    category: string;
    tag: string;
  }>;
}
