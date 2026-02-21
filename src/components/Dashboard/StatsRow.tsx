import { useCurrency } from "@/contexts/CurrencyContext";
import type { TrendStat } from "@/lib/analytics-service";
import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus,
  IconWallet,
  IconReceipt,
  IconBriefcase,
  IconFileInvoice,
  IconInfoCircle,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Card,
  CardContent,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  stat: TrendStat;
  icon: React.ElementType;
  presetText: { short: string; tooltip: string };
}

function StatsCard({ label, stat, icon: Icon, presetText }: StatsCardProps) {
  const { format: formatAmount } = useCurrency();
  const formattedValue = formatAmount(stat.value, true);

  let trendDisplay = "0.0%";
  let TrendIcon = IconMinus;
  let trendClass = "text-muted-foreground border-border";

  // When there's no previous data or exactly 0, it means neutral trend.
  if (stat.trendPercentage !== null && stat.trendPercentage !== 0) {
    const absVal = Math.abs(stat.trendPercentage).toFixed(1);
    const sign = stat.trendPercentage > 0 ? "+" : "-";

    // Choose arrow based solely on the mathematical direction (did the number go up or down?)
    TrendIcon =
      stat.trendPercentage > 0 ? IconArrowUpRight : IconArrowDownRight;

    // Some metrics (like income) are good when positive; some (like expenses, tax) are good when negative.
    // The analytics service computes `isPositive` based on the metric's semantic meaning.
    trendClass = stat.isPositive
      ? "text-emerald-600 dark:text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-800/30 border-emerald-600/30 dark:border-emerald-500/30"
      : "text-rose-600 dark:text-rose-500 font-medium bg-rose-50 dark:bg-rose-800/30 border-rose-600/30 dark:border-rose-500/30";

    trendDisplay = `${sign}${absVal}%`;
  } else {
    trendClass =
      "text-muted-foreground font-medium bg-secondary/50 border-border";
  }

  return (
    <Card className="border rounded-xl transition-all">
      <CardContent className="px-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground tracking-tight">
            {label}
          </p>

          <div className="p-1.5 bg-secondary/50 rounded-md">
            <Icon className="size-5 stroke-[1.4] text-muted-foreground" />
          </div>
        </div>

        <p className="text-[28px] leading-none font-bold font-mono tracking-tight text-foreground">
          {formattedValue}
        </p>

        <div className="flex items-center gap-1.5 mt-2">
          <div
            className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border",
              trendClass,
            )}
          >
            <TrendIcon className="size-3.5 stroke-[2.5]" />
            <span className="text-[11px] leading-tight font-mono">
              {trendDisplay}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {presetText.short}
            </span>

            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 stroke-[1.5] text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                </TooltipTrigger>

                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-50 text-xs"
                >
                  <p>{presetText.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsRowProps {
  stats: {
    totalIncome: TrendStat;
    totalExpenses: TrendStat;
    netProfit: TrendStat;
    netProfitAfterTax: TrendStat;
    taxLiability: TrendStat;
  };
  activePreset?: string;
}

const getPresetText = (
  preset: string | undefined,
): { short: string; tooltip: string } => {
  switch (preset) {
    case "this_month":
      return {
        short: "vs last month",
        tooltip:
          "Percentage change comparing this month's total against the preceding calendar month.",
      };
    case "this_week":
      return {
        short: "vs last week",
        tooltip: "Percentage change compared to the preceding calendar week.",
      };
    case "last_30_days":
      return {
        short: "vs prior 30 days",
        tooltip:
          "Percentage change compared to the 30-day period immediately before this one.",
      };
    case "last_90_days":
      return {
        short: "vs prior 90 days",
        tooltip:
          "Percentage change compared to the 90-day period immediately before this one.",
      };
    case "last_year":
      return {
        short: "vs previous year",
        tooltip: "Percentage change compared to the year before last.",
      };
    case "this_year":
    case "custom":
    default:
      return {
        short: "vs last year",
        tooltip:
          "Percentage change comparing this period against the equivalent period last year.",
      };
  }
};

export function StatsRow({ stats, activePreset }: StatsRowProps) {
  const presetText = getPresetText(activePreset);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        label="Income"
        stat={stats.totalIncome}
        icon={IconWallet}
        presetText={presetText}
      />
      <StatsCard
        label="Expenses"
        stat={stats.totalExpenses}
        icon={IconReceipt}
        presetText={presetText}
      />
      <StatsCard
        label="Gross Profit"
        stat={stats.netProfit}
        icon={IconBriefcase}
        presetText={presetText}
      />
      <StatsCard
        label="Net Profit"
        stat={stats.netProfitAfterTax}
        icon={IconWallet}
        presetText={presetText}
      />
    </div>
  );
}
