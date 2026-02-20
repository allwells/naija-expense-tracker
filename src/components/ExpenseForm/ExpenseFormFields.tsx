"use client";

import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, Textarea } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { IconCalendar, IconLoader2 } from "@tabler/icons-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORY_LABELS, EXPENSE_TAG_LABELS } from "@/types/expense";
import { ReceiptUploader } from "./ReceiptUploader";
import { OcrScanner } from "./OcrScanner";
import type { UseFormReturn } from "react-hook-form";
import type { CreateExpenseSchema } from "@/lib/schemas/expense";
import type { OcrResult, OcrStatus } from "./hooks/use-ocr";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"] as const;

interface ExpenseFormFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CreateExpenseSchema, any, CreateExpenseSchema>;
  isSubmitting: boolean;
  isEditing: boolean;
  receiptPreviewUrl: string | null;
  ocrStatus: OcrStatus;
  ocrProgress: number;
  ocrResult: OcrResult | null;
  onFileSelect: (file: File) => void;
  onOcrStart: (file: File) => void;
  onClearReceipt: () => void;
  onCurrencyChange: (
    currency: string,
    originalAmount: number | undefined,
  ) => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onCancel: () => void;
}

export function ExpenseFormFields({
  form,
  isSubmitting,
  isEditing,
  receiptPreviewUrl,
  ocrStatus,
  ocrProgress,
  ocrResult,
  onFileSelect,
  onOcrStart,
  onClearReceipt,
  onCurrencyChange,
  onSubmit,
  onCancel,
}: ExpenseFormFieldsProps) {
  const watchedCurrency = form.watch("original_currency");
  const watchedOriginalAmount = form.watch("original_amount");

  // Auto-convert when either currency or original amount changes
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
                        field.onChange(date.toISOString().split("T")[0]);
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

        {/* Currency + Original Amount */}
        <div className="grid grid-cols-4 gap-4">
          <div className="w-full grid col-span-1">
            <FormField
              control={form.control}
              name="original_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={field.value ?? "NGN"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="NGN" />
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

          <div className="w-full grid col-span-3">
            <FormField
              control={form.control}
              name="original_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="font-mono"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : parseFloat(e.target.value),
                        )
                      }
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
              <FormLabel>Amount (₦ NGN)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 leading-none top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm pointer-events-none">
                    ₦
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7 font-mono"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* OCR Suggestions */}
        <OcrScanner
          status={ocrStatus}
          progress={ocrProgress}
          result={ocrResult}
          onAcceptAmount={(amount) => {
            form.setValue("amount_ngn", amount, { shouldValidate: true });
            form.setValue("ocr_amount", amount);
            form.setValue("ocr_extracted", true);
          }}
          onAcceptDate={(date) => {
            form.setValue("date", date, { shouldValidate: true });
            form.setValue("ocr_date", date);
            form.setValue("ocr_extracted", true);
          }}
        />

        <div className="w-full grid grid-cols-2 gap-4">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tag */}
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.entries(EXPENSE_TAG_LABELS) as [string, string][]
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
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Uber to client meeting"
                  className="resize-none min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes (optional) */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notes{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  className="resize-none min-h-20"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Receipt Upload */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Receipt{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </p>
          <ReceiptUploader
            previewUrl={receiptPreviewUrl}
            onFileSelect={onFileSelect}
            onClear={onClearReceipt}
            onOcrStart={onOcrStart}
          />
        </div>

        {/* Actions */}
        <div className="w-fit grid grid-cols-2 gap-2 mt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
            {isEditing ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
