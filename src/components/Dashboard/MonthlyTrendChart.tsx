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
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/format";
import { ChartTooltip, ChartEmpty } from "@/components/shared";
import type { MonthlyTrendData } from "@/lib/analytics-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  className?: string;
}

export function MonthlyTrendChart({ data, className }: MonthlyTrendChartProps) {
  const { symbol, convert } = useCurrency();
  // If no income and no expenses for the whole year, show empty state
  const hasData = data.some((m) => m.income > 0 || m.expenses > 0);

  if (!hasData) {
    return (
      <Card className={cn("gap-2", className)}>
        <CardHeader className="px-4">
          <CardTitle className="text-base">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartEmpty
            message="No financial data recorded in the selected period."
            height={280}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              strokeWidth={2}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              tickMargin={6}
              axisLine
              tickLine
            />
            <YAxis
              tickFormatter={(v) =>
                `${symbol}${formatCompactNumber(convert(v))}`
              }
              tick={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fill: "var(--muted-foreground)",
              }}
              width={48}
              tickMargin={6}
              axisLine
              tickLine
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconSize={9}
              iconType="circle"
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
              maxBarSize={100}
              radius={[6, 6, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--chart-2)"
              strokeWidth={1.5}
              dot={{ fill: "var(--chart-2)", r: 0, strokeWidth: 0 }}
              name="Income"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
