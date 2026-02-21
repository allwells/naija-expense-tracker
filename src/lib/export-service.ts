import { stringify } from "csv-stringify/sync";
import type { ProfileRow, ExpenseRow, IncomeRow } from "@/types/database";
import {
  computeDeductibleAmount,
  type FullTaxLiabilityResult,
} from "@/lib/tax-engine";

export function generateExpensesCSV(expenses: ExpenseRow[]): string {
  const rows = expenses.map((e) => {
    const deductible = computeDeductibleAmount(e.amount_ngn, e.category, e.tag);
    return [
      e.date,
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

export function generateIncomeCSV(incomeRecords: IncomeRow[]): string {
  const rows = incomeRecords.map((inc) => {
    return [
      inc.date,
      inc.source,
      inc.income_type,
      inc.original_amount ?? inc.amount_ngn,
      inc.original_currency ?? "NGN",
      inc.exchange_rate ?? 1,
      inc.amount_ngn,
      inc.is_export_income ? "Y" : "N",
      inc.description ?? "",
    ];
  });

  return stringify(rows, {
    header: true,
    columns: [
      "Date",
      "Source",
      "Income Type",
      "Original Amount",
      "Original Currency",
      "Exchange Rate",
      "Amount (NGN)",
      "Is Export Income",
      "Description",
    ],
  });
}

export function generateTaxSummaryCSV(
  profile: ProfileRow,
  expenses: ExpenseRow[],
  incomeRecords: IncomeRow[],
  taxResult: FullTaxLiabilityResult,
): string {
  const rows: (string | number)[][] = [];

  // Header
  rows.push(["FIRS TAX COMPUTATION SUMMARY"]);
  rows.push(["Tax Year:", profile.tax_year]);
  rows.push(["Business Name:", profile.business_name ?? "N/A"]);
  rows.push(["Prepared:", new Date().toISOString().slice(0, 10)]);
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
  rows.push(["TOTAL INCOME", "", "", "", taxResult.taxableProfit.totalIncome]);
  rows.push([]);

  // Section B: Deductible Expenses
  rows.push(["SECTION B: DEDUCTIBLE EXPENSES"]);
  rows.push([
    "Category",
    "Description",
    "Tag",
    "Amount (NGN)",
    "Deductible Amount (NGN)",
    "Deductibility Rate",
  ]);

  let totalDeductibleGenerated = 0;

  for (const exp of expenses) {
    const deductible = computeDeductibleAmount(
      exp.amount_ngn,
      exp.category,
      exp.tag,
    );
    if (deductible > 0) {
      const rate = exp.amount_ngn > 0 ? (deductible / exp.amount_ngn) * 100 : 0;
      rows.push([
        exp.category,
        exp.description,
        exp.tag,
        exp.amount_ngn,
        deductible,
        `${rate.toFixed(1)}%`,
      ]);
      totalDeductibleGenerated += deductible;
    }
  }

  rows.push([]);
  rows.push([
    "TOTAL DEDUCTIBLE EXPENSES",
    "",
    "",
    "",
    taxResult.taxableProfit.totalDeductibleExpenses,
    "",
  ]);
  rows.push([]);

  // Section C: Statutory Deductions
  rows.push(["SECTION C: STATUTORY DEDUCTIONS"]);
  rows.push(["Item", "Rate", "Base Amount (NGN)", "Deduction (NGN)"]);

  // Need gross salary from income records
  const grossSalary = incomeRecords
    .filter((inc) => inc.income_type === "salary")
    .reduce((sum, inc) => sum + inc.amount_ngn, 0);

  const pensionRate = (profile.pension_rate ?? 0.08) * 100;
  rows.push([
    "Pension Contributions",
    `${pensionRate}%`,
    grossSalary,
    taxResult.taxableProfit.pensionDeduction,
  ]);

  const nhfRate = (profile.nhf_rate ?? 0.025) * 100;
  rows.push([
    "NHF Contributions",
    `${nhfRate}%`,
    grossSalary,
    taxResult.taxableProfit.nhfDeduction,
  ]);

  rows.push([
    "Rent Relief",
    "20% (capped ₦500k)",
    profile.monthly_rent_ngn ? profile.monthly_rent_ngn * 12 : 0,
    taxResult.taxableProfit.rentRelief,
  ]);

  rows.push([
    "TOTAL DEDUCTIONS",
    "",
    "",
    taxResult.taxableProfit.totalDeductions,
  ]);
  rows.push([]);

  // Section D: Taxable Income/Profit
  rows.push(["SECTION D: TAXABLE INCOME/PROFIT"]);
  rows.push(["Gross Income", "", taxResult.taxableProfit.totalIncome]);
  rows.push([
    "Less: Deductible Expenses",
    "",
    `(${taxResult.taxableProfit.totalDeductibleExpenses})`,
  ]);
  rows.push([
    "Less: Statutory Deductions",
    "",
    `(${taxResult.taxableProfit.totalDeductions})`,
  ]);
  rows.push(["TAXABLE PROFIT", "", taxResult.taxableProfit.taxableProfit]);
  rows.push([]);

  // Section E: Tax Liability
  rows.push(["SECTION E: TAX LIABILITY"]);
  rows.push([
    "CIT Exemption Status",
    taxResult.cit.exempt ? "EXEMPT" : "NOT EXEMPT",
  ]);
  rows.push(["Reason", taxResult.cit.reason]);

  if (!taxResult.cit.exempt) {
    rows.push(["CIT @ 30%", "", taxResult.cit.cit]);
    rows.push(["Development Levy @ 4%", "", taxResult.cit.developmentLevy]);
  }

  if (taxResult.pit && taxResult.pit.bracketBreakdown.length > 0) {
    rows.push(["PIT Computation:"]);
    for (const bracket of taxResult.pit.bracketBreakdown) {
      rows.push([
        `  ${bracket.bracket} @ ${(bracket.rate * 100).toFixed(0)}%`,
        "",
        bracket.tax,
      ]);
    }
    rows.push(["Total PIT", "", taxResult.pit.totalPIT]);
  }

  if (taxResult.cgt > 0) {
    rows.push(["CGT @ 10%", "", taxResult.cgt]);
  }

  if (taxResult.dividendTax > 0) {
    rows.push(["Dividend Tax @ 10%", "", taxResult.dividendTax]);
  }

  rows.push(["TOTAL TAX PAYABLE", "", taxResult.totalTaxPayable]);
  rows.push([]);

  rows.push([
    "DISCLAIMER: This summary is prepared for informational purposes. Consult a tax professional for FIRS filing.",
  ]);

  return stringify(rows);
}
