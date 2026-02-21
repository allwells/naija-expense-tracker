import { useCurrency } from "@/contexts/CurrencyContext";
import type { FullTaxLiabilityResult } from "@/lib/tax-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

import { cn } from "@/lib/utils";

interface TaxStatusCardProps {
  taxData: FullTaxLiabilityResult | null;
  className?: string;
}

export function TaxStatusCard({ taxData, className }: TaxStatusCardProps) {
  const { format: formatAmount } = useCurrency();

  if (!taxData) return null;

  const isExempt = taxData.isSmallBusinessExempt;

  return (
    <Card className={cn("gap-2 justify-between", className)}>
      <CardHeader className="px-4">
        <CardTitle className="text-base">
          {taxData.taxYear} Tax Status
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <p className="text-3xl font-bold font-mono">
            {formatAmount(taxData.totalTaxPayable)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total estimated tax across all streams
          </p>
        </div>

        <div
          className={cn(
            "p-3 border rounded-md flex items-start gap-2",
            isExempt
              ? "bg-green-50/50 border-green-200 text-green-900 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-300"
              : "bg-amber-50/50 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300",
          )}
        >
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold leading-tight">
              {isExempt ? "CIT Exempt" : "CIT Liable"}
            </span>
            <p className="text-xs opacity-90 leading-tight">
              {isExempt
                ? `Turnover ${formatAmount(taxData.cit.annualTurnover, true)} ≤ ${formatAmount(100_000_000, true)} and Fixed Assets ${formatAmount(taxData.cit.fixedAssets, true)} ≤ ${formatAmount(250_000_000, true)} — exempt under 2026 Tax Reform Act`
                : "Exceeds small business threshold — CIT @ 30% + Development Levy @ 4%"}
            </p>
          </div>
        </div>

        {!isExempt && taxData.effectiveTaxRate > 0 && (
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            Effective Tax Rate: {(taxData.effectiveTaxRate * 100).toFixed(1)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
