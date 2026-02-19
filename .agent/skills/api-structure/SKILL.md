---
name: api-structure
description: API route structure, response shapes, and error message standards for NaijaExpense. Use when creating or modifying any file inside src/app/api/, writing server actions in src/app/actions/, defining typed response interfaces, handling errors from Supabase/better-auth/external APIs, or deciding what error messages to surface to the frontend. Contains the full response envelope spec, HTTP status code usage, server action return type pattern, Supabase error normalisation, and the complete error message catalogue.
---

# SKILL: API Structure & Response Standards

## Guiding Principle

**Server Actions** handle all data mutations (create, update, delete). **API Routes** exist only for: auth callbacks, streaming file exports, and the exchange rate proxy. This distinction is non-negotiable — see `rules.md`.

---

## Server Action Response Contract

Every server action returns the same typed envelope. No exceptions.

```typescript
// src/types/actions.ts
export interface ActionResult<T = void> {
  data: T | null;
  error: string | null;
}

// Convenience constructors
export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail(error: string): ActionResult<never> {
  return { data: null, error };
}
```

### Template for Every Server Action

```typescript
"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, ActionResult } from "@/types/actions";

export async function createExpense(
  input: CreateExpenseInput,
): Promise<ActionResult<ExpenseRecord>> {
  // 1. Auth guard — always first
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("You must be signed in to perform this action.");

  // 2. Input validation
  const parsed = createExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      parsed.error.errors[0]?.message ??
        "Invalid input. Please check your form.",
    );
  }

  // 3. Business logic / DB call
  try {
    const { data, error } = await supabase
      .from("expenses")
      .insert({ ...parsed.data, user_id: session.user.id })
      .select()
      .single();

    if (error) return fail(normaliseSupabaseError(error));
    return ok(data);
  } catch {
    return fail("An unexpected error occurred. Please try again.");
  }
}
```

### Consuming a Server Action in a Component

```typescript
const result = await createExpense(formData);

if (result.error) {
  toast.error("Expense not saved", { description: result.error });
  return;
}

toast.success("Expense recorded", {
  description: `₦${formatNGN(result.data.amount_ngn)} added.`,
});
```

---

## API Route Response Contract

API routes use a consistent JSON envelope and standard HTTP status codes.

```typescript
// Success
{ "data": <payload>, "error": null }

// Error
{ "data": null, "error": "<human-readable message>" }
```

### Response Helpers

```typescript
// src/lib/api-response.ts
import { NextResponse } from "next/server";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ data: null, error: message }, { status });
}
```

### Usage in Route Handlers

```typescript
// src/app/api/exchange-rates/route.ts
export async function GET() {
  try {
    const rates = await getAllRates();
    return apiOk(rates);
  } catch {
    return apiError("Exchange rates are temporarily unavailable.", 503);
  }
}
```

---

## HTTP Status Code Reference

| Status | When to Use                                                   |
| ------ | ------------------------------------------------------------- |
| `200`  | Successful GET, successful action with returned data          |
| `201`  | Resource created (rare — prefer server actions for creates)   |
| `400`  | Bad request — malformed input, validation failure             |
| `401`  | Unauthenticated — no valid session                            |
| `403`  | Authenticated but forbidden — accessing another user's data   |
| `404`  | Resource not found                                            |
| `409`  | Conflict — duplicate record, constraint violation             |
| `422`  | Unprocessable — input valid but business logic rejects it     |
| `429`  | Rate limited                                                  |
| `500`  | Internal server error — unexpected failure                    |
| `503`  | External dependency down (exchange rate API, Supabase outage) |

---

## Supabase Error Normalisation

Supabase errors are PostgreSQL errors. Translate them to user-friendly strings before returning.

```typescript
// src/lib/normalise-error.ts
import type { PostgrestError } from "@supabase/supabase-js";

const SUPABASE_ERROR_MAP: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "This record is linked to other data and cannot be deleted.",
  "23502": "A required field is missing.",
  "42501": "You do not have permission to perform this action.",
  PGRST116: "Record not found.",
  PGRST301: "Your session has expired. Please sign in again.",
};

export function normaliseSupabaseError(error: PostgrestError): string {
  return (
    SUPABASE_ERROR_MAP[error.code] ??
    SUPABASE_ERROR_MAP[error.message] ??
    "A database error occurred. Please try again."
  );
}
```

---

## Error Message Catalogue

Consistent, user-facing error strings for every failure scenario. Pair these with the Sonner notification skill for display.

### Auth Errors

```typescript
export const AUTH_ERRORS = {
  UNAUTHENTICATED: "You must be signed in to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to access this resource.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_IN_USE: "An account with this email already exists.",
  WEAK_PASSWORD: "Password must be at least 8 characters.",
} as const;
```

### Expense Errors

