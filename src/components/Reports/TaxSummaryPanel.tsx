"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@/components/ui";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { FullTaxLiabilityResult } from "@/lib/tax-engine";
import {
  IconBuildingBank,
  IconUser,
  IconCash,
  IconReceiptTax,
  IconInfoCircle,
  IconReportMoney,
  IconArrowRight,
} from "@tabler/icons-react";

interface TaxSummaryPanelProps {
  taxData: FullTaxLiabilityResult | null;
}

export function TaxSummaryPanel({ taxData }: TaxSummaryPanelProps) {
  const { format: formatAmount } = useCurrency();

  if (!taxData) {
    return (
      <Card className="transition-all p-0 gap-0 h-full border rounded-xl">
        <CardHeader className="p-4 bg-muted/30 border-b border-border/50">
          <CardTitle className="text-base leading-none font-medium flex items-center gap-2">
            <IconReceiptTax className="size-5 text-muted-foreground" />
            Full Year Tax Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
          <IconInfoCircle className="size-8 mb-3 opacity-50" />
          <p className="text-sm">No tax data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all p-0 gap-0 h-full border rounded-xl">
      <CardHeader className="p-4 bg-muted/30 border-b border-border/50">
        <CardTitle className="text-base leading-none flex items-center gap-2">
          <IconReportMoney className="size-5 text-primary" />
          {taxData.taxYear} Official Tax Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 flex-1 pb-0 flex flex-col">
        {/* Corporate Income Tax */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 text-foreground">
            <IconBuildingBank className="w-4 h-4" />
            <h4 className="font-semibold text-sm uppercase tracking-wider">
              Company Taxes
            </h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm items-center">
              <div className="flex flex-col">
                <span className="font-medium">Company Income Tax (CIT)</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <IconInfoCircle className="size-3" />
                  {taxData.isSmallBusinessExempt
                    ? taxData.cit.reason
                    : "Standard 30% rate"}
                </span>
              </div>
              <span className="font-mono font-bold tracking-tight">
                {formatAmount(taxData.cit.cit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <IconArrowRight className="size-3 opacity-50" />
                <span>Development Levy (4%)</span>
              </div>
              <span className="font-mono">
                {formatAmount(taxData.cit.developmentLevy)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-3 mt-3 border-t border-dashed text-sm">
              <span>Total Corporate Tax</span>
              <span className="font-mono">
                {formatAmount(taxData.cit.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Income Tax (if any) */}
        {taxData.pit && taxData.pit.totalPIT > 0 && (
          <>
            <Separator />
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
                <IconUser className="w-4 h-4" />
                <h4 className="font-semibold text-sm uppercase tracking-wider">
                  Personal Income Tax (PIT)
                </h4>
              </div>
              <div className="space-y-3 text-sm">
                {taxData.pit.bracketBreakdown.map((bracket, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      <IconArrowRight className="size-3 opacity-50" />
                      <span>
                        {bracket.bracket} @ {(bracket.rate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                      {formatAmount(bracket.tax)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-3 mt-3 border-t border-dashed">
                  <span>Total Personal Tax</span>
                  <span className="font-mono">
                    {formatAmount(taxData.pit.totalPIT)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Other Taxes */}
        <Separator />
        <div className="p-4 flex-1 bg-muted/5">
          <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
            <IconCash className="w-4 h-4" />
            <h4 className="font-semibold text-sm uppercase tracking-wider">
              Other Taxes
            </h4>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <IconArrowRight className="size-3 opacity-50" />
                <span>Capital Gains Tax (CGT)</span>
              </div>
              <span className="font-mono">{formatAmount(taxData.cgt)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
              <div className="flex items-center gap-2">
                <IconArrowRight className="size-3 opacity-50" />
                <span>Dividend Tax (10%)</span>
              </div>
              <span className="font-mono">
                {formatAmount(taxData.dividendTax)}
              </span>
            </div>
          </div>
        </div>

        <Separator className="bg-destructive/15" />

        {/* Grand Total */}
        <div className="p-4 bg-destructive/5 dark:bg-destructive/8">
          <div className="flex justify-between items-center text-destructive">
            <div className="flex items-center gap-2">
              <IconReceiptTax className="size-6" />
              <span className="text-lg font-bold">Total Est. Tax</span>
            </div>
            <div className="space-y-1">
              <span className="text-xl font-mono font-bold leading-none">
                {formatAmount(taxData.totalTaxPayable)}
              </span>

              {taxData.effectiveTaxRate > 0 && (
                <p className="text-xs text-destructive/80 text-right font-medium">
                  Blended Effective Rate:{" "}
                  {(taxData.effectiveTaxRate * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
