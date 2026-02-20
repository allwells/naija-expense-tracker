"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail } from "@/types/actions";
import type { ActionResult } from "@/types/actions";
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/expense-service";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/lib/schemas/expense";
import { uploadReceipt, deleteReceipt } from "@/lib/storage-service";
import { ensureProfile } from "@/lib/profile-service";
import { AUTH_ERRORS, EXPENSE_ERRORS } from "@/types/errors";
import { revalidatePath } from "next/cache";
import type { ExpenseRecord } from "@/types/expense";
import type { PaginatedExpenses, ExpenseFilters } from "@/types/expense";

// ----------------------------------------------------------------
// getExpensesAction
// ----------------------------------------------------------------

export async function getExpensesAction(
  filters: ExpenseFilters = {},
  page = 1,
): Promise<ActionResult<PaginatedExpenses>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    const result = await getExpenses(session.user.id, filters, page);
    return ok(result);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : EXPENSE_ERRORS.CREATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// getExpenseByIdAction
// ----------------------------------------------------------------

export async function getExpenseByIdAction(
  expenseId: string,
): Promise<ActionResult<ExpenseRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    const expense = await getExpenseById(session.user.id, expenseId);
    if (!expense) return fail(EXPENSE_ERRORS.NOT_FOUND);
    return ok(expense);
  } catch (err) {
    const msg = err instanceof Error ? err.message : EXPENSE_ERRORS.NOT_FOUND;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// createExpenseAction — accepts a FormData payload so files can
// be included (receipt upload happens server-side here)
// ----------------------------------------------------------------

export async function createExpenseAction(
  formData: FormData,
): Promise<ActionResult<ExpenseRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    await ensureProfile(session.user.id, session.user.name);
  } catch (profileError) {
    console.error("Profile check failed:", profileError);
    // Proceed anyway? No, FK will likely fail.
    // If ensureProfile failed (e.g. invalid name), we should probably stop?
    // But maybe let createExpense try and fail naturally if DB issue.
    // I'll log and continue or return fail?
    // Returning fail is safer.
    return fail("Could not verify user profile. Please try again.");
  }

  // Parse JSON fields
  const rawFields = formData.get("fields");
  if (!rawFields || typeof rawFields !== "string") {
    return fail("Invalid form submission.");
  }

  let parsed;
  try {
    parsed = createExpenseSchema.safeParse(JSON.parse(rawFields));
  } catch {
    return fail("Invalid form data.");
  }

  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  let receiptUrl: string | undefined;
  let receiptFilename: string | undefined;
  let receiptStoragePath: string | undefined;

  const receiptFile = formData.get("receipt");

  try {
    if (receiptFile instanceof File && receiptFile.size > 0) {
      // Generate a temp ID for the path; will be updated after insert if needed
      const tempId = crypto.randomUUID();
      const uploaded = await uploadReceipt(
        session.user.id,
        tempId,
        receiptFile,
      );
      receiptUrl = uploaded.url;
      receiptFilename = uploaded.filename;
      receiptStoragePath = uploaded.storagePath;
    }

    const expense = await createExpense({
      ...parsed.data,
      user_id: session.user.id,
      original_amount: parsed.data.original_amount ?? null,
      ocr_amount: parsed.data.ocr_amount ?? null,
      ocr_date: parsed.data.ocr_date ?? null,
      receipt_url: receiptUrl ?? null,
      receipt_filename: receiptFilename ?? null,
      receipt_storage_path: receiptStoragePath ?? null,
      notes: parsed.data.notes ?? null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return ok(expense);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : EXPENSE_ERRORS.CREATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// updateExpenseAction — also FormData to allow receipt replacement
// ----------------------------------------------------------------

export async function updateExpenseAction(
  formData: FormData,
): Promise<ActionResult<ExpenseRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const rawFields = formData.get("fields");
  if (!rawFields || typeof rawFields !== "string") {
    return fail("Invalid form submission.");
  }

  let parsed;
  try {
    parsed = updateExpenseSchema.safeParse(JSON.parse(rawFields));
  } catch {
    return fail("Invalid form data.");
  }

  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  const { id, ...update } = parsed.data;

  let receiptUrl: string | undefined = update.receipt_url ?? undefined;
  let receiptFilename: string | undefined =
    update.receipt_filename ?? undefined;
  let receiptStoragePath: string | undefined =
    update.receipt_storage_path ?? undefined;

  const receiptFile = formData.get("receipt");

  try {
    if (receiptFile instanceof File && receiptFile.size > 0) {
      // Delete old receipt if it exists
      if (receiptStoragePath) {
        await deleteReceipt(receiptStoragePath).catch(() => undefined);
      }
      const uploaded = await uploadReceipt(session.user.id, id, receiptFile);
      receiptUrl = uploaded.url;
      receiptFilename = uploaded.filename;
      receiptStoragePath = uploaded.storagePath;
    }

    const expense = await updateExpense(session.user.id, id, {
      ...update,
      receipt_url: receiptUrl ?? null,
      receipt_filename: receiptFilename ?? null,
      receipt_storage_path: receiptStoragePath ?? null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return ok(expense);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : EXPENSE_ERRORS.UPDATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// deleteExpenseAction
// ----------------------------------------------------------------

export async function deleteExpenseAction(
  expenseId: string,
): Promise<ActionResult<void>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    // Fetch expense to get receipt path for cleanup
    const expense = await getExpenseById(session.user.id, expenseId);
    if (expense?.receipt_storage_path) {
      await deleteReceipt(expense.receipt_storage_path).catch(() => undefined);
    }

    await deleteExpense(session.user.id, expenseId);
    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    return ok(undefined);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : EXPENSE_ERRORS.DELETE_FAILED;
    return fail(msg);
  }
}
