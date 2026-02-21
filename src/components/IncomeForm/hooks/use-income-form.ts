"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createIncomeSchema } from "@/lib/schemas/income";
import type { CreateIncomeSchema } from "@/lib/schemas/income";
import {
  createIncomeAction,
  updateIncomeAction,
} from "@/app/actions/income-actions";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { IncomeRecord } from "@/types/income";
import { INCOME_TYPE_LABELS } from "@/types/income";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import type { Resolver } from "react-hook-form";

interface UseIncomeFormOptions {
  open: boolean;
  onSuccess: () => void;
  income?: IncomeRecord;
}

export function useIncomeForm({
  open,
  onSuccess,
  income,
}: UseIncomeFormOptions) {
  const isEditing = Boolean(income);
  const { getRate } = useExchangeRates();
  const { currency, format: formatAmount } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emptyDefaults: CreateIncomeSchema = {
    date: format(new Date(), "yyyy-MM-dd"),
    amount_ngn: undefined as unknown as number,
    original_amount: undefined as unknown as number,
    original_currency: currency,
    exchange_rate: 1,
    income_type: undefined as unknown as any,
    is_export_income: false,
    source: "",
    description: "",
  };

  const form = useForm<CreateIncomeSchema>({
    resolver: zodResolver(
      createIncomeSchema,
    ) as unknown as Resolver<CreateIncomeSchema>,
    defaultValues: emptyDefaults,
  });

  // Re-populate form when income record changes
  useEffect(() => {
    if (!open) return; // Only process on open so we don't clear while closing

    if (income) {
      form.reset({
        date: income.date,
        amount_ngn: income.amount_ngn,
        original_amount: income.original_amount ?? undefined,
        original_currency: income.original_currency ?? "NGN",
        exchange_rate: income.exchange_rate ?? 1,
        source: income.source,
        income_type: income.income_type,
        description: income.description ?? "",
        is_export_income: income.is_export_income,
      });
    } else {
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        amount_ngn: undefined as unknown as number,
        original_amount: undefined as unknown as number,
        original_currency: currency,
        exchange_rate: 1,
        income_type: undefined as unknown as any,
        is_export_income: false,
        source: "",
        description: "",
      });
    }
  }, [income, form, open]);

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

  const handleSubmit = useCallback(
    async (values: CreateIncomeSchema) => {
      setIsSubmitting(true);
      try {
        let result;
        if (isEditing && income) {
          result = await updateIncomeAction({ ...values, id: income.id });
        } else {
          result = await createIncomeAction(values);
        }

        if (result.error) {
          toast.error(isEditing ? "Income not updated" : "Income not saved", {
            description: result.error,
          });
          return;
        }

        const saved = result.data!;
        const typeLabel =
          INCOME_TYPE_LABELS[saved.income_type] ?? saved.income_type;

        toast.success(isEditing ? "Income updated" : "Income recorded", {
          description: isEditing
            ? "Your changes have been saved."
            : `${formatAmount(saved.amount_ngn)} from ${saved.source} logged.`,
        });

        form.reset({
          date: format(new Date(), "yyyy-MM-dd"),
          amount_ngn: undefined as unknown as number,
          original_amount: undefined as unknown as number,
          original_currency: currency,
          exchange_rate: 1,
          income_type: undefined as unknown as any,
          is_export_income: false,
          source: "",
          description: "",
        });
        onSuccess();
      } catch {
        toast.error(isEditing ? "Income not updated" : "Income not saved", {
          description: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [income, form, isEditing, onSuccess],
  );

  return {
    form,
    isEditing,
    isSubmitting,
    handleCurrencyChange,
    onSubmit: form.handleSubmit(
      handleSubmit as Parameters<typeof form.handleSubmit>[0],
    ),
  };
}
