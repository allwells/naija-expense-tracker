"use client";

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { cn } from "@/lib/utils";

export type DatePreset =
  | "this_week"
  | "this_month"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "last_year"
  | "custom";

const getPresetRange = (
  preset: DatePreset,
): { from: Date; to: Date } | null => {
  const now = new Date();
  switch (preset) {
    case "this_week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_30_days":
      return { from: subDays(now, 30), to: now };
    case "last_90_days":
      return { from: subDays(now, 90), to: now };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "last_year": {
      const lastYr = subYears(now, 1);
      return { from: startOfYear(lastYr), to: endOfYear(lastYr) };
    }
    case "custom":
    default:
      return null;
  }
};

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const presetParam = searchParams.get("preset") as DatePreset | null;

  const activePreset: DatePreset =
    presetParam || (fromParam || toParam ? "custom" : "this_year");

  const [preset, setPreset] = useState<DatePreset>(activePreset);

  const [date, setDate] = useState<DateRange | undefined>({
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  });

  const hasFilters = Boolean(presetParam || fromParam || toParam);
  // Treat fromParam and toParam as one filter count
  const filterCount = hasFilters ? 1 : 0;

  /** Push a full set of filter params to the URL in one navigation call. */
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
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, searchParams, pathname],
  );

  const handlePresetChange = useCallback(
    (newPreset: DatePreset) => {
      setPreset(newPreset);
      if (newPreset !== "custom") {
        const range = getPresetRange(newPreset);
        if (range) {
          setDate(range);
          pushParams({
            preset: newPreset,
            from: format(range.from, "yyyy-MM-dd"),
            to: format(range.to, "yyyy-MM-dd"),
          });
        }
      } else {
        // Switch to custom, leave URL as is until they pick a date
        pushParams({
          preset: "custom",
        });
      }
    },
    [pushParams],
  );

  const handleDateSelect = useCallback(
    (range: DateRange | undefined) => {
      setDate(range); // instant UI update
      setPreset("custom"); // Ensure preset matches UI behavior
      // Build both params in a single push so neither overwrites the other
      pushParams({
        preset: "custom",
        from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
        to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
      });
    },
    [pushParams],
  );

  const clearAll = useCallback(() => {
    setDate(undefined);
    setPreset("this_year");
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

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
            <h4 className="font-medium leading-none">Filter Dashboard</h4>
            <p className="text-sm text-muted-foreground tracking-wide">
              Preview analytics by a specific date range.
            </p>
          </div>

          <div className="grid gap-4">
            {/* Range Preset Selector */}
            <div className="grid gap-2">
              <Label htmlFor="preset">Date Range</Label>
              <Select
                value={preset}
                onValueChange={(val) => handlePresetChange(val as DatePreset)}
              >
                <SelectTrigger id="preset" className="w-full">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                  <SelectItem value="last_30_days">Last 30 days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 days</SelectItem>
                  <SelectItem value="this_year">This year</SelectItem>
                  <SelectItem value="last_year">Last year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range (Hidden unless preset is 'custom') */}
            {preset === "custom" && (
              <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                <Label htmlFor="date">Custom Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal px-2",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <IconCalendar className="size-5 stroke-[1.5] text-muted-foreground shrink-0" />
                      {date?.from ? (
                        date.to ? (
                          <span className="truncate">
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                          </span>
                        ) : (
                          <span className="truncate">
                            {format(date.from, "LLL dd, y")}
                          </span>
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
            )}
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
