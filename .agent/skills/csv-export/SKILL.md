---
name: csv-export
description: FIRS audit-ready CSV export implementation using csv-stringify. Use when building the export service, the /api/export/* routes, or the ExportPanel UI. Contains exact column specifications for the Expenses CSV, Income CSV, and the structured Tax Computation Summary CSV (with SECTION A–E format matching FIRS expectations). Includes streaming download pattern and deductible amount derivation logic.
---

# SKILL: CSV Export & Audit Package

## Purpose

Generate FIRS-audit-ready CSV exports for expenses, income, and tax computation summaries.

## Export Service: `src/lib/export-service.ts`

Use `csv-stringify` package for all CSV generation.

```typescript
import { stringify } from "csv-stringify/sync";
```

## Expenses CSV

### Columns (in order)

```
Date | Description | Category | Tag | Original Amount | Original Currency | Exchange Rate | Amount (NGN) | Deductible Amount (NGN) | Non-Deductible Amount (NGN) | Receipt URL | OCR Extracted | Notes
```

### Column Derivation

- `Deductible Amount (NGN)`: apply `computeDeductibleAmount(amount_ngn, category, tag)` from tax engine
- `Non-Deductible Amount (NGN)`: `amount_ngn - deductibleAmount`
- `Receipt URL`: full Supabase Storage public URL (from `receipt_url` field)
- `OCR Extracted`: `"Y"` if `ocr_extracted === true`, else `"N"`

### Function

```typescript
export function generateExpensesCSV(expenses: ExpenseRecord[]): string {
  const rows = expenses.map((e) => {
    const deductible = computeDeductibleAmount(e.amount_ngn, e.category, e.tag);
    return [
      format(new Date(e.date), "yyyy-MM-dd"),
      e.description,
      e.category,
      e.tag,
      e.original_amount ?? e.amount_ngn,
      e.original_currency ?? "NGN",
      e.exchange_rate ?? 1,
      e.amount_ngn,
      deductible,
      e.amount_ngn - deductible,
      e.receipt_url ?? "",
      e.ocr_extracted ? "Y" : "N",
      e.notes ?? "",
    ];
  });

  return stringify(rows, {
    header: true,
    columns: [
      "Date",
      "Description",
      "Category",
      "Tag",
      "Original Amount",
      "Original Currency",
      "Exchange Rate",
      "Amount (NGN)",
      "Deductible Amount (NGN)",
      "Non-Deductible Amount (NGN)",
      "Receipt URL",
      "OCR Extracted",
      "Notes",
    ],
  });
}
```

## Income CSV

### Columns

```
Date | Source | Income Type | Original Amount | Original Currency | Exchange Rate | Amount (NGN) | Is Export Income | Description
```

## Tax Computation Summary CSV

This is the critical audit document. Format it as a structured report, not just data rows.

### Structure

```
FIRS TAX COMPUTATION SUMMARY
Tax Year: 2026
Business Name: [business_name]
Prepared: [ISO date]
[blank row]
SECTION A: INCOME
Date,Source,Type,Amount (NGN),Export Income
[income rows]
[blank row]
TOTAL INCOME,,,,₦X
[blank row]
SECTION B: DEDUCTIBLE EXPENSES
Category,Description,Tag,Amount (NGN),Deductible Amount (NGN),Deductibility Rate
[expense rows with deductibility]
[blank row]
TOTAL DEDUCTIBLE EXPENSES,,,, ₦X
[blank row]
SECTION C: STATUTORY DEDUCTIONS
Item,Rate,Base Amount (NGN),Deduction (NGN)
Pension Contributions,8%,₦X,₦X
NHF Contributions,2.5%,₦X,₦X
Rent Relief,20% (capped ₦500k),₦X,₦X
TOTAL DEDUCTIONS,,, ₦X
[blank row]
SECTION D: TAXABLE INCOME/PROFIT
Gross Income,,₦X
Less: Deductible Expenses,,(₦X)
Less: Statutory Deductions,,(₦X)
TAXABLE PROFIT,,₦X
[blank row]
SECTION E: TAX LIABILITY
CIT Exemption Status,[EXEMPT / NOT EXEMPT]
Reason,[reason text]
[if not exempt:]
CIT @ 30%,,₦X
Development Levy @ 4%,,₦X
[PIT bracket rows if applicable]
TOTAL TAX PAYABLE,,₦X
[blank row]
DISCLAIMER: This summary is prepared for informational purposes. Consult a tax professional for FIRS filing.
```

### Implementation Note

Use a multi-section array builder — each section is a separate array of rows concatenated together:

```typescript
export function generateTaxSummaryCSV(
  profile: ProfileRecord,
  expenses: ExpenseRecord[],
  incomeRecords: IncomeRecord[],
  taxResult: FullTaxLiabilityResult,
): string {
  const rows: (string | number)[][] = [];

  // Header
  rows.push(["FIRS TAX COMPUTATION SUMMARY"]);
  rows.push(["Tax Year:", profile.tax_year]);
  rows.push(["Business Name:", profile.business_name ?? "N/A"]);
  rows.push(["Prepared:", new Date().toISOString().split("T")[0]]);
  rows.push([]);

  // Section A: Income
  rows.push(["SECTION A: INCOME"]);
  rows.push(["Date", "Source", "Type", "Amount (NGN)", "Export Income"]);
  for (const inc of incomeRecords) {
    rows.push([
      inc.date,
      inc.source,
      inc.income_type,
      inc.amount_ngn,
      inc.is_export_income ? "Y" : "N",
    ]);
  }
  rows.push([]);
  rows.push(["TOTAL INCOME", "", "", taxResult.taxableProfit.totalIncome]);
  rows.push([]);

  // ... continue for all sections

  return stringify(rows);
}
```

## API Routes for Export

All export routes stream CSV as a file download:

```typescript
// src/app/api/export/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // 1. Get session → get userId
  // 2. Get date range from query params
  // 3. Fetch expenses from DB
  // 4. Generate CSV
  // 5. Return as download

  const csv = generateExpensesCSV(expenses);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-${year}-${month}.csv"`,
    },
  });
}
```

## ExportPanel UI

Three distinct download buttons with icons. Show loading state during generation:

```tsx
<Button
  variant="outline"
  onClick={() => downloadCSV("expenses")}
  disabled={loading}
>
  <DownloadIcon className="mr-2 h-4 w-4" />
  {loading ? "Generating..." : "Expenses CSV"}
</Button>
```

Trigger download via:

```typescript
async function downloadCSV(type: "expenses" | "income" | "tax-summary") {
  const res = await fetch(`/api/export/${type}?from=${from}&to=${to}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```
