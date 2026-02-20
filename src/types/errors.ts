// Centralised error message constants for server actions and API routes.

export const AUTH_ERRORS = {
  UNAUTHENTICATED: "You must be signed in to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to access this resource.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  EMAIL_IN_USE: "An account with this email already exists.",
  WEAK_PASSWORD: "Password must be at least 8 characters.",
} as const;

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

export const INCOME_ERRORS = {
  CREATE_FAILED: "Failed to record income. Please try again.",
  UPDATE_FAILED: "Failed to update the income record. Please try again.",
  DELETE_FAILED: "Failed to delete the income record. Please try again.",
  NOT_FOUND: "This income record no longer exists.",
  INVALID_AMOUNT: "Amount must be a positive number.",
  INVALID_DATE: "Please select a valid date.",
  MISSING_SOURCE: "Please provide an income source.",
  MISSING_TYPE: "Please select an income type.",
} as const;

export const EXPORT_ERRORS = {
  GENERATE_FAILED: "Failed to generate the export. Please try again.",
  NO_DATA: "There is no data in this date range to export.",
  DOWNLOAD_FAILED:
    "The download could not start. Try again or use a different browser.",
} as const;

export const FX_ERRORS = {
  FETCH_FAILED: "Could not fetch live exchange rates.",
  STALE_CACHE: "Showing cached rates — live rates temporarily unavailable.",
  NO_RATE: "Exchange rate not available for this currency pair.",
} as const;

export const PROFILE_ERRORS = {
  SAVE_FAILED: "Failed to save your profile. Please try again.",
  INVALID_TURNOVER: "Annual turnover must be a positive number.",
  INVALID_ASSETS: "Fixed assets value must be a positive number.",
  DELETE_FAILED:
    "Could not delete your account. Contact support if this persists.",
} as const;

export const GENERIC_ERRORS = {
  UNEXPECTED: "An unexpected error occurred. Please refresh and try again.",
  NETWORK: "No internet connection. Check your network and try again.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your inputs and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  SERVER_DOWN: "Service temporarily unavailable. Please try again shortly.",
} as const;
