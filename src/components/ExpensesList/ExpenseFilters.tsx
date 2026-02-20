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
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";
import { cn } from "@/lib/utils";

export function ExpenseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Derive initial values from URL once on mount — then drive from local state
  const [category, setCategory] = useState<string>(
    searchParams.get("category") ?? "",
  );
  const [tag, setTag] = useState<string>(searchParams.get("tag") ?? "");

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const [date, setDate] = useState<DateRange | undefined>({
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  });

  const hasFilters = Boolean(category || tag || fromParam || toParam);
  // Treat fromParam and toParam as one filter count
  const dateFilterActive = Boolean(fromParam || toParam);
  const filterCount = [category, tag, dateFilterActive].filter(Boolean).length;

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
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      const next = value === "all" ? "" : value;
      setCategory(next); // instant UI update
      pushParams({ category: next || null });
    },
    [pushParams],
  );

  const handleTagChange = useCallback(
    (value: string) => {
      const next = value === "all" ? "" : value;
      setTag(next); // instant UI update
      pushParams({ tag: next || null });
    },
    [pushParams],
  );

  const handleDateSelect = useCallback(
    (range: DateRange | undefined) => {
      setDate(range); // instant UI update
      // Build both params in a single push so neither overwrites the other
      pushParams({
        from: range?.from ? format(range.from, "yyyy-MM-dd") : null,
        to: range?.to ? format(range.to, "yyyy-MM-dd") : null,
      });
    },
    [pushParams],
  );

  const clearAll = useCallback(() => {
    setCategory("");
    setTag("");
    setDate(undefined);
    startTransition(() => {
      router.push("/expenses");
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
            <h4 className="font-medium leading-none">Filter Expenses</h4>
            <p className="text-sm text-muted-foreground tracking-wide">
              Narrow down your view by date, category, or tag.
            </p>
          </div>

          <div className="grid gap-4">
            {/* Date Range */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date Range</Label>
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
                    <IconCalendar className="size-5 stroke-[1.5] text-muted-foreground" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
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

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category || "all"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category" className="w-full px-2.5">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(
                    Object.entries(EXPENSE_CATEGORY_LABELS) as [
                      string,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag */}
            <div className="grid gap-2">
              <Label htmlFor="tag">Tag</Label>
              <Select value={tag || "all"} onValueChange={handleTagChange}>
                <SelectTrigger id="tag" className="w-full px-2.5">
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {(
                    Object.entries(EXPENSE_TAG_LABELS) as [string, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
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
