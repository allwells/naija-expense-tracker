import { TaxSummaryPanel } from "./TaxSummaryPanel";
import { ProfitLossPanel } from "./ProfitLossPanel";
import type { ReportsData } from "@/lib/analytics-service";
import { TaxLiabilityBreakdownChart } from "./TaxLiabilityBreakdownChart";

interface ReportsClientProps {
  data: ReportsData;
}

export function ReportsClient({ data }: ReportsClientProps) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <TaxLiabilityBreakdownChart data={data.taxBreakdown} />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ProfitLossPanel taxData={data.tax} />
        <TaxSummaryPanel taxData={data.tax} />
      </div>
    </div>
  );
}
