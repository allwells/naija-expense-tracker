"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Button,
} from "@/components/ui";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useEffect, useState } from "react";
import { INCOME_TYPE_LABELS } from "@/types/income";
import type { UseFormReturn } from "react-hook-form";
import { IconCalendar, IconLoader2 } from "@tabler/icons-react";
import type { CreateIncomeSchema } from "@/lib/schemas/income";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;

interface IncomeFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CreateIncomeSchema, any, CreateIncomeSchema>;
  isSubmitting: boolean;
  isEditing: boolean;
  onCurrencyChange: (
    currency: string,
    originalAmount: number | undefined,
  ) => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onCancel: () => void;
}

interface FormattedAmountInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  prefix?: string;
}

function FormattedAmountInput({
  value,
  onChange,
  placeholder = "0.00",
  prefix,
}: FormattedAmountInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : "",
  );

  useEffect(() => {
    const numericInternal = parseFloat(displayValue.replace(/,/g, ""));
    if (value !== numericInternal) {
      setDisplayValue(
        value !== undefined && value !== null
          ? value.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : "",
      );
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/[^\d.,]/g, "");
    if ((cleanVal.match(/\./g) || []).length > 1) return;
    setDisplayValue(cleanVal);
    const numeric = parseFloat(cleanVal.replace(/,/g, ""));
    onChange(isNaN(numeric) ? undefined : numeric);
  };

  const handleBlur = () => {
    const numeric = parseFloat(displayValue.replace(/,/g, ""));
    if (!isNaN(numeric)) {
      setDisplayValue(
        numeric.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }),
      );
      onChange(numeric);
    } else {
      setDisplayValue("");
      onChange(undefined);
    }
  };

  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-3 leading-none top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        className={cn("font-mono", prefix && "pl-7")}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
}

export function IncomeFormFields({
  form,
  isSubmitting,
  isEditing,
  onCurrencyChange,
  onSubmit,
  onCancel,
}: IncomeFormFieldsProps) {
  const { currency } = useCurrency();
  const watchedCurrency = form.watch("original_currency");
  const watchedOriginalAmount = form.watch("original_amount");

  useEffect(() => {
    if (
      watchedCurrency &&
      watchedOriginalAmount !== undefined &&
      watchedOriginalAmount > 0
    ) {
      onCurrencyChange(watchedCurrency, watchedOriginalAmount);
    }
  }, [watchedCurrency, watchedOriginalAmount, onCurrencyChange]);

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 overflow-y-auto pb-4"
      >
        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "justify-start gap-2 font-normal px-2.5",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <IconCalendar className="size-5 stroke-[1.4] text-muted-foreground shrink-0" />
                      {field.value
                        ? format(new Date(field.value), "MMMM d, yyyy")
                        : "Pick a date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, "yyyy-MM-dd"));
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Source */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Client A, Acme Corp, My Employer"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Income Type */}
        <FormField
          control={form.control}
          name="income_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Income Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select income type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(
                    Object.entries(INCOME_TYPE_LABELS) as [string, string][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency + Original Amount */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1">
            <FormField
              control={form.control}
              name="original_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value ?? currency}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={currency} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-span-3">
            <FormField
              control={form.control}
              name="original_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <FormattedAmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* NGN Amount */}
        <FormField
          control={form.control}
          name="amount_ngn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Equivalent (₦ NGN)</FormLabel>
              <FormControl>
                <FormattedAmountInput
                  value={field.value}
                  onChange={field.onChange}
                  prefix="₦"
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Export Income Toggle */}
        <FormField
          control={form.control}
          name="is_export_income"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 border rounded-md p-3">
              <div>
                <FormLabel className="text-sm font-medium leading-none">
                  Export Income
                </FormLabel>
                <FormLabel className="text-xs text-muted-foreground mt-1.5">
                  Exempt from CGT under the 2026 Tax Reform Act
                </FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Description (optional) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Payment for October invoice #045"
                  className="resize-none min-h-20"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="w-fit grid grid-cols-2 gap-2 mt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
            {isEditing ? "Save changes" : "Add income"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
