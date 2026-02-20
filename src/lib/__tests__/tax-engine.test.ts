import { describe, expect, test } from "bun:test";
import {
  TAX_CONSTANTS,
  isSmallBusinessExempt,
  computeCIT,
  computePIT,
  computeDeductibleAmount,
  computeTaxableProfit,
  computeCGT,
  computeDividendTax,
} from "../tax-engine";

// ---------------------------------------------------------------------------
// isSmallBusinessExempt
// ---------------------------------------------------------------------------

describe("isSmallBusinessExempt", () => {
  test("exactly at ₦100M turnover and ₦250M assets → exempt", () => {
    expect(isSmallBusinessExempt(100_000_000, 250_000_000)).toBe(true);
  });

  test("turnover ₦100M + ₦1 → NOT exempt", () => {
    expect(isSmallBusinessExempt(100_000_001, 250_000_000)).toBe(false);
  });

  test("fixed assets ₦250M + ₦1 → NOT exempt", () => {
    expect(isSmallBusinessExempt(100_000_000, 250_000_001)).toBe(false);
  });

  test("both thresholds exceeded → NOT exempt", () => {
    expect(isSmallBusinessExempt(200_000_000, 300_000_000)).toBe(false);
  });

  test("well within both thresholds → exempt", () => {
    expect(isSmallBusinessExempt(50_000_000, 100_000_000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeCIT
// ---------------------------------------------------------------------------

describe("computeCIT", () => {
  test("exempt business → zero liability", () => {
    const result = computeCIT(5_000_000, 100_000_000, 250_000_000);
    expect(result.exempt).toBe(true);
    expect(result.cit).toBe(0);
    expect(result.developmentLevy).toBe(0);
    expect(result.total).toBe(0);
  });

  test("non-exempt → 30% CIT + 4% Dev Levy on taxable profit", () => {
    const profit = 10_000_000;
    const result = computeCIT(profit, 100_000_001, 250_000_000);
    expect(result.exempt).toBe(false);
    expect(result.cit).toBeCloseTo(profit * TAX_CONSTANTS.CIT_RATE);
    expect(result.developmentLevy).toBeCloseTo(
      profit * TAX_CONSTANTS.DEVELOPMENT_LEVY_RATE,
    );
    expect(result.total).toBeCloseTo(result.cit + result.developmentLevy);
  });

  test("zero taxable profit → zero tax even when not exempt", () => {
    const result = computeCIT(0, 200_000_000, 300_000_000);
    expect(result.cit).toBe(0);
    expect(result.developmentLevy).toBe(0);
    expect(result.total).toBe(0);
  });

  test("result includes a human-readable reason", () => {
    const exempt = computeCIT(1_000_000, 50_000_000, 100_000_000);
    expect(exempt.reason.length).toBeGreaterThan(0);

    const liable = computeCIT(1_000_000, 200_000_000, 300_000_000);
    expect(liable.reason.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// computePIT
// ---------------------------------------------------------------------------

describe("computePIT", () => {
  test("₦0 income → ₦0 tax", () => {
    const result = computePIT(0, 0, 0, 0);
    expect(result.totalPIT).toBe(0);
    expect(result.taxableIncome).toBe(0);
  });

  test("₦800,000 income (free threshold) → ₦0 tax", () => {
    const result = computePIT(800_000, 0, 0, 0);
    expect(result.totalPIT).toBe(0);
  });

  test("₦800,001 income → 15% on ₦1 above threshold", () => {
    const result = computePIT(800_001, 0, 0, 0);
    // First ₦800k @ 0%, then ₦1 @ 15%
    expect(result.totalPIT).toBeCloseTo(1 * 0.15);
    expect(result.bracketBreakdown).toHaveLength(2);
  });

  test("₦2,000,000 income → correct across first two brackets", () => {
    const result = computePIT(2_000_000, 0, 0, 0);
    // 0% on ₦800k, 15% on ₦1,200,000 (800k–2M = 1.2M width)
    const expected = 1_200_000 * 0.15;
    expect(result.totalPIT).toBeCloseTo(expected);
  });

  test("₦4,000,000 income → crosses 3 brackets", () => {
    const result = computePIT(4_000_000, 0, 0, 0);
    // 0% on ₦800k, 15% on ₦1.2M (800k–2M), 19% on ₦2M (2M–4M)
    const expected = 1_200_000 * 0.15 + 2_000_000 * 0.19;
    expect(result.totalPIT).toBeCloseTo(expected);
  });

  test("₦10,000,001 income → hits top 25% bracket", () => {
    const result = computePIT(10_000_001, 0, 0, 0);
    // Last bracket should be the 25% one (10M–Infinity)
    const topBracket = result.bracketBreakdown.at(-1);
    expect(topBracket?.rate).toBe(0.25);
    // Only ₦1 should fall in the top bracket
    expect(topBracket?.taxableAmount).toBeCloseTo(1);
  });

  test("rent relief below cap: ₦1M rent → ₦200k relief", () => {
    const result = computePIT(2_000_000, 0, 0, 1_000_000);
    // Relief = 20% of ₦1M = ₦200k < ₦500k cap
    expect(result.totalDeductions).toBeCloseTo(200_000);
    expect(result.taxableIncome).toBeCloseTo(2_000_000 - 200_000);
  });

  test("rent relief capped at ₦500,000", () => {
    // 20% of ₦3M = ₦600k → capped at ₦500k
    const result = computePIT(2_000_000, 0, 0, 3_000_000);
    expect(result.totalDeductions).toBeCloseTo(TAX_CONSTANTS.RENT_RELIEF_CAP);
  });

  test("pension + NHF deductions reduce taxable income", () => {
    const gross = 3_000_000;
    const pension = 240_000; // 8%
    const nhf = 75_000; // 2.5%
    const result = computePIT(gross, pension, nhf, 0);
    expect(result.totalDeductions).toBeCloseTo(pension + nhf);
    expect(result.taxableIncome).toBeCloseTo(gross - pension - nhf);
  });

  test("deductions cannot push taxable income below zero", () => {
    const result = computePIT(500_000, 300_000, 100_000, 5_000_000);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalPIT).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeDeductibleAmount
// ---------------------------------------------------------------------------

describe("computeDeductibleAmount", () => {
  test("personal tag → ₦0 regardless of category", () => {
    expect(
      computeDeductibleAmount(100_000, "office_supplies", "personal"),
    ).toBe(0);
    expect(computeDeductibleAmount(50_000, "travel", "personal")).toBe(0);
  });

  test("equipment → ₦0 (capital, not immediately deductible)", () => {
    expect(computeDeductibleAmount(500_000, "equipment", "business")).toBe(0);
  });

  test("meals_entertainment → 50%", () => {
    expect(
      computeDeductibleAmount(200_000, "meals_entertainment", "business"),
    ).toBeCloseTo(100_000);
  });

  test("office_supplies → 100%", () => {
    expect(
      computeDeductibleAmount(80_000, "office_supplies", "business"),
    ).toBeCloseTo(80_000);
  });

  test("travel → 100%", () => {
    expect(
      computeDeductibleAmount(150_000, "travel", "deductible"),
    ).toBeCloseTo(150_000);
  });

  test("unknown category → 100% (default)", () => {
    expect(
      computeDeductibleAmount(60_000, "unknown_category", "business"),
    ).toBeCloseTo(60_000);
  });
});

// ---------------------------------------------------------------------------
// computeTaxableProfit
// ---------------------------------------------------------------------------

describe("computeTaxableProfit", () => {
  test("correctly aggregates income minus all deductions", () => {
    const result = computeTaxableProfit(
      10_000_000, // total income
      {
        office_supplies: { total: 200_000, tag: "business" },
        meals_entertainment: { total: 400_000, tag: "business" },
        equipment: { total: 500_000, tag: "business" },
        travel: { total: 100_000, tag: "personal" },
      },
      1_200_000, // annual rent (relief = ₦240k < ₦500k cap)
      2_400_000, // gross salary
      TAX_CONSTANTS.DEFAULT_PENSION_RATE,
      TAX_CONSTANTS.DEFAULT_NHF_RATE,
    );

    // Deductible expenses:
    //   office_supplies: ₦200k @ 100% = ₦200k
    //   meals_entertainment: ₦400k @ 50% = ₦200k
    //   equipment: 0 (capital)
    //   travel: 0 (personal)
    expect(result.totalDeductibleExpenses).toBeCloseTo(400_000);

    // Pension: 2.4M × 8% = ₦192k
    expect(result.pensionDeduction).toBeCloseTo(192_000);
    // NHF: 2.4M × 2.5% = ₦60k
    expect(result.nhfDeduction).toBeCloseTo(60_000);
    // Rent relief: 1.2M × 20% = ₦240k
    expect(result.rentRelief).toBeCloseTo(240_000);

    const expectedDeductions = 400_000 + 192_000 + 60_000 + 240_000;
    expect(result.totalDeductions).toBeCloseTo(expectedDeductions);
    expect(result.taxableProfit).toBeCloseTo(10_000_000 - expectedDeductions);
  });

  test("taxable profit cannot go below zero", () => {
    const result = computeTaxableProfit(
      100_000,
      { office_supplies: { total: 500_000, tag: "business" } },
      0,
      0,
      0,
      0,
    );
    expect(result.taxableProfit).toBe(0);
  });

  test("itemizedDeductions only includes non-zero items", () => {
    const result = computeTaxableProfit(
      5_000_000,
      {
        equipment: { total: 1_000_000, tag: "business" }, // 0 deductible
        office_supplies: { total: 300_000, tag: "business" }, // 100%
        travel: { total: 200_000, tag: "personal" }, // 0 (personal)
      },
      0,
      0,
      0,
      0,
    );
    expect(result.itemizedDeductions).toHaveLength(1);
    expect(result.itemizedDeductions[0]?.label).toBe("office_supplies");
  });
});

// ---------------------------------------------------------------------------
// CGT
// ---------------------------------------------------------------------------

describe("computeCGT", () => {
  test("export income → CGT = 0", () => {
    expect(computeCGT(500_000, true)).toBe(0);
  });

  test("non-export income → 10% CGT", () => {
    expect(computeCGT(500_000, false)).toBeCloseTo(50_000);
  });

  test("zero gain → ₦0 CGT", () => {
    expect(computeCGT(0, false)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Dividend Withholding Tax
// ---------------------------------------------------------------------------

describe("computeDividendTax", () => {
  test("10% withholding tax on dividends", () => {
    expect(computeDividendTax(1_000_000)).toBeCloseTo(100_000);
  });

  test("zero dividend → zero tax", () => {
    expect(computeDividendTax(0)).toBe(0);
  });
});
