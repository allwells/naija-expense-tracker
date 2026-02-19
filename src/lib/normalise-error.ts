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
