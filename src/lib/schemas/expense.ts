import { z } from "zod";

// Error messages inline to avoid circular import issues with @/types/errors
const EXPENSE_ERRORS = {
  INVALID_AMOUNT: "Amount must be a positive number.",
  INVALID_DATE: "Please select a valid date.",
  MISSING_CATEGORY: "Please select a category.",
  MISSING_TAG:
    "Please select a tag (deductible, capital, personal, or business).",
} as const;

export const EXPENSE_CATEGORIES = [
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
] as const;

export const EXPENSE_TAGS = [
  "deductible",
  "capital",
  "personal",
  "business",
] as const;

export const createExpenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, EXPENSE_ERRORS.INVALID_DATE),
  amount_ngn: z.number().positive(EXPENSE_ERRORS.INVALID_AMOUNT),
  original_amount: z.number().positive().optional(),
  original_currency: z.string().default("NGN"),
  exchange_rate: z.number().positive().default(1),
  category: z.enum(EXPENSE_CATEGORIES, {
    error: EXPENSE_ERRORS.MISSING_CATEGORY,
  }),
  tag: z.enum(EXPENSE_TAGS, { error: EXPENSE_ERRORS.MISSING_TAG }),
  description: z.string().min(1, "Description is required.").max(500),
  notes: z.string().max(1000).optional(),
  receipt_url: z.string().url().optional(),
  receipt_filename: z.string().optional(),
  receipt_storage_path: z.string().optional(),
  ocr_extracted: z.boolean().default(false),
  ocr_amount: z.number().positive().optional(),
  ocr_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.string().uuid("Invalid expense ID."),
});

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>;
