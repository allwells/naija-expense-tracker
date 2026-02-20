import type { ExpenseRow, ExpenseCategory, ExpenseTag } from "./database";

// A fully-hydrated expense record (same shape as DB row — aliased for clarity)
export type ExpenseRecord = ExpenseRow;

// ----------------------------------------------------------------
// Filter options for expense queries
// ----------------------------------------------------------------

export interface ExpenseFilters {
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  category?: ExpenseCategory;
  tag?: ExpenseTag;
  currency?: string;
}

// ----------------------------------------------------------------
// Paginated result
// ----------------------------------------------------------------

export interface PaginatedExpenses {
  expenses: ExpenseRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ----------------------------------------------------------------
// Create / Update input types (validated by Zod schemas)
// ----------------------------------------------------------------

export interface CreateExpenseInput {
  date: string;
  amount_ngn: number;
  original_amount?: number;
  original_currency: string;
  exchange_rate: number;
  category: ExpenseCategory;
  description: string;
  tag: ExpenseTag;
  notes?: string;
  receipt_url?: string;
  receipt_filename?: string;
  receipt_storage_path?: string;
  ocr_extracted?: boolean;
  ocr_amount?: number;
  ocr_date?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string;
}

// ----------------------------------------------------------------
// Display helpers
// ----------------------------------------------------------------

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  office_supplies: "Office Supplies",
  travel: "Travel",
  meals_entertainment: "Meals & Entertainment",
  software_subscriptions: "Software & Subscriptions",
  equipment: "Equipment",
  rent: "Rent",
  utilities: "Utilities",
  salaries: "Salaries",
  marketing: "Marketing",
  professional_services: "Professional Services",
  bank_charges: "Bank Charges",
  insurance: "Insurance",
  repairs_maintenance: "Repairs & Maintenance",
  fuel: "Fuel",
  airtime_internet: "Airtime & Internet",
  loan_repayment: "Loan Repayment",
  gift: "Gift",
  groceries: "Groceries",
  reimbursement: "Reimbursement",
  transport: "Transport",
  education: "Education",
  healthcare: "Healthcare",
  personal_care: "Personal Care",
  clothing: "Clothing",
  household: "Household",
  charity: "Charity / Tithe",
  taxes_levies: "Taxes & Levies",
  entertainment: "Entertainment",
  savings_investment: "Savings & Investment",
  other: "Other",
};

export const EXPENSE_TAG_LABELS: Record<ExpenseTag, string> = {
  deductible: "Deductible",
  capital: "Capital",
  personal: "Personal",
  business: "Business",
};
