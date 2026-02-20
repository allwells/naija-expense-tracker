import type { IncomeRow, IncomeType } from "./database";

// A fully-hydrated income record (same shape as DB row — aliased for clarity)
export type IncomeRecord = IncomeRow;

// ----------------------------------------------------------------
// Filter options for income queries
// ----------------------------------------------------------------

export interface IncomeFilters {
  startDate?: string;
  endDate?: string;
  incomeType?: IncomeType;
  isExportIncome?: boolean;
  currency?: string;
}

// ----------------------------------------------------------------
// Paginated result
// ----------------------------------------------------------------

export interface PaginatedIncome {
  income: IncomeRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ----------------------------------------------------------------
// Create / Update input types
// ----------------------------------------------------------------

export interface CreateIncomeInput {
  date: string;
  amount_ngn: number;
  original_amount?: number;
  original_currency: string;
  exchange_rate: number;
  source: string;
  income_type: IncomeType;
  description?: string;
  is_export_income: boolean;
}

export interface UpdateIncomeInput extends Partial<CreateIncomeInput> {
  id: string;
}

// ----------------------------------------------------------------
// Display helpers
// ----------------------------------------------------------------

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: "Salary",
  dividend: "Dividend",
  freelance: "Freelance",
  export: "Export Income",
  other: "Other",
};
