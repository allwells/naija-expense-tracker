"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/chart-theme";
import { ChartTooltip, ChartEmpty } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { CategorySpendData } from "@/lib/analytics-service";

interface SpendByCategoryChartProps {
  data: CategorySpendData[];
  className?: string;
}

export function SpendByCategoryChart({
  data,
  className,
}: SpendByCategoryChartProps) {
  if (!data.length) {
    return (
      <Card className={cn("gap-2", className)}>
        <CardHeader className="px-4">
          <CardTitle className="text-base">Spend by Category</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartEmpty message="No expenses recorded this year." height={280} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-2", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-base">Spend by Category</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="90%"
              dataKey="total"
              nameKey="category"
              strokeWidth={2}
              stroke="var(--card)"
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
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
