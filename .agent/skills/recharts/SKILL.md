---
name: recharts
description: Recharts chart implementations for NaijaExpense dashboards and reports. Use when building SpendByCategoryChart (donut), MonthlyTrendChart (bar + line combo), TaxLiabilityBreakdownChart (stacked bar), DeductiblesChart (pie), or any data visualisation in the app. Contains chart component patterns, custom tooltip styling with the Shadcn theme (2px borders, 0px radius, Geist mono for numbers), responsive container usage, colour palette from CSS chart variables, and currency-formatted axis/tooltip helpers.
---

# SKILL: Recharts — NaijaExpense Charts

## Package

Recharts is already a Recharts-compatible peer of Shadcn/ui. Use it directly — no wrapper library needed.

```bash
bun add recharts
```

## Theme Integration

Always pull colours from the CSS chart variables defined in `globals.css`, never hardcode hex values:

```typescript
// src/lib/chart-theme.ts
export const CHART_COLORS = {
  chart1: "var(--chart-1)", // orange — primary spend
  chart2: "var(--chart-2)", // teal — income
  chart3: "var(--chart-3)", // blue — tax
  chart4: "var(--chart-4)", // yellow — deductible
  chart5: "var(--chart-5)", // amber — non-deductible
  muted: "var(--muted-foreground)",
  border: "var(--border)",
  background: "var(--card)",
  foreground: "var(--card-foreground)",
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  office_supplies: "var(--chart-1)",
  travel: "var(--chart-2)",
  meals_entertainment: "var(--chart-3)",
  software_subscriptions: "var(--chart-4)",
  equipment: "var(--chart-5)",
  rent: "var(--chart-1)",
  utilities: "var(--chart-2)",
  salaries: "var(--chart-3)",
  marketing: "var(--chart-4)",
  professional_services: "var(--chart-5)",
  bank_charges: "var(--chart-1)",
  insurance: "var(--chart-2)",
  repairs_maintenance: "var(--chart-3)",
  fuel: "var(--chart-4)",
  airtime_internet: "var(--chart-5)",
  other: "var(--muted-foreground)",
};
```

## Custom Tooltip (Shared)

All charts share one tooltip component styled to match the Shadcn theme:

```tsx
// src/components/Shared/ChartTooltip.tsx
import { formatNGN } from "@/lib/format";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatValue?: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = formatNGN,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border-2 border-border bg-card text-card-foreground shadow-md p-3 min-w-[160px]">
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {label}
        </p>
      )}
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {entry.name.replace(/_/g, " ")}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold">
            {formatValue(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Chart 1: SpendByCategoryChart (Donut)

Used on the Dashboard. Shows spend breakdown by category.

```tsx
// src/components/Dashboard/SpendByCategoryChart.tsx
"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/Shared/ChartTooltip";
import { CATEGORY_COLORS } from "@/lib/chart-theme";
import { formatNGN } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  category: string;
  total: number;
}

interface SpendByCategoryChartProps {
  data: CategoryData[];
}

export function SpendByCategoryChart({ data }: SpendByCategoryChartProps) {
  if (!data.length) return null;

  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Spend by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="75%"
              dataKey="total"
              nameKey="category"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={
                    CATEGORY_COLORS[entry.category] ?? "var(--muted-foreground)"
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {value.replace(/_/g, " ")}
                </span>
              )}
              iconSize={8}
              iconType="square"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Chart 2: MonthlyTrendChart (Bar + Line Combo)

Shows income (line) vs expenses (bar) per month. Core dashboard chart.

```tsx
// src/components/Dashboard/MonthlyTrendChart.tsx
"use client";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "@/components/Shared/ChartTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNGN } from "@/lib/format";

interface MonthlyData {
  month: string; // e.g. "Jan", "Feb"
  income: number;
  expenses: number;
  profit: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Income vs Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              strokeWidth={1}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`}
              tick={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconSize={8}
              iconType="square"
              formatter={(v) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {v}
                </span>
              )}
            />
            <Bar
              dataKey="expenses"
              fill="var(--chart-1)"
              name="Expenses"
              maxBarSize={40}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-2)", r: 3, strokeWidth: 0 }}
              name="Income"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Chart 3: TaxLiabilityBreakdownChart (Stacked Bar)

