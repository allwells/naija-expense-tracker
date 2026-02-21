"use client";

import { StatsRow } from "./StatsRow";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { SpendByCategoryChart } from "./SpendByCategoryChart";
import { DeductiblesChart } from "./DeductiblesChart";
import { TaxStatusCard } from "./TaxStatusCard";
import type { DashboardData } from "@/lib/analytics-service";

interface DashboardProps {
  data: DashboardData;
  activePreset?: string;
}

export function DashboardClient({ data, activePreset }: DashboardProps) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <StatsRow stats={data.stats} activePreset={activePreset} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={data.monthlyTrends} className="h-full" />
        </div>
        <div className="lg:col-span-1">
          <TaxStatusCard taxData={data.tax} className="h-full" />
        </div>
        <div className="lg:col-span-1">
          <SpendByCategoryChart
            data={data.spendByCategory}
            className="h-full"
          />
        </div>
        <div className="lg:col-span-2">
          <DeductiblesChart data={data.deductibles} className="h-full" />
        </div>
      </div>
    </div>
  );
}
