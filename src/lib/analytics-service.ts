import { getExpensesForExport } from "./expense-service";
import { getIncomeForExport } from "./income-service";
import { getProfile } from "./profile-service";
import {
  computeTaxableProfit,
  computeCIT,
  computePIT,
  computeDividendTax,
  type FullTaxLiabilityResult,
} from "./tax-engine";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  endOfDay,
  eachMonthOfInterval,
  differenceInDays,
  eachDayOfInterval,
} from "date-fns";
import type { ExpenseRow, IncomeRow } from "@/types/database";

export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface CategorySpendData {
  category: string;
  total: number;
}

export interface DeductibleData {
  category: string;
  deductible: number;
  nonDeductible: number;
}

export interface TrendStat {
  value: number;
  trendPercentage: number | null; // null means no previous data
  isPositive: boolean;
}

export interface DashboardData {
  stats: {
    totalIncome: TrendStat;
    totalExpenses: TrendStat;
    netProfit: TrendStat;
    netProfitAfterTax: TrendStat;
    taxLiability: TrendStat;
  };
  monthlyTrends: MonthlyTrendData[];
  spendByCategory: CategorySpendData[];
  deductibles: DeductibleData[];
  tax: FullTaxLiabilityResult | null;
}

// Helper to compute percentage change
function computeTrend(current: number, previous: number): number | null {
  if (previous === 0) return null; // Cannot divide by zero, no meaningful trend
  return ((current - previous) / previous) * 100;
}

