"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip, ChartEmpty } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { DeductibleData } from "@/lib/analytics-service";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/format";

interface DeductiblesChartProps {
  data: DeductibleData[];
  className?: string;
}

export function DeductiblesChart({ data, className }: DeductiblesChartProps) {
  if (!data.length) {
    return (
      <Card className={cn("gap-2", className)}>
        <CardHeader className="px-4">
          <CardTitle className="text-base">Deductibles Breakdown</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartEmpty
            message="No expenses recorded to categorize."
            height={280}
          />
        </CardContent>
      </Card>
    );
  }

  // Calculate dynamic height based on number of categories to prevent squishing
  // Default minimum 240px, plus 40px per category above 5
  const chartHeight = Math.max(280, data.length * 40);

  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-base">Deductibles Breakdown</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="0"
              stroke="var(--border)"
              strokeWidth={2}
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={(v) => `₦${formatCompactNumber(v)}`}
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
              type="category"
              dataKey="category"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(v: string) =>
                v.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
              }
              // width={100}
              tickMargin={6}
              axisLine
              tickLine
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(v) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {v}
                </span>
              )}
            />
            <Line
              dataKey="deductible"
              stroke="transparent"
              dot={false}
              activeDot={false}
              legendType="none"
              tooltipType="none"
            />
            <Bar
              dataKey="deductible"
              fill="var(--chart-4)"
              name="Deductible"
              stackId="stack"
              radius={[0, 6, 6, 0]}
              maxBarSize={100}
            />
            <Bar
              dataKey="nonDeductible"
              fill="var(--chart-1)"
              name="Non-Deductible"
              stackId="stack"
              radius={[0, 6, 6, 0]}
              background={false}
              activeBar={{ fill: "var(--chart-1)" }}
              maxBarSize={100}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
