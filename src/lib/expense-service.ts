import { createServiceClient } from "@/lib/supabase";
import { normaliseSupabaseError } from "@/lib/normalise-error";
import type {
  ExpenseRow,
  ExpenseInsert,
  ExpenseUpdate,
} from "@/types/database";
import type { ExpenseFilters, PaginatedExpenses } from "@/types/expense";

const PAGE_SIZE = 20;

// ----------------------------------------------------------------
// getExpenses — paginated list with filters (server-side only)
// ----------------------------------------------------------------

export async function getExpenses(
  userId: string,
  filters: ExpenseFilters = {},
  page = 1,
): Promise<PaginatedExpenses> {
  const supabase = createServiceClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.startDate) query = query.gte("date", filters.startDate);
  if (filters.endDate) query = query.lte("date", filters.endDate);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.tag) query = query.eq("tag", filters.tag);
  if (filters.currency) query = query.eq("original_currency", filters.currency);

  const { data, error, count } = await query;

  if (error) throw new Error(normaliseSupabaseError(error));

  const total = count ?? 0;
  return {
    expenses: (data ?? []) as ExpenseRow[],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ----------------------------------------------------------------
// getExpenseById
// ----------------------------------------------------------------

export async function getExpenseById(
  userId: string,
  expenseId: string,
): Promise<ExpenseRow | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(normaliseSupabaseError(error));
  }

  return data as ExpenseRow;
}

// ----------------------------------------------------------------
// getExpensesForExport — no pagination, used for CSV export
// ----------------------------------------------------------------

export async function getExpensesForExport(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<ExpenseRow[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw new Error(normaliseSupabaseError(error));
  return (data ?? []) as ExpenseRow[];
}

// ----------------------------------------------------------------
// getExpenseSummaryByCategory — aggregated totals for dashboard
// ----------------------------------------------------------------

export async function getExpenseSummaryByCategory(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Array<{ category: string; total: number }>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount_ngn")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw new Error(normaliseSupabaseError(error));

  const summary: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.category as string;
    summary[key] = (summary[key] ?? 0) + (row.amount_ngn as number);
  }

  return Object.entries(summary)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

// ----------------------------------------------------------------
// createExpense
// ----------------------------------------------------------------

export async function createExpense(input: ExpenseInsert): Promise<ExpenseRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(normaliseSupabaseError(error));
  return data as ExpenseRow;
}

// ----------------------------------------------------------------
// updateExpense
// ----------------------------------------------------------------

export async function updateExpense(
  userId: string,
  expenseId: string,
  update: ExpenseUpdate,
): Promise<ExpenseRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("expenses")
    .update(update)
    .eq("id", expenseId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(normaliseSupabaseError(error));
  return data as ExpenseRow;
}

// ----------------------------------------------------------------
// deleteExpense
// ----------------------------------------------------------------

export async function deleteExpense(
  userId: string,
  expenseId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId);

  if (error) throw new Error(normaliseSupabaseError(error));
}
