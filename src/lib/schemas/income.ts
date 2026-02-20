import { z } from "zod";

// Error messages inline to avoid circular import issues with @/types/errors
const INCOME_ERRORS = {
  INVALID_AMOUNT: "Amount must be a positive number.",
  MISSING_SOURCE: "Please provide an income source.",
  MISSING_TYPE: "Please select an income type.",
} as const;

export const INCOME_TYPES = [
  "salary",
  "dividend",
  "freelance",
  "export",
  "other",
] as const;

export const createIncomeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date."),
  amount_ngn: z.number().positive(INCOME_ERRORS.INVALID_AMOUNT),
  original_amount: z.number().positive().optional(),
  original_currency: z.string().default("NGN"),
  exchange_rate: z.number().positive().default(1),
  source: z.string().min(1, INCOME_ERRORS.MISSING_SOURCE).max(200),
  income_type: z.enum(INCOME_TYPES, { error: INCOME_ERRORS.MISSING_TYPE }),
  description: z.string().max(500).optional(),
  is_export_income: z.boolean().default(false),
});

export const updateIncomeSchema = createIncomeSchema.partial().extend({
  id: z.string().uuid("Invalid income record ID."),
});

export type CreateIncomeSchema = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeSchema = z.infer<typeof updateIncomeSchema>;
