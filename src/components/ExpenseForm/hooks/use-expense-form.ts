"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { createExpenseSchema } from "@/lib/schemas/expense";
import type { CreateExpenseSchema } from "@/lib/schemas/expense";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/app/actions/expense-actions";
import { formatNGN } from "@/lib/format";
import type { ExpenseRecord } from "@/types/expense";
import { EXPENSE_CATEGORY_LABELS } from "@/types/expense";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import type { Resolver, FieldValues } from "react-hook-form";

interface UseExpenseFormOptions {
  onSuccess: () => void;
  expense?: ExpenseRecord;
}

export function useExpenseForm({ onSuccess, expense }: UseExpenseFormOptions) {
  const isEditing = Boolean(expense);
  const { getRate } = useExchangeRates();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    expense?.receipt_url ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<CreateExpenseSchema>({
    resolver: zodResolver(
      createExpenseSchema,
    ) as unknown as Resolver<CreateExpenseSchema>,
    shouldUnregister: true,
    defaultValues: expense
      ? {
          date: expense.date,
          amount_ngn: expense.amount_ngn,
          original_amount: expense.original_amount ?? undefined,
          original_currency: expense.original_currency ?? "NGN",
          exchange_rate: expense.exchange_rate ?? 1,
          category: expense.category,
          tag: expense.tag,
          description: expense.description ?? "",
          notes: expense.notes ?? undefined,
          ocr_extracted: expense.ocr_extracted ?? false,
          ocr_amount: expense.ocr_amount ?? undefined,
          ocr_date: expense.ocr_date ?? undefined,
        }
      : {
          date: today,
          original_currency: "NGN",
          exchange_rate: 1,
          ocr_extracted: false,
          description: "",
          notes: undefined,
        },
  });

  // Re-populate form when expense changes (e.g. switching from view modal to info sheet)
  useEffect(() => {
    if (expense) {
      form.reset({
        date: expense.date,
        amount_ngn: expense.amount_ngn,
        original_amount: expense.original_amount ?? undefined,
        original_currency: expense.original_currency ?? "NGN",
        exchange_rate: expense.exchange_rate ?? 1,
        category: expense.category,
        tag: expense.tag,
        description: expense.description ?? "",
        notes: expense.notes ?? undefined,
        ocr_extracted: expense.ocr_extracted ?? false,
        ocr_amount: expense.ocr_amount ?? undefined,
        ocr_date: expense.ocr_date ?? undefined,
      });
      setReceiptPreviewUrl(expense.receipt_url ?? null);
    } else {
      form.reset({
        date: today,
        amount_ngn: undefined,
        original_amount: undefined,
        original_currency: "NGN",
        exchange_rate: 1,
        category: undefined,
        tag: undefined,
        description: "",
        notes: undefined,
        ocr_extracted: false,
        ocr_amount: undefined,
        ocr_date: undefined,
      });
      setReceiptPreviewUrl(null);
    }
  }, [expense, form, today]);

  // Auto-convert foreign currency → NGN when currency/amount changes
  const handleCurrencyChange = useCallback(
    (currency: string, originalAmount: number | undefined) => {
      if (!originalAmount || isNaN(originalAmount)) return;
      if (currency === "NGN") {
        form.setValue("amount_ngn", originalAmount, { shouldValidate: true });
        form.setValue("exchange_rate", 1);
        return;
      }
      const rate = getRate(currency);
      if (rate) {
        const converted = parseFloat((originalAmount * rate).toFixed(2));
        form.setValue("amount_ngn", converted, { shouldValidate: true });
        form.setValue("exchange_rate", rate);
      }
    },
    [form, getRate],
  );

  const clearReceipt = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreviewUrl(expense?.receipt_url ?? null);
  }, [expense?.receipt_url]);

  const onSelectReceipt = useCallback((file: File) => {
    setReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleSubmit = useCallback(
    async (values: CreateExpenseSchema) => {
      setIsSubmitting(true);

      try {
        const fd = new FormData();
        fd.append("fields", JSON.stringify(values));
        if (receiptFile) {
          fd.append("receipt", receiptFile);
        }

        let result;
        if (isEditing && expense) {
          const updateFd = new FormData();
          updateFd.append(
            "fields",
            JSON.stringify({ ...values, id: expense.id }),
          );
          if (receiptFile) updateFd.append("receipt", receiptFile);
          result = await updateExpenseAction(updateFd);
        } else {
          result = await createExpenseAction(fd);
        }

        if (result.error) {
          toast.error(isEditing ? "Expense not updated" : "Expense not saved", {
            description: result.error,
          });
          return;
        }

        const saved = result.data!;
        const categoryLabel =
          EXPENSE_CATEGORY_LABELS[
            saved.category as keyof typeof EXPENSE_CATEGORY_LABELS
          ] ?? saved.category;

        toast.success(isEditing ? "Expense updated" : "Expense recorded", {
          description: isEditing
            ? "Your changes have been saved."
            : `${formatNGN(saved.amount_ngn)} · ${categoryLabel} added successfully.`,
        });

        form.reset();
        clearReceipt();
        onSuccess();
      } catch {
        toast.error(isEditing ? "Expense not updated" : "Expense not saved", {
          description: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [expense, form, isEditing, onSuccess, clearReceipt, receiptFile],
  );

  return {
    form,
    isEditing,
    isSubmitting,
    receiptFile,
    receiptPreviewUrl,
    onSelectReceipt,
    clearReceipt,
    handleCurrencyChange,
    onSubmit: form.handleSubmit(
      handleSubmit as Parameters<typeof form.handleSubmit>[0],
    ),
  };
}