```typescript
export const EXPENSE_ERRORS = {
  CREATE_FAILED: "Failed to save the expense. Please try again.",
  UPDATE_FAILED: "Failed to update the expense. Please try again.",
  DELETE_FAILED: "Failed to delete the expense. Please try again.",
  NOT_FOUND: "This expense no longer exists.",
  INVALID_AMOUNT: "Amount must be a positive number.",
  INVALID_DATE: "Please select a valid date.",
  MISSING_CATEGORY: "Please select a category.",
  MISSING_TAG:
    "Please select a tag (deductible, capital, personal, or business).",
  UPLOAD_FAILED: "Receipt upload failed. Check your connection and try again.",
  FILE_TOO_LARGE: "Receipt must be under 10 MB.",
  INVALID_FILE_TYPE: "Only JPG, PNG, WebP, HEIC, and PDF files are accepted.",
} as const;
```

### Income Errors

```typescript
export const INCOME_ERRORS = {
  CREATE_FAILED: "Failed to record income. Please try again.",
  UPDATE_FAILED: "Failed to update the income record. Please try again.",
  DELETE_FAILED: "Failed to delete the income record. Please try again.",
  NOT_FOUND: "This income record no longer exists.",
  INVALID_AMOUNT: "Amount must be a positive number.",
  MISSING_SOURCE: "Please provide an income source.",
  MISSING_TYPE: "Please select an income type.",
} as const;
```

### Export Errors

```typescript
export const EXPORT_ERRORS = {
  GENERATE_FAILED: "Failed to generate the export. Please try again.",
  NO_DATA: "There is no data in this date range to export.",
  DOWNLOAD_FAILED:
    "The download could not start. Try again or use a different browser.",
} as const;
```

### Exchange Rate Errors

```typescript
export const FX_ERRORS = {
  FETCH_FAILED: "Could not fetch live exchange rates.",
  STALE_CACHE: "Showing cached rates — live rates temporarily unavailable.",
  NO_RATE: "Exchange rate not available for this currency pair.",
} as const;
```

### Profile Errors

```typescript
export const PROFILE_ERRORS = {
  SAVE_FAILED: "Failed to save your profile. Please try again.",
  INVALID_TURNOVER: "Annual turnover must be a positive number.",
  INVALID_ASSETS: "Fixed assets value must be a positive number.",
  DELETE_FAILED:
    "Could not delete your account. Contact support if this persists.",
} as const;
```

### Generic

```typescript
export const GENERIC_ERRORS = {
  UNEXPECTED: "An unexpected error occurred. Please refresh and try again.",
  NETWORK: "No internet connection. Check your network and try again.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your inputs and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  SERVER_DOWN: "Service temporarily unavailable. Please try again shortly.",
} as const;
```

---

## Input Validation with Zod

Define all schemas in `src/lib/schemas/`. Every server action validates its input before touching the DB.

```typescript
// src/lib/schemas/expense.ts
import { z } from "zod";

export const createExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, EXPENSE_ERRORS.INVALID_DATE),
  amount_ngn: z.number().positive(EXPENSE_ERRORS.INVALID_AMOUNT),
  original_amount: z.number().positive().optional(),
  original_currency: z.string().default("NGN"),
  exchange_rate: z.number().positive().default(1),
  category: z.enum(
    [
      "office_supplies",
      "travel",
      "meals_entertainment",
      "software_subscriptions",
      "equipment",
      "rent",
      "utilities",
      "salaries",
      "marketing",
      "professional_services",
      "bank_charges",
      "insurance",
      "repairs_maintenance",
      "fuel",
      "airtime_internet",
      "other",
    ],
    { errorMap: () => ({ message: EXPENSE_ERRORS.MISSING_CATEGORY }) },
  ),
  tag: z.enum(["deductible", "capital", "personal", "business"], {
    errorMap: () => ({ message: EXPENSE_ERRORS.MISSING_TAG }),
  }),
  description: z.string().min(1, "Description is required.").max(500),
  notes: z.string().max(1000).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().uuid(),
});
```

---

## Export Routes — Streaming Pattern

Export routes stream CSV content. They do not use the JSON envelope — they return raw CSV bytes.

```typescript
// src/app/api/export/expenses/route.ts
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return apiError(AUTH_ERRORS.UNAUTHENTICATED, 401);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) return apiError("Date range is required.", 400);

  try {
    const expenses = await getExpensesForExport(session.user.id, from, to);
    if (!expenses.length) return apiError(EXPORT_ERRORS.NO_DATA, 404);

    const csv = generateExpensesCSV(expenses);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="expenses-${from}-to-${to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return apiError(EXPORT_ERRORS.GENERATE_FAILED, 500);
  }
}
```

---

## Never Leak Internal Errors

Never send raw DB errors, stack traces, or Supabase internal messages to the frontend. Always pass through `normaliseSupabaseError()` or an explicit error constant.

```typescript
// ❌ wrong — leaks internals
return fail(error.message); // e.g. "duplicate key value violates unique constraint..."

// ✅ correct — user-friendly
return fail(normaliseSupabaseError(error)); // "This record already exists."
```
