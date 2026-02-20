"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail } from "@/types/actions";
import type { ActionResult } from "@/types/actions";
import {
  getIncome,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
} from "@/lib/income-service";
import { createIncomeSchema, updateIncomeSchema } from "@/lib/schemas/income";
import { AUTH_ERRORS, INCOME_ERRORS } from "@/types/errors";
import { revalidatePath } from "next/cache";
import type {
  IncomeRecord,
  IncomeFilters,
  PaginatedIncome,
} from "@/types/income";

// ----------------------------------------------------------------
// getIncomeAction
// ----------------------------------------------------------------

export async function getIncomeAction(
  filters: IncomeFilters = {},
  page = 1,
): Promise<ActionResult<PaginatedIncome>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    const result = await getIncome(session.user.id, filters, page);
    return ok(result);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : INCOME_ERRORS.CREATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// getIncomeByIdAction
// ----------------------------------------------------------------

export async function getIncomeByIdAction(
  incomeId: string,
): Promise<ActionResult<IncomeRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    const record = await getIncomeById(session.user.id, incomeId);
    if (!record) return fail(INCOME_ERRORS.NOT_FOUND);
    return ok(record);
  } catch (err) {
    const msg = err instanceof Error ? err.message : INCOME_ERRORS.NOT_FOUND;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// createIncomeAction
// ----------------------------------------------------------------

export async function createIncomeAction(
  input: unknown,
): Promise<ActionResult<IncomeRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const parsed = createIncomeSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  try {
    const record = await createIncome({
      ...parsed.data,
      user_id: session.user.id,
      original_amount: parsed.data.original_amount ?? null,
      description: parsed.data.description ?? null,
    });

    revalidatePath("/dashboard");
    revalidatePath("/income");
    return ok(record);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : INCOME_ERRORS.CREATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// updateIncomeAction
// ----------------------------------------------------------------

export async function updateIncomeAction(
  input: unknown,
): Promise<ActionResult<IncomeRecord>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  const parsed = updateIncomeSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  const { id, ...update } = parsed.data;

  try {
    const record = await updateIncome(session.user.id, id, update);
    revalidatePath("/dashboard");
    revalidatePath("/income");
    return ok(record);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : INCOME_ERRORS.UPDATE_FAILED;
    return fail(msg);
  }
}

// ----------------------------------------------------------------
// deleteIncomeAction
// ----------------------------------------------------------------

export async function deleteIncomeAction(
  incomeId: string,
): Promise<ActionResult<void>> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail(AUTH_ERRORS.UNAUTHENTICATED);

  try {
    await deleteIncome(session.user.id, incomeId);
    revalidatePath("/dashboard");
    revalidatePath("/income");
    return ok(undefined);
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : INCOME_ERRORS.DELETE_FAILED;
    return fail(msg);
  }
}
