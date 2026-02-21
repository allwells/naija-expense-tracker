import { TaxSummaryPanel } from "./TaxSummaryPanel";
import { ProfitLossPanel } from "./ProfitLossPanel";
import { ReportsFilters } from "./ReportsFilters";
import { ExportPanel } from "@/components/ExportPanel";
import type { ReportsData } from "@/lib/analytics-service";
import { TaxLiabilityBreakdownChart } from "./TaxLiabilityBreakdownChart";

interface ReportsClientProps {
  data: ReportsData;
}

export function ReportsClient({ data }: ReportsClientProps) {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex w-full items-center justify-end gap-2">
        <ReportsFilters />
        <ExportPanel />
      </div>

      <TaxLiabilityBreakdownChart data={data.taxBreakdown} />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ProfitLossPanel taxData={data.tax} />
        <TaxSummaryPanel taxData={data.tax} />
      </div>
    </div>
  );
}