export async function getDashboardData(
  userId: string,
  filters?: { from?: string; to?: string; category?: string; tag?: string },
): Promise<DashboardData> {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("Profile not found");

  const now = filters?.to ? new Date(filters.to) : new Date();

  // 1. Fetch data for the specified range, defaulting to full year
  const rangeStart = filters?.from
    ? new Date(filters.from).toISOString()
    : startOfYear(now).toISOString();
  const rangeEnd = filters?.to
    ? endOfDay(now).toISOString()
    : endOfYear(now).toISOString();

  const dStart = new Date(rangeStart);
  const dEnd = new Date(rangeEnd);
  const safeEnd = dEnd < dStart ? dStart : dEnd;

  let [periodExpenses, periodIncome] = await Promise.all([
    getExpensesForExport(userId, rangeStart, rangeEnd),
    getIncomeForExport(userId, rangeStart, rangeEnd),
  ]);

  if (filters?.category) {
    periodExpenses = periodExpenses.filter(
      (e) => e.category === filters.category,
    );
  }
  if (filters?.tag) {
    periodExpenses = periodExpenses.filter((e) => e.tag === filters.tag);
  }

  // 2. Fetch data for the preceding (comparison) period
  const diffTime = safeEnd.getTime() - dStart.getTime();
  const diffDays = Math.max(differenceInDays(safeEnd, dStart), 1);

  // Previous period ends right before current period starts
  const prevEnd = new Date(dStart.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffTime);

  let [prevExpensesData, prevIncomeData] = await Promise.all([
    getExpensesForExport(
      userId,
      prevStart.toISOString(),
      prevEnd.toISOString(),
    ),
    getIncomeForExport(userId, prevStart.toISOString(), prevEnd.toISOString()),
  ]);

  if (filters?.category) {
    prevExpensesData = prevExpensesData.filter(
      (e) => e.category === filters.category,
    );
  }
  if (filters?.tag) {
    prevExpensesData = prevExpensesData.filter((e) => e.tag === filters.tag);
  }

  // --- Compute Chart Data Interval ---
  const intervalType = diffDays <= 93 ? "days" : "months";
  const isMultiYear = dStart.getFullYear() !== safeEnd.getFullYear();

  let formatStr = "";
  let allPeriods: Date[] = [];

  if (intervalType === "days") {
    allPeriods = eachDayOfInterval({ start: dStart, end: safeEnd });
    if (diffDays <= 7) {
      formatStr = "EEE"; // Mon, Tue...
    } else {
      formatStr = isMultiYear ? "do MMM yy" : "do MMM"; // 21st Feb
    }
  } else {
    allPeriods = eachMonthOfInterval({ start: dStart, end: safeEnd });
    formatStr = isMultiYear ? "MMM yyyy" : "MMM";
  }

  const periodsData: Record<string, MonthlyTrendData> = {};
  allPeriods.forEach((d) => {
    const key = format(d, formatStr);
    periodsData[key] = { month: key, income: 0, expenses: 0, profit: 0 };
  });

  let totalPeriodIncome = 0;
  let totalPeriodExpenses = 0;

  periodIncome.forEach((i) => {
    const key = format(new Date(i.date), formatStr);
    if (periodsData[key]) periodsData[key].income += i.amount_ngn;
    totalPeriodIncome += i.amount_ngn;
  });

  const categoryAggs: Record<string, { total: number; tag: string }> = {};

  periodExpenses.forEach((e) => {
    const key = format(new Date(e.date), formatStr);
    if (periodsData[key]) periodsData[key].expenses += e.amount_ngn;
    totalPeriodExpenses += e.amount_ngn;

    if (!categoryAggs[e.category]) {
      categoryAggs[e.category] = { total: 0, tag: e.tag };
    }
    if (categoryAggs[e.category]) {
      categoryAggs[e.category]!.total += e.amount_ngn;
    }
  });

  const monthlyTrends = Object.values(periodsData).map((m) => ({
    ...m,
    profit: m.income - m.expenses,
  }));

  // --- Compute Tax Engine Inputs for CURRENT period ---
  let grossSalary = 0;
  periodIncome.forEach((i) => {
    if (i.income_type === "salary") grossSalary += i.amount_ngn;
  });

  // Scale rent
  const scaleRatio = diffDays > 0 ? diffDays / 365.25 : 1 / 365.25;
  const scaledRent = profile.monthly_rent_ngn
    ? profile.monthly_rent_ngn * 12 * scaleRatio
    : 0;

  const taxableProfitResult = computeTaxableProfit(
    totalPeriodIncome,
    categoryAggs,
    scaledRent,
    grossSalary,
    profile.pension_rate ?? 0.08,
    profile.nhf_rate ?? 0.025,
  );

  const citResult = computeCIT(
    taxableProfitResult.taxableProfit,
    profile.annual_turnover_ngn,
    profile.fixed_assets_ngn,
  );

  const pitResult =
    grossSalary > 0
      ? computePIT(
          grossSalary,
          taxableProfitResult.pensionDeduction,
          taxableProfitResult.nhfDeduction,
          scaledRent,
        )
      : null;

  let dividendIncome = 0;
  periodIncome.forEach((i) => {
    if (i.income_type === "dividend") dividendIncome += i.amount_ngn;
  });
  const dividendTax = computeDividendTax(dividendIncome);
  let cgt = 0;
  const totalTaxPayable =
    citResult.total + (pitResult?.totalPIT ?? 0) + cgt + dividendTax;

  const fullTaxResult: FullTaxLiabilityResult = {
    taxYear: now.getFullYear(),
    isSmallBusinessExempt: citResult.exempt,
    taxableProfit: taxableProfitResult,
    cit: citResult,
    pit: pitResult,
    cgt,
    dividendTax,
    totalTaxPayable,
    effectiveTaxRate:
      totalPeriodIncome > 0 ? totalTaxPayable / totalPeriodIncome : 0,
  };

  // --- Prepare chart datasets ---
  const spendByCategory = Object.entries(categoryAggs)
    .map(([category, { total }]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const deductibles = Object.entries(categoryAggs)
    .map(([category, { total }]) => {
      const item = taxableProfitResult.itemizedDeductions.find(
        (d) => d.label === category,
      );
      const deductible = item ? item.amount : 0;
      return { category, deductible, nonDeductible: total - deductible };
    })
    .sort((a, b) => b.deductible - a.deductible);

  // --- Compute Stats & Trends ---
  const currentIncome = totalPeriodIncome;
  const currentExpenses = totalPeriodExpenses;
  const currentProfit = currentIncome - currentExpenses;

  const prevIncome = prevIncomeData.reduce((sum, i) => sum + i.amount_ngn, 0);
  const prevExpenses = prevExpensesData.reduce(
    (sum, e) => sum + e.amount_ngn,
    0,
  );
  const prevProfit = prevIncome - prevExpenses;

  const incomeTrend = computeTrend(currentIncome, prevIncome);
  const expensesTrend = computeTrend(currentExpenses, prevExpenses);
  const profitTrend = computeTrend(currentProfit, prevProfit);

  // Tax Trend calculation (Current Period vs Prev Period)
  let prevGrossSalary = 0;
  prevIncomeData.forEach((i) => {
    if (i.income_type === "salary") prevGrossSalary += i.amount_ngn;
  });

  const prevTaxableProfitResult = computeTaxableProfit(
    prevIncome,
    {}, // Simplifying deductibles here for fast prev tax computation
    scaledRent,
    prevGrossSalary,
    profile.pension_rate ?? 0.08,
    profile.nhf_rate ?? 0.025,
  );

  const prevCitResult = computeCIT(
    prevTaxableProfitResult.taxableProfit,
    profile.annual_turnover_ngn,
    profile.fixed_assets_ngn,
  );

  const prevPitResult =
    prevGrossSalary > 0
      ? computePIT(
          prevGrossSalary,
          prevTaxableProfitResult.pensionDeduction,
          prevTaxableProfitResult.nhfDeduction,
          scaledRent,
        )
      : null;

  let prevDividendIncome = 0;
  prevIncomeData.forEach((i) => {
    if (i.income_type === "dividend") prevDividendIncome += i.amount_ngn;
  });
  const prevDividendTax = computeDividendTax(prevDividendIncome);
  const prevTotalTaxPayable =
    prevCitResult.total + (prevPitResult?.totalPIT ?? 0) + prevDividendTax;

  const taxTrend = computeTrend(totalTaxPayable, prevTotalTaxPayable);

  return {
    stats: {
      totalIncome: {
        value: currentIncome,
        trendPercentage: incomeTrend,
        isPositive: currentIncome >= prevIncome,
      },
      totalExpenses: {
        value: currentExpenses,
        trendPercentage: expensesTrend,
        isPositive: currentExpenses <= prevExpenses,
      },
      netProfit: {
        value: currentProfit,
        trendPercentage: profitTrend,
        isPositive: currentProfit >= prevProfit,
      },
      netProfitAfterTax: {
        value: currentProfit - totalTaxPayable,
        trendPercentage: computeTrend(
          currentProfit - totalTaxPayable,
          prevProfit - prevTotalTaxPayable,
        ),
        isPositive:
          currentProfit - totalTaxPayable >= prevProfit - prevTotalTaxPayable,
      },
      taxLiability: {
        value: totalTaxPayable,
        trendPercentage: taxTrend,
        isPositive: totalTaxPayable <= prevTotalTaxPayable,
      },
    },
    monthlyTrends,
    spendByCategory,
    deductibles,
    tax: fullTaxResult,
  };
}

// ------------------------------------------------------------------------------------------------
// REPORTS DATA AGGREGATION
// ------------------------------------------------------------------------------------------------

export interface TaxBreakdownData {
  period: string; // e.g. "Jan '26"
  cit: number;
  developmentLevy: number;
  pit: number;
  total: number;
}

export interface ReportsData {
  taxBreakdown: TaxBreakdownData[];
  tax: FullTaxLiabilityResult | null;
}

export async function getReportsData(
  userId: string,
  filters?: { from?: string; to?: string; category?: string; tag?: string },
): Promise<ReportsData> {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("Profile not found");

  const now = filters?.to ? new Date(filters.to) : new Date();

  const rangeStart = filters?.from
    ? new Date(filters.from).toISOString()
    : startOfYear(now).toISOString();
  const rangeEnd = filters?.to
    ? endOfDay(now).toISOString()
    : endOfYear(now).toISOString();

  let [periodExpenses, periodIncome] = await Promise.all([
    getExpensesForExport(userId, rangeStart, rangeEnd),
    getIncomeForExport(userId, rangeStart, rangeEnd),
  ]);

  if (filters?.category) {
    periodExpenses = periodExpenses.filter(
      (e) => e.category === filters.category,
    );
  }
  if (filters?.tag) {
    periodExpenses = periodExpenses.filter((e) => e.tag === filters.tag);
  }

  // We need to compute tax on a per-period basis to chart it over time.
  const dStart = new Date(rangeStart);
  const dEnd = new Date(rangeEnd);
  const safeEnd = dEnd < dStart ? dStart : dEnd;
  const diffDays = Math.max(differenceInDays(safeEnd, dStart), 1);

  const intervalType = diffDays <= 93 ? "days" : "months";
  const isMultiYear = dStart.getFullYear() !== safeEnd.getFullYear();

  let formatStr = "";
  let allPeriods: Date[] = [];

  if (intervalType === "days") {
    allPeriods = eachDayOfInterval({ start: dStart, end: safeEnd });
    if (diffDays <= 7) {
      formatStr = "EEE";
    } else {
      formatStr = isMultiYear ? "do MMM yy" : "do MMM";
    }
  } else {
    allPeriods = eachMonthOfInterval({ start: dStart, end: safeEnd });
    formatStr = isMultiYear ? "MMM yyyy" : "MMM";
  }

  const periodsData: Record<
    string,
    {
      period: string;
      income: number;
      expenses: number;
      grossSalary: number;
      categoryAggs: Record<string, { total: number; tag: string }>;
    }
  > = {};

  allPeriods.forEach((d) => {
    const key = format(d, formatStr);
    periodsData[key] = {
      period: key,
      income: 0,
      expenses: 0,
      grossSalary: 0,
      categoryAggs: {},
    };
  });

  let totalPeriodIncome = 0;
  periodIncome.forEach((i) => {
    const key = format(new Date(i.date), formatStr);
    if (periodsData[key]) {
      periodsData[key].income += i.amount_ngn;
      if (i.income_type === "salary")
        periodsData[key].grossSalary += i.amount_ngn;
    }
    totalPeriodIncome += i.amount_ngn;
  });

  const fullPeriodCategoryAggs: Record<string, { total: number; tag: string }> =
    {};

  periodExpenses.forEach((e) => {
    const key = format(new Date(e.date), formatStr);
    if (periodsData[key]) {
      periodsData[key].expenses += e.amount_ngn;
      if (!periodsData[key].categoryAggs[e.category]) {
        periodsData[key].categoryAggs[e.category] = { total: 0, tag: e.tag };
      }
      periodsData[key].categoryAggs[e.category]!.total += e.amount_ngn;
    }

    if (!fullPeriodCategoryAggs[e.category]) {
      fullPeriodCategoryAggs[e.category] = { total: 0, tag: e.tag };
    }
    fullPeriodCategoryAggs[e.category]!.total += e.amount_ngn;
  });

  const taxBreakdown: TaxBreakdownData[] = [];
  const rentPerMonth = profile.monthly_rent_ngn ?? 0;
  const pensionRate = profile.pension_rate ?? 0.08;
  const nhfRate = profile.nhf_rate ?? 0.025;

  allPeriods.forEach((d) => {
    const key = format(d, formatStr);
    const md = periodsData[key];
    if (!md) return;

    // For daily intervals, pass 1 day of rent. For monthly, pass 1 month.
    const rentSlice =
      intervalType === "days" ? (rentPerMonth * 12) / 365.25 : rentPerMonth;

    const periodTaxable = computeTaxableProfit(
      md.income,
      md.categoryAggs,
      rentSlice,
      md.grossSalary,
      pensionRate,
      nhfRate,
    );

    const periodCIT = computeCIT(
      periodTaxable.taxableProfit,
      profile.annual_turnover_ngn,
      profile.fixed_assets_ngn,
    );

    const periodPIT =
      md.grossSalary > 0
        ? computePIT(
            md.grossSalary,
            periodTaxable.pensionDeduction,
            periodTaxable.nhfDeduction,
            rentSlice,
          )
        : null;

    let periodLabel = key;
    if (intervalType === "months" && !isMultiYear) {
      periodLabel = `${key} '${format(d, "yy")}`;
    }

    if (md.income > 0 || md.expenses > 0) {
      taxBreakdown.push({
        period: periodLabel,
        cit: periodCIT.cit,
        developmentLevy: periodCIT.developmentLevy,
        pit: periodPIT?.totalPIT ?? 0,
        total: periodCIT.total + (periodPIT?.totalPIT ?? 0),
      });
    } else {
      taxBreakdown.push({
        period: periodLabel,
        cit: 0,
        developmentLevy: 0,
        pit: 0,
        total: 0,
      });
    }
  });

  // Final full-period tax computation
  let fullGrossSalary = 0;
  periodIncome.forEach((i) => {
    if (i.income_type === "salary") fullGrossSalary += i.amount_ngn;
  });

  const scaleRatio = diffDays > 0 ? diffDays / 365.25 : 1 / 365.25;
  const scaledRent = rentPerMonth * 12 * scaleRatio;

  const taxableProfitResult = computeTaxableProfit(
    totalPeriodIncome,
    fullPeriodCategoryAggs,
    scaledRent,
    fullGrossSalary,
    pensionRate,
    nhfRate,
  );

  const citResult = computeCIT(
    taxableProfitResult.taxableProfit,
    profile.annual_turnover_ngn,
    profile.fixed_assets_ngn,
  );

  const pitResult =
    fullGrossSalary > 0
      ? computePIT(
          fullGrossSalary,
          taxableProfitResult.pensionDeduction,
          taxableProfitResult.nhfDeduction,
          scaledRent,
        )
      : null;

  let dividendIncome = 0;
  periodIncome.forEach((i) => {
    if (i.income_type === "dividend") dividendIncome += i.amount_ngn;
  });
  const dividendTax = computeDividendTax(dividendIncome);

  let cgt = 0;
  const totalTaxPayable =
    citResult.total + (pitResult?.totalPIT ?? 0) + cgt + dividendTax;

  const fullTaxResult: FullTaxLiabilityResult = {
    taxYear: now.getFullYear(),
    isSmallBusinessExempt: citResult.exempt,
    taxableProfit: taxableProfitResult,
    cit: citResult,
    pit: pitResult,
    cgt,
    dividendTax,
    totalTaxPayable,
    effectiveTaxRate:
      totalPeriodIncome > 0 ? totalTaxPayable / totalPeriodIncome : 0,
  };

  return {
    taxBreakdown,
    tax: fullTaxResult,
  };
}