Used on Reports page. Stacks CIT, Development Levy, PIT components.

```tsx
// src/components/Reports/TaxLiabilityBreakdownChart.tsx
"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaxBreakdownData {
  period: string; // e.g. "Jan 2026"
  cit: number;
  developmentLevy: number;
  pit: number;
}

export function TaxLiabilityBreakdownChart({
  data,
}: {
  data: TaxBreakdownData[];
}) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Tax Liability Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              strokeWidth={1}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tick={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`}
              tick={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconSize={8} iconType="square" />
            <Bar
              dataKey="cit"
              fill="var(--chart-3)"
              name="CIT (30%)"
              stackId="tax"
            />
            <Bar
              dataKey="developmentLevy"
              fill="var(--chart-5)"
              name="Dev. Levy (4%)"
              stackId="tax"
            />
            <Bar
              dataKey="pit"
              fill="var(--chart-1)"
              name="PIT"
              stackId="tax"
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Chart 4: DeductiblesVsNonDeductiblesChart (Horizontal Bar)

Shows deductible vs non-deductible per category. Clean horizontal layout for readability.

```tsx
// src/components/Dashboard/DeductiblesChart.tsx
"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface DeductibleData {
  category: string;
  deductible: number;
  nonDeductible: number;
}

export function DeductiblesChart({ data }: { data: DeductibleData[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="0"
          stroke="var(--border)"
          strokeWidth={1}
          horizontal={false}
        />
        <XAxis
          type="number"
          tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}K`}
          tick={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fill: "var(--muted-foreground)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: string) => v.replace(/_/g, " ")}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey="deductible"
          fill="var(--chart-4)"
          name="Deductible"
          stackId="stack"
        />
        <Bar
          dataKey="nonDeductible"
          fill="var(--chart-1)"
          name="Non-Deductible"
          stackId="stack"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## Data Preparation Patterns

The page-level component or server action should prepare chart-ready data:

```typescript
// Aggregate expenses by month for MonthlyTrendChart
export function aggregateByMonth(
  expenses: ExpenseRecord[],
  income: IncomeRecord[],
): MonthlyData[] {
  const months: Record<string, MonthlyData> = {};

  for (const e of expenses) {
    const key = format(new Date(e.date), "MMM");
    if (!months[key])
      months[key] = { month: key, income: 0, expenses: 0, profit: 0 };
    months[key].expenses += e.amount_ngn;
  }
  for (const i of income) {
    const key = format(new Date(i.date), "MMM");
    if (!months[key])
      months[key] = { month: key, income: 0, expenses: 0, profit: 0 };
    months[key].income += i.amount_ngn;
  }
  for (const m of Object.values(months)) {
    m.profit = m.income - m.expenses;
  }

  // Return sorted Jan → Dec
  const monthOrder = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return monthOrder.filter((m) => months[m]).map((m) => months[m]);
}

// Aggregate expenses by category for SpendByCategoryChart
export function aggregateByCategory(expenses: ExpenseRecord[]): CategoryData[] {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = (totals[e.category] ?? 0) + e.amount_ngn;
  }
  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}
```

## Responsive Rules

- All charts use `<ResponsiveContainer width="100%" height={N}>` — never fixed widths
- On mobile (`< md`), reduce chart height: use `height={200}` on mobile, `height={280}` on desktop
  ```tsx
  const isMobile = useMediaQuery('(max-width: 768px)');
  <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
  ```
- Legend goes below chart on mobile (default), beside on desktop if space allows
- Donut chart inner label: show total in center using a custom label component

## Loading Skeleton for Charts

Every chart component must export a skeleton:

```tsx
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full" style={{ height }} />;
}
```

## Empty State for Charts

```tsx
export function ChartEmpty({
  message = "No data for this period",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-border">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```
