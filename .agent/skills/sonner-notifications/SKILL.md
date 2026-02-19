---
name: sonner-notifications
description: Visual notification system using Sonner (Shadcn's toast library) with meaningful titles and messages across all user interactions. Use when triggering any toast — CRUD operations on expenses/income, OCR results, file uploads, export downloads, auth events, form validation errors, tax status changes, exchange rate refresh, or any background process. Contains the full notification catalogue with exact titles and messages for every app event, plus setup, duration guidelines, and styling rules.
---

# SKILL: Sonner Notifications

## Setup

Sonner ships with Shadcn. Install the component and mount the `<Toaster>` once in the root layout.

```bash
npx shadcn@latest add sonner
```

```tsx
// src/app/layout.tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "0px",
              borderWidth: "2px",
            },
          }}
        />
      </body>
    </html>
  );
}
```

## Import

```typescript
import { toast } from "sonner";
```

---

## Notification Catalogue

Every event in the app has a pre-defined toast. Use these exact titles and messages — do not improvise.

### Auth

```typescript
// Successful login
toast.success('Welcome back', {
  description: 'You've been signed in successfully.',
});

// Successful signup
toast.success('Account created', {
  description: 'Welcome to NaijaExpense. Let's set up your business profile.',
});

// Sign out
toast.info('Signed out', {
  description: 'You have been logged out of your account.',
});

// Auth error (wrong password, etc.)
toast.error('Sign in failed', {
  description: error.message ?? 'Invalid email or password. Please try again.',
});

// Session expired
toast.warning('Session expired', {
  description: 'Your session has ended. Please sign in again.',
});
```

---

### Expenses

```typescript
// Created
toast.success("Expense recorded", {
  description: `₦${formatNGN(amount)} · ${category.replace(/_/g, " ")} added successfully.`,
});

// Updated
toast.success("Expense updated", {
  description: "Your changes have been saved.",
});

// Deleted
toast.success("Expense deleted", {
  description: "The expense has been removed from your records.",
  // Optional: undo action
  action: {
    label: "Undo",
    onClick: () => restoreExpense(id),
  },
});

// Delete failed
toast.error("Could not delete expense", {
  description: "Something went wrong. Please try again or refresh the page.",
});

// Create failed
toast.error("Expense not saved", {
  description:
    error ?? "Failed to save the expense. Check your connection and try again.",
});

// Validation error
toast.error("Check your inputs", {
  description: "Amount and category are required before saving.",
});
```

---

### Income

```typescript
// Created
toast.success("Income recorded", {
  description: `₦${formatNGN(amount)} from ${source} logged.`,
});

// Updated
toast.success("Income updated", {
  description: "Your changes have been saved.",
});

// Deleted
toast.success("Income entry removed", {
  description: "The income record has been deleted.",
  action: {
    label: "Undo",
    onClick: () => restoreIncome(id),
  },
});

// Failed
toast.error("Income not saved", {
  description: error ?? "Failed to record income. Please try again.",
});
```

---

### OCR / Receipt Scanning

```typescript
// Scan started
toast.loading("Scanning receipt…", {
  id: "ocr-scan", // use an id so it can be dismissed/replaced
  description: "Extracting amount and date from your receipt.",
});

// Scan succeeded — values found
toast.success("Receipt scanned", {
  id: "ocr-scan",
  description: `Detected ₦${formatNGN(amount)} · ${date}. Review and confirm below.`,
});

// Scan succeeded — partial (only one value found)
toast.info("Partial scan result", {
  id: "ocr-scan",
  description:
    "We found a date but could not detect the amount. Please enter it manually.",
});

// Scan failed / low confidence
toast.warning("Could not read receipt", {
  id: "ocr-scan",
  description:
    "The image quality may be too low. Please enter the details manually.",
});

// Wrong file type
toast.error("Unsupported file type", {
  description: "Please upload a JPG, PNG, WebP, HEIC, or PDF file.",
});

// File too large
toast.error("File too large", {
  description: "Receipt must be under 10 MB. Try compressing the image first.",
});
```

---

### Receipt Upload

```typescript
// Upload in progress
toast.loading("Uploading receipt…", {
  id: "receipt-upload",
  description: "Saving your receipt to secure storage.",
});

// Upload succeeded
toast.success("Receipt saved", {
  id: "receipt-upload",
  description: "Your receipt has been attached to this expense.",
});

// Upload failed
toast.error("Upload failed", {
  id: "receipt-upload",
  description:
    "Could not save the receipt. Check your connection and try again.",
});
```

---

### CSV Export

```typescript
// Export started
toast.loading("Preparing export…", {
  id: "csv-export",
  description: "Building your audit-ready CSV file.",
});

// Export complete
toast.success("Export ready", {
  id: "csv-export",
  description: "Your file has been downloaded. Check your Downloads folder.",
});

// Export failed
toast.error("Export failed", {
  id: "csv-export",
  description: "Could not generate the export. Please try again.",
});
```

---

### Exchange Rates

```typescript
// Rates refreshed
toast.success("Exchange rates updated", {
  description: `USD/NGN: ₦${usdRate.toLocaleString()} · EUR/NGN: ₦${eurRate.toLocaleString()}`,
  duration: 3000,
});

// Rate fetch failed — using cache
toast.warning("Using cached exchange rates", {
  description: "Could not fetch live rates. Showing rates from last update.",
  duration: 5000,
});

// Rate fetch failed — no cache
toast.error("Exchange rates unavailable", {
  description: "Enter amounts in NGN or try again later.",
});
```

---

### Tax Status Changes

```typescript
// User becomes exempt (turnover drops below threshold)
toast.success("CIT exemption confirmed", {
  description:
    "Your turnover qualifies for full exemption under the 2026 Tax Reform Act.",
  duration: 6000,
});

// User exceeds exemption threshold
toast.warning("Exemption threshold exceeded", {
  description:
    "Your annual turnover now exceeds ₦100M. CIT @ 30% applies to taxable profit.",
  duration: 8000,
});

// Approaching threshold (80% of ₦100M = ₦80M)
toast.info("Approaching CIT threshold", {
  description: `You're at ₦${formatNGN(currentTurnover)} of the ₦100M exemption limit.`,
  duration: 6000,
});
```

---

### Profile / Settings

```typescript
// Profile saved
toast.success("Profile updated", {
  description: "Your business details and tax preferences have been saved.",
});

