import { createServiceClient } from "@/lib/supabase";
import { normaliseSupabaseError } from "@/lib/normalise-error";
import type { IncomeRow, IncomeInsert, IncomeUpdate } from "@/types/database";
import type { IncomeFilters, PaginatedIncome } from "@/types/income";

const PAGE_SIZE = 20;

// ----------------------------------------------------------------
// getIncome — paginated list with filters
// ----------------------------------------------------------------

export async function getIncome(
  userId: string,
  filters: IncomeFilters = {},
  page = 1,
): Promise<PaginatedIncome> {
  const supabase = createServiceClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("income")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.startDate) query = query.gte("date", filters.startDate);
  if (filters.endDate) query = query.lte("date", filters.endDate);
  if (filters.incomeType) query = query.eq("income_type", filters.incomeType);
  if (filters.isExportIncome !== undefined)
    query = query.eq("is_export_income", filters.isExportIncome);
  if (filters.currency) query = query.eq("original_currency", filters.currency);

  const { data, error, count } = await query;

  if (error) throw new Error(normaliseSupabaseError(error));

  const total = count ?? 0;
  return {
    income: (data ?? []) as IncomeRow[],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ----------------------------------------------------------------
// getIncomeById
// ----------------------------------------------------------------

export async function getIncomeById(
  userId: string,
  incomeId: string,
): Promise<IncomeRow | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("income")
    .select("*")
    .eq("id", incomeId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(normaliseSupabaseError(error));
  }

  return data as IncomeRow;
}

// ----------------------------------------------------------------
// getIncomeForExport — no pagination, used for CSV export
// ----------------------------------------------------------------

export async function getIncomeForExport(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<IncomeRow[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("income")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw new Error(normaliseSupabaseError(error));
  return (data ?? []) as IncomeRow[];
}

// ----------------------------------------------------------------
// createIncome
// ----------------------------------------------------------------

export async function createIncome(input: IncomeInsert): Promise<IncomeRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("income")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(normaliseSupabaseError(error));
  return data as IncomeRow;
}

// ----------------------------------------------------------------
// updateIncome
// ----------------------------------------------------------------

export async function updateIncome(
  userId: string,
  incomeId: string,
  update: IncomeUpdate,
): Promise<IncomeRow> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("income")
    .update(update)
    .eq("id", incomeId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(normaliseSupabaseError(error));
  return data as IncomeRow;
}

// ----------------------------------------------------------------
// deleteIncome
// ----------------------------------------------------------------

export async function deleteIncome(
  userId: string,
  incomeId: string,
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("income")
    .delete()
    .eq("id", incomeId)
    .eq("user_id", userId);

  if (error) throw new Error(normaliseSupabaseError(error));
}
