"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@/components/ui";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconScale,
  IconReceiptTax,
  IconWallet,
  IconArrowRight,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { FullTaxLiabilityResult } from "@/lib/tax-engine";

interface ProfitLossPanelProps {
  taxData: FullTaxLiabilityResult | null;
}

export function ProfitLossPanel({ taxData }: ProfitLossPanelProps) {
  const { format: formatAmount } = useCurrency();

  if (!taxData) {
    return (
      <Card className="transition-all p-0 gap-0 h-full border rounded-xl text-muted-foreground">
        <CardHeader className="px-4 pt-4 pb-2 bg-muted/30 border-b border-border/50">
          <CardTitle className="text-base leading-none font-medium flex items-center gap-2">
            <IconScale className="size-5.5" />
            Profit & Loss Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 flex flex-col items-center h-full justify-center text-center p-8">
          <IconInfoCircle className="size-8 stroke-[1.3] mb-3" />
          <p className="md:text-base text-sm">No tax data available.</p>
        </CardContent>
      </Card>
    );
  }

  const t = taxData.taxableProfit;
  const netAfterTax =
    t.totalIncome - t.totalDeductibleExpenses - taxData.totalTaxPayable;

  return (
    <Card className="transition-all p-0 gap-0 h-full border rounded-xl">
      <CardHeader className="px-4 pt-4 pb-2 bg-muted/30 border-b border-border/50">
        <CardTitle className="text-base leading-none flex items-center gap-2">
          <IconScale className="size-5.5 text-primary" />
          Profit & Loss Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 flex-1 pb-0 flex flex-col">
        {/* Gross Income */}
        <div className="p-4">
          <div className="flex items-center justify-between bg-emerald-100 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-900/50 rounded-md">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
              <IconTrendingUp className="w-5 h-5" />
              <span className="font-semibold text-sm">Gross Income</span>
            </div>

            <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300">
              {formatAmount(t.totalIncome, t.totalIncome > 100_000_000)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Deductions */}
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 mb-4 text-foreground">
            <IconTrendingDown className="w-4 h-4" />
            <h4 className="font-semibold text-sm uppercase tracking-wider">
              Allowable Deductions
            </h4>
          </div>

          <div className="space-y-3 text-sm">
            {t.itemizedDeductions.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IconArrowRight className="w-3 h-3 opacity-50" />
                  <span className="capitalize">
                    {d.label.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="font-mono">
                  {formatAmount(d.amount, d.amount > 100_000_000)}
                </span>
              </div>
            ))}

            {t.pensionDeduction > 0 && (
              <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  <IconArrowRight className="w-3 h-3 opacity-50" />
                  <span>Pension Contribution</span>
                </div>
                <span className="font-mono">
                  {formatAmount(
                    t.pensionDeduction,
                    t.pensionDeduction > 100_000_000,
                  )}
                </span>
              </div>
            )}

            {t.nhfDeduction > 0 && (
              <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  <IconArrowRight className="w-3 h-3 opacity-50" />
                  <span>NHF Contribution</span>
                </div>
                <span className="font-mono">
                  {formatAmount(t.nhfDeduction, t.nhfDeduction > 100_000_000)}
                </span>
              </div>
            )}

            {t.rentRelief > 0 && (
              <div className="flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors">
                <div className="flex items-center gap-2">
                  <IconArrowRight className="w-3 h-3 opacity-50" />
                  <span>Rent Relief</span>
                </div>
                <span className="font-mono">
                  {formatAmount(t.rentRelief, t.rentRelief > 100_000_000)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold pt-3 mt-3 border-t border-dashed">
              <span>Total Deductions</span>
              <span className="font-mono text-destructive">
                -
                {formatAmount(
                  t.totalDeductions,
                  t.totalDeductions > 100_000_000,
                )}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Taxable Profit & Tax Payable */}
        <div className="p-4 bg-muted/20 space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">Taxable Profit</span>
            <span className="font-mono font-bold">
              {formatAmount(t.taxableProfit, t.taxableProfit > 100_000_000)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-destructive">
              <IconReceiptTax className="size-4.5" />
              <span className="font-semibold">Tax Payable</span>
            </div>
            <span className="font-mono text-destructive font-bold">
              -
              {formatAmount(
                taxData.totalTaxPayable,
                taxData.totalTaxPayable > 100_000_000,
              )}
            </span>
          </div>
        </div>

        <Separator />

        {/* Net After Tax */}
        <div className="p-4 bg-primary/5 dark:bg-primary/10">
          <div className="flex items-center justify-between font-bold text-primary">
            <div className="flex items-center gap-2">
              <IconWallet className="xs:size-6 size-5 shrink-0" />
              <span className="xs:text-lg text-base">Net Profit</span>
            </div>
            <span className="xs:text-xl text-lg font-mono">
              {formatAmount(netAfterTax, netAfterTax > 100_000_000)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
