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
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { ChartEmpty } from "@/components/shared/ChartEmpty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaxBreakdownData } from "@/lib/analytics-service";
import { formatCompactNumber } from "@/lib/format";

import { useCurrency } from "@/contexts/CurrencyContext";

interface TaxLiabilityBreakdownChartProps {
  data: TaxBreakdownData[];
  className?: string;
}

export function TaxLiabilityBreakdownChart({
  data,
  className,
}: TaxLiabilityBreakdownChartProps) {
  const { symbol, convert } = useCurrency();
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <Card className={cn("gap-2", className)}>
        <CardHeader className="px-4">
          <CardTitle className="text-base">Tax Liability Breakdown</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartEmpty
            message="No tax liability generated in the selected period."
            height={280}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-base">Tax Liability Breakdown</CardTitle>
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
              dataKey="period"
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
              iconSize={8}
              iconType="circle"
              formatter={(v) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {v}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="cit"
              stroke="var(--chart-3)"
              name="CIT (30%)"
              strokeWidth={1.5}
              dot={{ fill: "var(--chart-3)", r: 0, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="developmentLevy"
              stroke="var(--chart-5)"
              name="Dev. Levy (4%)"
              strokeWidth={1.5}
              dot={{ fill: "var(--chart-5)", r: 0, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="pit"
              stroke="var(--chart-1)"
              name="PIT"
              strokeWidth={1.5}
              dot={{ fill: "var(--chart-1)", r: 0, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
