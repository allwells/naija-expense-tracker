"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  formatValue?: (value: number) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue, // Optional override
}: ChartTooltipProps) {
  const { format: formatAmount } = useCurrency();
  const format = formatValue ?? formatAmount;

  if (!active || !payload?.length) return null;

  return (
    <div className="border rounded-md bg-card text-card-foreground shadow-md p-3 min-w-40">
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {label}
        </p>
      )}
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-1.5">
            {entry.color && (
              <span
                className="inline-block h-2 w-2 rounded-sm border"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {entry.name.replace(/_/g, " ")}
            </span>
          </div>
          <span className="text-xs font-mono font-semibold">
            {format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