// Profile save failed
toast.error("Profile not saved", {
  description: error ?? "Failed to update your profile. Please try again.",
});

// Onboarding complete
toast.success("Setup complete", {
  description: "Your profile is ready. Start logging your expenses.",
});

// Data cleared (danger zone)
toast.success("All data cleared", {
  description: "Your expenses and income have been permanently deleted.",
});
```

---

### Network / General

```typescript
// Offline
toast.error("No internet connection", {
  description:
    "Check your connection. Changes will not be saved while offline.",
  duration: Infinity, // stays until dismissed
});

// Back online
toast.success("Back online", {
  description: "Your connection has been restored.",
});

// Generic unexpected error
toast.error("Something went wrong", {
  description: "An unexpected error occurred. Please refresh and try again.",
});
```

---

## Patterns & Rules

### Use IDs for Multi-Step Processes

Any operation with a loading state must use a toast ID so the loading toast gets replaced — not stacked:

```typescript
// Step 1: show loading
toast.loading("Uploading receipt…", { id: "receipt-upload" });

// Step 2: replace with result
toast.success("Receipt saved", { id: "receipt-upload" });
// OR
toast.error("Upload failed", { id: "receipt-upload" });
```

### Duration Guidelines

| Type                  | Duration                               |
| --------------------- | -------------------------------------- |
| `success`             | 4000ms (default)                       |
| `info`                | 4000ms                                 |
| `warning`             | 6000ms                                 |
| `error`               | 6000ms                                 |
| `loading`             | `Infinity` (replaced by success/error) |
| Offline error         | `Infinity`                             |
| Tax threshold warning | 8000ms                                 |

Override with `duration` option only when the default is inappropriate.

### Format Money in Messages

Always format NGN amounts with `formatNGN()` from `src/lib/format.ts` — never raw numbers:

```typescript
// ✅ correct
description: `₦${formatNGN(amount)} logged under ${category}.`;

// ❌ wrong
description: `${amount} added.`;
```

### Never Use Generic Messages

Every toast must tell the user exactly what happened and what it concerns:

```typescript
// ❌ wrong — vague
toast.success("Done");
toast.error("Error occurred");

// ✅ correct — specific
toast.success("Expense recorded", { description: `₦45,000 · travel saved.` });
toast.error("Expense not saved", {
  description: "Failed to reach the server. Try again.",
});
```

### Undo Actions

Destructive operations (delete expense, delete income) should offer an undo action where technically feasible:

```typescript
toast.success("Expense deleted", {
  description: "The expense has been removed from your records.",
  action: {
    label: "Undo",
    onClick: () => restoreExpense(deletedExpense),
  },
});
```
