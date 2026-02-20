"use client";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Badge,
} from "@/components/ui";
import { IconFilter, IconX, IconCalendar } from "@tabler/icons-react";
import { INCOME_TYPE_LABELS } from "@/types/income";
import { cn } from "@/lib/utils";

export function IncomeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [incomeType, setIncomeType] = useState<string>(
    searchParams.get("type") ?? "",
  );
  const [exportOnly, setExportOnly] = useState<string>(
    searchParams.get("export") ?? "",
  );

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const [date, setDate] = useState<DateRange | undefined>({
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  });

  const dateFilterActive = Boolean(fromParam || toParam);
  const filterCount = [incomeType, exportOnly, dateFilterActive].filter(
    Boolean,
  ).length;
  const hasFilters = filterCount > 0;

  const pushParams = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.delete("page");
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      const next = value === "all" ? "" : value;
      setIncomeType(next);
      pushParams({ type: next || null });
    },
    [pushParams],
  );

  const handleExportChange = useCallback(
    (value: string) => {
      const next = value === "all" ? "" : value;
      setExportOnly(next);
      pushParams({ export: next || null });
    },
    [pushParams],
  );

  const handleDateSelect = useCallback(
    (range: DateRange | undefined) => {
      setDate(range);
      pushParams({
        from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
        to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
      });
    },
    [pushParams],
  );

  const clearAll = useCallback(() => {
    setIncomeType("");
    setExportOnly("");
    setDate(undefined);
    startTransition(() => {
      router.push("/income");
    });
  }, [router]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed gap-2">
          <IconFilter className="size-4" />
          Filters
          {filterCount > 0 && (
            <Badge
              variant="secondary"
              className="px-1.5 h-5 rounded-sm font-normal lg:hidden"
            >
              {filterCount}
            </Badge>
          )}
          {filterCount > 0 && (
            <Badge
              variant="secondary"
              className="hidden lg:inline-flex px-1.5 h-5 rounded-sm font-normal"
            >
              {filterCount} active
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filter Income</h4>
            <p className="text-sm text-muted-foreground tracking-wide">
              Narrow down your view by date, type, or export status.
            </p>
          </div>

          <div className="grid gap-4">
            {/* Date Range */}
            <div className="grid gap-2">
              <Label htmlFor="income-date">Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="income-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal px-2",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <IconCalendar className="size-5 stroke-[1.5] text-muted-foreground" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} –{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Income Type */}
            <div className="grid gap-2">
              <Label htmlFor="income-type">Income Type</Label>
              <Select
                value={incomeType || "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="income-type" className="w-full px-2.5">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(
                    Object.entries(INCOME_TYPE_LABELS) as [string, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Income */}
            <div className="grid gap-2">
              <Label htmlFor="export-filter">Export Status</Label>
              <Select
                value={exportOnly || "all"}
                onValueChange={handleExportChange}
              >
                <SelectTrigger id="export-filter" className="w-full px-2.5">
                  <SelectValue placeholder="All income" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All income</SelectItem>
                  <SelectItem value="true">Export income only</SelectItem>
                  <SelectItem value="false">Non-export only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasFilters && (
            <Button
              size="xs"
              variant="ghost"
              className="w-fit"
              onClick={clearAll}
            >
              <IconX className="size-4" />
              Reset Filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
